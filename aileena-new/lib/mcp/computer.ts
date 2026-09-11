import { isOwnerShellCommand } from '../computer/allowlist';
import { cfExec, cfGetFile, isCloudflareComputerReady, toWorkspacePath } from '../computer/cfClient';
import { clip, redactSecrets } from '../computer/redact';
import type { McpCallResult, McpToolDesc } from './types';

const READ_PREFIXES = ['/workspace/scratch/', '/workspace/reports/', '/workspace/artifacts/'];

export function isMcpReadPath(input: string): boolean {
  const path = toWorkspacePath(input);
  if (!path) return false;
  return READ_PREFIXES.some((p) => path.startsWith(p) && path.length > p.length);
}

const TOOLS: McpToolDesc[] = [
  { name: 'exec', description: 'Run an allowlisted worker-shell command in /workspace' },
  { name: 'read', description: 'Read a file under /workspace/scratch|reports|artifacts' },
];

export function computerTools(): McpToolDesc[] {
  return TOOLS;
}

export function computerReady(): { ready: boolean; reason: string } {
  if (!isCloudflareComputerReady()) {
    return { ready: false, reason: 'needs COMPUTER_WORKER_URL + COMPUTER_WORKER_SECRET' };
  }
  return { ready: true, reason: 'worker-shell' };
}

export async function callComputer(
  tool: string,
  args: Record<string, unknown>,
  workspaceId: string,
): Promise<McpCallResult> {
  const gate = computerReady();
  if (!gate.ready) {
    return { ok: false, app: 'computer', tool, text: gate.reason, blocked: true };
  }
  if (tool === 'read') {
    const path = String(args.path || '').trim();
    if (!path) return { ok: false, app: 'computer', tool, text: 'path required' };
    if (!isMcpReadPath(path)) {
      return { ok: false, app: 'computer', tool, text: 'read only scratch/reports/artifacts', blocked: true };
    }
    try {
      const body = await cfGetFile(path, workspaceId);
      return { ok: true, app: 'computer', tool, text: clip(body, 4000) };
    } catch (err) {
      return {
        ok: false,
        app: 'computer',
        tool,
        text: redactSecrets(err instanceof Error ? err.message : 'read failed'),
      };
    }
  }
  if (tool === 'exec') {
    const command = String(args.command || '').trim().slice(0, 2000);
    if (!command) return { ok: false, app: 'computer', tool, text: 'command required' };
    if (!isOwnerShellCommand(command)) {
      return { ok: false, app: 'computer', tool, text: `command not allowlisted: ${command.split(/\s+/)[0]}`, blocked: true };
    }
    try {
      const run = await cfExec(command, '/workspace', workspaceId);
      const text = [run.stdout, run.stderr].filter(Boolean).join('\n') || `exit ${run.exitCode}`;
      return { ok: run.exitCode === 0, app: 'computer', tool, text: clip(text, 4000) };
    } catch (err) {
      return {
        ok: false,
        app: 'computer',
        tool,
        text: redactSecrets(err instanceof Error ? err.message : 'exec failed'),
      };
    }
  }
  return { ok: false, app: 'computer', tool, text: `unknown tool ${tool}` };
}
