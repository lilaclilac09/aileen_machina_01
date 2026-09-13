#!/usr/bin/env tsx
/**
 * Shared public pad — 390×844 stills + two-visitor interaction into /opt/cursor/artifacts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
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

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';
const SHARE = `${BASE}/proof?room=open`;

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(SHARE);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`shared pad not ready at ${SHARE}`);
}

async function openConsole(page: import('playwright').Page) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  await page.waitForSelector('[role="dialog"][aria-label="Aileena Console"]', { state: 'visible' });
  await page.waitForSelector('[data-testid="computer-console-dock"][data-room="open"]', {
    timeout: 15_000,
    state: 'visible',
  });
  await page.waitForTimeout(400);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'shared-room-capture-start.txt'), `start ${new Date().toISOString()} ${SHARE}\n`);
  await waitReady();
  const mark = `share-pad-${Date.now().toString(36)}`;
  const browser = await chromium.launch({ headless: true });

  const a = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await a.grantPermissions(['clipboard-read', 'clipboard-write']);
  const pageA = await a.newPage();
  await pageA.goto(SHARE, { waitUntil: 'networkidle' });
  await pageA.keyboard.press('Escape');
  await pageA.waitForSelector('[data-testid="proof-shared-room"]');
  if (await pageA.locator('[data-testid="owner-passkey-unlock"]').count()) {
    throw new Error('share link still shows KeyShield wall');
  }
  await pageA.screenshot({ path: join(OUT, 'shared-room-landing-390.png'), fullPage: true });

  await openConsole(pageA);
  const overflow = await pageA.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error('horizontal overflow on shared console 390');
  const flash = await pageA.locator('[data-testid="proof-flash"]').innerText();
  if (!/shared/i.test(flash)) throw new Error(`dock is not shared: ${flash}`);
  if (await pageA.locator('[data-testid="computer-learned-git-status"]').count()) {
    throw new Error('shared pad must not show git');
  }
  await pageA.screenshot({ path: join(OUT, 'shared-room-dock-390.png') });
  await pageA.locator('[data-testid="computer-console-dock"]').screenshot({
    path: join(OUT, 'shared-room-dock-chassis.png'),
  });

  await pageA.locator('[data-testid="computer-key-share"]').click();
  await pageA.waitForFunction(() => /copied|share/i.test(document.querySelector('[data-testid="proof-flash"]')?.textContent || ''));
  const copied = await pageA.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  if (copied && !copied.includes('/proof?room=open')) {
    throw new Error(`share copied unexpected url: ${copied}`);
  }
  await pageA.screenshot({ path: join(OUT, 'shared-room-share-copied-390.png') });

  let seen = false;
  for (let attempt = 0; attempt < 4 && !seen; attempt++) {
    await pageA.locator('[data-testid="computer-line"]').fill(mark);
    await pageA.locator('[data-testid="computer-key-note"]').click();
    try {
      await pageA.waitForFunction(
        (expect) => (document.querySelector('[data-testid="computer-monitor"]')?.textContent || '').includes(expect),
        mark,
        { timeout: 12_000 },
      );
      seen = true;
    } catch {
      await pageA.waitForTimeout(8000);
    }
  }
  if (!seen) {
    const dump = await pageA.locator('[data-testid="computer-monitor"]').innerText().catch(() => '');
    await pageA.screenshot({ path: join(OUT, 'shared-room-note-a-timeout-390.png'), fullPage: true });
    throw new Error(`visitor A monitor missing ${mark}: ${dump.slice(0, 400)}`);
  }
  await pageA.screenshot({ path: join(OUT, 'shared-room-note-a-390.png') });

  const b = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageB = await b.newPage();
  await pageB.goto(SHARE, { waitUntil: 'networkidle' });
  await openConsole(pageB);
  await pageB.waitForFunction(
    (expect) => {
      const body = document.body.innerText || '';
      const monitor = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
      return body.includes(expect) || monitor.includes(expect);
    },
    mark,
    { timeout: 20_000 },
  );
  await pageB.screenshot({ path: join(OUT, 'shared-room-note-b-390.png') });

  await pageA.locator('[data-testid="computer-line"]').fill('uname -a');
  await pageA.locator('[data-testid="computer-key-shell"]').click();
  await pageA.waitForFunction(() => {
    const monitor = document.querySelector('[data-testid="computer-monitor"]')?.textContent || '';
    return /shared room shell only|failed|×/i.test(monitor);
  }, null, { timeout: 20_000 });
  await pageA.screenshot({ path: join(OUT, 'shared-room-uname-blocked-390.png') });

  await writeFile(
    join(OUT, 'shared-room-capture.json'),
    JSON.stringify(
      {
        ok: true,
        mark,
        share: SHARE,
        copied: copied || null,
        flashA: await pageA.locator('[data-testid="proof-flash"]').innerText(),
        flashB: await pageB.locator('[data-testid="proof-flash"]').innerText(),
      },
      null,
      2,
    ),
  );

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
