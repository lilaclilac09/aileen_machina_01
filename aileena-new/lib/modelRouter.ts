/**
 * Model routing + circuit breaker + degrade (site-agent scale).
 *
 * Provider registry: DeepSeek (primary), an optional self-hosted GPU tier
 * (OpenAI-compatible, ships off — see lib/agentRuntime/gpu.ts) and an optional
 * hosted fallback via env. /api/chat gates each provider with the Redis-backed
 * per-provider breaker (lib/agentRuntime/breaker.ts). The in-isolate circuit
 * below is legacy: it still guards the side surfaces (council CLI, voice-code,
 * scratch) but /api/chat ignores it, so a voice-code failure can never 503 chat.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { matchCanned } from './agentCannedResponses';
import type { GpuConfig } from './agentRuntime/gpu';
import type { VoiceAccent } from './voiceAccent';

/** Total model budget inside Vercel maxDuration=30s */
export const MODEL_TOTAL_BUDGET_MS = 22_000;
/** Consecutive provider failures before opening the circuit */
export const CIRCUIT_FAILURE_THRESHOLD = 3;
/** How long to keep circuit open (ms) */
export const CIRCUIT_COOLDOWN_MS = 60_000;

export type ModelPick = {
  model: LanguageModel;
  provider: string;
  tier: 'primary' | 'gpu' | 'fallback';
  /** Upstream model id actually requested (e.g. deepseek-flash). */
  modelId?: string;
};

/** DeepSeek model ids. `deepseek-chat` is the legacy alias (discontinued per DeepSeek's 2026-04-24 notice). */
export const DEEPSEEK_DEFAULT_MODEL = 'deepseek-flash';
export const DEEPSEEK_LEGACY_MODEL = 'deepseek-chat';
export const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com';
/** How long a "model id does not exist" answer pins the legacy id. */
export const DEEPSEEK_MODEL_LATCH_MS = 60 * 60 * 1000;

export type ModelRouteDecision =
  | { mode: 'llm'; pick: ModelPick; reason: string }
  | { mode: 'degrade'; reason: string; message: string; status: number };

type CircuitState = {
  failures: number;
  openUntil: number;
  lastError?: string;
};

// Edge isolate memory — resets on cold start (acceptable for portfolio scale).
const circuit: CircuitState = { failures: 0, openUntil: 0 };

export function getCircuitState(): Readonly<CircuitState> {
  return { ...circuit };
}

export function recordModelSuccess(): void {
  circuit.failures = 0;
  circuit.openUntil = 0;
  circuit.lastError = undefined;
}

export function recordModelFailure(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  circuit.failures += 1;
  circuit.lastError = msg.slice(0, 200);
  if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuit.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    console.warn('[modelRouter] circuit OPEN', {
      failures: circuit.failures,
      openUntil: circuit.openUntil,
      lastError: circuit.lastError,
    });
  }
}

export function isCircuitOpen(): boolean {
  if (Date.now() >= circuit.openUntil) {
    if (circuit.openUntil > 0 && circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
      // Half-open: allow one probe by clearing open latch but keeping failure count.
      circuit.openUntil = 0;
    }
    return false;
  }
  return true;
}

/**
 * DeepSeek reports prefix-cache usage as prompt_cache_hit_tokens /
 * prompt_cache_miss_tokens on the usage chunk. Surface them as provider
 * metadata so the per-turn event can log cache hits (P2.8).
 */
export type DeepSeekCacheMeta = { promptCacheHitTokens: number; promptCacheMissTokens: number };

function readCacheUsage(body: unknown): DeepSeekCacheMeta | null {
  const usage = (body as { usage?: Record<string, unknown> } | null)?.usage;
  if (!usage || typeof usage !== 'object') return null;
  const hit = Number(usage.prompt_cache_hit_tokens);
  const miss = Number(usage.prompt_cache_miss_tokens);
  if (!Number.isFinite(hit) && !Number.isFinite(miss)) return null;
  return { promptCacheHitTokens: Number.isFinite(hit) ? hit : 0, promptCacheMissTokens: Number.isFinite(miss) ? miss : 0 };
}

export const deepSeekCacheExtractor = {
  extractMetadata: async ({ parsedBody }: { parsedBody: unknown }) => {
    const c = readCacheUsage(parsedBody);
    return c ? { deepseek: c } : undefined;
  },
  createStreamExtractor: () => {
    let last: DeepSeekCacheMeta | null = null;
    return {
      processChunk(chunk: unknown) {
        const c = readCacheUsage(chunk);
        if (c) last = c;
      },
      buildMetadata() {
        return last ? { deepseek: last } : undefined;
      },
    };
  },
};

