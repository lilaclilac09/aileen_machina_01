import { NextResponse } from 'next/server';
import { readWebauthnChallenge } from '@/lib/auth';
import { cookieFromRequest } from '@/lib/keyshield/session';
import { mintKsSession } from '@/lib/keyshield/request';
import { getKsPasskey, putKsPasskey } from '@/lib/keyshield/store';
import { bytesFromB64url } from '@/lib/passkey/b64';
import { parseClientData, readCounter, userVerified, verifyEs256 } from '@/lib/passkey/webauthn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CH_COOKIE = '__ks_webauthn_ch';

function originOf(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (new URL(req.url).protocol === 'https:' ? 'https' : 'http');
  return `${proto}://${host}`;
}

async function setSession(req: Request, res: NextResponse, vaultId: string, sub: string) {
  await mintKsSession(req, res, vaultId, { via: 'passkey', sub });
  res.cookies.set(CH_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    mode?: string;
    id?: string;
    clientDataJSON?: string;
    authenticatorData?: string;
    signature?: string;
    publicKey?: string;
    vaultId?: string;
    sealIv?: string;
    sealCipher?: string;
  } | null;
  if (!body?.id || !body.clientDataJSON || !body.authenticatorData) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (!body.vaultId) return NextResponse.json({ error: 'keyshield' }, { status: 400 });

  const ch = await readWebauthnChallenge(cookieFromRequest(req, CH_COOKIE));
  if (!ch) return NextResponse.json({ error: 'challenge' }, { status: 400 });

  const client = parseClientData(bytesFromB64url(body.clientDataJSON));
  if (client.challenge !== ch) return NextResponse.json({ error: 'challenge' }, { status: 400 });
  const origin = originOf(req);
  const originLocal =
    origin.replace('127.0.0.1', 'localhost') === client.origin.replace('127.0.0.1', 'localhost') ||
    client.origin === origin;
  if (!originLocal) return NextResponse.json({ error: 'origin' }, { status: 400 });

  const mode = body.mode === 'register' ? 'register' : 'unlock';

  if (mode === 'register') {
    if (!body.publicKey) return NextResponse.json({ error: 'publicKey' }, { status: 400 });
    if (!body.sealIv || !body.sealCipher) return NextResponse.json({ error: 'seal' }, { status: 400 });
    if (client.type !== 'webauthn.create') return NextResponse.json({ error: 'type' }, { status: 400 });
    await putKsPasskey({
      id: body.id,
      publicKeySpki: body.publicKey,
      counter: readCounter(bytesFromB64url(body.authenticatorData)),
      vaultId: body.vaultId,
      sealIv: body.sealIv,
      sealCipher: body.sealCipher,
      createdAt: new Date().toISOString(),
    });
    const res = NextResponse.json({ ok: true, mode: 'register', vaultId: body.vaultId });
    return setSession(req, res, body.vaultId, body.id);
  }

  if (client.type !== 'webauthn.get') return NextResponse.json({ error: 'type' }, { status: 400 });
  const stored = await getKsPasskey(body.id);
  if (!stored) return NextResponse.json({ error: 'unknown' }, { status: 401 });
  if (!stored.vaultId || stored.vaultId !== body.vaultId) {
    return NextResponse.json({ error: 'keyshield' }, { status: 401 });
  }
  if (!body.signature) return NextResponse.json({ error: 'signature' }, { status: 400 });
  const ok = verifyEs256({
    publicKeySpkiB64url: stored.publicKeySpki,
    authenticatorDataB64url: body.authenticatorData,
    clientDataJSONB64url: body.clientDataJSON,
    signatureB64url: body.signature,
  });
  if (!ok) return NextResponse.json({ error: 'verify' }, { status: 401 });
  const authData = bytesFromB64url(body.authenticatorData);
  if (!userVerified(authData)) return NextResponse.json({ error: 'uv' }, { status: 401 });
  const counter = readCounter(authData);
  if (counter < stored.counter) return NextResponse.json({ error: 'counter' }, { status: 401 });
  await putKsPasskey({ ...stored, counter });
  const res = NextResponse.json({ ok: true, mode: 'unlock', vaultId: body.vaultId });
  return setSession(req, res, body.vaultId, stored.id);
}
