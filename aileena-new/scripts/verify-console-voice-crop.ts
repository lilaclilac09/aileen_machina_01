/**
 * Computer on + voice on must keep the orb / city pills fully inside the dialog.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm verify:console-voice-crop
 */
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

type Box = { x: number; y: number; w: number; h: number; bottom: number; right: number };

function boxOf(el: { x: number; y: number; width: number; height: number } | null): Box | null {
  if (!el) return null;
  return {
    x: el.x,
    y: el.y,
    w: el.width,
    h: el.height,
    bottom: el.y + el.height,
    right: el.x + el.width,
  };
}

function inside(inner: Box, outer: Box, pad = 1): boolean {
  return (
    inner.x >= outer.x - pad &&
    inner.y >= outer.y - pad &&
    inner.right <= outer.right + pad &&
    inner.bottom <= outer.bottom + pad
  );
}

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function measure(page: import('playwright').Page) {
  const dialog = page.locator('[role="dialog"][aria-label="Aileena Console"]');
  const dock = page.locator('[data-testid="computer-console-dock"]');
  const voice = page.locator('[data-testid="agent-voice-orb"]');
  const chrome = page.locator('[data-testid="console-bottom-chrome"]');
  const orbBtn = voice.locator('button').first();
  const pills = voice.locator('[aria-label="City accent"]');

  const [dialogBox, dockBox, voiceBox, chromeBox, orbBox, pillsBox] = await Promise.all([
    dialog.boundingBox(),
    dock.boundingBox(),
    voice.boundingBox(),
    chrome.boundingBox(),
    orbBtn.boundingBox(),
    pills.boundingBox(),
  ]);

  return {
    dialog: boxOf(dialogBox),
    dock: boxOf(dockBox),
    voice: boxOf(voiceBox),
    chrome: boxOf(chromeBox),
    orb: boxOf(orbBox),
    pills: boxOf(pillsBox),
    overflowX: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  };
}

async function openComputerVoice(page: import('playwright').Page) {
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
  const toggle = page.locator('[data-testid="computer-mode-toggle"]');
  await toggle.waitFor({ state: 'visible', timeout: 15_000 });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click();
  }
  await page.locator('[data-testid="computer-console-dock"]').waitFor({ state: 'visible', timeout: 15_000 });
  const voiceBtn = page.getByRole('button', { name: /Turn voice on/i });
  if (await voiceBtn.count()) {
    await voiceBtn.click();
  }
  await page.locator('[data-testid="agent-voice-orb"]').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(250);
}

async function runViewport(
  browser: import('playwright').Browser,
  name: string,
  viewport: { width: number; height: number },
) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await openComputerVoice(page);
  const shot = join(OUT, `console-voice-crop-${name}.png`);
  await page.locator('[role="dialog"][aria-label="Aileena Console"]').screenshot({ path: shot });
  const m = await measure(page);
  await ctx.close();

  const label = `${viewport.width}x${viewport.height}`;
  assert(`${name} dialog present`, Boolean(m.dialog), m.dialog ? `${Math.round(m.dialog.w)}x${Math.round(m.dialog.h)}` : 'missing');
  assert(`${name} computer dock present`, Boolean(m.dock));
  assert(`${name} voice chrome present`, Boolean(m.voice && m.orb && m.pills));
  if (m.dialog && m.voice) {
    assert(`${name} voice stays inside dialog`, inside(m.voice, m.dialog), `voice.bottom=${m.voice.bottom.toFixed(1)} dialog.bottom=${m.dialog.bottom.toFixed(1)}`);
  }
  if (m.dialog && m.chrome) {
    assert(`${name} bottom chrome stays inside dialog`, inside(m.chrome, m.dialog), `chrome.bottom=${m.chrome.bottom.toFixed(1)} dialog.bottom=${m.dialog.bottom.toFixed(1)}`);
  }
  if (m.voice && m.orb) {
    assert(`${name} orb stays inside voice row`, inside(m.orb, m.voice), `orb ${m.orb.w.toFixed(0)}x${m.orb.h.toFixed(0)}`);
  }
  if (m.voice && m.pills) {
    assert(`${name} city pills stay inside voice row`, inside(m.pills, m.voice));
  }
  if (m.dock && m.voice) {
    assert(`${name} dock does not overlap voice`, m.dock.bottom <= m.voice.y + 1, `dock.bottom=${m.dock.bottom.toFixed(1)} voice.y=${m.voice.y.toFixed(1)}`);
  }
  if (m.orb) {
    assert(`${name} orb is not flattened`, m.orb.h >= 50 && m.orb.w >= 50, `${label} orb ${m.orb.w.toFixed(0)}x${m.orb.h.toFixed(0)}`);
  }
  console.log(`SHOT  ${shot}`);
}

async function main() {
  if (!existsSync(join(process.cwd(), 'components/AgentChat.tsx'))) {
    throw new Error('run from aileena-new/');
  }
  await mkdir(OUT, { recursive: true });

  let probe: Response;
  try {
    probe = await fetch(BASE, { redirect: 'follow' });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    assert('dev server reachable', false, `${BASE} — ${detail}`);
    process.exit(1);
  }
  if (!probe.ok) {
    assert('dev server reachable', false, `${BASE} — HTTP ${probe.status}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    await runViewport(browser, 'desktop-1280', { width: 1280, height: 800 });
    await runViewport(browser, 'desktop-short', { width: 1100, height: 700 });
    await runViewport(browser, 'mobile-390', { width: 390, height: 844 });
  } finally {
    await browser.close();
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) {
    for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
