import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function shellRun(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function shellRunInherit(cmd: string): void {
  execSync(cmd, { stdio: 'inherit' });
}

export function requireBin(name: string, installHint: string): void {
  try {
    shellRun(`command -v ${name}`);
  } catch {
    throw new Error(`Missing required binary "${name}". ${installHint}`);
  }
}

export function checkMediaDeps(): void {
  requireBin('yt-dlp', 'Install: https://github.com/yt-dlp/yt-dlp#installation');
  requireBin('ffmpeg', 'Install: https://ffmpeg.org/download.html');
  requireBin('ffprobe', 'Install with ffmpeg');
}

export function ffprobeDuration_s(mediaPath: string): number {
  const out = shellRun(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mediaPath}"`,
  );
  const n = Number(out);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Could not read duration from ${mediaPath}`);
  return n;
}

export function findSourceMedia(workDir: string): string {
  const preferred = ['source.mp4', 'source.mkv', 'source.webm', 'source.m4a', 'source.mp3'];
  for (const name of preferred) {
    const p = join(workDir, name);
    if (existsSync(p)) return p;
  }
  const loose = readdirSync(workDir).find((f) => /^source\.[a-z0-9]+$/i.test(f));
  if (loose) return join(workDir, loose);
  throw new Error(`No source media in ${workDir}. Run download first.`);
}

export function downloadYoutube(url: string, workDir: string): { title: string; sourcePath: string } {
  mkdirSync(workDir, { recursive: true });
  const template = join(workDir, 'source.%(ext)s');
  const title = shellRun(`yt-dlp --print title --skip-download "${url}"`);
  shellRunInherit(
    `yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "${template}" "${url}"`,
  );
  const sourcePath = findSourceMedia(workDir);
  writeFileSync(
    join(workDir, 'metadata.json'),
    JSON.stringify({ url, title, downloadedAt: new Date().toISOString() }, null, 2),
  );
  return { title, sourcePath };
}

export function convertToWav(sourcePath: string, wavPath: string): void {
  shellRunInherit(`ffmpeg -y -i "${sourcePath}" -ar 16000 -ac 1 "${wavPath}"`);
}

export function extractBatchWav(
  fullWav: string,
  start_s: number,
  duration_s: number,
  outPath: string,
): void {
  shellRunInherit(
    `ffmpeg -y -ss ${start_s} -t ${duration_s} -i "${fullWav}" -ar 16000 -ac 1 "${outPath}"`,
  );
}

export function extractWindowWav(
  fullWav: string,
  start_s: number,
  duration_s: number,
  outPath: string,
): void {
  shellRunInherit(
    `ffmpeg -y -ss ${start_s} -t ${duration_s} -i "${fullWav}" -ar 16000 -ac 1 "${outPath}"`,
  );
}

export function renderClipToFile(
  sourcePath: string,
  start_s: number,
  end_s: number,
  outPath: string,
  audioOnly: boolean,
): void {
  const duration = Math.max(0.5, end_s - start_s);
  if (audioOnly) {
    shellRunInherit(
      `ffmpeg -y -ss ${start_s} -t ${duration} -i "${sourcePath}" -vn -c:a aac -b:a 192k "${outPath}"`,
    );
    return;
  }
  shellRunInherit(
    `ffmpeg -y -ss ${start_s} -t ${duration} -i "${sourcePath}" -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 192k -movflags +faststart "${outPath}"`,
  );
}

export function renderClipToBuffer(
  sourcePath: string,
  start_s: number,
  end_s: number,
  audioOnly: boolean,
): Buffer {
  const duration = Math.max(0.5, end_s - start_s);
  const args = audioOnly
    ? `-ss ${start_s} -t ${duration} -i "${sourcePath}" -vn -c:a aac -b:a 128k -f adts pipe:1`
    : `-ss ${start_s} -t ${duration} -i "${sourcePath}" -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 128k -movflags frag_keyframe+empty_moov -f mp4 pipe:1`;
  return execSync(`ffmpeg -y ${args}`, { stdio: ['ignore', 'pipe', 'pipe'] });
}
