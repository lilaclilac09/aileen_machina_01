#!/usr/bin/env tsx
/**
 * Local checks for the council CLI gate + redaction. Does not call a model.
 *
 *   pnpm exec tsx scripts/verify-council-cli.ts
 */

import {
  assertCouncilCliAllowed,
  envNamesPresent,
  redactSecrets,
} from '../lib/councilCliContext';
import { buildCouncilCliSystemPrompt } from '../lib/aileenaCouncil';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function main() {
  const leaked = redactSecrets(
    'Authorization: Bearer sk-abc123456789 token=gsk_abcd RESEND_API_KEY=re_secret',
  );
  assert(
    'redactSecrets strips key-shaped values',
    !/sk-abc|gsk_|re_secret/.test(leaked) && /\[redacted/.test(leaked),
    leaked,
  );

  const prompt = buildCouncilCliSystemPrompt({
    lens: 'review',
    repoContext: 'branch: test\nDEEPSEEK_API_KEY=should-not-matter',
  });
  assert('cli system prompt is council not public guide', /private council/i.test(prompt) && /not a public site guide/i.test(prompt));
  assert('cli output contract present', /what is happening/i.test(prompt) && /exact prompt \/ commands/i.test(prompt));
  assert('cli cannot claim file writes', /cannot edit the repository/i.test(prompt));

  const savedVercel = process.env.VERCEL;
  const savedOwner = process.env.OWNER_KEY;
  delete process.env.OWNER_KEY;
  process.env.VERCEL = '1';
  let vercelBlocked = false;
  try {
    assertCouncilCliAllowed();
  } catch (e) {
    vercelBlocked = /local-only/i.test(String(e));
  }
  assert('refuses Vercel runtime', vercelBlocked);
  delete process.env.VERCEL;
  let ownerBlocked = false;
  try {
    assertCouncilCliAllowed();
  } catch (e) {
    ownerBlocked = /OWNER_KEY/i.test(String(e));
  }
  assert('refuses missing OWNER_KEY', ownerBlocked);
  if (savedVercel !== undefined) process.env.VERCEL = savedVercel;
  if (savedOwner !== undefined) process.env.OWNER_KEY = savedOwner;
  else delete process.env.OWNER_KEY;

  const names = envNamesPresent();
  assert(
    'envNamesPresent never includes values',
    names.every((n) => /^[A-Z0-9_]+$/.test(n)),
    names.join(','),
  );

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n${failed.length} failed`);
    process.exit(1);
  }
  console.log(`\n${checks.length} council-cli checks passed`);
}

main();
