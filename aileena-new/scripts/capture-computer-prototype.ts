#!/usr/bin/env tsx
/**
 * Capture proof-queue / computer-task screenshots into /opt/cursor/artifacts.
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
  await vPage.screenshot({ path: join(OUT, 'proof-visitor-locked.png'), fullPage: true });

  const owner = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await owner.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true }]);
  const page = await owner.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-testid="proof-queue-panel"]');

  await page.locator('[data-testid="proof-queue-daily"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="proof-flash"]')?.textContent?.includes('queued'));
  await page.screenshot({ path: join(OUT, 'proof-task-queued.png'), fullPage: true });

  const running = page.locator('[data-testid="computer-task-running"]');
  try {
    await running.first().waitFor({ timeout: 4000 });
    await page.screenshot({ path: join(OUT, 'proof-task-running.png'), fullPage: true });
  } catch {
    await page.screenshot({ path: join(OUT, 'proof-task-running.png'), fullPage: true });
  }

  await page.waitForSelector('[data-testid="computer-task-completed"]', { timeout: 20_000 });
  await page.waitForTimeout(400);
  await page.locator('[data-testid="computer-task-completed"]').first().click();
  await page.waitForSelector('[data-testid="computer-task-detail"]');
  await page.screenshot({ path: join(OUT, 'proof-task-result.png'), fullPage: true });
  await page.screenshot({ path: join(OUT, 'computer-task-detail.png'), fullPage: true });

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await desktop.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE, httpOnly: true }]);
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await dPage.screenshot({ path: join(OUT, 'proof-desktop.png'), fullPage: true });

  await browser.close();
  console.log(`wrote screenshots to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
