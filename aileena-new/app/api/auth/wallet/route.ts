import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  WALLET_LOGIN_PREFIX,
  base58Decode,
  createSession,
  isNonceValid,
} from '../../../../lib/auth';

/**
 * Solana wallet login (Sign-In-With-Solana style).
 *
 * The client connects a wallet, signs our challenge message, and posts the
 * signature here. We verify it was signed by the claimed address using
 * Node's built-in Ed25519 — no @solana/web3.js, no tweetnacl needed — then
 * mint a session and email the owner the wallet address.
 */
export const runtime = 'nodejs';

// SPKI DER header for a raw 32-byte Ed25519 public key.
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function verifyEd25519(message: string, signature: Buffer, publicKeyRaw: Uint8Array): boolean {
  if (publicKeyRaw.length !== 32 || signature.length !== 64) return false;
  const der = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyRaw)]);
  const key = crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
  return crypto.verify(null, Buffer.from(message, 'utf8'), key, signature);
}

export async function POST(req: NextRequest) {
  let body: { address?: unknown; signature?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const signatureB64 = typeof body.signature === 'string' ? body.signature : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (!address || !signatureB64 || !message) {
    return NextResponse.json({ error: 'Missing address, signature, or message.' }, { status: 400 });
  }
  if (!message.startsWith(WALLET_LOGIN_PREFIX)) {
    return NextResponse.json({ error: 'Bad challenge.' }, { status: 400 });
  }

  // The challenge we issued is the suffix after the prefix; it must still be valid.
  const nonce = message.slice(WALLET_LOGIN_PREFIX.length);
  if (!(await isNonceValid(nonce))) {
    return NextResponse.json({ error: 'Challenge expired — try again.' }, { status: 400 });
  }

  let ok = false;
  try {
    ok = verifyEd25519(message, Buffer.from(signatureB64, 'base64'), base58Decode(address));
  } catch {
    ok = false;
  }
  if (!ok) {
    return NextResponse.json({ error: 'Signature did not verify.' }, { status: 401 });
  }

  // Capture: tell the owner who just unlocked the writing.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'AILEENA MACHINA <onboarding@resend.dev>',
        to: 'rosazxc0915@gmail.com',
        subject: `[AILEENA] Blog login · wallet · ${address}`,
        text: `Wallet login.\nAddress: ${address}\nAt: ${new Date().toISOString()}`,
      });
    } catch {
      /* non-fatal */
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(address, 'wallet'), {
    path: '/',
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  return res;
}
