import { NextResponse } from 'next/server';
import { ksSessionOf } from '@/lib/keyshield/request';
import { clearKsSessionCookie } from '@/lib/keyshield/session';
import { revokeKsAuthSession } from '@/lib/keyshield/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await ksSessionOf(req);
  if (session?.sid && session.vaultId) {
    await revokeKsAuthSession(session.sid, session.vaultId);
  }
  const res = NextResponse.json({ ok: true });
  clearKsSessionCookie(res);
  return res;
}