/** Sum prefix-cache tokens (DeepSeek or GPU) over all steps of one turn. */
export function cacheTokensFromSteps(
  steps: Array<{ providerMetadata?: Record<string, Record<string, unknown>> | undefined }> | undefined,
): DeepSeekCacheMeta | null {
  let hit = 0;
  let miss = 0;
  let seen = false;
  for (const st of steps ?? []) {
    const d = st.providerMetadata?.deepseek ?? st.providerMetadata?.gpu;
    if (!d) continue;
    seen = true;
    hit += Number(d.promptCacheHitTokens) || 0;
    miss += Number(d.promptCacheMissTokens) || 0;
  }
  return seen ? { promptCacheHitTokens: hit, promptCacheMissTokens: miss } : null;
}

// In-isolate latch: when DeepSeek answers "model does not exist" for the
// configured id, use the legacy id for an hour instead of failing every turn.
let deepSeekLegacyUntil = 0;

export function noteDeepSeekModelMissing(now = Date.now()): void {
  deepSeekLegacyUntil = now + DEEPSEEK_MODEL_LATCH_MS;
  console.warn('[modelRouter] deepseek model id missing — using legacy id for 1h', { legacy: DEEPSEEK_LEGACY_MODEL });
}

export function resetDeepSeekModelLatchForTests(): void {
  deepSeekLegacyUntil = 0;
}

/** Model id for the next DeepSeek call: DEEPSEEK_MODEL (default deepseek-flash), or the legacy id while latched. */
export function deepSeekModelId(now = Date.now()): string {
  if (now < deepSeekLegacyUntil) return DEEPSEEK_LEGACY_MODEL;
  return (process.env.DEEPSEEK_MODEL ?? '').trim() || DEEPSEEK_DEFAULT_MODEL;
}

/**
 * DeepSeek V4+ defaults to thinking mode. The site agent answers in 2-3
 * sentences under a 200-token cap, so thinking is switched off explicitly:
 * `{"thinking":{"type":"disabled"}}` (https://api-docs.deepseek.com/guides/thinking_mode).
 * The legacy alias was already non-thinking and never gets the field.
 */
export function deepSeekRequestBody(modelId: string, args: Record<string, unknown>): Record<string, unknown> {
  if (modelId === DEEPSEEK_LEGACY_MODEL) return args;
  return { ...args, thinking: { type: 'disabled' } };
}

/**
 * Primary (public-door) model config, read from the existing env names with
 * today's values as defaults: DEEPSEEK_BASE_URL (https://api.deepseek.com) and
 * DEEPSEEK_MODEL (deepseek-flash). Point both at any OpenAI-compatible host
 * (DeepInfra, Together, Fireworks, self-hosted vLLM) to swap where Machina runs.
 * The adapter stays OpenAI-compatible and the internal provider id stays
 * 'deepseek': breaker, spend, session lock and the frozen identity line key on it.
 */
export function primaryModelConfig(now = Date.now()): { provider: 'deepseek'; baseURL: string; modelId: string } {
  return {
    provider: 'deepseek',
    baseURL: (process.env.DEEPSEEK_BASE_URL ?? '').trim() || DEEPSEEK_DEFAULT_BASE_URL,
    modelId: deepSeekModelId(now),
  };
}

/**
 * Public-door sampling, pinned in one place so the same question gets the
 * same answer as far as the provider allows. maxOutputTokens is today's
 * public cap (200). Council turns keep their own settings in /api/chat.
 * - temperature 0: greedy. DeepSeek honors it in non-thinking mode (thinking is off here).
 * - topP 1: DeepSeek fixes top_p at 1.0 in non-thinking mode, so this only makes it explicit.
 * - seed: DeepSeek's API documents no seed, so it is stripped for api.deepseek.com
 *   (see providerAcceptsSeed); vLLM, DeepInfra, Together and Fireworks accept it.
 */
export const PUBLIC_DOOR_SAMPLING = Object.freeze({
  temperature: 0,
  topP: 1,
  maxOutputTokens: 200,
  seed: 42,
});

