/**
 * Scan takes/ + photos/ → work/final-edit.json for Cafe Cursor Shanghai recap.
 *
 *   pnpm exec tsx scripts/video-edit/inventory.ts
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const ROOT = join(process.cwd(), 'scripts/video-edit');
const TAKES = join(ROOT, 'takes');
const PHOTOS = join(ROOT, 'photos');
const WORK = join(ROOT, 'work');
const BRAND = join(ROOT, 'brand');

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv']);
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.tif', '.tiff']);

export type EdlClip = {
  id: string;
  kind: 'logo' | 'photo' | 'video' | 'title';
  source: string;
  start_s: number;
  end_s: number;
  duration_s: number;
  label: string;
  rationale: string;
};

export type EdlBeat = {
  beat: number;
  title: string;
  target_s: number;
  clips: EdlClip[];
};

export type FinalEdit = {
  event: string;
  generatedAt: string;
  script: string;
  logo: string | null;
  beats: EdlBeat[];
  notes: string[];
};

function sh(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function listMedia(dir: string, exts: Set<string>): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => !f.startsWith('.') && exts.has(extname(f).toLowerCase()))
    .map((f) => join(dir, f))
    .sort((a, b) => basename(a).localeCompare(basename(b)));
}

function probeDuration(path: string): number {
  try {
    const out = sh(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path}"`,
    );
    const n = Number(out);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function pickVideoWindow(duration: number): { start: number; end: number } {
  if (duration <= 0) return { start: 0, end: 3 };
  if (duration <= 6) return { start: 0, end: duration };
  // Prefer a mid-clip window — skips boot/pocket noise, avoids trailing dead air.
  const win = Math.min(7, Math.max(4, duration * 0.22));
  const start = Math.max(0.4, (duration - win) / 2);
  return { start, end: Math.min(duration - 0.2, start + win) };
}

function titleCardSvg(outPath: string): void {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1c1b"/>
      <stop offset="100%" stop-color="#16302e"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <text x="960" y="480" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="72" fill="#5ee0d6" letter-spacing="8">CAFE CURSOR</text>
  <text x="960" y="560" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="42" fill="#fffdf8">Shanghai · 2026.07.19</text>
  <text x="960" y="640" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="28" fill="rgba(255,253,248,0.55)">IRL · Credits · Community</text>
</svg>`;
  writeFileSync(outPath, svg);
}

function outroCardSvg(outPath: string): void {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#0f1c1b"/>
  <text x="960" y="470" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="48" fill="#fffdf8">Thanks — see you next time</text>
  <text x="960" y="560" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="36" fill="#5ee0d6">#CafeCursorShanghai</text>
  <text x="960" y="640" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="26" fill="rgba(255,253,248,0.5)">cursor-cafe.aileena.xyz</text>
</svg>`;
  writeFileSync(outPath, svg);
}

function main(): void {
  mkdirSync(WORK, { recursive: true });
  mkdirSync(join(WORK, 'cards'), { recursive: true });

  const videos = listMedia(TAKES, VIDEO_EXT);
  const photos = listMedia(PHOTOS, PHOTO_EXT);
  const logo = existsSync(join(BRAND, 'cursor-logo.svg'))
    ? join(BRAND, 'cursor-logo.svg')
    : null;

  const titlePath = join(WORK, 'cards', 'title.svg');
  const outroPath = join(WORK, 'cards', 'outro.svg');
  titleCardSvg(titlePath);
  outroCardSvg(outroPath);

  const notes: string[] = [];
  if (videos.length === 0 && photos.length === 0) {
    notes.push(
      'NO MEDIA YET — drop files into scripts/video-edit/takes/ and photos/, then re-run inventory.ts',
    );
  }

  // Round-robin photos into beats 2,3,4,5
  const photoPool = [...photos];
  const videoPool = videos.map((p) => {
    const d = probeDuration(p);
    const w = pickVideoWindow(d);
    return { path: p, duration: d, ...w };
  });

  function takePhotos(n: number, beatLabel: string): EdlClip[] {
    const out: EdlClip[] = [];
    for (let i = 0; i < n && photoPool.length; i += 1) {
      const src = photoPool.shift()!;
      out.push({
        id: `photo-${basename(src)}`,
        kind: 'photo',
        source: src,
        start_s: 0,
        end_s: 3.2,
        duration_s: 3.2,
        label: basename(src),
        rationale: `${beatLabel}: still as Ken-Burns B-roll`,
      });
    }
    return out;
  }

  function takeVideos(n: number, beatLabel: string): EdlClip[] {
    const out: EdlClip[] = [];
    for (let i = 0; i < n && videoPool.length; i += 1) {
      const v = videoPool.shift()!;
      out.push({
        id: `video-${basename(v.path)}`,
        kind: 'video',
        source: v.path,
        start_s: v.start,
        end_s: v.end,
        duration_s: v.end - v.start,
        label: basename(v.path),
        rationale: `${beatLabel}: mid-window ${v.start.toFixed(1)}–${v.end.toFixed(1)}s of ${v.duration.toFixed(1)}s take`,
      });
    }
    return out;
  }

  const beats: EdlBeat[] = [
    {
      beat: 1,
      title: 'Logo / title sting',
      target_s: 3,
      clips: [
        {
          id: 'title-card',
          kind: 'title',
          source: titlePath,
          start_s: 0,
          end_s: 3,
          duration_s: 3,
          label: 'title.svg',
          rationale: 'Brand-first open — Cafe Cursor Shanghai',
        },
      ],
    },
    {
      beat: 2,
      title: 'Arrival / vibe',
      target_s: 10,
      clips: [...takePhotos(2, 'vibe'), ...takeVideos(1, 'vibe')],
    },
    {
      beat: 3,
      title: 'Guest-led energy',
      target_s: 16,
      clips: [...takeVideos(2, 'demos'), ...takePhotos(2, 'demos')],
    },
    {
      beat: 4,
      title: 'Product moment (soft credits)',
      target_s: 10,
      clips: [...takePhotos(2, 'product'), ...takeVideos(1, 'product')],
    },
    {
      beat: 5,
      title: 'Community',
      target_s: 10,
      clips: [...takePhotos(2, 'community'), ...takeVideos(1, 'community')],
    },
    {
      beat: 6,
      title: 'Close',
      target_s: 4,
      clips: [
        {
          id: 'outro-card',
          kind: 'title',
          source: outroPath,
          start_s: 0,
          end_s: 4,
          duration_s: 4,
          label: 'outro.svg',
          rationale: 'Logo-last + hashtag #CafeCursorShanghai',
        },
      ],
    },
  ];

  // Dump leftovers into beat 5 so nothing is wasted silently
  while (photoPool.length || videoPool.length) {
    beats[4]!.clips.push(...takePhotos(1, 'community-extra'));
    beats[4]!.clips.push(...takeVideos(1, 'community-extra'));
  }

  const edl: FinalEdit = {
    event: 'Cafe Cursor Shanghai 20260719',
    generatedAt: new Date().toISOString(),
    script: join(ROOT, 'script.md'),
    logo,
    beats,
    notes,
  };

  const outPath = join(WORK, 'final-edit.json');
  writeFileSync(outPath, JSON.stringify(edl, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Videos: ${videos.length} · Photos: ${photos.length}`);
  for (const n of notes) console.log(`NOTE: ${n}`);
  for (const b of beats) {
    const dur = b.clips.reduce((s, c) => s + c.duration_s, 0);
    console.log(`  Beat ${b.beat} ${b.title}: ${b.clips.length} clips · ~${dur.toFixed(1)}s`);
  }
}

main();
