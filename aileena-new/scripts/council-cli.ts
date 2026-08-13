#!/usr/bin/env tsx
/**
 * Private local council — not the public orb.
 *
 *   pnpm council
 *   pnpm council "review current git diff and tell me merge risks"
 *   pnpm council -- --mode pr --no-context "check merge readiness"
 *
 * Requires OWNER_KEY in .env.local. Does not write the repo.
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { COUNCIL_OPENING, type CouncilLens } from '../lib/councilCopy';
import {
  CLI_MODE_ALIASES,
  assertCouncilCliAllowed,
  collectRepoContext,
  formatRepoContext,
  isCliModeName,
  loadEnvLocal,
  type CliModeName,
} from '../lib/councilCliContext';
import { runCouncilTurn, type CouncilChatMessage } from '../lib/councilRunner';

const HELP = `AILEENA COUNCIL  (local, owner-only — not the public site)

${COUNCIL_OPENING}

Usage:
  pnpm council
  pnpm council "review current git diff"
  pnpm council -- --mode pr --no-context "check merge readiness"

Flags:
  --mode <name>   strategy | negotiation | site | pr | vent | writing
  --no-context    skip git diff / AGENTS.md / QA.md excerpts
  --help

Commands (interactive):
  /help
  /mode strategy | negotiation | site | pr | vent | writing
  /diff     print git diff --stat
  /status   print git status
  /checks   print env names present + package scripts
  /quit
`;

type Parsed = {
  help: boolean;
  noContext: boolean;
  mode?: CliModeName;
  prompt: string;
};

function parseArgs(argv: string[]): Parsed {
  const args = argv.filter((a) => a !== '--');
  let help = false;
  let noContext = false;
  let mode: CliModeName | undefined;
  const rest: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') {
      help = true;
      continue;
    }
    if (a === '--no-context') {
      noContext = true;
      continue;
    }
    if (a === '--mode') {
      const next = args[i + 1];
      i += 1;
      if (!next || !isCliModeName(next)) {
        throw new Error(`Unknown --mode. Use: ${Object.keys(CLI_MODE_ALIASES).join(', ')}`);
      }
      mode = next;
      continue;
    }
    if (a.startsWith('--mode=')) {
      const next = a.slice('--mode='.length);
      if (!isCliModeName(next)) {
        throw new Error(`Unknown --mode. Use: ${Object.keys(CLI_MODE_ALIASES).join(', ')}`);
      }
      mode = next;
      continue;
    }
    rest.push(a);
  }
  return { help, noContext, mode, prompt: rest.join(' ').trim() };
}

function lensFor(mode: CliModeName | undefined): CouncilLens | undefined {
  return mode ? CLI_MODE_ALIASES[mode] : undefined;
}

function printBanner(mode: CliModeName | undefined, branch: string): void {
  console.log(COUNCIL_OPENING);
  console.log('local owner terminal — not the public orb');
  console.log(`[1] strategy  [2] negotiation  [3] site  [4] pr  [5] vent  [6] writing`);
  console.log(`mode: ${mode ?? '(infer)'}   branch: ${branch}`);
  console.log('type /help   /quit to leave\n');
}

async function askCouncil(
  question: string,
  history: CouncilChatMessage[],
  mode: CliModeName | undefined,
  noContext: boolean,
): Promise<string> {
  const ctx = collectRepoContext({ noContext });
  const { text, provider } = await runCouncilTurn({
    question,
    history,
    lens: lensFor(mode),
    repoContext: formatRepoContext(ctx),
  });
  console.log(`\n— ${provider} —\n`);
  console.log(text);
  console.log('');
  return text;
}

async function interactive(mode: CliModeName | undefined, noContext: boolean): Promise<void> {
  const ctx = collectRepoContext({ noContext: true });
  printBanner(mode, ctx.branch);
  const rl = createInterface({ input, output, terminal: true });
  const history: CouncilChatMessage[] = [];
  let currentMode = mode;
  try {
    while (true) {
      const line = (await rl.question('> ')).trim();
      if (!line) continue;
      if (line === '/quit' || line === '/exit') break;
      if (line === '/help') {
        console.log(HELP);
        continue;
      }
      if (line.startsWith('/mode')) {
        const name = line.slice('/mode'.length).trim();
        if (!isCliModeName(name)) {
          console.log(`modes: ${Object.keys(CLI_MODE_ALIASES).join(', ')}`);
          continue;
        }
        currentMode = name;
        console.log(`mode → ${name} (${CLI_MODE_ALIASES[name]})`);
        continue;
      }
      if (line === '/status' || line === '/diff' || line === '/checks') {
        const live = collectRepoContext({ noContext: false });
        if (line === '/status') console.log(live.status || '(clean)');
        else if (line === '/diff') console.log(live.diffStat || '(no diff)');
        else {
          console.log(`env names set: ${live.envNames.join(', ') || '(none)'}`);
          console.log(`scripts: ${live.scripts.join(', ')}`);
        }
        continue;
      }
      if (line.startsWith('/')) {
        console.log('unknown command. /help');
        continue;
      }
      try {
        const reply = await askCouncil(line, history, currentMode, noContext);
        history.push({ role: 'user', content: line }, { role: 'assistant', content: reply });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(msg);
      }
    }
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(HELP);
    return;
  }
  assertCouncilCliAllowed();
  if (parsed.prompt) {
    await askCouncil(parsed.prompt, [], parsed.mode, parsed.noContext);
    return;
  }
  if (!process.stdin.isTTY) {
    throw new Error('No prompt given. Pass a one-shot question, or run in a TTY for interactive mode.');
  }
  await interactive(parsed.mode, parsed.noContext);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  process.exit(1);
});
