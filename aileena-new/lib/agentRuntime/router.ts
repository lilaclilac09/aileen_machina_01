/**
 * State-based provider choice for /api/chat (DeepSeek ↔ self-hosted GPU ↔ fallback).
 *
 * First match wins (see infra/gpu/README.md for the diagram):
 *   1. GPU off / not configured → today's behavior exactly (primary, then fallback).
 *   2. Sticky root: a session locked to a provider keeps it while that provider is usable.
 *   3. Context guard: prompts too long for the GPU never go there (DeepSeek has 1M).
 *   4. Owner override: owner `modelTier: 'gpu'` → GPU when WARM, else wake + DeepSeek.
 *   5. Primary blocked (breaker open / probe in flight) → GPU when WARM (public mode +
 *      AGENT_GPU_FAILOVER), else fallback, else 503.
 *   6. Spillover (in-flight or slow first tokens), daily budget, canary → GPU when WARM.
 *   7. Default → DeepSeek.
 * Any rule that wants a GPU that is not WARM sends a non-blocking wake and the
 * visitor is answered by DeepSeek. Visitors never wait on a cold GPU.
 */
import { breakerGate } from './breaker';
import {
  probeGpu,
  readGpuState,
  checkGpuHealth,
  markGpuWarm,
  wakeGpu,
  type GpuConfig,
  type GpuLifecycle,
  type FetchLike,
} from './gpu';
import { inflight, readSpendMicroUsd, slowTurns, SLOW_TURNS_TO_SPILL } from './load';
import type { ModelPick } from '../modelRouter';

export type RouterRule =
  | 'default'
  | 'sticky'
  | 'owner_gpu'
  | 'owner_wake'
  | 'primary_blocked'
  | 'spill_inflight'
  | 'spill_slow'
  | 'budget'
  | 'canary'
  | 'context_guard'
  | 'fallback';

export type RouterInput = {
  primary: ModelPick;
  gpu: ModelPick | null;
  fallback: ModelPick | null;
  cfg: GpuConfig | null;
  sessionProvider?: string;
  isOwner: boolean;
  /** Owner-only request; ignored for visitors and agent callers. */
  requestedTier?: 'gpu' | 'deepseek';
  estTokens: number;
  toolRoute: string;
  /** Stable per root (sessionId) so canary picks do not flip mid-thread. */
  rootKey: string;
  shanghaiVoice: boolean;
  now?: number;
  fetchImpl?: FetchLike;
};

export type RouterDecision =
  | { ok: true; pick: ModelPick; probe: boolean; rule: RouterRule; gpuState: GpuLifecycle | 'off'; wakeSent: boolean; blocked?: string }
  | { ok: false; rule: 'circuit_open'; gpuState: GpuLifecycle | 'off'; wakeSent: boolean; blocked: string };

/** Rough prompt-token estimate: characters / 3.5. Good enough for a context guard. */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 3.5);
}

