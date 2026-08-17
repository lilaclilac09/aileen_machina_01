#!/usr/bin/env tsx
/**
 * Contact / Resend audit (source, no secrets).
 *
 *   pnpm verify:contact
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTACT_INBOX_ENV_NAMES, BRAND_SEND_ONLY } from '../lib/contact-inbox';
import { CONTACT_OFFLINE_PUBLIC } from '../lib/mail-transcript';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

function main() {
  const leadPath = join(process.cwd(), 'app/api/lead/route.ts');
  assert('lead route exists', existsSync(leadPath));
  const lead = read('app/api/lead/route.ts');
  const chat = read('components/AgentChat.tsx');
  const inbox = read('lib/contact-inbox.ts');

  assert('CONTACT_TO is a known inbox env name', CONTACT_INBOX_ENV_NAMES.includes('CONTACT_TO'));
  assert('inbox module lists CONTACT_TO_EMAIL and LEAD_INBOX', /CONTACT_TO_EMAIL/.test(inbox) && /LEAD_INBOX/.test(inbox));
  assert('lead route reads transcript', /body\.transcript/.test(lead) && /normalizeTranscript/.test(lead));
  assert('lead route sends via Resend', /RESEND_API_KEY/.test(lead) && /new Resend/.test(lead));
  assert('lead route renders transcript into mail', /renderTranscriptHtml/.test(lead) && /renderTranscriptText/.test(lead));
  assert(
    'offline copy stays public-safe',
    /offline right now/i.test(CONTACT_OFFLINE_PUBLIC) && !/resend|api key|vercel/i.test(CONTACT_OFFLINE_PUBLIC),
  );
  assert('console leave-a-note uses CONTACT_OFFLINE_PUBLIC', chat.includes('{CONTACT_OFFLINE_PUBLIC}'));
  assert('brand cafe@ is send-only, not To', BRAND_SEND_ONLY === 'cafe@aileena.xyz' && /refusing brand send-only/.test(inbox));

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
