/**
 * iPhone-viewport overflow + chrome probe.
 * Run: VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm exec tsx scripts/verify-mobile-layout.ts
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000';
const OUT = process.env.VERIFY_OUT || '/opt/cursor/artifacts/mobile-ios';

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '393', width: 393, height: 852 },
  { name: '430', width: 430, height: 932 },
  { name: '375', width: 375, height: 667 },
] as const;

const ROUTES = [
  { id: 'home', path: '/' },
  { id: 'doors', path: '/doors' },
  { id: 'sound', path: '/sound' },
  { id: 'visual', path: '/#visual' },
  { id: 'dispatch', path: '/dispatch' },
  { id: 'news', path: '/dispatch#woman-in-tech' },
  { id: 'writing', path: '/blog/console-orb' },
  { id: 'council', path: '/council' },
] as const;

type Row = {
  route: string;
  viewport: string;
  overflowX: boolean;
  scrollWidth: number;
  clientWidth: number;
  ok: boolean;
};

async function overflow(page: Page) {
  return page.evaluate(() => {
    const w = document.documentElement;
    const b = document.body;
    const scrollWidth = Math.max(w.scrollWidth, b?.scrollWidth ?? 0);
    const clientWidth = w.clientWidth;
    return { scrollWidth, clientWidth, overflowX: scrollWidth > clientWidth + 2 };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const rows: Row[] = [];
  let failed = 0;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(700);
      const m = await overflow(page);
      const ok = !m.overflowX;
      if (!ok) failed += 1;
      rows.push({
        route: route.id,
        viewport: `${vp.width}x${vp.height}`,
        overflowX: m.overflowX,
        scrollWidth: m.scrollWidth,
        clientWidth: m.clientWidth,
        ok,
      });
      if (vp.name === '390') {
        await page.screenshot({
          path: join(OUT, `${route.id}-${vp.name}.png`),
          fullPage: route.id !== 'sound',
        });
      }
    }

    if (vp.name === '390') {
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(OUT, 'console-390.png') });
      const leave = page.getByRole('button', { name: /leave a note/i });
      if (await leave.count()) {
        await leave.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: join(OUT, 'console-note-390.png') });
      }
      await page.goto(`${BASE}/sound`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(OUT, 'sound-390.png'), fullPage: true });
    }

    await context.close();
  }

  const report = { base: BASE, failed, rows };
  writeFileSync(join(OUT, 'overflow-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  if (failed > 0) {
    console.error(`mobile overflow failures: ${failed}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
