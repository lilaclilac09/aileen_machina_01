/**
 * Capture owner voice→CLI stills into /opt/cursor/artifacts.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm exec tsx scripts/capture-computer-voice-cli.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';
import { COMPUTER_CLI_EVENT } from '../lib/computer/spokenCli';

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
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-testid="computer-mode-toggle"]');
    return t?.getAttribute('aria-pressed') === 'true';
  }, null, { timeout: 15_000 });
  await page.locator('[data-testid="computer-console-dock"]').waitFor({ state: 'attached', timeout: 15_000 });
  await page.waitForTimeout(300);
}

async function runLine(page: import('playwright').Page, cmd: string) {
  const box = page.locator('[data-testid="computer-line"]');
  await box.fill(cmd);
  await box.press('Enter');
  await page.waitForTimeout(700);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  const token = await createOwnerSession();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: join(OUT, 'computer-voice-cli-video'), size: { width: 390, height: 844 } },
  });
  await ctx.addCookies([{ name: SESSION_COOKIE, value: token, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/proof`, { waitUntil: 'networkidle' });
  await openConsole(page);

  await page.getByRole('button', { name: /Turn voice on/i }).click();
  await page.waitForTimeout(250);
  await page.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_voice_cli_idle_390.png'),
  });

  await runLine(page, 'help');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /demo container/.test(m);
  }, null, { timeout: 15_000 });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'computer_cli_help.png'),
  });

  await runLine(page, 'examples');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /demo js/.test(m) || /computerd/.test(m);
  }, null, { timeout: 15_000 });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'computer_cli_examples.png'),
  });

  await runLine(page, 'demo');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /worker-shell/.test(m);
  }, null, { timeout: 20_000 });
  await runLine(page, 'demo js');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /worker-javascript/.test(m);
  }, null, { timeout: 20_000 });
  await runLine(page, 'demo container');
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /examples\/container/.test(m) || /stage=egress/.test(m) || (/uname:/.test(m) && /Linux/.test(m));
  }, null, { timeout: 90_000 });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'computer_cli_container.png'),
  });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'computer_cli_demo.png'),
  });
  await page.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_cli_demo_390.png'),
  });

  await runLine(
    page,
    'vcode scratch/vcode/voice.ts\nexport function hello() {\n  return "hi";\n}\n',
  );
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /voice\.ts/.test(m);
  }, null, { timeout: 15_000 });

  await page.evaluate((eventName) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { text: 'ls scratch/vcode' } }));
  }, COMPUTER_CLI_EVENT);
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /voice\.ts/.test(m);
  }, null, { timeout: 15_000 });

  const chat = page.locator('[role="dialog"][aria-label="Aileena Console"] textarea').last();
  await chat.fill('list files');
  await chat.press('Enter');
  await page.waitForTimeout(900);

  await page.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({
    path: join(OUT, 'computer_voice_cli_transcript_390.png'),
  });
  await page.locator('[data-testid="computer-monitor"]').screenshot({
    path: join(OUT, 'computer_voice_cli_monitor.png'),
  });

  const video = page.video();
  await page.close();
  await ctx.close();
  if (video) {
    const tmp = await video.path();
    await rename(tmp, join(OUT, 'computer_voice_cli.webm'));
  }
  await browser.close();
  console.log(`captured voice CLI stills → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
