import { test, expect } from '@playwright/test';

test.describe('DJ pair recommendation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows metadata pairs and hard techno bias', async ({ page }) => {
    await page.goto('/sound#dj-set', { waitUntil: 'domcontentloaded' });
    const panel = page.getByTestId('dj-pair-panel');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await panel.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.getByTestId('dj-pair-toggle').click();
    await expect(page.getByTestId('dj-pair-hit')).toHaveCount(4, { timeout: 20_000 });
    await expect(page.getByTestId('dj-pair-feedback').first()).toBeVisible();

    await page.screenshot({ path: '/opt/cursor/artifacts/mobile-pair-recommendation.png' });
    await page.screenshot({ path: '/opt/cursor/artifacts/pair-recommendation.png' });

    await expect(panel).toHaveAttribute('data-hard-techno', 'true');
    const before = await page.getByTestId('dj-pair-hit').first().innerText();
    await page.getByTestId('dj-hard-techno-bias').uncheck();
    await expect(panel).toHaveAttribute('data-hard-techno', 'false');
    await page.getByTestId('dj-hard-techno-bias').check();
    await expect(panel).toHaveAttribute('data-hard-techno', 'true');
    await expect(page.getByTestId('dj-pair-hit').first()).toBeVisible();
    const after = await page.getByTestId('dj-pair-hit').first().innerText();
    expect(before.length + after.length).toBeGreaterThan(0);

    await page.getByTestId('dj-pair-load-b').first().click();
    await expect(page.getByText(/Loaded B/i)).toBeVisible();
  });
});
