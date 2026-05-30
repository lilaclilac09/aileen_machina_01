import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession } from './lib/auth';

/**
 * Blog gate. Every /blog/* page requires a valid login session.
 * No session → bounce to /unlock with ?next=<path> so we can return them
 * after they authenticate (email magic-link or Solana wallet).
 *
 * This agent/site isn't a free public service — to read, you register.
 */
export async function proxy(req: NextRequest) {
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  const next = url.pathname + url.search;
  url.pathname = '/unlock';
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Gate all blog article pages. (API routes, assets, and the rest of the
  // marketing site stay public.)
  matcher: ['/blog/:path*'],
};
