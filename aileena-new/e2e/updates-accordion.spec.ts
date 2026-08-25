import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const ARTIFACTS = '/opt/cursor/artifacts';

test.describe('updates accordion logbook', () => {
  test('desktop: left index + folded notes, archive collapsed', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/updates', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('updates-index')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('updates-index-latest')).toBeVisible();
    await expect(page.getByTestId('updates-index-year-2026')).toBeVisible();
    await expect(page.getByTestId('updates-index-archive')).toBeVisible();
    await expect(page.getByTestId('updates-index-year-2025')).toHaveCount(0);

    await expect(page.getByTestId('updates-drawer-latest')).toHaveJSProperty('open', true);
    await expect(page.getByTestId('updates-drawer-year-2026')).toHaveJSProperty('open', true);
    await expect(page.getByTestId('updates-drawer-archive')).toHaveJSProperty('open', false);

    await expect(page.locator('#the-year-of-magical-thinking')).toHaveJSProperty('open', true);
    await expect(page.locator('#book-club-as-a-room')).toHaveJSProperty('open', true);
    await expect(page.locator('#metal-pages-goes-magazine')).toHaveJSProperty('open', true);
    await expect(page.locator('#metal-pages-opens')).toHaveJSProperty('open', false);

    await expect(page.getByText('The calibration text')).toBeVisible();
    await expect(page.getByText('Didion shelf first.')).toHaveCount(0);
    await expect(page.getByText('the sentence as a measuring instrument')).toHaveCount(0);

    await page.screenshot({ path: `${ARTIFACTS}/updates-desktop-accordion.png` });

    await page.getByTestId('updates-index-archive').click();
    await expect(page.getByTestId('updates-drawer-archive')).toHaveJSProperty('open', true);
    await expect(page.getByText('Slouching Towards Bethlehem')).toBeVisible();
    await expect(page.getByText('the sentence as a measuring instrument')).toHaveCount(0);

    await page.locator('#slouching-towards-bethlehem summary').click();
    await expect(page.locator('#slouching-towards-bethlehem')).toHaveJSProperty('open', true);
    await expect(page.getByText('the sentence as a measuring instrument')).toBeVisible();

    await page.locator('#metal-pages-opens summary').click();
    await expect(page.locator('#metal-pages-opens')).toHaveJSProperty('open', true);
    await expect(page.getByText('Didion shelf first.')).toBeVisible();
    await page.locator('#metal-pages-opens summary').click();
    await expect(page.locator('#metal-pages-opens')).toHaveJSProperty('open', false);

    const kiln = page.locator('.arc-doors-list a[href="/blog/pate-de-verre"]');
    await expect(kiln).toBeVisible();
    await expect(kiln).toHaveAttribute('href', '/blog/pate-de-verre');
  });

  test('mobile: compact index chips', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/updates', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('updates-index')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('updates-drawer-latest')).toHaveJSProperty('open', true);
    await expect(page.getByTestId('updates-drawer-archive')).toHaveJSProperty('open', false);
    await page.screenshot({ path: `${ARTIFACTS}/updates-mobile-accordion.png` });
    await page.getByTestId('updates-index-year-2026').click();
    await expect(page.getByText('Book club as a room')).toBeVisible();
  });
});
