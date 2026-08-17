import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const ARTIFACTS = '/opt/cursor/artifacts';
const PREVIEW_ID = '7ouMYWpwJ422jRcDASZB7P';
const NO_PREVIEW_ID = '4VqPOruhp5EdPBeR92t6lQ';
const CATALOGUE_ID = '69w5X6uTrOaWM32IetSzvO';

const MOCK_TRACKS = [
  {
    spotifyId: PREVIEW_ID,
    title: 'Knights of Cydonia',
    artists: ['Muse'],
    album: 'Black Holes and Revelations',
    albumArt: null,
    durationMs: 366_000,
    externalUrl: `https://open.spotify.com/track/${PREVIEW_ID}`,
    previewUrl: 'https://p.scdn.co/mp3-preview/example',
    source: 'spotify',
  },
  {
    spotifyId: NO_PREVIEW_ID,
    title: 'Time',
    artists: ['Pink Floyd'],
    album: 'The Dark Side of the Moon',
    albumArt: null,
    durationMs: 413_000,
    externalUrl: `https://open.spotify.com/track/${NO_PREVIEW_ID}`,
    previewUrl: null,
    source: 'spotify',
  },
  {
    spotifyId: CATALOGUE_ID,
    title: 'Daydreaming',
    artists: ['Harry Styles'],
    album: '',
    albumArt: null,
    durationMs: 200_000,
    externalUrl: `https://open.spotify.com/track/${CATALOGUE_ID}`,
    previewUrl: null,
    source: 'spotify',
  },
];

async function mockSpotify(page: Page, configured: boolean) {
  await page.route('**/api/spotify/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, configured }),
    });
  });
  await page.route('**/api/spotify/search**', async (route) => {
    if (!configured) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: { code: 'not_configured', message: 'Spotify search is not configured.' },
        }),
      });
      return;
    }
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') || '').trim();
    if (q.toLowerCase().includes('zzzz')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { configured: true, q, count: 0, tracks: [] } }),
      });
      return;
    }
    if (q.length < 2) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: { code: 'bad_request', message: 'q' } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: { configured: true, q, count: MOCK_TRACKS.length, tracks: MOCK_TRACKS },
      }),
    });
  });
}

test.describe('Spotify search → carousel', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('search idle, results, add, duplicate, no-preview open', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await mockSpotify(page, true);
    await page.addInitScript(() => {
      window.localStorage.removeItem('aileena_sound_spotify_carousel_v1');
    });

    await page.goto('/sound#dj-set', { waitUntil: 'domcontentloaded' });
    const search = page.getByTestId('spotify-search');
    await expect(search).toBeVisible({ timeout: 20_000 });
    await expect(search).toHaveAttribute('data-spotify-configured', /ready|missing|error/, { timeout: 10_000 });
    await page.locator('#dj-set').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('spotify-search-input')).toBeEnabled();
    await expect(search).toContainText('Search Spotify');
    await page.screenshot({
      path: `${ARTIFACTS}/spotify_search_idle.png`,
      fullPage: false,
    });

    await page.getByTestId('spotify-search-input').fill('muse');
    const results = page.getByTestId('spotify-search-results');
    await expect(results).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('spotify-search-hit')).toHaveCount(3);
    await expect(page.getByTestId('spotify-search-preview')).toBeVisible();
    await expect(page.getByTestId('spotify-search-open')).toHaveCount(2);
    await expect(page.getByTestId('spotify-search-add').nth(2)).toHaveText(/added/i);
    await page.screenshot({
      path: `${ARTIFACTS}/spotify_search_results.png`,
      fullPage: false,
    });

    const beforeCards = await page.getByTestId('dj-carousel-card').count();
    await page.getByTestId('spotify-search-add').first().click();
    await expect(page.getByTestId('spotify-search-notice')).toContainText(/Track added/i);

    await expect
      .poll(async () => page.locator('[data-testid="dj-carousel-card"][data-source="spotify"]').count(), {
        timeout: 8_000,
      })
      .toBeGreaterThan(0);

    const afterCards = await page.getByTestId('dj-carousel-card').count();
    expect(afterCards).toBeGreaterThanOrEqual(beforeCards);
    await expect(page.getByTestId('spotify-ref-badge').first()).toBeVisible();
    await expect(page.locator('#dj-set')).toContainText(/not mixable/i);
    await page.locator('[data-dj-load-deck="left"]').click();
    await expect(page.getByText(/Reference only/i)).toBeVisible();
    await page.locator('#dj-set').screenshot({
      path: `${ARTIFACTS}/spotify_search_track_added.png`,
    });
    await page.screenshot({
      path: `${ARTIFACTS}/spotify_search_load_ref_hint.png`,
      fullPage: false,
    });

    await page.getByTestId('spotify-search-input').fill('');
    await page.getByTestId('spotify-search-input').fill('muse');
    await expect(results).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('spotify-search-add').first().click();
    await expect(page.getByTestId('spotify-search-notice')).toContainText(/Already added/i);
    await page.screenshot({
      path: `${ARTIFACTS}/spotify_search_duplicate_prevented.png`,
      fullPage: false,
    });

    const stored = await page.evaluate(() => window.localStorage.getItem('aileena_sound_spotify_carousel_v1'));
    expect(stored).toContain(PREVIEW_ID);
    expect(stored).toContain('"source":"spotify"');

    await page.getByTestId('spotify-search-input').fill('zzzzempty');
    await expect(page.getByTestId('spotify-search-empty')).toBeVisible({ timeout: 8_000 });
  });

  test('missing env shows disabled state', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await mockSpotify(page, false);
    await page.goto('/sound#dj-set', { waitUntil: 'domcontentloaded' });
    const search = page.getByTestId('spotify-search');
    await expect(search).toBeVisible({ timeout: 20_000 });
    await expect(search).toHaveAttribute('data-spotify-configured', 'missing', { timeout: 10_000 });
    await page.locator('#dj-set').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('spotify-search-disabled')).toContainText(/Spotify not connected/i);
    await expect(page.getByTestId('spotify-search-input')).toBeDisabled();
    await expect(page.getByTestId('spotify-search-input')).toHaveAttribute(
      'placeholder',
      'search Spotify to add a track',
    );
    await page.screenshot({
      path: `${ARTIFACTS}/spotify_search_env_missing.png`,
      fullPage: false,
    });
  });
});