/** False only for DeepSeek's own API, which does not document a seed parameter. */
export function providerAcceptsSeed(baseURL: string): boolean {
  try {
    return new URL(baseURL).hostname !== new URL(DEEPSEEK_DEFAULT_BASE_URL).hostname;
  } catch {
    return false;
  }
}

/** Primary request body: thinking off for V4+ ids; seed dropped where the host has none. */
export function primaryRequestBody(cfg: { baseURL: string; modelId: string }, args: Record<string, unknown>): Record<string, unknown> {
  const body = deepSeekRequestBody(cfg.modelId, args);
  if (!('seed' in body) || providerAcceptsSeed(cfg.baseURL)) return body;
  const rest = { ...body };
  delete rest.seed;
  return rest;
}

function buildDeepSeek(apiKey: string, name: string): ModelPick | null {
  try {
    const cfg = primaryModelConfig();
    const modelId = cfg.modelId;
    const ds = createOpenAICompatible({
      name,
      baseURL: cfg.baseURL,
      apiKey,
      includeUsage: true,
      metadataExtractor: deepSeekCacheExtractor,
      transformRequestBody: (args) => primaryRequestBody(cfg, args),
    });
    return {
      model: ds.chatModel(modelId),
      provider: cfg.provider,
      tier: 'primary',
      modelId,
    };
  } catch (err) {
    console.error('[modelRouter] deepseek init failed', err);
    return null;
  }
}

/** Primary pick on its own (used by the GPU failover path). */
export function buildPrimary(): ModelPick | null {
  const key = process.env.DEEPSEEK_API_KEY || process.env.AGENT_API_KEY;
  return key ? buildDeepSeek(key, 'aileena-deepseek') : null;
}

/**
 * vLLM reports prefix-cache reuse as usage.prompt_tokens_details.cached_tokens
 * (server flag --enable-prompt-tokens-details). Surfaced under `gpu` so the
 * per-turn event logs GPU cache hits next to DeepSeek's.
 */
function readOpenAiCachedUsage(body: unknown): DeepSeekCacheMeta | null {
  const usage = (body as { usage?: { prompt_tokens?: unknown; prompt_tokens_details?: { cached_tokens?: unknown } } } | null)?.usage;
  if (!usage || typeof usage !== 'object') return null;
  const prompt = Number(usage.prompt_tokens);
  const cached = Number(usage.prompt_tokens_details?.cached_tokens);
  if (!Number.isFinite(prompt)) return null;
  const hit = Number.isFinite(cached) ? cached : 0;
  return { promptCacheHitTokens: hit, promptCacheMissTokens: Math.max(0, prompt - hit) };
}

export const gpuCacheExtractor = {
  extractMetadata: async ({ parsedBody }: { parsedBody: unknown }) => {
    const c = readOpenAiCachedUsage(parsedBody);
    return c ? { gpu: c } : undefined;
  },
  createStreamExtractor: () => {
    let last: DeepSeekCacheMeta | null = null;
    return {
      processChunk(chunk: unknown) {
        const c = readOpenAiCachedUsage(chunk);
        if (c) last = c;
      },
      buildMetadata() {
        return last ? { gpu: last } : undefined;
      },
    };
  },
};

/** Request body for the GPU tier: Qwen3-style templates take enable_thinking. */
export function gpuRequestBody(disableThinking: boolean, args: Record<string, unknown>): Record<string, unknown> {
  if (!disableThinking) return args;
  return { ...args, chat_template_kwargs: { enable_thinking: false } };
}

export function buildGpu(cfg: GpuConfig | null): ModelPick | null {
  if (!cfg) return null;
  try {
    const client = createOpenAICompatible({
      name: 'aileena-gpu',
      baseURL: cfg.baseURL,
      apiKey: cfg.apiKey,
      includeUsage: true,
      metadataExtractor: gpuCacheExtractor,
      transformRequestBody: (args) => gpuRequestBody(cfg.disableThinking, args),
    });
    return { model: client.chatModel(cfg.model), provider: cfg.providerId, tier: 'gpu', modelId: cfg.model };
  } catch (err) {
    console.error('[modelRouter] gpu init failed', err);
    return null;
  }
}

