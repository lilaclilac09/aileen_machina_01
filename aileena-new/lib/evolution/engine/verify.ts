import { readFileSync, statSync } from 'node:fs';
import type {
  DifficultyBucket,
  EvalReport,
  ScoreCard,
  SkillPatch,
  TaskVerifier,
  VerifierCheck,
} from '../types';
import { loadPrompts, loadVerifiers, verifierMap } from './bank';
import { CANARY_TOKEN, evolutionPaths } from './paths';
import { runSandboxedSolver, runInProcessSolver } from './sandbox';
import { skillSetKey } from './solve';
import { sha256 } from './fingerprint';

function checkOne(reply: string, check: VerifierCheck): string | null {
  const text = reply.toLowerCase();
  if (check.type === 'not_empty') {
    return reply.trim().length > 0 ? null : 'not_empty';
  }
  const values = (check.values ?? []).map((v) => v.toLowerCase());
  if (check.type === 'includes_any') {
    return values.some((v) => text.includes(v)) ? null : `includes_any:${values.join('|')}`;
  }
  if (check.type === 'includes_all') {
    const missing = values.filter((v) => !text.includes(v));
    return missing.length === 0 ? null : `includes_all:${missing.join('|')}`;
  }
  if (check.type === 'excludes_any') {
    const hit = values.find((v) => text.includes(v));
    return hit ? `excludes_any:${hit}` : null;
  }
  return `unknown_check:${check.type}`;
}

export function scoreReply(reply: string, verifier: TaskVerifier): string[] {
  if (reply.includes(CANARY_TOKEN)) return ['canary_leak'];
  const failed: string[] = [];
  for (const check of verifier.checks) {
    const fail = checkOne(reply, check);
    if (fail) failed.push(fail);
  }
  return failed;
}

export type EvaluateOpts = {
  root?: string;
  skills: SkillPatch[];
  /** Trusted skill-following policy (default). Sandbox spawn is for untrusted solverSource. */
  mode?: 'sandbox' | 'in-process';
  split?: 'train' | 'held-out' | 'all';
};

/**
 * External verifier. Loads checks in THIS process. The solver never receives them.
 * Hash of verifiers.json is taken before and after; mutation → fail closed.
 */
export function evaluateSkills(opts: EvaluateOpts): EvalReport {
  const p = evolutionPaths(opts.root);
  const before = loadVerifiers(opts.root);
  const mtimeBefore = statSync(p.verifiers).mtimeMs;
  const prompts = loadPrompts(opts.root).filter((t) =>
    opts.split && opts.split !== 'all' ? t.split === opts.split : true,
  );
  const vmap = verifierMap(before.list);
  const scores: ScoreCard[] = [];

  for (const task of prompts) {
    const solver =
      opts.mode === 'sandbox'
        ? runSandboxedSolver({ prompt: task.prompt, skills: opts.skills }, opts.root)
        : runInProcessSolver(task.prompt, opts.skills);
    const verifier = vmap.get(task.id);
    const failedChecks = solver.hackAttempt
      ? [solver.hackReason ?? 'hack_attempt']
      : verifier
        ? scoreReply(solver.reply, verifier)
        : ['missing_verifier'];
    scores.push({
      taskId: task.id,
      prompt: task.prompt,
      structure: task.structure,
      split: task.split,
      bucket: task.bucket,
      pass: failedChecks.length === 0,
      failedChecks,
      solver,
    });
  }

  const afterRaw = readFileSync(p.verifiers, 'utf8');
  const afterHash = sha256(afterRaw);
  const mtimeAfter = statSync(p.verifiers).mtimeMs;
  const verifierMutated = afterHash !== before.hash || mtimeAfter !== mtimeBefore;

  if (verifierMutated) {
    for (const s of scores) {
      s.pass = false;
      s.failedChecks = ['verifier_mutated', ...s.failedChecks];
    }
  }

  return summarize(skillSetKey(opts.skills), scores, before.hash, verifierMutated);
}

function emptyBuckets(): Record<DifficultyBucket, { passed: number; total: number }> {
  return {
    easy: { passed: 0, total: 0 },
    medium: { passed: 0, total: 0 },
    hard: { passed: 0, total: 0 },
    adversarial: { passed: 0, total: 0 },
  };
}

function summarize(
  skillSet: string[],
  scores: ScoreCard[],
  verifierHash: string,
  verifierMutated: boolean,
): EvalReport {
  const byBucket = emptyBuckets();
  let heldOutPassed = 0;
  let heldOutTotal = 0;
  let trainPassed = 0;
  let trainTotal = 0;
  let passed = 0;
  for (const s of scores) {
    byBucket[s.bucket].total += 1;
    if (s.pass) byBucket[s.bucket].passed += 1;
    if (s.pass) passed += 1;
    if (s.split === 'held-out') {
      heldOutTotal += 1;
      if (s.pass) heldOutPassed += 1;
    } else {
      trainTotal += 1;
      if (s.pass) trainPassed += 1;
    }
  }
  return {
    skillSet,
    passed,
    total: scores.length,
    heldOutPassed,
    heldOutTotal,
    trainPassed,
    trainTotal,
    byBucket,
    scores,
    verifierHash,
    verifierMutated,
  };
}

export function heldOutRate(report: EvalReport): number {
  return report.heldOutTotal === 0 ? 0 : report.heldOutPassed / report.heldOutTotal;
}

export function passingHeldOutIds(report: EvalReport): Set<string> {
  return new Set(report.scores.filter((s) => s.split === 'held-out' && s.pass).map((s) => s.taskId));
}

