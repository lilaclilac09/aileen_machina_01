#!/usr/bin/env tsx
/**
 * Capture watch/listening shelf stills into /opt/cursor/artifacts.
 * Requires Next on VERIFY_BASE_URL (default http://127.0.0.1:3000).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/blog/watch-listening-shelf`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`watch shelf not ready at ${BASE}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitReady();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/blog/watch-listening-shelf#films`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-testid="watch-shelf-row-films"]');
  await page.waitForTimeout(400);
  const title = (await page.locator('[data-testid="watch-shelf-detail-title"]').textContent())?.trim();
  if (title !== 'Blue Is the Warmest Color') {
    throw new Error(`expected Blue first, got ${JSON.stringify(title)}`);
  }
  await page.screenshot({ path: join(OUT, 'watch-shelf-films-ridge.png'), fullPage: true });

  await page.locator('#cache').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="watch-shelf-detail-title"]');
    return el?.textContent?.trim() === 'Cache';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, 'watch-shelf-video-stills.png'), fullPage: true });

  const videoRow = page.locator('[data-testid="watch-shelf-row-video"]');
  const videoCount = await videoRow.locator('li').count();
  if (videoCount !== 7) throw new Error(`expected 7 video stills, got ${videoCount}`);
  await videoRow.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await page.waitForTimeout(200);
  await page.locator('#mcp').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="watch-shelf-detail-title"]');
    return el?.textContent?.trim() === 'MCP';
  });
  await page.screenshot({ path: join(OUT, 'watch-shelf-video-stills-end.png'), fullPage: true });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mobile.newPage();
  await mPage.goto(`${BASE}/blog/watch-listening-shelf#films`, { waitUntil: 'networkidle' });
  await mPage.keyboard.press('Escape');
  await mPage.waitForSelector('[data-testid="watch-shelf-row-films"]');
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: join(OUT, 'watch-shelf-mobile-390.png'), fullPage: true });

  await browser.close();
  console.log(`wrote ${OUT}/watch-shelf-films-ridge.png`);
  console.log(`wrote ${OUT}/watch-shelf-video-stills.png`);
  console.log(`wrote ${OUT}/watch-shelf-video-stills-end.png`);
  console.log(`wrote ${OUT}/watch-shelf-mobile-390.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
