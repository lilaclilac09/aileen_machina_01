import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EdlClip, FinalEdit, OutputSpec } from '../domain/types';
import { toAbs } from '../domain/paths';
import { requireFfmpeg, runOrThrow } from './ffmpeg-runner';

function videoFilter(spec: OutputSpec): string {
  const { width: w, height: h, padColor, fps } = spec;
  return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${padColor},fps=${fps},format=yuv420p`;
}

function renderTitle(clip: EdlClip, out: string, root: string, spec: OutputSpec): void {
  const { ffmpeg } = requireFfmpeg();
  const src = toAbs(root, clip.source);
  const dur = Math.max(0.5, clip.duration_s);
  const png = out.replace(/\.mp4$/, '.png');

  try {
    runOrThrow(
      ffmpeg,
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', src,
        '-vf', `scale=${spec.width}:${spec.height}:force_original_aspect_ratio=decrease,pad=${spec.width}:${spec.height}:(ow-iw)/2:(oh-ih)/2:color=${spec.padColor}`,
        png,
      ],
      'svg-raster',
    );
    runOrThrow(
      ffmpeg,
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-loop', '1', '-i', png,
        '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-t', String(dur),
        '-vf', `fps=${spec.fps},format=yuv420p`,
        '-c:v', spec.videoCodec, '-preset', spec.preset, '-crf', String(spec.crf),
        '-c:a', spec.audioCodec, '-b:a', '128k',
        '-shortest', '-pix_fmt', 'yuv420p',
        out,
      ],
      'title-card',
    );
  } catch {
    runOrThrow(
      ffmpeg,
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', `color=c=${spec.padColor}:s=${spec.width}x${spec.height}:d=${dur}:r=${spec.fps}`,
        '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-t', String(dur),
        '-c:v', spec.videoCodec, '-pix_fmt', 'yuv420p',
        '-c:a', spec.audioCodec, '-b:a', '128k',
        '-shortest',
        out,
      ],
      'title-fallback',
    );
  }
}

function renderPhoto(clip: EdlClip, out: string, root: string, spec: OutputSpec): void {
  const { ffmpeg } = requireFfmpeg();
  const src = toAbs(root, clip.source);
  const dur = Math.max(0.5, clip.duration_s);
  const frames = Math.round(dur * spec.fps);
  const vf =
    `scale=${spec.width}:${spec.height}:force_original_aspect_ratio=decrease,` +
    `pad=${spec.width}:${spec.height}:(ow-iw)/2:(oh-ih)/2:color=${spec.padColor},` +
    `zoompan=z='min(1.08,1+0.0015*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${spec.width}x${spec.height}:fps=${spec.fps},format=yuv420p`;

  runOrThrow(
    ffmpeg,
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-loop', '1', '-i', src,
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-t', String(dur),
      '-vf', vf,
      '-c:v', spec.videoCodec, '-preset', spec.preset, '-crf', String(spec.crf),
      '-c:a', spec.audioCodec, '-b:a', '128k',
      '-shortest', '-pix_fmt', 'yuv420p',
      out,
    ],
    'photo-kenburns',
  );
}

function renderVideo(clip: EdlClip, out: string, root: string, spec: OutputSpec): void {
  const { ffmpeg } = requireFfmpeg();
  const src = toAbs(root, clip.source);
  if (!existsSync(src)) throw new Error(`Missing source: ${src}`);
  const dur = Math.max(0.5, clip.duration_s);
  const ss = clip.start_s.toFixed(3);
  const keepAudio = Boolean(spec.keepAudio && clip.audio?.keep !== false);
  const fadeIn = spec.audioFadeIn_s;
  const fadeOut = spec.audioFadeOut_s;
  const fadeOutStart = Math.max(0, dur - fadeOut);

  if (keepAudio) {
    try {
      runOrThrow(
        ffmpeg,
        [
          '-y', '-hide_banner', '-loglevel', 'error',
          '-ss', ss, '-t', dur.toFixed(3), '-i', src,
          '-vf', videoFilter(spec),
          '-af', `afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}`,
          '-c:v', spec.videoCodec, '-preset', spec.preset, '-crf', String(spec.crf),
          '-pix_fmt', 'yuv420p',
          '-c:a', spec.audioCodec, '-b:a', spec.audioBitrate,
          out,
        ],
        `video-${clip.id}`,
      );
      return;
    } catch {
      // fall through to silent track
    }
  }

  runOrThrow(
    ffmpeg,
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-ss', ss, '-t', dur.toFixed(3), '-i', src,
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-vf', videoFilter(spec),
      '-c:v', spec.videoCodec, '-preset', spec.preset, '-crf', String(spec.crf),
      '-pix_fmt', 'yuv420p',
      '-c:a', spec.audioCodec, '-b:a', '128k',
      '-shortest',
      '-map', '0:v:0', '-map', '1:a:0',
      out,
    ],
    `video-silent-${clip.id}`,
  );
}

export function renderClip(
  clip: EdlClip,
  index: number,
  root: string,
  cutsDir: string,
  spec: OutputSpec,
): string {
  const out = join(cutsDir, `seg-${String(index).padStart(3, '0')}.mp4`);
  if (!clip.enabled) return out;

  if (clip.kind === 'title' || clip.kind === 'logo') {
    renderTitle(clip, out, root, spec);
  } else if (clip.kind === 'photo') {
    renderPhoto(clip, out, root, spec);
  } else {
    renderVideo(clip, out, root, spec);
  }
  return out;
}

export function renderEdit(root: string, edl: FinalEdit): { segments: string[]; cutsDir: string } {
  requireFfmpeg();
  const cuts = join(root, 'work', 'cuts');
  mkdirSync(cuts, { recursive: true });

  for (const f of readdirSync(cuts)) {
    if (f.startsWith('seg-') || f.endsWith('.png')) {
      try {
        unlinkSync(join(cuts, f));
      } catch {
        /* ignore */
      }
    }
  }

  const segments: string[] = [];
  let i = 0;
  for (const beat of edl.beats) {
    console.log(`\n=== Beat ${beat.beat}: ${beat.title} ===`);
    const enabled = beat.clips.filter((c) => c.enabled);
    if (enabled.length === 0) {
      console.log('(empty — skipped)');
      continue;
    }
    for (const clip of enabled) {
      console.log(`  · ${clip.kind} ${clip.label} (${clip.duration_s.toFixed(1)}s)`);
      segments.push(renderClip(clip, i, root, cuts, edl.output));
      i += 1;
    }
  }

  if (segments.length === 0) {
    throw new Error('No segments rendered — check media / enabled clips.');
  }

  return { segments, cutsDir: cuts };
}

export function writeConcatList(listPath: string, segments: string[]): void {
  const body = segments.map((p) => `file '${p.replace(/'/g, `'\\''`)}'`).join('\n') + '\n';
  writeFileSync(listPath, body);
}

export function concatSegments(listPath: string, finalPath: string, spec: OutputSpec): void {
  const { ffmpeg } = requireFfmpeg();
  mkdirSync(join(finalPath, '..'), { recursive: true });
  runOrThrow(
    ffmpeg,
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'concat', '-safe', '0', '-i', listPath,
      '-c:v', spec.videoCodec, '-preset', spec.preset, '-crf', String(spec.crf),
      '-pix_fmt', 'yuv420p',
      '-c:a', spec.audioCodec, '-b:a', spec.audioBitrate,
      '-movflags', '+faststart',
      finalPath,
    ],
    'concat',
  );
}
