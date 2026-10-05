import { NextResponse } from 'next/server';
import { ksSessionOf } from '@/lib/keyshield/request';
import { listKsAuthSessions, revokeKsAuthSession } from '@/lib/keyshield/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const rows = await listKsAuthSessions(session.vaultId);
  return NextResponse.json({
    ok: true,
    current: session.sid || null,
    sessions: rows.map((row) => ({
      id: row.id,
      via: row.via,
      sub: row.sub,
      ua: row.ua,
      createdAt: row.createdAt,
      revoked: !!row.revoked,
      current: row.id === session.sid,
    })),
  });
}

export async function POST(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: 'id' }, { status: 400 });
  const ok = await revokeKsAuthSession(body.id, session.vaultId);
  if (!ok) return NextResponse.json({ error: 'unknown' }, { status: 404 });
  return NextResponse.json({ ok: true, id: body.id });
}
