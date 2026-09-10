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
  await page.goto(`${BASE}/proof`, { waitUntil: 'domcontentloaded' });
  const machina = page.locator('[aria-label="Open Aileena console · machina"]');
  await machina.waitFor({ state: 'visible', timeout: 20_000 });
  // Closed Console keeps opacity-0 but still has a box; do not wait on the dialog.
  await page.waitForTimeout(800);
  await machina.click();
  const keys = page.locator('[data-testid="computer-simple-keys"]');
  try {
    await keys.waitFor({ state: 'visible', timeout: 8_000 });
  } catch {
    await page.locator('[data-testid="computer-mode-toggle"]').click();
    await keys.waitFor({ state: 'visible', timeout: 8_000 });
  }
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-signs-idle-390.png'),
  });
  await page.locator('[data-testid="computer-learned-list"]').click();
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /scratch|artifacts|reports/i.test(m);
  }, null, { timeout: 20_000 });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-signs-look-390.png'),
  });
  await page.locator('[data-testid="computer-key-note"]').click();
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /hello from aileena computer/i.test(m);
  }, null, { timeout: 20_000 });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-signs-note-390.png'),
  });
  await browser.close();
  console.log('wrote computer-already-on screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
