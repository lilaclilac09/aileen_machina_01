/**
 * Smoke checks for Inkling clip helpers (no API key / network required).
 *   pnpm exec tsx scripts/smoke-inkling-helpers.ts
 */
import {
  computeBatches,
  dedupeCandidates,
  parseCandidatesResponse,
  slugFromYoutubeUrl,
  toAbsoluteCandidate,
} from '../lib/inkling/clips';
import { checkMediaDeps } from '../lib/inkling/media';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main(): void {
  checkMediaDeps();
  console.log('ok: yt-dlp / ffmpeg / ffprobe present');

  assert(slugFromYoutubeUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw') === 'jNQXAC9IVRw', 'slug watch');
  assert(slugFromYoutubeUrl('https://youtu.be/jNQXAC9IVRw') === 'jNQXAC9IVRw', 'slug short');

  const batches = computeBatches(1900, 900, 30);
  assert(batches.length === 3, `expected 3 batches, got ${batches.length}`);
  assert(batches[0].start_s === 0 && batches[0].end_s === 900, 'batch0');
  assert(batches[1].start_s === 870, 'batch1 overlap');

  const fenced = parseCandidatesResponse(`\`\`\`json
{"candidates":[{"title":"A","start_s":1,"end_s":20,"reason":"x","score":0.9}]}
\`\`\``);
  assert(fenced.length === 1 && fenced[0].title === 'A', 'fenced parse');

  const noisy = parseCandidatesResponse(
    'Here you go:\n{"candidates":[{"title":"B","start_s":2,"end_s":30,"reason":"y","score":0.7}]}\nThanks!',
  );
  assert(noisy[0].title === 'B', 'noisy parse');

  const abs = toAbsoluteCandidate(noisy[0], 100, 1);
  assert(abs.absoluteStart_s === 102 && abs.absoluteEnd_s === 130, 'absolute');

  const deduped = dedupeCandidates([
    { title: 'hi', start_s: 0, end_s: 20, reason: 'a', score: 0.9, absoluteStart_s: 0, absoluteEnd_s: 20 },
    { title: 'lo', start_s: 0, end_s: 20, reason: 'b', score: 0.5, absoluteStart_s: 5, absoluteEnd_s: 25 },
  ]);
  assert(deduped.length === 1 && deduped[0].title === 'hi', 'dedupe keeps higher score');

  console.log('ok: batch math + JSON parse/dedupe');
  console.log('All helper smokes passed.');
}

main();
