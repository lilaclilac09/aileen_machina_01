import { NextResponse } from 'next/server';
import { WALLET_LOGIN_PREFIX, createNonceToken } from '../../../../lib/auth';

/**
 * Issues a short-lived, signed challenge for Solana wallet login. The client
 * has the wallet sign `message`; we re-verify the nonce + signature in
 * /api/auth/wallet. Stateless — the nonce carries its own expiry + HMAC.
 */
export const runtime = 'nodejs';

export async function GET() {
  const nonce = await createNonceToken();
  return NextResponse.json({ nonce, message: WALLET_LOGIN_PREFIX + nonce });
}
