import { test, expect } from '@playwright/test';

test('tools hub has exactly one Named Campuses card; the page shows the original map', async ({
  page,
}) => {
  test.setTimeout(90_000);

  await page.goto('/tools', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Escape');

  const cards = page.getByTestId('tools-card-named-campuses');
  await expect(cards).toHaveCount(1);
  await expect(cards).toBeVisible();
  await expect(page.getByTestId('tools-card-lingang')).toHaveCount(0);
  await expect(page.getByTestId('tools-card-ulanqab')).toHaveCount(0);
  await expect(page.getByTestId('tools-card-jurong')).toHaveCount(0);

  await cards.click();
  await expect(page).toHaveURL(/\/tools\/named-campuses/);

  const map = page.getByTestId('named-campuses-map-img');
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute('src', /fig-map-icons\.(svg|png)$/);
  await expect
    .poll(async () => map.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(800);

  const stills = page.getByTestId('named-campuses-stills').locator('img');
  await expect(stills).toHaveCount(3);

  const sources = page.getByTestId('named-campuses-sources');
  await expect(sources.getByRole('link', { name: /where's next chinese neocloud/i })).toHaveAttribute(
    'href',
    'https://x.com/Aileengf1/status/2089664755405578418',
  );
  await expect(sources.getByRole('link', { name: /extending to SG fact checking/i })).toHaveAttribute(
    'href',
    'https://x.com/Aileengf1/status/2089695518163091729',
  );
});
