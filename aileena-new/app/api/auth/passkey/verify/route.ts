import { NextResponse } from 'next/server';
import { SESSION_COOKIE, OWNER_MAX_AGE, createOwnerSession, readWebauthnChallenge } from '@/lib/auth';
import { isLocalExperimentUnlockAllowed, isVercelProduction } from '@/lib/computer/flag';
import { getPasskey, hasPasskeys, upsertPasskey } from '@/lib/passkey/store';
import { parseClientData, readCounter, userVerified, verifyEs256 } from '@/lib/passkey/webauthn';
import { bytesFromB64url } from '@/lib/passkey/b64';
import { requireOwnerFromRequest } from '@/lib/owner-gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CH_COOKIE = '__aileena_webauthn_ch';

function cookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie') || '';
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function originOf(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (new URL(req.url).protocol === 'https:' ? 'https' : 'http');
  return `${proto}://${host}`;
}

function setSession(req: Request, res: NextResponse) {
  const https =
    new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  return createOwnerSession().then((token) => {
    res.cookies.set(SESSION_COOKIE, token, {
      path: '/',
      maxAge: OWNER_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      secure: https,
    });
    res.cookies.set(CH_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  });
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

  const ch = await readWebauthnChallenge(cookie(req, CH_COOKIE));
  if (!ch) return NextResponse.json({ error: 'challenge' }, { status: 400 });

  const client = parseClientData(bytesFromB64url(body.clientDataJSON));
  if (client.challenge !== ch) return NextResponse.json({ error: 'challenge' }, { status: 400 });
  const origin = originOf(req);
  const originLocal =
    origin.replace('127.0.0.1', 'localhost') === client.origin.replace('127.0.0.1', 'localhost') ||
    client.origin === origin;
  if (!originLocal) return NextResponse.json({ error: 'origin' }, { status: 400 });

  const mode = body.mode === 'register' ? 'register' : 'unlock';
  const owner = await requireOwnerFromRequest(req);

  if (mode === 'register') {
    if (isVercelProduction() && !owner) {
      return NextResponse.json({ error: 'bootstrap_off' }, { status: 403 });
    }
    if (hasPasskeys() && !owner && !isLocalExperimentUnlockAllowed()) {
      return NextResponse.json({ error: 'enrolled' }, { status: 403 });
    }
    if (!body.publicKey) return NextResponse.json({ error: 'publicKey' }, { status: 400 });
    if (!body.sealIv || !body.sealCipher) return NextResponse.json({ error: 'seal' }, { status: 400 });
    if (client.type !== 'webauthn.create') return NextResponse.json({ error: 'type' }, { status: 400 });
    upsertPasskey({
      id: body.id,
      publicKeySpki: body.publicKey,
      counter: readCounter(bytesFromB64url(body.authenticatorData)),
      vaultId: body.vaultId,
      sealIv: body.sealIv,
      sealCipher: body.sealCipher,
      createdAt: new Date().toISOString(),
    });
    const res = NextResponse.json({ ok: true, owner: true, mode: 'register' });
    return setSession(req, res);
  }

  if (client.type !== 'webauthn.get') return NextResponse.json({ error: 'type' }, { status: 400 });
  const stored = getPasskey(body.id);
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
  upsertPasskey({ ...stored, counter });
  const res = NextResponse.json({ ok: true, owner: true, mode: 'unlock' });
  return setSession(req, res);
}
