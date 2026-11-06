/** Berlin Photoautomat print: 2×2 analog sheet, local canvas only. */

export const SHOT_COUNT = 4;
export const SHEET_SIZE = 1600;
export const SHEET_MARGIN = 110;
export const SHEET_GAP = 22;
export const SWIPE_COMMIT = 0.72;

export function analogLuma(r: number, g: number, b: number): number {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  return Math.max(0, Math.min(255, (y - 128) * 1.42 + 118));
}

export type SheetCell = { x: number; y: number; size: number };

export function sheetCells(size = SHEET_SIZE): SheetCell[] {
  const inner = size - SHEET_MARGIN * 2;
  const cell = Math.floor((inner - SHEET_GAP) / 2);
  return [0, 1, 2, 3].map((i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return {
      x: SHEET_MARGIN + col * (cell + SHEET_GAP),
      y: SHEET_MARGIN + row * (cell + SHEET_GAP),
      size: cell,
    };
  });
}

export function applyAnalogBw(data: Uint8ClampedArray, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;
  const maxd = Math.hypot(cx, cy) || 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const n = ((i * 1103515245 + 12345) >>> 0) % 17 - 8;
      const fall = 1 - Math.max(0, Math.hypot(x - cx, y - cy) / maxd - 0.52) * 1.15;
      const v = Math.max(
        0,
        Math.min(255, (analogLuma(data[i], data[i + 1], data[i + 2]) + n) * fall),
      );
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }
}

export function drawMirroredVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();
}

export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const width = Math.max(1, video.videoWidth || 720);
  const height = Math.max(1, video.videoHeight || 960);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  drawMirroredVideo(ctx, video, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  applyAnalogBw(image.data, width, height);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dx: number,
  dy: number,
  dSize: number,
  sw: number,
  sh: number,
): void {
  const scale = Math.max(dSize / Math.max(sw, 1), dSize / Math.max(sh, 1));
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, 0, 0, sw, sh, dx + (dSize - dw) / 2, dy + (dSize - dh) / 2, dw, dh);
}

export function composeSheet(frames: HTMLCanvasElement[], size = SHEET_SIZE): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ebe4d6';
  ctx.fillRect(36, 36, size - 72, size - 72);
  const cells = sheetCells(size);
  frames.slice(0, SHOT_COUNT).forEach((frame, i) => {
    const cell = cells[i];
    if (!cell) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.size, cell.size);
    ctx.clip();
    coverDraw(ctx, frame, cell.x, cell.y, cell.size, frame.width, frame.height);
    ctx.restore();
    ctx.strokeStyle = 'rgba(40, 32, 24, 0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.size - 1, cell.size - 1);
  });
  ctx.fillStyle = 'rgba(40, 32, 24, 0.42)';
  ctx.font = '28px "Courier New", ui-monospace, monospace';
  ctx.fillText('PHOTOAUTOMAT  ·  BERLIN', SHEET_MARGIN, size - 48);
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
