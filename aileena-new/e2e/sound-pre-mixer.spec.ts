import { test, expect } from '@playwright/test';

test.describe('Sound Lab pre-mixer (#468)', () => {
  test('live /sound has Pioneer decks, not MixBooth engine UI', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Sound Lab/i })).toBeVisible();
    await expect(page.getByTestId('dj-deck-a-drop')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dj-deck-b-drop')).toBeVisible();
    await expect(page.getByTestId('dj-carousel-card').first()).toBeVisible();

    await expect(page.getByTestId('dj-engine-status')).toHaveCount(0);
    await expect(page.getByTestId('dj-mix-booth')).toHaveCount(0);
    await expect(page.getByTestId('dj-upload-a')).toHaveCount(0);
    await expect(page.locator('text=MixBooth')).toHaveCount(0);
  });
});
