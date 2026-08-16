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

  test('sound lab stacks decks and keeps play tappable', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);
    const play = page.getByTestId('dj-play-a');
    await expect(play).toBeVisible();
    await expect.poll(async () => {
      const box = await play.boundingBox();
      return box ? Math.min(box.height, box.width) : 0;
    }).toBeGreaterThanOrEqual(44);
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
