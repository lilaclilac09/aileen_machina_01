import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import type { MediaAsset, MediaKind, Orientation } from '../domain/types';
import { requireFfmpeg, runCapture } from '../render/ffmpeg-runner';

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv']);
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.tif', '.tiff']);
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.aac', '.flac']);

export function classifyExt(ext: string): MediaKind {
  const e = ext.toLowerCase();
  if (VIDEO_EXT.has(e)) return 'video';
  if (PHOTO_EXT.has(e)) return 'photo';
  if (AUDIO_EXT.has(e)) return 'audio';
  return 'unknown';
}

export function isSupportedMedia(filename: string): boolean {
  return classifyExt(extname(filename)) !== 'unknown';
}

function orientationOf(w: number | null, h: number | null, rotation: number | null): Orientation {
  if (!w || !h) return 'unknown';
  let ww = w;
  let hh = h;
  if (rotation === 90 || rotation === 270 || rotation === -90) {
    ww = h;
    hh = w;
  }
  if (ww === hh) return 'square';
  return ww > hh ? 'landscape' : 'portrait';
}

function safeSha256(absPath: string, bytes: number): string | undefined {
  // Skip hashing huge files by default (>80MB) — still catalog them.
  if (bytes > 80 * 1024 * 1024) return undefined;
  try {
    return createHash('sha256').update(readFileSync(absPath)).digest('hex').slice(0, 16);
  } catch {
    return undefined;
  }
}

type ProbeJson = {
  format?: { duration?: string; size?: string };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    avg_frame_rate?: string;
    r_frame_rate?: string;
    tags?: Record<string, string>;
    side_data_list?: Array<{ rotation?: number }>;
  }>;
};

function parseFps(rate: string | undefined): number | null {
  if (!rate || rate === '0/0') return null;
  const [a, b] = rate.split('/').map(Number);
  if (!b || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  const fps = a / b;
  return Number.isFinite(fps) && fps > 0 ? fps : null;
}

export function probeAsset(absPath: string, relPath: string): MediaAsset {
  const ext = extname(absPath).toLowerCase();
  const kind = classifyExt(ext);
  const filename = basename(absPath);
  const st = statSync(absPath);
  const id = `${kind}:${filename}`;

  const base: MediaAsset = {
    id,
    kind,
    relPath,
    absPath,
    filename,
    ext,
    bytes: st.size,
    sha256: safeSha256(absPath, st.size),
    duration_s: null,
    width: null,
    height: null,
    fps: null,
    rotation: null,
    orientation: 'unknown',
    hasVideo: false,
    hasAudio: false,
    videoCodec: null,
    audioCodec: null,
    probeOk: false,
  };

  try {
    requireFfmpeg();
    const raw = runCapture('ffprobe', [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      absPath,
    ]);
    const data = JSON.parse(raw) as ProbeJson;
    const duration = Number(data.format?.duration);
    base.duration_s = Number.isFinite(duration) && duration > 0 ? duration : null;

    for (const s of data.streams || []) {
      if (s.codec_type === 'video' && !base.hasVideo) {
        base.hasVideo = true;
        base.videoCodec = s.codec_name || null;
        base.width = s.width ?? null;
        base.height = s.height ?? null;
        base.fps = parseFps(s.avg_frame_rate) ?? parseFps(s.r_frame_rate);
        const tagRot = s.tags?.rotate ? Number(s.tags.rotate) : null;
        const sideRot = s.side_data_list?.find((x) => typeof x.rotation === 'number')?.rotation ?? null;
        base.rotation = Number.isFinite(tagRot as number)
          ? (tagRot as number)
          : Number.isFinite(sideRot as number)
            ? (sideRot as number)
            : null;
      }
      if (s.codec_type === 'audio' && !base.hasAudio) {
        base.hasAudio = true;
        base.audioCodec = s.codec_name || null;
      }
    }

    // Photos: treat still as photo even if ffprobe reports image "video" stream
    if (kind === 'photo') {
      base.hasVideo = false;
      if (base.duration_s === null) base.duration_s = 0;
    }

    base.orientation = orientationOf(base.width, base.height, base.rotation);
    base.probeOk = true;
    return base;
  } catch (err) {
    base.probeError = err instanceof Error ? err.message : String(err);
    base.probeOk = false;
    return base;
  }
}
