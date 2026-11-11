/** Berlin Photoautomat print: vertical four-strip, local canvas only. */

export const SHOT_COUNT = 4;
export const STRIP_WIDTH = 640;
export const STRIP_MARGIN = 32;
export const STRIP_GAP = 10;
export const STRIP_FOOTER = 48;
/** Square, matching the booth glass. h / w. */
export const FRAME_RATIO = 1;
export const SWIPE_COMMIT = 0.72;
/** Countdown beat, flash, then a pose gap before the next exposure. */
export const COUNT_BEAT_MS = 700;
export const FLASH_MS = 90;
export const POSE_GAP_MS = 1200;
export const DEVELOP_MS = 1400;
const MAX_FRAME = 960;

export const CAMERA_CONSTRAINTS: MediaStreamConstraints[] = [
  { audio: false, video: { facingMode: 'user' } },
  { audio: false, video: { facingMode: { ideal: 'user' } } },
  { audio: false, video: true },
];

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = globalThis.setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        globalThis.clearTimeout(id);
        resolve(value);
      },
      (err) => {
        globalThis.clearTimeout(id);
        reject(err);
      },
    );
  });
}

export async function requestUserCamera(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('no camera');
  }
  let last: unknown;
  for (const constraints of CAMERA_CONSTRAINTS) {
    try {
      return await withTimeout(navigator.mediaDevices.getUserMedia(constraints), 3500, 'camera timeout');
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error('camera blocked');
}

export async function attachCameraStream(
  video: HTMLVideoElement,
  stream: MediaStream,
): Promise<void> {
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.srcObject = stream;
  try {
    await video.play();
  } catch {
    await new Promise<void>((resolve) => {
      const kick = () => {
        void video.play().finally(() => resolve());
      };
      video.addEventListener('loadedmetadata', kick, { once: true });
      window.setTimeout(() => resolve(), 900);
    });
  }
}

export function analogLuma(r: number, g: number, b: number): number {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  return Math.max(0, Math.min(255, (y - 128) * 1.18 + 128));
}

export type StripCell = { x: number; y: number; w: number; h: number };

export function stripCells(width = STRIP_WIDTH): StripCell[] {
  const w = width - STRIP_MARGIN * 2;
  const h = Math.round(w * FRAME_RATIO);
  return [0, 1, 2, 3].map((i) => ({
    x: STRIP_MARGIN,
    y: STRIP_MARGIN + i * (h + STRIP_GAP),
    w,
    h,
  }));
}

export function stripSize(width = STRIP_WIDTH): { width: number; height: number } {
  const cells = stripCells(width);
  const last = cells[SHOT_COUNT - 1];
  return {
    width,
    height: last.y + last.h + STRIP_MARGIN + STRIP_FOOTER,
  };
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Night film-still grade: lifted blacks, cool shadows, warm practicals, grain, vignette.
 * Color stays — this is not the old black-and-white booth.
 */
export function applyFilmStill(data: Uint8ClampedArray, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;
  const maxd = Math.hypot(cx, cy) || 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;
      r = Math.min(1, (r * 0.9 + 0.045) * (1.04 - 0.1 * r));
      g = Math.min(1, (g * 0.9 + 0.045) * (1.04 - 0.1 * g));
      b = Math.min(1, (b * 0.9 + 0.05) * (1.04 - 0.1 * b));
      const yL = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = 0.7;
      r = yL + (r - yL) * sat;
      g = yL + (g - yL) * sat;
      b = yL + (b - yL) * sat;
      const shadow = Math.max(0, Math.min(1, (0.55 - yL) / 0.55));
      const high = Math.max(0, Math.min(1, (yL - 0.42) / 0.58));
      r += high * 0.08 - shadow * 0.035;
      g += high * 0.025 + shadow * 0.012;
      b += shadow * 0.1 - high * 0.045;
      let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
      h = (h ^ (h >>> 13)) >>> 0;
      h = Math.imul(h, 1274126177);
      const n = ((((h >>> 0) % 31) - 15) / 255);
      r += n;
      g += n * 0.85;
      b += n * 0.7;
      const fall = 1 - Math.max(0, Math.hypot(x - cx, y - cy) / maxd - 0.5) * 0.55;
      data[i] = clampByte(r * fall * 255);
      data[i + 1] = clampByte(g * fall * 255);
      data[i + 2] = clampByte(b * fall * 255);
    }
  }
}

