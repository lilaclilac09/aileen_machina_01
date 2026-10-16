/**
 * Per-turn inference performance log for the owner dashboard
 * (/agent-analytics/performance).
 *
 * Stored through runtimeKv: Upstash Redis when configured, otherwise a
 * per-instance in-memory ring buffer (resets on deploy; the page says so).
 * - perf:v1:turns   capped list (newest first) of PerfTurn
 * - perf:v1:events  capped list of breaker / GPU lifecycle / wake events
 * - perf:v1:day:<utc day>  integer counters for per-day totals
 *
 * Never stored: message text, IPs, visitor ids, cookies, session ids.
 * Writes are fire-and-forget (two pipelined round trips per turn on Redis).
 */
import { runtimeKv } from './kv';

export const PERF_TURNS_KEY = 'perf:v1:turns';
export const PERF_EVENTS_KEY = 'perf:v1:events';
export const PERF_TURNS_CAP = 1000;
export const PERF_EVENTS_CAP = 300;
const LIST_TTL_SEC = 60 * 60 * 24 * 30;
const DAY_TTL_SEC = 60 * 60 * 24 * 90;

export type PerfOutcome = 'ok' | 'empty' | 'error' | 'drop' | 'cancelled' | 'degrade';

export type PerfTurn = {
  v: 1;
  /** Short random id (not linked to any visitor or session). */
  id: string;
  at: number;
  /** 'bench' = an owner bench run (`pnpm bench:inference`). */
  src: 'site' | 'bench';
  run?: string;
  provider: string;
  tier: string;
  model?: string;
  /** GPU optimisation tag (e.g. base, fp8, awq-ngram) when known. */
  variant?: string;
  rule: string;
  toolRoute?: string;
  failoverFrom?: string | null;
  /** Request received → first model chunk (what the visitor waits for). */
  ttftMs: number | null;
  /** Request received → model call started (quota, prompt build, routing). */
  prepMs: number;
  /** Request received → turn finished. */
  latencyMs: number;
  /** Model call started → finished (GPU time share for cost). */
  modelMs: number;
  inTok: number;
  outTok: number;
  cacheHit: number | null;
  cacheMiss: number | null;
  costUsd: number | null;
  steps: number;
  tools: number;
  finish: string;
  outcome: PerfOutcome;
  /** Attempts thrown away before this one (empty-answer retries + GPU failovers). */
  retries: number;
  gpuState?: string;
};

export type PerfEvent = {
  at: number;
  kind: 'breaker' | 'gpu' | 'wake';
  provider?: string;
  from?: string;
  to: string;
  /** e.g. wake → WARM time (cold start) in ms. */
  ms?: number;
};

export function perfDay(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}

const SAFE = /[^\w.:\-/+@]/g;
export function perfLabel(v: unknown, max = 48): string {
  return String(v ?? '').slice(0, max).replace(SAFE, '');
}

export function newPerfId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function dayFields(t: PerfTurn): Record<string, number> {
  const micro = t.costUsd ? Math.round(t.costUsd * 1_000_000) : 0;
  const p = perfLabel(t.provider);
  return {
    turns: 1,
    [`o:${t.outcome}`]: 1,
    retried: t.retries > 0 ? 1 : 0,
    inTok: t.inTok,
    outTok: t.outTok,
    cacheHit: t.cacheHit ?? 0,
    cacheMiss: t.cacheMiss ?? 0,
    costMicro: micro,
    [`p:${p}`]: 1,
    [`pc:${p}`]: micro,
    [`s:${t.src}`]: 1,
  };
}

/** Fire-and-forget from the route; never throws. */
export async function recordPerfTurn(t: PerfTurn): Promise<void> {
  try {
    const kv = runtimeKv();
    await Promise.all([
      kv.listPush(PERF_TURNS_KEY, [t], PERF_TURNS_CAP, LIST_TTL_SEC),
      kv.hashIncr(`perf:v1:day:${perfDay(t.at)}`, dayFields(t), DAY_TTL_SEC),
    ]);
  } catch {
    /* metrics never break a turn */
  }
}

export async function recordPerfEvent(e: Omit<PerfEvent, 'at'> & { at?: number }): Promise<void> {
  try {
    await runtimeKv().listPush(PERF_EVENTS_KEY, [{ at: Date.now(), ...e }], PERF_EVENTS_CAP, LIST_TTL_SEC);
  } catch {
    /* ignore */
  }
}

