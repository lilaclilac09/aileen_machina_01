import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const ARTIFACTS = '/opt/cursor/artifacts';

test.describe('watch listening shelf accordion', () => {
  test('desktop: left index + drawers, watch collapsed', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/blog/watch-listening-shelf', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('shelf-index')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('shelf-index-featured')).toBeVisible();
    await expect(page.getByTestId('shelf-index-listen')).toBeVisible();
    await expect(page.getByTestId('shelf-index-watch')).toBeVisible();
    await expect(page.getByTestId('shelf-index-notes')).toBeVisible();

    await expect(page.getByTestId('shelf-drawer-featured')).toHaveJSProperty('open', true);
    await expect(page.getByTestId('shelf-drawer-listen')).toHaveJSProperty('open', true);
    await expect(page.getByTestId('shelf-drawer-watch')).toHaveJSProperty('open', false);
    await expect(page.getByTestId('shelf-drawer-notes')).toHaveJSProperty('open', false);

    await expect(page.getByText('Fashion Neurosis')).toBeVisible();
    await expect(page.getByText('recalibrate taste')).toHaveCount(0);
    await expect(page.getByText('Joan Didion')).not.toBeVisible();

    await page.screenshot({ path: `${ARTIFACTS}/shelf-desktop-accordion.png` });

    await page.getByTestId('shelf-index-watch').click();
    await expect(page.getByTestId('shelf-drawer-watch')).toHaveJSProperty('open', true);
    await expect(page.getByText('Joan Didion')).toBeVisible();

    await page.getByText('Joan Didion').click();
    const didionOpen = page.locator('#joan-didion a.shelf-cta');
    await expect(didionOpen).toBeVisible();
    await expect(didionOpen).toHaveAttribute('href', /rottentomatoes/);

    await page.getByTestId('shelf-drawer-watch').locator('summary.shelf-drawer-label').click();
    await expect(page.getByTestId('shelf-drawer-watch')).toHaveJSProperty('open', false);

    await page.getByTestId('shelf-index-notes').click();
    await expect(page.getByTestId('shelf-drawer-notes')).toHaveJSProperty('open', true);
    await expect(page.getByText('Asymmetrical Bets')).toBeVisible();
    await page.getByText('Branch Education').click();
    await expect(page.locator('#branch-education a.shelf-cta')).toHaveAttribute(
      'href',
      '/blog/semi-basics-review',
    );
  });

  test('mobile: compact index chips', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/blog/watch-listening-shelf', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('shelf-index')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('shelf-drawer-featured')).toHaveJSProperty('open', true);
    await expect(page.getByTestId('shelf-drawer-watch')).toHaveJSProperty('open', false);
    await page.screenshot({ path: `${ARTIFACTS}/shelf-mobile-accordion.png` });
    await page.getByTestId('shelf-index-listen').click();
    await expect(page.getByText('Do You Read Her')).toBeVisible();
  });
});
