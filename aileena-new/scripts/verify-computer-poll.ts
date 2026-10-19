/**
 * Offline checks for the Console dock poll schedule and the batched scratch reset.
 * No network, no secrets. Run: pnpm exec tsx scripts/verify-computer-poll.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  hasActiveTask,
  nextBackoff,
  nextPollDelay,
  POLL_MAX_MS,
  POLL_MIN_MS,
  SHARED_IDLE_POLL_MS,
  taskSignature,
} from '../lib/computer/pollSchedule';
import { scratchRmBatches } from '../lib/computer/runner';
import type { ComputerTask } from '../lib/computer/types';

let failed = 0;
function assert(name: string, ok: boolean) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}

const t = (id: string, status: ComputerTask['status'], updatedAt = '2026-10-19T00:00:00Z') =>
  ({ id, status, updatedAt }) as ComputerTask;

assert('idle owner pad stops polling', nextPollDelay({ active: false, shared: false, hidden: false, delayMs: 1000 }) === null);
assert('hidden tab pauses even when active', nextPollDelay({ active: true, shared: false, hidden: true, delayMs: 1000 }) === null);
assert('hidden shared room pauses', nextPollDelay({ active: false, shared: true, hidden: true, delayMs: 1000 }) === null);
assert('active task polls at 1s', nextPollDelay({ active: true, shared: false, hidden: false, delayMs: 1000 }) === POLL_MIN_MS);
assert('shared room idles at 15s', nextPollDelay({ active: false, shared: true, hidden: false, delayMs: 1000 }) === SHARED_IDLE_POLL_MS);

let d = POLL_MIN_MS;
const seq: number[] = [];
for (let i = 0; i < 10; i += 1) {
  d = nextBackoff(d, false);
  seq.push(d);
}
assert(`backoff grows 1s -> 10s (${seq.join(',')})`, seq[0] === 1500 && seq.at(-1) === POLL_MAX_MS && seq.every((x, i) => i === 0 || x >= seq[i - 1]));
assert('change snaps back to 1s', nextBackoff(POLL_MAX_MS, true) === POLL_MIN_MS);
assert('active detection', hasActiveTask([t('a', 'completed'), t('b', 'running')]) && !hasActiveTask([t('a', 'failed')]));
assert('signature moves on status change', taskSignature([t('a', 'queued')]) !== taskSignature([t('a', 'running')]));

// Polls per hour for one open, idle tab: before = 3600/0.9 = 4000.
const idleHour = nextPollDelay({ active: false, shared: false, hidden: false, delayMs: 1000 }) === null ? 0 : 3600;
assert(`idle tab: 0 polls/hour after first load (was 4000)`, idleHour === 0);

const entries = Array.from({ length: 50 }, (_, i) => `file-${i}.txt`);
const batches = scratchRmBatches(entries);
assert(`50-entry reset is ${batches.length} exec (was 50)`, batches.length === 1);
assert('batched rm keeps every path under scratch', batches.every((b) => b.startsWith('rm -r ') && b.split(' ').slice(2).every((w) => w.startsWith('/workspace/scratch/'))));
const long = scratchRmBatches(Array.from({ length: 50 }, (_, i) => `${'x'.repeat(60)}-${i}`));
assert(`long names split under 2000 chars (${long.length} batches)`, long.length > 1 && long.every((b) => b.length <= 2000));
assert('empty reset is no exec', scratchRmBatches([]).length === 0);

const runner = readFileSync(join(process.cwd(), 'lib/computer/runner.ts'), 'utf8');
assert('runner tries the one-call ensure endpoint first', /cfEnsureScratch\(name, VISITOR_SCRATCH_TTL_DAYS\)/.test(runner));
assert('runner no longer rm-s one entry per exec', !/for \(const entry of entries\) \{\s*await cfExec\(`rm -r/.test(runner));
const client = readFileSync(join(process.cwd(), 'lib/computer/cfClient.ts'), 'utf8');
assert('old worker 404 falls back (non-JSON not-found)', /ensureEndpointMissing = true/.test(client) && /application\/json/.test(client));

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('computer poll + scratch batch: all checks passed');
