/**
 * Berlin Photo Automat — client-side capture + 2×2 print helpers.
 * No upload. Not Photoautomat GmbH; a translation of the booth interior.
 */

export const FRAME_COUNT = 4;
export const COUNTDOWN_FROM = 3;
export const SWIPE_THRESHOLD_PX = 72;
export const CAPTURE_SIZE = 720;

export const PRINT = {
  cell: CAPTURE_SIZE,
  gutter: 28,
  margin: 48,
  paper: '#f3efe6',
} as const;

export const TIMING = {
  tickMs: 800,
  flashMs: 160,
  gapMs: 420,
} as const;

export const QA_TIMING = {
  tickMs: 40,
  flashMs: 20,
  gapMs: 20,
} as const;

export type BoothPhase = 'idle' | 'requesting' | 'live' | 'print' | 'error';

export type GridCell = { x: number; y: number; size: number };

export function fourGridSize(p: Pick<typeof PRINT, 'cell' | 'gutter' | 'margin'> = PRINT): {
  width: number;
  height: number;
} {
  const width = p.margin * 2 + p.cell * 2 + p.gutter;
  return { width, height: width };
}

export function fourGridCells(p: Pick<typeof PRINT, 'cell' | 'gutter' | 'margin'> = PRINT): GridCell[] {
  const { margin, cell, gutter } = p;
  return [0, 1, 2, 3].map((i) => ({
    x: margin + (i % 2) * (cell + gutter),
    y: margin + Math.floor(i / 2) * (cell + gutter),
    size: cell,
  }));
}

export function isSwipeCommit(dx: number, dy: number, threshold = SWIPE_THRESHOLD_PX): boolean {
  return dy > threshold || Math.abs(dx) > threshold;
}

export function applyBlackAndWhite(
  data: Uint8ClampedArray,
  opts?: { contrast?: number; grain?: number; random?: () => number },
): void {
  const contrast = opts?.contrast ?? 1.42;
  const grain = opts?.grain ?? 14;
  const random = opts?.random ?? Math.random;
  for (let i = 0; i < data.length; i += 4) {
    let y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    y = (y - 128) * contrast + 128;
    if (grain > 0) y += (random() - 0.5) * grain;
    y = y < 0 ? 0 : y > 255 ? 255 : y;
    data[i] = data[i + 1] = data[i + 2] = y;
  }
}

export function cameraErrorMessage(err: unknown): string {
  if (typeof window !== 'undefined') {
    if (!window.isSecureContext) {
      return 'Camera needs a secure page (HTTPS or localhost).';
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'This browser cannot open the camera.';
    }
  }
  const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission was denied. Allow the camera in your browser settings, then swipe the card again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera found on this device.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'The camera is already in use by another app.';
  }
  if (name === 'SecurityError') {
    return 'Camera needs a secure page (HTTPS or localhost).';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'No front camera matched. Try another camera, then swipe the card again.';
  }
  return 'Could not open the camera. Check permissions and try again.';
}

export function drawMirroredSquare(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  size: number,
  srcWidth: number,
  srcHeight: number,
): void {
  const side = Math.min(srcWidth, srcHeight) || size;
  const sx = Math.max(0, (srcWidth - side) / 2);
  const sy = Math.max(0, (srcHeight - side) / 2);
  ctx.save();
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
  ctx.restore();
}

export function paintFourGrid(
  ctx: CanvasRenderingContext2D,
  frames: Array<CanvasImageSource | null | undefined>,
  p: typeof PRINT = PRINT,
): { width: number; height: number } {
  const { width, height } = fourGridSize(p);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, width, height);
  const cells = fourGridCells(p);
  cells.forEach((cell, i) => {
    const frame = frames[i];
    if (frame) {
      ctx.drawImage(frame, cell.x, cell.y, cell.size, cell.size);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(cell.x, cell.y, cell.size, cell.size);
    }
  });
  return { width, height };
}

export type SessionTiming = { tickMs: number; flashMs: number; gapMs: number };

export function sessionTiming(fast: boolean): SessionTiming {
  return fast ? QA_TIMING : TIMING;
}
