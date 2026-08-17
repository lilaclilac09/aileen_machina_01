#!/usr/bin/env tsx
/** Unit checks for mixer math + mix receipt. No AudioContext. */

import assert from 'node:assert/strict';
import {
  barsToSeconds,
  crossfadeGains,
  eqKnobToDb,
  faderGain,
  filterFromKnob,
  pitchToRate,
  syncPitchPct,
  trimGain,
} from '../lib/djMixerMath';
import { buildMixReceipt, receiptToJson } from '../lib/djMixReceipt';

const a0 = crossfadeGains(0);
assert.ok(a0.a > 0.99 && a0.b < 0.01, 'xfade 0 = A');
const mid = crossfadeGains(50);
assert.ok(Math.abs(mid.a - mid.b) < 0.02, 'xfade 50 equal power');
const b100 = crossfadeGains(100);
assert.ok(b100.b > 0.99 && b100.a < 0.01, 'xfade 100 = B');

assert.equal(pitchToRate(0), 1);
assert.ok(Math.abs(pitchToRate(8) - 1.08) < 1e-9);
assert.equal(trimGain(75), 1);
assert.equal(trimGain(0), 0);
assert.ok(faderGain(0) === 0 && faderGain(100) > 0.99);
assert.ok(eqKnobToDb(50) === 0);
assert.ok(eqKnobToDb(0) <= -80);
assert.ok(eqKnobToDb(100) === 12);
assert.equal(filterFromKnob(50).type, 'allpass');
assert.equal(filterFromKnob(10).type, 'lowpass');
assert.equal(filterFromKnob(90).type, 'highpass');
assert.ok(Math.abs(barsToSeconds(1, 120) - 2) < 1e-9);
assert.equal(syncPitchPct(120, 0, 120), 0);
assert.ok(syncPitchPct(0, 0, 120) === null);

const receipt = buildMixReceipt({
  recordedAt: new Date('2026-08-16T00:00:00.000Z'),
  durationSec: 95,
  tracks: [
    { deck: 'A', title: 'Desk A', bpm: 120, durationSec: 40 },
    { deck: 'B', title: 'Desk B', bpm: 124, durationSec: 40 },
  ],
  events: [{ atSec: 12, kind: 'play', deck: 'B', title: 'Desk B' }],
});
assert.ok(receipt.title.includes('Desk A'));
assert.ok(receipt.tracklist.includes('Deck A'));
assert.ok(receipt.soundcloudCaption.includes('Tracklist'));
assert.ok(receiptToJson(receipt).includes('export ready for SoundCloud'));
assert.ok(!/banger|drop the bass|let.?s go/i.test(receipt.description));

console.log('verify-dj-mixer-math: ok');
