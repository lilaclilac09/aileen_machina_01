import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts/arcade-preview';
const BASE = 'http://localhost:3011';
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, '10-tools-hub-4cabinets.png'), fullPage: true });

  await page.goto(`${BASE}/tools/feed-flash`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const start = page.getByRole('button', { name: /press start|start/i });
  if (await start.count()) {
    await start.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: join(OUT, '11-feed-flash-playing.png'), fullPage: true });

  await page.goto(`${BASE}/tools/pricing-slot`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const spin = page.getByRole('button', { name: /spin|drehen/i });
  if (await spin.count()) {
    await spin.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: join(OUT, '12-pricing-slot-spun.png'), fullPage: true });

  await browser.close();
  console.log('wrote 10-12 screenshots');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
