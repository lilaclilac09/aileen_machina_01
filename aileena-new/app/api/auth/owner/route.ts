import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, OWNER_MAX_AGE, createOwnerSession, safeEqual } from '../../../../lib/auth';

/**
 * Owner door. POST a form from /council or /cabinet — key stays out of the
 * URL. GET must not accept ?key= (Referer / access logs / history).
 *
 * One good enter sets a 1-year httpOnly cookie. Wrong POST key returns to
 * the room with ?error=denied — not the public wallet unlock page.
 * Missing OWNER_KEY or empty key never succeeds.
 */
export const runtime = 'nodejs';

const OWNER_ROOMS = new Set(['/council', '/cabinet', '/inbox', '/daily', '/two-lines']);

function safeNextPath(raw: string | null): string {
  if (!raw) return '/council';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/council';
  if (raw.length > 200) return '/council';
  return raw;
}

function denyPath(nextPath: string): string {
  return OWNER_ROOMS.has(nextPath) ? nextPath : '/unlock';
}

async function finishUnlock(req: NextRequest, key: string, nextRaw: string | null) {
  const expected = process.env.OWNER_KEY || '';
  const nextPath = safeNextPath(nextRaw);
  const url = req.nextUrl.clone();
  url.search = '';

  if (!expected || key.length !== expected.length || !safeEqual(key, expected)) {
    url.pathname = denyPath(nextPath);
    url.search = '?error=denied';
    return NextResponse.redirect(url, 303);
  }

  url.pathname = nextPath;
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(SESSION_COOKIE, await createOwnerSession(), {
    path: '/',
    maxAge: OWNER_MAX_AGE,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  return res;
}

export async function GET() {
  return NextResponse.json({ error: 'denied' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const key = String(form?.get('key') ?? '');
  const nextRaw = String(form?.get('next') ?? '') || null;
  return finishUnlock(req, key, nextRaw);
}
