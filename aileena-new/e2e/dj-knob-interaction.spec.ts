import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const ARTIFACTS = '/opt/cursor/artifacts';

test.describe('DJ knob click / keyboard', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('click tick, keyboard step, double-click reset', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    const knob = page.getByTestId('dj-knob-filter-a');
    await expect(knob).toBeVisible({ timeout: 20_000 });
    await knob.scrollIntoViewIfNeeded();
    await expect(knob).toHaveAttribute('role', 'slider');
    await expect(knob).toHaveAttribute('data-knob-value', '50');
    await page.screenshot({
      path: `${ARTIFACTS}/dj_knob_before.png`,
      fullPage: false,
    });

    await page.getByTestId('dj-knob-tick-filter-a-100').click();
    await expect(knob).toHaveAttribute('data-knob-value', '100');
    await page.screenshot({
      path: `${ARTIFACTS}/dj_knob_click_tick.png`,
      fullPage: false,
    });

    await knob.focus();
    await knob.press('ArrowDown');
    await expect(knob).toHaveAttribute('data-knob-value', '99');
    await knob.press('Shift+ArrowDown');
    await expect.poll(async () => knob.getAttribute('data-knob-value')).not.toBe('99');

    await knob.dblclick();
    await expect(knob).toHaveAttribute('data-knob-value', '50');
    await page.screenshot({
      path: `${ARTIFACTS}/dj_knob_after_reset.png`,
      fullPage: false,
    });

    const eq = page.getByTestId('dj-knob-eq-hi');
    await eq.scrollIntoViewIfNeeded();
    await page.getByTestId('dj-knob-tick-eq-hi-0').click();
    await expect(eq).toHaveAttribute('data-knob-value', '0');
  });
});
