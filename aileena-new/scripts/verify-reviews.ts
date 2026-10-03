#!/usr/bin/env tsx
/**
 * Owner review room: visitors get 403 and no report body.
 *   VERIFY_BASE_URL=http://localhost:3000 pnpm exec tsx scripts/verify-reviews.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';
import type { ReviewReport } from '../lib/reviews/report';

function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvLocal();

const base = process.env.VERIFY_BASE_URL || 'http://localhost:3000';
const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fixture(scope: string, action: 'comment' | 'request_changes'): ReviewReport {
  return {
    mode: 'changes',
    scope,
    dimensions: [
      { key: 'correctness', label: 'Correctness', short: 'Corr' },
      { key: 'security', label: 'Security', short: 'Sec' },
      { key: 'reliability', label: 'Reliability', short: 'Rel' },
      { key: 'compatibility', label: 'Compatibility', short: 'Compat' },
      { key: 'testGap', label: 'Test gap', short: 'Tests' },
    ],
    screenedFiles: 2,
    contextFiles: ['tests/door.test.ts'],
    matrix: [
      {
        file: 'app/reviews/page.tsx',
        correctness: 0.82,
        security: 0.21,
        reliability: 0.44,
        compatibility: 0.12,
        testGap: 0.73,
      },
      {
        file: 'lib/reviews/store.ts',
        correctness: 0.18,
        security: 0.08,
        reliability: 0.22,
        compatibility: 0.05,
        testGap: 0.31,
      },
    ],
    followedSignals: 2,
    profiles: [
      {
        file: 'app/reviews/page.tsx',
        category: 'behavior',
        categoryConfidence: 0.8,
        reviewPriority: 2.4,
        reviewPriorityConfidence: 0.7,
      },
    ],
    workflow: {
      screenedCells: 10,
      thresholdSignals: 2,
      profiledFiles: 1,
      followedSignals: 2,
      locatedFindings: 1,
      routedFindings: action === 'request_changes' ? 1 : 0,
    },
    findings: [
      {
        file: 'app/reviews/page.tsx',
        dimension: 'correctness',
        probability: 0.82,
        line: 40,
        locationConfidence: 0.9,
        mechanism: 'owner gate',
        mechanismConfidence: 0.8,
        severity: action === 'request_changes' ? 2.6 : 1.2,
        severityConfidence: 0.75,
        owner: 'security',
        ownerConfidence: 0.6,
        action,
      },
    ],
  };
}

async function main() {
  const page = await fetch(`${base}/reviews`);
  const html = page.ok ? await page.text() : '';
  assert('visitor /reviews is the door', page.ok && html.includes('owner-passkey-unlock'), String(page.status));
  assert('visitor html has no findings table', !html.includes('reviews-finding') && !html.includes('Risk screening'));
  assert('visitor html has no fixture scope', !html.includes('fixture/alpha'));

  const denied = await fetch(`${base}/api/owner/reviews`);
  assert('visitor GET reviews → 403', denied.status === 403, String(denied.status));
  const deniedBody = await denied.text();
  assert('visitor body has no scope', !deniedBody.includes('fixture'));

  const bogus = await fetch(`${base}/api/owner/reviews/not-a-real-id`);
  assert('visitor GET one → 403', bogus.status === 403, String(bogus.status));

  const token = await createOwnerSession();
  const cookie = `${SESSION_COOKIE}=${token}`;
  const headers = { 'Content-Type': 'application/json', Cookie: cookie };

  const bad = await fetch(`${base}/api/owner/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ scope: 'nope' }),
  });
  assert('owner rejects a non-report', bad.status === 400, String(bad.status));

  const first = await fetch(`${base}/api/owner/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fixture('fixture/alpha', 'request_changes')),
  });
  const firstJson = (await first.json()) as { review?: { id: string } };
  assert('owner saves review A', first.ok && Boolean(firstJson.review?.id), String(first.status));

  const second = await fetch(`${base}/api/owner/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fixture('fixture/beta', 'comment')),
  });
  const secondJson = (await second.json()) as { review?: { id: string } };
  assert('owner saves review B', second.ok && Boolean(secondJson.review?.id), String(second.status));

  const list = await fetch(`${base}/api/owner/reviews`, { headers: { Cookie: cookie } });
  const listJson = (await list.json()) as { reviews?: Array<{ id: string; scope: string }> };
  const scopes = (listJson.reviews ?? []).map((row) => row.scope);
  assert('owner list has both reviews', scopes.includes('fixture/alpha') && scopes.includes('fixture/beta'), scopes.join(','));

  const one = await fetch(`${base}/api/owner/reviews/${firstJson.review?.id}`, { headers: { Cookie: cookie } });
  const oneJson = (await one.json()) as { status?: string; report?: { findings?: unknown[] } };
  assert('owner can open one review', one.ok && oneJson.status === 'ok' && (oneJson.report?.findings?.length ?? 0) === 1);

  const stillDenied = await fetch(`${base}/api/owner/reviews`);
  assert('visitor still 403 after saves', stillDenied.status === 403, String(stillDenied.status));

  const shotDir = '/tmp/aileena-reviews';
  const { mkdirSync } = await import('node:fs');
  mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: base },
  ]);
  const tab = await context.newPage();
  await tab.goto(`${base}/reviews`, { waitUntil: 'networkidle' });
  await tab.waitForSelector('[data-testid="reviews-index"]');
  const indexText = await tab.locator('[data-testid="reviews-index"]').innerText();
  assert('dashboard lists both scopes', indexText.includes('alpha') && indexText.includes('beta'), indexText.replace(/\s+/g, ' '));
  await tab.screenshot({ path: join(shotDir, 'reviews-desktop.png'), fullPage: true });
  await tab.setViewportSize({ width: 390, height: 844 });
  await tab.screenshot({ path: join(shotDir, 'reviews-mobile-390.png'), fullPage: true });
  const overflow = await tab.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert('390 has no horizontal overflow', overflow === false);
  await context.close();

  for (const id of [firstJson.review?.id, secondJson.review?.id]) {
    if (!id) continue;
    const removed = await fetch(`${base}/api/owner/reviews/${id}`, { method: 'DELETE', headers: { Cookie: cookie } });
    assert(`removed ${id}`, removed.ok, String(removed.status));
  }

  const after = await fetch(`${base}/api/owner/reviews`, { headers: { Cookie: cookie } });
  const afterJson = (await after.json()) as { reviews?: Array<{ scope: string }> };
  assert(
    'fixtures removed',
    !(afterJson.reviews ?? []).some((row) => row.scope.startsWith('fixture/')),
  );

  const layout = await browser.newContext();
  await layout.addCookies([{ name: SESSION_COOKIE, value: token, url: base }]);
  const room = await layout.newPage();
  await room.goto(`${base}/reviews`, { waitUntil: 'networkidle' });
  await room.waitForSelector('text=Layout sample');
  const sampleIndex = await room.locator('[data-testid="reviews-index"]').innerText();
  assert('empty room shows layout samples', sampleIndex.includes('checkout') && sampleIndex.includes('door'), sampleIndex.replace(/\s+/g, ' '));
  await room.screenshot({ path: join(shotDir, 'reviews-layout-desktop.png'), fullPage: true });
  await room.getByRole('button', { name: 'Flow', exact: true }).click();
  await room.waitForSelector('[data-testid="reviews-flow"]');
  await room.screenshot({ path: join(shotDir, 'reviews-flow-desktop.png'), fullPage: true });
  await room.getByRole('button', { name: 'Open' }).first().click();
  await room.waitForSelector('text=Layout sample');
  assert('flow step returns to the report', (await room.locator('[data-testid="reviews-flow"]').count()) === 0);
  await room.setViewportSize({ width: 390, height: 844 });
  await room.getByRole('button', { name: 'Flow', exact: true }).click();
  await room.waitForSelector('[data-testid="reviews-flow"]');
  const layoutOverflow = await room.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert('layout 390 has no horizontal overflow', layoutOverflow === false);
  await room.screenshot({ path: join(shotDir, 'reviews-flow-mobile-390.png'), fullPage: true });
  await room.getByRole('button', { name: 'Report', exact: true }).click();
  await room.screenshot({ path: join(shotDir, 'reviews-layout-mobile-390.png'), fullPage: true });
  await browser.close();

  const failed = checks.filter((check) => !check.ok);
  if (failed.length) {
    console.error(`${failed.length} failed`);
    process.exit(1);
  }
  console.log('ok', checks.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
