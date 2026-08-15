/**
 * Owner unlimited console chat.
 *
 * Visitors stay at 20 messages/day. Recognized owner emails (OWNER_EMAILS /
 * contact inbox env — no email is hardcoded) mint a long-lived signed cookie
 * that skips the chat quota. Blog owner session (__aileena_pass via=owner)
 * also unlocks chat.
 */

import { OWNER_MAX_AGE, SESSION_COOKIE, readSession } from './auth';

export const OWNER_CHAT_COOKIE = '__aileena_owner_chat';

type OwnerChatPayload = { t: 'owner_chat'; email: string; exp: number };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function secret(): string {
  return process.env.AUTH_SECRET || process.env.CHAT_QUOTA_SECRET || '';
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
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret() || 'dev-owner-chat'),
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

/** Owner allow-list: OWNER_EMAILS + contact To env. No email is hardcoded. */
export function isOwnerEmail(email: string): boolean {
  const n = normalizeEmail(email);
  if (!n || !n.includes('@')) return false;

  const fromEnv = (process.env.OWNER_EMAILS || '')
    .split(/[,;\s]+/)
    .map(normalizeEmail)
    .filter(Boolean);

  const fromContact = [
    process.env.CONTACT_TO,
    process.env.CONTACT_TO_EMAIL,
    process.env.LEAD_INBOX,
    process.env.NOTIFY_CC_EMAIL,
  ]
    .filter((s): s is string => typeof s === 'string' && s.includes('@'))
    .map(normalizeEmail);

  const allow = new Set<string>([...fromEnv, ...fromContact]);
  return allow.has(n);
}

export async function createOwnerChatToken(email: string): Promise<string> {
  const payload: OwnerChatPayload = {
    t: 'owner_chat',
    email: normalizeEmail(email),
    exp: Date.now() + OWNER_MAX_AGE * 1000,
  };
  const enc = b64urlFromBytes(new TextEncoder().encode(JSON.stringify(payload)));
  return `${enc}.${await hmac(enc)}`;
}

export async function readOwnerChatToken(
  token: string | undefined | null,
): Promise<{ email: string } | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const enc = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqual(sig, await hmac(enc))) return null;
  try {
    const raw = JSON.parse(new TextDecoder().decode(bytesFromB64url(enc))) as Partial<OwnerChatPayload>;
    if (raw.t !== 'owner_chat' || typeof raw.email !== 'string' || typeof raw.exp !== 'number') {
      return null;
    }
    if (raw.exp < Date.now()) return null;
    if (!isOwnerEmail(raw.email)) return null;
    return { email: normalizeEmail(raw.email) };
  } catch {
    return null;
  }
}

function cookieValue(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** True when request carries owner-chat cookie or blog owner session. */
export async function hasOwnerUnlimitedChat(req: Request): Promise<boolean> {
  try {
    const cookieHeader = req.headers.get('cookie') ?? '';

    const ownerChat = cookieValue(cookieHeader, OWNER_CHAT_COOKIE);
    if (ownerChat && (await readOwnerChatToken(ownerChat))) return true;

    const session = cookieValue(cookieHeader, SESSION_COOKIE);
    const sess = await readSession(session);
    if (sess?.via === 'owner' || sess?.sub === 'owner') return true;

    return false;
  } catch {
    // AUTH_SECRET missing / crypto failure must not break visitor chat.
    return false;
  }
}

export function buildOwnerChatSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${OWNER_CHAT_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${OWNER_MAX_AGE}; HttpOnly${secure}; SameSite=Lax`;
}
