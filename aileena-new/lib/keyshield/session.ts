/**
 * Public KeyShield vault session. Separate from owner `__aileena_pass`.
 * Payload is vaultId + door — never PRF or AES material.
 */

import { KS_SESSION_COOKIE } from './constants';
import type { KsSessionVia } from './types';

export { KS_SESSION_COOKIE };
export type { KsSessionVia };

const MAX_AGE = 60 * 60 * 24 * 30;
const CLI_MAX_AGE = 60 * 60 * 24;

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.CHAT_QUOTA_SECRET || '';
  if (s) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not configured');
  }
  return `dev-only-${process.env.USER || 'local'}`;
}

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

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return b64urlFromBytes(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Payload = {
  t: 'ks' | 'kscli';
  vaultId: string;
  exp: number;
  via?: KsSessionVia;
  sub?: string;
  sid?: string;
};

export type KsSession = {
  vaultId: string;
  via?: KsSessionVia;
  sub?: string;
  sid?: string;
  cli?: boolean;
};

export async function createKsSession(
  vaultId: string,
  extra: { via?: KsSessionVia; sub?: string; sid?: string; ttlSec?: number; cli?: boolean } = {},
): Promise<string> {
  const ttl = extra.ttlSec ?? (extra.cli ? CLI_MAX_AGE : MAX_AGE);
  const enc = b64urlFromBytes(new TextEncoder().encode(JSON.stringify({
    t: extra.cli ? 'kscli' : 'ks',
    vaultId,
    exp: Date.now() + ttl * 1000,
    via: extra.via,
    sub: extra.sub,
    sid: extra.sid,
  } satisfies Payload)));
  return `${enc}.${await hmac(enc)}`;
}

export async function readKsSession(token: string | undefined | null): Promise<KsSession | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const enc = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqual(sig, await hmac(enc))) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(bytesFromB64url(enc))) as Payload;
    if ((p.t !== 'ks' && p.t !== 'kscli') || typeof p.vaultId !== 'string' || !p.vaultId) return null;
    if (typeof p.exp !== 'number' || p.exp < Date.now()) return null;
    return {
      vaultId: p.vaultId,
      via: p.via,
      sub: p.sub,
      sid: p.sid,
      cli: p.t === 'kscli',
    };
  } catch {
    return null;
  }
}

export async function readKsVaultId(token: string | undefined | null): Promise<string | null> {
  const s = await readKsSession(token);
  return s?.vaultId ?? null;
}

export const KS_SESSION_MAX_AGE = MAX_AGE;
export const KS_CLI_MAX_AGE = CLI_MAX_AGE;

export function cookieFromRequest(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie') || '';
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function bearerFromRequest(req: Request): string | null {
  const raw = req.headers.get('authorization') || '';
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function ksSecure(req: Request): boolean {
  return new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
}

export function applyKsSessionCookie(req: Request, res: { cookies: { set: (name: string, value: string, opts: object) => void } }, token: string, maxAge = MAX_AGE) {
  res.cookies.set(KS_SESSION_COOKIE, token, {
    path: '/',
    maxAge,
    httpOnly: true,
    sameSite: 'lax',
    secure: ksSecure(req),
  });
}

export function clearKsSessionCookie(res: { cookies: { set: (name: string, value: string, opts: object) => void } }) {
  res.cookies.set(KS_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}
