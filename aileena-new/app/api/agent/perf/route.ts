import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { perfLabel, readPerfDashboard, recordPerfTurn, sanitizeBenchTurn, type PerfSource } from '@/lib/agentRuntime/perf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const MAX_BENCH_TURNS = 200;

/** Owner-only inference performance data (same numbers as /agent-analytics/performance). */
export async function GET(req: Request) {
  if (!(await requireOwnerFromRequest(req))) {
    return NextResponse.json({ error: 'Performance data is owner-only.' }, { status: 403, headers: NO_STORE });
  }
  const raw = new URL(req.url).searchParams.get('src');
  const src: PerfSource = raw === 'bench' || raw === 'all' ? raw : 'site';
  return NextResponse.json(await readPerfDashboard({ src }), { headers: NO_STORE });
}

/** Owner-only: store results of a direct-target bench run (`pnpm bench:inference --target openai --report`). */
export async function POST(req: Request) {
  if (!(await requireOwnerFromRequest(req))) {
    return NextResponse.json({ error: 'Performance data is owner-only.' }, { status: 403, headers: NO_STORE });
  }
  let body: { run?: unknown; turns?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: NO_STORE });
  }
  const run = perfLabel(body.run, 40) || `bench-${Date.now()}`;
  const list = Array.isArray(body.turns) ? body.turns.slice(0, MAX_BENCH_TURNS) : [];
  const turns = list.map((t) => sanitizeBenchTurn(t, run)).filter((t): t is NonNullable<typeof t> => t !== null);
  for (const t of turns) await recordPerfTurn(t);
  return NextResponse.json({ ok: true, run, stored: turns.length }, { headers: NO_STORE });
}
