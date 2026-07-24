#!/usr/bin/env node
/**
 * hx — Amp-style thin CLI dispatcher. All agent state lives in Harness core.
 */
import { parseArgs } from 'node:util';
import {
  cmdMcp,
  cmdRepl,
  cmdReview,
  cmdRun,
  cmdSession,
  cmdTools,
  printUsage,
} from '../src/adapters/cli.ts';
import { runCursorCli } from '../src/adapters/cursorCli.ts';

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
      execute: { type: 'string', short: 'x' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  // `hx cursor …` → Cursor-shaped adapter (rest of argv after "cursor")
  if (positionals[0] === 'cursor') {
    const raw = process.argv.slice(2);
    const idx = raw.findIndex((a) => a === 'cursor');
    await runCursorCli(raw.slice(idx + 1));
    return;
  }

  if (values.help || (positionals.length === 0 && !values.execute)) printUsage();

  const [cmd, ...rest] = positionals.length ? positionals : ['run'];
  const flags = {
    provider: String(values.provider),
    cwd: String(values.cwd),
    write: Boolean(values.write),
    shell: Boolean(values.shell),
    json: Boolean(values.json),
    jsonl: Boolean(values.jsonl),
  };

  switch (cmd) {
    case 'tools':
      await cmdTools(flags);
      break;
    case 'exec':
    case 'run': {
      const prompt = (values.execute ? String(values.execute) : rest.join(' ')).trim();
      if (!prompt) printUsage();
      await cmdRun(prompt, flags);
      break;
    }
    case 'review':
      await cmdReview(rest.join(' ').trim(), flags);
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
