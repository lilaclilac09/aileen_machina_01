/**
 * Named Campuses tool wiring: one hub card, original map assets, no extra arcade items.
 * Run: pnpm verify:named-campuses
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getToolBySlug, TOOL_DEFINITIONS } from '../lib/tools/registry';
import { t } from '../lib/translations';
import { STATIC_PATHS } from '../lib/seo';
import { chromeBackForPath } from '../lib/doorsNav';

function assert(name: string, ok: boolean, detail = '') {
  if (!ok) throw new Error(`FAIL ${name}${detail ? ` ${detail}` : ''}`);
  console.log(`PASS ${name}${detail ? ` ${detail}` : ''}`);
}

const root = join(__dirname, '..');
const publicDir = join(root, 'public/tools/named-campuses');
const assets = [
  'fig-map-icons.svg',
  'fig-map-icons.png',
  'lingang-lianggang.png',
  'ulanqab-ali-blvd.png',
  'singapore-jurong.png',
  'map-icon-key.md',
  'SOURCES.md',
];

for (const file of assets) {
  assert(`asset ${file}`, existsSync(join(publicDir, file)));
}

assert('page exists', existsSync(join(root, 'app/tools/named-campuses/page.tsx')));
assert('component exists', existsSync(join(root, 'components/tools/NamedCampusesTool.tsx')));

const tool = getToolBySlug('named-campuses');
assert('registry slug', tool?.slug === 'named-campuses');
assert('registry route', tool?.href === '/tools/named-campuses');
assert('live url is the same page', tool?.liveUrl === '/tools/named-campuses');
assert('screenshot is the original png', tool?.screenshot === '/tools/named-campuses/fig-map-icons.png');
assert('status useful', tool?.status === 'useful');
assert('tier utility', tool?.tier === 'utility');
assert('no demo video (the plate is the demo)', !tool?.demoVideo);

const mapSlugs = TOOL_DEFINITIONS.filter((row) =>
  /named-campus|lingang|ulanqab|jurong|campus-map|neocloud-map/i.test(row.slug),
).map((row) => row.slug);
assert('exactly one arcade map slug', mapSlugs.length === 1 && mapSlugs[0] === 'named-campuses', mapSlugs.join(','));

assert('EN hub title', t.EN.tools.items['named-campuses'].title === 'Named Campuses');
assert('DE hub title stays Named Campuses', t.DE.tools.items['named-campuses'].title === 'Named Campuses');
assert('EN page copy matches hub', t.EN.tools.namedCampuses.heading === t.EN.tools.items['named-campuses'].title);
assert(
  'EN/DE namedCampuses keys match',
  Object.keys(t.EN.tools.namedCampuses).join() === Object.keys(t.DE.tools.namedCampuses).join(),
);

const page = readFileSync(join(root, 'components/tools/NamedCampusesTool.tsx'), 'utf8');
assert('page uses original svg', page.includes('/tools/named-campuses/fig-map-icons.svg'));
assert('page keeps png fallback', page.includes('/tools/named-campuses/fig-map-icons.png'));
assert('three stills on the same page', STILL_COUNT(page) === 3);
assert('no second arcade invent', !/cesium|mapbox|deck\.gl|globe/i.test(page));
assert('credits map tweet', t.EN.tools.namedCampuses.mapSourceHref.includes('2089664755405578418'));
assert('credits stills tweet', t.EN.tools.namedCampuses.stillsSourceHref.includes('2089695518163091729'));
assert('seo path', STATIC_PATHS.includes('/tools/named-campuses'));
assert('doors back is tools', chromeBackForPath('/tools/named-campuses')?.href === '/tools');

const sources = readFileSync(join(publicDir, 'SOURCES.md'), 'utf8');
assert('sources name the map tweet', sources.includes('2089664755405578418'));
assert('sources name the stills tweet', sources.includes('2089695518163091729'));
assert('sources say no 3D location maps', /True 3D location maps[\s\S]*NONE found/i.test(sources));

console.log('named-campuses ok');

function STILL_COUNT(src: string): number {
  return [
    'lingang-lianggang.png',
    'ulanqab-ali-blvd.png',
    'singapore-jurong.png',
  ].filter((name) => src.includes(name)).length;
}
