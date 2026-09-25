/**
 * Interaction tape: computer on + voice on, city pills, tall monitor.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm exec tsx scripts/capture-console-voice-crop.ts
 */
import { mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 700 },
    recordVideo: { dir: join(OUT, 'console-voice-crop-video'), size: { width: 1100, height: 700 } },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const machina = page.locator('[aria-label="Open Aileena console · machina"]').first();
  await machina.waitFor({ state: 'visible', timeout: 20_000 });
  await machina.click();
  for (let i = 0; i < 12; i += 1) {
    const open = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Aileena Console"]');
      return Boolean(d && getComputedStyle(d).pointerEvents === 'auto');
    });
    if (open) break;
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
    await page.waitForTimeout(250);
  }
  const dialog = page.locator('[role="dialog"][aria-label="Aileena Console"]');
  const toggle = dialog.locator('[data-testid="computer-mode-toggle"]');
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click({ force: true });
  }
  await page.locator('[data-testid="computer-console-dock"]').waitFor({ state: 'visible' });
  const voiceOff = dialog.getByRole('button', { name: /Turn voice on/i });
  if (await voiceOff.count()) await voiceOff.click({ force: true });
  await page.locator('[data-testid="agent-voice-orb"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  await dialog.screenshot({ path: join(OUT, 'console_computer_voice_after_open.png') });

  for (const city of ['London', 'Berlin', 'Shanghai']) {
    await page.locator('[data-testid="agent-voice-orb"]').getByRole('button', { name: city }).click();
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => {
    const pre = document.querySelector('[data-testid="computer-monitor"]');
    if (!pre) return;
    pre.textContent = Array.from({ length: 48 }, (_, i) =>
      `${String(i).padStart(2, '0')} queued backend=cloudflare-worker-shell write /workspace/scratch/notes/2026-09-25.txt`,
    ).join('\n');
  });
  await page.locator('[data-testid="computer-monitor"]').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(500);
  await dialog.screenshot({ path: join(OUT, 'console_computer_voice_tall_after_cities.png') });

  const video = page.video();
  await ctx.close();
  await browser.close();
  if (video) {
    const raw = await video.path();
    const dest = join(OUT, 'console_computer_voice_interaction.webm');
    await rename(raw, dest);
    console.log(`VIDEO ${dest}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