export async function readPerfTurns(limit = PERF_TURNS_CAP): Promise<PerfTurn[]> {
  return runtimeKv().listRange<PerfTurn>(PERF_TURNS_KEY, limit);
}

export async function readPerfEvents(limit = 100): Promise<PerfEvent[]> {
  return runtimeKv().listRange<PerfEvent>(PERF_EVENTS_KEY, limit);
}

export type PerfDay = { day: string; counters: Record<string, number> };

export async function readPerfDays(days = 14, now = Date.now()): Promise<PerfDay[]> {
  const kv = runtimeKv();
  const list = Array.from({ length: days }, (_, i) => perfDay(now - i * 86_400_000));
  return Promise.all(list.map(async (day) => ({ day, counters: await kv.hashGetAll(`perf:v1:day:${day}`) })));
}

/** Validate a bench record posted by the owner (direct-target bench). */
export function sanitizeBenchTurn(raw: unknown, run: string): PerfTurn | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, max = 1e9) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
  };
  const nullable = (v: unknown) => (v === null || v === undefined ? null : num(v));
  const outcome = ['ok', 'empty', 'error'].includes(String(r.outcome)) ? (String(r.outcome) as PerfOutcome) : 'ok';
  return {
    v: 1,
    id: newPerfId(),
    at: num(r.at, 4e12) || Date.now(),
    src: 'bench',
    run: perfLabel(run, 40),
    provider: perfLabel(r.provider) || 'bench',
    tier: perfLabel(r.tier) || 'direct',
    model: perfLabel(r.model) || undefined,
    variant: perfLabel(r.variant) || undefined,
    rule: 'bench_direct',
    ttftMs: nullable(r.ttftMs),
    prepMs: 0,
    latencyMs: num(r.latencyMs),
    modelMs: num(r.latencyMs),
    inTok: num(r.inTok),
    outTok: num(r.outTok),
    cacheHit: nullable(r.cacheHit),
    cacheMiss: nullable(r.cacheMiss),
    costUsd: r.costUsd === null || r.costUsd === undefined ? null : num(r.costUsd, 100),
    steps: 1,
    tools: 0,
    finish: perfLabel(r.finish) || 'stop',
    outcome,
    retries: 0,
  };
}

// ── Dashboard read model (shared by the owner page and GET /api/agent/perf) ──

export type PerfSource = 'site' | 'bench' | 'all';

export async function readPerfDashboard(opts: { src?: PerfSource; now?: number } = {}) {
  const { summarize, timeSeries, countBy, groupSummaries, compareKey } = await import('./perfStats');
  const { breakerPeek } = await import('./breaker');
  const { readGpuConfig, readGpuState } = await import('./gpu');
  const now = opts.now ?? Date.now();
  const src = opts.src ?? 'site';
  const [all, events, days] = await Promise.all([readPerfTurns(), readPerfEvents(60), readPerfDays(14, now)]);
  // Newest first by turn time (bench uploads may carry earlier timestamps).
  const turns = (src === 'all' ? all : all.filter((t) => t.src === src)).sort((a, b) => b.at - a.at);
  const dayStart = Date.parse(`${perfDay(now)}T00:00:00.000Z`);
  const today = turns.filter((t) => t.at >= dayStart);
  const cfg = readGpuConfig();
  const providers = ['deepseek', ...(cfg ? [cfg.providerId] : [])];
  const breakers = Object.fromEntries(await Promise.all(providers.map(async (p) => [p, await breakerPeek(p, now)] as const)));
  const gpuState = cfg ? (await readGpuState(now)).state : 'off';
  return {
    backend: runtimeKv().backend,
    src,
    window: { turns: turns.length, cap: PERF_TURNS_CAP, oldestAt: turns.length ? turns[turns.length - 1].at : null },
    summary: summarize(turns),
    today: summarize(today),
    series: timeSeries(turns, { now }),
    providerMix: countBy(turns, (t) => t.provider),
    ruleMix: countBy(turns, (t) => t.rule),
    compare: groupSummaries(turns, compareKey),
    benchRuns: groupSummaries(
      all.filter((t) => t.src === 'bench'),
      (t) => `${t.run ?? 'unnamed'} · ${compareKey(t)}`,
    ),
    days,
    events,
    recent: turns.slice(0, 30),
    status: {
      breakers,
      gpu: { mode: cfg?.mode ?? 'off', state: gpuState, model: cfg?.model ?? null, provider: cfg?.providerId ?? null },
    },
  };
}

export type PerfDashboard = Awaited<ReturnType<typeof readPerfDashboard>>;
