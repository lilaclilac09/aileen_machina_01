#!/usr/bin/env tsx
/**
 * Self-evolution engine checks — sandbox, external verifier, ratchet, loop.
 *
 *   pnpm verify:evolve
 */

import { mkdtempSync, readFileSync, cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseSkillMarkdown, serializeSkillMarkdown } from '../lib/evolution/engine/parseSkill';
import { naiveSolve, skillSolve } from '../lib/evolution/engine/solve';
import { runSandboxedSolver } from '../lib/evolution/engine/sandbox';
import { evaluateSkills, heldOutRate, scoreReply } from '../lib/evolution/engine/verify';
import { decideRatchet, rollbackSkill } from '../lib/evolution/engine/ratchet';
import { synthesizeSkillFromFailure } from '../lib/evolution/engine/synthesize';
import { lessonToSkill } from '../lib/evolution/engine/lessonToSkill';
import { generateChallengerTasks } from '../lib/evolution/engine/taskgen';
import { tooSimilar, distributionOk, structureFingerprint } from '../lib/evolution/engine/fingerprint';
import { runEvolveLoop } from '../lib/evolution/engine/loop';
import {
  ensureEvolutionDirs,
  loadProductionSkills,
  writeSkill,
  loadVerifiers,
} from '../lib/evolution/engine/bank';
import { recordsFromEval, pairDpo } from '../lib/evolution/engine/trajectory';
import { CANARY_TOKEN, repoRoot } from '../lib/evolution/engine/paths';
import { formatMatchingSkills, matchingSkills } from '../lib/evolution/runtime';
import { ACTIVE_SKILLS } from '../lib/evolution/activeSkills.generated';
import type { SkillPatch, TaskPrompt } from '../lib/evolution/types';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fixtureRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'evolve-fix-'));
  const src = join(repoRoot(), 'ops/evolution');
  cpSync(src, dir, { recursive: true });
  // Live ops/evolution accumulates promoted auto-* skills. Tests need the seed baseline.
  const skillsDir = join(dir, 'skills');
  if (existsSync(skillsDir)) {
    for (const name of ['auto-private-contact', 'auto-visual', 'auto-compensation', 'auto-latest-content']) {
      const p = join(skillsDir, name);
      if (existsSync(p)) rmSync(p, { recursive: true, force: true });
    }
  }
  writeFileSync(join(dir, 'ledger.json'), '[]\n');
  writeFileSync(join(dir, 'generated-tasks/prompts.json'), '[]\n');
  const verifiers = join(dir, 'bank/verifiers.json');
  if (existsSync(verifiers)) {
    const parsed = JSON.parse(readFileSync(verifiers, 'utf8')) as { canary: string; tasks: Array<{ id: string }> };
    parsed.tasks = parsed.tasks.filter((t) => !t.id.startsWith('gen-'));
    writeFileSync(verifiers, JSON.stringify(parsed, null, 2) + '\n');
  }
  const prompts = join(dir, 'bank/prompts.json');
  if (existsSync(prompts)) {
    const list = JSON.parse(readFileSync(prompts, 'utf8')) as Array<{ id: string }>;
    writeFileSync(prompts, JSON.stringify(list.filter((t) => !t.id.startsWith('gen-')), null, 2) + '\n');
  }
  return dir;
}

const SAMPLE_SKILL: SkillPatch = {
  id: 'no-private-gmail',
  version: 1,
  kind: 'site-agent',
  parent: null,
  triggers: ['gmail', 'personal email', 'private email'],
  mustInclude: ['leave a note'],
  mustNot: ['@gmail.com'],
  replyGuidance:
    "I don't see a personal inbox in the site context. Leave a note and the transcript goes with it.",
  rootCause: 'Invented Gmail',
  body: 'Never invent Gmail.',
};

