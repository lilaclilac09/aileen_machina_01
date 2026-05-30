import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, OWNER_MAX_AGE, createOwnerSession, safeEqual } from '../../../../lib/auth';

/**
 * Owner bypass. Visit /api/auth/owner?key=<OWNER_KEY> once and you get a
 * 1-year session — so the owner never gets stopped by her own blog gate.
 * Bookmark the link; no email, no wallet. If OWNER_KEY isn't set, or the key
 * is wrong, it just bounces to /unlock like any other visitor.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || '';
  const expected = process.env.OWNER_KEY || '';

  const url = req.nextUrl.clone();
  url.search = '';

  if (!expected || key.length !== expected.length || !safeEqual(key, expected)) {
    url.pathname = '/unlock';
    url.search = '?error=denied';
    return NextResponse.redirect(url);
  }

  url.pathname = '/';
  const res = NextResponse.redirect(url);
  res.cookies.set(SESSION_COOKIE, await createOwnerSession(), {
    path: '/',
    maxAge: OWNER_MAX_AGE,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  return res;
}
