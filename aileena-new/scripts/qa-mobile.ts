#!/usr/bin/env tsx
/**
 * Mobile QA — static CSS guards + optional live 390×844 overflow/screenshots.
 *
 *   pnpm qa:mobile
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm qa:mobile
 *
 * Live checks skip (exit 0) when no server is up, unless --require-live.
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

async function serverUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function liveMobile(base: string) {
  const { chromium } = await import('@playwright/test');
  const outDir = join(process.cwd(), '.verify-screenshots', 'mobile');
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const routes = ['/', '/doors', '/sound', '/dispatch'];

  try {
    for (const route of routes) {
      await page.goto(new URL(route, base).toString(), { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      const overflowOk = metrics.scrollWidth <= metrics.innerWidth + 2;
      assert(
        `${route} @390 no horizontal overflow`,
        overflowOk,
        `scrollWidth=${metrics.scrollWidth} innerWidth=${metrics.innerWidth}`,
      );
      const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
      await page.screenshot({ path: join(outDir, `${slug}-390.png`), fullPage: false });
    }

    await page.goto(new URL('/', base).toString(), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.keyboard.press('Escape').catch(() => {});
    const consoleBtn = page.getByRole('button', { name: 'Open Aileena console · machina' });
    if (await consoleBtn.count()) {
      await consoleBtn.click();
      await page.waitForTimeout(500);
      const input = page.locator('[aria-label="Aileena Console"] textarea, [aria-label="Aileena Console"] input').first();
      const visible = await input.isVisible().catch(() => false);
      assert('console input visible at 390×844', visible);
      await page.screenshot({ path: join(outDir, 'console-390.png'), fullPage: false });
    } else {
      assert('console launcher present', false, 'machina button missing');
    }
  } finally {
    await browser.close();
  }

  console.log(`screenshots → ${outDir}`);
}

async function main() {
  const css = read('app/globals.css');
  assert('safe-area CSS vars exist', /--safe-top:\s*env\(safe-area-inset-top/.test(css));
  assert('mobile-page utility exists', /\.mobile-page\s*\{/.test(css));
  assert('mobile overflow-x is clip not a hide-the-bug default', /overflow-x:\s*clip/.test(css));
  assert(
    'mobile emergency QA note exists',
    existsSync(join(process.cwd(), 'docs/MOBILE_EMERGENCY_QA.md')),
  );

  const requireLive = process.argv.includes('--require-live');
  const base = (process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
  const up = await serverUp(base + '/');

  if (up) {
    await liveMobile(base + '/');
  } else {
    const msg = `no server at ${base} — live overflow/screenshots skipped`;
    if (requireLive) {
      assert('live mobile QA', false, msg);
    } else {
      console.log(`SKIP  live mobile QA — ${msg}`);
      console.log('      start `pnpm dev` or set VERIFY_BASE_URL');
    }
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
