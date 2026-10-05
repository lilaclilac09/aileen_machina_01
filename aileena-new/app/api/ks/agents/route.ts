import { NextResponse } from 'next/server';
import { KS_MAX_AGENTS } from '@/lib/keyshield/constants';
import { ksSessionOf } from '@/lib/keyshield/request';
import { listKsAgents, putKsAgents } from '@/lib/keyshield/store';
import { b64urlFromBuf } from '@/lib/passkey/b64';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  return NextResponse.json({ ok: true, agents: await listKsAgents(session.vaultId) });
}

export async function POST(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { name?: string; pubkey?: string } | null;
  const name = body?.name?.trim() || '';
  const pubkey = body?.pubkey?.trim() || '';
  if (!name || !pubkey) return NextResponse.json({ error: 'agent' }, { status: 400 });
  if (name.length > 64 || pubkey.length > 128) {
    return NextResponse.json({ error: 'size' }, { status: 400 });
  }
  const current = await listKsAgents(session.vaultId);
  if (current.length >= KS_MAX_AGENTS) return NextResponse.json({ error: 'full' }, { status: 400 });
  const next = [
    {
      id: b64urlFromBuf(crypto.getRandomValues(new Uint8Array(8)).buffer),
      name,
      pubkey,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];
  await putKsAgents(session.vaultId, next);
  return NextResponse.json({ ok: true, agents: next });
}

export async function DELETE(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id' }, { status: 400 });
  const next = (await listKsAgents(session.vaultId)).filter((row) => row.id !== id);
  await putKsAgents(session.vaultId, next);
  return NextResponse.json({ ok: true, agents: next });
}
