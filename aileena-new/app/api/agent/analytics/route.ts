import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { readEngageStats } from '@/lib/agentEngage/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Owner-only console engagement stats. Same server-side gate as council: no owner session → 403. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: 'Analytics is owner-only.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  const stats = await readEngageStats(14);
  return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } });
}
