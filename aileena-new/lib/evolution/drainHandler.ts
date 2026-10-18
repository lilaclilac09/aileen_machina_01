/**
 * Production drain for the chat live inbox.
 * GitHub Actions presents an OIDC JWT. No UPSTASH secret on GitHub.
 */

import { drainLiveInbox, type LiveAsk } from './liveInbox';
import { verifyGithubActionsOidc } from './githubOidc';
import { actionId, readAction, runOnce } from '../agentRuntime/actions';
import { runtimeKv } from '../agentRuntime/kv';

export type DrainResponse = {
  asks: LiveAsk[];
  drained: number;
  /** Action id of this run's drain checkpoint (absent for tokens without run_id). */
  actionId?: string;
  /** True when this run already drained: the stored asks are returned again, nothing new is popped. */
  replay?: boolean;
  /** Asks taken over from earlier runs that drained but never acked (failed midway). */
  adopted?: number;
};

const DRAIN_INDEX = 'evolve:drains:v1';
const DRAIN_TTL_SEC = 60 * 60 * 24 * 7;
/** Unacked drains older than this are not adopted again (no endless carry-over). */
export const DRAIN_ADOPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ackKey = (runId: string) => `evolve:drain-ack:v1:${runId}`;
type DrainResult = { asks: LiveAsk[]; fresh: number; adopted: number };

/**
 * Drain checkpoint per workflow run (action ledger). The first call of a run
 * pops the inbox and stores the asks; a re-run attempt of the same run gets the
 * same asks back (nothing new is popped, nothing is lost). The workflow acks
 * once its PR step is done; a later run adopts the asks of any earlier run
 * that never acked, so a failure midway is resumed, not dropped or repeated.
 */
export async function drainForRun(runId: string, limit = 5): Promise<DrainResponse> {
  const id = await actionId('evolve.drain', runId);
  const r = await runOnce<DrainResult>(id, async () => {
    const kv = runtimeKv();
    const now = Date.now();
    const prior = await kv.listRange<{ runId: string; id: string; at?: number }>(DRAIN_INDEX, 20);
    const adoptedAsks: LiveAsk[] = [];
    for (const p of prior) {
      if (p.runId === runId || !(typeof p.at === 'number' && now - p.at < DRAIN_ADOPT_MAX_AGE_MS)) continue;
      if (await kv.get(ackKey(p.runId))) continue;
      const rec = await readAction<DrainResult>(p.id);
      if (rec?.status !== 'succeeded' || !rec.result) continue;
      adoptedAsks.push(...rec.result.asks);
      await kv.set(ackKey(p.runId), `adopted-by:${runId}`, { ex: DRAIN_TTL_SEC });
    }
    const fresh = await drainLiveInbox(limit);
    await kv.listPush(DRAIN_INDEX, [{ runId, id, at: now }], 50, DRAIN_TTL_SEC);
    const seen = new Set<string>();
    const asks = [...adoptedAsks, ...fresh].filter((a) => !seen.has(a.prompt) && Boolean(seen.add(a.prompt)));
    return { asks, fresh: fresh.length, adopted: adoptedAsks.length };
  }, { ttlSec: DRAIN_TTL_SEC });
  if (r.state === 'running') throw new Error('drain already running for this run');
  if (r.state === 'failed') throw new Error(r.error);
  return { asks: r.result.asks, drained: r.result.asks.length, actionId: id, replay: r.replay, adopted: r.result.adopted };
}

/** Mark a run's drained asks as consumed (its PR step finished). */
export async function ackDrain(runId: string): Promise<void> {
  await runtimeKv().set(ackKey(runId), 'acked', { ex: DRAIN_TTL_SEC });
}

export async function handleEvolveDrain(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const verified = await verifyGithubActionsOidc(token);
  if (!verified.ok) {
    return Response.json({ error: 'unauthorized', reason: verified.reason }, { status: 401 });
  }
  const runId = verified.payload?.run_id ? String(verified.payload.run_id).slice(0, 40) : '';
  if (!runId) {
    const asks = await drainLiveInbox(5);
    const body: DrainResponse = { asks, drained: asks.length };
    return Response.json(body);
  }
  if (new URL(req.url).searchParams.get('ack') === '1') {
    await ackDrain(runId);
    return Response.json({ ok: true, acked: runId });
  }
  try {
    return Response.json(await drainForRun(runId, 5));
  } catch (err) {
    return Response.json({ error: 'drain_busy', reason: err instanceof Error ? err.message : String(err) }, { status: 409 });
  }
}

export function parseEvolveAsksJson(raw: unknown): LiveAsk[] {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : Array.isArray((raw as { asks?: unknown }).asks) ? (raw as { asks: unknown[] }).asks : [];
  const out: LiveAsk[] = [];
  for (const row of rows) {
    if (typeof row === 'string' && row.trim()) {
      out.push({ at: new Date().toISOString(), prompt: row.trim(), source: 'chat' });
      continue;
    }
    if (row && typeof row === 'object' && typeof (row as LiveAsk).prompt === 'string') {
      const prompt = (row as LiveAsk).prompt.trim();
      if (!prompt) continue;
      out.push({
        at: typeof (row as LiveAsk).at === 'string' ? (row as LiveAsk).at : new Date().toISOString(),
        prompt,
        source: 'chat',
      });
    }
  }
  return out;
}
