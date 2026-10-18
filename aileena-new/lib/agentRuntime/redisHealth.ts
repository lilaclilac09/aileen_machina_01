/**
 * Per-instance Redis health. The runtime KV seam falls back to memory when a
 * Redis call throws; this records that it happened (first error logged once
 * per instance) so the owner diagnostic and debug headers can say "degraded"
 * instead of the fallback staying silent. Messages are sanitized: no URLs,
 * no token-like strings.
 */
export type RedisHealth = {
  degraded: boolean;
  errors: number;
  lastError: string | null;
  lastErrorOp: string | null;
  lastErrorAt: string | null;
};

function state(): RedisHealth {
  const g = globalThis as { __aileenaRedisHealth?: RedisHealth };
  g.__aileenaRedisHealth ??= { degraded: false, errors: 0, lastError: null, lastErrorOp: null, lastErrorAt: null };
  return g.__aileenaRedisHealth;
}

export function sanitizeRedisError(err: unknown): string {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return raw
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/[A-Za-z0-9_\-=+/]{24,}/g, '<redacted>')
    .slice(0, 200);
}

export function noteRedisError(op: string, err: unknown): void {
  const s = state();
  const msg = sanitizeRedisError(err);
  s.degraded = true;
  s.errors += 1;
  s.lastError = msg;
  s.lastErrorOp = op;
  s.lastErrorAt = new Date().toISOString();
  if (s.errors === 1) console.error('[redis] %s failed; falling back to per-instance memory: %s', op, msg);
}

export function redisHealth(): Readonly<RedisHealth> {
  return { ...state() };
}

export function resetRedisHealthForTests(): void {
  const g = globalThis as { __aileenaRedisHealth?: RedisHealth };
  delete g.__aileenaRedisHealth;
}
