import { NextResponse } from 'next/server';
import { createNonceToken } from '@/lib/auth';
import { KS_WALLET_LOGIN_PREFIX } from '@/lib/keyshield/constants';
import { ksSecure } from '@/lib/keyshield/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CH_COOKIE = '__ks_wallet_ch';

export async function GET(req: Request) {
  const nonce = await createNonceToken();
  const challenge = `${KS_WALLET_LOGIN_PREFIX}${nonce}`;
  const res = NextResponse.json({
    ok: true,
    challenge,
    wallets: ['Phantom', 'Solflare', 'Backpack', 'OKX'],
  });
  res.cookies.set(CH_COOKIE, nonce, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 300,
    secure: ksSecure(req),
  });
  return res;
}
