#!/usr/bin/env tsx
/**
 * Three Console computer-entry versions for owner pick (?centry=1|2|3).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function openConsole(page: import('playwright').Page) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  await page.waitForTimeout(400);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const v1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p1 = await v1.newPage();
  await p1.goto(`${BASE}/proof?centry=1`, { waitUntil: 'networkidle' });
  await openConsole(p1);
  await p1.waitForSelector('[data-testid="computer-console-dock"]', { timeout: 15_000, state: 'visible' });
  await p1.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer-entry-v1-already-on.png'),
  });

  const v2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await v2.newPage();
  await p2.goto(`${BASE}/proof?centry=2`, { waitUntil: 'networkidle' });
  await openConsole(p2);
  await p2.waitForSelector('[data-testid="computer-entry-v2"]', { state: 'visible' });
  if ((await p2.locator('[data-testid="computer-console-dock"]').count()) > 0) {
    throw new Error('v2 should start with computer closed');
  }
  await p2.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer-entry-v2-big-button.png'),
  });
  await p2.locator('[data-testid="computer-entry-v2"]').click();
  await p2.waitForSelector('[data-testid="computer-console-dock"]', { timeout: 15_000, state: 'visible' });
  await p2.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer-entry-v2-opened.png'),
  });

  const v3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p3 = await v3.newPage();
  await p3.goto(`${BASE}/proof?centry=3`, { waitUntil: 'networkidle' });
  await openConsole(p3);
  await p3.waitForSelector('[data-testid="computer-entry-v3"]', { state: 'visible' });
  if ((await p3.locator('[data-testid="computer-console-dock"]').count()) > 0) {
    throw new Error('v3 should start with computer closed');
  }
  await p3.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer-entry-v3-composer-key.png'),
  });
  await p3.locator('[data-testid="computer-entry-v3"]').click();
  await p3.waitForSelector('[data-testid="computer-console-dock"]', { timeout: 15_000, state: 'visible' });
  await p3.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer-entry-v3-opened.png'),
  });

  await browser.close();
  console.log('wrote computer-entry v1/v2/v3 screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
