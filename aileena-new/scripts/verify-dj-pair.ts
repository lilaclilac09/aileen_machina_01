#!/usr/bin/env tsx
import assert from 'node:assert/strict';
import { allDeckTracks } from '../lib/djSetlist';
import { bpmSpread, recommendPairs, type PairableTrack } from '../lib/djPairRecommend';

const lib = allDeckTracks() as PairableTrack[];
const day = lib.find((t) => t.id === 'DAYDRM');
assert.ok(day, 'Daydreaming in catalogue');

const open = recommendPairs(day!, lib, { hardTechnoBias: false, limit: 4 });
assert.ok(open.length >= 2 && open.length <= 5, '2–5 pairs');
assert.ok(open.every((p) => p.trackId !== 'DAYDRM'), 'no self pair');
assert.ok(open.every((p) => ['strong', 'decent', 'experimental'].includes(p.confidence)));

const hard = recommendPairs(day!, lib, { hardTechnoBias: true, limit: 4 });
const openTop = open[0]?.bpm ?? 0;
const hardTop = hard[0]?.bpm ?? 0;
assert.ok(hardTop >= openTop || hard.some((p) => p.bpm >= 140), 'bias leans higher BPM when available');

assert.equal(bpmSpread(120, 122), 2);
assert.equal(bpmSpread(0, 120), null);

const fake: PairableTrack = { id: 'x', title: 'Untitled', bpm: 0, key: '—', dur: 0 };
const thin = recommendPairs(fake, lib, { limit: 3 });
assert.ok(thin.every((p) => p.confidence === 'experimental' || p.why.includes('metadata') || p.why.includes('tempo') || p.why.includes('thin')));

console.log('verify-dj-pair: ok', { open: open.map((p) => p.title), hard: hard.map((p) => p.title) });
