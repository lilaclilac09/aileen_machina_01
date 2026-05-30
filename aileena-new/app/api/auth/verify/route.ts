import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSession, readMagicToken } from '../../../../lib/auth';

/**
 * Step 2 of email login: the magic link lands here. Validate the token,
 * set the long-lived session cookie, and bounce to where they were going.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const rawNext = req.nextUrl.searchParams.get('next') || '/blog/nokia-dci';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/blog/nokia-dci';

  const email = await readMagicToken(token);
  if (!email) {
    const url = req.nextUrl.clone();
    url.pathname = '/unlock';
    url.search = '?error=expired';
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = next.split('?')[0];
  url.search = next.includes('?') ? `?${next.split('?').slice(1).join('?')}` : '';

  const res = NextResponse.redirect(url);
  res.cookies.set(SESSION_COOKIE, await createSession(email, 'email'), {
    path: '/',
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  return res;
}
