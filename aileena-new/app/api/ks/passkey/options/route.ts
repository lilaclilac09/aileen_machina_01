import { NextResponse } from 'next/server';
import { createWebauthnChallenge } from '@/lib/auth';
import { KS_PRF_FIRST } from '@/lib/keyshield/constants';
import { rpIdFromHost } from '@/lib/passkey/webauthn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CH_COOKIE = '__ks_webauthn_ch';

function hostOf(req: Request): string {
  return req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { mode?: string };
  const mode = body.mode === 'register' ? 'register' : 'unlock';
  const { token, challenge } = await createWebauthnChallenge();
  const host = hostOf(req);
  const rpId = rpIdFromHost(host);
  const res = NextResponse.json({
    ok: true,
    challenge,
    rpId,
    rpName: 'KeyShield',
    userVerified: true,
    method: 'keyshield',
    prfFirst: KS_PRF_FIRST,
    mode,
    // Discoverable resident keys — do not dump every public vault credential.
    allowCredentials: [],
  });
  res.cookies.set(CH_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 300,
    secure: new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https',
  });
  return res;
}
