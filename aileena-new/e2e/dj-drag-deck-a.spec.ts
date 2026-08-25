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

    const mixable = page.locator('[data-testid="dj-carousel-card"][data-mixable="true"]');
    await expect(mixable.first()).toBeVisible();
    let source = mixable.first();
    for (let i = 0; i < await mixable.count(); i++) {
      const c = mixable.nth(i);
      if (!(await c.isVisible())) continue;
      const id = (await c.getAttribute('data-track-id')) || '';
      if (id && id !== beforeId) {
        source = c;
        break;
      }
    }

    const sourceId = (await source.getAttribute('data-track-id')) || '';
    const sourceTitle = (await source.getAttribute('data-track-title')) || '';
    expect(sourceId).toBeTruthy();
    await expect(source).toHaveAttribute('data-mixable', 'true');

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
  });

  test('dropping a reference card onto Deck A shows Not mixable', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const ref = page.locator('[data-testid="dj-carousel-card"][data-mixable="false"]');
    await expect(ref.first()).toBeVisible({ timeout: 20_000 });
    let source = ref.first();
    for (let i = 0; i < await ref.count(); i++) {
      const c = ref.nth(i);
      if (await c.isVisible()) {
        source = c;
        break;
      }
    }
    const deckA = page.getByTestId('dj-deck-a-drop');
    await html5DragDrop(page, source, deckA);
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Not mixable.');
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-a', 'false');
  });
});
