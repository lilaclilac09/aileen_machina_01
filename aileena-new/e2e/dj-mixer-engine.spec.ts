import { test, expect } from '@playwright/test';
import { stat } from 'node:fs/promises';

function pcmWav(seconds: number, freq: number, sampleRate = 44100): Buffer {
  const n = Math.floor(seconds * sampleRate);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.45;
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

test.describe('DJ mixer engine', () => {
  test('upload two files, mix, record, export receipt', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dj-engine-status')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-ready', 'true');
    await expect(page.getByTestId('dj-station')).toBeVisible();
    await expect(page.getByTestId('dj-spotify-preview-note')).toHaveCount(0);

    const wavA = pcmWav(3, 440);
    const wavB = pcmWav(3, 660);

    await page.getByTestId('dj-upload-a').setInputFiles({
      name: 'desk-a.wav',
      mimeType: 'audio/wav',
      buffer: wavA,
    });
    await page.getByTestId('dj-upload-b').setInputFiles({
      name: 'desk-b.wav',
      mimeType: 'audio/wav',
      buffer: wavB,
    });

    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-a', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-b', 'true');
    await expect(page.getByTestId('dj-deck-a-drop')).toHaveAttribute('data-mix-loaded', 'true');
    await expect(page.getByTestId('dj-waveform-a')).toBeVisible();
    await expect(page.getByTestId('dj-waveform-b')).toBeVisible();
    await page.screenshot({ path: '/opt/cursor/artifacts/desktop_decks_loaded.png' });

    await page.getByTestId('dj-play-a').click();
    await page.getByTestId('dj-play-b').click();
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-a', 'true');
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-b', 'true');
    await page.waitForTimeout(400);

    const gainA = page.getByTestId('dj-knob-gain-a');
    const gainBefore = await gainA.getAttribute('data-knob-value');
    await gainA.focus();
    await page.keyboard.press('ArrowUp');
    await expect(gainA).not.toHaveAttribute('data-knob-value', gainBefore ?? '');

    await page.getByTestId('dj-knob-eq-a-hi').focus();
    await page.keyboard.press('Home');
    await expect(page.getByTestId('dj-knob-eq-a-hi')).toHaveAttribute('data-knob-value', '0');
    await expect(page.getByTestId('dj-mixer')).toHaveAttribute('data-eq-a-hi', '0');

    await page.getByTestId('dj-knob-tick-filter-a-0').click();
    await expect(page.getByTestId('dj-knob-filter-a')).toHaveAttribute('data-knob-value', '0');

    await page.getByTestId('dj-knob-master').dblclick();
    await expect(page.getByTestId('dj-knob-master')).toHaveAttribute('data-knob-value', '75');

    await page.getByTestId('dj-fader-a').focus();
    await page.keyboard.press('Home');
    await expect(page.getByTestId('dj-fader-a')).toHaveAttribute('data-fader-value', '0');
    await expect(page.getByTestId('dj-mixer')).toHaveAttribute('data-fader-a', '0');
    await page.getByTestId('dj-fader-a').dblclick();
    await expect(page.getByTestId('dj-fader-a')).toHaveAttribute('data-fader-value', '80');

    const xfade = page.getByTestId('dj-xfade');
    await xfade.focus();
    await page.keyboard.press('End');
    await expect(xfade).toHaveAttribute('data-fader-value', '100');
    await expect(page.getByTestId('dj-mixer')).toHaveAttribute('data-xfade', '100');
    await page.screenshot({ path: '/opt/cursor/artifacts/desktop_both_decks_playing.png' });
    await page.getByTestId('dj-mixer').screenshot({ path: '/opt/cursor/artifacts/desktop_mixer_controls.png' });

    await page.getByTestId('dj-pitch-a').focus();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('dj-pitch-a')).not.toHaveAttribute('data-fader-value', '0.0');

    await page.getByTestId('dj-record').click();
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-recording', 'true');
    await page.waitForTimeout(900);
    await page.getByTestId('dj-record').click();

    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-export-ready', 'true', { timeout: 10_000 });
    await expect(page.getByTestId('dj-mix-receipt')).toBeVisible();
    await expect(page.getByTestId('dj-mix-receipt')).toContainText('MIX RECEIPT');
    await expect(page.getByTestId('dj-soundcloud-open')).toHaveAttribute('href', 'https://soundcloud.com/upload');
    await expect(page.getByTestId('dj-export-audio')).toBeEnabled();
    await expect(page.getByTestId('dj-export-meta')).toBeEnabled();
    await expect(page.getByTestId('dj-copy-soundcloud')).toBeEnabled();
    await expect(page.getByText(/Export ready/i)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('dj-export-audio').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/aileena-desk-mix\.(webm|m4a|ogg)/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const info = await stat(filePath!);
    expect(info.size).toBeGreaterThan(0);
    await page.screenshot({ path: '/opt/cursor/artifacts/desktop_export_ready.png' });
  });

  test('carousel Kick Load A plays, Stab Load B plays, Daydreaming not mixable', async ({ page }) => {
    await page.goto('/sound', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-ready', 'true', { timeout: 20_000 });
    await expect(page.getByTestId('dj-spotify-preview-note')).toHaveCount(0);

    const crate = page.locator('#dj-set');
    await crate.scrollIntoViewIfNeeded();
    await expect(page.getByTestId('dj-carousel-active-title')).toHaveText(/Kick Loop/i);

    await crate.locator('[data-dj-load-deck="left"]').click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Loaded A.');
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-a', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('dj-deck-a-title')).toContainText(/Kick Loop/i);

    await page.getByTestId('dj-play-a').click();
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-a', 'true');

    await page.locator('[data-testid="dj-carousel-card"][data-track-id="demo-stab"]').click();
    await expect(page.getByTestId('dj-carousel-active-title')).toHaveText(/Stab Loop/i);
    await crate.locator('[data-dj-load-deck="right"]').click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Loaded B.');
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-deck-b', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('dj-deck-b-title')).toContainText(/Stab Loop/i);

    await page.getByTestId('dj-play-b').click();
    await expect(page.getByTestId('dj-engine-status')).toHaveAttribute('data-playing-b', 'true');

    await page.locator('[data-testid="dj-carousel-card"][data-track-id="DAYDRM"]').click();
    await expect(page.getByTestId('dj-carousel-active-title')).toHaveText(/Daydreaming/i);
    await crate.locator('[data-dj-load-deck="left"]').click();
    await expect(page.getByTestId('dj-deck-hint')).toContainText('Not mixable.');
    await expect(page.getByTestId('dj-deck-a-title')).toContainText(/Kick Loop/i);
  });
});
