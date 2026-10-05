import { NextResponse } from 'next/server';
import { ksSessionOf } from '@/lib/keyshield/request';
import { deleteKsPasskey, getKsPasskey, listKsPasskeysByVault } from '@/lib/keyshield/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const keys = await listKsPasskeysByVault(session.vaultId);
  return NextResponse.json({
    ok: true,
    passkeys: keys.map((k) => ({
      id: k.id,
      label: k.label || 'device',
      createdAt: k.createdAt,
    })),
  });
}

export async function DELETE(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  const stored = await getKsPasskey(id);
  if (!stored || stored.vaultId !== session.vaultId) {
    return NextResponse.json({ error: 'unknown' }, { status: 404 });
  }
  await deleteKsPasskey(id);
  return NextResponse.json({ ok: true });
}
