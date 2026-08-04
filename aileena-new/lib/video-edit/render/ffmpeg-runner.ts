import { spawnSync } from 'node:child_process';

export class BinMissingError extends Error {
  constructor(name: string, hint: string) {
    super(`Missing required binary "${name}". ${hint}`);
    this.name = 'BinMissingError';
  }
}

export function which(bin: string): string | null {
  const r = spawnSync('bash', ['-lc', `command -v ${bin}`], { encoding: 'utf8' });
  const out = (r.stdout || '').trim();
  return r.status === 0 && out ? out : null;
}

export function requireBin(name: string, hint: string): string {
  const p = which(name);
  if (!p) throw new BinMissingError(name, hint);
  return p;
}

export function requireFfmpeg(): { ffmpeg: string; ffprobe: string } {
  return {
    ffmpeg: requireBin('ffmpeg', 'Install: https://ffmpeg.org/download.html (or brew install ffmpeg)'),
    ffprobe: requireBin('ffprobe', 'Install with ffmpeg'),
  };
}

export type RunResult = {
  status: number;
  stdout: string;
  stderr: string;
};

/** Safe argv-based runner — never interpolate paths into a shell string. */
export function run(
  bin: string,
  args: string[],
  opts: { inherit?: boolean; cwd?: string } = {},
): RunResult {
  const r = spawnSync(bin, args, {
    encoding: 'utf8',
    cwd: opts.cwd,
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  return {
    status: r.status ?? 1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

export function runOrThrow(bin: string, args: string[], label?: string): void {
  const pretty = `${bin} ${args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`;
  console.log(`$ ${pretty}`);
  const r = run(bin, args, { inherit: true });
  if (r.status !== 0) {
    throw new Error(`${label || bin} failed with exit ${r.status}`);
  }
}

export function runCapture(bin: string, args: string[]): string {
  const r = run(bin, args);
  if (r.status !== 0) {
    throw new Error(`${bin} failed: ${r.stderr || r.stdout || `exit ${r.status}`}`);
  }
  return (r.stdout || '').trim();
}
