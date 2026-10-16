import { getVisitorRedis } from '../visitorMemory';

/**
 * Tiny key-value seam for the runtime state owners (ledger, quota, breaker).
 * Upstash Redis when configured; otherwise per-instance memory with TTLs.
 * `RUNTIME_KV=memory` (tests) forces memory.
 */
export type Kv = {
  backend: 'redis' | 'memory';
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<boolean>;
  incr(key: string, ttlSec: number): Promise<number>;
  /** Add `by` (integer) and return the new total; TTL is set when the key is created. */
  incrBy(key: string, by: number, ttlSec: number): Promise<number>;
  del(key: string): Promise<void>;
  /** Prepend JSON values to a capped list (newest first). One round trip on Redis. */
  listPush(key: string, values: unknown[], cap: number, ttlSec: number): Promise<void>;
  /** Newest-first slice of a list (parsed). */
  listRange<T>(key: string, limit: number): Promise<T[]>;
  /** HINCRBY several integer fields at once. One round trip on Redis. */
  hashIncr(key: string, fields: Record<string, number>, ttlSec: number): Promise<void>;
  hashGetAll(key: string): Promise<Record<string, number>>;
};

type Entry = { v: unknown; exp: number };
function mem(): Map<string, Entry> {
  const g = globalThis as { __aileenaRuntimeKv?: Map<string, Entry> };
  g.__aileenaRuntimeKv ??= new Map();
  return g.__aileenaRuntimeKv;
}

function live(e: Entry | undefined): Entry | undefined {
  if (!e) return undefined;
  if (e.exp && e.exp <= Date.now()) return undefined;
  return e;
}

const memoryKv: Kv = {
  backend: 'memory',
  async get<T>(key: string) {
    const e = live(mem().get(key));
    if (!e) mem().delete(key);
    return (e?.v as T) ?? null;
  },
  async set(key, value, opts) {
    const m = mem();
    if (opts?.nx && live(m.get(key))) return false;
    m.set(key, { v: value, exp: opts?.ex ? Date.now() + opts.ex * 1000 : 0 });
    if (m.size > 10_000) for (const [k, e] of m) if (!live(e)) m.delete(k);
    return true;
  },
  async incr(key, ttlSec) {
    return memoryKv.incrBy(key, 1, ttlSec);
  },
  async incrBy(key, by, ttlSec) {
    const m = mem();
    const e = live(m.get(key));
    const n = (typeof e?.v === 'number' ? e.v : 0) + Math.trunc(by);
    m.set(key, { v: n, exp: e?.exp || Date.now() + ttlSec * 1000 });
    return n;
  },
  async del(key) {
    mem().delete(key);
  },
  async listPush(key, values, cap, ttlSec) {
    const m = mem();
    const e = live(m.get(key));
    const list = Array.isArray(e?.v) ? (e.v as unknown[]) : [];
    const next = [...[...values].reverse(), ...list].slice(0, cap);
    m.set(key, { v: next, exp: Date.now() + ttlSec * 1000 });
  },
  async listRange<T>(key: string, limit: number) {
    const e = live(mem().get(key));
    return (Array.isArray(e?.v) ? (e.v as T[]) : []).slice(0, limit);
  },
  async hashIncr(key, fields, ttlSec) {
    const m = mem();
    const e = live(m.get(key));
    const h = { ...((e?.v as Record<string, number>) ?? {}) };
    for (const [f, by] of Object.entries(fields)) if (by) h[f] = (h[f] ?? 0) + Math.trunc(by);
    m.set(key, { v: h, exp: e?.exp || Date.now() + ttlSec * 1000 });
  },
  async hashGetAll(key) {
    const e = live(mem().get(key));
    return { ...((e?.v as Record<string, number>) ?? {}) };
  },
};

export function resetRuntimeKvForTests(): void {
  mem().clear();
}

export function runtimeKv(): Kv {
  if (process.env.RUNTIME_KV === 'memory') return memoryKv;
  const redis = getVisitorRedis();
  if (!redis) return memoryKv;
  return {
    backend: 'redis',
    async get<T>(key: string) {
      try {
        return ((await redis.get(key)) as T) ?? null;
      } catch {
        return memoryKv.get<T>(key);
      }
    },
    async set(key, value, opts) {
      try {
        const r = opts?.nx
          ? opts.ex
            ? await redis.set(key, value as never, { nx: true, ex: opts.ex })
            : await redis.set(key, value as never, { nx: true })
          : opts?.ex
            ? await redis.set(key, value as never, { ex: opts.ex })
            : await redis.set(key, value as never);
        return r === 'OK' || r === true || (r !== null && r !== undefined);
      } catch {
        return memoryKv.set(key, value, opts);
      }
    },
    async incr(key, ttlSec) {
      try {
        const n = await redis.incr(key);
        if (n === 1) await redis.expire(key, ttlSec);
        return n;
      } catch {
        return memoryKv.incr(key, ttlSec);
      }
    },
    async incrBy(key, by, ttlSec) {
      try {
        const n = await redis.incrby(key, Math.trunc(by));
        if (n === Math.trunc(by)) await redis.expire(key, ttlSec);
        return n;
      } catch {
        return memoryKv.incrBy(key, by, ttlSec);
      }
    },
    async del(key) {
      try {
        await redis.del(key);
      } catch {
        await memoryKv.del(key);
      }
    },
    async listPush(key, values, cap, ttlSec) {
      try {
        const p = redis.pipeline();
        for (const v of values) p.lpush(key, JSON.stringify(v));
        p.ltrim(key, 0, cap - 1);
        p.expire(key, ttlSec);
        await p.exec();
      } catch {
        await memoryKv.listPush(key, values, cap, ttlSec);
      }
    },
    async listRange<T>(key: string, limit: number) {
      try {
        const raw = (await redis.lrange(key, 0, limit - 1)) as unknown[];
        return raw
          .map((r) => {
            try {
              return (typeof r === 'string' ? JSON.parse(r) : r) as T;
            } catch {
              return null;
            }
          })
          .filter((x): x is Awaited<T> => x !== null) as T[];
      } catch {
        return memoryKv.listRange<T>(key, limit);
      }
    },
    async hashIncr(key, fields, ttlSec) {
      try {
        const p = redis.pipeline();
        for (const [f, by] of Object.entries(fields)) if (by) p.hincrby(key, f, Math.trunc(by));
        p.expire(key, ttlSec);
        await p.exec();
      } catch {
        await memoryKv.hashIncr(key, fields, ttlSec);
      }
    },
    async hashGetAll(key) {
      try {
        const h = ((await redis.hgetall(key)) ?? {}) as Record<string, unknown>;
        return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v) || 0]));
      } catch {
        return memoryKv.hashGetAll(key);
      }
    },
  };
}
