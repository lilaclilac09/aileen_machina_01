/** Berlin Photoautomat print: vertical four-strip, local canvas only. */

export const SHOT_COUNT = 4;
export const STRIP_WIDTH = 640;
export const STRIP_MARGIN = 32;
export const STRIP_GAP = 10;
export const STRIP_FOOTER = 48;
export const FRAME_RATIO = 1.18;
export const SWIPE_COMMIT = 0.72;

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

export function applyAnalogBw(data: Uint8ClampedArray, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;
  const maxd = Math.hypot(cx, cy) || 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const n = ((i * 1103515245 + 12345) >>> 0) % 9 - 4;
      const fall = 1 - Math.max(0, Math.hypot(x - cx, y - cy) / maxd - 0.68) * 0.55;
      const v = Math.max(
        0,
        Math.min(255, (analogLuma(data[i], data[i + 1], data[i + 2]) + n) * fall),
      );
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }
}

export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const vw = Math.max(1, video.videoWidth || 720);
  const vh = Math.max(1, video.videoHeight || 960);
  let cw = vw;
  let ch = Math.round(vw * FRAME_RATIO);
  if (ch > vh) {
    ch = vh;
    cw = Math.round(vh / FRAME_RATIO);
  }
  const sx = Math.max(0, (vw - cw) / 2);
  const sy = Math.max(0, (vh - ch) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.save();
  ctx.translate(cw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, cw, ch, 0, 0, cw, ch);
  ctx.restore();
  const image = ctx.getImageData(0, 0, cw, ch);
  applyAnalogBw(image.data, cw, ch);
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
