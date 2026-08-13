/**
 * Verify Doors IA chrome back targets + ink contrast flags.
 * Run: pnpm exec tsx scripts/verify-doors-nav.ts
 */
import { chromeBackForPath, chromeInkForPath } from '../lib/doorsNav';

type Expect = {
  path: string;
  back: { href: string; label: string } | null;
  ink?: boolean;
};

const CASES: Expect[] = [
  { path: '/', back: null, ink: false },
  { path: '/doors', back: { href: '/', label: '← home' }, ink: true },
  { path: '/sound', back: { href: '/doors', label: '← doors' }, ink: false },
  {
    path: '/blog/watch-listening-shelf',
    back: { href: '/doors', label: '← doors' },
    ink: true,
  },
  { path: '/updates', back: { href: '/doors', label: '← doors' }, ink: true },
  { path: '/dispatch', back: { href: '/doors', label: '← doors' }, ink: true },
  { path: '/tools', back: { href: '/doors', label: '← doors' }, ink: true },
  { path: '/tools/chip-guess', back: { href: '/tools', label: '← tools' }, ink: true },
  { path: '/audio-clipping', back: { href: '/tools', label: '← tools' }, ink: true },
  {
    path: '/blog/pate-de-verre',
    back: { href: '/updates', label: '← metal & pages' },
    ink: true,
  },
  {
    path: '/blog/semi-basics-review',
    back: { href: '/blog/watch-listening-shelf', label: '← shelf' },
    ink: true,
  },
  {
    path: '/blog/clob',
    back: { href: '/dispatch', label: '← dispatch' },
    ink: true,
  },
  {
    path: '/blog/clob/explainer',
    back: { href: '/dispatch', label: '← dispatch' },
    ink: true,
  },
  {
    path: '/research/huawei-hbm',
    back: { href: '/dispatch', label: '← dispatch' },
    ink: false,
  },
  { path: '/works', back: { href: '/doors', label: '← doors' }, ink: false },
  { path: '/prophecy', back: { href: '/doors', label: '← doors' }, ink: false },
  { path: '/privacy', back: { href: '/', label: '← home' }, ink: true },
  { path: '/inbox', back: { href: '/', label: '← home' }, ink: true },
  { path: '/council', back: { href: '/', label: '← home' }, ink: true },
  { path: '/cabinet', back: { href: '/', label: '← home' }, ink: true },
];

let failed = 0;
for (const c of CASES) {
  const got = chromeBackForPath(c.path);
  const ink = chromeInkForPath(c.path);
  const backOk =
    (got === null && c.back === null) ||
    (got !== null &&
      c.back !== null &&
      got.href === c.back.href &&
      got.label === c.back.label);
  const inkOk = c.ink === undefined || ink === c.ink;
  if (!backOk || !inkOk) {
    failed += 1;
    console.error('FAIL', c.path, { expected: c, got: { back: got, ink } });
  } else {
    console.log('ok', c.path, got?.label ?? '(none)', ink ? 'ink' : 'cream');
  }
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${CASES.length} doors-nav cases passed`);
