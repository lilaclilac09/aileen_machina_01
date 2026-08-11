import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MediaAsset, ProjectManifest, Transcript } from '../domain/types';
import { which, runCapture } from '../render/ffmpeg-runner';

/**
 * Optional local Whisper adapter.
 * Tries: `whisper` (openai-whisper CLI) → skip gracefully if missing.
 * Never calls paid APIs. Cheap Cursor path stays free.
 */
export async function transcribeAssets(
  root: string,
  project: ProjectManifest,
  assets: MediaAsset[],
): Promise<Map<string, Transcript>> {
  const out = new Map<string, Transcript>();
  const cfg = project.planner.whisper;
  const dir = join(root, project.paths.work, 'transcripts');
  mkdirSync(dir, { recursive: true });

  if (!cfg.enabled) {
    return out;
  }

  const whisperBin = which('whisper');
  if (!whisperBin) {
    if (!cfg.optional) {
      throw new Error('whisper CLI not found (pip install openai-whisper)');
    }
    for (const a of assets.filter((x) => x.kind === 'video' && x.hasAudio)) {
      out.set(a.id, {
        assetId: a.id,
        engine: 'none',
        language: null,
        text: '',
        words: [],
        generatedAt: new Date().toISOString(),
        optionalSkipped: true,
        skipReason: 'whisper CLI not installed — heuristic planner continues without transcripts',
      });
    }
    return out;
  }

  for (const asset of assets.filter((a) => a.kind === 'video' && a.hasAudio)) {
    const jsonPath = join(dir, `${asset.filename}.whisper.json`);
    if (existsSync(jsonPath)) {
      try {
        const cached = JSON.parse(readFileSync(jsonPath, 'utf8')) as Transcript;
        out.set(asset.id, cached);
        continue;
      } catch {
        // re-run
      }
    }

    try {
      const wav = join(dir, `${asset.filename}.16k.wav`);
      runCapture('ffmpeg', [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        asset.absPath,
        '-ar',
        '16000',
        '-ac',
        '1',
        wav,
      ]);

      runCapture(whisperBin, [
        wav,
        '--model',
        cfg.model,
        '--output_format',
        'json',
        '--output_dir',
        dir,
        ...(cfg.language && cfg.language !== 'auto' ? ['--language', cfg.language] : []),
      ]);

      const produced = join(dir, `${asset.filename}.16k.json`);
      const raw = JSON.parse(readFileSync(produced, 'utf8')) as {
        text?: string;
        segments?: Array<{ start: number; end: number; text: string }>;
      };
      const words =
        raw.segments?.flatMap((s) =>
          s.text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => ({ word: w, start_s: s.start, end_s: s.end })),
        ) || [];

      const transcript: Transcript = {
        assetId: asset.id,
        engine: `whisper:${cfg.model}`,
        language: cfg.language === 'auto' ? null : cfg.language,
        text: (raw.text || '').trim(),
        words,
        generatedAt: new Date().toISOString(),
      };
      writeFileSync(jsonPath, JSON.stringify(transcript, null, 2) + '\n');
      out.set(asset.id, transcript);
    } catch (err) {
      out.set(asset.id, {
        assetId: asset.id,
        engine: 'whisper-failed',
        language: null,
        text: '',
        words: [],
        generatedAt: new Date().toISOString(),
        optionalSkipped: true,
        skipReason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return out;
}
