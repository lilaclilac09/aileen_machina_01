/**
 * GPU inference tier: config + lifecycle state (COLD → WARMING → WARM → DRAINING).
 *
 * Ships OFF. Nothing here runs unless AGENT_GPU_MODE is `owner` or `public` AND
 * AGENT_GPU_BASE_URL + AGENT_GPU_API_KEY are set. The endpoint is any
 * OpenAI-compatible server (infra/gpu/ deploys vLLM on Modal).
 *
 * State lives in the runtime KV seam (Upstash when configured, per-instance
 * memory otherwise). The router never waits on a cold GPU: a wake is a
 * fire-and-forget GET /health (on Modal that starts a container), and the turn
 * is answered by DeepSeek meanwhile.
 */
import { runtimeKv } from './kv';
import { recordPerfEvent } from './perf';

export type GpuMode = 'off' | 'owner' | 'public';
export type GpuLifecycle = 'COLD' | 'WARMING' | 'WARM' | 'DRAINING';

export type GpuConfig = {
  mode: GpuMode;
  baseURL: string;
  apiKey: string;
  model: string;
  providerId: string;
  maxContext: number;
  ttftMs: number;
  healthUrl: string;
  startupTimeoutS: number;
  /** Ask the chat template to skip thinking (Qwen3 `enable_thinking: false`). */
  disableThinking: boolean;
  // Phase 1b visitor rules (only when mode === 'public'); 0 / false = off.
  failover: boolean;
  spillInflight: number;
  spillTtftMs: number;
  dailyBudgetUsd: number;
  canaryPct: number;
  /** Optional allow-list of tool routes for spill / budget / canary (empty = all). */
  routes: string[];
};

/** How long a successful health probe or GPU turn keeps the WARM label. */
export const GPU_WARM_TTL_SEC = 45;
/** Refresh a WARM label in the background once it is this old. */
export const GPU_REFRESH_AFTER_MS = 30_000;
export const GPU_WAKE_LEASE_SEC = 20;
export const GPU_PROBE_LEASE_SEC = 10;
export const GPU_HEALTH_TIMEOUT_MS = 2_500;
export const GPU_DRAIN_TTL_SEC = 15 * 60;

const STATE_KEY = 'gpu:v1:state';
const WAKE_KEY = 'gpu:v1:wake';
const PROBE_KEY = 'gpu:v1:probe';

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

function num(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function flag(name: string): boolean {
  return /^(1|true|on|yes)$/i.test(env(name));
}

export function parseGpuMode(raw: string | undefined): GpuMode {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'owner' || v === 'public') return v;
  return 'off';
}

/** Provider ids must not contain "qwen": the root identity would read it as on-device. */
export function sanitizeGpuProviderId(raw: string): string {
  const base = (raw || 'gpu:open-8b').trim().toLowerCase().replace(/[^a-z0-9:._-]/g, '').slice(0, 48);
  const id = base.startsWith('gpu:') ? base : `gpu:${base || 'open-8b'}`;
  return id.replace(/qwen/g, 'open');
}

