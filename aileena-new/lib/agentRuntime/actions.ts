/**
 * Action ledger: every Machina side effect carries a deterministic action id,
 * so a repeated delivery (client retry, re-run job, duplicate webhook) does the
 * side effect at most once, and a failed multi-step run resumes from the first
 * step that did not succeed instead of starting over.
 *
 * - `actionId(kind, ...parts)`: stable id from stable inputs (turn id, run id,
 *   forward id, step name). Never from time or randomness.
 * - `runOnce(id, fn)`: SET NX lease + status record (started / succeeded /
 *   failed + result). Succeeded → the stored result is replayed, fn is not
 *   called. Another live lease → `running` (concurrent duplicate), fn is not
 *   called. Failed or expired lease → fn runs again (that is the retry).
 * - `runSteps(runId, steps)`: one `runOnce` per step, in order; stops at the
 *   first failure. A retry with the same runId skips succeeded steps.
 *
 * Storage: runtimeKv (Upstash Redis when configured, per-instance memory
 * otherwise, `RUNTIME_KV=memory` in tests). Without Redis the guarantee holds
 * per server instance only.
 */
import { runtimeKv } from './kv';

export type ActionStatus = 'started' | 'succeeded' | 'failed';
export type ActionRecord<T = unknown> = {
  id: string;
  status: ActionStatus;
  attempts: number;
  at: number;
  result?: T;
  error?: string;
};
export type RunOnceResult<T> =
  | { state: 'done'; result: T; replay: false; attempts: number }
  | { state: 'replay'; result: T; replay: true; attempts: number }
  | { state: 'running'; replay: false }
  | { state: 'failed'; error: string; replay: false; attempts: number };

export const ACTION_TTL_SEC = 60 * 60 * 24 * 7;
export const ACTION_LEASE_SEC = 120;
const ID_RE = /^[a-z][a-z0-9._-]{1,40}:[a-f0-9]{24}$/;

function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, stable(o[k])]));
  }
  return v;
}

/** Hex SHA-256 (Web Crypto; Edge and Node). */
export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Deterministic id: `<kind>:<24 hex>` from the kind and stable inputs (key order ignored). */
export async function actionId(kind: string, ...parts: unknown[]): Promise<string> {
  const k = kind.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 40) || 'action';
  return `${k}:${(await sha256Hex(JSON.stringify([k, ...parts.map(stable)]))).slice(0, 24)}`;
}

export function validActionId(v: unknown): v is string {
  return typeof v === 'string' && ID_RE.test(v);
}

const recKey = (id: string) => `act:v1:${id}`;
const leaseKey = (id: string) => `act:v1:lease:${id}`;

export async function readAction<T = unknown>(id: string): Promise<ActionRecord<T> | null> {
  const raw = await runtimeKv().get<ActionRecord<T> | string>(recKey(id));
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as ActionRecord<T>) : raw;
  } catch {
    return null;
  }
}

async function writeAction(rec: ActionRecord, ttlSec: number): Promise<void> {
  await runtimeKv().set(recKey(rec.id), JSON.stringify(rec), { ex: ttlSec });
}

/** Mark an action succeeded from outside `runOnce` (e.g. a resend job that confirmed delivery). */
export async function markActionSucceeded<T>(id: string, result: T, ttlSec = ACTION_TTL_SEC): Promise<void> {
  const prev = await readAction(id);
  await writeAction({ id, status: 'succeeded', attempts: prev?.attempts ?? 1, at: Date.now(), result }, ttlSec);
}

/**
 * Run `fn` at most once per id. A throw (or `{ ok: false }` via `isFailure`)
 * records `failed` and frees the lease so the next delivery retries.
 */
export async function runOnce<T>(
  id: string,
  fn: () => Promise<T>,
  opts: { ttlSec?: number; leaseSec?: number; isFailure?: (r: T) => string | null } = {},
): Promise<RunOnceResult<T>> {
  const kv = runtimeKv();
  const ttlSec = opts.ttlSec ?? ACTION_TTL_SEC;
  const prev = await readAction<T>(id);
  if (prev?.status === 'succeeded') return { state: 'replay', result: prev.result as T, replay: true, attempts: prev.attempts };
  const got = await kv.set(leaseKey(id), String(Date.now()), { nx: true, ex: opts.leaseSec ?? ACTION_LEASE_SEC });
  if (!got) return { state: 'running', replay: false };
  // Re-read under the lease: a duplicate may have finished between our read and the lease.
  const now = await readAction<T>(id);
  if (now?.status === 'succeeded') {
    await kv.del(leaseKey(id));
    return { state: 'replay', result: now.result as T, replay: true, attempts: now.attempts };
  }
  const attempts = (now?.attempts ?? 0) + 1;
  await writeAction({ id, status: 'started', attempts, at: Date.now() }, ttlSec);
  try {
    const result = await fn();
    const failure = opts.isFailure?.(result) ?? null;
    if (failure) {
      await writeAction({ id, status: 'failed', attempts, at: Date.now(), error: failure.slice(0, 300), result }, ttlSec);
      return { state: 'failed', error: failure, replay: false, attempts };
    }
    await writeAction({ id, status: 'succeeded', attempts, at: Date.now(), result }, ttlSec);
    return { state: 'done', result, replay: false, attempts };
  } catch (err) {
    const error = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    await writeAction({ id, status: 'failed', attempts, at: Date.now(), error }, ttlSec);
    return { state: 'failed', error, replay: false, attempts };
  } finally {
    await kv.del(leaseKey(id));
  }
}

export type Step<C> = { name: string; run: (ctx: C) => Promise<unknown> };
export type StepsResult = {
  runId: string;
  ok: boolean;
  /** Step names whose stored result was replayed (not re-run). */
  skipped: string[];
  /** Step names that ran in this call. */
  ran: string[];
  failedAt?: string;
  error?: string;
  /** A duplicate delivery is still running this step. */
  busyAt?: string;
  results: Record<string, unknown>;
};

/**
 * Run named steps in order with one checkpoint each. Results of earlier steps
 * (replayed or fresh) are passed on in `ctx.results`. Stops at the first step
 * that fails or is busy; a later call with the same runId resumes there.
 */
export async function runSteps<C extends { results: Record<string, unknown> }>(
  runId: string,
  steps: Step<C>[],
  ctx: C,
  opts: { ttlSec?: number; leaseSec?: number } = {},
): Promise<StepsResult> {
  const out: StepsResult = { runId, ok: true, skipped: [], ran: [], results: ctx.results };
  for (const step of steps) {
    const id = await actionId('step', runId, step.name);
    const r = await runOnce(id, () => step.run(ctx), opts);
    if (r.state === 'replay' || r.state === 'done') {
      ctx.results[step.name] = r.result;
      (r.state === 'replay' ? out.skipped : out.ran).push(step.name);
      continue;
    }
    out.ok = false;
    if (r.state === 'running') out.busyAt = step.name;
    else {
      out.ran.push(step.name);
      out.failedAt = step.name;
      out.error = r.error;
    }
    break;
  }
  return out;
}
