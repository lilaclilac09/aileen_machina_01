/**
 * Photoautomat sheet math + registry wiring.
 * Run: pnpm exec tsx scripts/verify-photoautomat.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { analogLuma, sheetCells, SHOT_COUNT, SHEET_SIZE, SWIPE_COMMIT } from '../lib/tools/photoautomat';
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

const cells = sheetCells();
assert('four cells', cells.length === 4);
assert(
  'cells sit on the sheet',
  cells.every((c) => c.x >= 0 && c.y >= 0 && c.x + c.size <= SHEET_SIZE && c.y + c.size <= SHEET_SIZE),
);

const [a, b, c, d] = cells;
assert('2×2 columns', a.x < b.x && c.x < d.x && a.x === c.x && b.x === d.x);
assert('2×2 rows', a.y < c.y && b.y < d.y && a.y === b.y && c.y === d.y);
assert('no overlap', a.x + a.size <= b.x && a.y + a.size <= c.y);

const tool = getToolBySlug('photoautomat');
assert('registry slug', tool?.slug === 'photoautomat');
assert('registry route', tool?.href === '/tools/photoautomat');
assert('no server live url', tool?.liveUrl === '/tools/photoautomat');
assert('EN item', t.EN.tools.items.photoautomat.title === 'Photoautomat');
assert('DE item', t.DE.tools.items.photoautomat.title === 'Photoautomat');
assert('EN page copy', t.EN.tools.photoAutomat.download === 'take sheet');
assert('DE page copy', t.DE.tools.photoAutomat.blocked === 'kamera zu');
assert('doors back', chromeBackForPath('/tools/photoautomat')?.href === '/tools');
assert('dark chrome', chromeInkForPath('/tools/photoautomat') === false);

assert('interior asset', existsSync(join(root, 'public/tools/photoautomat/interior.jpg')));
assert('street asset', existsSync(join(root, 'public/tools/photoautomat/kotti-street.jpg')));
assert('page exists', existsSync(join(root, 'app/tools/photoautomat/page.tsx')));

const page = readFileSync(join(root, 'components/tools/PhotoautomatTool.tsx'), 'utf8');
assert('uses live camera', page.includes('getUserMedia'));
assert('no upload fetch of frames', !/fetch\([^\)]*sheet|FormData|multipart/.test(page));
assert('download stays local', page.includes('downloadCanvas'));

console.log('photoautomat ok');
