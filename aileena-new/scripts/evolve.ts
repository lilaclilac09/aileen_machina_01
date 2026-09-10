#!/usr/bin/env tsx
/**
 * Site-agent self-evolution CLI.
 *
 *   pnpm evolve                 # one ratchet loop
 *   pnpm evolve -- --dry-run    # evaluate only
 *   pnpm evolve -- --from-lesson ../ops/lessons/2026-08-16-mobile-overflow.md
 *   pnpm evolve -- --rollback <skillId> --to <version>
 *
 * Never writes AGENTS.md / QA.md / PROJECT_RULES.md.
 */

import { writeSkill } from '../lib/evolution/engine/bank';
import { evolutionPaths, evolutionRoot } from '../lib/evolution/engine/paths';
import { runEvolveLoop } from '../lib/evolution/engine/loop';
import { evaluateSkills, heldOutRate } from '../lib/evolution/engine/verify';
import { rollbackSkill } from '../lib/evolution/engine/ratchet';
import { lessonFileToSkill } from '../lib/evolution/engine/lessonToSkill';
import { loadProductionSkills } from '../lib/evolution/engine/bank';
import { codegenActiveSkills } from '../lib/evolution/engine/codegen';

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

  const result = runEvolveLoop({ root });
  console.log(
    JSON.stringify(
      {
        heldOut: `${result.evaluated.heldOutPassed}/${result.evaluated.heldOutTotal}`,
        synthesized: result.synthesized.map((s) => s.id),
        decisions: result.decisions,
        promoted: result.promoted.map((s) => `${s.id}@${s.version}`),
        generatedTasks: result.generatedTasks,
        trajectories: result.trajectories,
      },
      null,
      2,
    ),
  );
}

main();
