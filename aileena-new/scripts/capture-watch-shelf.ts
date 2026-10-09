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

  await page.goto(`${BASE}/blog/watch-listening-shelf`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-testid="watch-shelf-row-watch"]');
  await page.locator('#joan-didion').click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() === 'Joan Didion',
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'shelf_watch_films_unchanged.png'), fullPage: true });

  await page.locator('#asymmetrical-bets').click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() === 'Asymmetrical Bets',
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, 'shelf_photo_real_book_spines.png'), fullPage: true });

  await page.locator('#cache').click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() === 'Cache',
  );
  await page.waitForTimeout(300);
  const videoCount = await page.locator('[data-testid="watch-shelf-row-video"] li').count();
  if (videoCount !== 7) throw new Error(`expected 7 video spines, got ${videoCount}`);
  await page.screenshot({ path: join(OUT, 'shelf_photo_real_video_ridge.png'), fullPage: true });

  await page.locator('#behind-the-album').click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() ===
      'Behind the Album',
  );
  await page.waitForTimeout(300);
  const openHref = await page.locator('.watch-shelf-open').getAttribute('href');
  if (openHref !== 'https://www.youtube.com/watch?v=xEoCVtZcY2E') {
    throw new Error(`open href ${openHref}`);
  }
  const coverBox = await page.locator('.watch-shelf-detail-image').boundingBox();
  if (!coverBox || coverBox.width / coverBox.height < 1.5) {
    throw new Error(`detail cover not 16:9 landscape ${coverBox?.width}x${coverBox?.height}`);
  }
  await page.screenshot({ path: join(OUT, 'shelf_behind_the_album.png'), fullPage: true });

  await page.locator('#urban-roam-not-tourism').click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() ===
      'Urban roam, not tourism',
  );
  await page.waitForTimeout(300);
  const livingCount = await page.locator('[data-testid="watch-shelf-row-living"] li').count();
  if (livingCount !== 10) throw new Error(`expected 10 living objects, got ${livingCount}`);
  await page.screenshot({ path: join(OUT, 'shelf_photo_real_living_ridge.png'), fullPage: true });

  await page.locator('#figuier-600g').click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() ===
      'Figuier 600g',
  );
  await page.waitForTimeout(300);
  const scentCount = await page.locator('[data-testid="watch-shelf-row-scent"] li').count();
  if (scentCount !== 6) throw new Error(`expected 6 scent cutouts, got ${scentCount}`);
  await page.screenshot({ path: join(OUT, 'shelf_scent_duft_ridge.png'), fullPage: true });

  await page.locator('#raucherkerze').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, 'shelf_scent_raeucherkerze.png'), fullPage: true });

  await page.locator('#wild-strawberries').click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() ===
      'Wild Strawberries',
  );
  await page.waitForTimeout(400);
  const galleryCount = await page.locator('[data-testid="watch-shelf-row-gallery"] li').count();
  if (galleryCount !== 1) throw new Error(`expected 1 gallery painting, got ${galleryCount}`);
  const galleryHref = await page.locator('.watch-shelf-open').getAttribute('href');
  if (galleryHref !== 'https://collections.louvre.fr/ark:/53355/cl010509181') {
    throw new Error(`gallery open href ${galleryHref}`);
  }
  const framed = page.locator('.watch-shelf-detail-image.is-framed');
  const framedBox = await framed.boundingBox();
  if (!framedBox || framedBox.width < 300) {
    throw new Error(`framed detail too small ${framedBox?.width}x${framedBox?.height}`);
  }
  const framedCss = await framed.evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: s.borderWidth, shadow: s.boxShadow, fit: s.objectFit, bg: s.backgroundColor };
  });
  if (framedCss.fit !== 'contain' || framedCss.border !== '0px') {
    throw new Error(`framed css ${JSON.stringify(framedCss)}`);
  }
  await page.screenshot({ path: join(OUT, 'shelf_gallery_chardin.png'), fullPage: true });
  await framed.screenshot({ path: join(OUT, 'shelf_gallery_chardin_still.png') });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mobile.newPage();
  await mPage.goto(`${BASE}/blog/watch-listening-shelf`, { waitUntil: 'networkidle' });
  await mPage.keyboard.press('Escape');
  await mPage.waitForSelector('[data-testid="watch-shelf-row-watch"]');
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: join(OUT, 'shelf_photo_real_mobile_390.png'), fullPage: true });
  await mPage.locator('#wild-strawberries').click();
  await mPage.waitForFunction(
    () =>
      document.querySelector('[data-testid="watch-shelf-detail-title"]')?.textContent?.trim() ===
      'Wild Strawberries',
  );
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: join(OUT, 'shelf_gallery_chardin_mobile_390.png'), fullPage: true });

  await browser.close();
  console.log(`wrote ${OUT}/shelf_watch_films_unchanged.png`);
  console.log(`wrote ${OUT}/shelf_photo_real_book_spines.png`);
  console.log(`wrote ${OUT}/shelf_photo_real_video_ridge.png`);
  console.log(`wrote ${OUT}/shelf_behind_the_album.png`);
  console.log(`wrote ${OUT}/shelf_photo_real_living_ridge.png`);
  console.log(`wrote ${OUT}/shelf_scent_duft_ridge.png`);
  console.log(`wrote ${OUT}/shelf_scent_raeucherkerze.png`);
  console.log(`wrote ${OUT}/shelf_gallery_chardin.png`);
  console.log(`wrote ${OUT}/shelf_gallery_chardin_still.png`);
  console.log(`wrote ${OUT}/shelf_photo_real_mobile_390.png`);
  console.log(`wrote ${OUT}/shelf_gallery_chardin_mobile_390.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
