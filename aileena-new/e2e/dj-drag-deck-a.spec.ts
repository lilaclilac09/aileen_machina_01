import { test, expect, type Locator } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1600 } });

async function mouseDrag(page: import('@playwright/test').Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const sb = await source.boundingBox();
  const db = await target.boundingBox();
  if (!sb || !db) throw new Error('missing drag boxes');
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down();
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2, { steps: 24 });
  await page.mouse.up();
}

async function firstOtherCard(page: import('@playwright/test').Page, deckTitle: Locator) {
  const beforeId = (await deckTitle.getAttribute('data-track-id')) || '';
  const cards = page.getByTestId('dj-carousel-card');
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const c = cards.nth(i);
    if (!(await c.isVisible())) continue;
    const id = (await c.getAttribute('data-track-id')) || '';
    if (id && id !== beforeId) return c;
  }
  throw new Error('no other carousel card');
}

test.describe('DJ drag CD → plate', () => {
  test('dragging a carousel CD onto Deck A loads that track', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const deckTitle = page.getByTestId('dj-deck-a-title');
    await expect(deckTitle).toBeVisible();
    const source = await firstOtherCard(page, deckTitle);
    const sourceId = (await source.getAttribute('data-track-id')) || '';
    const sourceTitle = (await source.getAttribute('data-track-title')) || '';
    expect(sourceId).toBeTruthy();

    await mouseDrag(page, source, page.getByTestId('dj-deck-a-drop'));

    await expect
      .poll(async () => (await deckTitle.getAttribute('data-track-id')) || '', { timeout: 8_000 })
      .toBe(sourceId);
    if (sourceTitle) {
      expect((await deckTitle.textContent())?.toLowerCase() || '').toContain(
        sourceTitle.slice(0, 8).toLowerCase(),
      );
    }
  });

  test('dragging a carousel CD onto Deck B loads that track', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const deckTitle = page.getByTestId('dj-deck-b-title');
    await expect(deckTitle).toBeVisible();
    const source = await firstOtherCard(page, deckTitle);
    const sourceId = (await source.getAttribute('data-track-id')) || '';
    expect(sourceId).toBeTruthy();

    await mouseDrag(page, source, page.getByTestId('dj-deck-b-drop'));

    await expect
      .poll(async () => (await deckTitle.getAttribute('data-track-id')) || '', { timeout: 8_000 })
      .toBe(sourceId);
  });
});

test.describe('DJ knob ticks', () => {
  test('clicking a scale tick jumps the HI knob to that value', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const knob = page.getByTestId('dj-knob-hi');
    await expect(knob).toBeVisible();
    await expect(knob).toHaveAttribute('data-value', '50');

    await page.getByTestId('dj-knob-hi-tick-0').click();
    await expect(knob).toHaveAttribute('data-value', '0');

    await page.getByTestId('dj-knob-hi-tick-100').click();
    await expect(knob).toHaveAttribute('data-value', '100');

    await page.getByTestId('dj-knob-hi-tick-50').click();
    await expect(knob).toHaveAttribute('data-value', '50');
  });
});

function carouselCard(page: import('@playwright/test').Page, trackId: string) {
  return page.locator(`[data-testid="dj-carousel-card"][data-track-id="${trackId}"]`);
}

async function activeCoverId(page: import('@playwright/test').Page) {
  return (await page.getByTestId('dj-carousel-active-id').getAttribute('data-track-id')) || '';
}

async function advanceToNextCover(page: import('@playwright/test').Page) {
  const before = await activeCoverId(page);
  await page.locator('#dj-set').scrollIntoViewIfNeeded();
  await page.getByTestId('dj-carousel-next').evaluate((el) => (el as HTMLButtonElement).click());
  await expect
    .poll(async () => activeCoverId(page), { timeout: 8_000 })
    .not.toBe(before);
  return activeCoverId(page);
}

async function dblclickCover(page: import('@playwright/test').Page, trackId: string) {
  const card = carouselCard(page, trackId);
  await card.scrollIntoViewIfNeeded();
  await card.click({ clickCount: 2, force: true });
}

test.describe('DJ double-click CD → A then B', () => {
  test('first double-click loads Deck A, second loads Deck B', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const deckA = page.getByTestId('dj-deck-a-title');
    const deckB = page.getByTestId('dj-deck-b-title');
    await expect(deckA).toBeVisible();
    await expect(deckB).toBeVisible();
    const startA = (await deckA.getAttribute('data-track-id')) || '';
    const startB = (await deckB.getAttribute('data-track-id')) || '';

    const firstId = await advanceToNextCover(page);
    expect(firstId).toBeTruthy();
    expect(firstId).not.toBe(startA);
    await dblclickCover(page, firstId);
    await expect
      .poll(async () => (await deckA.getAttribute('data-track-id')) || '', { timeout: 8_000 })
      .toBe(firstId);
    expect((await deckB.getAttribute('data-track-id')) || '').toBe(startB);

    const secondId = await advanceToNextCover(page);
    expect(secondId).toBeTruthy();
    expect(secondId).not.toBe(firstId);
    await dblclickCover(page, secondId);
    await expect
      .poll(async () => (await deckB.getAttribute('data-track-id')) || '', { timeout: 8_000 })
      .toBe(secondId);
    expect((await deckA.getAttribute('data-track-id')) || '').toBe(firstId);
  });
});
