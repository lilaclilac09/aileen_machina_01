import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chatWithAudio, getInklingConfig, type InklingConfig } from './client';
import {
  buildCorrectPrompt,
  buildProposePrompt,
  computeBatches,
  dedupeCandidates,
  parseCandidatesResponse,
  sanitizeFilename,
  slugFromYoutubeUrl,
  toAbsoluteCandidate,
  type AudioBatch,
  type ClipCandidate,
  type ClipMode,
} from './clips';
import {
  convertToWav,
  downloadYoutube,
  extractBatchWav,
  extractWindowWav,
  ffprobeDuration_s,
  findSourceMedia,
  renderClipToFile,
} from './media';

export type PipelinePhase =
  | 'download'
  | 'convert'
  | 'batch'
  | 'propose'
  | 'correct'
  | 'render'
  | 'done'
  | 'error';

export type PipelineProgress = {
  phase: PipelinePhase;
  message: string;
  progress: number;
  batchIndex?: number;
  batchTotal?: number;
  candidateIndex?: number;
  candidateTotal?: number;
};

export type PipelineOptions = {
  url: string;
  mode: ClipMode;
  bestCount: number;
  query?: string;
  batchSeconds: number;
  overlapSeconds: number;
  padSeconds: number;
  dryRun: boolean;
  audioOnly: boolean;
  workDir: string;
  skipDownload?: boolean;
  onProgress?: (progress: PipelineProgress) => void | Promise<void>;
};

export type RenderedClip = {
  index: number;
  filename: string;
  path: string;
};

export type PipelineResult = {
  url: string;
  title: string;
  slug: string;
  mode: ClipMode;
  query: string | null;
  totalDuration_s: number;
  candidates: ClipCandidate[];
  clips: RenderedClip[];
  generatedAt: string;
};

function emit(
  onProgress: PipelineOptions['onProgress'],
  progress: PipelineProgress,
): void {
  void onProgress?.(progress);
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
    const retryPrompt =
      'Fix JSON only. Reply with a single JSON object of the form {"candidates":[{"title":"...","start_s":0,"end_s":1,"reason":"...","score":0.5}]} — no prose, no markdown.';
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
    const retryPrompt =
      'Fix JSON only. Reply with a single JSON object of the form {"candidates":[{"title":"...","start_s":0,"end_s":1,"reason":"...","score":0.5}]} — no prose, no markdown.';
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

export async function runInklingClipPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  const slug = slugFromYoutubeUrl(opts.url);
  const workDir = opts.workDir;
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
    emit(opts.onProgress, { phase: 'download', message: 'Reusing existing download', progress: 5 });
    sourcePath = findSourceMedia(workDir);
    const metaPath = join(workDir, 'metadata.json');
    if (existsSync(metaPath)) {
      title = (JSON.parse(readFileSync(metaPath, 'utf8')) as { title?: string }).title ?? slug;
    } else {
      title = slug;
    }
    if (!existsSync(fullWav)) {
      emit(opts.onProgress, { phase: 'convert', message: 'Converting to WAV', progress: 10 });
      convertToWav(sourcePath, fullWav);
    }
  } else {
    emit(opts.onProgress, { phase: 'download', message: 'Downloading from YouTube', progress: 5 });
    const dl = downloadYoutube(opts.url, workDir);
    sourcePath = dl.sourcePath;
    title = dl.title;
    emit(opts.onProgress, { phase: 'convert', message: 'Converting to 16 kHz WAV', progress: 12 });
    convertToWav(sourcePath, fullWav);
  }

  const totalDuration_s = ffprobeDuration_s(fullWav);
  const batchDefs = computeBatches(totalDuration_s, opts.batchSeconds, opts.overlapSeconds);
  const batches: AudioBatch[] = batchDefs.map((b) => ({
    ...b,
    wavPath: join(batchesDir, `batch-${String(b.index).padStart(3, '0')}.wav`),
  }));

  emit(opts.onProgress, {
    phase: 'batch',
    message: `Splitting into ${batches.length} batch(es)`,
    progress: 18,
    batchTotal: batches.length,
  });

  for (const batch of batches) {
    if (!existsSync(batch.wavPath)) {
      extractBatchWav(fullWav, batch.start_s, batch.duration_s, batch.wavPath);
    }
  }

  const cfg = getInklingConfig();
  const maxPerBatch = Math.max(2, Math.ceil(opts.bestCount / Math.max(1, batches.length)) + 1);
  const rawCandidates: ClipCandidate[] = [];

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    emit(opts.onProgress, {
      phase: 'propose',
      message: `Inkling listening — batch ${i + 1}/${batches.length}`,
      progress: 20 + Math.round((i / batches.length) * 40),
      batchIndex: i,
      batchTotal: batches.length,
    });
    const found = await proposeForBatch(cfg, batch, opts.mode, opts.query, maxPerBatch);
    for (const c of found) {
      rawCandidates.push(toAbsoluteCandidate(c, batch.start_s, batch.index));
    }
  }

  const deduped = dedupeCandidates(rawCandidates).slice(0, opts.bestCount);
  const corrected: ClipCandidate[] = [];

  for (let i = 0; i < deduped.length; i += 1) {
    const c = deduped[i];
    emit(opts.onProgress, {
      phase: 'correct',
      message: `Refining boundaries — clip ${i + 1}/${deduped.length}`,
      progress: 60 + Math.round((i / Math.max(1, deduped.length)) * 25),
      candidateIndex: i,
      candidateTotal: deduped.length,
    });
    corrected.push(
      await correctCandidate(cfg, fullWav, c, opts.padSeconds, totalDuration_s, batchesDir),
    );
  }

  const manifest: PipelineResult = {
    url: opts.url,
    title,
    slug,
    mode: opts.mode,
    query: opts.query ?? null,
    totalDuration_s,
    candidates: corrected,
    clips: [],
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(candidatesPath, JSON.stringify(manifest, null, 2));

  if (opts.dryRun) {
    emit(opts.onProgress, { phase: 'done', message: 'Candidates ready (dry run)', progress: 100 });
    return manifest;
  }

  const ext = opts.audioOnly ? 'm4a' : 'mp4';
  for (let i = 0; i < corrected.length; i += 1) {
    const c = corrected[i];
    emit(opts.onProgress, {
      phase: 'render',
      message: `Rendering clip ${i + 1}/${corrected.length}`,
      progress: 85 + Math.round((i / Math.max(1, corrected.length)) * 14),
      candidateIndex: i,
      candidateTotal: corrected.length,
    });
    const filename = `${sanitizeFilename(c.title, i)}.${ext}`;
    const outPath = join(clipsDir, filename);
    renderClipToFile(
      sourcePath,
      c.absoluteStart_s ?? c.start_s,
      c.absoluteEnd_s ?? c.end_s,
      outPath,
      opts.audioOnly,
    );
    manifest.clips.push({ index: i, filename, path: outPath });
  }

  emit(opts.onProgress, { phase: 'done', message: 'All clips ready', progress: 100 });
  return manifest;
}

export function defaultWorkDir(root: string, url: string): string {
  return join(root, 'data', 'inkling-clips', slugFromYoutubeUrl(url));
}
