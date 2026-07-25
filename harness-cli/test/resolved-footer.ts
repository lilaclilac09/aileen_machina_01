/**
 * Unit + Slack-emulation coverage for Codex/Nanocodex A/B resolved footer.
 */
import {
  formatBuggyAbFooter,
  formatCliHarnessFooter,
  formatSlackConsoleFooter,
  type ExecutionMetadata,
} from '../src/core/resolvedHarness.ts';
import { assignAbCohort, mapCohortToHarness, resolveHarnessName } from '../src/core/abAssign.ts';
import { buildHarness, toExecutionMetadata } from '../src/adapters/factory.ts';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  // --- resolveHarnessName: explicit wins (api-rs persisted resolve) ---
  assert(
    resolveHarnessName({
      explicit: 'Nanocodex',
      assignment: {
        experiment: 'x',
        cohort: 'A',
        mappedHarness: 'Codex',
        reason: 'hash',
        assignedAt: 't',
      },
    }) === 'Nanocodex',
    'explicit Nanocodex must win over cohort A→Codex',
  );

  // --- Slack footer uses resolved, not Codex* lump ---
  const nanoMeta: ExecutionMetadata = {
    resolved: {
      name: 'Nanocodex',
      profile: 'run',
      provider: 'mock',
      write: false,
      shell: false,
      readOnly: false,
    },
    assignment: {
      experiment: 'codex-nanocodex-ab',
      cohort: 'B',
      mappedHarness: 'Nanocodex',
      reason: 'hash',
      assignedAt: 't',
    },
  };

  const slack = formatSlackConsoleFooter(nanoMeta);
  assert(slack.includes('harness=Nanocodex'), `expected Nanocodex in footer: ${slack}`);
  assert(!slack.includes('Codex*'), 'must not show Codex* lump');
  assert(slack.includes('ab=codex-nanocodex-ab:B'), 'keep A/B provenance in footer bits');

  const buggy = formatBuggyAbFooter(nanoMeta);
  assert(buggy.includes('Codex*'), 'buggy helper still reproduces old bug');
  assert(slack !== buggy, 'fixed footer must differ from buggy Codex* footer');

  const cli = formatCliHarnessFooter(nanoMeta);
  assert(cli.includes('[harness] Nanocodex'), cli);
  assert(cli.includes('ab=B→Nanocodex'), cli);

  // --- sticky assign + buildHarness resolves Nanocodex for forced harness ---
  const key = `test-nano-${Date.now()}`;
  const assignment = assignAbCohort(key, { forceHarness: 'Nanocodex' });
  assert(assignment.mappedHarness === 'Nanocodex', 'force Nanocodex');
  assert(mapCohortToHarness('B') === 'Nanocodex', 'B maps to Nanocodex');
  assert(mapCohortToHarness('A') === 'Codex', 'A maps to Codex');

  const built = buildHarness({
    provider: 'mock',
    cwd: root,
    write: false,
    shell: false,
    ab: true,
    harness: 'Nanocodex',
    sessionKey: key,
  });
  assert(built.resolved.name === 'Nanocodex', `resolved=${built.resolved.name}`);
  assert(built.assignment?.cohort === 'B' || built.assignment?.mappedHarness === 'Nanocodex', 'assignment provenance');

  const meta = toExecutionMetadata(built);
  const footer = formatSlackConsoleFooter(meta);
  assert(footer.includes('harness=Nanocodex'), footer);

  // Codex cohort must show Codex, not get stuck as generic
  const builtCodex = buildHarness({
    provider: 'mock',
    cwd: root,
    write: false,
    shell: false,
    ab: true,
    harness: 'Codex',
    sessionKey: `test-codex-${Date.now()}`,
  });
  assert(builtCodex.resolved.name === 'Codex', builtCodex.resolved.name);
  assert(formatSlackConsoleFooter(toExecutionMetadata(builtCodex)).includes('harness=Codex'));

  console.log('resolved-footer tests ok');
  console.log(footer);
}

main();
