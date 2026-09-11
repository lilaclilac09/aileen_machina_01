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
  await page.locator('[data-testid="computer-key-peek"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.waitForFunction(() => {
    const flash = document.querySelector('[data-testid="proof-flash"]')?.textContent || '';
    return /worker-shell/i.test(flash);
  }, null, { timeout: 8_000 }).catch(() => undefined);
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-extreme-keys-390.png'),
  });
  const field = page.locator('[data-testid="computer-line"]');
  await field.waitFor({ state: 'attached', timeout: 8_000 });
  await field.fill('one shot from the pad', { force: true });
  await page.locator('[data-testid="computer-key-note"]').click();
  await flashWait(page, /note done|completed/).catch(async () => {
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return /one shot from the pad|hello from aileena computer/i.test(m);
    }, null, { timeout: 20_000 });
  });
  await page.locator('[data-testid="computer-learned-list"]').click();
  await flashWait(page, /listed|completed/).catch(async () => {
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return /scratch|notes|one shot/i.test(m);
    }, null, { timeout: 20_000 });
  });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-extreme-look-390.png'),
  });
  await field.fill('one shot', { force: true });
  await page.locator('[data-testid="computer-key-find"]').click();
  await flashWait(page, /match|search|completed/).catch(async () => {
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return /one shot|:\d+:/i.test(m);
    }, null, { timeout: 20_000 });
  });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-extreme-find-390.png'),
  });
  await page.locator('[data-testid="computer-key-peek"]').click();
  await flashWait(page, /peek done|completed/).catch(async () => {
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return /one shot from the pad|scratch/i.test(m);
    }, null, { timeout: 20_000 });
  });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-extreme-peek-390.png'),
  });
  await page.locator('[data-testid="computer-key-clock"]').click();
  await flashWait(page, /clock done|completed/).catch(async () => {
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return /\d{4}-\d{2}-\d{2}T|scratch\/notes/i.test(m);
    }, null, { timeout: 20_000 });
  });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-extreme-clock-390.png'),
  });
  await page.locator('[data-testid="computer-key-peek"]').click();
  await flashWait(page, /peek done|completed/).catch(async () => {
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return /one shot from the pad|\d{4}-\d{2}-\d{2}T/i.test(m);
    }, null, { timeout: 20_000 });
  });
  await page.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'computer-extreme-clock-peek-390.png'),
  });
  await browser.close();
  console.log('wrote one-shot screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
