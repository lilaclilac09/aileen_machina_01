#!/usr/bin/env tsx
/**
 * Prompt / rule lint — conflict and presence checks.
 * Does not rewrite AGENTS.md. Run: pnpm verify:agent-rules
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

function readRepo(rel: string): string {
  return readFileSync(join(process.cwd(), '..', rel), 'utf8');
}

function main() {
  const agents = readRepo('AGENTS.md');
  const qa = readRepo('QA.md');
  const project = readRepo('PROJECT_RULES.md');
  const council = read('lib/aileenaCouncil.ts');
  const publicPrompt = read('lib/agentContext.ts');
  const lite = read('lib/agentContextLite.ts');
  const offline = read('lib/mail-transcript.ts');

  assert(
    'AGENTS.md forbids done without verification',
    /never mark a task complete based only on code inspection/i.test(agents) &&
      /do not say done unless you verified/i.test(agents),
  );
  assert('QA.md requires screenshots for UI', /screenshots/i.test(qa));
  assert(
    'council prompt forbids wellness popup',
    /no wellness popups/i.test(council) && /no therapy voice/i.test(council),
  );
  assert(
    'public prompt is not council',
    !/invoice hiding inside/i.test(publicPrompt) && !/COUNCIL_SYSTEM_PROMPT/.test(publicPrompt),
  );
  assert(
    'public prompt is not private council voice',
    !/no wellness popups/i.test(publicPrompt),
  );
  assert(
    'contact offline copy is unified',
    /offline right now/i.test(offline) && lite.includes('Note saving is offline right now'),
  );
  assert(
    'PROJECT_RULES forbids Visual cover-crop',
    /object-fit: contain/i.test(project) && /never.*cover/i.test(project),
  );
  assert(
    'lessons template has required headings',
    /## trigger/.test(readRepo('ops/lessons/TEMPLATE.md')) &&
      /## root cause/.test(readRepo('ops/lessons/TEMPLATE.md')) &&
      /## future instruction/.test(readRepo('ops/lessons/TEMPLATE.md')),
  );
  assert(
    'improvement queue requires owner approval',
    /Owner \*\*approves\*\*/.test(readRepo('ops/improvement-queue.md')) &&
      /pending owner approval/.test(readRepo('ops/improvement-queue.md')),
  );
  assert(
    'AGENTS.md points at lessons (does not self-rewrite)',
    /ops\/lessons/.test(agents) && /improvement-queue/.test(agents),
  );
  assert(
    'proof queue forbids auto-merge',
    /proof queue/.test(agents) && /no auto-merge/.test(agents) && /\/evolution/.test(agents),
  );
  assert(
    'no second public SYSTEM_PROMPT in lite file',
    /SYSTEM_PROMPT_LITE/.test(lite) && !/^export const SYSTEM_PROMPT =/m.test(lite),
  );
  assert('ops lessons dir exists', existsSync(join(process.cwd(), '..', 'ops/lessons')));

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
