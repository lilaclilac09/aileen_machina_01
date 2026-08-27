import { test, expect, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { tinyWav } from './wav';

const ARTIFACTS = process.env.ARTIFACTS_DIR || '/opt/cursor/artifacts';

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
      if (p === 'drop') {
        fire(targetEl, 'drop');
        fire(sourceEl, 'dragend');
      }
    },
    { sourceEl: src, targetEl: dst, phase },
  );
}

async function audioState(page: Page, testId: 'dj-audio-a' | 'dj-audio-b') {
  return page.locator(`[data-testid="${testId}"]`).evaluate((el: HTMLAudioElement) => ({
    paused: el.paused,
    currentTime: el.currentTime,
    src: el.currentSrc || el.src,
  }));
}

async function shot(page: Page, name: string) {
  await mkdir(ARTIFACTS, { recursive: true });
  await page.screenshot({ path: `${ARTIFACTS}/${name}` });
}

test.use({ viewport: { width: 1440, height: 1100 } });

test.describe('carousel → plate → play/stop', () => {

  test('local audio drops onto the plate, plays, and stops immediately', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });

    const cards = page.getByTestId('dj-carousel-card');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    await expect(cards.first()).toHaveAttribute('draggable', 'true');

    await cards.first().click();
    await expect(page.getByTestId('dj-carousel-selected-title')).toBeVisible();
    await shot(page, 'carousel-selected.png');

    const catalogCard = page.locator('[data-testid="dj-carousel-card"][data-mixable="0"]').first();
    await expect(catalogCard).toBeVisible();
    const catalogId = (await catalogCard.getAttribute('data-track-id')) || '';
    const deckA = page.getByTestId('dj-deck-a-drop');
    const deckTitleA = page.getByTestId('dj-deck-a-title');
    await html5Drag(page, catalogCard, deckA, 'drop');
    await expect(page.getByTestId('dj-toast')).toContainText('No audio.');
    await expect(deckTitleA).toHaveAttribute('data-track-id', '');
    expect(catalogId).toBeTruthy();
    await expect(page.getByTestId('dj-toast')).toBeHidden({ timeout: 5_000 });

    await page.getByTestId('dj-add-audio-input').setInputFiles({
      name: 'damn-my-soul.wav',
      mimeType: 'audio/wav',
      buffer: tinyWav(),
    });

    const localCard = page.locator('[data-testid="dj-carousel-card"][data-mixable="1"]').first();
    await expect(localCard).toBeVisible({ timeout: 10_000 });
    await expect(localCard).toHaveAttribute('data-source', 'local');
    await expect(page.getByTestId('dj-carousel-badge').first()).toHaveText(/local/i);
    await expect(page.getByTestId('dj-carousel-selected-title')).toContainText(/damn-my-soul/i);
    await shot(page, 'local-audio-added-to-carousel.png');

    const localId = (await localCard.getAttribute('data-track-id')) || '';
    expect(localId).toMatch(/^local-/);

    await html5Drag(page, localCard, deckA, 'over');
    await expect(page.getByTestId('dj-drop-hint-a')).toHaveText(/drop to A/i);
    await shot(page, 'dragging-to-plate-a.png');
    await html5Drag(page, localCard, deckA, 'drop');

    await expect(deckTitleA).toHaveAttribute('data-track-id', localId);
    await expect(deckTitleA).toContainText(/damn-my-soul/i);
    await expect(page.getByTestId('dj-toast')).toContainText('Loaded A.');
    await expect(page.getByTestId('dj-deck-a-led')).toHaveAttribute('data-on', '1');
    await shot(page, 'deck-a-loaded.png');
    await expect(page.getByTestId('dj-toast')).toBeHidden({ timeout: 5_000 });

    await page.getByTestId('dj-play-a').click();
    await expect.poll(async () => (await audioState(page, 'dj-audio-a')).paused, { timeout: 8_000 }).toBe(false);
    await expect(page.getByTestId('dj-deck-a-drop')).toHaveAttribute('data-playing', '1');
    await expect(page.getByTestId('dj-toast')).toContainText('Playing.');
    await shot(page, 'deck-a-playing.png');
    await expect(page.getByTestId('dj-toast')).toBeHidden({ timeout: 5_000 });

    await page.getByTestId('dj-stop-a').click();
    const stopped = await audioState(page, 'dj-audio-a');
    expect(stopped.paused).toBe(true);
    expect(stopped.currentTime).toBe(0);
    await expect(page.getByTestId('dj-deck-a-drop')).toHaveAttribute('data-playing', '0');
    await expect(page.getByTestId('dj-toast')).toContainText('Stopped.');
    await shot(page, 'deck-a-stopped.png');
    await expect(page.getByTestId('dj-toast')).toBeHidden({ timeout: 5_000 });

    await page.getByTestId('dj-load-b').click();
    const deckTitleB = page.getByTestId('dj-deck-b-title');
    await expect(deckTitleB).toHaveAttribute('data-track-id', localId);
    await expect(page.getByTestId('dj-toast')).toContainText('Loaded B.');
    await expect(page.getByTestId('dj-toast')).toBeHidden({ timeout: 5_000 });

    await page.getByTestId('dj-find-url').fill('https://example.com/damn-my-soul');
    await page.getByTestId('dj-find-title').fill('Damn My Soul');
    await page.getByTestId('dj-find-cover').fill('/dj-set/assets/covers/surface.jpg');
    await page.getByTestId('dj-find-add').click();

    const refCard = page.locator('[data-testid="dj-carousel-card"][data-source="ref"]').first();
    await expect(refCard).toBeVisible({ timeout: 10_000 });
    await expect(refCard).toHaveAttribute('data-mixable', '0');
    await expect(refCard.getByTestId('dj-carousel-badge')).toHaveText(/ref/i);
    await expect(page.getByTestId('dj-carousel-selected-title')).toContainText(/damn my soul/i);
    await shot(page, 'reference-song-cover-added.png');

    const titleBefore = (await deckTitleA.getAttribute('data-track-id')) || '';
    await html5Drag(page, refCard, deckA, 'drop');
    await expect(page.getByTestId('dj-toast')).toContainText('No audio.');
    await expect(deckTitleA).toHaveAttribute('data-track-id', titleBefore);
    await shot(page, 'no-audio-toast.png');
  });
});
