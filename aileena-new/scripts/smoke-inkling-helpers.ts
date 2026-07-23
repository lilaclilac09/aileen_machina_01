/**
 * Smoke checks for Inkling clip helpers (no API key / network required).
 *   pnpm exec tsx scripts/smoke-inkling-helpers.ts
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  computeBatches,
  dedupeCandidates,
  parseCandidatesResponse,
  slugFromYoutubeUrl,
  toAbsoluteCandidate,
} from '../lib/inkling/clips';
import {
  evenlySpacedSegments,
  parseSilenceLog,
  proposeLocalCandidates,
  speechSegmentsFromSilence,
} from '../lib/inkling/localClips';
import { checkMediaDeps, shellRun } from '../lib/inkling/media';

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

  const silences = parseSilenceLog(
    'silence_start: 10.0\nsilence_end: 12.5 | silence_duration: 2.5\nsilence_start: 40.0\nsilence_end: 41.0',
  );
  assert(silences.length === 2 && silences[0].start_s === 10 && silences[0].end_s === 12.5, 'silence parse');
  const speech = speechSegmentsFromSilence(90, silences, { min_s: 12, max_s: 75 });
  assert(speech.length >= 1, 'speech islands');
  const even = evenlySpacedSegments(120, 3, 30);
  assert(even.length === 3, 'even fallback');

  const dir = join(tmpdir(), `inkling-local-smoke-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const wav = join(dir, 'tone.wav');
  // 90s: tone 0–20, silence 20–25, tone 25–55, silence 55–58, tone 58–90
  shellRun(
    `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=20" -f lavfi -i "anullsrc=r=16000:cl=mono:d=5" -f lavfi -i "sine=frequency=660:duration=30" -f lavfi -i "anullsrc=r=16000:cl=mono:d=3" -f lavfi -i "sine=frequency=520:duration=32" -filter_complex "[0][1][2][3][4]concat=n=5:v=0:a=1" -ar 16000 -ac 1 "${wav}"`,
  );
  const local = proposeLocalCandidates(wav, 90, 2);
  assert(local.length >= 1 && local.length <= 2, `local candidates: ${local.length}`);
  assert(local.every((c) => c.end_s > c.start_s), 'local ranges');
  writeFileSync(join(dir, 'local.json'), JSON.stringify(local, null, 2));
  rmSync(dir, { recursive: true, force: true });
  console.log('ok: free local silence heuristic');

  console.log('All helper smokes passed.');
}

main();
