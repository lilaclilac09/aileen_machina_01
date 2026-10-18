import type { Redis } from '@upstash/redis';
import { getVisitorRedis, redisEnvNames } from '../visitorMemory';
import { redisHealth, sanitizeRedisError } from './redisHealth';

type Step = { ok: boolean; ms: number; error?: string };

async function step<T>(run: () => Promise<T>, check: (v: T) => boolean = () => true): Promise<Step> {
  const t = Date.now();
  try {
    const v = await run();
    return { ok: check(v), ms: Date.now() - t };
  } catch (err) {
    return { ok: false, ms: Date.now() - t, error: sanitizeRedisError(err) };
  }
}

/**
 * Owner diagnostic: SET/GET/DEL on a throwaway key with a 60s TTL. A token that
 * can read but not write (e.g. KV_REST_API_READ_ONLY_TOKEN) shows up as
 * read ok + write failed. Reports env names only, never values.
 */
export async function redisDiagnostic(client: Redis | null = getVisitorRedis()) {
  const env = redisEnvNames();
  const store = process.env.RUNTIME_KV === 'memory' ? 'memory (RUNTIME_KV=memory)' : client ? 'redis' : 'memory (no Redis env)';
  const base = { store, env, health: redisHealth() };
  if (!client || process.env.RUNTIME_KV === 'memory') return { ...base, roundtrip: null, writable: null, readOnlyToken: null };
  const key = `diag:redis:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
  const value = `ok-${Math.random().toString(36).slice(2, 10)}`;
  const read = await step(() => client.get(key), (v) => v === null);
  const write = await step(() => client.set(key, value, { ex: 60 }), (v) => v === 'OK');
  const readBack = write.ok ? await step(() => client.get<string>(key), (v) => v === value) : { ok: false, ms: 0, error: 'skipped (write failed)' };
  const del = write.ok ? await step(() => client.del(key), (v) => v === 1) : { ok: false, ms: 0, error: 'skipped (write failed)' };
  const writable = write.ok && readBack.ok;
  return {
    ...base,
    roundtrip: { read, write, readBack, del },
    writable,
    // Reads work, writes do not: the token is read-only (or lacks write ACLs).
    readOnlyToken: read.ok && !write.ok,
  };
}
