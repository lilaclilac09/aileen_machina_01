/**
 * Owner voice → computer CLI. Client-safe (no cfClient / Buffer).
 * Maps spoken lines onto allowlisted commands or a scratch vcode write.
 */
import { isVoiceCodeIntent } from '../voiceCodeIntent';
import { isOwnerShellCommand } from './allowlist';

export const COMPUTER_CLI_EVENT = 'aileena-computer-cli';

export type SpokenCli = { kind: 'cli' | 'vcode' | 'none'; command: string };

/** Filename / scratch path in a spoken line. Client-safe. */
export function extractSpokenPath(raw: string): string {
  for (const w of raw.split(/\s+/)) {
    const clean = w.replace(/^["'`]+|["'`,.]+$/g, '');
    if (clean.includes('..')) continue;
    if (
      /^[\w./-]+\.\w{1,8}$/.test(clean) ||
      clean.startsWith('scratch/') ||
      clean.startsWith('/workspace/scratch/') ||
      clean.startsWith('/workspace/reports/') ||
      clean.startsWith('/workspace/artifacts/')
    ) {
      return clean;
    }
  }
  return '';
}

function spokenVcodeCommand(t: string): string {
  if (/^vcode\b/i.test(t)) return t;
  const pathHint = extractSpokenPath(t);
  return pathHint ? `vcode ${pathHint}\n${t}` : `vcode\n${t}`;
}

function aliasCommand(raw: string): string | null {
  const t = raw.trim();
  if (/^(list|list files|show files|ls)$/i.test(t)) return 'ls';
  if (/^(pwd|where am i|where are we)$/i.test(t)) return 'pwd';
  if (/^(help|帮助|what can you do|what commands|available commands|你能做什么)$/i.test(t)) return 'help';
  if (
    /^(examples|example|官方例子|show examples|what examples|container example)$/i.test(t)
  ) {
    return 'examples';
  }
  if (
    /^(demo|演示|run demo|show demo|run worker-shell|show me the computer|show me one|run an example)$/i.test(
      t,
    )
  ) {
    return 'demo';
  }
  if (/^(run javascript|demo js|worker javascript|show javascript)$/i.test(t)) return 'demo js';
  if (/^(demo egress|show egress|run egress)$/i.test(t)) return 'demo egress';
  if (/^(demo mcp|show mcp|run mcp)$/i.test(t)) return 'demo mcp';
  if (/^(demo rlm|run rlm)$/i.test(t)) return 'demo rlm';
  if (/^(demo think|run think)$/i.test(t)) return 'demo think';
  if (/^(demo compare|compare runtimes|think compare)$/i.test(t)) return 'demo compare';
  if (/^(demo tutorial|run tutorial)$/i.test(t)) return 'demo tutorial';
  if (/^(demo artifacts|run artifacts)$/i.test(t)) return 'demo artifacts';
  if (/^(demo assets|run assets)$/i.test(t)) return 'demo assets';
  if (/^(demo container|run container|why no container|linux|run linux)$/i.test(t)) {
    return 'demo container';
  }
  if (/^(clear|clear screen|wipe)$/i.test(t)) return 'clear';
  if (/^(go home|cd home|go to workspace)$/i.test(t)) return 'cd';
  if (/^(go to scratch|cd scratch|open scratch)$/i.test(t)) return 'cd scratch';
  const cat = /^(cat|show|open)\s+(\S+)$/i.exec(t);
  if (cat) return `cat ${cat[2]}`;
  return null;
}

export function isSpokenVcode(raw: string): boolean {
  const t = raw.trim();
  if (isVoiceCodeIntent(t)) return true;
  if (/^vcode\b/i.test(t)) return true;
  if (/^(write|make|create)\s+(a\s+)?(\w+\s+)?file\b/i.test(t)) return true;
  if (/^写(一个|个)?文件/.test(t)) return true;
  return false;
}

export function spokenToCli(raw: string): SpokenCli {
  const t = raw.trim();
  if (!t) return { kind: 'none', command: '' };
  const aliased = aliasCommand(t);
  if (aliased) return { kind: 'cli', command: aliased };
  if (isSpokenVcode(t)) return { kind: 'vcode', command: spokenVcodeCommand(t) };
  if (isOwnerShellCommand(t)) return { kind: 'cli', command: t };
  return { kind: 'none', command: t };
}

export function dispatchComputerCli(command: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COMPUTER_CLI_EVENT, { detail: { text: command } }));
}