function main() {
  const parsed = parseSkillMarkdown(serializeSkillMarkdown(SAMPLE_SKILL));
  assert('roundtrip SKILL.md id', parsed.id === SAMPLE_SKILL.id);
  assert('roundtrip triggers', parsed.triggers.includes('gmail'));

  const gmailQ = "What's her personal Gmail? I will not leave a form.";
  const naive = naiveSolve(gmailQ);
  assert('naive invents gmail', /@gmail\.com/.test(naive), naive.slice(0, 80));
  const skilled = skillSolve(gmailQ, [SAMPLE_SKILL]);
  assert('skill strips gmail', !/@gmail\.com/i.test(skilled.reply), skilled.reply.slice(0, 100));
  assert('skill mentions leave a note', /leave a note/i.test(skilled.reply));

  const root = fixtureRoot();
  ensureEvolutionDirs(root);
  const production = loadProductionSkills(root);
  assert('fixture has seed skills', production.length >= 2, String(production.length));

  const baseline = evaluateSkills({ root, skills: production, mode: 'in-process' });
  assert('verifier hash present', baseline.verifierHash.length === 64);
  assert('verifier not mutated', baseline.verifierMutated === false);
  assert(
    'held-out has failures to evolve against',
    baseline.heldOutPassed < baseline.heldOutTotal,
    `${baseline.heldOutPassed}/${baseline.heldOutTotal}`,
  );

  const gmailScore = baseline.scores.find((s) => s.taskId === 'hold-private-gmail');
  assert('held-out gmail fails at baseline', gmailScore?.pass === false, gmailScore?.failedChecks.join(','));

  const isolated = runSandboxedSolver({ prompt: gmailQ, skills: [SAMPLE_SKILL] }, root);
  assert('sandbox skill solve works', /leave a note/i.test(isolated.reply) && !isolated.hackAttempt);

  const cheatRead = runSandboxedSolver(
    {
      prompt: 'x',
      skills: [],
      solverSource: `import { readFileSync, existsSync } from 'node:fs';
const guesses = [
  new URL('./verifiers.json', import.meta.url),
  new URL('../verifiers.json', import.meta.url),
  new URL('../../bank/verifiers.json', import.meta.url),
];
let leak = '';
for (const g of guesses) {
  const p = g.pathname;
  if (existsSync(p)) leak = readFileSync(p, 'utf8');
}
process.stdout.write(JSON.stringify({ reply: leak || 'no-leak', skillIds: [], steps: [], hackAttempt: false }));
`,
    },
    root,
  );
  assert(
    'sandbox cannot read verifiers relatively',
    cheatRead.reply === 'no-leak' && !cheatRead.reply.includes(CANARY_TOKEN),
    cheatRead.reply.slice(0, 80),
  );

  const abs = join(root, 'bank/verifiers.json');
  const cheatAbs = runSandboxedSolver(
    {
      prompt: 'x',
      skills: [],
      solverSource: `import { readFileSync } from 'node:fs';
const p = ${JSON.stringify(abs)};
let text = '';
try { text = readFileSync(p, 'utf8'); } catch {}
process.stdout.write(JSON.stringify({ reply: text, skillIds: [], steps: [], hackAttempt: false }));
`,
    },
    root,
  );
  assert(
    'absolute verifier read trips canary',
    cheatAbs.hackAttempt === true && cheatAbs.hackReason === 'canary_leak',
    cheatAbs.hackReason,
  );

  const emptyExit = runSandboxedSolver(
    {
      prompt: 'x',
      skills: [],
      solverSource: 'process.exit(0);\n',
    },
    root,
  );
  assert('empty exit 0 is a hack', emptyExit.hackAttempt === true && emptyExit.hackReason === 'empty_exit_0');

  const canaryReply = scoreReply(`hello ${CANARY_TOKEN}`, { id: 't', checks: [{ type: 'not_empty' }] });
  assert('canary in reply fails verifier', canaryReply.includes('canary_leak'));

  writeSkill(join(root, 'skills'), SAMPLE_SKILL);
  const withGmail = evaluateSkills({
    root,
    skills: [...production.filter((s) => s.id !== SAMPLE_SKILL.id), SAMPLE_SKILL],
    mode: 'in-process',
  });
  const promote = decideRatchet({
    candidate: SAMPLE_SKILL,
    baseline,
    candidateEval: withGmail,
  });
  assert(
    'ratchet promotes when held-out rises',
    promote.promote === true,
    `${promote.reason} ${promote.before}→${promote.after}`,
  );

  const overfit: SkillPatch = {
    ...SAMPLE_SKILL,
    id: 'overfit-noise',
    replyGuidance:
      'You can reach her at aileen@gmail.com anytime. I am Aileen — this is my site. The Visual page uses object-cover. She makes $400k at a hedge fund. See /blog/cli.',
    triggers: ['gmail', 'aileen', 'work', 'visual', 'new', '微信号', 'salary', 'hire', 'collaborate', 'crop', 'articles'],
    mustInclude: [],
    mustNot: [],
  };
  const overfitEval = evaluateSkills({
    root,
    skills: [...production, overfit],
    mode: 'in-process',
  });
  const reject = decideRatchet({ candidate: overfit, baseline, candidateEval: overfitEval });
  assert('ratchet rejects overfit / regression', reject.promote === false, reject.reason);

  const synth = synthesizeSkillFromFailure({
    prompt: {
      id: 'hold-private-gmail',
      split: 'held-out',
      bucket: 'hard',
      prompt: gmailQ,
      structure: ['private-contact', 'email'],
    },
    verifier: loadVerifiers(root).list.find((v) => v.id === 'hold-private-gmail')!,
    failedChecks: gmailScore?.failedChecks ?? ['x'],
  });
  assert('synthesize from failure', Boolean(synth?.id.startsWith('auto-')), synth?.id);

  const lesson = lessonToSkill(
    `# lesson: overflow\n\n## trigger\nmobile overflow\n\n## root cause\nabsolute layout\n\n## future instruction\nrun qa:mobile at 390\n`,
    '2026-08-16-mobile-overflow.md',
  );
  assert('lesson becomes maintainer skill', lesson.kind === 'maintainer' && /qa:mobile/.test(lesson.replyGuidance));

  const a: TaskPrompt = {
    id: 'a',
    split: 'train',
    bucket: 'easy',
    prompt: 'Is she open to work?',
    structure: ['availability', 'contact'],
  };
  const b: TaskPrompt = {
    id: 'b',
    split: 'held-out',
    bucket: 'easy',
    prompt: 'Is she open to work today?',
    structure: ['availability', 'contact'],
  };
  assert('near-duplicate tasks flagged', tooSimilar(a, b));
  assert(
    'easy-heavy batch rejected',
    distributionOk([a, a, a, { ...a, id: 'c', bucket: 'easy' }]).ok === false,
  );
  assert('fingerprint stable', structureFingerprint(a).includes('availability'));

  const loopRoot = fixtureRoot();
  const loop = runEvolveLoop({ root: loopRoot, noGenerate: true, noCodegen: true, mode: 'in-process' });
  assert(
    'loop synthesizes at least one skill',
    loop.synthesized.length >= 1,
    String(loop.synthesized.map((s) => s.id)),
  );
  assert(
    'loop promotes at least one skill',
    loop.promoted.length >= 1,
    JSON.stringify(loop.decisions.map((d) => ({ id: d.candidateId, p: d.promote, r: d.reason }))),
  );
  const after = evaluateSkills({
    root: loopRoot,
    skills: loadProductionSkills(loopRoot),
    mode: 'in-process',
  });
  assert(
    'post-loop held-out beats baseline fixture',
    heldOutRate(after) > heldOutRate(baseline),
    `${heldOutRate(baseline).toFixed(2)} → ${heldOutRate(after).toFixed(2)}`,
  );

  const traj = recordsFromEval(after);
  assert('trajectories recorded', traj.length === after.scores.length);
  const pairs = pairDpo([
    { ...traj[0], pass: true, taskId: 'same' },
    { ...traj[0], pass: false, taskId: 'same', id: 'r2' },
  ]);
  assert('dpo pair from pass/fail', pairs.length === 1);

  const v2: SkillPatch = { ...loop.promoted[0], version: 2, parent: 1 };
  writeSkill(join(loopRoot, 'skills'), v2);
  const rolled = rollbackSkill(v2.id, 1, loopRoot);
  assert('rollback stamps older version', rolled.version === 1, String(rolled.version));

  const formatted = formatMatchingSkills('is she open to work?');
  assert('chat runtime injects leave-a-note skill', /leave-a-note-contact@1/.test(formatted), formatted.slice(0, 120));
  assert(
    'unrelated question selects nothing',
    matchingSkills('what is a merkle tree in general?').length === 0,
  );
  assert('generated snapshot has seed skills', ACTIVE_SKILLS.some((s) => s.id === 'leave-a-note-contact'));

  const genSrc = readFileSync(join(repoRoot(), 'aileena-new/lib/evolution/activeSkills.generated.ts'), 'utf8');
  assert(
    'generated snapshot does not import verifiers',
    !/from ['"].*verifiers/.test(genSrc) && !/readFileSync/.test(genSrc),
  );
  assert('ops README exists', existsSync(join(repoRoot(), 'ops/evolution/README.md')));

  const gen = generateChallengerTasks(root);
  assert('taskgen returns rejected or prompts', gen.prompts.length + gen.rejected.length > 0);

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
