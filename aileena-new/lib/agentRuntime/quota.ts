/**
 * Redis daily chat counter (P1.3). Same 20/day as the cookie quota
 * (CHAT_DAILY_LIMIT, unchanged). The key is a salted, daily-rotated HMAC of
 * visitor id + IP: no raw IP is stored. Charged only when a turn commits
 * (model finished with stop/length), so failed or cancelled turns are free.
 * Without Redis the existing signed-cookie quota applies unchanged.
 */
import { CHAT_DAILY_LIMIT } from '../chatQuota';
import { clientIpTransient, dailyVisitorHash } from '../agentEngage/visitorHash';
import { getVisitorRedis } from '../visitorMemory';
import { runtimeKv } from './kv';

export const QUOTA_TTL_SEC = 60 * 60 * 36;

export function redisQuotaEnabled(): boolean {
  if (process.env.RUNTIME_KV === 'memory') return true;
  return getVisitorRedis() !== null;
}

export async function quotaKeyFor(req: Request, visitorId: string, day: string): Promise<string> {
  const at = Date.parse(`${day}T12:00:00.000Z`);
  const h = await dailyVisitorHash({ ip: clientIpTransient(req), extra: visitorId, purpose: 'chat-quota' }, Number.isFinite(at) ? at : Date.now());
  return `quota:v1:${day}:${h}`;
}

export async function readRedisQuota(key: string): Promise<number> {
  const n = await runtimeKv().get<number | string>(key);
  const v = typeof n === 'string' ? Number(n) : n;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export async function chargeRedisQuota(key: string): Promise<number> {
  return runtimeKv().incr(key, QUOTA_TTL_SEC);
}

export function quotaExhausted(count: number): boolean {
  return count >= CHAT_DAILY_LIMIT;
}
