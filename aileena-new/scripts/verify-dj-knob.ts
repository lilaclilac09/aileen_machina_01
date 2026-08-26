#!/usr/bin/env tsx
/**
 * Unit checks for Sound Lab rotary/fader mapping + DJStation wiring.
 * Dual-deck EQ A/B + filter + master. No FX knob. No leftover fake rotaries.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  KNOB_MAX_ANGLE,
  KNOB_MIN_ANGLE,
  angleToValue,
  clampKnobValue,
  knobStepAmount,
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

  checks.push(check(
    'pointer above center is mid',
    Math.abs(pointerToKnobValue(20, 0, 20, 20) - 50) < 0.5,
  ));
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
  checks.push(check('ring jump on pointerdown', knob.includes('const jumped = valueFromPointer') && knob.includes('startVal.current = jumped')));
  checks.push(check('mouse wheel', knob.includes("addEventListener('wheel'") && knob.includes('passive: false')));
  checks.push(check('alt fine step', knob.includes('altKey') && knob.includes('knobStepAmount')));
  checks.push(check('onChange is required', /onChange:\s*\(v: number\) => void/.test(knob) && !/onChange\?:/.test(knob)));
  checks.push(check('shift step is larger', knobStepAmount(1, 0, 100, { shift: true }).delta === 10));
  checks.push(check('alt step is finer', knobStepAmount(1, 0, 100, { alt: true }).delta === 0.1));

  const fader = readFileSync(join(process.cwd(), 'components/DJFader.tsx'), 'utf8');
  checks.push(check('fader role=slider', fader.includes('role="slider"')));
  checks.push(check('fader keyboard', fader.includes('ArrowUp') && fader.includes('Home') && fader.includes('End')));
  checks.push(check('fader wheel', fader.includes("addEventListener('wheel'") && fader.includes('passive: false')));
  checks.push(check('fader click-to-set', fader.includes('valueFromPointer') && fader.includes('commit(start.current.val)')));
  checks.push(check('fader double-click reset', fader.includes('onDoubleClick') && fader.includes('commit(reset)')));
  checks.push(check('fader touch-action none', fader.includes("touchAction: 'none'")));
  checks.push(check('fader ticks', fader.includes('ticks.map')));

  const station = readFileSync(join(process.cwd(), 'components/DJStation.tsx'), 'utf8');
  checks.push(check('DJStation uses shared DJKnob', station.includes("from './DJKnob'") && !station.includes('function EQKnob')));
  checks.push(check('DJStation uses shared DJFader', station.includes("from './DJFader'") && !station.includes('function PitchFader')));
  checks.push(check('no leftover MKnob nightlight', !station.includes('function MKnob') && !station.includes('<MKnob')));
  checks.push(check('no native range faders', !station.includes('type="range"')));
  checks.push(check(
    'gain / EQ / filter / master knobs wired',
    station.includes('dj-knob-gain-a')
      && station.includes('dj-knob-gain-b')
      && station.includes('dj-knob-eq-')
      && station.includes('dj-knob-filter-')
      && station.includes('dj-knob-master')
      && station.includes('onChange={onGain}')
      && station.includes('onChange={onMaster}'),
  ));
  checks.push(check(
    'pitch / channel / xfade faders wired',
    station.includes('dj-pitch-a')
      && station.includes('dj-pitch-b')
      && station.includes("'dj-fader-a'")
      && station.includes("'dj-fader-b'")
      && station.includes('testId="dj-xfade"'),
  ));
  checks.push(check('no FX / setFxAmt knob', !station.includes('setFxAmt') && !station.includes('ariaLabel="FX"')));
  checks.push(check('SEND/PHONES stay disabled v2', station.includes('SEND v2') && station.includes('PHONES v2') && station.includes('not in the audio graph yet')));
  const knobTags = station.split('<DJKnob').length - 1;
  checks.push(check('DJKnob markup for gain + EQ map + filter map + master', knobTags === 4, `got ${knobTags}`));
  const faderTags = station.split('<DJFader').length - 1;
  checks.push(check('DJFader markup for pitch + channel map + xfade', faderTags === 3, `got ${faderTags}`));
  checks.push(check(
    'non-mixable load hint is Not mixable',
    station.includes("showDeckHint('Not mixable.')") && !station.includes('Reference only.'),
  ));
  checks.push(check('platter is display-only', station.includes('scratch v2') && station.includes("pointerEvents: 'none'")));
  checks.push(check(
    'whole deck is the carousel drop target',
    station.includes("Platter is display-only; the whole deck is the drop target")
      && /data-testid=\{side === 'left' \? 'dj-deck-a-drop'[\s\S]{0,220}onDrop=\{onDrop\}/.test(station)
      && !station.includes('Platter drop zone'),
  ));
  checks.push(check(
    'deck Load A/B loads the selected carousel track',
    station.includes("onUpload={() => void loadTrackToDeck(selectedTrack, 'left')}")
      && station.includes("onUpload={() => void loadTrackToDeck(selectedTrack, 'right')}"),
  ));
  checks.push(check(
    'play unlocks AudioContext then loads if empty',
    station.includes('mix.unlock()') && station.includes('if (!already)'),
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
