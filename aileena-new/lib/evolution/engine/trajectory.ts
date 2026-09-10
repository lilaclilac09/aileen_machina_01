import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { EvalReport, TrajectoryCorpus, TrajectoryRecord } from '../types';
import { evolutionPaths } from './paths';

function corpusFor(score: EvalReport['scores'][number], hadPairFail: boolean): TrajectoryCorpus {
  if (score.solver.hackAttempt) return 'hack_attempt';
  if (score.pass && score.split === 'held-out') return 'sft';
  if (score.pass && hadPairFail) return 'dpo_chosen';
  if (!score.pass && score.split === 'held-out') return 'dpo_rejected';
  return 'rlvr';
}

export function recordsFromEval(report: EvalReport): TrajectoryRecord[] {
  const failedHeldOut = new Set(
    report.scores.filter((s) => s.split === 'held-out' && !s.pass).map((s) => s.taskId),
  );
  const at = new Date().toISOString();
  return report.scores.map((s) => ({
    id: randomBytes(6).toString('hex'),
    at,
    taskId: s.taskId,
    split: s.split,
    bucket: s.bucket,
    skillIds: s.solver.skillIds,
    steps: s.solver.steps,
    reply: s.solver.reply,
    pass: s.pass,
    corpus: corpusFor(s, failedHeldOut.size > 0),
    verifierHash: report.verifierHash,
  }));
}

export function appendTrajectories(records: TrajectoryRecord[], root?: string) {
  const file = evolutionPaths(root).trajectories;
  mkdirSync(dirname(file), { recursive: true });
  const lines = records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
  appendFileSync(file, lines);
}

export function pairDpo(records: TrajectoryRecord[]): Array<{ chosen: TrajectoryRecord; rejected: TrajectoryRecord }> {
  const byTask = new Map<string, TrajectoryRecord[]>();
  for (const r of records) {
    const arr = byTask.get(r.taskId) ?? [];
    arr.push(r);
    byTask.set(r.taskId, arr);
  }
  const pairs: Array<{ chosen: TrajectoryRecord; rejected: TrajectoryRecord }> = [];
  for (const group of byTask.values()) {
    const chosen = group.find((r) => r.pass);
    const rejected = group.find((r) => !r.pass);
    if (chosen && rejected) pairs.push({ chosen, rejected });
  }
  return pairs;
}

export function trajectoryFileExists(root?: string): boolean {
  return existsSync(evolutionPaths(root).trajectories);
}
