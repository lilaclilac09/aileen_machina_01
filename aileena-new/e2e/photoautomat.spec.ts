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

test('tools hub lists Photoautomat; allow camera then swipe to a local strip', async ({ page }) => {
  test.setTimeout(180_000);
  async function dismissOverlays() {
    await page.evaluate(() => {
      document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
        if (node instanceof HTMLElement) node.style.display = 'none';
      });
    });
  }

  await page.goto('/tools', { waitUntil: 'domcontentloaded' });
  await dismissOverlays();
  const card = page.getByTestId('tools-card-photoautomat');
  await expect(card).toBeVisible();

  await page.goto('/tools/photoautomat', { waitUntil: 'networkidle' });
  await dismissOverlays();
  // With WebGL the booth opens on the street; without it, straight onto the cabin.
  const stage = page.getByTestId('foto-stage');
  const enter = page.getByTestId('foto-enter');
  await expect(enter.or(page.getByTestId('foto-allow'))).toBeVisible({ timeout: 20_000 });
  if (await enter.isVisible()) {
    await page.getByTestId('foto-curtain').click();
    await expect(stage).toHaveAttribute('data-curtain', 'open', { timeout: 15_000 });
    await enter.click();
  }
  await expect(page.getByTestId('foto-cabin')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('foto-allow')).toBeVisible();
  await page.getByTestId('foto-allow').click();
  await expect(page.getByTestId('foto-root')).toHaveAttribute('data-live', 'yes', { timeout: 15_000 });
  await page.waitForFunction(() => {
    const video = document.querySelector('[data-testid="foto-video"]');
    return video instanceof HTMLVideoElement && video.readyState >= 2 && video.videoWidth > 0;
  });
  await expect(page.getByTestId('foto-slot')).toBeVisible();

  const slot = page.getByTestId('foto-slot');
  const swipe = page.getByTestId('foto-card');
  const box = await slot.boundingBox();
  expect(box).toBeTruthy();
  await swipe.hover();
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.92, box!.y + box!.height / 2, { steps: 14 });
  await page.mouse.up();

  // On the street the strip waits in the slot until it is taken; without WebGL it prints flat.
  const take = page.getByTestId('foto-take');
  await expect(take.or(page.getByTestId('foto-print'))).toBeVisible({ timeout: 90_000 });
  if (await take.isVisible()) {
    await take.click();
    await expect(stage).toHaveAttribute('data-strip', 'held');
  } else {
    const sheetBox = await page.getByTestId('foto-print').locator('img.foto-sheet').boundingBox();
    expect(sheetBox).toBeTruthy();
    expect(sheetBox!.height).toBeGreaterThan(sheetBox!.width * 1.6);
  }
  await expect(page.getByTestId('foto-download')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByTestId('foto-download').click();
  expect((await download).suggestedFilename()).toBe('photoautomat-strip.png');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
});
