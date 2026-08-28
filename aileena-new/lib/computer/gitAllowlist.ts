/**
 * Allowlisted git inspection. Argv only — never a shell string.
 * No reset, clean, push, merge, checkout, or config injection.
 */

import { spawn } from 'node:child_process';
import { findRepoRoot } from './inspect';
import { clip, redactSecrets } from './redact';

const GIT_VERBS = new Set(['status', 'log', 'show', 'diff']);
const HASH = /^[0-9a-f]{7,40}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:]{5,8})?$/;
const PATH = /^(?!-)[a-zA-Z0-9_./-]+$/;
const SOUND_PATHS = [
  'aileena-new/components/DJStation.tsx',
  'aileena-new/app/sound',
  'aileena-new/lib/djSetlist.ts',
  'aileena-new/components/TrackLibraryBrowser.tsx',
];

export type GitCommitRow = {
  hash: string;
  date: string;
  message: string;
  filesChanged: number;
  soundFiles: string[];
  merge: boolean;
  why: string;
};

export type GitInspectResult = {
  action: string;
  ok: boolean;
  summary: string;
  lines: string[];
  candidates: GitCommitRow[];
};

function runGit(args: string[], timeoutMs = 12_000): Promise<{ code: number; out: string; err: string }> {
  const verb = args[0];
  if (!verb || !GIT_VERBS.has(verb)) {
    return Promise.resolve({ code: 2, out: '', err: 'git verb not allowlisted' });
  }
  if (args.some((a) => a === '-c' || a.startsWith('--exec') || a === '--upload-pack')) {
    return Promise.resolve({ code: 2, out: '', err: 'git flag not allowlisted' });
  }
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      cwd: findRepoRoot(),
      env: {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: process.env.HOME ?? '',
        NODE_ENV: process.env.NODE_ENV ?? 'development',
        GIT_OPTIONAL_LOCKS: '0',
        LANG: 'C',
      } as NodeJS.ProcessEnv,
      timeout: timeoutMs,
    });
    let out = '';
    let err = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
      if (out.length > 80_000) out = out.slice(0, 80_000);
    });
    child.stderr?.on('data', (d) => {
      err += String(d);
      if (err.length > 8_000) err = err.slice(0, 8_000);
    });
    child.on('error', (e) => resolve({ code: 1, out: '', err: e.message }));
    child.on('close', (code) => resolve({ code: code ?? 1, out, err }));
  });
}

function parseLog(out: string): { hash: string; date: string; message: string }[] {
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, date, ...rest] = line.split('\t');
      return { hash: hash || '', date: date || '', message: rest.join('\t') };
    })
    .filter((r) => HASH.test(r.hash));
}

async function filesTouched(hash: string): Promise<string[]> {
  const names = await runGit(['diff', '--name-only', `${hash}^`, hash]);
  if (names.code === 0 && names.out.trim()) {
    return names.out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 80);
  }
  const stat = await runGit(['show', '--stat', '--format=', hash]);
  return (stat.out.match(/^\s*[^|\n]+\s+\|\s+/gm) || [])
    .map((l) => l.replace(/\s+\|\s+.*$/, '').trim())
    .filter(Boolean)
    .slice(0, 80);
}

async function enrich(row: { hash: string; date: string; message: string }): Promise<GitCommitRow> {
  const files = await filesTouched(row.hash);
  const soundFiles = files.filter((f) => /sound|dj|djStation|djSet|mixbooth/i.test(f)).slice(0, 12);
  const merge = /^merge\b/i.test(row.message);
  const revert = /^revert\b/i.test(row.message);
  const whyBits: string[] = [];
  if (merge && /sound/i.test(row.message)) whyBits.push('merge commit whose message names Sound Lab');
  else if (merge) whyBits.push('merge commit');
  if (revert && /sound/i.test(row.message)) whyBits.push('rollback / revert of Sound Lab');
  if (soundFiles.length) whyBits.push(`${soundFiles.length} sound-related files`);
  if (/sound/i.test(row.message) && !merge && !revert) whyBits.push('message mentions sound');
  return {
    hash: row.hash,
    date: row.date,
    message: row.message,
    filesChanged: files.length,
    soundFiles,
    merge,
    why: whyBits.join('; ') || 'matched search',
  };
}

export async function gitStatus(): Promise<GitInspectResult> {
  const r = await runGit(['status', '--short']);
  const lines = redactSecrets(r.out).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 80);
  return {
    action: 'status',
    ok: r.code === 0,
    summary: lines.length ? `${lines.length} dirty paths` : 'working tree clean (or empty status)',
    lines: lines.length ? lines : ['(clean)'],
    candidates: [],
  };
}

export async function gitLog(opts: {
  n?: number;
  since?: string;
  until?: string;
  path?: string;
  grep?: string;
  merges?: boolean;
}): Promise<GitInspectResult> {
  const n = Math.min(Math.max(opts.n ?? 50, 1), 50);
  const args = ['log', '--decorate=short', '--date=iso', `--format=%h\t%cI\t%s%d`, `--max-count=${n}`, '--all'];
  if (opts.merges) args.push('--merges');
  if (opts.since && DATE.test(opts.since)) args.push(`--since=${opts.since}`);
  if (opts.until && DATE.test(opts.until)) args.push(`--until=${opts.until}`);
  if (opts.grep) {
    const g = opts.grep.trim().slice(0, 80);
    if (g && !g.startsWith('-')) args.push(`--grep=${g}`, '-i');
  }
  if (opts.path) {
    const p = opts.path.trim();
    if (!PATH.test(p) || p.includes('..')) {
      return { action: 'log', ok: false, summary: 'path not allowlisted', lines: [], candidates: [] };
    }
    args.push('--', p);
  }
  const r = await runGit(args);
  const rows = parseLog(r.out);
  return {
    action: 'log',
    ok: r.code === 0,
    summary: `${rows.length} commits`,
    lines: rows.map((x) => `${x.hash}  ${x.date.slice(0, 10)}  ${x.message}`),
    candidates: [],
  };
}

