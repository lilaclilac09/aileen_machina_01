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

    const tops = await page.evaluate(() => {
      const pick = (sel: string) => document.querySelector(sel)?.getBoundingClientRect().top ?? -1;
      return {
        set: pick('#dj-set'),
        search: pick('[data-testid="spotify-search"]'),
        pair: pick('[data-testid="dj-pair-panel"]'),
        a: pick('[data-testid="dj-deck-a-drop"]'),
        mixer: pick('[data-testid="dj-mixer"]'),
        b: pick('[data-testid="dj-deck-b-drop"]'),
        export: pick('[data-testid="dj-mix-booth"]'),
      };
    });
    expect(tops.a).toBeGreaterThan(-1);
    expect(tops.mixer).toBeGreaterThan(tops.a);
    expect(tops.b).toBeGreaterThan(tops.mixer);
    expect(tops.export).toBeGreaterThan(tops.b);
    expect(tops.set).toBeGreaterThan(tops.export);
    expect(tops.search).toBeGreaterThan(tops.set - 1);
    expect(tops.pair).toBeGreaterThan(tops.search);
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
