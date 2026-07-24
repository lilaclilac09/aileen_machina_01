import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { Harness } from '../core/harness.ts';
import { ToolRegistry } from '../core/registry.ts';
import { loadRules } from '../core/rules.ts';
import type { EventSink, Snapshot, ToolDefinition } from '../core/types.ts';
import { BUILTIN_TOOLS } from '../tools/builtin.ts';
import { createProvider } from '../providers/index.ts';
import { mcpToolsFromConfig } from '../mcp/config.ts';

export const SESSION_DIR = join(homedir(), '.hx');
export const SESSION_PATH = join(SESSION_DIR, 'session.json');

export type BuildFlags = {
  provider: string;
  cwd: string;
  write: boolean;
  shell: boolean;
  resume?: boolean;
  /** Extra system prefix (e.g. review preset) */
  systemExtra?: string;
  /** Restrict to read-only tools */
  readOnly?: boolean;
  onEvent?: EventSink;
};

export function selectTools(flags: {
  write: boolean;
  shell: boolean;
  readOnly?: boolean;
}): ToolDefinition[] {
  const registry = new ToolRegistry();
  registry.addAll(BUILTIN_TOOLS);
  registry.addAll(mcpToolsFromConfig());

  return registry.list().filter((t) => {
    if (flags.readOnly) {
      return ['list_dir', 'read_file', 'grep', 'code_mode'].includes(t.name) || t.name.startsWith('mcp__');
    }
    if ((t.name === 'write_file' || t.name === 'apply_patch') && !flags.write) return false;
    if (t.name === 'shell' && !flags.shell) return false;
    return true;
  });
}

export function buildSystem(cwd: string, flags: BuildFlags): string {
  const base = [
    'You are hx, a coding-agent harness.',
    'Prefer tools over guessing. Use code_mode to compose multiple local tools in one cell.',
    `Workspace cwd: ${cwd}`,
    flags.write ? 'write_file and apply_patch are enabled.' : 'write_file and apply_patch are disabled.',
    flags.shell ? 'shell is enabled.' : 'shell is disabled.',
    flags.systemExtra?.trim() ?? '',
  ]
    .filter(Boolean)
    .join('\n');
  return loadRules(cwd, base);
}

export function buildHarness(flags: BuildFlags): Harness {
  const provider = createProvider(flags.provider);
  const tools = selectTools(flags);
  const system = buildSystem(flags.cwd, flags);
  const builder = Harness.builder({
    provider,
    tools,
    cwd: flags.cwd,
    system,
    onEvent: flags.onEvent,
  });
  if (flags.resume) {
    const snap = loadSnapshot();
    if (snap) return builder.resume(snap);
  }
  return builder.build();
}

export function loadSnapshot(): Snapshot | null {
  if (!existsSync(SESSION_PATH)) return null;
  return JSON.parse(readFileSync(SESSION_PATH, 'utf8')) as Snapshot;
}

export function saveSnapshot(snapshot: Snapshot): void {
  mkdirSync(SESSION_DIR, { recursive: true });
  writeFileSync(SESSION_PATH, JSON.stringify(snapshot, null, 2));
}

export function clearSnapshot(): void {
  if (existsSync(SESSION_PATH)) unlinkSync(SESSION_PATH);
}

export function jsonlSink(): EventSink {
  return (event) => {
    console.log(JSON.stringify(event));
  };
}
