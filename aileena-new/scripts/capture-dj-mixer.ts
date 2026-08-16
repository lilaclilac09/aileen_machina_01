#!/usr/bin/env tsx
/** Capture mixer states at 390×844 + desktop, with interaction video. */

import { chromium, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000';
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';
const PREFIX = process.env.CAPTURE_PREFIX ?? 'qa_';

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
    const t = i / sampleRate;
    const env = 0.2 + 0.75 * Math.abs(Math.sin(t * Math.PI * 3));
    const s = Math.sin(2 * Math.PI * freq * t) * env;
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((n) => n.remove());
  });
}

async function shot(page: Page, name: string, target?: string) {
  await dismissOverlay(page);
  if (target) {
    await page.getByTestId(target).scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: join(OUT, name) });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/sound`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('dj-engine-status').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(500);
  await shot(page, `${PREFIX}01_initial_mixer.png`, 'dj-engine-status');
  await shot(page, 'mobile-sound-initial.png', 'dj-set');

  await page.getByTestId('dj-upload-a').setInputFiles({
    name: 'desk-a.wav',
    mimeType: 'audio/wav',
    buffer: pcmWav(6, 220),
  });
  await page.getByTestId('dj-upload-b').setInputFiles({
    name: 'desk-b.wav',
    mimeType: 'audio/wav',
    buffer: pcmWav(6, 330),
  });
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="dj-engine-status"]');
    return el?.getAttribute('data-deck-a') === 'true' && el?.getAttribute('data-deck-b') === 'true';
  });
  await page.waitForTimeout(300);
  await shot(page, `${PREFIX}02_decks_loaded.png`, 'dj-waveform-a');
  await shot(page, 'mobile-deck-loaded.png', 'dj-waveform-a');

  await page.getByTestId('dj-engine-status').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.getByTestId('dj-play-a').click();
  await page.getByTestId('dj-play-b').click();
  await page.getByTestId('dj-play-a').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await shot(page, `${PREFIX}03_both_playing.png`, 'dj-play-a');

  await page.getByTestId('dj-xfade').evaluate((el) => {
    const input = el as HTMLInputElement;
    input.value = '100';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(250);
  await shot(page, `${PREFIX}04_crossfader_moved.png`, 'dj-xfade');

  await page.getByTestId('dj-record').click();
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="dj-engine-status"]')?.getAttribute('data-recording') === 'true',
  );
  await page.waitForTimeout(1200);
  await shot(page, `${PREFIX}05_recording_active.png`, 'dj-record');
  await shot(page, 'recording-active.png', 'dj-record');

  await page.getByTestId('dj-record').click();
  await page.getByTestId('dj-mix-receipt').waitFor({ timeout: 10_000 });
  await shot(page, `${PREFIX}06_export_ready.png`, 'dj-mix-receipt');
  await shot(page, 'mobile-export-ready.png', 'dj-mix-receipt');
  await shot(page, 'export-ready.png', 'dj-mix-receipt');

  const video = page.video();
  await page.close();
  if (video) {
    await video.saveAs(join(OUT, `${PREFIX}mixer_mobile_walkthrough.webm`));
  }
  await context.close();

  const deskCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desk = await deskCtx.newPage();
  try {
    await desk.goto(`${BASE}/sound`, { waitUntil: 'domcontentloaded' });
    await desk.getByTestId('dj-engine-status').waitFor();
    await desk.getByTestId('dj-upload-a').setInputFiles({
      name: 'desk-a.wav',
      mimeType: 'audio/wav',
      buffer: pcmWav(6, 220),
    });
    await desk.getByTestId('dj-upload-b').setInputFiles({
      name: 'desk-b.wav',
      mimeType: 'audio/wav',
      buffer: pcmWav(6, 330),
    });
    await desk.waitForFunction(() => {
      const el = document.querySelector('[data-testid="dj-engine-status"]');
      return el?.getAttribute('data-deck-a') === 'true' && el?.getAttribute('data-deck-b') === 'true';
    }, { timeout: 20_000 });
    await desk.getByTestId('dj-play-a').click();
    await desk.getByTestId('dj-play-b').click();
    await desk.waitForTimeout(500);
    await shot(desk, `${PREFIX}07_desktop_playing.png`, 'dj-engine-status');
    await shot(desk, 'sound-initial.png', 'dj-set');
    await shot(desk, 'both-decks-playing.png', 'dj-engine-status');
  } catch (err) {
    console.warn('desktop capture skipped', err);
  }
  await deskCtx.close();
  await browser.close();
  console.log(JSON.stringify({ ok: true, out: OUT }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
