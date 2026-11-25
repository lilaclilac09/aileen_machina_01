#!/usr/bin/env tsx
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function waitReady() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`${BASE}/nsight.html?view=diagnose`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`nsight.html not ready at ${BASE}`);
}

async function dismissConsole(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
      if (node instanceof HTMLElement) node.style.display = 'none';
    });
  });
}

async function readyDiagnose(page: Page) {
  await page.waitForSelector('#okc-diagnose-root[data-ready="yes"]', { timeout: 15_000 });
  await page.waitForSelector('#dx-waterline .wl-row');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitReady();
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: join(OUT, 'okc-diagnose-video'), size: { width: 1280, height: 900 } },
  });
  const page = await desktop.newPage();

  await page.goto(`${BASE}/nsight.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="okc-open-diagnose"]');
  await page.screenshot({ path: join(OUT, 'okc-overview-desktop.png'), fullPage: true });

  await page.getByTestId('okc-open-diagnose').click();
  await readyDiagnose(page);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step1-separate.png'), fullPage: true });

  await page.locator('[data-dx-step="2"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step2-trips.png'), fullPage: true });

  await page.locator('#dx-load-toggle').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step2-narrow-loads.png'), fullPage: true });
  await page.locator('#dx-load-toggle').click();

  await page.locator('[data-dx-step="3"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step3-waterline.png'), fullPage: true });

  await page.locator('[data-dx-slice="math"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step3-floor-math.png'), fullPage: true });

  await page.locator('[data-dx-slice="stream"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step3-gap-stream.png'), fullPage: true });

  await page.locator('[data-dx-step="4"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-step4-methods.png'), fullPage: true });

  await page.locator('[data-dx-problem="attn"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, 'okc-diagnose-attn.png'), fullPage: true });

  const video = page.video();
  await desktop.close();
  const recorded = await video?.path();
  if (recorded) {
    await copyFile(recorded, join(OUT, 'okc-diagnose-walk.webm'));
  }

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/nsight.html?view=diagnose`, { waitUntil: 'networkidle' });
  await readyDiagnose(mpage);
  await mpage.screenshot({ path: join(OUT, 'okc-diagnose-mobile-390.png'), fullPage: true });
  await mpage.locator('[data-dx-step="3"]').click();
  await mpage.waitForTimeout(300);
  await mpage.screenshot({ path: join(OUT, 'okc-diagnose-mobile-floor-390.png'), fullPage: true });
  await mobile.close();

  const wrapped = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const wpage = await wrapped.newPage();
  try {
    await wpage.goto(`${BASE}/nsight?view=diagnose`, { waitUntil: 'networkidle' });
    await dismissConsole(wpage);
    const frame = wpage.frameLocator('[data-testid="nsight-frame"] iframe');
    await frame.locator('#okc-diagnose-root[data-ready="yes"]').waitFor({ timeout: 15_000 });
    await wpage.screenshot({ path: join(OUT, 'okc-nsight-route-diagnose.png') });
  } catch (err) {
    console.warn('wrapped /nsight capture skipped', err);
  }
  await wrapped.close();
  await browser.close();
  console.log('okc-diagnose capture ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
