import { getVisitorRedis } from '../visitorMemory';

/**
 * Fixed-window counters for agent callers. The key is a salted daily hash of the
 * caller (never a raw IP). Redis when configured, otherwise per-instance memory.
 */
export type RateWindow = { name: string; limit: number; windowSec: number };

export const AGENT_LIMITS = {
  ask: [
    { name: 'ask-min', limit: 5, windowSec: 60 },
    { name: 'ask-day', limit: 20, windowSec: 86_400 },
  ],
  lookup: [
    { name: 'lookup-min', limit: 30, windowSec: 60 },
    { name: 'lookup-day', limit: 300, windowSec: 86_400 },
  ],
  /** All agent callers together, so a botnet cannot drain the model budget. */
  globalAsk: [{ name: 'ask-global-day', limit: 500, windowSec: 86_400 }],
} satisfies Record<string, RateWindow[]>;

type Mem = Map<string, { count: number; resetAt: number }>;
function mem(): Mem {
  const g = globalThis as { __aileenaAgentRate?: Mem };
  g.__aileenaAgentRate ??= new Map();
  return g.__aileenaAgentRate;
}

let forceMemory = false;
export function resetAgentRateForTests(): void {
  forceMemory = true;
  mem().clear();
}

export type RateResult = { ok: true } | { ok: false; window: string; retryAfterSec: number };

export async function takeAgentRate(callerKey: string, windows: RateWindow[], now = Date.now()): Promise<RateResult> {
  const redis = forceMemory ? null : getVisitorRedis();
  for (const w of windows) {
    const bucket = Math.floor(now / 1000 / w.windowSec);
    const key = `agentrate:${w.name}:${callerKey}:${bucket}`;
    const retryAfterSec = w.windowSec - (Math.floor(now / 1000) % w.windowSec);
    let count: number;
    if (redis) {
      try {
        count = await redis.incr(key);
        if (count === 1) await redis.expire(key, w.windowSec + 5);
      } catch {
        count = memIncr(key, now, w.windowSec);
      }
    } else {
      count = memIncr(key, now, w.windowSec);
    }
    if (count > w.limit) return { ok: false, window: w.name, retryAfterSec };
  }
  return { ok: true };
}

function memIncr(key: string, now: number, windowSec: number): number {
  const m = mem();
  const cur = m.get(key);
  if (!cur || cur.resetAt <= now) {
    m.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    if (m.size > 5000) for (const [k, v] of m) if (v.resetAt <= now) m.delete(k);
    return 1;
  }
  cur.count += 1;
  return cur.count;
}
