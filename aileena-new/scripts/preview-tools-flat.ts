import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts/arcade-preview';
const BASE = 'http://localhost:3011';
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  await page.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT, '13-tools-hub-flat.png'), fullPage: true });

  await page.goto(`${BASE}/tools/inkling-clips`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, '14-audio-clipping.png'), fullPage: true });

  await page.goto(`${BASE}/tools/feed-flash`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, '15-feed-flash-flat.png'), fullPage: true });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const m = await mobile.newPage();
  await m.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await m.waitForTimeout(800);
  await m.screenshot({ path: join(OUT, '16-tools-hub-mobile-flat.png'), fullPage: true });

  await browser.close();
  console.log('ok', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
