/**
 * poseFromMetrics — Duo layout table. Run: pnpm exec tsx scripts/verify-duo-pose.ts
 * Also: pnpm verify:duo
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DUO_PRESETS, poseFromMetrics, type DuoMetrics } from '../lib/duoPose';

type Case = {
  name: string;
  m: DuoMetrics;
  pose: string;
  stack: boolean;
  surface?: string;
  tent?: boolean;
};

const cases: Case[] = [
  { name: 'iPhone 14 portrait', m: DUO_PRESETS.phone, pose: 'phone', stack: true, surface: 'phone' },
  { name: 'iPhone 18 Pro', m: DUO_PRESETS.phone18, pose: 'phone', stack: true, surface: 'phone' },
  { name: 'Duo cover portrait', m: DUO_PRESETS.cover, pose: 'phone', stack: true, surface: 'cover' },
  { name: 'Duo closed short-wide', m: DUO_PRESETS.closedLandscape, pose: 'closed', stack: true, surface: 'cover', tent: true },
  { name: 'Duo book two segments', m: { w: 900, h: 700, segments: 2, offsetLeft: 0 }, pose: 'book', stack: false, surface: 'inner' },
  { name: 'open inner landscape', m: DUO_PRESETS.innerLandscape, pose: 'book', stack: false, surface: 'inner' },
  { name: 'Duo inner portrait', m: DUO_PRESETS.innerPortrait, pose: 'book', stack: false, surface: 'inner' },
  { name: 'Duo tent two segments short', m: DUO_PRESETS.tent, pose: 'book', stack: false, surface: 'inner', tent: true },
  { name: 'desktop', m: DUO_PRESETS.desktop, pose: 'wide', stack: false, surface: 'desk' },
  { name: 'split left pane', m: DUO_PRESETS.split, pose: 'phone', stack: true, surface: 'phone' },
  { name: 'iPad landscape', m: DUO_PRESETS.ipad, pose: 'book', stack: false, surface: 'inner' },
];

let failed = 0;
for (const c of cases) {
  const got = poseFromMetrics(c.m);
  const ok =
    got.pose === c.pose &&
    got.stack === c.stack &&
    (c.surface === undefined || got.surface === c.surface) &&
    (c.tent === undefined || got.tent === c.tent);
  if (!ok) {
    failed += 1;
    console.error(
      `FAIL ${c.name}: expected ${c.pose} stack=${c.stack} surface=${c.surface ?? '*'} tent=${c.tent ?? '*'}, got ${got.pose} stack=${got.stack} surface=${got.surface} tent=${got.tent}`,
    );
  } else {
    console.log(`PASS ${c.name} → ${got.pose} / ${got.surface}${got.tent ? ' · tent' : ''}`);
  }
}

const root = process.cwd();
const css = readFileSync(join(root, 'app/globals.css'), 'utf8');
const js = readFileSync(join(root, 'lib/duoPose.ts'), 'utf8');
const labCss = readFileSync(join(root, 'app/duo/duo-lab.css'), 'utf8');

function assert(name: string, ok: boolean, detail?: string) {
  if (!ok) {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    console.log(`PASS ${name}`);
  }
}

assert('globals documents Duo breakpoints', /iPhone Duo \/ foldables/.test(css));
assert('globals has --duo-crease', /--duo-crease:/.test(css));
assert('globals has viewport-segments media', /horizontal-viewport-segments:\s*2/.test(css));
assert('globals has container query', /@container duo/.test(css));
assert('duoPose documents listeners', /visualViewport/.test(js) && /horizontal-viewport-segments/.test(js));
assert('duo lab css exists', existsSync(join(root, 'app/duo/duo-lab.css')) && /container-name:\s*duo-lab/.test(labCss));
assert('duo lab page exists', existsSync(join(root, 'app/duo/page.tsx')));

if (failed) {
  process.exit(1);
}
console.log(`Result: all pose + file guards passed`);
