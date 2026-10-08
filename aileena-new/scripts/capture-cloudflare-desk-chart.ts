#!/usr/bin/env tsx
/**
 * Cloudflare desk packed as a marked chart next to the voice agent.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm capture:cloudflare-desk
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
    if (!d) return false;
    const s = getComputedStyle(d);
    return s.pointerEvents === 'auto' && Number(s.opacity) > 0.9;
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

  await page.locator('[data-testid="cloudflare-desk-chart"][data-packed="1"]').waitFor({
    state: 'visible',
    timeout: 8_000,
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(OUT, 'cloudflare-desk-packed-390.png') });

  const voice = page.locator('[aria-label="Turn voice on"]');
  if (await voice.count()) {
    await voice.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: join(OUT, 'cloudflare-desk-voice-390.png') });

  await page.locator('[data-testid="cloudflare-desk-chart"]').click();
  await page.locator('[data-testid="computer-console-dock"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.locator('[data-testid="computer-monitor"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'cloudflare-desk-open-390.png') });

  const mobileVideo = await page.video()?.path();
  await mobile.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await openConsole(dPage);
  const dVoice = dPage.locator('[aria-label="Turn voice on"]');
  if (await dVoice.count()) {
    await dVoice.click();
    await dPage.waitForTimeout(250);
  }
  await dPage.locator('[data-testid="cloudflare-desk-chart"][data-packed="1"]').waitFor({
    state: 'visible',
    timeout: 8_000,
  });
  await dPage.waitForTimeout(350);
  await dPage.screenshot({ path: join(OUT, 'cloudflare-desk-packed-desktop.png') });
  await dPage.locator('[data-testid="cloudflare-desk-chart"]').click();
  await dPage.locator('[data-testid="computer-console-dock"]').waitFor({ state: 'visible', timeout: 8_000 });
  await dPage.waitForTimeout(350);
  await dPage.screenshot({ path: join(OUT, 'cloudflare-desk-open-desktop.png') });
  await desktop.close();

  if (mobileVideo) {
    const dest = join(OUT, 'cloudflare-desk-clickthrough.webm');
    const { copyFile } = await import('node:fs/promises');
    await copyFile(mobileVideo, dest);
    console.log('video', dest);
  }
  console.log('wrote Cloudflare desk chart stills to', OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