/** Deterministic 0..99 bucket from a string (FNV-1a). */
export function canaryBucket(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

/** Output budget + tool-call headroom kept free inside the GPU context window. */
export const GPU_CONTEXT_HEADROOM = 2_048;

export async function chooseProvider(input: RouterInput): Promise<RouterDecision> {
  const now = input.now ?? Date.now();
  const { primary, gpu, fallback, cfg } = input;
  const gpuOn = Boolean(cfg && gpu);
  let gpuState: GpuLifecycle | 'off' = 'off';
  let wakeSent = false;

  if (gpuOn && cfg) {
    gpuState = (await readGpuState(now)).state;
    // Background refresh of WARMING / aging WARM labels. Never awaited.
    void probeGpu(cfg, { now, fetchImpl: input.fetchImpl }).catch(() => {});
  }
  const gpuWarm = () => gpuState === 'WARM';
  const wake = async () => {
    if (!cfg || gpuState === 'WARM' || gpuState === 'DRAINING') return;
    const w = await wakeGpu(cfg, { now, fetchImpl: input.fetchImpl });
    if (w.sent) {
      wakeSent = true;
      if (gpuState === 'COLD') gpuState = 'WARMING';
      void w.done;
    }
  };

  // One gate per provider per request: a half-open gate takes the single probe
  // lease, so asking twice would block ourselves.
  const gates = new Map<string, Awaited<ReturnType<typeof breakerGate>>>();
  const gateOf = async (provider: string) => {
    let g = gates.get(provider);
    if (!g) {
      g = await breakerGate(provider, now);
      gates.set(provider, g);
    }
    return g;
  };
  const tryPick = async (pick: ModelPick | null, rule: RouterRule): Promise<RouterDecision | null> => {
    if (!pick) return null;
    const gate = await gateOf(pick.provider);
    if (!gate.allowed) return null;
    return { ok: true, pick, probe: gate.probe, rule, gpuState, wakeSent };
  };
  const tryGpu = async (rule: RouterRule): Promise<RouterDecision | null> => {
    if (!gpuOn || !gpu) return null;
    if (!gpuWarm()) {
      await wake();
      return null;
    }
    return tryPick(gpu, rule);
  };

  // Primary first, then fallback — exactly today's chain (GPU slots in between
  // only when configured and allowed).
  const primaryOrFallback = async (rule: RouterRule): Promise<RouterDecision> => {
    const p = await tryPick(primary, rule);
    if (p) return p;
    const pg = await gateOf(primary.provider);
    const blocked = pg.allowed ? 'unknown' : pg.reason;
    const allowGpuFailover = gpuOn && cfg && (cfg.mode === 'public' ? cfg.failover : input.isOwner);
    if (allowGpuFailover) {
      const g = await tryGpu('primary_blocked');
      if (g) return { ...g, blocked };
    }
    const f = await tryPick(fallback, 'fallback');
    if (f) return { ...f, blocked };
    return { ok: false, rule: 'circuit_open', gpuState, wakeSent, blocked };
  };

  // 1. GPU off → unchanged behavior.
  if (!gpuOn || !cfg || !gpu) return primaryOrFallback('default');

  // 2. Sticky root.
  const lock = input.sessionProvider;
  if (lock && lock === gpu.provider) {
    if (gpuState === 'DRAINING') return primaryOrFallback('default');
    if (!gpuWarm()) {
      // Label expired but the replica may still be up (scale-down window): one
      // fast health check. Modal answers 503 at once when there is no replica.
      if (await checkGpuHealth(cfg, input.fetchImpl)) {
        await markGpuWarm(now);
        gpuState = 'WARM';
      }
    }
    const g = gpuWarm() ? await tryPick(gpu, 'sticky') : null;
    if (g) return g;
    return primaryOrFallback('default');
  }
  if (lock) return primaryOrFallback(lock === primary.provider ? 'sticky' : 'default');

  // 3. Context guard: new roots only (a locked GPU root was sized when it started).
  const ctxOk = input.estTokens + GPU_CONTEXT_HEADROOM <= cfg.maxContext;
  if (!ctxOk) {
    return primaryOrFallback('context_guard');
  }

  // 4. Owner override.
  if (input.isOwner && input.requestedTier === 'gpu') {
    const g = await tryGpu('owner_gpu');
    if (g) return g;
    return primaryOrFallback('owner_wake');
  }

  // 5. Primary blocked → handled inside primaryOrFallback (GPU before fallback).
  // A half-open primary holds the one probe lease for THIS request: use it.
  const pg = await gateOf(primary.provider);
  if (!pg.allowed || pg.probe) return primaryOrFallback('default');

  // 6. Visitor rules (public mode only).
  if (cfg.mode === 'public' && !input.shanghaiVoice) {
    const routeOk = cfg.routes.length === 0 || cfg.routes.includes(input.toolRoute);
    if (routeOk) {
      if (cfg.spillInflight > 0 && (await inflight(primary.provider, now)) >= cfg.spillInflight) {
        const g = await tryGpu('spill_inflight');
        if (g) return g;
      } else if (cfg.spillTtftMs > 0 && (await slowTurns(primary.provider, now)) >= SLOW_TURNS_TO_SPILL) {
        const g = await tryGpu('spill_slow');
        if (g) return g;
      } else if (
        cfg.dailyBudgetUsd > 0 &&
        (await readSpendMicroUsd(primary.provider, now)) >= cfg.dailyBudgetUsd * 1_000_000
      ) {
        const g = await tryGpu('budget');
        if (g) return g;
      } else if (cfg.canaryPct > 0 && canaryBucket(input.rootKey) < cfg.canaryPct) {
        const g = await tryGpu('canary');
        if (g) return g;
      }
    }
  }

  // 7. Default.
  return primaryOrFallback('default');
}

/**
 * Wait for the first model event of a streamText result (pre-first-token
 * failover). Reads a tee of fullStream, so the response stream still gets
 * every part from the start.
 */
export async function peekFirstToken(
  fullStream: AsyncIterable<{ type: string; error?: unknown }> & ReadableStream<{ type: string; error?: unknown }>,
  timeoutMs: number,
): Promise<{ ok: true; kind: 'token' | 'finish' | 'abort' } | { ok: false; reason: 'timeout' | 'error'; error?: unknown }> {
  const reader = fullStream.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ ok: false; reason: 'timeout' }>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, reason: 'timeout' }), timeoutMs);
  });
  const read = (async () => {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return { ok: true as const, kind: 'finish' as const };
      const t = value.type;
      if (t === 'error') return { ok: false as const, reason: 'error' as const, error: value.error };
      if (t === 'abort') return { ok: true as const, kind: 'abort' as const };
      if (t === 'finish') return { ok: true as const, kind: 'finish' as const };
      if (
        t === 'text-start' ||
        t === 'text-delta' ||
        t === 'reasoning-start' ||
        t === 'reasoning-delta' ||
        t === 'tool-input-start' ||
        t === 'tool-call'
      ) {
        return { ok: true as const, kind: 'token' as const };
      }
    }
  })();
  try {
    return await Promise.race([read, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
    reader.cancel().catch(() => {});
  }
}
