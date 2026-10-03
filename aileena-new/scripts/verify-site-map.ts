/**
 * Product-surface path stays short and matches the rooms.
 *   pnpm exec tsx scripts/verify-site-map.ts
 */
import { SURFACE_NODES } from '../lib/product-surface/graph';
import {
  SITE_PATH_CHAR_CAP,
  formatSiteSteps,
  isSiteNavQuestion,
  pathBetween,
  planSitePath,
  reviewRoomPath,
  searchSurfaces,
} from '../lib/product-surface/lookup';
import { isToolAllowed, routeToolsForQuestion } from '../lib/toolRouter';

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const dj = planSitePath('where is the dj room', '/');
assert('home → DJ is one step', dj?.length === 1 && dj[0]?.to === 'sound', dj?.map((s) => s.to).join('→'));
assert('DJ step is a real href', dj?.[0]?.href === '/sound');

const fromTools = planSitePath('where is the dj room', '/tools');
assert(
  'tools → DJ goes through doors',
  fromTools?.some((s) => s.to === 'sound') === true,
  fromTools?.map((s) => s.name).join(' → '),
);

const room = reviewRoomPath();
const roomNodes = room.map((step) => step.to);
assert(
  'review room is one path and stops at the report',
  roomNodes.join('>') === 'reviews-index>reviews-report',
  roomNodes.join('>'),
);
assert(
  'review room path does not fan out into regions',
  !room.some((step) => step.to === 'reviews-report--matrix' || step.to === 'reviews-report--funnel' || step.to === 'reviews-report--findings'),
);

const inside = pathBetween('reviews-door', 'reviews-report--matrix');
assert(
  'matrix extends that same path by one step',
  Boolean(inside && inside.length === room.length + 1 && room.every((step, i) => step.to === inside[i]?.to) && inside.at(-1)?.to === 'reviews-report--matrix'),
  inside?.map((step) => step.to).join('>'),
);

const reviews = planSitePath('where is the review matrix', '/doors');
assert(
  'reviews path names KeyShield and the matrix',
  Boolean(reviews?.some((s) => /keyshield/i.test(s.label)) && reviews?.at(-1)?.to === 'reviews-report--matrix'),
  reviews?.map((s) => s.name).join(' → '),
);
assert(
  'agent path from the door matches the room path',
  planSitePath('where is the review matrix', '/reviews')?.map((step) => step.to).join('>') === inside?.map((step) => step.to).join('>'),
);
assert('reviews path has no finding text', !formatSiteSteps(reviews ?? []).includes('request changes'));

const text = formatSiteSteps(reviews ?? []);
assert('path fits the context cap', text.length > 0 && text.length <= SITE_PATH_CHAR_CAP, String(text.length));

assert('article question is not a room lookup', isSiteNavQuestion('what does her PCB article say') === false);
assert('contact stays off the map', routeToolsForQuestion('where can I email her').route === 'hire_cv');

const nav = routeToolsForQuestion('where is the dj room', undefined, [], '/tools');
assert('nav route is site_map', nav.route === 'site_map');
assert('nav route allows no retrieval tools', nav.allowed === 'none' && !isToolAllowed(nav, 'searchArticles'));
assert('nav hint carries the path, not the graph', nav.hint.includes('https://aileena.xyz/sound') && !nav.hint.includes('SURFACE_NODES'));
assert('nav hint stays short', nav.hint.length < 900, String(nav.hint.length));

assert('graph stays a map, not a component dump', SURFACE_NODES.length < 40, String(SURFACE_NODES.length));
assert('unknown query does not invent a room', searchSurfaces('zzzzqxv9notatopic', 1).length === 0);
assert('cafe cursor stays an external door', searchSurfaces('cafe cursor', 1)[0]?.href.startsWith('https://') === true);

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`${failed.length} failed`);
  process.exit(1);
}
console.log('ok', checks.length);
