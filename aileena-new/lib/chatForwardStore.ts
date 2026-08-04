/**
 * Durable log of agent chat transcript forwards to the owner inbox.
 *
 * Why: `/api/chat/forward` used to be fire-and-forget email only. When Resend
 * failed (sandbox From, missing key, network), the transcript was gone forever.
 * This store keeps every attempt in Upstash Redis so we can list / resend.
 *
 * Degrade: if UPSTASH_* is missing, ops no-op (email still attempted).
 */

import { createHash } from 'crypto';
import { getVisitorRedis } from './visitorMemory';

export type ChatForwardStatus = 'sent' | 'failed' | 'skipped';

export type ChatForwardMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export type ChatForwardRecord = {
  id: string;
  sessionId: string;
  status: ChatForwardStatus;
  subject: string;
  transcript: ChatForwardMessage[];
  referer?: string;
  ua?: string;
  error?: string;
  createdAt: string;
  sentAt?: string;
};

const INDEX_KEY = 'chat:forward:index';
const PENDING_KEY = 'chat:forward:pending';
const RECORD_PREFIX = 'chat:forward:rec:';
/** Keep ~90 days of forward history (matches soft visitor TTL). */
export const CHAT_FORWARD_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_INDEX = 800;

function recordKey(id: string): string {
  return `${RECORD_PREFIX}${id}`;
}

export function makeForwardId(sessionId: string, transcript: ChatForwardMessage[]): string {
  const h = createHash('sha256')
    .update(sessionId)
    .update('|')
    .update(JSON.stringify(transcript.map((m) => [m.role, m.text.length, m.text.slice(0, 40)])))
    .digest('hex')
    .slice(0, 20);
  return `${sessionId.slice(0, 8)}-${h}`;
}

export async function saveChatForward(record: ChatForwardRecord): Promise<boolean> {
  const redis = getVisitorRedis();
  if (!redis) return false;
  const key = recordKey(record.id);
  const score = Date.parse(record.createdAt) || Date.now();
  try {
    await redis.set(key, JSON.stringify(record), { ex: CHAT_FORWARD_TTL_SECONDS });
    await redis.zadd(INDEX_KEY, { score, member: record.id });
    // Trim oldest beyond cap
    const count = await redis.zcard(INDEX_KEY);
    if (typeof count === 'number' && count > MAX_INDEX) {
      await redis.zremrangebyrank(INDEX_KEY, 0, count - MAX_INDEX - 1);
    }
    if (record.status === 'failed') {
      await redis.sadd(PENDING_KEY, record.id);
    } else {
      await redis.srem(PENDING_KEY, record.id);
    }
    return true;
  } catch (err) {
    console.error('[chatForwardStore] save failed', err);
    return false;
  }
}

export async function markChatForwardSent(
  id: string,
  patch: Partial<Pick<ChatForwardRecord, 'sentAt' | 'error' | 'status'>> = {},
): Promise<void> {
  const redis = getVisitorRedis();
  if (!redis) return;
  try {
    const raw = await redis.get<string>(recordKey(id));
    if (!raw) return;
    const rec =
      typeof raw === 'string' ? (JSON.parse(raw) as ChatForwardRecord) : (raw as ChatForwardRecord);
    const next: ChatForwardRecord = {
      ...rec,
      status: patch.status ?? 'sent',
      sentAt: patch.sentAt ?? new Date().toISOString(),
      error: patch.error,
    };
    if (next.status === 'sent') delete next.error;
    await redis.set(recordKey(id), JSON.stringify(next), { ex: CHAT_FORWARD_TTL_SECONDS });
    if (next.status === 'failed') await redis.sadd(PENDING_KEY, id);
    else await redis.srem(PENDING_KEY, id);
  } catch (err) {
    console.error('[chatForwardStore] markSent failed', err);
  }
}

export async function getChatForward(id: string): Promise<ChatForwardRecord | null> {
  const redis = getVisitorRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(recordKey(id));
    if (!raw) return null;
    return typeof raw === 'string' ? (JSON.parse(raw) as ChatForwardRecord) : (raw as ChatForwardRecord);
  } catch {
    return null;
  }
}

export async function listChatForwards(opts: {
  status?: ChatForwardStatus | 'pending';
  limit?: number;
} = {}): Promise<ChatForwardRecord[]> {
  const redis = getVisitorRedis();
  if (!redis) return [];
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  try {
    let ids: string[] = [];
    if (opts.status === 'pending' || opts.status === 'failed') {
      const members = await redis.smembers(PENDING_KEY);
      ids = (members ?? []).map(String).slice(0, limit);
    } else {
      // Newest first
      const members = await redis.zrange(INDEX_KEY, 0, limit - 1, { rev: true });
      ids = (members ?? []).map(String);
    }
    const out: ChatForwardRecord[] = [];
    for (const id of ids) {
      const rec = await getChatForward(id);
      if (!rec) continue;
      if (opts.status && opts.status !== 'pending' && rec.status !== opts.status) continue;
      out.push(rec);
    }
    out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return out.slice(0, limit);
  } catch (err) {
    console.error('[chatForwardStore] list failed', err);
    return [];
  }
}

export async function countPendingChatForwards(): Promise<number> {
  const redis = getVisitorRedis();
  if (!redis) return 0;
  try {
    const n = await redis.scard(PENDING_KEY);
    return typeof n === 'number' ? n : 0;
  } catch {
    return 0;
  }
}
