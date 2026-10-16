/**
 * Aggregate engagement store for the console (and agent callers).
 *
 * Upstash Redis when UPSTASH_REDIS_REST_URL / _TOKEN (or KV_REST_API_*) are
 * set; otherwise an in-process fallback so the feature still works (counts are
 * then per server instance and reset on deploy — the dashboard says so).
 *
 * What is stored: per-day counters (opens, starters_seen, starter taps,
 * first messages) and per-dimension breakdowns (source, landing, country,
 * language, device, caller kind), a HyperLogLog of salted daily-rotated
 * visitor hashes for unique counts, and a capped list (200) of recent
 * sessions. Never an IP, never a city, never message text.
 */

import { getVisitorRedis } from '../visitorMemory';

export type EngageDims = {
  source: string;
  landing: string;
  country: string;
  locale: string;
  device: string;
  caller: 'visitor' | 'agent';
  topic?: string;
};

export type EngageEvent = {
  type: 'open' | 'starters_seen' | 'starter_tap' | 'first_message' | 'agent_ask';
  sid: string;
  starter?: string;
  dims: EngageDims;
  /** Salted daily hash (hex) for the unique counter. Not stored in the session list. */
  uniqHash?: string;
  at: number;
};

export type RecentSession = {
  sid: string;
  day: string;
  firstAt: number;
  source: string;
  landing: string;
  country: string;
  locale: string;
  device: string;
  caller: 'visitor' | 'agent';
  opened: boolean;
  sawStarters: boolean;
  starterTaps: number;
  asked: boolean;
};

export const RECENT_CAP = 200;
const TTL_SECONDS = 60 * 60 * 24 * 120;

export function dayKey(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}

/** Clamp a dimension value to a short, safe label. */
export function dimValue(v: string | undefined, fallback = 'unknown'): string {
  const s = (v || '').toString().trim().slice(0, 60);
  return s.replace(/[^\w/.\-:+]/g, '') || fallback;
}

type Backend = {
  hincrby(key: string, field: string, by: number): Promise<void>;
  hgetall(key: string): Promise<Record<string, number>>;
  pfadd(key: string, member: string): Promise<void>;
  pfcount(key: string): Promise<number>;
  getSession(sid: string): Promise<RecentSession | null>;
  putSession(s: RecentSession): Promise<void>;
  recent(limit: number): Promise<RecentSession[]>;
  kind: 'redis' | 'memory';
};

function memoryBackend(): Backend {
  const g = globalThis as unknown as { __aileenaEngage?: { h: Map<string, Map<string, number>>; hll: Map<string, Set<string>>; s: Map<string, RecentSession>; order: string[] } };
  g.__aileenaEngage ??= { h: new Map(), hll: new Map(), s: new Map(), order: [] };
  const m = g.__aileenaEngage;
  return {
    kind: 'memory',
    async hincrby(key, field, by) {
      const h = m.h.get(key) ?? new Map<string, number>();
      h.set(field, (h.get(field) ?? 0) + by);
      m.h.set(key, h);
    },
    async hgetall(key) {
      return Object.fromEntries(m.h.get(key) ?? new Map());
    },
    async pfadd(key, member) {
      const set = m.hll.get(key) ?? new Set<string>();
      set.add(member);
      m.hll.set(key, set);
    },
    async pfcount(key) {
      return m.hll.get(key)?.size ?? 0;
    },
    async getSession(sid) {
      return m.s.get(sid) ?? null;
    },
    async putSession(s) {
      if (!m.s.has(s.sid)) {
        m.order.unshift(s.sid);
        if (m.order.length > RECENT_CAP) {
          for (const old of m.order.splice(RECENT_CAP)) m.s.delete(old);
        }
      }
      m.s.set(s.sid, s);
    },
    async recent(limit) {
      return m.order.slice(0, limit).map((id) => m.s.get(id)).filter((x): x is RecentSession => Boolean(x));
    },
  };
}

function redisBackend(): Backend | null {
  const r = getVisitorRedis();
  if (!r) return null;
  return {
    kind: 'redis',
    async hincrby(key, field, by) {
      await r.hincrby(key, field, by);
      await r.expire(key, TTL_SECONDS);
    },
    async hgetall(key) {
      const h = (await r.hgetall<Record<string, number | string>>(key)) ?? {};
      return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v) || 0]));
    },
    async pfadd(key, member) {
      await r.pfadd(key, member);
      await r.expire(key, TTL_SECONDS);
    },
    async pfcount(key) {
      return Number(await r.pfcount(key)) || 0;
    },
    async getSession(sid) {
      return (await r.get<RecentSession>(`engage:sess:${sid}`)) ?? null;
    },
    async putSession(s) {
      const key = `engage:sess:${s.sid}`;
      const existed = (await r.exists(key)) > 0;
      await r.set(key, s, { ex: 60 * 60 * 24 * 30 });
      if (!existed) {
        await r.lpush('engage:recent', s.sid);
        await r.ltrim('engage:recent', 0, RECENT_CAP - 1);
      }
    },
    async recent(limit) {
      const ids = (await r.lrange<string>('engage:recent', 0, limit - 1)) ?? [];
      if (!ids.length) return [];
      const rows = await r.mget<(RecentSession | null)[]>(...ids.map((id) => `engage:sess:${id}`));
      return rows.filter((x): x is RecentSession => Boolean(x));
    },
  };
}

