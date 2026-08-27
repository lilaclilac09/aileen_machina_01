#!/usr/bin/env tsx
/**
 * Capture computer-in-dialog screenshots into /opt/cursor/artifacts.
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

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/proof`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`proof page not ready at ${BASE}`);
}

async function openConsole(page: import('playwright').Page) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForSelector('[data-testid="computer-console-dock"]', { timeout: 15_000, state: 'visible' });
  await page.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  await page.waitForTimeout(400);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  await waitReady();
  const token = await createOwnerSession();
  const browser = await chromium.launch({ headless: true });

  const visitor = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const vPage = await visitor.newPage();
  await vPage.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await vPage.keyboard.press('Escape');
  await vPage.waitForSelector('[data-testid="owner-passkey-unlock"]');
  await vPage.screenshot({ path: join(OUT, 'proof-visitor-locked.png'), fullPage: true });

  await vPage.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
  await vPage.keyboard.press('Escape');
  const dailyDoor = await vPage.locator('[data-testid="daily-owner-enter"], [data-testid="owner-passkey-unlock"]').count();
  if (dailyDoor > 0) throw new Error('daily still shows an owner door');
  await vPage.screenshot({ path: join(OUT, 'daily-visitor-no-owner-door.png'), fullPage: true });

  await vPage.goto(`${BASE}/council`, { waitUntil: 'networkidle' });
  await vPage.keyboard.press('Escape');
  const password = await vPage.locator('input[type="password"]').count();
  if (password > 0) throw new Error('council still has a password field');
  await vPage.screenshot({ path: join(OUT, 'council-passkey-door.png'), fullPage: true });

  const owner = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await owner.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true }]);
  const page = await owner.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-testid="proof-console-signpost"]');
  await page.screenshot({ path: join(OUT, 'proof-owner-signpost.png'), fullPage: true });

  await openConsole(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error('horizontal overflow on console 390');
  await page.screenshot({ path: join(OUT, 'console-computer-dock.png') });

  await page.locator('[data-testid="harness-plugin-inspect"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="proof-flash"]')?.textContent?.includes('queued'));
  await page.screenshot({ path: join(OUT, 'proof-task-queued.png') });

  await page.waitForFunction(() => {
    return Boolean(document.querySelector('[data-testid="computer-task-completed"]'));
  }, null, { timeout: 20_000 });
  await page.locator('[data-testid="computer-task-completed"]').first().click();
  await page.waitForSelector('[data-testid="computer-task-detail"]', { timeout: 8_000 });
  await page.screenshot({ path: join(OUT, 'proof-task-result.png') });
  await page.locator('[data-testid="computer-task-detail"]').screenshot({ path: join(OUT, 'computer-task-detail.png') });

  await vPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await vPage.keyboard.press('Escape');
  await vPage.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await vPage.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  const visitorDock = await vPage.locator('[data-testid="computer-console-dock"]').count();
  if (visitorDock > 0) throw new Error('visitor saw computer dock');
  await vPage.screenshot({ path: join(OUT, 'agent-tabs-visitor-hidden.png') });

  const tools = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tPage = await tools.newPage();
  await tPage.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await tPage.keyboard.press('Escape');
  await tPage.locator('#computer').scrollIntoViewIfNeeded();
  await tPage.screenshot({ path: join(OUT, 'tools-computer-card.png') });

  await tPage.goto(`${BASE}/tools/computer`, { waitUntil: 'networkidle' });
  await tPage.screenshot({ path: join(OUT, 'tools-computer-page.png') });

  await tPage.goto(`${BASE}/blog/machina-computer`, { waitUntil: 'networkidle' });
  await tPage.screenshot({ path: join(OUT, 'blog-machina-computer.png'), fullPage: true });

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await desktop.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true }]);
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await openConsole(dPage);
  await dPage.screenshot({ path: join(OUT, 'proof-desktop.png') });
  await dPage.screenshot({ path: join(OUT, 'agent-tabs-owner.png') });

  await dPage.locator('[data-testid="computer-tab-git"]').click();
  await dPage.locator('[data-testid="git-action-recent"]').click();
  await dPage.waitForFunction(() => {
    const el = document.querySelector('[data-testid="git-recent-commits"]');
    return /[0-9a-f]{7}/i.test(el?.textContent || '');
  }, null, { timeout: 40_000 });
  await dPage.waitForFunction(() => !document.querySelector('[data-testid="computer-task-running"]'), null, {
    timeout: 40_000,
  });
  await dPage.locator('[data-testid="git-recent-commits"]').scrollIntoViewIfNeeded();
  await dPage.locator('[data-testid="git-recent-commits"]').screenshot({ path: join(OUT, 'git-tab-recent-commits.png') });

  await dPage.locator('[data-testid="git-action-find-sound"]').click();
  await dPage.waitForFunction(() => {
    const running = Boolean(document.querySelector('[data-testid="computer-task-running"]'));
    const el = document.querySelector('[data-testid="git-merge-candidates"]');
    const text = el?.textContent || '';
    return !running && /files=/.test(text) && /[0-9a-f]{7}/i.test(text);
  }, null, { timeout: 45_000 });
  await dPage.locator('[data-testid="git-merge-candidates"]').scrollIntoViewIfNeeded();
  await dPage.locator('[data-testid="git-merge-candidates"]').screenshot({
    path: join(OUT, 'git-tab-sound-merge-candidates.png'),
  });

  await dPage.locator('[data-testid="computer-tab-files"]').click();
  await dPage.locator('[data-testid="files-action-open"]').click();
  await dPage.waitForFunction(() => {
    const running = Boolean(document.querySelector('[data-testid="computer-task-running"]'));
    const el = document.querySelector('[data-testid="files-readonly"]');
    const t = el?.textContent || '';
    return !running && t.length > 40 && !/open a file to preview/i.test(t);
  }, null, { timeout: 40_000 });
  await dPage.locator('[data-testid="files-readonly"]').scrollIntoViewIfNeeded();
  await dPage.locator('[data-testid="computer-console-dock"]').screenshot({ path: join(OUT, 'files-tab-readonly.png') });

  await dPage.locator('[data-testid="computer-tab-proof"]').click();
  await dPage.waitForFunction(() => {
    const el = document.querySelector('[data-testid="proof-attachment"]');
    return /hash \| date|Sound Lab rollback|[0-9a-f]{7}/i.test(el?.textContent || '');
  }, null, { timeout: 15_000 });
  await dPage.locator('[data-testid="proof-attachment"]').scrollIntoViewIfNeeded();
  await dPage.locator('[data-testid="computer-console-dock"]').screenshot({ path: join(OUT, 'proof-attachment.png') });

  await dPage.locator('[data-testid="computer-tab-git"]').click();
  await dPage.locator('[data-testid="git-action-status"]').click();
  await dPage.locator('[data-testid="computer-tab-tasks"]').click();
  await dPage.waitForSelector('[data-testid="computer-task-running"]', { timeout: 12_000 });
  await dPage.locator('[data-testid="computer-console-dock"]').screenshot({ path: join(OUT, 'tasks-tab-running.png') });

  await browser.close();
  console.log(`wrote screenshots to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
