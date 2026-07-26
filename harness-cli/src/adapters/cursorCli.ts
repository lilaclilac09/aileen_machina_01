/**
 * Cursor-shaped CLI adapter over the same Harness core.
 *
 * Mirrors public Cursor Agent CLI surface (modes + print), not Cursor proprietary runtime:
 *   agent "…" / agent -p "…" / --mode ask|plan|agent / resume
 *
 * @see https://cursor.com/docs/cli/using
 */
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  buildHarness,
  jsonlSink,
  loadSnapshot,
  saveSnapshot,
  SESSION_PATH,
} from './factory.ts';
import type { Harness } from '../core/harness.ts';
import { cmdMcp, cmdTools } from './cli.ts';

export type CursorMode = 'agent' | 'ask' | 'plan';

export type CursorFlags = {
  provider: string;
  cwd: string;
  mode: CursorMode;
  print: boolean;
  outputFormat: 'text' | 'json' | 'jsonl';
  force: boolean;
  model?: string;
  continueSession: boolean;
};

function modePreset(mode: CursorMode): {
  readOnly: boolean;
  systemExtra: string;
} {
  if (mode === 'ask') {
    return {
      readOnly: true,
      systemExtra: [
        'Cursor Ask mode (read-only).',
        'Explore with list_dir / read_file / grep / code_mode.',
        'Do not modify files; answer with findings and paths.',
      ].join('\n'),
    };
  }
  if (mode === 'plan') {
    return {
      readOnly: true,
      systemExtra: [
        'Cursor Plan mode.',
        'Inspect with read-only tools, then output:',
        '1) Goal  2) Steps  3) Files to touch  4) Risks  5) Verification.',
        'Do not modify files — plan only.',
      ].join('\n'),
    };
  }
  return {
    readOnly: false,
    systemExtra: [
      'Cursor Agent mode.',
      'Prefer apply_patch for edits. Use code_mode to batch reads.',
      'When done, summarize what changed.',
    ].join('\n'),
  };
}

function makeHarness(flags: CursorFlags, mode: CursorMode, resume: boolean): Harness {
  const preset = modePreset(mode);
  const agentPower = mode === 'agent' && flags.force;
  return buildHarness({
    provider: flags.provider,
    cwd: flags.cwd,
    write: agentPower,
    shell: agentPower,
    readOnly: preset.readOnly || !agentPower,
    systemExtra: preset.systemExtra,
    resume,
    profile: mode,
    onEvent: flags.outputFormat === 'jsonl' ? jsonlSink() : undefined,
  }).harness;
}

export function printCursorUsage(): never {
  console.log(`cursor-agent — Cursor-shaped CLI on hx harness (not official Cursor)

Usage:
  agent                                 interactive (default mode=agent)
  agent "fix the tests"                first turn, then interactive
  agent -p|--print "…"                  non-interactive (scripts/CI)
  agent --mode ask|plan|agent …
  agent --plan                          shorthand for --mode=plan
  agent resume | --continue             resume ~/.hx/session.json
  agent mcp …                           same MCP registry as hx
  agent models | about | status | ls

Flags:
  --provider mock|openai   --cwd <path>   --model <id>
  --output-format text|json|jsonl
  -f|--force / --no-force   (agent writes/shell; default force on)

Same Harness as \`hx\` — this is only a Cursor UX adapter.
Also: hx cursor …
`);
  process.exit(0);
}

