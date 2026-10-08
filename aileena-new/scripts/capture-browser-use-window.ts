#!/usr/bin/env tsx
/**
 * Browser Use separate window — stills + click-through along Console / voice.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm capture:browser-use-window
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function openConsole(page: import('playwright').Page) {
  const machina = page.locator('[aria-label="Open Aileena console · machina"]');
  await machina.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(400);
  await machina.click();
  await page.waitForFunction(() => {
    const d = document.querySelector('[role="dialog"][aria-label="Aileena Console"]');
    return Boolean(d && getComputedStyle(d).pointerEvents === 'auto');
  }, null, { timeout: 15_000 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await mobile.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await openConsole(page);
  await page.screenshot({ path: join(OUT, 'browser-use-console-390.png') });

  await page.locator('[data-testid="browse-mode-toggle"]').click();
  await page.locator('[data-testid="browser-use-window"][data-open="1"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'browser-use-window-390.png') });

  await page.locator('[data-testid="browser-use-task"]').fill('browse: open https://example.com');
  await page.locator('[data-testid="browser-use-prepare"]').click();
  await page.locator('[data-testid="browser-use-would-run"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.screenshot({ path: join(OUT, 'browser-use-prepare-390.png') });

  const day = new Date().toISOString().slice(0, 10);
  const exhausted = encodeURIComponent(Buffer.from(JSON.stringify({ date: day, count: 20 })).toString('base64'));
  await mobile.addCookies([
    {
      name: '__aileena_quota',
      value: exhausted,
      url: BASE,
      path: '/',
      httpOnly: true,
    },
  ]);
  await page.locator('[data-testid="browser-use-task"]').fill('browse: open https://news.ycombinator.com');
  await page.locator('[data-testid="browser-use-prepare"]').click();
  await page.locator('[data-testid="browser-use-quota"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.screenshot({ path: join(OUT, 'browser-use-quota-429-390.png') });

  const voice = page.locator('[aria-label="Turn voice on"]');
  if (await voice.count()) {
    await voice.click();
    await page.waitForTimeout(300);
  }
  await page.locator('[data-testid="browser-use-voice-icon"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.screenshot({ path: join(OUT, 'browser-use-voice-icon-390.png') });

  await page.locator('[aria-label="Close console"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-testid="browser-use-site-icon"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.screenshot({ path: join(OUT, 'browser-use-site-icon-390.png') });
  const mobileVideo = await page.video()?.path();
  await mobile.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await openConsole(dPage);
  await dPage.locator('[data-testid="browse-mode-toggle"]').click();
  await dPage.locator('[data-testid="browser-use-window"][data-open="1"]').waitFor({ state: 'visible', timeout: 8_000 });
  await dPage.waitForTimeout(400);
  await dPage.screenshot({ path: join(OUT, 'browser-use-window-desktop.png') });
  await desktop.close();

  if (mobileVideo) {
    const dest = join(OUT, 'browser-use-window-clickthrough.webm');
    const { copyFile } = await import('node:fs/promises');
    await copyFile(mobileVideo, dest);
    console.log('video', dest);
  }
  console.log('wrote Browser Use window stills to', OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
