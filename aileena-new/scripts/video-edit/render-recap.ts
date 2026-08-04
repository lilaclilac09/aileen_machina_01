/**
 * Execute work/final-edit.json → out/cafe-cursor-shanghai-recap.mp4
 *
 *   pnpm exec tsx scripts/video-edit/inventory.ts
 *   pnpm exec tsx scripts/video-edit/render-recap.ts
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { FinalEdit, EdlClip } from './inventory';

const ROOT = join(process.cwd(), 'scripts/video-edit');
const WORK = join(ROOT, 'work');
const CUTS = join(WORK, 'cuts');
const OUT = join(ROOT, 'out');
const EDL_PATH = join(WORK, 'final-edit.json');

function sh(cmd: string): void {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function renderClip(clip: EdlClip, index: number): string {
  const out = join(CUTS, `seg-${String(index).padStart(3, '0')}.mp4`);
  const dur = Math.max(0.5, clip.duration_s);

  if (clip.kind === 'title' || clip.kind === 'logo') {
    // Rasterize SVG via ffmpeg lavfi + svg if possible; fallback: color + drawtext is harder.
    // Convert SVG → PNG with rsvg/ffmpeg if available; else solid card via filter.
    const png = out.replace(/\.mp4$/, '.png');
    try {
      sh(
        `ffmpeg -y -hide_banner -loglevel error -i "${clip.source}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" "${png}"`,
      );
      sh(
        `ffmpeg -y -hide_banner -loglevel error -loop 1 -i "${png}" -t ${dur} -vf "format=yuv420p,fps=30" -c:v libx264 -pix_fmt yuv420p -an "${out}"`,
      );
    } catch {
      sh(
        `ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0f1c1b:s=1920x1080:d=${dur}" -vf "drawtext=text='Cafe Cursor Shanghai':fontsize=56:fontcolor=0x5ee0d6:x=(w-text_w)/2:y=(h-text_h)/2,format=yuv420p,fps=30" -c:v libx264 -pix_fmt yuv420p -an "${out}"`,
      );
    }
    return out;
  }

  if (clip.kind === 'photo') {
    sh(
      `ffmpeg -y -hide_banner -loglevel error -loop 1 -i "${clip.source}" -t ${dur} ` +
        `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0f1c1b,` +
        `zoompan=z='min(1.08,1+0.0015*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(dur * 30)}:s=1920x1080:fps=30,format=yuv420p" ` +
        `-c:v libx264 -pix_fmt yuv420p -an "${out}"`,
    );
    return out;
  }

  // video
  const ss = clip.start_s.toFixed(3);
  const to = clip.end_s.toFixed(3);
  sh(
    `ffmpeg -y -hide_banner -loglevel error -ss ${ss} -to ${to} -i "${clip.source}" ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0f1c1b,fps=30,format=yuv420p" ` +
      `-an -c:v libx264 -pix_fmt yuv420p "${out}"`,
  );
  return out;
}

function main(): void {
  if (!existsSync(EDL_PATH)) {
    throw new Error(`Missing ${EDL_PATH}. Run: pnpm exec tsx scripts/video-edit/inventory.ts`);
  }
  const edl = JSON.parse(readFileSync(EDL_PATH, 'utf8')) as FinalEdit;
  if (edl.notes.some((n) => n.includes('NO MEDIA'))) {
    console.error(edl.notes.join('\n'));
    console.error('\nDrop videos into takes/ and photos into photos/, then re-run inventory + render.');
    process.exit(2);
  }

  mkdirSync(CUTS, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  // clean old segs
  for (const f of readdirSync(CUTS)) {
    if (f.startsWith('seg-')) unlinkSync(join(CUTS, f));
  }

  const segs: string[] = [];
  let i = 0;
  for (const beat of edl.beats) {
    console.log(`\n=== Beat ${beat.beat}: ${beat.title} ===`);
    if (beat.clips.length === 0) {
      console.log('(empty — skipped)');
      continue;
    }
    for (const clip of beat.clips) {
      segs.push(renderClip(clip, i));
      i += 1;
    }
  }

  if (segs.length === 0) {
    throw new Error('No segments rendered — check media.');
  }

  const listPath = join(WORK, 'concat.txt');
  writeFileSync(
    listPath,
    segs.map((p) => `file '${p.replace(/'/g, `'\\''`)}'`).join('\n') + '\n',
  );

  const finalPath = join(OUT, 'cafe-cursor-shanghai-recap.mp4');
  sh(
    `ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i "${listPath}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${finalPath}"`,
  );
  console.log(`\nDone → ${finalPath}`);
  console.log(`Segments: ${segs.length}`);
}

main();
