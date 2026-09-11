#!/usr/bin/env tsx
/**
 * Console opens with the computer already on (390×844 visitor).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  await page.waitForSelector('[data-testid="computer-simple-keys"]', { timeout: 15_000, state: 'visible' });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-symbol-keys-idle-390.png'),
  });
  await page.locator('[data-testid="computer-key-note"]').click();
  await page.waitForFunction(() => {
    const flash = document.querySelector('[data-testid="proof-flash"]')?.textContent || '';
    return /note done|NOTE DONE|completed/i.test(flash);
  }, null, { timeout: 20_000 });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-symbol-plus-note-390.png'),
  });
  await page.locator('[data-testid="computer-learned-list"]').click();
  await page.waitForFunction(() => {
    const flash = document.querySelector('[data-testid="proof-flash"]')?.textContent || '';
    return /find done|FIND DONE|completed/i.test(flash);
  }, null, { timeout: 20_000 });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-symbol-list-after-plus-390.png'),
  });
  await browser.close();
  console.log('wrote computer-already-on screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
