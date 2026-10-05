import { NextResponse } from 'next/server';
import { KS_MAX_TRUST } from '@/lib/keyshield/constants';
import { ksSessionOf } from '@/lib/keyshield/request';
import { listKsTrust, putKsTrust } from '@/lib/keyshield/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hostOk(host: string): boolean {
  return /^[a-z0-9.-]{3,80}$/.test(host) && host.includes('.');
}

export async function GET(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  return NextResponse.json({ ok: true, domains: await listKsTrust(session.vaultId) });
}

export async function POST(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { host?: string; thresholdUsd?: number } | null;
  const host = (body?.host || '').trim().toLowerCase();
  const thresholdUsd = Number(body?.thresholdUsd);
  if (!hostOk(host) || !Number.isFinite(thresholdUsd) || thresholdUsd <= 0) {
    return NextResponse.json({ error: 'domain' }, { status: 400 });
  }
  const current = await listKsTrust(session.vaultId);
  if (current.length >= KS_MAX_TRUST) return NextResponse.json({ error: 'full' }, { status: 400 });
  const next = [
    { host, thresholdUsd, createdAt: new Date().toISOString() },
    ...current.filter((row) => row.host !== host),
  ];
  await putKsTrust(session.vaultId, next);
  return NextResponse.json({ ok: true, domains: next });
}

export async function DELETE(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const host = (new URL(req.url).searchParams.get('host') || '').toLowerCase();
  const next = (await listKsTrust(session.vaultId)).filter((row) => row.host !== host);
  await putKsTrust(session.vaultId, next);
  return NextResponse.json({ ok: true, domains: next });
}
