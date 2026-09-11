import assert from 'node:assert/strict';
import {
  DUO_LIGHTS,
  DUO_MODES,
  DUO_SKINS,
  DUO_TRACKS,
  lightHue,
  lightPeriod,
  skinById,
  trackById,
} from '../lib/duoObject';

assert.equal(DUO_MODES.length, 3);
assert.equal(DUO_SKINS.length, 5);
assert.equal(DUO_LIGHTS.length, 4);
assert.equal(DUO_TRACKS[0].id, 'heat');
assert.equal(skinById('kiln').label, 'kiln');
assert.equal(trackById('missing').id, 'heat');
assert.equal(lightHue('clock', DUO_TRACKS[0], DUO_SKINS[0]), '12 82% 50%');
assert.equal(lightPeriod('notify'), '1.6s');
assert.equal(lightPeriod('charge'), '4.8s');
console.log('PASS duo-object catalog 5 skins / 4 lights / 3 modes');
