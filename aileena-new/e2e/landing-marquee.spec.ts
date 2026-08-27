import { test, expect } from '@playwright/test';

function topHrefAtCenter(el: Element) {
  const box = el.getBoundingClientRect();
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  return hit?.closest('a')?.getAttribute('href') ?? hit?.closest('button')?.getAttribute('aria-label') ?? null;
}

test.describe('landing news whisper', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('aileena_loaded_once', '1');
      } catch {
        /* ignore */
      }
    });
  });

  test('news line is a real link, not a dead ticker', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Escape');

    const link = page.locator('[data-landing-marquee] a').first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/daily');

    const hit = await link.evaluate(topHrefAtCenter);
    expect(hit).toBe('/daily');

    await link.click();
    await expect(page).toHaveURL(/\/daily/);
  });

  test('machina launcher stays clickable beside the whisper', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Escape');

    const launcher = page.locator('.site-machina-launcher');
    await expect(launcher).toBeVisible();

    const hit = await launcher.evaluate(topHrefAtCenter);
    expect(hit).toMatch(/Open Aileena console/i);
  });
});
