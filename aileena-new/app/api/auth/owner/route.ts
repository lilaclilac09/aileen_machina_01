import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, OWNER_MAX_AGE, createOwnerSession, ownerSecretMatches } from '../../../../lib/auth';

/**
 * Owner door. POST a form from /council or /cabinet — key stays out of the
 * URL. GET must not accept ?key= (Referer / access logs / history).
 *
 * JSON POST (daily / proof corner unlock) returns { ok } and sets the same
 * httpOnly cookie. Missing OWNER_RIDDLE/OWNER_KEY or empty key never succeeds.
 *
 * One good enter sets a 1-year httpOnly cookie. Wrong form POST key returns to
 * the room with ?error=denied — not the public wallet unlock page.
 */
export const runtime = 'nodejs';

const OWNER_ROOMS = new Set(['/council', '/cabinet', '/inbox', '/daily', '/evolution', '/proof']);

function safeNextPath(raw: string | null): string {
  if (!raw) return '/council';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/council';
  if (raw.length > 200) return '/council';
  return raw;
}

function denyPath(nextPath: string): string {
  return OWNER_ROOMS.has(nextPath) ? nextPath : '/unlock';
}

function cookieSecure(req: NextRequest): boolean {
  return req.nextUrl.protocol === 'https:' || process.env.VERCEL === '1';
}

async function setOwnerCookie(res: NextResponse, req: NextRequest) {
  res.cookies.set(SESSION_COOKIE, await createOwnerSession(), {
    path: '/',
    maxAge: OWNER_MAX_AGE,
    httpOnly: true,
    secure: cookieSecure(req),
    sameSite: 'lax',
  });
}

async function finishUnlock(req: NextRequest, key: string, nextRaw: string | null) {
  const nextPath = safeNextPath(nextRaw);
  const url = req.nextUrl.clone();
  url.search = '';

  if (!ownerSecretMatches(key)) {
    url.pathname = denyPath(nextPath);
    url.search = '?error=denied';
    return NextResponse.redirect(url, 303);
  }

  url.pathname = nextPath;
  const res = NextResponse.redirect(url, 303);
  await setOwnerCookie(res, req);
  return res;
}

async function finishUnlockJson(req: NextRequest, key: string) {
  if (!ownerSecretMatches(key)) {
    return NextResponse.json({ ok: false, error: 'Nope.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  await setOwnerCookie(res, req);
  return res;
}

export async function GET() {
  return NextResponse.json({ error: 'denied' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const ctype = req.headers.get('content-type') || '';
  if (ctype.includes('application/json')) {
    const body = (await req.json().catch(() => null)) as { key?: unknown } | null;
    const key = typeof body?.key === 'string' ? body.key : '';
    return finishUnlockJson(req, key);
  }
  const form = await req.formData().catch(() => null);
  const key = String(form?.get('key') ?? '');
  const nextRaw = String(form?.get('next') ?? '') || null;
  return finishUnlock(req, key, nextRaw);
}
