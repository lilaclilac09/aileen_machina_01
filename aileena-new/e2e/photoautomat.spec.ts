import { test, expect } from '@playwright/test';

test.use({
  permissions: ['camera'],
  launchOptions: {
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  },
});

test('tools hub lists Photoautomat and booth can swipe to a local sheet', async ({ page }) => {
  await page.goto('/tools', { waitUntil: 'domcontentloaded' });
  const close = page.getByRole('button', { name: 'Close console' });
  if (await close.count()) await close.first().click({ force: true }).catch(() => undefined);
  await page.evaluate(() => {
    const dialog = document.querySelector('[aria-label="Aileena Console"]');
    if (dialog instanceof HTMLElement) dialog.style.display = 'none';
  });
  const card = page.getByTestId('tools-card-photoautomat');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/tools\/photoautomat/);
  const closeAgain = page.getByRole('button', { name: 'Close console' });
  if (await closeAgain.count()) await closeAgain.first().click({ force: true }).catch(() => undefined);
  await page.evaluate(() => {
    const dialog = document.querySelector('[aria-label="Aileena Console"]');
    if (dialog instanceof HTMLElement) dialog.style.display = 'none';
  });
  await expect(page.getByTestId('foto-cabin')).toBeVisible();

  const slot = page.getByTestId('foto-slot');
  const swipe = page.getByTestId('foto-card');
  const box = await slot.boundingBox();
  expect(box).toBeTruthy();
  await swipe.hover();
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.92, box!.y + box!.height / 2, { steps: 14 });
  await page.mouse.up();

  await expect(page.getByTestId('foto-print')).toBeVisible({ timeout: 25_000 });
  await expect(page.getByTestId('foto-download')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
});
