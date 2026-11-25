import { test, expect } from '@playwright/test';

test('overview shows measured v6b and edit→bar updates the note without leaving overview', async ({ page }) => {
  await page.goto('/nsight.html', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('okc-measured')).toContainText('v6b 1.071×');
  await expect(page.getByTestId('okc-measured')).toContainText('v4_moe_epi ~0.015×');
  const widget = page.getByTestId('okc-effect-widget');
  await expect(widget).toBeVisible();
  const note = page.getByTestId('okc-lever-note');
  await expect(note).toContainText('beats v6b 1.071×');
  await page.getByTestId('okc-lever-wait').click();
  await expect(note).toContainText('Wait bar');
  await expect(page.getByTestId('okc-lever-wait')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-view="overview"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-view-panel="overview"]')).not.toHaveClass(/is-hidden/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

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

test('390px overview has no horizontal overflow and widget still edits the note', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nsight.html', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('okc-measured')).toContainText('v6b 1.071×');
  await page.getByTestId('okc-lever-copy').click();
  await expect(page.getByTestId('okc-lever-note')).toContainText('Copy bar');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('/nsight iframe shows measured strip and Diagnose still loads', async ({ page }) => {
  await page.goto('/nsight', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Aileena Console"], [aria-label="Browser Use"]').forEach((node) => {
      if (node instanceof HTMLElement) node.style.display = 'none';
    });
  });
  const frame = page.frameLocator('[data-testid="nsight-frame"] iframe');
  await expect(frame.getByTestId('okc-measured')).toContainText('v6b 1.071×');
  await expect(frame.getByTestId('okc-open-diagnose')).toBeVisible();
  await frame.getByTestId('okc-open-diagnose').click();
  await expect(frame.getByTestId('okc-diagnose')).toHaveAttribute('data-ready', 'yes');
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