let backend: Backend | undefined;
export function engageBackend(): Backend {
  backend ??= redisBackend() ?? memoryBackend();
  return backend;
}

/** For tests: force the in-memory backend and clear it. */
export function resetEngageStoreForTests(): void {
  (globalThis as { __aileenaEngage?: unknown }).__aileenaEngage = undefined;
  backend = memoryBackend();
}

const COUNTER: Record<EngageEvent['type'], string> = {
  open: 'opens',
  starters_seen: 'starters_seen',
  starter_tap: 'starter_taps',
  first_message: 'first_messages',
  agent_ask: 'agent_asks',
};

export async function recordEngageEvent(e: EngageEvent): Promise<void> {
  const b = engageBackend();
  const day = dayKey(e.at);
  const counter = COUNTER[e.type];
  await b.hincrby(`engage:day:${day}`, counter, 1);
  await b.hincrby('engage:total', counter, 1);
  if (e.type === 'open' || e.type === 'agent_ask') {
    for (const [dim, value] of Object.entries(e.dims)) {
      if (value === undefined) continue;
      await b.hincrby(`engage:dim:${dim}`, dimValue(String(value)), 1);
    }
  }
  if (e.type === 'starter_tap' && e.starter) await b.hincrby('engage:dim:starter', dimValue(e.starter), 1);
  if (e.type === 'first_message') {
    await b.hincrby('engage:asked:source', dimValue(e.dims.source), 1);
    await b.hincrby('engage:asked:landing', dimValue(e.dims.landing), 1);
  }
  if (e.uniqHash) await b.pfadd(`engage:uniq:${day}`, e.uniqHash);

  const prev = await b.getSession(e.sid);
  const s: RecentSession = prev ?? {
    sid: e.sid,
    day,
    firstAt: e.at,
    source: dimValue(e.dims.source),
    landing: dimValue(e.dims.landing),
    country: dimValue(e.dims.country),
    locale: dimValue(e.dims.locale),
    device: dimValue(e.dims.device),
    caller: e.dims.caller,
    opened: false,
    sawStarters: false,
    starterTaps: 0,
    asked: false,
  };
  if (e.type === 'open' || e.type === 'agent_ask') s.opened = true;
  if (e.type === 'starters_seen') s.sawStarters = true;
  if (e.type === 'starter_tap') s.starterTaps += 1;
  if (e.type === 'first_message' || e.type === 'agent_ask') s.asked = true;
  await b.putSession(s);
}

export type EngageStats = {
  backend: 'redis' | 'memory';
  totals: Record<string, number>;
  days: Array<{ day: string; counters: Record<string, number>; uniques: number }>;
  rates: { firstMessageRate: number; starterTapRate: number };
  funnel: { opened: number; sawStarters: number; asked: number };
  breakdown: Record<'source' | 'landing' | 'country' | 'locale' | 'device' | 'caller' | 'starter' | 'topic', Record<string, number>>;
  askedBy: { source: Record<string, number>; landing: Record<string, number> };
  recent: RecentSession[];
};

export async function readEngageStats(days = 14): Promise<EngageStats> {
  const b = engageBackend();
  const totals = await b.hgetall('engage:total');
  const dayRows: EngageStats['days'] = [];
  for (let i = 0; i < days; i++) {
    const day = dayKey(Date.now() - i * 86400000);
    dayRows.push({ day, counters: await b.hgetall(`engage:day:${day}`), uniques: await b.pfcount(`engage:uniq:${day}`) });
  }
  const dims = ['source', 'landing', 'country', 'locale', 'device', 'caller', 'starter', 'topic'] as const;
  const breakdown = {} as EngageStats['breakdown'];
  for (const d of dims) breakdown[d] = await b.hgetall(`engage:dim:${d}`);
  const opens = totals.opens ?? 0;
  const recent = await b.recent(RECENT_CAP);
  const visitorRecent = recent.filter((r) => r.caller === 'visitor');
  return {
    backend: b.kind,
    totals,
    days: dayRows,
    rates: {
      firstMessageRate: opens ? (totals.first_messages ?? 0) / opens : 0,
      starterTapRate: opens ? (totals.starter_taps ?? 0) / opens : 0,
    },
    funnel: {
      opened: visitorRecent.filter((r) => r.opened).length,
      sawStarters: visitorRecent.filter((r) => r.opened && r.sawStarters).length,
      asked: visitorRecent.filter((r) => r.opened && r.asked).length,
    },
    breakdown,
    askedBy: { source: await b.hgetall('engage:asked:source'), landing: await b.hgetall('engage:asked:landing') },
    recent,
  };
}
