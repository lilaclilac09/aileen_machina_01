#!/usr/bin/env tsx
/**
 * Console opens with the computer already on (390×844 visitor).
 * One-shots: + write, ○ peek last note, : clock.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function flashWait(page: import('playwright').Page, re: RegExp) {
  await page.waitForFunction(
    (src) => new RegExp(src, 'i').test(document.querySelector('[data-testid="proof-flash"]')?.textContent || ''),
    re.source,
    { timeout: 20_000 },
  );
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  await page.waitForSelector('[data-testid="computer-key-peek"]', { timeout: 15_000, state: 'visible' });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-oneshot-keys-390.png'),
  });
  await page.locator('[aria-label="note"]').fill('one shot from the pad');
  await page.locator('[data-testid="computer-key-note"]').click();
  await flashWait(page, /note done|completed/);
  await page.locator('[data-testid="computer-key-peek"]').click();
  await flashWait(page, /peek done|completed/);
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-oneshot-peek-390.png'),
  });
  await page.locator('[data-testid="computer-key-clock"]').click();
  await flashWait(page, /clock done|completed/);
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-oneshot-clock-390.png'),
  });
  await browser.close();
  console.log('wrote one-shot screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