export function buildFallback(): ModelPick | null {
  const baseURL = process.env.AGENT_FALLBACK_BASE_URL;
  const apiKey = process.env.AGENT_FALLBACK_API_KEY || process.env.AGENT_API_KEY;
  const modelId = process.env.AGENT_FALLBACK_MODEL || 'gpt-4o-mini';
  if (!baseURL || !apiKey) return null;
  try {
    const client = createOpenAICompatible({
      name: 'aileena-fallback',
      baseURL,
      apiKey,
    });
    return {
      model: client.chatModel(modelId),
      provider: `fallback:${modelId}`,
      tier: 'fallback',
    };
  } catch (err) {
    console.error('[modelRouter] fallback init failed', err);
    return null;
  }
}

export function degradeMessage(reason: string, lastQuestion?: string): string {
  const canned = lastQuestion ? matchCanned(lastQuestion) : null;
  if (canned) return canned.reply;

  if (reason === 'circuit_open') {
    return "I'm taking a short pause while things settle. Try again in a minute — or leave a note below if it's urgent.";
  }
  if (reason === 'timeout') {
    return 'That took longer than it should have. Try a shorter question, or ask again in a moment.';
  }
  if (reason === 'no_model') {
    return "I'm quiet on the model side right now. Try again in a moment, or leave a note below.";
  }
  if (reason === 'billing') {
    return "I'm pausing for a moment on the model side. Leave a note below if you'd like Aileen to see it, or try again shortly.";
  }
  return 'Something went quiet on my side — mind trying that again?';
}

/**
 * Choose LLM or degrade. Primary = DeepSeek. The GPU tier is chosen later by
 * lib/agentRuntime/router.ts (state-based), never here.
 * Shanghai orb keeps DeepSeek when the key exists — that is the Chinese-native path.
 * DeepSeek Harness (dsh) is a separate local coding agent; not this router.
 *
 * DEEPSEEK_API_KEY is set on Vercel (preview + production). A missing key in a
 * local isolate is env, not a product gap — do not mock a public write door for it.
 */
export function routeModel(opts: {
  toolRoute: string;
  lastQuestion: string;
  preferFallback?: boolean;
  voiceAccent?: VoiceAccent | null;
  /** /api/chat gates providers with the Redis per-provider breaker instead. */
  ignoreLegacyCircuit?: boolean;
}): ModelRouteDecision {
  if (!opts.ignoreLegacyCircuit && isCircuitOpen()) {
    return {
      mode: 'degrade',
      reason: 'circuit_open',
      message: degradeMessage('circuit_open', opts.lastQuestion),
      status: 503,
    };
  }

  const primary = buildPrimary();
  const fallback = buildFallback();

  // Shanghai voice: stay on DeepSeek even if something asked for fallback.
  if (opts.voiceAccent === 'shanghai' && primary) {
    return { mode: 'llm', pick: primary, reason: `shanghai_voice:${opts.toolRoute}` };
  }

  // Simple / hire can still use LLM; routing today is mostly circuit + optional fallback.
  if (opts.preferFallback && fallback) {
    return { mode: 'llm', pick: fallback, reason: 'prefer_fallback' };
  }
  if (primary) {
    return { mode: 'llm', pick: primary, reason: `primary:${opts.toolRoute}` };
  }
  if (fallback) {
    return { mode: 'llm', pick: fallback, reason: 'fallback_only' };
  }

  return {
    mode: 'degrade',
    reason: 'no_model',
    message: degradeMessage('no_model', opts.lastQuestion),
    status: 500,
  };
}

export function createModelAbortSignal(budgetMs: number = MODEL_TOTAL_BUDGET_MS): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(budgetMs);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(new Error('model_budget_exceeded')), budgetMs);
  return c.signal;
}

/** Classify provider errors for degrade copy + circuit. */
export function classifyModelError(err: unknown): {
  reason: 'billing' | 'timeout' | 'provider';
  retryable: boolean;
} {
  const msg = err instanceof Error ? err.message : String(err);
  if (/credit balance|too low|insufficient|quota|billing|purchase credits|payment/i.test(msg)) {
    return { reason: 'billing', retryable: false };
  }
  if (/timeout|aborted|AbortError|model_budget|deadline/i.test(msg)) {
    return { reason: 'timeout', retryable: true };
  }
  return { reason: 'provider', retryable: true };
}

/** DeepSeek's answer when a model id is unknown/retired. Pins the legacy id (see deepSeekModelId). */
export function isModelMissingError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${(err as { responseBody?: unknown }).responseBody ?? ''}` : String(err);
  return /model not exist|model_not_found|model .{0,40}does not exist|unknown model|invalid model|no such model/i.test(msg);
}
