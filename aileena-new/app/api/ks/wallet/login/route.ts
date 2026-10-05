import { NextResponse } from 'next/server';
import { isNonceValid } from '@/lib/auth';
import { KS_WALLET_LOGIN_PREFIX } from '@/lib/keyshield/constants';
import { verifySolanaWallet } from '@/lib/keyshield/ed25519';
import { mintKsSession } from '@/lib/keyshield/request';
import { cookieFromRequest } from '@/lib/keyshield/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CH_COOKIE = '__ks_wallet_ch';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    walletAddress?: string;
    signature?: string;
    challenge?: string;
    vaultId?: string;
  } | null;
  const address = body?.walletAddress?.trim() || '';
  const signature = body?.signature || '';
  const challenge = body?.challenge || '';
  const vaultId = body?.vaultId?.trim() || '';
  if (!address || !signature || !challenge || !vaultId) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (!challenge.startsWith(KS_WALLET_LOGIN_PREFIX)) {
    return NextResponse.json({ error: 'challenge' }, { status: 400 });
  }
  const nonce = challenge.slice(KS_WALLET_LOGIN_PREFIX.length);
  const cookieNonce = cookieFromRequest(req, CH_COOKIE);
  if (!cookieNonce || cookieNonce !== nonce || !(await isNonceValid(nonce))) {
    return NextResponse.json({ error: 'challenge' }, { status: 400 });
  }
  if (!verifySolanaWallet(challenge, signature, address)) {
    return NextResponse.json({ error: 'verify' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, via: 'wallet', vaultId, walletAddress: address });
  await mintKsSession(req, res, vaultId, { via: 'wallet', sub: address });
  res.cookies.set(CH_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
