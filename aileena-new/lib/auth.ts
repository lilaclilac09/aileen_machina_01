/**
 * Stateless auth primitives for the blog gate.
 *
 * No database: every token is a base64url(JSON) payload plus an HMAC-SHA256
 * signature over it (same trick as the chat quota cookie). Works in both the
 * Edge middleware and the Node API routes because it only uses Web Crypto.
 *
 *   token  = <base64url(payload)>.<base64url(hmac)>
 *
 * Three payload kinds, tagged by `t`:
 *   - 'sess'  long-lived session, set after a successful login   (cookie)
 *   - 'magic' short-lived email magic-link token                 (emailed)
 *   - 'nonce' short-lived wallet challenge the user signs         (issued)
 */

export const SESSION_COOKIE = '__aileena_pass';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const MAGIC_TTL_MS = 30 * 60 * 1000; // 30 min
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 min

export const WALLET_LOGIN_PREFIX =
  'Sign in to aileena.xyz — this proves you own this wallet. No transaction, no fees.\n\nchallenge: ';

function secret(): string {
  return process.env.AUTH_SECRET || process.env.CHAT_QUOTA_SECRET || 'aileena-dev-secret';
}

/* ── base64url <-> bytes / json ── */
function b64urlFromBytes(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bytesFromB64url(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function encodeJSON(obj: unknown): string {
  return b64urlFromBytes(new TextEncoder().encode(JSON.stringify(obj)));
}
function decodeJSON<T>(enc: string): T {
  return JSON.parse(new TextDecoder().decode(bytesFromB64url(enc))) as T;
}

/* ── HMAC ── */
async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return b64urlFromBytes(new Uint8Array(sig));
}
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signToken(payload: object): Promise<string> {
  const enc = encodeJSON(payload);
  return `${enc}.${await hmac(enc)}`;
}
async function readToken<T>(token: string | undefined | null): Promise<T | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const enc = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqual(sig, await hmac(enc))) return null;
  try {
    return decodeJSON<T>(enc);
  } catch {
    return null;
  }
}

/* ── Session ── */
type Session = { t: 'sess'; sub: string; via: 'email' | 'wallet'; exp: number };

export async function createSession(sub: string, via: 'email' | 'wallet'): Promise<string> {
  return signToken({ t: 'sess', sub, via, exp: Date.now() + SESSION_MAX_AGE * 1000 } satisfies Session);
}
export async function readSession(
  token: string | undefined | null,
): Promise<{ sub: string; via: 'email' | 'wallet' } | null> {
  const s = await readToken<Session>(token);
  if (!s || s.t !== 'sess' || typeof s.exp !== 'number' || s.exp < Date.now()) return null;
  return { sub: s.sub, via: s.via };
}

/* ── Email magic-link token ── */
type Magic = { t: 'magic'; email: string; exp: number };

export async function createMagicToken(email: string): Promise<string> {
  return signToken({ t: 'magic', email, exp: Date.now() + MAGIC_TTL_MS } satisfies Magic);
}
export async function readMagicToken(token: string | undefined | null): Promise<string | null> {
  const m = await readToken<Magic>(token);
  if (!m || m.t !== 'magic' || typeof m.exp !== 'number' || m.exp < Date.now()) return null;
  return m.email;
}

/* ── Wallet challenge nonce ── */
type Nonce = { t: 'nonce'; n: string; exp: number };

export async function createNonceToken(): Promise<string> {
  const rnd = crypto.getRandomValues(new Uint8Array(16));
  return signToken({ t: 'nonce', n: b64urlFromBytes(rnd), exp: Date.now() + NONCE_TTL_MS } satisfies Nonce);
}
export async function isNonceValid(token: string | undefined | null): Promise<boolean> {
  const n = await readToken<Nonce>(token);
  return !!(n && n.t === 'nonce' && typeof n.exp === 'number' && n.exp >= Date.now());
}

export function cookieValid(): string {
  return SESSION_COOKIE;
}

/* ── base58 decode (Solana addresses + signatures) ── */
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58Decode(str: string): Uint8Array {
  const bytes: number[] = [0];
  for (const ch of str) {
    const value = B58.indexOf(ch);
    if (value === -1) throw new Error('invalid base58 char');
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // leading zeros
  for (let k = 0; k < str.length && str[k] === '1'; k++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}
