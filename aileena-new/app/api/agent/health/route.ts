import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { redisDiagnostic } from '@/lib/agentRuntime/redisDiag';
import { redisHealth } from '@/lib/agentRuntime/redisHealth';
import { visitorSoftMemoryEnabled } from '@/lib/visitorMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Owner-only runtime health. `?redis=1` adds a live SET/GET/DEL roundtrip. */
export async function GET(req: Request) {
  if (!(await requireOwnerFromRequest(req))) {
    return NextResponse.json({ error: 'Health data is owner-only.' }, { status: 403, headers: NO_STORE });
  }
  const wantRedis = new URL(req.url).searchParams.get('redis') === '1';
  const base = {
    ok: true,
    store: process.env.RUNTIME_KV === 'memory' ? 'memory' : visitorSoftMemoryEnabled() ? 'redis' : 'memory',
    redisHealth: redisHealth(),
  };
  return NextResponse.json(wantRedis ? { ...base, redis: await redisDiagnostic() } : base, { headers: NO_STORE });
}
