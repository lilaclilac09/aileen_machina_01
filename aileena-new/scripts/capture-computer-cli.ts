/**
 * Capture owner CLI stills into /opt/cursor/artifacts.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm exec tsx scripts/capture-computer-cli.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';

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

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function openConsole(page: import('playwright').Page) {
  await page.waitForSelector('[aria-label="Open Aileena console · machina"]');
  await page.waitForTimeout(300);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  const toggle = page.locator('[data-testid="computer-mode-toggle"]');
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-testid="computer-mode-toggle"]');
    return t?.getAttribute('aria-pressed') === 'true';
  }, null, { timeout: 15_000 });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click({ force: true });
  }
  await page.locator('[data-testid="computer-console-dock"]').waitFor({ state: 'attached', timeout: 15_000 });
  await page.waitForTimeout(400);
}

async function runLine(page: import('playwright').Page, cmd: string) {
  const box = page.locator('[data-testid="computer-line"]');
  await box.fill(cmd);
  await box.press('Enter');
  await page.waitForTimeout(600);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  const token = await createOwnerSession();
  const browser = await chromium.launch({ headless: true });

  const owner = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: join(OUT, 'computer-cli-video'), size: { width: 390, height: 844 } },
  });
  await owner.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE }]);
  const page = await owner.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await openConsole(page);
  await page.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_cli_idle_390.png'),
  });

  await runLine(page, 'mkdir -p scratch');
  await runLine(page, 'cd scratch');
  await page.waitForFunction(() => {
    const p = document.querySelector('[data-testid="computer-cli-prompt"]')?.textContent || '';
    return /scratch/.test(p);
  }, null, { timeout: 15_000 });
  await runLine(page, 'put hi.ts\nexport const n = 1;\n');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /hi\.ts/.test(m);
  }, null, { timeout: 15_000 });
  await runLine(page, 'cat hi.ts');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /export const n = 1/.test(m);
  }, null, { timeout: 15_000 });
  await page.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_cli_after_put_390.png'),
  });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'computer_cli_transcript.png'),
  });
  const video = page.video();
  await page.close();
  await owner.close();
  if (video) {
    const tmp = await video.path();
    await rename(tmp, join(OUT, 'computer_cli_owner_walkthrough.webm'));
  }

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await desktop.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE }]);
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await openConsole(dPage);
  await dPage.locator('[data-testid="computer-line"]').fill('ls scratch');
  await dPage.locator('[data-testid="computer-line"]').press('Enter');
  await dPage.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /hi\.ts/.test(m);
  }, null, { timeout: 15_000 });
  await dPage.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_cli_desktop.png'),
  });

  const visitor = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const vPage = await visitor.newPage();
  await vPage.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await openConsole(vPage);
  const prompt = await vPage.locator('[data-testid="computer-cli-prompt"]').count();
  const shell = await vPage.locator('[data-testid="computer-key-shell"]').count();
  if (prompt > 0 || shell > 0) throw new Error(`visitor saw CLI prompt=${prompt} shell=${shell}`);
  await vPage.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_visitor_no_cli_390.png'),
  });

  await browser.close();
  console.log(`captured CLI stills → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
