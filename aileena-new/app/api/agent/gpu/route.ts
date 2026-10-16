import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { drainGpu, probeGpu, readGpuConfig, readGpuState, undrainGpu, wakeGpu } from '@/lib/agentRuntime/gpu';
import { breakerGate } from '@/lib/agentRuntime/breaker';
import { readRouterStats, readSpendMicroUsd } from '@/lib/agentRuntime/load';
import { runtimeKv } from '@/lib/agentRuntime/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Owner-only GPU tier status: mode, lifecycle, breaker, today's router stats. Never returns secrets. */
async function status() {
  const cfg = readGpuConfig();
  const state = await readGpuState();
  const providers = ['deepseek', ...(cfg ? [cfg.providerId] : [])];
  const breakers: Record<string, unknown> = {};
  for (const p of providers) {
    const g = await breakerGate(p);
    // breakerGate in half-open takes the probe lease; only report, never hold it.
    if (g.allowed && g.probe) await runtimeKv().del(`breaker:v1:${p}:probe`);
    breakers[p] = g.allowed ? (g.probe ? 'half-open' : 'closed') : g.reason;
  }
  return {
    mode: cfg?.mode ?? 'off',
    configured: Boolean(cfg),
    provider: cfg?.providerId ?? null,
    model: cfg?.model ?? null,
    state: cfg ? state.state : 'off',
    stateAt: cfg ? state.at : null,
    rules: cfg
      ? {
          failover: cfg.failover,
          spillInflight: cfg.spillInflight,
          spillTtftMs: cfg.spillTtftMs,
          dailyBudgetUsd: cfg.dailyBudgetUsd,
          canaryPct: cfg.canaryPct,
          routes: cfg.routes,
          maxContext: cfg.maxContext,
          ttftMs: cfg.ttftMs,
        }
      : null,
    breakers,
    kv: runtimeKv().backend,
    deepseekSpendUsdToday: (await readSpendMicroUsd('deepseek')) / 1_000_000,
    today: await readRouterStats(providers),
  };
}

export async function GET(req: Request) {
  if (!(await requireOwnerFromRequest(req))) {
    return NextResponse.json({ error: 'GPU status is owner-only.' }, { status: 403, headers: NO_STORE });
  }
  return NextResponse.json(await status(), { headers: NO_STORE });
}

/** Owner-only actions: wake (non-blocking), probe (one health check), drain, undrain. */
export async function POST(req: Request) {
  if (!(await requireOwnerFromRequest(req))) {
    return NextResponse.json({ error: 'GPU control is owner-only.' }, { status: 403, headers: NO_STORE });
  }
  const cfg = readGpuConfig();
  if (!cfg) {
    return NextResponse.json({ error: 'GPU tier is off (AGENT_GPU_MODE / AGENT_GPU_BASE_URL / AGENT_GPU_API_KEY).' }, { status: 409, headers: NO_STORE });
  }
  let action = '';
  try {
    action = String(((await req.json()) as { action?: unknown }).action ?? '');
  } catch {
    /* empty body */
  }
  if (action === 'wake') {
    const w = await wakeGpu(cfg);
    void w.done;
  } else if (action === 'probe') {
    await probeGpu(cfg, { force: true });
  } else if (action === 'drain') {
    await drainGpu();
  } else if (action === 'undrain') {
    await undrainGpu();
  } else {
    return NextResponse.json({ error: 'action must be wake | probe | drain | undrain' }, { status: 400, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, action, ...(await status()) }, { headers: NO_STORE });
}
