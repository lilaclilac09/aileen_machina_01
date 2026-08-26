import { NextResponse } from 'next/server';
import { createWebauthnChallenge } from '@/lib/auth';
import { isVercelProduction } from '@/lib/computer/flag';
import { hasPasskeys, listPasskeys } from '@/lib/passkey/store';
import { rpIdFromHost } from '@/lib/passkey/webauthn';
import { requireOwnerFromRequest } from '@/lib/owner-gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CH_COOKIE = '__aileena_webauthn_ch';

function hostOf(req: Request): string {
  return req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { mode?: string };
  const mode = body.mode === 'register' ? 'register' : 'unlock';
  const owner = await requireOwnerFromRequest(req);
  if (mode === 'register') {
    if (hasPasskeys() && !owner) {
      return NextResponse.json({ error: 'enrolled' }, { status: 403 });
    }
    if (isVercelProduction() && !owner && hasPasskeys()) {
      return NextResponse.json({ error: 'enrolled' }, { status: 403 });
    }
    if (isVercelProduction() && !owner && !hasPasskeys()) {
      return NextResponse.json({ error: 'bootstrap_off' }, { status: 403 });
    }
  }

  const { token, challenge } = await createWebauthnChallenge();
  const host = hostOf(req);
  const rpId = rpIdFromHost(host);
  const res = NextResponse.json({
    ok: true,
    challenge,
    rpId,
    rpName: 'aileena.xyz',
    userVerified: true,
    mode,
    allowCredentials:
      mode === 'unlock'
        ? listPasskeys().map((k) => ({ type: 'public-key' as const, id: k.id }))
        : [],
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
