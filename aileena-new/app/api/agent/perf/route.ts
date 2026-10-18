import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { actionId, runSteps } from '@/lib/agentRuntime/actions';
import { perfLabel, readPerfDashboard, recordPerfTurn, sanitizeBenchTurn, type PerfSource } from '@/lib/agentRuntime/perf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const MAX_BENCH_TURNS = 200;
const BENCH_CHUNK = 25;

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
  // Action ledger: the same report posted twice is stored once; a POST that
  // failed midway resumes at the first chunk that was not stored.
  const reportId = await actionId('perf.bench', run, list);
  const steps = [];
  for (let i = 0; i < turns.length; i += BENCH_CHUNK) {
    const chunk = turns.slice(i, i + BENCH_CHUNK);
    steps.push({ name: `chunk-${i / BENCH_CHUNK}`, run: async () => { for (const t of chunk) await recordPerfTurn(t); return chunk.length; } });
  }
  const r = await runSteps(reportId, steps, { results: {} });
  const stored = r.ran.filter((n) => n !== r.failedAt).reduce((a, n) => a + Number(r.results[n] ?? 0), 0);
  const status = r.ok ? 200 : r.busyAt ? 409 : 500;
  return NextResponse.json(
    { ok: r.ok, run, stored, replayed: r.skipped.length > 0 && r.ran.length === 0, actionId: reportId, ...(r.error ? { error: r.error } : {}) },
    { status, headers: NO_STORE },
  );
}
