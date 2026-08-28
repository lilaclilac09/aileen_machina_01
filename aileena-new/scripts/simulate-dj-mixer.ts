#!/usr/bin/env tsx
/**
 * Offline mixer-engine simulation. No /sound UI. No AudioContext.
 *
 * Walks a two-deck mix the way djMixerEngine would: load A/B, play,
 * equal-power xfade, trim/EQ/filter, record, receipt.
 * Live Sound Lab is restored to the 2026-07-29 Spotify-iframe decks.
 * This script does not mount that UI.
 */

import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
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

type DeckSim = {
  title: string;
  bpm: number;
  durationSec: number;
  playing: boolean;
  pitchPct: number;
  trim: number;
  fader: number;
  eqLo: number;
  filter: number;
};

function deckGain(deck: DeckSim, xfade: number, side: 'A' | 'B'): number {
  if (!deck.playing) return 0;
  const xf = crossfadeGains(xfade);
  const sideGain = side === 'A' ? xf.a : xf.b;
  return trimGain(deck.trim) * faderGain(deck.fader) * sideGain;
}

function simulateMix() {
  const A: DeckSim = {
    title: 'Desk A',
    bpm: 120,
    durationSec: 40,
    playing: false,
    pitchPct: 0,
    trim: 75,
    fader: 100,
    eqLo: 50,
    filter: 50,
  };
  const B: DeckSim = {
    title: 'Desk B',
    bpm: 124,
    durationSec: 40,
    playing: false,
    pitchPct: 0,
    trim: 75,
    fader: 100,
    eqLo: 50,
    filter: 50,
  };

  const events: Array<{
    atSec: number;
    kind: 'load' | 'play' | 'xfade' | 'record-start' | 'record-stop';
    deck?: 'A' | 'B';
    title?: string;
    xfade?: number;
  }> = [];

  events.push({ atSec: 0, kind: 'load', deck: 'A', title: A.title });
  events.push({ atSec: 0, kind: 'load', deck: 'B', title: B.title });

  A.playing = true;
  events.push({ atSec: 0, kind: 'play', deck: 'A', title: A.title });
  events.push({ atSec: 0, kind: 'record-start' });

  const samples: Array<{ t: number; xfade: number; gainA: number; gainB: number }> = [];
  for (let xfade = 0; xfade <= 100; xfade += 25) {
    if (xfade === 50) {
      B.playing = true;
      events.push({ atSec: 12, kind: 'play', deck: 'B', title: B.title });
    }
    const t = 8 + (xfade / 100) * 16;
    events.push({ atSec: t, kind: 'xfade', xfade });
    samples.push({
      t,
      xfade,
      gainA: deckGain(A, xfade, 'A'),
      gainB: deckGain(B, xfade, 'B'),
    });
  }

  events.push({ atSec: 32, kind: 'record-stop' });

  const sync = syncPitchPct(A.bpm, A.pitchPct, B.bpm);
  B.pitchPct = sync ?? 0;

  return { A, B, samples, events, sync };
}

function main() {
  const { A, B, samples, events, sync } = simulateMix();

  const open = samples.find((s) => s.xfade === 0)!;
  const mid = samples.find((s) => s.xfade === 50)!;
  const close = samples.find((s) => s.xfade === 100)!;

  assert.ok(open.gainA > 0.99 && open.gainB === 0, 'xfade 0: A only');
  assert.ok(Math.abs(mid.gainA - mid.gainB) < 0.03, 'xfade 50: equal power');
  assert.ok(close.gainB > 0.99 && close.gainA < 0.02, 'xfade 100: B only');
  assert.equal(pitchToRate(A.pitchPct), 1);
  assert.ok(sync !== null && sync < 0, 'B pitched down toward 120');
  assert.ok(eqKnobToDb(50) === 0, 'eq 50 is unity');
  assert.equal(filterFromKnob(50).type, 'allpass');
  assert.ok(Math.abs(barsToSeconds(1, 120) - 2) < 1e-9);

  const receipt = buildMixReceipt({
    recordedAt: new Date('2026-08-16T00:00:00.000Z'),
    durationSec: 32,
    tracks: [
      { deck: 'A', title: A.title, bpm: A.bpm, durationSec: A.durationSec },
      { deck: 'B', title: B.title, bpm: B.bpm, durationSec: B.durationSec },
    ],
    events,
  });
  assert.ok(receipt.tracklist.includes('Deck A'));
  assert.ok(receiptToJson(receipt).includes('export ready for SoundCloud'));
  assert.ok(!/banger|drop the bass/i.test(receipt.description));

  const report = [
    'mixer simulation: ok (offline, not mounted on /sound)',
    `samples: ${samples.map((s) => `xf${s.xfade} A=${s.gainA.toFixed(3)} B=${s.gainB.toFixed(3)}`).join(' | ')}`,
    `sync B pitch: ${sync}%`,
    `receipt: ${receipt.title}`,
    'live /sound: pre-mixer Pioneer chrome from #468',
  ].join('\n');

  console.log(report);
  return report;
}

const report = main();
const out = process.env.SIM_OUT || '/opt/cursor/artifacts/mixer-sim-report.txt';
mkdir(out.replace(/\/[^/]+$/, ''), { recursive: true })
  .then(() => writeFile(out, `${report}\n`, 'utf8'))
  .catch(() => {
    /* artifacts dir optional in CI */
  });
