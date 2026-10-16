import { expect, test, devices, type Page } from '@playwright/test';

/**
 * Console empty state: greeting, one-tap starters and the input must render
 * within 2s of opening. Also checks personalization and the engage beacon.
 */

async function openConsole(page: Page): Promise<number> {
  await page.waitForFunction(() => document.readyState !== 'loading');
  // Wait for the console to hydrate (it listens for open-agent-chat).
  await page.waitForTimeout(800);
  const t0 = Date.now();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat', { detail: {} })));
  return t0;
}

test.describe('agent console starters (desktop)', () => {
  test('greeting, 4 starters and focused input within 2s', async ({ page }) => {
    const beacons: string[] = [];
    await page.route('**/api/agent/engage', async (route) => {
      const body = route.request().postData() || '';
      beacons.push(body);
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"region":"other"}' });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const t0 = await openConsole(page);
    const dialog = page.getByRole('dialog', { name: 'Aileena Console' });
    await expect(dialog.getByTestId('agent-starters')).toBeVisible({ timeout: 2000 });
    await expect(dialog.getByTestId('agent-input')).toBeVisible({ timeout: 2000 });
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(2000);
    await expect(dialog.getByTestId('agent-starter')).toHaveCount(4);
    await expect(dialog.getByTestId('agent-greeting')).toContainText("Aileen's site agent");
    await expect(dialog.getByTestId('agent-privacy-note')).toContainText('No IPs');
    const ids = await dialog.getByTestId('agent-starter').evaluateAll((els) => els.map((e) => e.getAttribute('data-starter')));
    expect(ids).toEqual(['tamper', 'keyshield', 'dj', 'infra']);
    await expect(dialog.getByTestId('agent-input')).toHaveAttribute('placeholder', 'Ask about her projects, writing or music…');
    await expect(dialog.getByTestId('agent-input')).toBeFocused({ timeout: 2000 });
    await expect.poll(() => beacons.some((b) => b.includes('"type":"open"'))).toBe(true);
    await expect.poll(() => beacons.some((b) => b.includes('"type":"starters_seen"'))).toBe(true);
    for (const b of beacons) expect(b).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
  });

  test('GitHub visitors get the code greeting', async ({ page }) => {
    await page.route('**/api/agent/engage', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
    await page.goto('/?utm_source=github', { waitUntil: 'domcontentloaded' });
    await openConsole(page);
    const dialog = page.getByRole('dialog', { name: 'Aileena Console' });
    await expect(dialog.getByTestId('agent-greeting')).toContainText('GitHub', { timeout: 2000 });
  });

  test('Tamper Check page leads with the tamper starter', async ({ page }) => {
    await page.route('**/api/agent/engage', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
    await page.goto('/tools/tamper-check', { waitUntil: 'domcontentloaded' });
    await openConsole(page);
    const dialog = page.getByRole('dialog', { name: 'Aileena Console' });
    await expect(dialog.getByTestId('agent-starter').first()).toHaveAttribute('data-starter', 'tamper', { timeout: 2000 });
    await expect(dialog.getByTestId('agent-greeting')).toContainText('Tamper Check');
  });
});

test.describe('agent console starters (mobile)', () => {
  const pixel = devices['Pixel 7'];
  test.use({ viewport: pixel.viewport, userAgent: pixel.userAgent, deviceScaleFactor: pixel.deviceScaleFactor, isMobile: true, hasTouch: true });

  test('3 starters and input within 2s, no forced keyboard', async ({ page }) => {
    await page.route('**/api/agent/engage', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const t0 = await openConsole(page);
    const dialog = page.getByRole('dialog', { name: 'Aileena Console' });
    await expect(dialog.getByTestId('agent-starters')).toBeVisible({ timeout: 2000 });
    await expect(dialog.getByTestId('agent-input')).toBeVisible({ timeout: 2000 });
    expect(Date.now() - t0).toBeLessThan(2000);
    await expect(dialog.getByTestId('agent-starter')).toHaveCount(3);
  });
});
