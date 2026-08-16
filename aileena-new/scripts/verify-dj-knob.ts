#!/usr/bin/env tsx
/**
 * Unit checks for Sound Lab rotary mapping + DJKnob interaction contract.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  KNOB_MAX_ANGLE,
  KNOB_MIN_ANGLE,
  angleToValue,
  clampKnobValue,
  pointerToKnobValue,
  valueToAngle,
} from '../lib/djKnob';

type Check = { name: string; ok: boolean; detail?: string };

function check(name: string, ok: boolean, detail?: string): Check {
  return { name, ok, detail };
}

function run(): Check[] {
  const checks: Check[] = [];
  checks.push(check('min angle maps to 0', Math.abs(angleToValue(KNOB_MIN_ANGLE) - 0) < 0.001));
  checks.push(check('max angle maps to 100', Math.abs(angleToValue(KNOB_MAX_ANGLE) - 100) < 0.001));
  checks.push(check('0deg maps to 50', Math.abs(angleToValue(0) - 50) < 0.001));
  checks.push(check('value 0 is -135deg', valueToAngle(0) === KNOB_MIN_ANGLE));
  checks.push(check('value 100 is +135deg', valueToAngle(100) === KNOB_MAX_ANGLE));
  checks.push(check('clamp + step', clampKnobValue(27, 0, 100, 25) === 25));
  checks.push(check('clamp above max', clampKnobValue(140, 0, 100) === 100));
  checks.push(check('dead-zone below clamps to max', angleToValue(180) === 100));
  checks.push(check('dead-zone below other side clamps to min', angleToValue(-180) === 0));

  // Pointer at center-top should be ~50 (0deg).
  checks.push(check(
    'pointer above center is mid',
    Math.abs(pointerToKnobValue(20, 0, 20, 20) - 50) < 0.5,
  ));
  // Pointer left-down-ish at -135: x left, y down from center.
  const left = pointerToKnobValue(20 - 20, 20 + 20, 20, 20);
  checks.push(check('pointer lower-left is near min', left <= 5, `got ${left}`));
  const right = pointerToKnobValue(20 + 20, 20 + 20, 20, 20);
  checks.push(check('pointer lower-right is near max', right >= 95, `got ${right}`));

  const knob = readFileSync(join(process.cwd(), 'components/DJKnob.tsx'), 'utf8');
  checks.push(check('role=slider', knob.includes('role="slider"')));
  checks.push(check('keyboard arrows', knob.includes('ArrowUp') && knob.includes('ArrowLeft') && knob.includes('shiftKey')));
  checks.push(check('double-click reset', knob.includes('onDoubleClick') && knob.includes('defaultValue')));
  checks.push(check('touch-action none', knob.includes("touchAction: 'none'")));
  checks.push(check('tick marks', knob.includes('dj-knob-tick-') && knob.includes('KNOB_TICK_PCTS')));
  checks.push(check('click-to-set via pointer angle', knob.includes('pointerToKnobValue') && knob.includes('dragged.current')));
  checks.push(check('ignore near-center clicks for angle jump', knob.includes('rect.width * 0.28')));

  const station = readFileSync(join(process.cwd(), 'components/DJStation.tsx'), 'utf8');
  checks.push(check('DJStation uses shared DJKnob', station.includes("from './DJKnob'") && !station.includes('function EQKnob')));
  checks.push(check(
    'EQ + Filter knobs keep onChange',
    station.includes('ariaLabel={`EQ') && station.includes('ariaLabel={`Filter') && station.includes('onChange={v => setEqVals'),
  ));
  checks.push(check(
    'Spotify load hint is reference-only',
    station.includes('Spotify reference only. Upload audio to mix/export.'),
  ));
  return checks;
}

const checks = run();
const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? 'ok' : 'FAIL'}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${checks.length} failed`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed`);
