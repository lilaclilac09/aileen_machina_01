/**
 * Durable log of agent chat transcript forwards to the owner inbox.
 *
 * Transcript + subject are AES-256-GCM encrypted at rest (PRIVATE_DATA_ENCRYPTION_KEY).
 * Missing key → do not persist plaintext. Email can still send.
 *
 * Degrade: if UPSTASH_* is missing, ops no-op (email still attempted).
 */

import { createHash } from 'crypto';
import { getVisitorRedis } from './visitorMemory';
import {
  decryptPrivateJson,
  encryptPrivateJson,
  isEncryptedBlob,
  logPrivateEncryptionMissing,
  privateEncryptionAvailable,
  type EncryptedBlob,
} from './server/crypto';

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

type ForwardSecret = {
  subject: string;
  transcript: ChatForwardMessage[];
};

type RedisForwardRow = {
  id: string;
  sessionId: string;
  status: ChatForwardStatus;
  createdAt: string;
  sentAt?: string;
  error?: string;
  referer?: string;
  ua?: string;
  enc?: EncryptedBlob;
  /** Legacy plaintext — read only. New writes never include these. */
  subject?: string;
  transcript?: ChatForwardMessage[];
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

export function encodeForwardRecord(record: ChatForwardRecord): RedisForwardRow | null {
  if (!privateEncryptionAvailable()) {
    logPrivateEncryptionMissing('chatForwardStore');
    return null;
  }
  let enc: EncryptedBlob;
  try {
    enc = encryptPrivateJson({
      subject: record.subject,
      transcript: record.transcript,
    } satisfies ForwardSecret);
  } catch (err) {
    console.error('[chatForwardStore] encrypt failed');
    void err;
    return null;
  }
  return {
    id: record.id,
    sessionId: record.sessionId,
    status: record.status,
    createdAt: record.createdAt,
    sentAt: record.sentAt,
    error: record.error,
    referer: record.referer,
    ua: record.ua,
    enc,
  };
}

export function decodeForwardRecord(raw: unknown): ChatForwardRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as RedisForwardRow;
  if (typeof row.id !== 'string' || typeof row.sessionId !== 'string') return null;

  const meta = {
    id: row.id,
    sessionId: row.sessionId,
    status: row.status,
    createdAt: row.createdAt,
    sentAt: row.sentAt,
    error: row.error,
    referer: row.referer,
    ua: row.ua,
  };

  if (isEncryptedBlob(row.enc)) {
    try {
      const secret = decryptPrivateJson<ForwardSecret>(row.enc);
      if (!Array.isArray(secret.transcript) || typeof secret.subject !== 'string') {
        return null;
      }
      return { ...meta, subject: secret.subject, transcript: secret.transcript };
    } catch {
      console.error('[chatForwardStore] decrypt failed', { id: row.id });
      return {
        ...meta,
        subject: '(encrypted)',
        transcript: [],
      };
    }
  }

  if (Array.isArray(row.transcript) && typeof row.subject === 'string') {
    return { ...meta, subject: row.subject, transcript: row.transcript };
  }

  return null;
}

function parseRedisValue(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

export async function saveChatForward(record: ChatForwardRecord): Promise<boolean> {
  const redis = getVisitorRedis();
  if (!redis) return false;
  const stored = encodeForwardRecord(record);
  if (!stored) return false;
  const key = recordKey(record.id);
  const score = Date.parse(record.createdAt) || Date.now();
  try {
    await redis.set(key, JSON.stringify(stored), { ex: CHAT_FORWARD_TTL_SECONDS });
    await redis.zadd(INDEX_KEY, { score, member: record.id });
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
    const parsed = parseRedisValue(raw);
    if (!parsed || typeof parsed !== 'object') return;
    const row = { ...(parsed as RedisForwardRow) };
    row.status = patch.status ?? 'sent';
    row.sentAt = patch.sentAt ?? new Date().toISOString();
    if (patch.error) row.error = patch.error;
    else if (row.status === 'sent') delete row.error;
    await redis.set(recordKey(id), JSON.stringify(row), { ex: CHAT_FORWARD_TTL_SECONDS });
    if (row.status === 'failed') await redis.sadd(PENDING_KEY, id);
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
    return decodeForwardRecord(parseRedisValue(raw));
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
