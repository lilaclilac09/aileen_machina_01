#!/usr/bin/env tsx
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function waitReady() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/tools/photoautomat`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`photoautomat not ready at ${BASE}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitReady();
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['camera'],
    recordVideo: { dir: join(OUT, 'photoautomat-video'), size: { width: 390, height: 844 } },
  });
  const page = await mobile.newPage();
  async function dismissConsole() {
    const close = page.getByRole('button', { name: 'Close console' });
    if (await close.count()) await close.first().click({ force: true }).catch(() => undefined);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.evaluate(() => {
      const dialog = document.querySelector('[aria-label="Aileena Console"]');
      if (dialog instanceof HTMLElement) dialog.style.display = 'none';
    });
  }

  await page.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await dismissConsole();
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-hub-390.png') });
  await page.getByTestId('tools-card-photoautomat').click();
  await page.waitForURL(/\/tools\/photoautomat/);
  await dismissConsole();
  await page.waitForSelector('[data-testid="foto-cabin"]');
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-booth-390.png') });

  const slot = page.getByTestId('foto-slot');
  const box = await slot.boundingBox();
  if (!box) throw new Error('no slot');
  await page.getByTestId('foto-card').hover();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2, { steps: 16 });
  await page.mouse.up();
  await page.waitForSelector('[data-testid="foto-print"]', { timeout: 25_000 });
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-sheet-390.png') });
  const video = page.video();
  await mobile.close();
  await browser.close();
  const recorded = await video?.path();
  if (recorded) {
    await copyFile(recorded, join(OUT, 'photoautomat_swipe_four_shots_sheet.webm'));
  }
  console.log('captured photoautomat stills');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
