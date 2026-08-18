#!/usr/bin/env tsx
/**
 * Capture daily board screenshots into /opt/cursor/artifacts.
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
  throw new Error(`daily board not ready at ${BASE}`);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  await waitReady();
  const token = await createOwnerSession();
  const browser = await chromium.launch({ headless: true });

  const visitor = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const vPage = await visitor.newPage();
  await vPage.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await vPage.waitForSelector('[data-testid="daily-title"]');
  await vPage.waitForTimeout(400);
  const empty = await vPage.locator('[data-testid="daily-empty"]').count();
  if (empty) {
    await vPage.screenshot({ path: join(OUT, 'daily-empty.png'), fullPage: true });
  }

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
  await fetch(`${BASE}/api/daily/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId: note.id, body: 'saved this line' }),
  });

  await vPage.reload({ waitUntil: 'networkidle' });
  await vPage.waitForSelector('[data-testid="daily-latest-body"]');
  await vPage.waitForTimeout(500);
  await vPage.screenshot({ path: join(OUT, 'daily-latest-note.png'), fullPage: true });
  await vPage.locator('[data-testid="daily-comments"]').scrollIntoViewIfNeeded();
  await vPage.screenshot({ path: join(OUT, 'daily-comments.png'), fullPage: true });

  const ownerCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ownerCtx.addCookies([
    { name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true },
  ]);
  const oPage = await ownerCtx.newPage();
  await oPage.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await oPage.waitForSelector('[data-testid="daily-owner-editor"]');
  await oPage.waitForTimeout(400);
  await oPage.screenshot({ path: join(OUT, 'daily-owner-editor.png'), fullPage: true });
  await oPage.locator('[data-testid="daily-theme-controls"]').scrollIntoViewIfNeeded();
  await oPage.screenshot({ path: join(OUT, 'daily-theme-controls.png'), fullPage: true });

  const mobileV = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mv = await mobileV.newPage();
  await mv.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await mv.waitForSelector('[data-testid="daily-latest-body"]');
  await mv.waitForTimeout(400);
  await mv.screenshot({ path: join(OUT, 'mobile-daily-latest.png') });
  await mv.locator('[data-testid="daily-comments"]').scrollIntoViewIfNeeded();
  await mv.screenshot({ path: join(OUT, 'mobile-daily-comments.png') });

  const mobileO = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileO.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true }]);
  const mo = await mobileO.newPage();
  await mo.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await mo.waitForSelector('[data-testid="daily-owner-editor"]');
  await mo.waitForTimeout(400);
  await mo.screenshot({ path: join(OUT, 'mobile-daily-editor.png') });

  const doors = await visitor.newPage();
  await doors.goto(`${BASE}/doors`, { waitUntil: 'networkidle' });
  await doors.waitForSelector('#hub-daily');
  await doors.screenshot({ path: join(OUT, 'doors-daily-entry.png'), fullPage: true });

  await browser.close();
  console.log('captured into', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
