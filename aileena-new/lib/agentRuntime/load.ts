/**
 * Load, latency, spend and per-provider turn counters for the model router.
 * Time-bucketed counters in the runtime KV seam (Upstash when configured), so
 * a crashed instance never leaks an "in flight" count: buckets just expire.
 */
import { runtimeKv } from './kv';

const BUCKET_MS = 60_000;
const BUCKET_TTL_SEC = 5 * 60;
const DAY_TTL_SEC = 60 * 60 * 24 * 15;

function bucket(now: number): number {
  return Math.floor(now / BUCKET_MS);
}

export function utcDay(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

// ── In flight (started − finished over the current + previous minute) ──

export async function noteTurnStart(provider: string, now = Date.now()): Promise<void> {
  await runtimeKv().incr(`load:v1:${provider}:${bucket(now)}:start`, BUCKET_TTL_SEC);
}

export async function noteTurnDone(provider: string, now = Date.now()): Promise<void> {
  await runtimeKv().incr(`load:v1:${provider}:${bucket(now)}:done`, BUCKET_TTL_SEC);
}

async function readCount(key: string): Promise<number> {
  const v = await runtimeKv().get<number | string>(key);
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export async function inflight(provider: string, now = Date.now()): Promise<number> {
  const b = bucket(now);
  let started = 0;
  let done = 0;
  for (const k of [b - 1, b]) {
    started += await readCount(`load:v1:${provider}:${k}:start`);
    done += await readCount(`load:v1:${provider}:${k}:done`);
  }
  return Math.max(0, started - done);
}

// ── Slow first token (count of turns over the threshold, last 2 minutes) ──

export async function noteTtft(provider: string, ms: number, thresholdMs: number, now = Date.now()): Promise<void> {
  if (!thresholdMs || ms < thresholdMs) return;
  await runtimeKv().incr(`load:v1:${provider}:${bucket(now)}:slow`, BUCKET_TTL_SEC);
}

export const SLOW_TURNS_TO_SPILL = 3;

export async function slowTurns(provider: string, now = Date.now()): Promise<number> {
  const b = bucket(now);
  return (await readCount(`load:v1:${provider}:${b - 1}:slow`)) + (await readCount(`load:v1:${provider}:${b}:slow`));
}

// ── DeepSeek spend estimate (micro-USD per UTC day) ──

/**
 * deepseek-flash list prices in USD per 1M tokens, PEAK (conservative; off-peak
 * is half). Source: https://api-docs.deepseek.com/quick_start/pricing (2026-10-16).
 */
export const DEEPSEEK_FLASH_PEAK_USD_PER_MTOK = { inHit: 0.006, inMiss: 0.3, out: 1.2 };

export function estimateTurnMicroUsd(u: { hit: number; miss: number; out: number }): number {
  const p = DEEPSEEK_FLASH_PEAK_USD_PER_MTOK;
  // USD per 1M tokens == micro-USD per token.
  return Math.ceil(u.hit * p.inHit + u.miss * p.inMiss + u.out * p.out);
}

export async function addSpend(provider: string, microUsd: number, now = Date.now()): Promise<number> {
  if (!(microUsd > 0)) return readSpendMicroUsd(provider, now);
  return runtimeKv().incrBy(`spend:v1:${provider}:${utcDay(now)}`, microUsd, DAY_TTL_SEC);
}

export async function readSpendMicroUsd(provider: string, now = Date.now()): Promise<number> {
  return readCount(`spend:v1:${provider}:${utcDay(now)}`);
}

// ── Router stats for the owner analytics panel ──

export async function recordRouterTurn(e: { provider: string; rule: string; committed: boolean }, now = Date.now()): Promise<void> {
  const day = utcDay(now);
  const kv = runtimeKv();
  const safe = (s: string) => s.replace(/[^a-z0-9:._-]/gi, '').slice(0, 48) || 'unknown';
  await kv.incr(`rstats:v1:${day}:p:${safe(e.provider)}`, DAY_TTL_SEC);
  await kv.incr(`rstats:v1:${day}:r:${safe(e.rule)}`, DAY_TTL_SEC);
  if (!e.committed) await kv.incr(`rstats:v1:${day}:p:${safe(e.provider)}:failed`, DAY_TTL_SEC);
}

export const ROUTER_RULES = [
  'default',
  'sticky',
  'owner_gpu',
  'owner_wake',
  'primary_blocked',
  'gpu_failover',
  'spill_inflight',
  'spill_slow',
  'budget',
  'canary',
  'context_guard',
  'fallback',
] as const;

export async function readRouterStats(
  providers: string[],
  now = Date.now(),
): Promise<{ day: string; providers: Record<string, { turns: number; failed: number }>; rules: Record<string, number> }> {
  const day = utcDay(now);
  const out: Record<string, { turns: number; failed: number }> = {};
  for (const p of providers) {
    out[p] = {
      turns: await readCount(`rstats:v1:${day}:p:${p}`),
      failed: await readCount(`rstats:v1:${day}:p:${p}:failed`),
    };
  }
  const rules: Record<string, number> = {};
  for (const r of ROUTER_RULES) {
    const n = await readCount(`rstats:v1:${day}:r:${r}`);
    if (n) rules[r] = n;
  }
  return { day, providers: out, rules };
}
