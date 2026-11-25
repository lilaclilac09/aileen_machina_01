/**
 * Offline photo-booth simulation: four square stills, pose interval as a step,
 * same film-still grade the booth prints. No camera.
 * Run: pnpm exec tsx scripts/simulate-photoautomat.ts
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SHOT_COUNT,
  applyFilmStill,
  paintSimulationPixels,
  stripCells,
  stripSize,
} from '../lib/tools/photoautomat';

const FRAME = 480;
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width: number, height: number, rgba: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, row + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function gradedShot(shot: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(FRAME * FRAME * 4);
  paintSimulationPixels(data, FRAME, FRAME, shot, 0);
  applyFilmStill(data, FRAME, FRAME);
  return data;
}

function compose(frames: Uint8ClampedArray[]): { width: number; height: number; data: Uint8ClampedArray } {
  const { width, height } = stripSize();
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 247;
    data[i + 1] = 243;
    data[i + 2] = 234;
    data[i + 3] = 255;
  }
  const cells = stripCells();
  frames.forEach((frame, index) => {
    const cell = cells[index];
    if (!cell) return;
    for (let y = 0; y < cell.h; y += 1) {
      const sy = Math.min(FRAME - 1, Math.floor((y * FRAME) / cell.h));
      for (let x = 0; x < cell.w; x += 1) {
        const sx = Math.min(FRAME - 1, Math.floor((x * FRAME) / cell.w));
        const si = (sy * FRAME + sx) * 4;
        const di = ((cell.y + y) * width + cell.x + x) * 4;
        data[di] = frame[si];
        data[di + 1] = frame[si + 1];
        data[di + 2] = frame[si + 2];
        data[di + 3] = 255;
      }
    }
  });
  return { width, height, data };
}

const frames = Array.from({ length: SHOT_COUNT }, (_, shot) => gradedShot(shot));
const strip = compose(frames);
mkdirSync(OUT, { recursive: true });
frames.forEach((frame, shot) => {
  writeFileSync(join(OUT, `photoautomat-sim-shot-${shot + 1}.png`), encodePng(FRAME, FRAME, frame));
});
writeFileSync(join(OUT, 'photoautomat-sim-strip.png'), encodePng(strip.width, strip.height, strip.data));
console.log(`wrote ${SHOT_COUNT} square stills + strip to ${OUT}`);
