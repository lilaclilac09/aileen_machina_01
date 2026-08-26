#!/usr/bin/env tsx
import assert from 'node:assert/strict';
import { isMixableTrack } from '../lib/djMixable';
import { allDeckTracks, DEMO_DECK_TRACKS } from '../lib/djSetlist';
import { bpmSpread, recommendPairs, type PairableTrack } from '../lib/djPairRecommend';

assert.equal(DEMO_DECK_TRACKS.length, 2, 'two demo tracks');
assert.ok(DEMO_DECK_TRACKS.every(isMixableTrack), 'both demos mixable');
assert.ok(DEMO_DECK_TRACKS.every((t) => t.audioSrc && t.source === 'demo'));

const lib = allDeckTracks() as PairableTrack[];
const mixable = lib.filter(isMixableTrack);
assert.equal(mixable.length, 2, 'exactly two mixable demos in crate');
assert.ok(mixable.some((t) => t.id === 'demo-kick'));
assert.ok(mixable.some((t) => t.id === 'demo-stab'));

const kick = mixable.find((t) => t.id === 'demo-kick');
assert.ok(kick, 'Kick Loop mixable');
const pairs = recommendPairs(kick!, mixable, { hardTechnoBias: false, limit: 3 });
assert.equal(pairs.length, 1, 'one mixable partner');
assert.equal(pairs[0].trackId, 'demo-stab');
assert.ok(pairs.every((p) => p.trackId !== 'demo-kick'), 'no self pair');
assert.ok(pairs.every((p) => ['strong', 'decent', 'experimental'].includes(p.confidence)));

const day = lib.find((t) => t.id === 'DAYDRM');
assert.ok(day, 'Daydreaming in catalogue');
assert.equal(isMixableTrack(day!), false, 'Daydreaming is reference');

assert.equal(bpmSpread(120, 122), 2);
assert.equal(bpmSpread(0, 120), null);

const fake: PairableTrack = { id: 'x', title: 'Untitled', bpm: 0, key: '—', dur: 0 };
const thin = recommendPairs(fake, mixable, { limit: 3 });
assert.ok(thin.every((p) => p.confidence === 'experimental' || p.why.includes('metadata') || p.why.includes('tempo') || p.why.includes('thin')));

console.log('verify-dj-pair: ok', {
  mixable: mixable.map((t) => t.title),
  pairs: pairs.map((p) => p.title),
});
