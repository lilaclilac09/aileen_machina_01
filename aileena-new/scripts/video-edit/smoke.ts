/**
 * Synthetic-media smoke for cheap Cursor edit engine.
 * Creates tiny takes/photos, runs catalog→plan→render→verify, asserts QC ok.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { resolveProjectRoot, runRecap } from '../../lib/video-edit';

function sh(args: string[]): void {
  execSync(args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' '), { stdio: 'inherit' });
}

async function main(): Promise<void> {
  const root = resolveProjectRoot();
  const takes = join(root, 'takes');
  const photos = join(root, 'photos');
  const fixtureTag = '__smoke__';
  mkdirSync(takes, { recursive: true });
  mkdirSync(photos, { recursive: true });

  const v1 = join(takes, `${fixtureTag}-talk.mp4`);
  const v2 = join(takes, `${fixtureTag}-demo.mp4`);
  const p1 = join(photos, `${fixtureTag}-crowd.png`);

  // 8s tone video + 6s tone video
  sh([
    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000',
    '-t', '8', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', v1,
  ]);
  sh([
    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
    '-t', '6', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', v2,
  ]);
  // solid PNG
  sh([
    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=0x1a3a38:s=1600x900',
    '-frames:v', '1', p1,
  ]);

  const result = await runRecap({ skipWhisper: true });
  if (!result.outputPath || !existsSync(result.outputPath)) {
    throw new Error('Smoke failed: no output mp4');
  }
  if (!result.report?.ok) {
    console.error(JSON.stringify(result.report, null, 2));
    throw new Error('Smoke failed: verify-report ok=false');
  }

  console.log('\nSMOKE OK');
  console.log(' output:', result.outputPath);
  console.log(' duration≈', result.report.actualDuration_s);

  // cleanup fixtures only
  for (const f of [v1, v2, p1]) {
    try {
      rmSync(f);
    } catch {
      /* ignore */
    }
  }
  writeFileSync(join(root, 'work', 'smoke-ok.txt'), new Date().toISOString() + '\n');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
