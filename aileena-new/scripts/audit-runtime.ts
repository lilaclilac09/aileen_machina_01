#!/usr/bin/env tsx
/**
 * Runtime path audit — known public routes keep the runtime we expect.
 *
 *   pnpm audit:runtime
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Expect = { file: string; runtime: 'edge' | 'nodejs' };
const EXPECT: Expect[] = [
  { file: 'app/api/chat/route.ts', runtime: 'edge' },
  { file: 'app/api/voice-code/route.ts', runtime: 'edge' },
  { file: 'app/api/tts/route.ts', runtime: 'edge' },
  { file: 'app/api/lead/route.ts', runtime: 'nodejs' },
  { file: 'app/api/auth/owner/route.ts', runtime: 'nodejs' },
  { file: 'app/api/agent/computer/tasks/route.ts', runtime: 'nodejs' },
];

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function main() {
  for (const row of EXPECT) {
    const abs = join(process.cwd(), row.file);
    assert(`${row.file} exists`, existsSync(abs));
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    const declared = /export const runtime = '([^']+)'/.exec(src)?.[1];
    if (row.file === 'app/api/lead/route.ts' && !declared) {
      assert(`${row.file} is node (default / Resend)`, !/export const runtime = 'edge'/.test(src));
      continue;
    }
    assert(`${row.file} runtime is ${row.runtime}`, declared === row.runtime, declared ?? 'missing');
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
