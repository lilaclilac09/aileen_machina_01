import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts/arcade-preview';
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://localhost:3011/tools', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, '17-tools-hub-cli.png'), fullPage: true });
  await page.goto('http://localhost:3011/tools/inkling-clips', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, '18-audio-clipping-cli.png'), fullPage: true });
  await browser.close();
  console.log('ok');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
