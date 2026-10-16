/**
 * Per-provider circuit breaker (P1.6), shared across instances via Redis.
 * closed → (3 failures) → open for 60s → half-open: exactly one probe request
 * holds a short lease; its success closes the breaker, its failure re-opens it.
 * Client cancels are not failures (P1.4).
 */
import { runtimeKv } from './kv';

export const BREAKER_THRESHOLD = 3;
export const BREAKER_COOLDOWN_MS = 60_000;
export const BREAKER_PROBE_LEASE_SEC = 30;

type State = { failures: number; openUntil: number };

function key(provider: string): string {
  return `breaker:v1:${provider}`;
}

async function read(provider: string): Promise<State> {
  const raw = await runtimeKv().get<State | string>(key(provider));
  try {
    const s = typeof raw === 'string' ? (JSON.parse(raw) as State) : raw;
    return s && typeof s.failures === 'number' ? s : { failures: 0, openUntil: 0 };
  } catch {
    return { failures: 0, openUntil: 0 };
  }
}

export type BreakerGate = { allowed: true; probe: boolean } | { allowed: false; reason: 'open' | 'probe_in_flight'; retryInMs: number };

export async function breakerGate(provider: string, now = Date.now()): Promise<BreakerGate> {
  const s = await read(provider);
  if (s.failures < BREAKER_THRESHOLD) return { allowed: true, probe: false };
  if (now < s.openUntil) return { allowed: false, reason: 'open', retryInMs: s.openUntil - now };
  // Half-open: one probe at a time.
  const got = await runtimeKv().set(`${key(provider)}:probe`, String(now), { nx: true, ex: BREAKER_PROBE_LEASE_SEC });
  if (got) return { allowed: true, probe: true };
  return { allowed: false, reason: 'probe_in_flight', retryInMs: BREAKER_PROBE_LEASE_SEC * 1000 };
}

export async function breakerSuccess(provider: string): Promise<void> {
  const kv = runtimeKv();
  await kv.set(key(provider), JSON.stringify({ failures: 0, openUntil: 0 }), { ex: 3600 });
  await kv.del(`${key(provider)}:probe`);
}

export async function breakerFailure(provider: string, now = Date.now()): Promise<State> {
  const kv = runtimeKv();
  const s = await read(provider);
  const failures = s.failures + 1;
  const next: State = { failures, openUntil: failures >= BREAKER_THRESHOLD ? now + BREAKER_COOLDOWN_MS : 0 };
  await kv.set(key(provider), JSON.stringify(next), { ex: 3600 });
  await kv.del(`${key(provider)}:probe`);
  if (failures >= BREAKER_THRESHOLD) console.warn('[breaker] open', { provider, failures, openUntil: next.openUntil });
  return next;
}

/** Client cancel or our own abort: never counts against the provider. */
export function isCancellation(err: unknown, clientSignal?: AbortSignal): boolean {
  if (clientSignal?.aborted) return true;
  const name = err instanceof Error ? err.name : '';
  const msg = err instanceof Error ? err.message : String(err);
  return name === 'AbortError' && !/timeout|budget/i.test(msg) && !/TimeoutError/.test(name);
}
