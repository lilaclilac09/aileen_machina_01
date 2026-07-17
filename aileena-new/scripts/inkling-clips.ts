#!/usr/bin/env tsx
/**
 * Inkling long-form audio clip tool.
 *
 *   pnpm inkling:clips -- 'https://www.youtube.com/watch?v=...' --best 5
 *   pnpm inkling:clips -- 'https://youtu.be/...' --query "mixture of experts"
 *
 * Pipeline: yt-dlp → WAV → batch → Inkling propose → Inkling correct → ffmpeg render
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { chatWithAudio, getInklingConfig, type InklingConfig } from '../lib/inkling/client';
import {
  buildCorrectPrompt,
  buildProposePrompt,
  computeBatches,
  dedupeCandidates,
  parseCandidatesResponse,
  sanitizeFilename,
  slugFromYoutubeUrl,
  toAbsoluteCandidate,
  USAGE,
  type AudioBatch,
  type ClipCandidate,
  type ClipMode,
} from '../lib/inkling/clips';

const ROOT = process.cwd();
const DEFAULT_OUT = join(ROOT, 'data', 'inkling-clips');

type CliOptions = {
  url?: string;
  mode: ClipMode;
  bestCount: number;
  query?: string;
  batchSeconds: number;
  overlapSeconds: number;
  padSeconds: number;
  dryRun: boolean;
  skipDownload: boolean;
  audioOnly: boolean;
  workDir?: string;
  help: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mode: 'best',
    bestCount: 5,
    batchSeconds: 900,
    overlapSeconds: 30,
    padSeconds: 20,
    dryRun: false,
    skipDownload: false,
    audioOnly: false,
    help: false,
  };

  const rest = argv.filter((a) => a !== '--');
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
      continue;
    }
    if (arg === '--dry-run') {
      opts.dryRun = true;
      continue;
    }
    if (arg === '--skip-download') {
      opts.skipDownload = true;
      continue;
    }
    if (arg === '--audio-only') {
      opts.audioOnly = true;
      continue;
    }
    if (arg === '--best') {
      opts.mode = 'best';
      const next = rest[i + 1];
      if (next && /^\d+$/.test(next)) {
        opts.bestCount = Number(next);
        i += 1;
      }
      continue;
    }
    if (arg === '--query') {
      opts.mode = 'query';
      const next = rest[i + 1];
      if (!next) throw new Error('--query requires a string argument');
      opts.query = next;
      i += 1;
      continue;
    }
    if (arg === '--batch-seconds') {
      opts.batchSeconds = Number(rest[++i]);
      continue;
    }
    if (arg === '--overlap-seconds') {
      opts.overlapSeconds = Number(rest[++i]);
      continue;
    }
    if (arg === '--pad-seconds') {
      opts.padSeconds = Number(rest[++i]);
      continue;
    }
    if (arg === '--work-dir') {
      opts.workDir = rest[++i];
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    if (!opts.url) opts.url = arg;
  }

  return opts;
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function runInherit(cmd: string): void {
  execSync(cmd, { stdio: 'inherit' });
}

function requireBin(name: string, installHint: string): void {
  try {
    run(`command -v ${name}`);
  } catch {
    throw new Error(`Missing required binary "${name}". ${installHint}`);
  }
}

function checkSystemDeps(): void {
  requireBin('yt-dlp', 'Install: https://github.com/yt-dlp/yt-dlp#installation');
  requireBin('ffmpeg', 'Install: https://ffmpeg.org/download.html');
  requireBin('ffprobe', 'Install with ffmpeg');
}

function ffprobeDuration_s(mediaPath: string): number {
  const out = run(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mediaPath}"`,
  );
  const n = Number(out);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Could not read duration from ${mediaPath}`);
  return n;
}

function findSourceMedia(workDir: string): string {
  const preferred = ['source.mp4', 'source.mkv', 'source.webm', 'source.m4a', 'source.mp3'];
  for (const name of preferred) {
    const p = join(workDir, name);
    if (existsSync(p)) return p;
  }
  const loose = readdirSync(workDir).find((f) => /^source\.[a-z0-9]+$/i.test(f));
  if (loose) return join(workDir, loose);
  throw new Error(`No source media in ${workDir}. Run without --skip-download first.`);
}

function downloadYoutube(url: string, workDir: string): { title: string; sourcePath: string } {
  mkdirSync(workDir, { recursive: true });
  const template = join(workDir, 'source.%(ext)s');
  const title = run(`yt-dlp --print title --skip-download "${url}"`);
  runInherit(
    `yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "${template}" "${url}"`,
  );
  const sourcePath = findSourceMedia(workDir);
  writeFileSync(
    join(workDir, 'metadata.json'),
    JSON.stringify({ url, title, downloadedAt: new Date().toISOString() }, null, 2),
  );
  return { title, sourcePath };
}

function convertToWav(sourcePath: string, wavPath: string): void {
  runInherit(`ffmpeg -y -i "${sourcePath}" -ar 16000 -ac 1 "${wavPath}"`);
}

function extractBatchWav(fullWav: string, batch: Omit<AudioBatch, 'wavPath'>, outPath: string): void {
  runInherit(
    `ffmpeg -y -ss ${batch.start_s} -t ${batch.duration_s} -i "${fullWav}" -ar 16000 -ac 1 "${outPath}"`,
  );
}

function extractWindowWav(
  fullWav: string,
  start_s: number,
  duration_s: number,
  outPath: string,
): void {
  runInherit(
    `ffmpeg -y -ss ${start_s} -t ${duration_s} -i "${fullWav}" -ar 16000 -ac 1 "${outPath}"`,
  );
}

async function proposeForBatch(
  cfg: InklingConfig,
  batch: AudioBatch,
  mode: ClipMode,
  query: string | undefined,
  maxPerBatch: number,
): Promise<ClipCandidate[]> {
  const prompt = buildProposePrompt({
    mode,
    query,
    batchIndex: batch.index,
    batchStart_s: batch.start_s,
    batchDuration_s: batch.duration_s,
    maxPerBatch,
  });

  let text = await chatWithAudio(cfg, prompt, batch.wavPath);
  try {
    return parseCandidatesResponse(text);
  } catch (firstErr) {
    const retryPrompt = `${text}\n\nYour previous reply was not valid JSON. Reply with ONLY the corrected JSON object, no prose.`;
    text = await chatWithAudio(cfg, retryPrompt, batch.wavPath);
    try {
      return parseCandidatesResponse(text);
    } catch {
      throw firstErr;
    }
  }
}

async function correctCandidate(
  cfg: InklingConfig,
  fullWav: string,
  candidate: ClipCandidate,
  padSeconds: number,
  totalDuration_s: number,
  tmpDir: string,
): Promise<ClipCandidate> {
  const absStart = candidate.absoluteStart_s ?? candidate.start_s;
  const absEnd = candidate.absoluteEnd_s ?? candidate.end_s;
  const windowStart = Math.max(0, absStart - padSeconds);
  const windowEnd = Math.min(totalDuration_s, absEnd + padSeconds);
  const windowDuration = windowEnd - windowStart;

  const windowPath = join(tmpDir, `correct-${sanitizeFilename(candidate.title, 0)}.wav`);
  extractWindowWav(fullWav, windowStart, windowDuration, windowPath);

  const relCandidate: ClipCandidate = {
    ...candidate,
    start_s: absStart - windowStart,
    end_s: absEnd - windowStart,
  };

  const prompt = buildCorrectPrompt({
    candidate: relCandidate,
    windowStart_s: windowStart,
    windowDuration_s: windowDuration,
  });

  let text = await chatWithAudio(cfg, prompt, windowPath);
  let parsed: ClipCandidate[];
  try {
    parsed = parseCandidatesResponse(text);
  } catch (firstErr) {
    const retryPrompt = `${text}\n\nYour previous reply was not valid JSON. Reply with ONLY the corrected JSON object, no prose.`;
    text = await chatWithAudio(cfg, retryPrompt, windowPath);
    try {
      parsed = parseCandidatesResponse(text);
    } catch {
      throw firstErr;
    }
  }

  const corrected = parsed[0];
  return {
    ...corrected,
    absoluteStart_s: windowStart + corrected.start_s,
    absoluteEnd_s: windowStart + corrected.end_s,
    corrected: true,
    batchIndex: candidate.batchIndex,
  };
}

function renderClip(
  sourcePath: string,
  candidate: ClipCandidate,
  outPath: string,
  audioOnly: boolean,
): void {
  const start = candidate.absoluteStart_s ?? candidate.start_s;
  const end = candidate.absoluteEnd_s ?? candidate.end_s;
  const duration = Math.max(0.5, end - start);

  if (audioOnly) {
    runInherit(
      `ffmpeg -y -ss ${start} -t ${duration} -i "${sourcePath}" -vn -c:a aac -b:a 192k "${outPath}"`,
    );
    return;
  }

  runInherit(
    `ffmpeg -y -ss ${start} -t ${duration} -i "${sourcePath}" -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 192k -movflags +faststart "${outPath}"`,
  );
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return;
  }
  if (!opts.url) {
    console.error(USAGE);
    process.exit(1);
  }
  if (opts.mode === 'query' && !opts.query) {
    throw new Error('--query requires a non-empty string');
  }

  checkSystemDeps();

  const slug = slugFromYoutubeUrl(opts.url);
  const workDir = opts.workDir ?? join(DEFAULT_OUT, slug);
  const batchesDir = join(workDir, 'batches');
  const clipsDir = join(workDir, 'clips');
  const fullWav = join(workDir, 'audio.wav');
  const candidatesPath = join(workDir, 'candidates.json');

  mkdirSync(workDir, { recursive: true });
  mkdirSync(batchesDir, { recursive: true });
  mkdirSync(clipsDir, { recursive: true });

  let sourcePath: string;
  let title: string;

  if (opts.skipDownload) {
    sourcePath = findSourceMedia(workDir);
    const metaPath = join(workDir, 'metadata.json');
    if (existsSync(metaPath)) {
      title = (JSON.parse(readFileSync(metaPath, 'utf8')) as { title?: string }).title ?? slug;
    } else {
      title = slug;
    }
    if (!existsSync(fullWav)) {
      convertToWav(sourcePath, fullWav);
    }
  } else {
    const dl = downloadYoutube(opts.url, workDir);
    sourcePath = dl.sourcePath;
    title = dl.title;
    convertToWav(sourcePath, fullWav);
  }

  const totalDuration_s = ffprobeDuration_s(fullWav);
  const batchDefs = computeBatches(totalDuration_s, opts.batchSeconds, opts.overlapSeconds);
  const batches: AudioBatch[] = batchDefs.map((b) => ({
    ...b,
    wavPath: join(batchesDir, `batch-${String(b.index).padStart(3, '0')}.wav`),
  }));

  for (const batch of batches) {
    if (!existsSync(batch.wavPath)) {
      extractBatchWav(fullWav, batch, batch.wavPath);
    }
  }

  console.log(`Work dir: ${workDir}`);
  console.log(`Title: ${title}`);
  console.log(`Duration: ${totalDuration_s.toFixed(1)}s | Batches: ${batches.length}`);

  const cfg = getInklingConfig();
  const maxPerBatch = Math.max(2, Math.ceil(opts.bestCount / Math.max(1, batches.length)) + 1);

  const rawCandidates: ClipCandidate[] = [];
  for (const batch of batches) {
    console.log(`Proposing clips for batch ${batch.index + 1}/${batches.length}...`);
    const found = await proposeForBatch(cfg, batch, opts.mode, opts.query, maxPerBatch);
    for (const c of found) {
      rawCandidates.push(toAbsoluteCandidate(c, batch.start_s, batch.index));
    }
  }

  const deduped = dedupeCandidates(rawCandidates).slice(0, opts.bestCount);
  console.log(`Top ${deduped.length} candidates after dedupe — running correction pass...`);

  const corrected: ClipCandidate[] = [];
  for (const c of deduped) {
    const fixed = await correctCandidate(cfg, fullWav, c, opts.padSeconds, totalDuration_s, batchesDir);
    corrected.push(fixed);
    console.log(
      `  ✓ ${fixed.title} (${(fixed.absoluteStart_s ?? 0).toFixed(1)}s – ${(fixed.absoluteEnd_s ?? 0).toFixed(1)}s)`,
    );
  }

  const manifest = {
    url: opts.url,
    title,
    slug,
    mode: opts.mode,
    query: opts.query ?? null,
    totalDuration_s,
    generatedAt: new Date().toISOString(),
    candidates: corrected,
  };
  writeFileSync(candidatesPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${candidatesPath}`);

  if (opts.dryRun) {
    console.log('Dry run — skipping ffmpeg render.');
    return;
  }

  for (let i = 0; i < corrected.length; i += 1) {
    const c = corrected[i];
    const ext = opts.audioOnly ? 'm4a' : 'mp4';
    const outPath = join(clipsDir, `${sanitizeFilename(c.title, i)}.${ext}`);
    renderClip(sourcePath, c, outPath, opts.audioOnly);
    console.log(`Rendered ${outPath}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
