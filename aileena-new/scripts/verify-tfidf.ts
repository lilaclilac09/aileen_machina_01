#!/usr/bin/env tsx
/** Unit checks for the shared TF-IDF search core (tokenize + buildTfIdf). */

import assert from 'node:assert/strict';
import { tokenize, buildTfIdf } from '../lib/tfidf';

// tokenize: lowercase, drop stopwords, drop single-char tokens
assert.deepEqual(
  tokenize('The Quick and A brown Fox-92 x'),
  ['quick', 'brown', 'fox', '92'],
  'lowercases, drops stopwords and single-char tokens',
);
assert.ok(!tokenize('The AND the').includes('the'), 'stopwords removed');
assert.ok(!tokenize('The AND the').includes('and'), 'stopwords removed');
assert.deepEqual(tokenize('a b cd'), ['cd'], 'single-char tokens dropped');
assert.deepEqual(tokenize('LITHOGRAPHY'), ['lithography'], 'lowercased');

const long =
  'photolithography stepper alignment ' +
  'wafer '.repeat(60) +
  ' euv aperture drift';

const items = [
  { id: 'a', text: 'wafer yield notes about packaging and testing' },
  { id: 'b', text: 'memory bandwidth notes about packaging' },
  { id: 'c', text: long },
];

const index = buildTfIdf(items, (i) => i.text);
assert.equal(index.size, items.length, 'size equals item count');

assert.deepEqual(index.search('', 3), [], 'empty query short-circuits');
assert.deepEqual(index.search('   ', 3), [], 'whitespace query short-circuits');

// "bandwidth" appears only in b, "packaging" in a and b: rarer term wins
const rare = index.search('bandwidth packaging', 3);
assert.ok(rare.length >= 2, 'matches multiple docs');
assert.equal(rare[0].item.id, 'b', 'rarer term ranks its doc first');
for (let i = 1; i < rare.length; i++) {
  assert.ok(rare[i - 1].score >= rare[i].score, 'sorted by descending score');
}

assert.ok(index.search('packaging', 1).length <= 1, 'k limit respected');

// snippets: short doc returns full text, long doc is windowed around the term
const shortHit = index.search('bandwidth', 1)[0];
assert.equal(shortHit.snippet, items[1].text, 'short doc snippet is full text');
assert.ok(items[1].text.length < 220, 'short doc is under the window');

const longHit = index.search('aperture', 1)[0];
assert.equal(longHit.item.id, 'c');
assert.ok(long.length > 220, 'long doc exceeds the window');
assert.ok(longHit.snippet.includes('…'), 'long doc snippet is truncated');
assert.ok(longHit.snippet.length < long.length, 'snippet shorter than text');
assert.ok(
  longHit.snippet.toLowerCase().includes('aperture'),
  'snippet centred on the matched term',
);

console.log('verify-tfidf: ok');
