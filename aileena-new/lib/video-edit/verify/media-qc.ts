import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { FinalEdit, VerificationReport } from '../domain/types';
import { VerificationReportSchema } from '../domain/schemas';
import { toAbs } from '../domain/paths';
import { requireFfmpeg, runCapture } from '../render/ffmpeg-runner';

function expectedDuration(edl: FinalEdit): number {
  return edl.beats.reduce(
    (sum, b) => sum + b.clips.filter((c) => c.enabled).reduce((s, c) => s + c.duration_s, 0),
    0,
  );
}

export function verifyRender(
  root: string,
  edl: FinalEdit,
  outputPath: string | null,
): VerificationReport {
  const checks: VerificationReport['checks'] = [];
  const notes: string[] = [];

  const exp = expectedDuration(edl);
  checks.push({
    id: 'edl-has-enabled-clips',
    ok: exp > 0,
    detail: `expected timeline ~${exp.toFixed(2)}s`,
  });

  const noMedia = edl.notes.some((n) => n.includes('NO MEDIA'));
  checks.push({
    id: 'media-present',
    ok: !noMedia,
    detail: noMedia ? 'EDL notes say NO MEDIA' : 'media referenced in EDL',
  });

  // Source existence
  let missing = 0;
  for (const beat of edl.beats) {
    for (const clip of beat.clips.filter((c) => c.enabled)) {
      const abs = toAbs(root, clip.source);
      if (!existsSync(abs)) {
        missing += 1;
        notes.push(`Missing source: ${clip.source}`);
      }
    }
  }
  checks.push({
    id: 'sources-exist',
    ok: missing === 0,
    detail: missing === 0 ? 'all sources found' : `${missing} missing source(s)`,
  });

  let actualDuration: number | null = null;
  let hasVideo: boolean | null = null;
  let hasAudio: boolean | null = null;
  let width: number | null = null;
  let height: number | null = null;

  if (outputPath && existsSync(outputPath)) {
    try {
      requireFfmpeg();
      const raw = runCapture('ffprobe', [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        outputPath,
      ]);
      const data = JSON.parse(raw) as {
        format?: { duration?: string };
        streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
      };
      actualDuration = Number(data.format?.duration);
      if (!Number.isFinite(actualDuration)) actualDuration = null;
      hasVideo = Boolean(data.streams?.some((s) => s.codec_type === 'video'));
      hasAudio = Boolean(data.streams?.some((s) => s.codec_type === 'audio'));
      const vs = data.streams?.find((s) => s.codec_type === 'video');
      width = vs?.width ?? null;
      height = vs?.height ?? null;

      checks.push({
        id: 'output-exists',
        ok: true,
        detail: outputPath,
      });
      checks.push({
        id: 'output-has-video',
        ok: Boolean(hasVideo),
        detail: hasVideo ? 'video stream present' : 'no video stream',
      });
      if (edl.output.keepAudio) {
        checks.push({
          id: 'output-has-audio-stream',
          ok: Boolean(hasAudio),
          detail: hasAudio
            ? 'audio stream present (may be silence on cards)'
            : 'no audio stream',
        });
      }
      if (actualDuration != null && exp > 0) {
        const drift = Math.abs(actualDuration - exp);
        const ok = drift < Math.max(2, exp * 0.25);
        checks.push({
          id: 'duration-near-expected',
          ok,
          detail: `actual=${actualDuration.toFixed(2)}s expected≈${exp.toFixed(2)}s drift=${drift.toFixed(2)}s`,
        });
      }
      if (width && height) {
        checks.push({
          id: 'resolution',
          ok: width === edl.output.width && height === edl.output.height,
          detail: `${width}x${height} (want ${edl.output.width}x${edl.output.height})`,
        });
      }
    } catch (err) {
      checks.push({
        id: 'output-probe',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    checks.push({
      id: 'output-exists',
      ok: false,
      detail: outputPath ? `missing file: ${outputPath}` : 'no output path',
    });
  }

  const report: VerificationReport = {
    schemaVersion: 1,
    projectId: edl.projectId,
    generatedAt: new Date().toISOString(),
    ok: checks.every((c) => c.ok),
    edlPath: join(root, 'work/final-edit.json'),
    outputPath,
    expectedDuration_s: exp,
    actualDuration_s: actualDuration,
    hasVideo,
    hasAudio,
    width,
    height,
    checks,
    notes,
  };

  return VerificationReportSchema.parse(report);
}

export function writeVerifyReport(path: string, report: VerificationReport): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
}
