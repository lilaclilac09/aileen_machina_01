import { NextResponse } from 'next/server';
import { b64urlFromBuf } from '../passkey/b64';
import {
  applyKsSessionCookie,
  bearerFromRequest,
  cookieFromRequest,
  createKsSession,
  KS_SESSION_COOKIE,
  readKsSession,
  type KsSession,
  type KsSessionVia,
} from './session';
import { getKsAuthSession, putKsAuthSession } from './store';
import type { KsAuthSession } from './types';

export async function ksSessionOf(req: Request): Promise<KsSession | null> {
  const cookie = cookieFromRequest(req, KS_SESSION_COOKIE);
  const bearer = bearerFromRequest(req);
  const session = (await readKsSession(cookie)) || (await readKsSession(bearer));
  if (!session) return null;
  if (session.sid) {
    const row = await getKsAuthSession(session.sid);
    if (!row || row.revoked || row.vaultId !== session.vaultId) return null;
  }
  return session;
}

export async function mintKsSession(
  req: Request,
  res: NextResponse,
  vaultId: string,
  extra: { via: KsSessionVia; sub: string },
): Promise<KsAuthSession> {
  const sid = b64urlFromBuf(crypto.getRandomValues(new Uint8Array(12)).buffer);
  const row: KsAuthSession = {
    id: sid,
    vaultId,
    via: extra.via,
    sub: extra.sub,
    ua: (req.headers.get('user-agent') || 'unknown').slice(0, 180),
    createdAt: new Date().toISOString(),
  };
  await putKsAuthSession(row);
  const token = await createKsSession(vaultId, { via: extra.via, sub: extra.sub, sid });
  applyKsSessionCookie(req, res, token);
  return row;
}
