import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, OWNER_MAX_AGE, createOwnerSession } from '../../../../../lib/auth';
import {
  isLocalExperimentUnlockAllowed,
  isVercelProduction,
} from '../../../../../lib/computer/flag';

/**
 * Local experiment door. Mints an owner session without a typed secret so
 * the prototype can be tested on localhost. 404 on Vercel Production.
 */
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ error: 'denied' }, { status: 404 });
}

export async function POST(req: NextRequest) {
  if (isVercelProduction() || !isLocalExperimentUnlockAllowed()) {
    return NextResponse.json({ error: 'denied' }, { status: 404 });
  }

  const host = req.headers.get('host') || req.nextUrl.host;
  const https = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  const res = NextResponse.redirect(`${https ? 'https' : 'http'}://${host}/?experiment=1`, 303);
  res.cookies.set(SESSION_COOKIE, await createOwnerSession(), {
    path: '/',
    maxAge: OWNER_MAX_AGE,
    httpOnly: true,
    secure: https,
    sameSite: 'lax',
  });
  return res;
}
