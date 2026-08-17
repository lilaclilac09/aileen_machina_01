#!/usr/bin/env tsx
/**
 * Print the post-PR review checklist.
 * With --blocked "<reason>", append a pending proposal to ops/improvement-queue.md.
 * Never writes AGENTS.md / QA.md / PROJECT_RULES.md.
 *
 *   pnpm report:merge
 *   pnpm report:merge -- --blocked "merge gate: missing mobile screenshots"
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const QUEUE = join(process.cwd(), '..', 'ops/improvement-queue.md');
const REVIEW = join(process.cwd(), '..', 'ops/post-pr-review.md');

function nextId(src: string): number {
  const ids = [...src.matchAll(/^## #(\d+)/gm)].map((m) => Number(m[1]));
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

function main() {
  const blockedIdx = process.argv.indexOf('--blocked');
  const reason =
    blockedIdx >= 0 ? process.argv.slice(blockedIdx + 1).join(' ').trim() : '';

  console.log('--- post-PR review ---');
  console.log(readFileSync(REVIEW, 'utf8').split('## Rules')[0].trim());
  console.log('\nThis script does not promote rules. Owner approval only.\n');

  if (!reason) {
    console.log('No --blocked flag. Nothing appended to the queue.');
    return;
  }

  const queue = readFileSync(QUEUE, 'utf8');
  if (queue.includes(reason) && /status:\s*\npending owner approval/.test(queue)) {
    console.log('A pending row already mentions this reason. Not duplicating.');
    return;
  }

  const id = nextId(queue);
  const block = `

## #${id} — merge gate blocked

\`\`\`txt
proposed rule:
add a regression check for: ${reason}

reason:
merge gate blocked a PR. ${reason}

suggested file:
QA.md

risk:
one more command before merge. Stops repeating an unverified class of change.

status:
pending owner approval
\`\`\`
`;

  writeFileSync(QUEUE, queue.trimEnd() + block + '\n');
  console.log(`Appended proposal #${id} to ops/improvement-queue.md`);
  console.log('Did not edit AGENTS.md.');
}

main();
