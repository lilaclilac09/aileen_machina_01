#!/usr/bin/env node
/**
 * hx — Amp-style thin CLI dispatcher. All agent state lives in Harness core.
 */
import { parseArgs } from 'node:util';
import {
  cmdFooterDemo,
  cmdMcp,
  cmdRepl,
  cmdReview,
  cmdRun,
  cmdSession,
  cmdTools,
  printUsage,
} from '../src/adapters/cli.ts';
import { runCursorCli } from '../src/adapters/cursorCli.ts';
import type { HarnessName } from '../src/core/resolvedHarness.ts';

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      provider: { type: 'string', default: 'mock' },
      cwd: { type: 'string', default: process.cwd() },
      write: { type: 'boolean', default: false },
      shell: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      jsonl: { type: 'boolean', default: false },
      ab: { type: 'boolean', default: false },
      harness: { type: 'string' },
      execute: { type: 'string', short: 'x' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  if (positionals[0] === 'cursor') {
    const raw = process.argv.slice(2);
    const idx = raw.findIndex((a) => a === 'cursor');
    await runCursorCli(raw.slice(idx + 1));
    return;
  }

  if (values.help || (positionals.length === 0 && !values.execute)) printUsage();

  const [cmd, ...rest] = positionals.length ? positionals : ['run'];
  const harnessRaw = values.harness ? String(values.harness) : undefined;
  const harness = harnessRaw as HarnessName | undefined;
  if (harness && !['Codex', 'Nanocodex', 'hx'].includes(harness)) {
    throw new Error(`--harness must be Codex|Nanocodex|hx (got ${harnessRaw})`);
  }

  const flags = {
    provider: String(values.provider),
    cwd: String(values.cwd),
    write: Boolean(values.write),
    shell: Boolean(values.shell),
    json: Boolean(values.json),
    jsonl: Boolean(values.jsonl),
    ab: Boolean(values.ab),
    harness,
  };

  switch (cmd) {
    case 'tools':
      await cmdTools(flags);
      break;
    case 'footer-demo':
      await cmdFooterDemo(flags);
      break;
    case 'exec':
    case 'run': {
      const prompt = (values.execute ? String(values.execute) : rest.join(' ')).trim();
      if (!prompt) printUsage();
      await cmdRun(prompt, flags);
      break;
    }
    case 'review':
      await cmdReview(rest.join(' ').trim(), { ...flags, profile: 'review' });
      break;
    case 'repl':
      await cmdRepl(flags);
      break;
    case 'session':
      await cmdSession(rest[0] ?? 'show');
      break;
    case 'mcp':
      await cmdMcp(rest);
      break;
    default:
      printUsage();
  }
}

main().catch((err) => {
  console.error(`[hx] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
