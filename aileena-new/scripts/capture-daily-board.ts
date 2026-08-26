#!/usr/bin/env tsx
/**
 * Capture /daily + /proof screenshots into /opt/cursor/artifacts.
 * Requires Next on VERIFY_BASE_URL (default http://127.0.0.1:3000).
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

const NOTE =
  'I love part of you and you only like the best part of me\nAnd so are we to the world so you hate me no more';

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/daily`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`daily not ready at ${BASE}`);
}

async function hideDevNoise(page: import('playwright').Page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-next-badge],
      [data-next-mark],
      #__next-build-watcher {
        display: none !important;
      }
    `,
  });
}

function cookie(token: string) {
  return { name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true };
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  await waitReady();
  const token = await createOwnerSession();
  await fetch(`${BASE}/api/daily/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `${SESSION_COOKIE}=${token}` },
    body: JSON.stringify({
      background: '#f4efe6',
      text: '#2a241c',
      accent: '#00a89d',
      bubble: '#ece6dc',
    }),
  });
  // Clear today's body so visitor empty state is actually empty (prior live verifies write a note).
  await fetch(`${BASE}/api/daily/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `${SESSION_COOKIE}=${token}` },
    body: JSON.stringify({ body: '' }),
  });
  const browser = await chromium.launch({
    headless: true,
    executablePath: existsSync('/usr/local/bin/google-chrome') ? '/usr/local/bin/google-chrome' : undefined,
  });

  const visitor = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const vPage = await visitor.newPage();
  await vPage.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await vPage.keyboard.press('Escape');
  await hideDevNoise(vPage);
  await vPage.waitForSelector('[data-testid="daily-title"]');
  await vPage.waitForTimeout(400);
  await vPage.screenshot({ path: join(OUT, 'daily-visitor-empty-clean.png'), fullPage: true });
  await vPage.screenshot({ path: join(OUT, 'daily-owner-unlock-closed.png'), fullPage: true });
  await vPage.getByTestId('daily-owner-dot').click();
  await vPage.waitForSelector('[data-testid="daily-owner-popover"]');
  await vPage.waitForTimeout(200);
  await vPage.screenshot({ path: join(OUT, 'daily-owner-unlock-popover.png'), fullPage: true });
  await vPage.keyboard.press('Escape');

  const ownerPost = await fetch(`${BASE}/api/daily/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `${SESSION_COOKIE}=${token}` },
    body: JSON.stringify({ body: NOTE }),
  });
  if (!ownerPost.ok) throw new Error(`owner note ${ownerPost.status}`);
  const { note } = (await ownerPost.json()) as { note: { id: string } };
  await fetch(`${BASE}/api/daily/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `${SESSION_COOKIE}=${token}` },
    body: JSON.stringify({
      background: '#f4efe6',
      text: '#2a241c',
      accent: '#00a89d',
      bubble: '#ece6dc',
    }),
  });
  await fetch(`${BASE}/api/daily/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId: note.id, body: 'this hurt nicely', nickname: 'anon' }),
  });

  const visitorProof = await visitor.newPage();
  await visitorProof.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await visitorProof.keyboard.press('Escape');
  await hideDevNoise(visitorProof);
  await visitorProof.waitForTimeout(300);
  await visitorProof.screenshot({ path: join(OUT, 'proof-visitor-owner-only.png'), fullPage: true });

  await vPage.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await vPage.keyboard.press('Escape');
  await hideDevNoise(vPage);
  await vPage.waitForSelector('[data-testid="daily-latest-body"]');
  await vPage.waitForTimeout(400);
  await vPage.screenshot({ path: join(OUT, 'daily-note-saved.png'), fullPage: true });
  await vPage.locator('[data-testid="daily-comments"]').scrollIntoViewIfNeeded();
  await vPage.screenshot({ path: join(OUT, 'daily-comments.png'), fullPage: true });

  const ownerCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ownerCtx.addCookies([cookie(token)]);
  const oPage = await ownerCtx.newPage();
  await oPage.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await oPage.keyboard.press('Escape');
  await hideDevNoise(oPage);
  await oPage.waitForSelector('[data-testid="daily-owner-editor"]');
  await oPage.waitForTimeout(400);
  await oPage.screenshot({ path: join(OUT, 'daily-owner-editor.png'), fullPage: true });

  await oPage.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await oPage.keyboard.press('Escape');
  await hideDevNoise(oPage);
  await oPage.waitForSelector('[data-proof-queue]');
  await oPage.waitForTimeout(400);
  await oPage.screenshot({ path: join(OUT, 'proof-owner-queue.png'), fullPage: true });
  const dailyCard = oPage.locator('[data-proof-card]').filter({ hasText: 'Fix /daily owner key UI' }).first();
  await dailyCard.scrollIntoViewIfNeeded();
  await dailyCard.screenshot({ path: join(OUT, 'proof-proposal-card.png') });
  await oPage.locator('[data-section="ideas"]').scrollIntoViewIfNeeded();
  await oPage.screenshot({ path: join(OUT, 'proof-status-lights.png'), fullPage: true });

  const mobileV = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mv = await mobileV.newPage();
  await mv.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await mv.keyboard.press('Escape');
  await hideDevNoise(mv);
  await mv.waitForTimeout(400);
  await mv.screenshot({ path: join(OUT, 'mobile-daily-visitor.png') });
  if (await mv.getByTestId('daily-comments').count()) {
    await mv.locator('[data-testid="daily-comments"]').scrollIntoViewIfNeeded();
    await mv.screenshot({ path: join(OUT, 'mobile-daily-comments.png') });
  }

  const mobileO = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileO.addCookies([cookie(token)]);
  const mo = await mobileO.newPage();
  await mo.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await mo.keyboard.press('Escape');
  await hideDevNoise(mo);
  await mo.waitForSelector('[data-testid="daily-owner-editor"]');
  await mo.waitForTimeout(300);
  await mo.screenshot({ path: join(OUT, 'mobile-daily-editor.png') });
  await mo.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await mo.keyboard.press('Escape');
  await hideDevNoise(mo);
  await mo.waitForSelector('[data-proof-queue]');
  await mo.waitForTimeout(300);
  await mo.screenshot({ path: join(OUT, 'mobile-proof-queue.png') });

  await browser.close();
  console.log('captured into', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
