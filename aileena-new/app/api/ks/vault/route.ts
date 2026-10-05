import { NextResponse } from 'next/server';
import { KS_MAX_ENTRIES } from '@/lib/keyshield/constants';
import { cookieFromRequest, KS_SESSION_COOKIE, readKsSession } from '@/lib/keyshield/session';
import { getKsVault, putKsVault } from '@/lib/keyshield/store';
import type { KsVaultEntry } from '@/lib/keyshield/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function vaultIdOf(req: Request): Promise<string | null> {
  return readKsSession(cookieFromRequest(req, KS_SESSION_COOKIE));
}

export async function GET(req: Request) {
  const vaultId = await vaultIdOf(req);
  if (!vaultId) return NextResponse.json({ error: 'session' }, { status: 401 });
  const doc = await getKsVault(vaultId);
  return NextResponse.json({ ok: true, vaultId: doc.vaultId, entries: doc.entries, updatedAt: doc.updatedAt });
}

export async function PUT(req: Request) {
  const vaultId = await vaultIdOf(req);
  if (!vaultId) return NextResponse.json({ error: 'session' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { entries?: KsVaultEntry[] } | null;
  if (!body || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: 'entries' }, { status: 400 });
  }
  if (body.entries.length > KS_MAX_ENTRIES) {
    return NextResponse.json({ error: 'full' }, { status: 400 });
  }
  const entries: KsVaultEntry[] = [];
  for (const row of body.entries) {
    if (!row?.id || !row.iv || !row.cipher || !row.createdAt) {
      return NextResponse.json({ error: 'entry' }, { status: 400 });
    }
    if (row.cipher.length > 20_000 || row.iv.length > 64) {
      return NextResponse.json({ error: 'size' }, { status: 400 });
    }
    entries.push({
      id: String(row.id).slice(0, 80),
      iv: String(row.iv),
      cipher: String(row.cipher),
      createdAt: String(row.createdAt),
    });
  }
  try {
    const doc = await putKsVault({ vaultId, entries, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, vaultId: doc.vaultId, entries: doc.entries, updatedAt: doc.updatedAt });
  } catch {
    return NextResponse.json({ error: 'full' }, { status: 400 });
  }
}
