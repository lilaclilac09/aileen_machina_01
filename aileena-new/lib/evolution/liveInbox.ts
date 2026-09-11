/**
 * Chat-safe live inbox. Public console enqueues uncovered visitor asks.
 * Council never writes here. No verifiers, no ops/ fs — Edge-safe.
 *
 * Drain (CLI / GitHub Action) turns rows into held-out + verifier, then
 * ratchets. Promote only if held-out rises.
 */

import { getVisitorRedis } from '../visitorMemory';
import { matchingSkills } from './selectSkills';

export const LIVE_INBOX_KEY = 'evolve:inbox';
export const LIVE_SEEN_PREFIX = 'evolve:seen:';
export const LIVE_SEEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const LIVE_INBOX_MAX = 80;
export const LIVE_DRAIN_DEFAULT = 5;

export type LiveAsk = {
  at: string;
  prompt: string;
  source: 'chat';
};

export type EnqueueResult = {
  ok: boolean;
  reason:
    | 'queued'
    | 'council'
    | 'empty'
    | 'short'
    | 'long'
    | 'greet'
    | 'already-skilled'
    | 'duplicate'
    | 'full'
    | 'no-store'
    | 'error';
};

const GREET =
  /^(hi|hey|hello|yo|sup|thanks|thank you|ok|okay|你好|嗨|谢谢|在吗|早上好|晚安)[\s!?.。！？]*$/i;

type MemoryBox = { items: LiveAsk[]; seen: Set<string> };
const g = globalThis as typeof globalThis & { __aileenaLiveInbox?: MemoryBox };

function memoryBox(): MemoryBox {
  if (!g.__aileenaLiveInbox) g.__aileenaLiveInbox = { items: [], seen: new Set() };
  return g.__aileenaLiveInbox;
}

export function resetLiveInboxForTests() {
  g.__aileenaLiveInbox = { items: [], seen: new Set() };
}

function preferMemoryInbox(): boolean {
  if (process.env.EVOLUTION_LIVE_INBOX === 'memory') return true;
  if (process.env.EVOLUTION_LIVE_INBOX === 'redis') return false;
  return getVisitorRedis() === null;
}

function fingerprint(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120);
}

export function shouldEnqueueLiveAsk(
  prompt: string,
  opts?: { isCouncil?: boolean },
): EnqueueResult {
  if (opts?.isCouncil) return { ok: false, reason: 'council' };
  const t = prompt.replace(/\s+/g, ' ').trim();
  if (!t) return { ok: false, reason: 'empty' };
  if (t.length < 8) return { ok: false, reason: 'short' };
  if (t.length > 240) return { ok: false, reason: 'long' };
  if (GREET.test(t)) return { ok: false, reason: 'greet' };
  if (matchingSkills(t).length > 0) return { ok: false, reason: 'already-skilled' };
  return { ok: true, reason: 'queued' };
}

function seenKey(fp: string): string {
  return `${LIVE_SEEN_PREFIX}${fp}`;
}

/**
 * Fire-and-forget from /api/chat. No-ops when Redis is missing on Vercel.
 */
export async function enqueueLiveAsk(
  prompt: string,
  opts?: { isCouncil?: boolean },
): Promise<EnqueueResult> {
  try {
    const gate = shouldEnqueueLiveAsk(prompt, opts);
    if (!gate.ok) return gate;
    const row: LiveAsk = {
      at: new Date().toISOString(),
      prompt: prompt.replace(/\s+/g, ' ').trim(),
      source: 'chat',
    };
    const fp = fingerprint(row.prompt);

    if (preferMemoryInbox()) {
      if (process.env.VERCEL === '1' && process.env.EVOLUTION_LIVE_INBOX !== 'memory') {
        return { ok: false, reason: 'no-store' };
      }
      const box = memoryBox();
      if (box.seen.has(fp)) return { ok: false, reason: 'duplicate' };
      if (box.items.length >= LIVE_INBOX_MAX) return { ok: false, reason: 'full' };
      box.seen.add(fp);
      box.items.push(row);
      return { ok: true, reason: 'queued' };
    }

    const redis = getVisitorRedis();
    if (!redis) return { ok: false, reason: 'no-store' };
    const fresh = await redis.set(seenKey(fp), '1', { nx: true, ex: LIVE_SEEN_TTL_SECONDS });
    if (!fresh) return { ok: false, reason: 'duplicate' };
    const len = await redis.llen(LIVE_INBOX_KEY);
    if (typeof len === 'number' && len >= LIVE_INBOX_MAX) {
      await redis.del(seenKey(fp));
      return { ok: false, reason: 'full' };
    }
    await redis.rpush(LIVE_INBOX_KEY, JSON.stringify(row));
    return { ok: true, reason: 'queued' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function drainLiveInbox(limit = LIVE_DRAIN_DEFAULT): Promise<LiveAsk[]> {
  const cap = Math.max(1, Math.min(limit, LIVE_DRAIN_DEFAULT));
  const out: LiveAsk[] = [];
  if (preferMemoryInbox()) {
    const box = memoryBox();
    while (out.length < cap && box.items.length) {
      const row = box.items.shift();
      if (row) out.push(row);
    }
    return out;
  }
  const redis = getVisitorRedis();
  if (!redis) return [];
  for (let i = 0; i < cap; i++) {
    const raw = await redis.lpop<string>(LIVE_INBOX_KEY);
    if (raw == null) break;
    const parsed = parseRow(raw);
    if (parsed) out.push(parsed);
  }
  return out;
}

function parseRow(raw: unknown): LiveAsk | null {
  if (raw == null) return null;
  try {
    const row = typeof raw === 'string' ? (JSON.parse(raw) as LiveAsk) : (raw as LiveAsk);
    if (!row || typeof row.prompt !== 'string' || !row.prompt.trim()) return null;
    return {
      at: typeof row.at === 'string' ? row.at : new Date().toISOString(),
      prompt: row.prompt.trim(),
      source: 'chat',
    };
  } catch {
    return null;
  }
}
