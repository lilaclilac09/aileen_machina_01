/**
 * Public-door answer cache: the same single-turn question gets the same
 * answer. temperature 0 is not deterministic on DeepSeek's API, so a clean
 * answer is stored for 24h and replayed on the next identical ask.
 *
 * Key = normalized question + x-prefix-hash + provider + base URL + model id
 * + sampling config + tool route, so any prompt, tool-table, model or host
 * change is an automatic miss. Redis only (the runtime KV seam): with no
 * Redis, or once Redis has failed on this instance, lookups and writes are
 * skipped and the turn runs exactly as before. `RUNTIME_KV=memory` (tests)
 * uses the in-memory seam.
 */
import { getVisitorRedis } from '../visitorMemory';
import { runtimeKv } from './kv';
import { redisHealth } from './redisHealth';

export const ANSWER_CACHE_TTL_SEC = 60 * 60 * 24;
const MAX_ANSWER_CHARS = 8_000;

export type AnswerCacheKeyInput = {
  question: string;
  prefixHash: string;
  provider: string;
  baseURL: string;
  modelId: string;
  sampling: Readonly<Record<string, unknown>>;
  toolRoute: string;
};

type Stored = { v: 1; text: string; at: number };

export function normalizeQuestion(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function answerCacheEnabled(): boolean {
  if (process.env.RUNTIME_KV === 'memory') return true;
  return getVisitorRedis() !== null && !redisHealth().degraded;
}

export async function answerCacheKey(i: AnswerCacheKeyInput): Promise<string> {
  const sampling = Object.keys(i.sampling)
    .sort()
    .map((k) => `${k}=${JSON.stringify(i.sampling[k])}`)
    .join('&');
  const raw = [normalizeQuestion(i.question), i.prefixHash, i.provider, i.baseURL, i.modelId, sampling, i.toolRoute].join('\n\u0000\n');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return `answer:v1:${hex}`;
}

/** Stored answer text, or null (miss, disabled, or any Redis error). */
export async function readCachedAnswer(key: string): Promise<string | null> {
  if (!answerCacheEnabled()) return null;
  try {
    const kv = runtimeKv();
    const v = await kv.get<Stored | string>(key);
    // A Redis read that fell back to memory is not a hit we trust.
    if (kv.backend === 'redis' && redisHealth().degraded) return null;
    const s = typeof v === 'string' ? (JSON.parse(v) as Stored) : v;
    return s && s.v === 1 && typeof s.text === 'string' && s.text.trim() ? s.text : null;
  } catch {
    return null;
  }
}

export async function storeCachedAnswer(key: string, text: string): Promise<boolean> {
  if (!answerCacheEnabled() || !text.trim() || text.length > MAX_ANSWER_CHARS) return false;
  try {
    const kv = runtimeKv();
    const value: Stored = { v: 1, text, at: Date.now() };
    // First clean answer wins; a later different answer never overwrites it.
    const ok = await kv.set(key, value, { ex: ANSWER_CACHE_TTL_SEC, nx: true });
    // A write that fell back to memory is never read (degraded disables reads).
    return ok && !(kv.backend === 'redis' && redisHealth().degraded);
  } catch {
    return false;
  }
}