export function readGpuConfig(): GpuConfig | null {
  const mode = parseGpuMode(env('AGENT_GPU_MODE'));
  const baseURL = env('AGENT_GPU_BASE_URL').replace(/\/+$/, '');
  const apiKey = env('AGENT_GPU_API_KEY');
  if (mode === 'off' || !baseURL || !apiKey) return null;
  const healthUrl = env('AGENT_GPU_HEALTH_URL') || `${baseURL.replace(/\/v1$/, '')}/health`;
  return {
    mode,
    baseURL,
    apiKey,
    model: env('AGENT_GPU_MODEL') || 'open-8b',
    providerId: sanitizeGpuProviderId(env('AGENT_GPU_PROVIDER_ID') || 'gpu:open-8b'),
    maxContext: num('AGENT_GPU_MAX_CONTEXT', 32_768),
    ttftMs: num('AGENT_GPU_TTFT_MS', 8_000),
    healthUrl,
    startupTimeoutS: num('AGENT_GPU_STARTUP_TIMEOUT_S', 600),
    disableThinking: env('AGENT_GPU_THINKING') ? !flag('AGENT_GPU_THINKING') : true,
    failover: flag('AGENT_GPU_FAILOVER'),
    spillInflight: num('AGENT_GPU_SPILL_INFLIGHT', 0),
    spillTtftMs: num('AGENT_GPU_SPILL_TTFT_MS', 0),
    dailyBudgetUsd: num('AGENT_GPU_DEEPSEEK_DAILY_BUDGET_USD', 0),
    canaryPct: Math.min(100, num('AGENT_GPU_CANARY_PCT', 0)),
    routes: env('AGENT_GPU_ROUTES')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export type GpuStateRecord = { state: GpuLifecycle; at: number; wakeAt?: number };

function parseState(raw: unknown): GpuStateRecord | null {
  try {
    const s = typeof raw === 'string' ? (JSON.parse(raw) as GpuStateRecord) : (raw as GpuStateRecord | null);
    if (s && (s.state === 'WARMING' || s.state === 'WARM' || s.state === 'DRAINING' || s.state === 'COLD')) return s;
  } catch {
    /* fall through */
  }
  return null;
}

export async function readGpuState(now = Date.now()): Promise<GpuStateRecord> {
  const s = parseState(await runtimeKv().get(STATE_KEY));
  return s ?? { state: 'COLD', at: now };
}

async function writeState(rec: GpuStateRecord, ttlSec: number): Promise<void> {
  await runtimeKv().set(STATE_KEY, JSON.stringify(rec), { ex: ttlSec });
}

export async function markGpuWarm(now = Date.now()): Promise<void> {
  const cur = await readGpuState(now);
  if (cur.state === 'DRAINING') return;
  await writeState({ state: 'WARM', at: now }, GPU_WARM_TTL_SEC);
  if (cur.state !== 'WARM') {
    // WARMING → WARM after a wake: `ms` is the observed cold start.
    void recordPerfEvent({ kind: 'gpu', from: cur.state, to: 'WARM', ...(cur.wakeAt ? { ms: now - cur.wakeAt } : {}) });
  }
}

export async function markGpuCold(now = Date.now()): Promise<void> {
  const cur = await readGpuState(now);
  if (cur.state === 'DRAINING') return;
  await runtimeKv().del(STATE_KEY);
  if (cur.state !== 'COLD') void recordPerfEvent({ kind: 'gpu', from: cur.state, to: 'COLD' });
}

export async function drainGpu(now = Date.now()): Promise<void> {
  const cur = await readGpuState(now);
  await writeState({ state: 'DRAINING', at: now }, GPU_DRAIN_TTL_SEC);
  void recordPerfEvent({ kind: 'gpu', from: cur.state, to: 'DRAINING' });
}

export async function undrainGpu(): Promise<void> {
  await runtimeKv().del(STATE_KEY);
  void recordPerfEvent({ kind: 'gpu', from: 'DRAINING', to: 'COLD' });
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** One GET /health with a hard timeout. 200 → true. Never throws. */
export async function checkGpuHealth(cfg: GpuConfig, fetchImpl: FetchLike = fetch): Promise<boolean> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), GPU_HEALTH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(cfg.healthUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: ctl.signal,
      cache: 'no-store',
    });
    return res.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Non-blocking wake. Deduplicated with a short NX lease so 20 cold requests
 * send one wake. Returns whether THIS call sent it. Callers must not await the
 * returned `done` on the visitor path.
 */
export async function wakeGpu(
  cfg: GpuConfig,
  opts: { now?: number; fetchImpl?: FetchLike } = {},
): Promise<{ sent: boolean; done: Promise<void> }> {
  const now = opts.now ?? Date.now();
  const cur = await readGpuState(now);
  if (cur.state === 'WARM' || cur.state === 'DRAINING') return { sent: false, done: Promise.resolve() };
  const got = await runtimeKv().set(WAKE_KEY, String(now), { nx: true, ex: GPU_WAKE_LEASE_SEC });
  if (!got) return { sent: false, done: Promise.resolve() };
  if (cur.state !== 'WARMING') {
    await writeState({ state: 'WARMING', at: now, wakeAt: now }, Math.max(60, cfg.startupTimeoutS));
  }
  void recordPerfEvent({ kind: 'wake', from: cur.state, to: 'WARMING' });
  const done = checkGpuHealth(cfg, opts.fetchImpl)
    .then(async (ok) => {
      if (ok) await markGpuWarm();
    })
    .catch(() => {});
  return { sent: true, done };
}

/**
 * Background health refresh: WARMING → WARM on 200; WARMING past the startup
 * timeout → COLD; an aging WARM label is re-checked so it does not flap.
 * One probe at a time across instances.
 */
export async function probeGpu(
  cfg: GpuConfig,
  opts: { now?: number; fetchImpl?: FetchLike; force?: boolean } = {},
): Promise<{ probed: boolean; state: GpuLifecycle }> {
  const now = opts.now ?? Date.now();
  const cur = await readGpuState(now);
  if (cur.state === 'DRAINING') return { probed: false, state: cur.state };
  const due =
    opts.force ||
    cur.state === 'WARMING' ||
    (cur.state === 'WARM' && now - cur.at >= GPU_REFRESH_AFTER_MS);
  if (!due) return { probed: false, state: cur.state };
  const got = await runtimeKv().set(PROBE_KEY, String(now), { nx: true, ex: GPU_PROBE_LEASE_SEC });
  if (!got) return { probed: false, state: cur.state };
  const ok = await checkGpuHealth(cfg, opts.fetchImpl);
  if (ok) {
    await markGpuWarm(now);
    return { probed: true, state: 'WARM' };
  }
  if (cur.state === 'WARMING' && now - (cur.wakeAt ?? cur.at) > cfg.startupTimeoutS * 1000) {
    await markGpuCold(now);
    return { probed: true, state: 'COLD' };
  }
  if (cur.state === 'WARM') {
    await markGpuCold(now);
    return { probed: true, state: 'COLD' };
  }
  return { probed: true, state: cur.state };
}

/**
 * GPU optimisation tag for the performance dashboard ("Compare" view).
 * AGENT_GPU_VARIANT wins; otherwise read once per 10 min from the server's
 * /v1/models: infra/gpu/vllm_server.py serves an extra alias
 * `<name>.<variant>` (e.g. open-8b.fp8-ngram); else guess from the HF root.
 */
const VARIANT_TTL_MS = 10 * 60_000;
export async function readGpuVariant(cfg: GpuConfig, fetchImpl: FetchLike = fetch): Promise<string | undefined> {
  const pinned = (process.env.AGENT_GPU_VARIANT || '').trim();
  if (pinned) return pinned.slice(0, 40);
  const g = globalThis as { __aileenaGpuVariant?: { at: number; v?: string } };
  if (g.__aileenaGpuVariant && Date.now() - g.__aileenaGpuVariant.at < VARIANT_TTL_MS) return g.__aileenaGpuVariant.v;
  let v: string | undefined;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), GPU_HEALTH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${cfg.baseURL.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: ctl.signal,
      cache: 'no-store',
    });
    if (res.ok) {
      const body = (await res.json()) as { data?: Array<{ id?: string; root?: string }> };
      const ids = (body.data ?? []).map((m) => String(m.id ?? ''));
      const alias = ids.find((id) => id.startsWith(`${cfg.model}.`));
      const root = String(body.data?.[0]?.root ?? '').toLowerCase();
      v = alias ? alias.slice(cfg.model.length + 1) : /awq/.test(root) ? 'awq' : /fp8/.test(root) ? 'fp8' : ids.length ? 'base' : undefined;
    }
  } catch {
    /* unknown */
  } finally {
    clearTimeout(t);
  }
  g.__aileenaGpuVariant = { at: Date.now(), v };
  return v;
}
