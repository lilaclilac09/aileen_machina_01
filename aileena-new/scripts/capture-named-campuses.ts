#!/usr/bin/env tsx
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function dismiss(page: import('playwright').Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
      if (node instanceof HTMLElement) node.style.display = 'none';
    });
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await dismiss(dPage);
  await dPage.locator('[data-testid="tools-card-named-campuses"]').scrollIntoViewIfNeeded();
  await dPage.screenshot({ path: join(OUT, 'tools-hub-named-campuses-desktop.png'), fullPage: true });
  await dPage.locator('[data-testid="tools-card-named-campuses"]').screenshot({
    path: join(OUT, 'tools-card-named-campuses.png'),
  });

  await dPage.goto(`${BASE}/tools/named-campuses`, { waitUntil: 'networkidle' });
  await dismiss(dPage);
  const map = dPage.getByTestId('named-campuses-map-img');
  await map.waitFor({ state: 'visible' });
  await dPage.waitForFunction(
    () => {
      const img = document.querySelector('[data-testid="named-campuses-map-img"]') as HTMLImageElement | null;
      return Boolean(img && img.naturalWidth > 800);
    },
    null,
    { timeout: 30_000 },
  );
  await dPage.screenshot({ path: join(OUT, 'named-campuses-svg-desktop.png'), fullPage: true });
  await map.screenshot({ path: join(OUT, 'named-campuses-map-element.png') });
  const svgKind = await map.getAttribute('data-src-kind');
  await dPage.getByTestId('named-campuses-use-png').click();
  await dPage.waitForFunction(
    () => document.querySelector('[data-testid="named-campuses-map-img"]')?.getAttribute('data-src-kind') === 'png',
  );
  await map.screenshot({ path: join(OUT, 'named-campuses-map-png-element.png') });
  await dPage.locator('[data-testid="named-campuses-stills"]').scrollIntoViewIfNeeded();
  await dPage.screenshot({ path: join(OUT, 'named-campuses-stills-desktop.png') });

  const walk = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: join(OUT, 'named-campuses-video'), size: { width: 390, height: 844 } },
  });
  const wPage = await walk.newPage();
  await wPage.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await dismiss(wPage);
  await wPage.locator('[data-testid="tools-card-named-campuses"]').scrollIntoViewIfNeeded();
  await wPage.waitForTimeout(400);
  await wPage.locator('[data-testid="tools-card-named-campuses"]').click();
  await wPage.waitForURL(/\/tools\/named-campuses/);
  await dismiss(wPage);
  await wPage.getByTestId('named-campuses-map-img').waitFor({ state: 'visible' });
  await wPage.waitForTimeout(600);
  await wPage.evaluate(() => {
    const plate = document.querySelector('.named-campuses-plate');
    if (plate) plate.scrollLeft = 420;
  });
  await wPage.waitForTimeout(500);
  await wPage.locator('[data-testid="named-campuses-stills"]').scrollIntoViewIfNeeded();
  await wPage.waitForTimeout(700);
  await wPage.locator('[data-testid="named-campuses-sources"]').scrollIntoViewIfNeeded();
  await wPage.waitForTimeout(400);
  const video = wPage.video();
  await walk.close();
  if (video) {
    const raw = await video.path();
    await copyFile(raw, join(OUT, 'named-campuses-hub-to-stills-390.webm'));
  }

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mobile.newPage();
  await mPage.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await dismiss(mPage);
  await mPage.locator('[data-testid="tools-card-named-campuses"]').scrollIntoViewIfNeeded();
  await mPage.screenshot({ path: join(OUT, 'tools-hub-named-campuses-390.png') });
  await mPage.locator('[data-testid="tools-card-named-campuses"]').click();
  await mPage.waitForURL(/\/tools\/named-campuses/);
  await dismiss(mPage);
  await mPage.getByTestId('named-campuses-map-img').waitFor({ state: 'visible' });
  await mPage.screenshot({ path: join(OUT, 'named-campuses-page-390.png') });
  await mPage.locator('[data-testid="named-campuses-stills"]').scrollIntoViewIfNeeded();
  await mPage.screenshot({ path: join(OUT, 'named-campuses-stills-390.png') });

  await browser.close();
  console.log(JSON.stringify({ out: OUT, svgKind }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
