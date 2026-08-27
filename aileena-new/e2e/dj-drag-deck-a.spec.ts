import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * Playwright mouse dragTo often skips HTML5 DataTransfer.
 * Dispatch the lifecycle so React onDragStart / onDrop run.
 */
async function html5DragDrop(page: Page, source: Locator, target: Locator) {
  const src = await source.elementHandle();
  const dst = await target.elementHandle();
  if (!src || !dst) throw new Error('missing drag handles');

  await page.evaluate(
    ({ sourceEl, targetEl }) => {
      const dt = new DataTransfer();
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
    { sourceEl: src, targetEl: dst },
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

    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    const deckTitle = page.getByTestId('dj-deck-a-title');
    await expect(deckTitle).toBeVisible();
    const beforeId = (await deckTitle.getAttribute('data-track-id')) || '';

    let source = cards.first();
    for (let i = 0; i < cardCount; i++) {
      const c = cards.nth(i);
      if ((await c.getAttribute('data-track-id')) === 'TONE-A') {
        source = c;
        break;
      }
    }

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

    await expect(deckA).toHaveAttribute('data-mix-loaded', 'true');
    await page.getByTestId('dj-play-a').click();
    await expect.poll(async () => {
      return page.locator('[data-testid="dj-audio-a"]').evaluate((el) => {
        const audio = el as HTMLAudioElement;
        return !audio.paused && audio.currentTime >= 0 && Boolean(audio.src);
      });
    }, { timeout: 8_000 }).toBe(true);
  });
});
