import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const ARTIFACTS = '/opt/cursor/artifacts';

const ALL_KNOBS = [
  'dj-knob-gain-a',
  'dj-knob-gain-b',
  'dj-knob-fx',
  'dj-knob-eq-hi',
  'dj-knob-eq-mid',
  'dj-knob-eq-lo',
  'dj-knob-filter-a',
  'dj-knob-filter-b',
  'dj-knob-master',
] as const;

test.describe('DJ knob click / keyboard', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('every rotary shares click, drag, wheel, keyboard, reset', async ({ page }) => {
    await mkdir(ARTIFACTS, { recursive: true });
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dj-station')).toHaveAttribute('data-dj-layout', 'mobile', { timeout: 20_000 });

    for (const id of ALL_KNOBS) {
      const knob = page.getByTestId(id);
      await expect(knob, id).toBeVisible();
      await expect(knob).toHaveAttribute('role', 'slider');
    }

    const gain = page.getByTestId('dj-knob-gain-a');
    await gain.scrollIntoViewIfNeeded();
    await gain.focus();
    await page.screenshot({ path: `${ARTIFACTS}/dj_knob_focused.png`, fullPage: false });
    await page.getByTestId('dj-knob-tick-gain-a-100').click();
    await expect(gain).toHaveAttribute('data-knob-value', '100');
    await expect(page.getByTestId('dj-station')).toHaveAttribute('data-gain-a', '100');
    await page.screenshot({ path: `${ARTIFACTS}/dj_knob_gain_clicked.png`, fullPage: false });

    const eq = page.getByTestId('dj-knob-eq-hi');
    await eq.scrollIntoViewIfNeeded();
    const eqBox = await eq.boundingBox();
    expect(eqBox).toBeTruthy();
    await page.mouse.move(eqBox!.x + eqBox!.width / 2, eqBox!.y + eqBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(eqBox!.x + eqBox!.width / 2, eqBox!.y + eqBox!.height / 2 - 40);
    await page.mouse.up();
    await expect.poll(async () => page.getByTestId('dj-mixer').getAttribute('data-eq-hi')).not.toBe('50');
    await page.screenshot({ path: `${ARTIFACTS}/dj_knob_eq_dragged.png`, fullPage: false });

    const filter = page.getByTestId('dj-knob-filter-a');
    await filter.scrollIntoViewIfNeeded();
    await filter.hover();
    const beforeFilter = await filter.getAttribute('data-knob-value');
    await page.mouse.wheel(0, -240);
    await expect.poll(async () => filter.getAttribute('data-knob-value')).not.toBe(beforeFilter);
    await expect.poll(async () => page.getByTestId('dj-mixer').getAttribute('data-filter-a')).not.toBe('50');
    await page.screenshot({ path: `${ARTIFACTS}/dj_knob_filter_wheel.png`, fullPage: false });

    const master = page.getByTestId('dj-knob-master');
    await master.scrollIntoViewIfNeeded();
    await master.focus();
    await master.press('ArrowUp');
    await expect(master).toHaveAttribute('data-knob-value', '76');
    await expect(page.getByTestId('dj-mixer')).toHaveAttribute('data-master', '76');
    await page.screenshot({ path: `${ARTIFACTS}/dj_knob_master_keyboard.png`, fullPage: false });

    await master.dblclick();
    await expect(master).toHaveAttribute('data-knob-value', '75');
    await expect(page.getByTestId('dj-mixer')).toHaveAttribute('data-master', '75');
    await page.screenshot({ path: `${ARTIFACTS}/dj_knob_master_reset.png`, fullPage: false });
  });
});
