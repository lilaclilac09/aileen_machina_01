import { test, expect, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const ARTIFACTS = '/opt/cursor/artifacts';
const PREVIEW_ID = '7ouMYWpwJ422jRcDASZB7P';

/**
 * Playwright mouse dragTo often skips HTML5 DataTransfer.
 * Dispatch the lifecycle so React onDragStart / onDrop run.
 */
async function html5Drag(page: Page, source: Locator, target: Locator, phase: 'over' | 'drop') {
  const src = await source.elementHandle();
  const dst = await target.elementHandle();
  if (!src || !dst) throw new Error('missing drag handles');

  await page.evaluate(
    ({ sourceEl, targetEl, phase: p }) => {
      const dt = new DataTransfer();
      const id = sourceEl.getAttribute('data-track-id') || '';
      try {
        dt.setData('text/plain', id);
        dt.effectAllowed = 'copy';
      } catch {
        /* ignore */
      }
      const fire = (el: Element, type: string) => {
        const ev = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        });
        el.dispatchEvent(ev);
      };
      fire(sourceEl, 'dragstart');
      const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
      targetEl.dispatchEvent(over);
      if (!over.defaultPrevented) {
        over.preventDefault();
      }
      if (p === 'drop') {
        fire(targetEl, 'drop');
        fire(sourceEl, 'dragend');
      }
    },
    { sourceEl: src, targetEl: dst, phase },
  );
}

async function mockSpotify(page: Page) {
  await page.route('**/api/spotify/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, configured: true }),
    });
  });
  await page.route('**/api/spotify/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          configured: true,
          q: 'muse',
          count: 1,
          tracks: [
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
          ],
        },
      }),
    });
  });
}

test.describe('DJ carousel → decks', () => {
  test('drag mixable cards and Load A/B actually mix; Spotify refs toast', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await mockSpotify(page);
    await page.addInitScript(() => {
      window.localStorage.removeItem('aileena_sound_spotify_carousel_v1');
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dj-engine-status')).toBeVisible({ timeout: 20_000 });

    const toneA = page.locator('[data-testid="dj-carousel-card"][data-track-id="LOCAL-TONE-A"]');
    const toneB = page.locator('[data-testid="dj-carousel-card"][data-track-id="LOCAL-TONE-B"]');
    await expect(toneA).toBeVisible({ timeout: 20_000 });
    await expect(toneA).toHaveAttribute('data-mixable', 'true');
    await expect(toneB).toHaveAttribute('data-mixable', 'true');

    await page.locator('#dj-set').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('dj-carousel-load-a')).toBeVisible();
    await expect(page.getByTestId('dj-carousel-load-b')).toBeVisible();
    await page.screenshot({ path: `${ARTIFACTS}/carousel-selected-load-buttons.png` });

    const deckA = page.getByTestId('dj-deck-a-drop');
    const deckB = page.getByTestId('dj-deck-b-drop');
    await deckA.scrollIntoViewIfNeeded();

    await html5Drag(page, toneA, deckA, 'over');
    await expect(page.getByTestId('dj-drop-hint-a')).toContainText(/Drop to Deck A/i);
    await page.screenshot({ path: `${ARTIFACTS}/dragging-over-deck-a.png` });
    await html5Drag(page, toneA, deckA, 'drop');

    await expect(deckA).toHaveAttribute('data-mix-loaded', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('dj-deck-a-title')).toContainText(/Tone A/i);
    await expect(page.getByTestId('dj-deck-a-status')).toHaveText('Loaded');
    await expect(page.getByTestId('dj-play-a')).toBeEnabled();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Loaded to A.');
    await page.screenshot({ path: `${ARTIFACTS}/deck-a-loaded-from-carousel.png` });

    await html5Drag(page, toneB, deckB, 'drop');
    await expect(deckB).toHaveAttribute('data-mix-loaded', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('dj-deck-b-title')).toContainText(/Tone B/i);
    await expect(page.getByTestId('dj-deck-b-status')).toHaveText('Loaded');
    await expect(page.getByTestId('dj-play-b')).toBeEnabled();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Loaded to B.');
    await deckB.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${ARTIFACTS}/deck-b-loaded-from-carousel.png` });

    await page.getByTestId('dj-carousel-load-a').click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Loaded to A.');
    await page.getByTestId('dj-carousel-load-b').click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Loaded to B.');
    await expect(deckA).toHaveAttribute('data-mix-loaded', 'true');
    await expect(deckB).toHaveAttribute('data-mix-loaded', 'true');

    await page.getByTestId('dj-play-a').click();
    await page.getByTestId('dj-play-b').click();
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-a', 'true');
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-b', 'true');

    await page.getByTestId('spotify-search').scrollIntoViewIfNeeded();
    await page.getByTestId('spotify-search-input').fill('muse');
    await expect(page.getByTestId('spotify-search-hit')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('spotify-search-add').first().click();
    await expect(page.getByTestId('spotify-search-notice')).toContainText(/Track added/i);
    await expect(page.locator('[data-testid="dj-carousel-card"][data-source="spotify"]')).toBeVisible({
      timeout: 8_000,
    });
    const spotifyCard = page.locator('[data-testid="dj-carousel-card"][data-source="spotify"]');
    await html5Drag(page, spotifyCard, deckA, 'over');
    await expect(page.getByTestId('dj-drop-hint-a')).toContainText(/Reference only/i);
    await html5Drag(page, spotifyCard, deckA, 'drop');
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Reference only.');
    await page.getByTestId('dj-carousel-load-a').click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Reference only.');
    await page.screenshot({ path: `${ARTIFACTS}/reference-only-toast.png` });
    await expect(deckA).toHaveAttribute('data-mix-loaded', 'true');
    await expect(page.getByTestId('dj-play-a')).toBeEnabled();
  });
});
