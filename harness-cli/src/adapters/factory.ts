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
import { assignAbCohort, resolveHarnessName } from '../core/abAssign.ts';
import type {
  AbAssignment,
  ExecutionMetadata,
  HarnessName,
  ResolvedHarness,
} from '../core/resolvedHarness.ts';

export const SESSION_DIR = join(homedir(), '.hx');
export const SESSION_PATH = join(SESSION_DIR, 'session.json');

export type BuildFlags = {
  provider: string;
  cwd: string;
  write: boolean;
  shell: boolean;
  resume?: boolean;
  systemExtra?: string;
  readOnly?: boolean;
  onEvent?: EventSink;
  profile?: ResolvedHarness['profile'];
  /** Sticky Codex/Nanocodex A/B */
  ab?: boolean;
  /** Explicit resolved harness (wins over A/B map) */
  harness?: HarnessName;
  sessionKey?: string;
};

export type BuiltHarness = {
  harness: Harness;
  resolved: ResolvedHarness;
  assignment: AbAssignment | null;
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

function harnessSystemBlurb(name: HarnessName): string {
  if (name === 'Nanocodex') {
    return [
      'Resolved harness: Nanocodex (library-first / Code Mode–leaning).',
      'Prefer code_mode composition; keep tool surface small.',
    ].join('\n');
  }
  if (name === 'Codex') {
    return [
      'Resolved harness: Codex (product-harness reference behavior).',
      'Use standard tool turns; favor clear stepwise tool use.',
    ].join('\n');
  }
  return 'Resolved harness: hx.';
}

export function buildSystem(cwd: string, flags: BuildFlags, resolvedName: HarnessName): string {
  const base = [
    'You are hx, a coding-agent harness.',
    harnessSystemBlurb(resolvedName),
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

export function buildHarness(flags: BuildFlags): BuiltHarness {
  const sessionKey = flags.sessionKey ?? `cwd:${flags.cwd}`;

  let assignment: AbAssignment | null = null;
  if (flags.ab) {
    assignment = assignAbCohort(sessionKey, {
      forceHarness: flags.harness,
      forceCohort: undefined,
    });
  } else if (flags.harness) {
    // Explicit harness without A/B still records provenance as explicit-flag assignment.
    assignment = assignAbCohort(sessionKey, { forceHarness: flags.harness });
  }

  // api-rs analogue: persisted/explicit resolve wins. Never "is A/B ⇒ Codex*".
  const resolvedName = resolveHarnessName({
    explicit: flags.harness,
    assignment: flags.ab ? assignment : null,
    fallback: flags.harness ?? 'hx',
  });

  const provider = createProvider(flags.provider);
  const tools = selectTools(flags);
  const system = buildSystem(flags.cwd, flags, resolvedName);
  const builder = Harness.builder({
    provider,
    tools,
    cwd: flags.cwd,
    system,
    onEvent: flags.onEvent,
  });

  const snap = flags.resume ? loadSnapshot() : null;
  const harness = snap ? builder.resume(snap) : builder.build();

  const resolved: ResolvedHarness = {
    name: resolvedName,
    profile: flags.profile ?? (flags.readOnly ? 'ask' : 'run'),
    provider: flags.provider,
    write: Boolean(flags.write),
    shell: Boolean(flags.shell),
    readOnly: Boolean(flags.readOnly),
    sessionId: harness.sessionId,
  };

  return { harness, resolved, assignment: flags.ab || flags.harness ? assignment : null };
}

export function toExecutionMetadata(
  built: BuiltHarness,
  extra?: { checkpointId?: string; toolNames?: string[] },
): ExecutionMetadata {
  return {
    resolved: {
      ...built.resolved,
    },
    assignment: built.assignment,
    checkpointId: extra?.checkpointId,
    toolNames: extra?.toolNames,
  };
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
