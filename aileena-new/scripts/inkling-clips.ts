#!/usr/bin/env tsx
/**
 * Inkling long-form audio clip tool (CLI).
 *
 *   pnpm inkling:clips -- 'https://www.youtube.com/watch?v=...' --best 5
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { USAGE } from '../lib/inkling/clips';
import { checkMediaDeps } from '../lib/inkling/media';
import { defaultWorkDir, runInklingClipPipeline } from '../lib/inkling/pipeline';

const ROOT = process.cwd();

type CliOptions = {
  url?: string;
  mode: 'best' | 'query';
  bestCount: number;
  query?: string;
  batchSeconds: number;
  overlapSeconds: number;
  padSeconds: number;
  dryRun: boolean;
  skipDownload: boolean;
  audioOnly: boolean;
  workDir?: string;
  help: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mode: 'best',
    bestCount: 5,
    batchSeconds: 900,
    overlapSeconds: 30,
    padSeconds: 20,
    dryRun: false,
    skipDownload: false,
    audioOnly: false,
    help: false,
  };

  const rest = argv.filter((a) => a !== '--');
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
      continue;
    }
    if (arg === '--dry-run') {
      opts.dryRun = true;
      continue;
    }
    if (arg === '--skip-download') {
      opts.skipDownload = true;
      continue;
    }
    if (arg === '--audio-only') {
      opts.audioOnly = true;
      continue;
    }
    if (arg === '--best') {
      opts.mode = 'best';
      const next = rest[i + 1];
      if (next && /^\d+$/.test(next)) {
        opts.bestCount = Number(next);
        i += 1;
      }
      continue;
    }
    if (arg === '--query') {
      opts.mode = 'query';
      const next = rest[i + 1];
      if (!next) throw new Error('--query requires a string argument');
      opts.query = next;
      i += 1;
      continue;
    }
    if (arg === '--batch-seconds') {
      opts.batchSeconds = Number(rest[++i]);
      continue;
    }
    if (arg === '--overlap-seconds') {
      opts.overlapSeconds = Number(rest[++i]);
      continue;
    }
    if (arg === '--pad-seconds') {
      opts.padSeconds = Number(rest[++i]);
      continue;
    }
    if (arg === '--work-dir') {
      opts.workDir = rest[++i];
      continue;
    }
    if (arg.startsWith('-')) throw new Error(`Unknown flag: ${arg}`);
    if (!opts.url) opts.url = arg;
  }

  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return;
  }
  if (!opts.url) {
    console.error(USAGE);
    process.exit(1);
  }
  if (opts.mode === 'query' && !opts.query) {
    throw new Error('--query requires a non-empty string');
  }

  checkMediaDeps();

  const workDir = opts.workDir ?? defaultWorkDir(ROOT, opts.url);
  const result = await runInklingClipPipeline({
    url: opts.url,
    mode: opts.mode,
    bestCount: opts.bestCount,
    query: opts.query,
    batchSeconds: opts.batchSeconds,
    overlapSeconds: opts.overlapSeconds,
    padSeconds: opts.padSeconds,
    dryRun: opts.dryRun,
    audioOnly: opts.audioOnly,
    workDir,
    skipDownload: opts.skipDownload,
    onProgress: (p) => console.log(`[${p.progress}%] ${p.message}`),
  });

  writeFileSync(join(workDir, 'candidates.json'), JSON.stringify(result, null, 2));
  console.log(`Work dir: ${workDir}`);
  console.log(`Title: ${result.title}`);
  console.log(`Candidates: ${result.candidates.length}`);
  if (!opts.dryRun) {
    console.log(`Clips: ${result.clips.length}`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
