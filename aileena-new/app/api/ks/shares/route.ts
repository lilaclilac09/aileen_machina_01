import { NextResponse } from 'next/server';
import { ksSessionOf } from '@/lib/keyshield/request';
import { listKsShares, putKsShares } from '@/lib/keyshield/store';
import { b64urlFromBuf } from '@/lib/passkey/b64';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  return NextResponse.json({ ok: true, shares: await listKsShares(session.vaultId) });
}

export async function POST(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    entryId?: string;
    recipient?: string;
    expires?: string;
  } | null;
  const entryId = body?.entryId?.trim() || '';
  const recipient = body?.recipient?.trim() || '';
  if (!entryId || !recipient) return NextResponse.json({ error: 'share' }, { status: 400 });
  if (recipient === session.sub) {
    return NextResponse.json({ error: 'self' }, { status: 400 });
  }
  const current = await listKsShares(session.vaultId);
  const next = [
    {
      id: b64urlFromBuf(crypto.getRandomValues(new Uint8Array(8)).buffer),
      entryId,
      recipient,
      expires: body?.expires || undefined,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];
  await putKsShares(session.vaultId, next);
  return NextResponse.json({ ok: true, shares: next });
}

export async function DELETE(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  const next = (await listKsShares(session.vaultId)).filter((row) => row.id !== id);
  await putKsShares(session.vaultId, next);
  return NextResponse.json({ ok: true, shares: next });
}
