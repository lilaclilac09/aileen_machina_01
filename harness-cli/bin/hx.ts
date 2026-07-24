#!/usr/bin/env node
/**
 * hx — thin CLI over the harness core.
 * Run: node --experimental-strip-types bin/hx.ts <cmd>
 */
import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { Harness } from '../src/core/harness.ts';
import { BUILTIN_TOOLS } from '../src/tools/builtin.ts';
import { createProvider } from '../src/providers/index.ts';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const SESSION_DIR = join(homedir(), '.hx');
const SESSION_PATH = join(SESSION_DIR, 'session.json');

function usage(): never {
  console.log(`hx — Cursor-like agent harness (prototype)

Usage:
  hx tools
  hx run "<prompt>" [--provider mock|openai] [--cwd <path>] [--write] [--shell] [--json]
  hx exec -x "<prompt>"   # Amp-style oneshot alias of run
  hx repl [--provider mock|openai] [--cwd <path>] [--write] [--shell]
  hx session show|clear

Env:
  OPENAI_API_KEY     required for --provider openai
  OPENAI_BASE_URL    optional (default https://api.openai.com/v1)
  OPENAI_MODEL       optional (default gpt-4o-mini)

Design: harness-cli/DESIGN.md · Amp pattern: harness-cli/AMP_STYLE.md
`);
  process.exit(0);
}

function loadSnapshot(): unknown | null {
  if (!existsSync(SESSION_PATH)) return null;
  return JSON.parse(readFileSync(SESSION_PATH, 'utf8'));
}

function saveSnapshot(snapshot: unknown): void {
  mkdirSync(SESSION_DIR, { recursive: true });
  writeFileSync(SESSION_PATH, JSON.stringify(snapshot, null, 2));
}

async function buildHarness(flags: {
  provider: string;
  cwd: string;
  write: boolean;
  shell: boolean;
  resume: boolean;
}) {
  const provider = createProvider(flags.provider);
  const tools = BUILTIN_TOOLS.filter((t) => {
    if (t.name === 'write_file' && !flags.write) return false;
    if (t.name === 'shell' && !flags.shell) return false;
    return true;
  });

  const builder = Harness.builder({
    provider,
    tools,
    cwd: flags.cwd,
    system: [
      'You are hx, a coding-agent harness.',
      'Prefer tools over guessing. Use code_mode to compose multiple local tools in one cell.',
      `Workspace cwd: ${flags.cwd}`,
      flags.write ? 'write_file is enabled.' : 'write_file is disabled.',
      flags.shell ? 'shell is enabled.' : 'shell is disabled.',
    ].join('\n'),
  });

  if (flags.resume) {
    const snap = loadSnapshot();
    if (snap) return builder.resume(snap as never);
  }
  return builder.build();
}

async function cmdTools() {
  for (const t of BUILTIN_TOOLS) {
    console.log(`${t.name.padEnd(12)} ${t.description}`);
  }
}

async function cmdRun(prompt: string, flags: {
  provider: string;
  cwd: string;
  write: boolean;
  shell: boolean;
  json: boolean;
}) {
  const harness = await buildHarness({ ...flags, resume: false });
  const turn = await harness.prompt(prompt);
  const result = await turn.result();
  saveSnapshot(result.checkpoint.snapshot());
  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.text);
    if (result.toolCalls.length) {
      console.error(`\n[hx] tools: ${result.toolCalls.map((c) => c.name).join(', ')}`);
    }
    console.error(`[hx] checkpoint ${result.checkpoint.id} saved → ${SESSION_PATH}`);
  }
}

async function cmdRepl(flags: {
  provider: string;
  cwd: string;
  write: boolean;
  shell: boolean;
}) {
  const harness = await buildHarness({ ...flags, resume: true });
  const rl = createInterface({ input, output });
  console.log(`hx repl  (provider=${flags.provider}, cwd=${flags.cwd})`);
  console.log('commands: /tools  /fork  /quit');
  try {
    while (true) {
      const line = (await rl.question('hx> ')).trim();
      if (!line) continue;
      if (line === '/quit' || line === '/exit') break;
      if (line === '/tools') {
        await cmdTools();
        continue;
      }
      if (line === '/fork') {
        const forked = await harness.fork();
        console.log(`[hx] forked session ${forked.sessionId}`);
        continue;
      }
      const turn = await harness.prompt(line);
      const result = await turn.result();
      saveSnapshot(result.checkpoint.snapshot());
      console.log(result.text);
      console.error(`[hx] checkpoint ${result.checkpoint.id}`);
    }
  } finally {
    rl.close();
  }
}

async function cmdSession(sub: string) {
  if (sub === 'show') {
    const snap = loadSnapshot();
    if (!snap) {
      console.log('no session');
      return;
    }
    console.log(JSON.stringify(snap, null, 2));
    return;
  }
  if (sub === 'clear') {
    if (existsSync(SESSION_PATH)) unlinkSync(SESSION_PATH);
    console.log('cleared');
    return;
  }
  usage();
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      provider: { type: 'string', default: 'mock' },
      cwd: { type: 'string', default: process.cwd() },
      write: { type: 'boolean', default: false },
      shell: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      execute: { type: 'string', short: 'x' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help || (positionals.length === 0 && !values.execute)) usage();

  const [cmd, ...rest] = positionals.length ? positionals : ['run'];
  const flags = {
    provider: String(values.provider),
    cwd: String(values.cwd),
    write: Boolean(values.write),
    shell: Boolean(values.shell),
    json: Boolean(values.json),
  };

  switch (cmd) {
    case 'tools':
      await cmdTools();
      break;
    case 'exec':
    case 'run': {
      // Amp-style: `hx exec -x "..."` or `hx -x "..."` (cmd defaults to run)
      const prompt = (values.execute ? String(values.execute) : rest.join(' ')).trim();
      if (!prompt) usage();
      await cmdRun(prompt, flags);
      break;
    }
    case 'repl':
      await cmdRepl(flags);
      break;
    case 'session':
      await cmdSession(rest[0] ?? 'show');
      break;
    default:
      usage();
  }
}

main().catch((err) => {
  console.error(`[hx] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