export async function gitShow(hash: string): Promise<GitInspectResult> {
  if (!HASH.test(hash)) {
    return { action: 'show', ok: false, summary: 'bad hash', lines: [], candidates: [] };
  }
  const r = await runGit(['show', '--stat', '--format=%h%n%cI%n%s', hash]);
  const lines = redactSecrets(r.out).split('\n').slice(0, 80);
  return {
    action: 'show',
    ok: r.code === 0,
    summary: clip(lines[2] || hash, 120),
    lines,
    candidates: [],
  };
}

export async function gitDiffStat(a: string, b: string): Promise<GitInspectResult> {
  if (!HASH.test(a) || !HASH.test(b)) {
    return { action: 'diff', ok: false, summary: 'bad hash', lines: [], candidates: [] };
  }
  const r = await runGit(['diff', '--stat', `${a}..${b}`]);
  const names = await runGit(['diff', '--name-status', `${a}..${b}`]);
  const lines = redactSecrets(`${r.out}\n${names.out}`).split('\n').filter(Boolean).slice(0, 80);
  return {
    action: 'diff',
    ok: r.code === 0,
    summary: clip(lines[lines.length - 1] || 'diff', 160),
    lines,
    candidates: [],
  };
}

export async function gitFindCommit(query: string): Promise<GitInspectResult> {
  const q = query.trim().slice(0, 160) || 'sound';
  const soundish = /sound|dj|mix|deck|lab/i.test(q);
  const seen = new Map<string, { hash: string; date: string; message: string }>();

  const add = (rows: { hash: string; date: string; message: string }[]) => {
    for (const row of rows) {
      if (!seen.has(row.hash)) seen.set(row.hash, row);
    }
  };

  const merges = await gitLog({ n: 50, merges: true, grep: soundish ? 'sound' : q.split(/\s+/).slice(-3).join(' ') });
  add(parseLogFromLines(merges.lines));

  const grepped = await runGit([
    'log',
    '--date=iso',
    `--format=%h\t%cI\t%s`,
    '--max-count=40',
    '--all',
    `--grep=${soundish ? 'sound' : q.slice(0, 40)}`,
    '-i',
  ]);
  add(parseLog(grepped.out));

  if (soundish) {
    const pathLog = await runGit([
      'log',
      '--date=iso',
      `--format=%h\t%cI\t%s`,
      '--max-count=30',
      '--all',
      '--',
      ...SOUND_PATHS,
    ]);
    add(parseLog(pathLog.out));
  }

  const ranked = [...seen.values()]
    .sort((a, b) => score(b, q) - score(a, q) || (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const candidates: GitCommitRow[] = [];
  for (const row of ranked) {
    candidates.push(await enrich(row));
  }
  const top = candidates
    .sort((a, b) => rankRow(b, q) - rankRow(a, q))
    .slice(0, 5);

  return {
    action: 'find_commit',
    ok: top.length > 0,
    summary: top.length ? `${top.length} candidates` : 'no candidates',
    lines: top.map(
      (c) =>
        `${c.hash}  ${c.date.slice(0, 10)}  ${c.message}  files=${c.filesChanged}  sound=${c.soundFiles.length}  ${c.why}`,
    ),
    candidates: top,
  };
}

function parseLogFromLines(lines: string[]): { hash: string; date: string; message: string }[] {
  return lines
    .map((line) => {
      const m = /^([0-9a-f]{7,40})\s+(\S+)\s+(.*)$/i.exec(line);
      if (!m) return null;
      return { hash: m[1], date: m[2], message: m[3] };
    })
    .filter((x): x is { hash: string; date: string; message: string } => Boolean(x));
}

function score(row: { message: string }, q: string): number {
  let s = 0;
  if (/^merge\b/i.test(row.message)) s += 5;
  if (/sound/i.test(row.message)) s += 6;
  if (/revert\b/i.test(row.message)) s += 4;
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  for (const w of words) {
    if (row.message.toLowerCase().includes(w)) s += 1;
  }
  return s;
}

function rankRow(row: GitCommitRow, q: string): number {
  return (
    score(row, q) +
    (row.merge && /sound/i.test(row.message) ? 8 : 0) +
    (/^revert\b/i.test(row.message) && /sound/i.test(row.message) ? 7 : 0) +
    row.soundFiles.length +
    (row.filesChanged > 0 ? 1 : 0)
  );
}

export function formatCandidates(result: GitInspectResult): string {
  if (!result.candidates.length) return result.summary;
  const header = 'hash | date | message | files | sound files | why';
  const rows = result.candidates.map(
    (c) =>
      `${c.hash} | ${c.date.slice(0, 10)} | ${clip(c.message, 72)} | ${c.filesChanged} | ${c.soundFiles.slice(0, 4).join(', ') || '—'} | ${clip(c.why, 80)}`,
  );
  return [header, ...rows].join('\n');
}
