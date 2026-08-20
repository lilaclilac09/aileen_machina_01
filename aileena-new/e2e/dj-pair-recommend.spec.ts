import { test, expect } from '@playwright/test';

test.describe('DJ pair recommendation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('stays compact: real mixable hits or Need two tracks', async ({ page }) => {
    await page.goto('/sound#dj-set', { waitUntil: 'domcontentloaded' });
    const panel = page.getByTestId('dj-pair-panel');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await panel.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(page.getByText(/Suggestions for/i)).toHaveCount(0);

    const kick = page.locator('[data-testid="dj-carousel-card"][data-track-id="demo-kick"]');
    await kick.click();
    await expect(page.getByTestId('dj-station')).toHaveAttribute('data-selected-id', 'demo-kick');

    await expect(panel).toHaveAttribute('data-pair-empty', 'false');
    await expect(page.getByTestId('dj-pair-hit')).toHaveCount(1, { timeout: 20_000 });
    await expect(page.getByTestId('dj-pair-hit').first()).toContainText(/Stab Loop/i);

    await page.getByTestId('dj-pair-panel').screenshot({ path: '/opt/cursor/artifacts/pair-recommendation.png' });
    await page.screenshot({ path: '/opt/cursor/artifacts/mobile-pair-recommendation.png' });

    await expect(panel).toHaveAttribute('data-hard-techno', 'true');
    await page.getByTestId('dj-hard-techno-bias').uncheck();
    await expect(panel).toHaveAttribute('data-hard-techno', 'false');
    await page.getByTestId('dj-hard-techno-bias').check();
    await expect(panel).toHaveAttribute('data-hard-techno', 'true');

    await page.getByTestId('dj-pair-load-b').first().click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText(/Loaded B/i);
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-b', 'true', { timeout: 15_000 });
  });
});
