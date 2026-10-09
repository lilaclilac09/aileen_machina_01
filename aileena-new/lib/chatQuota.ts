/**
 * Per-visitor daily rate limit via a signed cookie.
 * Same 20/day for chat and Browser Use prepare. Owner session skips it.
 */

export const CHAT_DAILY_LIMIT = 20;
export const QUOTA_COOKIE = '__aileena_quota';
export const QUOTA_EXHAUSTED_MSG = `You've used today's ${CHAT_DAILY_LIMIT} messages. A fresh set lands tomorrow — see you then.`;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveQuotaDay(req: Request): string {
  const header = (req.headers.get('x-quota-day') ?? '').trim();
  const utc = utcDay();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(header)) return utc;
  const clientNoon = Date.parse(`${header}T12:00:00.000Z`);
  const utcNoon = Date.parse(`${utc}T12:00:00.000Z`);
  if (!Number.isFinite(clientNoon) || !Number.isFinite(utcNoon)) return utc;
  if (Math.abs(clientNoon - utcNoon) > 36 * 60 * 60 * 1000) return utc;
  return header;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return b64urlEncode(new Uint8Array(sig));
}

export type QuotaState = { date: string; count: number };

export async function readQuota(req: Request): Promise<QuotaState> {
  const today = resolveQuotaDay(req);
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${QUOTA_COOKIE}=([^;]+)`));
  if (!match) return { date: today, count: 0 };

  try {
    const raw = decodeURIComponent(match[1]);
    const dot = raw.indexOf('.');
    const encoded = dot === -1 ? raw : raw.slice(0, dot);
    const sig = dot === -1 ? '' : raw.slice(dot + 1);

    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    if (secret) {
      if (!sig) {
        console.warn('[chat] readQuota: cookie signature missing but CHAT_QUOTA_SECRET is set');
        return { date: today, count: 0 };
      }
      const expected = await hmac(encoded, secret);
      if (expected !== sig) {
        console.warn('[chat] readQuota: cookie signature mismatch');
        return { date: today, count: 0 };
      }
    }

    const decoded = JSON.parse(atob(encoded)) as Partial<QuotaState>;
    if (decoded.date !== today || typeof decoded.count !== 'number') {
      return { date: today, count: 0 };
    }
    return { date: decoded.date, count: Math.max(0, Math.min(decoded.count, 99)) };
  } catch (err) {
    console.error('[chat] readQuota: error parsing/verifying quota cookie', err);
    return { date: today, count: 0 };
  }
}

export async function buildQuotaCookie(state: QuotaState): Promise<string> {
  try {
    const encoded = btoa(JSON.stringify(state));
    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    const sig = secret ? await hmac(encoded, secret) : '';
    const value = sig ? `${encoded}.${sig}` : encoded;
    return `${QUOTA_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=90000; HttpOnly; Secure; SameSite=Strict`;
  } catch (err) {
    console.error('[chat] buildQuotaCookie: error building cookie', err);
    return '';
  }
}

/** One visitor turn (chat or Browser Use prepare). Owner unlimited skips the cookie. */
export async function takeVisitorChatTurn(
  req: Request,
  unlimited: boolean,
): Promise<
  | { ok: true; quota: QuotaState; cookie: string | null; remaining: string }
  | { ok: false; quota: QuotaState; cookie: string | null; remaining: '0' }
> {
  const quota = await readQuota(req);
  if (unlimited) {
    return { ok: true, quota, cookie: null, remaining: 'unlimited' };
  }
  if (quota.count >= CHAT_DAILY_LIMIT) {
    const cookie = await buildQuotaCookie(quota);
    return { ok: false, quota, cookie: cookie || null, remaining: '0' };
  }
  const next = { date: quota.date, count: quota.count + 1 };
  const cookie = await buildQuotaCookie(next);
  return {
    ok: true,
    quota: next,
    cookie: cookie || null,
    remaining: String(CHAT_DAILY_LIMIT - next.count),
  };
}
