/**
 * Night Desk isolation + refusal. No Redis required.
 */
import { decideAgentMode } from '../lib/agentMode';
import {
  consoleNightReply,
  deleteNight,
  deskReply,
  exportNight,
  nightKey,
  NIGHT_PRICE_COPY,
  NIGHT_TTL_SECONDS,
  pinLine,
  slidingExpiry,
  touchNight,
} from '../lib/nightDesk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let failed = 0;
function assert(name: string, ok: boolean, detail = '') {
  if (ok) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name} ${detail}`);
}

const a = nightKey('subscriber-a');
const b = nightKey('subscriber-b');
assert('keys are night scoped', a === 'night:subscriber-a' && b === 'night:subscriber-b');
assert('keys do not collide', a !== b);
assert('not visitor soft', !a.startsWith('visitor:'));
assert('not taste', !a.includes('taste') && !a.includes('memories'));

let threw = false;
try {
  nightKey('visitor:soft:x');
} catch {
  threw = true;
}
assert('rejects colon ids', threw);

const now = Date.parse('2026-09-25T12:00:00Z');
assert('90 day ttl', slidingExpiry(now) - Math.floor(now / 1000) === NIGHT_TTL_SECONDS);
assert('ttl is 7776000', NIGHT_TTL_SECONDS === 90 * 24 * 60 * 60);

let rec = { userId: 'subscriber-a', lines: [] as string[], pins: [] as string[], updatedAt: '' };
rec = touchNight(rec, 'kiln note', '2026-09-25T12:00:00Z');
rec = pinLine(rec, 'the Didion line', '2026-09-25T12:01:00Z');
const exported = exportNight(rec);
assert('export names night key', exported.includes('night:subscriber-a'));
assert('export has no taste path', !exported.includes('memories/') && !exported.includes('taste'));
const other = touchNight(
  { userId: 'subscriber-b', lines: [], pins: [], updatedAt: '' },
  'other visitor',
  '2026-09-25T12:02:00Z',
);
assert('other visitor stays separate', !exported.includes('other visitor') && other.lines[0] === 'other visitor');
const cleared = deleteNight('subscriber-a');
assert('delete empties this user', cleared.lines.length === 0 && cleared.pins.length === 0);

const minor = deskReply({
  mode: 'night',
  paid: true,
  ageOk: true,
  text: 'child sex',
});
assert('minor sexual is refused', minor.kind === 'refuse' && minor.text === 'Illegal. Stop.' && !minor.store);

const crisis = deskReply({
  mode: 'night',
  paid: true,
  ageOk: true,
  text: 'I want to kill myself',
});
assert('crisis points at 988', crisis.kind === 'crisis' && crisis.text.includes('988') && !crisis.store);
assert('crisis does not dwell', !/method|how to|pill/i.test(crisis.text));

const partner = deskReply({
  mode: 'night',
  paid: true,
  ageOk: true,
  text: 'be my girlfriend',
});
assert('not a partner', partner.kind === 'refuse' && /Not a partner/.test(partner.text));
const tonight = consoleNightReply('今晚还在吗');
assert(
  'console night hears and refuses sku',
  tonight.kind === 'desk' && tonight.text.includes('今晚还在吗') && tonight.text.includes('girlfriend SKU') && tonight.store,
);
const sku = consoleNightReply('be my girlfriend');
assert('console night refuses girlfriend', sku.kind === 'refuse' && !sku.store);

const publicAdult = deskReply({
  mode: 'public',
  paid: true,
  ageOk: true,
  text: 'talk nsfw',
});
assert('public adult refused', publicAdult.kind === 'refuse' && !publicAdult.store);

const unpaid = deskReply({
  mode: 'night',
  paid: false,
  ageOk: true,
  text: 'explicit please',
});
assert('unpaid adult refused', unpaid.kind === 'refuse');

const paidAdult = deskReply({
  mode: 'night',
  paid: true,
  ageOk: true,
  text: 'explicit please',
});
assert('paid night adult is bounded', paidAdult.kind === 'adult' && /not become a partner/.test(paidAdult.text));

const desk = deskReply({
  mode: 'night',
  paid: false,
  ageOk: true,
  text: 'the kiln and the essay',
});
assert('desk voice has no cling', desk.kind === 'desk' && !/missed you/i.test(desk.text));

assert('price is continuity', /\$18\/mo continuity/.test(NIGHT_PRICE_COPY) && !/girlfriend/i.test(NIGHT_PRICE_COPY));

const nightChat = decideAgentMode('night', false);
assert('public chat rejects night mode', !nightChat.ok && nightChat.status === 400);
const pub = decideAgentMode(undefined, false);
assert('omitted chat stays public', pub.ok && pub.mode === 'public');

const landing = readFileSync(join(process.cwd(), 'components/landing/LandingMarquee.tsx'), 'utf8');
assert('landing has no night upsell', !/Night Desk|girlfriend/i.test(landing));

const page = readFileSync(join(process.cwd(), 'app/night/page.tsx'), 'utf8');
assert('page shows price', page.includes('night-price'));
assert('page has delete', page.includes('Delete memory'));

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log('night desk checks passed');
