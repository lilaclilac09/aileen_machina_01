import type { EvalReport, LoopResult, SkillPatch } from '../types';
import { ensureEvolutionDirs, loadProductionSkills, loadStagingSkills, loadVerifiers, verifierMap, writeSkill } from './bank';
import { evaluateSkills, heldOutRate } from './verify';
import { decideRatchet, promoteSkill, rejectSkill } from './ratchet';
import { synthesizeSkillFromFailure } from './synthesize';
import { appendTrajectories, recordsFromEval } from './trajectory';
import { generateChallengerTasks, persistGeneratedTasks } from './taskgen';
import { codegenActiveSkills } from './codegen';
import { expandHeldOutFromTrainFails } from './expand';
import { evolutionPaths } from './paths';

export type LoopOpts = {
  root?: string;
  /** Skip challenger task generation. */
  noGenerate?: boolean;
  /** Trusted skill-following policy (default). Sandbox spawn is for untrusted solverSource. */
  mode?: 'sandbox' | 'in-process';
  /** Do not write activeSkills.generated.ts (fixture tests). */
  noCodegen?: boolean;
  /** Skip lifting train fails into paraphrased held-out tasks. */
  noExpand?: boolean;
};

/**
 * One self-evolution cycle:
 * evaluate → synthesize skills from held-out failures → sandbox + external
 * verifier → ratchet → expand train fails into held-out paraphrases →
 * optional taskgen → codegen.
 * Never writes AGENTS.md / QA.md / PROJECT_RULES.md.
 */
export function runEvolveLoop(opts: LoopOpts = {}): LoopResult {
  const p = ensureEvolutionDirs(opts.root);
  const production = loadProductionSkills(opts.root);
  const staging = loadStagingSkills(opts.root);
  const baseline = evaluateSkills({
    root: opts.root,
    skills: production,
    mode: opts.mode ?? 'in-process',
  });

  const { list: verifiers } = loadVerifiers(opts.root);
  const vmap = verifierMap(verifiers);
  const synthesized: SkillPatch[] = [];
  for (const score of baseline.scores) {
    if (score.split !== 'held-out' || score.pass) continue;
    const verifier = vmap.get(score.taskId);
    if (!verifier) continue;
    const skill = synthesizeSkillFromFailure({
      prompt: {
        id: score.taskId,
        split: score.split,
        bucket: score.bucket,
        prompt: score.prompt,
        structure: score.structure,
      },
      verifier,
      failedChecks: score.failedChecks,
      existing: [...production, ...staging, ...synthesized],
    });
    if (skill) {
      writeSkill(p.staging, skill);
      synthesized.push(skill);
    }
  }

  const candidates = [...staging, ...synthesized].filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i,
  );
  const decisions = [];
  const promoted: SkillPatch[] = [];
  let current = production;

  for (const candidate of candidates) {
    const merged = [...current.filter((s) => s.id !== candidate.id), candidate];
    const candEval = evaluateSkills({
      root: opts.root,
      skills: merged,
      mode: opts.mode ?? 'in-process',
    });
    const decision = decideRatchet({
      candidate,
      baseline: current === production ? baseline : evaluateSkills({
        root: opts.root,
        skills: current,
        mode: opts.mode ?? 'in-process',
      }),
      candidateEval: candEval,
    });
    decisions.push(decision);
    if (decision.promote) {
      promoteSkill(candidate, decision, opts.root);
      current = merged;
      promoted.push(candidate);
      appendTrajectories(recordsFromEval(candEval), opts.root);
    } else {
      rejectSkill(candidate, decision, opts.root);
    }
  }

  appendTrajectories(recordsFromEval(baseline), opts.root);

  let expandedHeldOut = 0;
  if (!opts.noExpand) {
    const latest = evaluateSkills({
      root: opts.root,
      skills: current,
      mode: opts.mode ?? 'in-process',
    });
    expandedHeldOut = expandHeldOutFromTrainFails(latest.scores, opts.root).prompts.length;
  }

  let generatedTasks = 0;
  if (!opts.noGenerate) {
    const gen = generateChallengerTasks(opts.root);
    persistGeneratedTasks(gen.prompts, gen.verifiers, opts.root);
    generatedTasks = gen.prompts.length;
  }

  if (!opts.noCodegen) {
    codegenActiveSkills(current);
  }

  return {
    evaluated: baseline,
    synthesized,
    decisions,
    promoted,
    generatedTasks,
    expandedHeldOut,
    trajectories: baseline.scores.length,
    ledgerSize: current.length,
  };
}

export type UntilStableResult = {
  rounds: LoopResult[];
  final: EvalReport;
};

/** Repeat until held-out and train are both clean, or no new work, or max rounds. */
export function runEvolveUntilStable(
  opts: LoopOpts & { maxRounds?: number } = {},
): UntilStableResult {
  const maxRounds = opts.maxRounds ?? 8;
  const rounds: LoopResult[] = [];
  for (let i = 0; i < maxRounds; i++) {
    const round = runEvolveLoop(opts);
    rounds.push(round);
    const final = evaluateSkills({
      root: opts.root,
      skills: loadProductionSkills(opts.root),
      mode: opts.mode ?? 'in-process',
    });
    const idle =
      round.promoted.length === 0 &&
      round.synthesized.length === 0 &&
      round.generatedTasks === 0 &&
      round.expandedHeldOut === 0;
    const clean = heldOutRate(final) === 1 && final.trainTotal > 0 && final.trainPassed === final.trainTotal;
    if (idle || clean) return { rounds, final };
  }
  return {
    rounds,
    final: evaluateSkills({
      root: opts.root,
      skills: loadProductionSkills(opts.root),
      mode: opts.mode ?? 'in-process',
    }),
  };
}

export { evolutionPaths };
