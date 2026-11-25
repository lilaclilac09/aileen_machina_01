import { test, expect } from '@playwright/test';

test('diagnose tab separates floor from gap and only methods the gap', async ({ page }) => {
  await page.goto('/nsight.html?view=diagnose', { waitUntil: 'networkidle' });
  const root = page.getByTestId('okc-diagnose');
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute('data-ready', 'yes');

  await expect(page.locator('#dx-solving')).toContainText('skinny GEMMs');
  await expect(page.locator('#dx-not')).toContainText('3 µs');

  await page.locator('[data-dx-step="3"]').click();
  const math = page.locator('[data-dx-slice="math"]');
  await expect(math).toContainText('FLOOR');
  await math.click();
  await expect(page.getByTestId('okc-slice')).toContainText('AT THE BOTTOM');
  await expect(page.getByTestId('okc-slice')).toContainText('No space on the math');

  const stream = page.locator('[data-dx-slice="stream"]');
  await expect(stream).toContainText('GAP');
  await stream.click();
  await expect(page.getByTestId('okc-slice')).toContainText('M02');

  await page.locator('[data-dx-step="4"]').click();
  const methods = page.getByTestId('okc-methods');
  await expect(methods).toContainText('STOP · ALREADY AT THE FLOOR');
  await expect(methods).toContainText('THEN OPTIMIZE · GAP ONLY');
  await expect(methods).toContainText('M02');
});

test('/nsight?view=diagnose loads the explorer iframe on Diagnose', async ({ page }) => {
  await page.goto('/nsight?view=diagnose', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
      if (node instanceof HTMLElement) node.style.display = 'none';
    });
  });
  const frame = page.frameLocator('[data-testid="nsight-frame"] iframe');
  await expect(frame.getByTestId('okc-diagnose')).toBeVisible();
  await expect(frame.getByTestId('okc-diagnose')).toHaveAttribute('data-ready', 'yes');
  await expect(frame.locator('#dx-solving')).toContainText('skinny GEMMs');
});
