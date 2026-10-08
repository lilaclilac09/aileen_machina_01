#!/usr/bin/env tsx
/**
 * Visitor Browser Use demo — what anyone can click / type / say (dry-run).
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm demo:browser-use-visitor
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

async function hideNextIssueBadge(page: import('playwright').Page) {
  await page.addInitScript(() => {
    const hide = () => document.querySelector('nextjs-portal')?.remove();
    hide();
    new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
  });
}

async function openConsole(page: import('playwright').Page) {
  const machina = page.locator('[aria-label="Open Aileena console · machina"]');
  await machina.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(500);
  await machina.click();
  for (let i = 0; i < 12; i += 1) {
    const open = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Aileena Console"]');
      if (!d) return false;
      const s = getComputedStyle(d);
      return s.pointerEvents === 'auto' && Number(s.opacity) > 0.9;
    });
    if (open) return;
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
    await page.waitForTimeout(250);
  }
  throw new Error('Console dialog did not open');
}

async function sendBrowse(page: import('playwright').Page, line: string) {
  const box = page.locator('[aria-label="Aileena Console"] textarea').first();
  await box.waitFor({ state: 'visible', timeout: 8_000 });
  await box.click();
  await box.fill(line);
  await page.waitForTimeout(400);
  await box.press('Enter');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await mobile.newPage();
  await hideNextIssueBadge(page);
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, 'visitor_can_open_from_landing_390.png') });

  await openConsole(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, 'visitor_can_open_console_390.png') });

  await page.locator('[data-testid="browse-mode-toggle"]').click();
  await page.locator('[data-testid="browser-use-window"][data-open="1"]').waitFor({
    state: 'visible',
    timeout: 8_000,
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, 'visitor_can_open_browse_window_390.png') });

  await page.locator('[data-testid="browser-use-task"]').fill('browse: open https://example.com');
  await page.waitForTimeout(350);
  await page.locator('[data-testid="browser-use-prepare"]').click();
  await page.locator('[data-testid="browser-use-would-run"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, 'visitor_can_prepare_page_390.png') });

  await page.locator('[data-testid="browser-use-window-close"]').click();
  await page.waitForTimeout(400);
  await sendBrowse(page, 'browse https://example.com');
  await page.locator('[data-agent-transcript]').getByText(/no cloud browser started/i).waitFor({
    timeout: 15_000,
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(OUT, 'visitor_can_type_browse_in_chat_390.png') });

  await page.locator('[aria-label="Close console"]').click();
  await page.locator('[data-testid="browser-use-site-icon"]').waitFor({ state: 'visible', timeout: 8_000 });
  await page.locator('[data-testid="browser-use-window"][data-open="1"]').waitFor({
    state: 'visible',
    timeout: 8_000,
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, 'visitor_can_keep_browse_on_landing_390.png') });

  // Leftover chrome icon tucks the window (browseMode is already on).
  await page.locator('[data-testid="browser-use-site-icon"]').click();
  await page.waitForFunction(() => {
    const w = document.querySelector('[data-testid="browser-use-window"]');
    return Boolean(w && w.getAttribute('data-open') === '0');
  }, null, { timeout: 8_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'visitor_can_tuck_window_away_390.png') });

  await openConsole(page);
  await page.locator('[data-testid="browse-mode-toggle"]').click();
  await page.locator('[data-testid="browser-use-window"][data-open="1"]').waitFor({
    state: 'visible',
    timeout: 8_000,
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, 'visitor_can_reopen_from_console_390.png') });

  const mobileVideo = await page.video()?.path();
  await mobile.close();

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  const dPage = await desktop.newPage();
  await hideNextIssueBadge(dPage);
  await dPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await openConsole(dPage);
  await dPage.waitForTimeout(400);
  await sendBrowse(dPage, 'browse https://example.com');
  await dPage.locator('[data-testid="browser-use-window"][data-open="1"]').waitFor({
    state: 'visible',
    timeout: 8_000,
  });
  await dPage.locator('[data-agent-transcript]').getByText(/no cloud browser started/i).waitFor({
    timeout: 15_000,
  });
  await dPage.locator('[data-testid="browser-use-prepare"]').click();
  await dPage.locator('[data-testid="browser-use-would-run"]').waitFor({ state: 'visible', timeout: 8_000 });
  await dPage.waitForTimeout(700);
  await dPage.screenshot({ path: join(OUT, 'visitor_can_browse_desktop_sibling.png') });
  const desktopVideo = await dPage.video()?.path();
  await desktop.close();

  if (mobileVideo) {
    await copyFile(mobileVideo, join(OUT, 'visitor_browse_interaction_mobile.webm'));
    console.log('mobile video', join(OUT, 'visitor_browse_interaction_mobile.webm'));
  }
  if (desktopVideo) {
    await copyFile(desktopVideo, join(OUT, 'visitor_browse_interaction_desktop.webm'));
    console.log('desktop video', join(OUT, 'visitor_browse_interaction_desktop.webm'));
  }
  console.log('wrote visitor Browser Use demo stills to', OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
