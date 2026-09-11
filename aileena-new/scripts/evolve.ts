#!/usr/bin/env tsx
/**
 * Site-agent self-evolution CLI.
 *
 *   pnpm evolve                      # until held-out+train stabilize (max 8 rounds)
 *   pnpm evolve:status               # one line; exit 1 if dirty
 *   pnpm evolve:effect               # naive vs skilled sheet
 *   pnpm evolve -- --once            # one ratchet round
 *   pnpm evolve -- --dry-run
 *   pnpm evolve -- --from-lesson ../ops/lessons/YYYY-MM-DD-slug.md
 *   pnpm evolve -- --rollback <skillId> --to <version>
 *
 * Never writes AGENTS.md / QA.md / PROJECT_RULES.md.
 */

import { writeSkill } from '../lib/evolution/engine/bank';
import { evolutionPaths, evolutionRoot } from '../lib/evolution/engine/paths';
import { runEvolveLoop, runEvolveUntilStable } from '../lib/evolution/engine/loop';
import { evaluateSkills, heldOutRate } from '../lib/evolution/engine/verify';
import { rollbackSkill } from '../lib/evolution/engine/ratchet';
import { lessonFileToSkill } from '../lib/evolution/engine/lessonToSkill';
import { loadProductionSkills } from '../lib/evolution/engine/bank';
import { codegenActiveSkills } from '../lib/evolution/engine/codegen';
import { evolutionStatus } from '../lib/evolution/engine/status';
import { writeEffectSheet } from '../lib/evolution/engine/effect';

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

function has(flag: string): boolean {
  return process.argv.includes(flag);
}

function main() {
  const root = process.env.EVOLUTION_ROOT || evolutionRoot();

  if (has('--status')) {
    const status = evolutionStatus(root);
    console.log(status.line);
    if (!status.clean) process.exit(1);
    return;
  }

  if (has('--effect')) {
    const { path, rows } = writeEffectSheet(root);
    const failed = rows.filter((r) => !r.pass).map((r) => r.id);
    console.log(`wrote ${path} (${rows.length} prompts)`);
    for (const r of rows.filter((row) => row.split === 'held-out')) {
      console.log(`${r.pass ? 'OK' : 'FAIL'}  ${r.id}  ${r.prompt.slice(0, 64)}`);
    }
    if (failed.length) {
      console.error(`fails: ${failed.join(',')}`);
      process.exit(1);
    }
    return;
  }

  console.log(`evolution root: ${root}`);

  if (has('--rollback')) {
    const id = arg('--rollback');
    const to = Number(arg('--to'));
    if (!id || !Number.isInteger(to)) {
      console.error('usage: pnpm evolve -- --rollback <skillId> --to <version>');
      process.exit(2);
    }
    const rolled = rollbackSkill(id, to, root);
    codegenActiveSkills(loadProductionSkills(root));
    console.log(`rolled back ${rolled.id} to v${rolled.version}`);
    return;
  }

  if (has('--from-lesson')) {
    const file = arg('--from-lesson');
    if (!file) {
      console.error('usage: pnpm evolve -- --from-lesson <path>');
      process.exit(2);
    }
    const skill = lessonFileToSkill(file);
    writeSkill(evolutionPaths(root).staging, skill);
    console.log(`staged ${skill.id} from ${file} (not promoted; run without --from-lesson)`);
    return;
  }

  if (has('--dry-run')) {
    const skills = loadProductionSkills(root);
    const report = evaluateSkills({ root, skills, mode: 'in-process' });
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          skillSet: report.skillSet,
          heldOut: `${report.heldOutPassed}/${report.heldOutTotal}`,
          train: `${report.trainPassed}/${report.trainTotal}`,
          rate: heldOutRate(report),
          fails: report.scores.filter((s) => !s.pass).map((s) => ({ id: s.taskId, failed: s.failedChecks })),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (has('--once')) {
    const result = runEvolveLoop({ root });
    console.log(
      JSON.stringify(
        {
          heldOut: `${result.evaluated.heldOutPassed}/${result.evaluated.heldOutTotal}`,
          synthesized: result.synthesized.map((s) => s.id),
          decisions: result.decisions,
          promoted: result.promoted.map((s) => `${s.id}@${s.version}`),
          generatedTasks: result.generatedTasks,
          expandedHeldOut: result.expandedHeldOut,
          trajectories: result.trajectories,
        },
        null,
        2,
      ),
    );
    return;
  }

  const until = runEvolveUntilStable({ root });
  console.log(
    JSON.stringify(
      {
        rounds: until.rounds.length,
        perRound: until.rounds.map((r) => ({
          promoted: r.promoted.map((s) => s.id),
          synthesized: r.synthesized.map((s) => s.id),
          expandedHeldOut: r.expandedHeldOut,
          generatedTasks: r.generatedTasks,
        })),
        finalHeldOut: `${until.final.heldOutPassed}/${until.final.heldOutTotal}`,
        finalTrain: `${until.final.trainPassed}/${until.final.trainTotal}`,
        remainingFails: until.final.scores
          .filter((s) => !s.pass)
          .map((s) => ({ id: s.taskId, split: s.split, failed: s.failedChecks })),
      },
      null,
      2,
    ),
  );
}

main();
