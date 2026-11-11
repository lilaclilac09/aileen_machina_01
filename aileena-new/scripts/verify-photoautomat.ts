/**
 * Photoautomat strip math + registry wiring + camera permission path.
 * Run: pnpm exec tsx scripts/verify-photoautomat.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  analogLuma,
  applyFilmStill,
  paintSimulationPixels,
  stripCells,
  stripSize,
  SHOT_COUNT,
  STRIP_WIDTH,
  SWIPE_COMMIT,
  CAMERA_CONSTRAINTS,
  COUNT_BEAT_MS,
  FLASH_MS,
  POSE_GAP_MS,
  DEVELOP_MS,
} from '../lib/tools/photoautomat';
import { getToolBySlug } from '../lib/tools/registry';
import { t } from '../lib/translations';
import { chromeBackForPath, chromeInkForPath } from '../lib/doorsNav';

function assert(name: string, ok: boolean, detail = '') {
  if (!ok) throw new Error(`FAIL ${name}${detail ? ` ${detail}` : ''}`);
  console.log(`PASS ${name}`);
}

const root = join(__dirname, '..');

assert('four shots', SHOT_COUNT === 4);
assert('swipe commits past 70%', SWIPE_COMMIT > 0.7);
assert('white is bright', analogLuma(255, 255, 255) > 230);
assert('black stays dark', analogLuma(0, 0, 0) < 30);
assert('green weighs more than blue', analogLuma(0, 255, 0) > analogLuma(0, 0, 255));
assert('camera fallbacks', CAMERA_CONSTRAINTS.length >= 3);
assert('last constraint is any video', CAMERA_CONSTRAINTS.at(-1)?.video === true);

const { width, height } = stripSize();
const cells = stripCells();
assert('four cells', cells.length === 4);
assert('strip is vertical', height > width * 2.2);
assert(
  'cells sit on the strip',
  cells.every((c) => c.x >= 0 && c.y >= 0 && c.x + c.w <= width && c.y + c.h <= height),
);

const [a, b, c, d] = cells;
assert('stacked x', a.x === b.x && b.x === c.x && c.x === d.x);
assert('stacked y', a.y < b.y && b.y < c.y && c.y < d.y);
assert('square cells match the glass', Math.abs(a.h - a.w) <= 1);
assert('no overlap', a.y + a.h <= b.y);
assert('strip width constant', width === STRIP_WIDTH);
assert('pose gap is a real interval', POSE_GAP_MS >= 1000);
assert('countdown is faster than the pose gap', COUNT_BEAT_MS < POSE_GAP_MS);
assert('four beats of gap stay inside the booth timeout', SHOT_COUNT * (COUNT_BEAT_MS * 3 + FLASH_MS + POSE_GAP_MS) + DEVELOP_MS < 22000);

const night = new Uint8ClampedArray(16 * 4);
const warm = new Uint8ClampedArray(16 * 4);
for (let i = 0; i < 16; i += 1) {
  night[i * 4] = 8;
  night[i * 4 + 1] = 12;
  night[i * 4 + 2] = 22;
  night[i * 4 + 3] = 255;
  warm[i * 4] = 240;
  warm[i * 4 + 1] = 200;
  warm[i * 4 + 2] = 140;
  warm[i * 4 + 3] = 255;
}
applyFilmStill(night, 4, 4);
applyFilmStill(warm, 4, 4);
const nightR = night[0];
const nightB = night[2];
const warmR = warm[0];
const warmB = warm[2];
assert('shadows stay cool', nightB > nightR + 6, `r=${nightR} b=${nightB}`);
assert('practicals stay warm', warmR > warmB + 6, `r=${warmR} b=${warmB}`);
assert('grade keeps color', nightR !== night[1] || warmR !== warm[1]);

const left = new Uint8ClampedArray(48 * 48 * 4);
const right = new Uint8ClampedArray(48 * 48 * 4);
paintSimulationPixels(left, 48, 48, 0, 0);
paintSimulationPixels(right, 48, 48, 3, 0);
let moved = 0;
for (let i = 0; i < left.length; i += 4) {
  if (left[i] !== right[i]) moved += 1;
}
assert('later shot steps the figure', moved > 20, `moved=${moved}`);
assert('simulation frame is square', left.length === 48 * 48 * 4);

const tool = getToolBySlug('photoautomat');
assert('registry slug', tool?.slug === 'photoautomat');
assert('registry route', tool?.href === '/tools/photoautomat');
assert('no server live url', tool?.liveUrl === '/tools/photoautomat');
assert('EN item', t.EN.tools.items.photoautomat.title === 'Photoautomat');
assert('DE item', t.DE.tools.items.photoautomat.title === 'Photoautomat');
assert('EN allow copy', t.EN.tools.photoAutomat.allow === 'allow camera');
assert('DE allow copy', t.DE.tools.photoAutomat.allow === 'kamera an');
assert('EN simulate', t.EN.tools.photoAutomat.simulate === 'simulate');
assert('DE simulate', t.DE.tools.photoAutomat.simulate === 'simulation');
assert('EN page copy', t.EN.tools.photoAutomat.download === 'take strip');
assert('DE page copy', t.DE.tools.photoAutomat.blocked === 'kamera zu');
assert('no 2x2 in EN body', !t.EN.tools.items.photoautomat.body.includes('2×2'));
assert('doors back', chromeBackForPath('/tools/photoautomat')?.href === '/tools');
assert('dark chrome', chromeInkForPath('/tools/photoautomat') === false);

assert('interior asset', existsSync(join(root, 'public/tools/photoautomat/interior.jpg')));
assert('street asset', existsSync(join(root, 'public/tools/photoautomat/kotti-street.jpg')));
assert('page exists', existsSync(join(root, 'app/tools/photoautomat/page.tsx')));

const page = readFileSync(join(root, 'components/tools/PhotoautomatTool.tsx'), 'utf8');
assert('uses live camera', page.includes('requestUserCamera'));
assert('allow tap exists', page.includes('foto-allow'));
assert('simulate tap exists', page.includes('foto-simulate'));
assert('film still grade', page.includes('applyFilmStill'));
assert('pose interval constant', page.includes('POSE_GAP_MS'));
assert('no upload fetch of frames', !/fetch\([^\)]*sheet|FormData|multipart/.test(page));
assert('download stays local', page.includes('downloadCanvas'));

const lib = readFileSync(join(root, 'lib/tools/photoautomat.ts'), 'utf8');
assert('lib requests camera', lib.includes('getUserMedia'));
assert('playsinline arm', lib.includes('webkit-playsinline'));
assert('lib grades a film still', lib.includes('applyFilmStill'));
assert('square glass ratio', lib.includes('FRAME_RATIO = 1;'));

console.log('photoautomat ok');
