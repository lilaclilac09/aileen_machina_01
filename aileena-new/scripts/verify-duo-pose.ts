/**
 * poseFromMetrics — Duo layout table. Run: pnpm exec tsx scripts/verify-duo-pose.ts
 */
import { poseFromMetrics } from '../lib/duoPose';

type Case = {
  name: string;
  m: { w: number; h: number; segments: number; offsetLeft: number };
  pose: string;
  stack: boolean;
};

const cases: Case[] = [
  { name: 'iPhone 14 portrait', m: { w: 390, h: 844, segments: 1, offsetLeft: 0 }, pose: 'phone', stack: true },
  { name: 'Duo closed short-wide', m: { w: 750, h: 360, segments: 1, offsetLeft: 0 }, pose: 'closed', stack: true },
  { name: 'Duo book two segments', m: { w: 900, h: 700, segments: 2, offsetLeft: 0 }, pose: 'book', stack: false },
  { name: 'open inner landscape', m: { w: 820, h: 600, segments: 1, offsetLeft: 0 }, pose: 'book', stack: false },
  { name: 'desktop', m: { w: 1440, h: 900, segments: 1, offsetLeft: 0 }, pose: 'wide', stack: false },
  { name: 'split left pane', m: { w: 400, h: 800, segments: 1, offsetLeft: 0 }, pose: 'phone', stack: true },
];

let failed = 0;
for (const c of cases) {
  const got = poseFromMetrics(c.m);
  const ok = got.pose === c.pose && got.stack === c.stack;
  if (!ok) {
    failed += 1;
    console.error(`FAIL ${c.name}: expected ${c.pose} stack=${c.stack}, got ${got.pose} stack=${got.stack}`);
  } else {
    console.log(`PASS ${c.name} → ${got.pose}`);
  }
}

if (failed) {
  process.exit(1);
}
console.log(`Result: ${cases.length - failed}/${cases.length} passed`);
