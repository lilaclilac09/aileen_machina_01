import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, OWNER_MAX_AGE, createOwnerSession, safeEqual } from '../../../../lib/auth';

/**
 * Owner bypass. Visit /api/auth/owner?key=<OWNER_KEY>&next=/inbox once and you
 * get a 1-year session — so the owner never gets stopped by her own blog gate
 * (or chat inbox). Bookmark the link; no email, no wallet. If OWNER_KEY isn't
 * set, or the key is wrong, it just bounces to /unlock like any other visitor.
 */
export const runtime = 'nodejs';

function safeNextPath(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  // Stay on-site; allow /inbox and blog paths.
  if (raw.length > 200) return '/';
  return raw;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || '';
  const expected = process.env.OWNER_KEY || '';
  const nextPath = safeNextPath(req.nextUrl.searchParams.get('next'));

  const url = req.nextUrl.clone();
  url.search = '';

  if (!expected || key.length !== expected.length || !safeEqual(key, expected)) {
    url.pathname = '/unlock';
    url.search = '?error=denied';
    return NextResponse.redirect(url);
  }

  url.pathname = nextPath;
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
