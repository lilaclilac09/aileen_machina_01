/**
 * Photo Automat — print grid, B&W, swipe, camera errors.
 * No camera, no network.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FRAME_COUNT,
  PRINT,
  applyBlackAndWhite,
  cameraErrorMessage,
  fourGridCells,
  fourGridSize,
  isSwipeCommit,
} from '../lib/tools/photoAutomat';

function assert(name: string, ok: boolean, detail = ''): void {
  if (!ok) throw new Error(`FAIL ${name}${detail ? ` ${detail}` : ''}`);
  console.log(`PASS ${name}`);
}

const size = fourGridSize();
assert('sheet is square', size.width === size.height, `${size.width}x${size.height}`);
assert(
  'sheet fits 2×2 cells + gutter + paper margin',
  size.width === PRINT.margin * 2 + PRINT.cell * 2 + PRINT.gutter,
);

const cells = fourGridCells();
assert('four cells', cells.length === FRAME_COUNT && FRAME_COUNT === 4);
assert(
  'cells are squares',
  cells.every((c) => c.size === PRINT.cell),
);

const [a, b, c, d] = cells;
assert('top-left origin', a.x === PRINT.margin && a.y === PRINT.margin);
assert('top-right is to the right with gutter', b.x === a.x + a.size + PRINT.gutter && b.y === a.y);
assert('bottom-left is below with gutter', c.x === a.x && c.y === a.y + a.size + PRINT.gutter);
assert('bottom-right closes the grid', d.x === b.x && d.y === c.y);

const overlap =
  a.x + a.size + PRINT.gutter === b.x && a.y + a.size + PRINT.gutter === c.y;
assert('gutter sits between cells (no overlap)', overlap);

const red = new Uint8ClampedArray([255, 0, 0, 255]);
applyBlackAndWhite(red, { contrast: 1, grain: 0 });
assert('red becomes grey', red[0] === red[1] && red[1] === red[2]);
assert('alpha kept', red[3] === 255);
assert('red luma ~76', red[0] > 60 && red[0] < 90, String(red[0]));

const bright = new Uint8ClampedArray([200, 200, 200, 255]);
applyBlackAndWhite(bright, { contrast: 2, grain: 0 });
assert('contrast pushes light toward white', bright[0] === 255);

const dark = new Uint8ClampedArray([50, 50, 50, 255]);
applyBlackAndWhite(dark, { contrast: 2, grain: 0 });
assert('contrast pushes dark toward black', dark[0] === 0);

assert('swipe down commits', isSwipeCommit(0, 80));
assert('swipe sideways commits', isSwipeCommit(80, 0));
assert('tiny drag does not commit', !isSwipeCommit(10, 10));

assert(
  'denied camera is plain English',
  cameraErrorMessage({ name: 'NotAllowedError' }).includes('denied'),
);
assert(
  'missing camera is plain English',
  cameraErrorMessage({ name: 'NotFoundError' }).includes('No camera'),
);

const booth = readFileSync(join('components/tools/PhotoAutomatBooth.tsx'), 'utf8');
assert('booth asks for the user-facing camera', booth.includes("facingMode: 'user'"));
assert('booth does not upload photos', !/fetch\(|FormData|xmlhttprequest/i.test(booth));
assert('booth UI is English', !/刷卡|四宫格|拍照/.test(booth));
assert('no Photoautomat GmbH wordmark', !/Photoautomat GmbH|Groupe Photo-Me|Photoautomat®/i.test(booth));
assert('title is spaced Photo Automat, not the company wordmark', /Photo Automat/.test(booth) && !/>PHOTOAUTOMAT</.test(booth));

const registry = readFileSync(join('lib/tools/registry.ts'), 'utf8');
assert('registry slug photo-automat', /slug: 'photo-automat'/.test(registry));
assert('live URL is in-site', /liveUrl: '\/tools\/photo-automat'/.test(registry));

const page = readFileSync(join('app/tools/photo-automat/page.tsx'), 'utf8');
assert('route exists', /PhotoAutomatBooth/.test(page) && /toolMetadata\('photo-automat'\)/.test(page));

console.log('verify-photo-automat: ok');