export async function runCursorCli(argv: string[]): Promise<void> {
  const flags = parseCursorArgv(argv);
  if (flags.help) printCursorUsage();
  if (flags.model) process.env.OPENAI_MODEL = flags.model;

  const [cmd, ...rest] = flags.positionals;

  if (!cmd && !flags.print && !flags.printPrompt && !flags.continueSession) {
    // bare `agent` → interactive
    await interactive(flags, flags.mode, undefined);
    return;
  }

  if (cmd === 'help') printCursorUsage();
  if (cmd === 'about') {
    console.log(
      JSON.stringify(
        {
          name: 'cursor-agent (hx adapter)',
          harness: 'harness-cli',
          session: SESSION_PATH,
          officialCursor: false,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === 'models' || cmd === 'list-models') {
    console.log('mock');
    console.log('openai\tdefault gpt-4o-mini (OPENAI_MODEL)');
    return;
  }
  if (cmd === 'mcp') {
    await cmdMcp(rest);
    return;
  }
  if (cmd === 'status' || cmd === 'whoami') {
    const snap = loadSnapshot();
    console.log(snap ? `session ${snap.sessionId} msgs=${snap.messages.length}` : 'no session');
    return;
  }
  if (cmd === 'ls') {
    const snap = loadSnapshot();
    console.log(snap ? `${snap.sessionId}\t${snap.updatedAt}` : '(no chats)');
    return;
  }

  const isResume = cmd === 'resume' || flags.continueSession;
  const prompt =
    flags.printPrompt ||
    (cmd && cmd !== 'resume' && cmd !== 'agent' ? [cmd, ...rest].join(' ').trim() : rest.join(' ').trim());

  if (flags.print) {
    if (!prompt) printCursorUsage();
    await oneshot(flags, flags.mode, prompt, isResume);
    return;
  }

  // Interactive; optional first prompt (Cursor: agent "…")
  await interactive(flags, flags.mode, prompt || undefined, isResume);
}

async function oneshot(flags: CursorFlags, mode: CursorMode, prompt: string, resume: boolean) {
  const harness = makeHarness(flags, mode, resume);
  const turn = await harness.prompt(prompt);
  const result = await turn.result();
  saveSnapshot(result.checkpoint.snapshot());
  if (flags.outputFormat === 'jsonl') {
    console.log(JSON.stringify({ type: 'result', text: result.text, checkpointId: result.checkpoint.id }));
  } else if (flags.outputFormat === 'json') {
    console.log(
      JSON.stringify(
        { text: result.text, checkpointId: result.checkpoint.id, tools: result.toolCalls.map((c) => c.name) },
        null,
        2,
      ),
    );
  } else {
    console.log(result.text);
    if (result.toolCalls.length) {
      console.error(`[tools] ${result.toolCalls.map((c) => c.name).join(', ')}`);
    }
  }
}

async function interactive(
  flags: CursorFlags,
  startMode: CursorMode,
  firstPrompt?: string,
  resume = true,
) {
  let mode = startMode;
  let harness = makeHarness(flags, mode, resume);
  const rl = createInterface({ input, output });
  console.log(`cursor-agent  mode=${mode} provider=${flags.provider} cwd=${flags.cwd}`);
  console.log('slash: /ask  /plan  /agent  /tools  /quit');

  const runLine = async (line: string) => {
    const turn = await harness.prompt(line);
    const result = await turn.result();
    saveSnapshot(result.checkpoint.snapshot());
    console.log(result.text);
    console.error(`[checkpoint ${result.checkpoint.id}]`);
  };

  try {
    if (firstPrompt) await runLine(firstPrompt);
    while (true) {
      const line = (await rl.question(`${mode}> `)).trim();
      if (!line) continue;
      if (line === '/quit' || line === '/exit') break;
      if (line === '/ask' || line === '/plan' || line === '/agent') {
        mode = line.slice(1) as CursorMode;
        saveSnapshot(harness.snapshot());
        harness = makeHarness(flags, mode, true);
        console.log(`[mode] ${mode}`);
        continue;
      }
      if (line === '/tools') {
        await cmdTools({
          write: mode === 'agent' && flags.force,
          shell: mode === 'agent' && flags.force,
          readOnly: mode !== 'agent',
        });
        continue;
      }
      await runLine(line);
    }
  } finally {
    rl.close();
  }
}

function parseCursorArgv(argv: string[]): CursorFlags & {
  help: boolean;
  positionals: string[];
  printPrompt: string;
} {
  const positionals: string[] = [];
  let provider = 'mock';
  let cwd = process.cwd();
  let mode: CursorMode = 'agent';
  let print = false;
  let outputFormat: CursorFlags['outputFormat'] = 'text';
  let force = true;
  let model: string | undefined;
  let continueSession = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') help = true;
    else if (a === '-p' || a === '--print') print = true;
    else if (a === '--plan') mode = 'plan';
    else if (a === '--continue') continueSession = true;
    else if (a === '-f' || a === '--force') force = true;
    else if (a === '--no-force') force = false;
    else if (a === '--provider') provider = argv[++i] ?? provider;
    else if (a.startsWith('--provider=')) provider = a.slice('--provider='.length);
    else if (a === '--cwd') cwd = argv[++i] ?? cwd;
    else if (a.startsWith('--cwd=')) cwd = a.slice('--cwd='.length);
    else if (a === '--mode') mode = (argv[++i] as CursorMode) || mode;
    else if (a.startsWith('--mode=')) mode = a.slice('--mode='.length) as CursorMode;
    else if (a === '--model') model = argv[++i];
    else if (a.startsWith('--model=')) model = a.slice('--model='.length);
    else if (a === '--output-format') outputFormat = (argv[++i] as CursorFlags['outputFormat']) || 'text';
    else if (a.startsWith('--output-format=')) {
      outputFormat = a.slice('--output-format='.length) as CursorFlags['outputFormat'];
    } else if (!a.startsWith('-')) positionals.push(a);
  }

  if (!['agent', 'ask', 'plan'].includes(mode)) mode = 'agent';
  const printPrompt = print ? positionals.join(' ').trim() : '';

  return {
    provider,
    cwd,
    mode,
    print,
    outputFormat,
    force,
    model,
    continueSession,
    help,
    positionals: print ? [] : positionals,
    printPrompt,
  };
}
