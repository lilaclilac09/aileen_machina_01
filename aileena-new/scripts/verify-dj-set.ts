#!/usr/bin/env tsx
/**
 * Verify /sound layout + handoff DJ set in deck carousel.
 * Also: Visual on homepage only (not on /sound).
 *
 * Env:
 *   VERIFY_BASE_URL — default https://www.aileena.xyz
 *   VERIFY_OUT_DIR  — default .verify-screenshots/
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DJ_SET_TRACKS, allDeckTracks } from '../lib/djSetlist';

const BASE_URL = (process.env.VERIFY_BASE_URL ?? 'https://www.aileena.xyz').replace(/\/$/, '');
const OUT_DIR = process.env.VERIFY_OUT_DIR ?? join(process.cwd(), '.verify-screenshots');

type Check = { name: string; ok: boolean; detail?: string };

async function checkGet(path: string): Promise<Check> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    return { name: `GET ${path}`, ok: res.ok, detail: String(res.status) };
  } catch (e) {
    return { name: `GET ${path}`, ok: false, detail: String(e) };
  }
}

async function checkRedirect(): Promise<Check> {
  try {
    const res = await fetch(`${BASE_URL}/dj-set`, { redirect: 'manual' });
    const loc = res.headers.get('location') ?? '';
    const ok =
      [301, 302, 307, 308].includes(res.status) &&
      loc.includes('/sound') &&
      loc.includes('dj-set');
    return { name: 'redirect /dj-set → /sound#dj-set', ok, detail: `${res.status} → ${loc}` };
  } catch (e) {
    return { name: 'redirect /dj-set → /sound#dj-set', ok: false, detail: String(e) };
  }
}

async function checkCoverAssets(): Promise<Check[]> {
  return Promise.all(
    DJ_SET_TRACKS.map(async (t) => {
      try {
        const res = await fetch(`${BASE_URL}${t.cover}`);
        const ct = res.headers.get('content-type') ?? '';
        const ok = res.ok && ct.includes('image');
        return { name: `asset ${t.id}`, ok, detail: `${res.status} ${ct}` };
      } catch (e) {
        return { name: `asset ${t.id}`, ok: false, detail: String(e) };
      }
    }),
  );
}

async function runBrowser(checks: Check[]): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  try {
    // ── /sound#dj-set — deck carousel ─────────────────────────────
    await page.goto(`${BASE_URL}/sound#dj-set`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(OUT_DIR, '01-sound-top.png') });

    const glassOnSound = await page.locator('#glass-bench').count();
    checks.push({
      name: 'no Visual (#glass-bench) on /sound',
      ok: glassOnSound === 0,
      detail: `found ${glassOnSound}`,
    });

    const legacyCarousel = await page.locator('section[aria-label="DJ set carousel"]').count();
    checks.push({
      name: 'no legacy DJSetCarousel section on /sound',
      ok: legacyCarousel === 0,
      detail: `found ${legacyCarousel}`,
    });

    const carousel = page.locator('#dj-set');
    await carousel.waitFor({ state: 'visible', timeout: 15_000 });
    await carousel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    await page.screenshot({ path: join(OUT_DIR, '02-sound-full-page.png'), fullPage: true });
    await carousel.screenshot({ path: join(OUT_DIR, '03-deck-carousel-closeup.png') });

    const expectedTracks = allDeckTracks();
    const expected = expectedTracks.length;
    const titles: string[] = [];

    for (let i = 0; i < expected; i++) {
      const detail = await carousel.locator('span').filter({ hasText: ' BPM · ' }).innerText();
      titles.push(detail.split(' · ')[0]?.trim() ?? '');

      const loaded = await carousel
        .locator('[data-dj-set-card] img')
        .first()
        .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
      const id = expectedTracks[i]?.id ?? `idx-${i}`;
      checks.push({
        name: `img loaded ${id}`,
        ok: loaded,
        detail: loaded ? 'ok' : 'broken',
      });

      if (i < expected - 1) {
        await carousel.locator('button').filter({ hasText: '›' }).click();
        await page.waitForTimeout(700);
      }
    }

    checks.push({
      name: 'deck carousel track count',
      ok: titles.length === expected,
      detail: `${titles.length} (expected ${expected})`,
    });

    const expectedTitles = expectedTracks.map((t) => t.title);
    checks.push({
      name: 'track titles order',
      ok: JSON.stringify(titles) === JSON.stringify(expectedTitles),
      detail: titles.join(' · '),
    });

    await page.screenshot({ path: join(OUT_DIR, '04-carousel-all-tracks.png') });

    await page.goto(`${BASE_URL}/dj-set`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    checks.push({
      name: 'browser lands on #dj-set',
      ok: finalUrl.includes('/sound') && finalUrl.includes('dj-set'),
      detail: finalUrl,
    });
    await page.screenshot({ path: join(OUT_DIR, '05-dj-set-redirect.png') });

    // ── Homepage Visual ───────────────────────────────────────────
    await page.goto(`${BASE_URL}/#glass-bench`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(2000);
    const visual = page.locator('#glass-bench');
    await visual.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const visualVisible = await visual.isVisible();
    checks.push({
      name: 'Visual (#glass-bench) on homepage',
      ok: visualVisible,
      detail: visualVisible ? 'visible' : 'missing',
    });
    const visualHeading = await visual.locator('h2').innerText().catch(() => '');
    checks.push({
      name: 'Visual heading',
      ok: /visual/i.test(visualHeading),
      detail: visualHeading || 'empty',
    });
    await page.screenshot({ path: join(OUT_DIR, '06-home-visual.png') });
    await visual.screenshot({ path: join(OUT_DIR, '07-home-visual-closeup.png') });
  } finally {
    const video = page.video();
    await page.close();
    if (video) {
      await video.saveAs(join(OUT_DIR, 'sound-layout-walkthrough.webm'));
    }
    await context.close();
    await browser.close();
  }
}

const ARTIFACTS = [
  '01-sound-top.png',
  '02-sound-full-page.png',
  '03-deck-carousel-closeup.png',
  '04-carousel-all-tracks.png',
  '05-dj-set-redirect.png',
  '06-home-visual.png',
  '07-home-visual-closeup.png',
  'sound-layout-walkthrough.webm',
  'verify-report.json',
];

async function main() {
  const checks: Check[] = [
    await checkGet('/sound'),
    await checkGet('/'),
    await checkRedirect(),
    ...(await checkCoverAssets()),
  ];

  await runBrowser(checks);

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    outDir: OUT_DIR,
    passed: checks.every((c) => c.ok),
    checks,
    artifacts: ARTIFACTS,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'verify-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed:`);
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log('\nSound layout verification passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
