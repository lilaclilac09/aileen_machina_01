import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts/arcade-preview';
const BASE = 'http://localhost:3011';
mkdirSync(OUT, { recursive: true });

async function shot(page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>, name: string) {
  await page.screenshot({ path: join(OUT, name), fullPage: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  await page.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, '01-tools-hub.png');

  await page.goto(`${BASE}/tools/chip-guess`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '02-chip-guess-idle.png');
  await page.getByRole('button', { name: /press start|start/i }).click();
  await page.waitForTimeout(600);
  await shot(page, '03-chip-guess-playing.png');

  await page.goto(`${BASE}/tools/inkling-clips`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, '04-clip-quest.png');

  await page.goto(`${BASE}/sound`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, '05-sound-ref.png');

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, '06-home-ref.png');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/tools`, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(800);
  await shot(mpage, '07-tools-hub-mobile.png');
  await mpage.goto(`${BASE}/tools/chip-guess`, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(800);
  await mpage.getByRole('button', { name: /press start|start/i }).click();
  await mpage.waitForTimeout(600);
  await shot(mpage, '08-chip-guess-mobile.png');

  await browser.close();
  console.log('screenshots written to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
