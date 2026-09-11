import { test, expect } from '@playwright/test';

const IPHONE = { width: 390, height: 844 };

test.describe('iOS / mobile layout pass', () => {
  test.use({
    viewport: IPHONE,
    isMobile: true,
    hasTouch: true,
  });

  test('home has no horizontal overflow and stacked desk', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);
    await expect(page.locator('#opening')).toBeVisible();
  });

  test('sound lab renders decks without horizontal overflow', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);
    await expect(page.getByText('DECK A', { exact: false }).first()).toBeVisible();
    await expect(page.locator('#dj-set')).toBeVisible();
  });

  test('mixer and deck taps are large enough to hit', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const play = page.getByRole('button', { name: 'Play' }).first();
    await expect(play).toBeVisible();
    const playBox = await play.boundingBox();
    expect(playBox?.width ?? 0).toBeGreaterThanOrEqual(52);
    expect(playBox?.height ?? 0).toBeGreaterThanOrEqual(52);

    const echo = page.getByTestId('dj-fx-echo');
    await expect(echo).toBeVisible();
    const echoBox = await echo.boundingBox();
    expect(echoBox?.height ?? 0).toBeGreaterThanOrEqual(52);

    const loop = page.getByTestId('dj-loop-size-1').first();
    await expect(loop).toBeVisible();
    const loopBox = await loop.boundingBox();
    expect(loopBox?.width ?? 0).toBeGreaterThanOrEqual(52);
    expect(loopBox?.height ?? 0).toBeGreaterThanOrEqual(52);
  });

  test('console opens and leave-a-note stays in viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat')));
    const dialog = page.getByRole('dialog', { name: /Aileena Console/i });
    await expect(dialog).toBeVisible();
    const input = dialog.locator('textarea').first();
    await expect(input).toBeVisible();
    const leave = dialog.getByRole('button', { name: /leave a note/i });
    if (await leave.count()) {
      await leave.first().click();
      const email = dialog.locator('input[type="email"]').first();
      await expect(email).toBeVisible();
      const orb = dialog.getByRole('button', { name: /voice|orb|speak/i }).first();
      if (await orb.count()) {
        const box = await orb.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.y).toBeGreaterThanOrEqual(-2);
      }
    }
  });
});
