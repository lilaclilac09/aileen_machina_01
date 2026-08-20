import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * Playwright mouse dragTo often skips HTML5 DataTransfer.
 * Dispatch the lifecycle so React onDragStart / onDrop run.
 */
async function html5DragDrop(page: Page, source: Locator, target: Locator) {
  const src = await source.elementHandle();
  const dst = await target.elementHandle();
  if (!src || !dst) throw new Error('missing drag handles');
  const id = (await source.getAttribute('data-track-id')) || '';

  await page.evaluate(
    ({ sourceEl, targetEl, trackId }) => {
      const dt = new DataTransfer();
      if (trackId) dt.setData('text/plain', trackId);
      const fire = (el: Element, type: string) => {
        const ev = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        });
        el.dispatchEvent(ev);
      };
      fire(sourceEl, 'dragstart');
      fire(targetEl, 'dragenter');
      fire(targetEl, 'dragover');
      fire(targetEl, 'drop');
      fire(sourceEl, 'dragend');
    },
    { sourceEl: src, targetEl: dst, trackId: id },
  );
}

/**
 * Smoke: HTML5 drag carousel cover → Deck A.
 * Desktop / fine pointer only (matches TrackLibraryBrowser finePointer gate).
 */
test.describe('DJ drag → Deck A', () => {
  test('dragging a carousel card onto Deck A loads that track', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const cards = page.getByTestId('dj-carousel-card');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    expect(await cards.count()).toBeGreaterThan(0);

    const deckTitle = page.getByTestId('dj-deck-a-title');
    await expect(deckTitle).toBeVisible();

    let source = page.locator('[data-testid="dj-carousel-card"][data-mixable="true"]').first();
    await expect(source).toBeVisible({ timeout: 20_000 });

    const sourceId = (await source.getAttribute('data-track-id')) || '';
    const sourceTitle = (await source.getAttribute('data-track-title')) || '';
    expect(sourceId).toBeTruthy();

    const deckA = page.getByTestId('dj-deck-a-drop');
    await expect(deckA).toBeVisible();

    await html5DragDrop(page, source, deckA);

    await expect
      .poll(async () => (await deckTitle.getAttribute('data-track-id')) || '', {
        timeout: 10_000,
      })
      .toBe(sourceId);

    const afterTitle = (await deckTitle.textContent())?.trim() || '';
    if (sourceTitle) {
      expect(afterTitle.toLowerCase()).toContain(sourceTitle.slice(0, 8).toLowerCase());
    }

    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-a', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('dj-deck-a-drop')).toHaveAttribute('data-mix-loaded', 'true');
    await page.getByTestId('dj-play-a').click();
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-a', 'true');
  });

  test('dragging a reference card does not load mix audio', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const cards = page.getByTestId('dj-carousel-card');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const source = page.locator('[data-testid="dj-carousel-card"][data-mixable="false"]').first();
    await expect(source).toBeVisible();
    const deckA = page.getByTestId('dj-deck-a-drop');
    await html5DragDrop(page, source, deckA);
    await expect(page.getByTestId('dj-deck-hint')).toContainText(/Not mixable|Reference only/i);
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-a', 'false');
  });
});
