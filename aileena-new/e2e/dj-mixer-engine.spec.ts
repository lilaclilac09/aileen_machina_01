import { test, expect } from '@playwright/test';

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
    await expect(page.getByTestId('dj-spotify-preview-note')).toContainText('cannot be mixed');

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

    await page.getByTestId('dj-play-a').click();
    await page.getByTestId('dj-play-b').click();
    await page.waitForTimeout(400);

    const xfade = page.getByTestId('dj-xfade');
    await xfade.evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = '80';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

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
  });
});
