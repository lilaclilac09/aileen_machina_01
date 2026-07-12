/**
 * Model routing + circuit breaker + degrade (site-agent scale).
 *
 * Not a multi-tenant model mesh — one primary (DeepSeek), optional fallback
 * via env, in-isolate circuit breaker, fixed degrade copy when open/timeout.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { matchCanned } from './agentCannedResponses';

/** Total model budget inside Vercel maxDuration=30s */
export const MODEL_TOTAL_BUDGET_MS = 22_000;
/** Consecutive provider failures before opening the circuit */
export const CIRCUIT_FAILURE_THRESHOLD = 3;
/** How long to keep circuit open (ms) */
export const CIRCUIT_COOLDOWN_MS = 60_000;

export type ModelPick = {
  model: LanguageModel;
  provider: string;
  tier: 'primary' | 'fallback';
};

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

function buildDeepSeek(apiKey: string, name: string): ModelPick | null {
  try {
    const ds = createOpenAICompatible({
      name,
      baseURL: 'https://api.deepseek.com',
      apiKey,
    });
    return {
      model: ds.chatModel('deepseek-chat'),
      provider: 'deepseek',
      tier: 'primary',
    };
  } catch (err) {
    console.error('[modelRouter] deepseek init failed', err);
    return null;
  }
}

function buildFallback(): ModelPick | null {
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
    return "Aileen's agent is taking a short break (provider unstable). Try again in a minute — or use the contact form if it's urgent.";
  }
  if (reason === 'timeout') {
    return "That took too long on the model side. Try a shorter question, or ask again in a moment.";
  }
  if (reason === 'no_model') {
    return 'No model configured. Set DEEPSEEK_API_KEY in Vercel, then redeploy.';
  }
  if (reason === 'billing') {
    return "This agent isn't free to run — public access is off for now. Reach out through the contact form instead.";
  }
  return 'The agent hit a snag. Try again in a moment.';
}

/**
 * Choose LLM or degrade. Task type can prefer fallback later; today primary=DeepSeek.
 */
export function routeModel(opts: {
  toolRoute: string;
  lastQuestion: string;
  preferFallback?: boolean;
}): ModelRouteDecision {
  if (isCircuitOpen()) {
    return {
      mode: 'degrade',
      reason: 'circuit_open',
      message: degradeMessage('circuit_open', opts.lastQuestion),
      status: 503,
    };
  }

  const primaryKey = process.env.DEEPSEEK_API_KEY || process.env.AGENT_API_KEY;
  const primary = primaryKey ? buildDeepSeek(primaryKey, 'aileena-deepseek') : null;
  const fallback = buildFallback();

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
