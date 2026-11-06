/**
 * Photoautomat strip math + registry wiring + camera permission path.
 * Run: pnpm exec tsx scripts/verify-photoautomat.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  analogLuma,
  stripCells,
  stripSize,
  SHOT_COUNT,
  STRIP_WIDTH,
  SWIPE_COMMIT,
  CAMERA_CONSTRAINTS,
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
assert('strip is vertical', height > width * 3);
assert(
  'cells sit on the strip',
  cells.every((c) => c.x >= 0 && c.y >= 0 && c.x + c.w <= width && c.y + c.h <= height),
);

const [a, b, c, d] = cells;
assert('stacked x', a.x === b.x && b.x === c.x && c.x === d.x);
assert('stacked y', a.y < b.y && b.y < c.y && c.y < d.y);
assert('portrait cells', a.h > a.w);
assert('no overlap', a.y + a.h <= b.y);
assert('strip width constant', width === STRIP_WIDTH);

const tool = getToolBySlug('photoautomat');
assert('registry slug', tool?.slug === 'photoautomat');
assert('registry route', tool?.href === '/tools/photoautomat');
assert('no server live url', tool?.liveUrl === '/tools/photoautomat');
assert('EN item', t.EN.tools.items.photoautomat.title === 'Photoautomat');
assert('DE item', t.DE.tools.items.photoautomat.title === 'Photoautomat');
assert('EN allow copy', t.EN.tools.photoAutomat.allow === 'allow camera');
assert('DE allow copy', t.DE.tools.photoAutomat.allow === 'kamera an');
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
assert('enter tap exists', page.includes('foto-enter'));
assert('allow tap exists', page.includes('foto-allow'));
assert('EN enter copy', t.EN.tools.photoAutomat.enter === 'enter');
assert('no upload fetch of frames', !/fetch\([^\)]*sheet|FormData|multipart/.test(page));
assert('download stays local', page.includes('downloadCanvas'));

const lib = readFileSync(join(root, 'lib/tools/photoautomat.ts'), 'utf8');
assert('lib requests camera', lib.includes('getUserMedia'));
assert('playsinline arm', lib.includes('webkit-playsinline'));

console.log('photoautomat ok');
