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
    const closeBrowse = page.getByRole('button', { name: 'Close Browser Use' });
    if (await closeBrowse.count()) await closeBrowse.first().click({ force: true }).catch(() => undefined);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.evaluate(() => {
      document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
        if (node instanceof HTMLElement) node.style.display = 'none';
      });
    });
  }

  await page.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await dismissConsole();
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-hub-390.png') });
  await page.getByTestId('tools-card-photoautomat').click();
  await page.waitForURL(/\/tools\/photoautomat/);
  await dismissConsole();
  await page.waitForSelector('[data-testid="foto-stage"] canvas, [data-testid="foto-allow"]', { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-street-390.png') });
  if (await page.getByTestId('foto-enter').isVisible()) {
    await page.getByTestId('foto-curtain').click();
    await page.waitForSelector('[data-testid="foto-stage"][data-curtain="open"]', { timeout: 15_000 });
    await page.screenshot({ path: join(OUT, 'tools-photoautomat-curtain-open-390.png') });
    await page.getByTestId('foto-xray').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, 'tools-photoautomat-xray-390.png') });
    await page.getByTestId('foto-xray').click();
    await page.getByTestId('foto-enter').click();
  }
  await page.waitForSelector('[data-testid="foto-cabin"]', { timeout: 20_000 });
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-booth-390.png') });

  await page.getByTestId('foto-allow').click();
  await page.waitForSelector('[data-testid="foto-video"][data-live="yes"]', { timeout: 10_000 });
  await page.waitForFunction(() => {
    const video = document.querySelector('[data-testid="foto-video"]');
    return video instanceof HTMLVideoElement && video.readyState >= 2 && video.videoWidth > 0;
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-live-390.png') });

  const slot = page.getByTestId('foto-slot');
  const box = await slot.boundingBox();
  if (!box) throw new Error('no slot');
  await page.getByTestId('foto-card').hover();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2, { steps: 16 });
  await page.mouse.up();
  await page.waitForSelector('[data-testid="foto-stage"][data-bath="fixer"]', { timeout: 60_000 }).catch(() => undefined);
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-develop-390.png') });
  await page.waitForSelector('[data-testid="foto-print"]', { timeout: 90_000 });
  await page.screenshot({ path: join(OUT, 'tools-photoautomat-strip-390.png') });
  const video = page.video();
  await mobile.close();

  const sim = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: join(OUT, 'photoautomat-video'), size: { width: 390, height: 844 } },
  });
  const simPage = await sim.newPage();
  async function dismissSim() {
    await simPage.keyboard.press('Escape').catch(() => undefined);
    await simPage.evaluate(() => {
      document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
        if (node instanceof HTMLElement) node.style.display = 'none';
      });
    });
  }
  await simPage.goto(`${BASE}/tools/photoautomat`, { waitUntil: 'networkidle' });
  await dismissSim();
  await simPage.waitForSelector('[data-testid="foto-enter"], [data-testid="foto-simulate"]', { timeout: 30_000 });
  if (await simPage.getByTestId('foto-enter').isVisible()) await simPage.getByTestId('foto-enter').click();
  await simPage.waitForSelector('[data-testid="foto-simulate"]', { timeout: 20_000 });
  await simPage.screenshot({ path: join(OUT, 'tools-photoautomat-simulate-ready-390.png') });
  await simPage.getByTestId('foto-simulate').click();
  await simPage.waitForSelector('.foto-count', { timeout: 10_000 });
  await simPage.screenshot({ path: join(OUT, 'tools-photoautomat-simulate-count-390.png') });
  await simPage.waitForSelector('[data-testid="foto-print"]', { timeout: 90_000 });
  await simPage.screenshot({ path: join(OUT, 'tools-photoautomat-simulate-strip-390.png') });
  const simVideo = simPage.video();
  await sim.close();
  await browser.close();
  const recorded = await video?.path();
  if (recorded) {
    await copyFile(recorded, join(OUT, 'photoautomat_allow_swipe_four_strip.webm'));
  }
  const simRecorded = await simVideo?.path();
  if (simRecorded) {
    await copyFile(simRecorded, join(OUT, 'photoautomat_simulate_interval_strip.webm'));
  }
  console.log('captured photoautomat stills');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