/** Center crop that matches the square glass, in source pixels. */
export function squareCrop(vw: number, vh: number): { sx: number; sy: number; sw: number; sh: number } {
  let cw = vw;
  let ch = Math.round(vw * FRAME_RATIO);
  if (ch > vh) {
    ch = vh;
    cw = Math.max(1, Math.round(vh / FRAME_RATIO));
  }
  return {
    sx: Math.max(0, (vw - cw) / 2),
    sy: Math.max(0, (vh - ch) / 2),
    sw: Math.max(1, cw),
    sh: Math.max(1, ch),
  };
}

/**
 * Stand-in night alley for the simulate path. The figure steps across the four shots
 * so the interval and the upright square frame are visible without a camera.
 */
export function paintSimulationPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  shot: number,
  sway = 0,
): void {
  const figureX = width * (0.28 + shot * 0.1 + sway * 0.035);
  const headR = width * 0.045;
  const lampX = width * 0.78;
  const lampY = height * 0.34;
  for (let y = 0; y < height; y += 1) {
    const ny = y / height;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const nx = x / width;
      let hsh = Math.imul(x, 196613) + Math.imul(y, 5039);
      hsh = (hsh ^ (hsh >>> 11)) >>> 0;
      const grit = (hsh % 23) - 11;
      let r = 10 + ny * 22 + grit * 0.15;
      let g = 16 + ny * 20 + grit * 0.12;
      let b = 34 + (1 - ny) * 18 + grit * 0.08;
      if (ny > 0.72) {
        r = 22 + grit * 0.2;
        g = 24 + grit * 0.15;
        b = 28;
      }
      if (nx < 0.34 && ny > 0.08 && ny < 0.84) {
        r = 176 + grit * 1.4;
        g = 170 + grit;
        b = 156 + grit * 0.6;
      }
      const lampD = Math.hypot(x - lampX, y - lampY) / width;
      if (nx > 0.7 && nx < 0.9 && ny > 0.22 && ny < 0.46) {
        r = 228 + grit;
        g = 186;
        b = 120;
      } else if (lampD < 0.28) {
        const glow = (1 - lampD / 0.28) * 0.55;
        r += 90 * glow;
        g += 50 * glow;
        b += 8 * glow;
      }
      const dx = x - figureX;
      const headDy = y - height * 0.48;
      const inHead = dx * dx + headDy * headDy < headR * headR;
      const inBody = Math.abs(dx) < width * 0.055 && y > height * 0.52 && y < height * 0.8;
      if (inHead) {
        r = 198 + grit * 0.4;
        g = 160;
        b = 130;
      } else if (inBody) {
        r = 48 + grit * 0.3;
        g = 52;
        b = 62;
      }
      data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      data[i + 3] = 255;
    }
  }
}

export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const vw = Math.max(1, video.videoWidth || 720);
  const vh = Math.max(1, video.videoHeight || 720);
  const crop = squareCrop(vw, vh);
  const scale = Math.min(1, MAX_FRAME / crop.sw);
  const cw = Math.max(1, Math.round(crop.sw * scale));
  const ch = Math.max(1, Math.round(crop.sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.save();
  ctx.translate(cw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, cw, ch);
  ctx.restore();
  const image = ctx.getImageData(0, 0, cw, ch);
  applyFilmStill(image.data, cw, ch);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Graded square still for one simulate shot. `sway` is the countdown lean, -1..1. */
export function simulationFrame(shot: number, sway = 0, size = 720): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = size;
  const height = Math.max(1, Math.round(size * FRAME_RATIO));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const image = ctx.createImageData(width, height);
  paintSimulationPixels(image.data, width, height, shot, sway);
  applyFilmStill(image.data, width, height);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sw: number,
  sh: number,
): void {
  const scale = Math.max(dw / Math.max(sw, 1), dh / Math.max(sh, 1));
  const tw = sw * scale;
  const th = sh * scale;
  ctx.drawImage(source, 0, 0, sw, sh, dx + (dw - tw) / 2, dy + (dh - th) / 2, tw, th);
}

export function composeSheet(frames: HTMLCanvasElement[]): HTMLCanvasElement {
  const { width, height } = stripSize();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, width, height);
  const cells = stripCells();
  frames.slice(0, SHOT_COUNT).forEach((frame, i) => {
    const cell = cells[i];
    if (!cell) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();
    coverDraw(ctx, frame, cell.x, cell.y, cell.w, cell.h, frame.width, frame.height);
    ctx.restore();
    ctx.strokeStyle = 'rgba(40, 32, 24, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.w - 1, cell.h - 1);
  });
  ctx.fillStyle = 'rgba(40, 32, 24, 0.42)';
  ctx.font = '22px "Courier New", ui-monospace, monospace';
  ctx.fillText('PHOTOAUTOMAT  ·  BERLIN', STRIP_MARGIN, height - 22);
  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('sheet failed'));
        return;
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1500);
      resolve();
    }, 'image/png');
  });
}
