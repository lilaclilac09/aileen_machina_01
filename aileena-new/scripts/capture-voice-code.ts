#!/usr/bin/env tsx
/**
 * Voice → code stills: shared-pad scratch vcode (local) + public propose-only (prod).
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const LOCAL = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const PROD = (process.env.VCODE_PROD_URL ?? 'https://www.aileena.xyz').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function openConsole(page: import('playwright').Page) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  await page.waitForSelector('[data-testid="computer-console-dock"]', { timeout: 15_000, state: 'visible' });
  await page.waitForTimeout(400);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const local = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await local.newPage();
  await page.goto(`${LOCAL}/proof?room=open`, { waitUntil: 'networkidle' });
  await openConsole(page);
  await page.waitForSelector('[data-testid="voice-code-chip"]', { state: 'visible' });
  await page.locator('[data-testid="computer-line"]').fill(
    'vcode scratch/vcode/voice.ts\nexport function hello() {\n  return "hi";\n}\n',
  );
  await page.locator('[data-testid="computer-line"]').press('Enter');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /hello|voice\.ts|export function hello/.test(m);
  }, null, { timeout: 25_000 });
  await page.screenshot({ path: join(OUT, 'voice_code_shared_scratch_390.png') });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'voice_code_shared_scratch_monitor.png'),
  });
  await local.close();

  const prod = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await prod.newPage();
  await p.goto(`${PROD}/`, { waitUntil: 'networkidle' });
  await openConsole(p);
  const chip = p.locator('[data-testid="voice-code-chip"], button:has-text("Voice → code")').first();
  await chip.click();
  await p.waitForFunction(() => {
    const t = document.body.innerText || '';
    if (/drafting a propose-only patch/i.test(t) && !/▸ voice → code/i.test(t)) return false;
    return /▸ voice → code/i.test(t) || /take \.patch/i.test(t) || /Voice-code paused/i.test(t);
  }, null, { timeout: 45_000 });
  await p.screenshot({ path: join(OUT, 'voice_code_prod_proposal_390.png') });
  await prod.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
