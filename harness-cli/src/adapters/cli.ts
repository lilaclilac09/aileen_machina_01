import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  buildHarness,
  clearSnapshot,
  jsonlSink,
  loadSnapshot,
  saveSnapshot,
  selectTools,
  SESSION_PATH,
  type BuildFlags,
} from './factory.ts';
import {
  addMcpServer,
  loadMcpConfig,
  mcpConfigPath,
  removeMcpServer,
} from '../mcp/config.ts';

export type CliFlags = BuildFlags & {
  json?: boolean;
  jsonl?: boolean;
};

export function printUsage(): never {
  console.log(`hx — handwritten agent harness (Amp-style: one core, many CLIs)

Usage:
  hx tools
  hx run|exec "<prompt>" | hx -x "<prompt>"
      [--provider mock|openai] [--cwd <path>] [--write] [--shell] [--json] [--jsonl]
  hx review [focus...]     # read-only preset, same Harness
  hx repl                  # interactive, resumes ~/.hx/session.json
  hx session show|clear
  hx mcp list|add|remove   # register MCP stubs into the same tool registry

Amp pattern / steps: AMP_STYLE.md · HANDWRITTEN_HARNESS.md
`);
  process.exit(0);
}

export async function cmdTools(flags: { write: boolean; shell: boolean; readOnly?: boolean }) {
  for (const t of selectTools(flags)) {
    console.log(`${t.name.padEnd(28)} ${t.description}`);
  }
}

export async function cmdRun(prompt: string, flags: CliFlags) {
  const harness = buildHarness({
    ...flags,
    resume: false,
    onEvent: flags.jsonl ? jsonlSink() : flags.onEvent,
  });
  const turn = await harness.prompt(prompt);
  const result = await turn.result();
  saveSnapshot(result.checkpoint.snapshot());

  if (flags.jsonl) {
    // events already printed; still emit a final result line for consumers
    console.log(JSON.stringify({ type: 'result', text: result.text, checkpointId: result.checkpoint.id }));
    return;
  }
  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(result.text);
  if (result.toolCalls.length) {
    console.error(`\n[hx] tools: ${result.toolCalls.map((c) => c.name).join(', ')}`);
  }
  console.error(`[hx] checkpoint ${result.checkpoint.id} → ${SESSION_PATH}`);
}

export async function cmdReview(focus: string, flags: CliFlags) {
  await cmdRun(focus || 'Review this repository for risks and next steps.', {
    ...flags,
    readOnly: true,
    write: false,
    shell: false,
    systemExtra: [
      'hx review mode: read-only.',
      'Inspect layout and key docs with tools, then give a short structured review:',
      'Findings / Risks / Suggested next steps.',
      'Do not claim you modified files.',
    ].join('\n'),
  });
}

export async function cmdRepl(flags: CliFlags) {
  const harness = buildHarness({ ...flags, resume: true });
  const rl = createInterface({ input, output });
  console.log(`hx repl  (provider=${flags.provider}, cwd=${flags.cwd})`);
  console.log('commands: /tools  /fork  /quit');
  try {
    while (true) {
      const line = (await rl.question('hx> ')).trim();
      if (!line) continue;
      if (line === '/quit' || line === '/exit') break;
      if (line === '/tools') {
        await cmdTools(flags);
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

export async function cmdSession(sub: string) {
  if (sub === 'show') {
    const snap = loadSnapshot();
    console.log(snap ? JSON.stringify(snap, null, 2) : 'no session');
    return;
  }
  if (sub === 'clear') {
    clearSnapshot();
    console.log('cleared');
    return;
  }
  printUsage();
}

export async function cmdMcp(args: string[]) {
  const [sub, name, ...rest] = args;
  if (sub === 'list' || !sub) {
    const cfg = loadMcpConfig();
    console.log(`config: ${mcpConfigPath()}`);
    if (!cfg.servers.length) {
      console.log('(no servers — hx mcp add <name> -- <command…>)');
      return;
    }
    for (const s of cfg.servers) {
      console.log(
        `${s.name.padEnd(16)} cmd=${s.command ?? '-'} url=${s.url ?? '-'} tools=${(s.tools ?? []).map((t) => t.name).join(',') || 'status'}`,
      );
    }
    return;
  }
  if (sub === 'add') {
    if (!name) printUsage();
    // `hx mcp add demo -- npx -y server`  or  `hx mcp add demo --url https://…`
    let command: string | undefined;
    let url: string | undefined;
    const urlIdx = rest.indexOf('--url');
    if (urlIdx >= 0) {
      url = rest[urlIdx + 1];
      rest.splice(urlIdx, 2);
    }
    const dd = rest.indexOf('--');
    if (dd >= 0) command = rest.slice(dd + 1).join(' ');
    else if (rest.length && !url) command = rest.join(' ');
    addMcpServer({
      name,
      command,
      url,
      tools: [{ name: 'status', description: `stub for ${name}` }],
    });
    console.log(`added ${name} → tools register as mcp__${name}__* on next run`);
    return;
  }
  if (sub === 'remove') {
    if (!name) printUsage();
    removeMcpServer(name);
    console.log(`removed ${name}`);
    return;
  }
  printUsage();
}
