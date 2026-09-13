/**
 * Owner CLI over worker-shell. Not Linux. cd/put stay in Next so
 * just-bash never has to persist cwd itself.
 */
import { clip } from './redact';
import { cfExec, cfGetFile, cfPutFile, isCloudflareComputerReady, toWorkspacePath } from './cfClient';
import { isOwnerShellCommand } from './allowlist';
import { OWNER_CLI_EXAMPLES, OWNER_CLI_HELP } from './helpText';

export const WORKSPACE_ROOT = '/workspace';
export const CWD_FILE = '/workspace/scratch/.cwd';
const WRITE_PREFIXES = ['/workspace/scratch/', '/workspace/reports/', '/workspace/artifacts/'];

export function normalizeWorkspacePath(input: string): string | null {
  const path = toWorkspacePath(input) || (input.startsWith('/') ? null : toWorkspacePath(`${WORKSPACE_ROOT}/${input}`));
  if (!path) return null;
  return path;
}

export function resolveCwd(cwd: string, dest = ''): string | null {
  const base = normalizeWorkspacePath(cwd) || WORKSPACE_ROOT;
  const raw = dest.trim() || WORKSPACE_ROOT;
  const next = raw.startsWith('/') ? raw : `${base}/${raw}`;
  const parts: string[] = [];
  for (const part of next.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  const abs = `/${parts.join('/')}` || WORKSPACE_ROOT;
  if (abs !== WORKSPACE_ROOT && !abs.startsWith(`${WORKSPACE_ROOT}/`)) return null;
  return abs;
}

export function isWritePath(path: string): boolean {
  return WRITE_PREFIXES.some((p) => path.startsWith(p) && path.length > p.length);
}

export function parsePut(raw: string, cwd = WORKSPACE_ROOT): { path: string; body: string } | null {
  const m = /^(?:put|write)\s+(\S+)(?:\r?\n|\s+)?([\s\S]*)$/.exec(raw.trim());
  if (!m) return null;
  const path = resolveCwd(cwd, m[1] || '');
  if (!path || !isWritePath(path)) return null;
  return { path, body: m[2] ?? '' };
}

export function parseCd(raw: string): string | null {
  const t = raw.trim();
  if (t === 'cd') return WORKSPACE_ROOT;
  const m = /^cd(?:\s+|:\s*)(.*)$/.exec(t);
  return m ? m[1].trim() : null;
}

export function isTerminalBuiltin(raw: string): boolean {
  const bin = raw.trim().split(/\s+/)[0] || '';
  return (
    bin === 'cd' ||
    bin === 'put' ||
    bin === 'write' ||
    bin === 'clear' ||
    bin === 'help' ||
    bin === 'examples' ||
    bin === 'vcode'
  );
}

export function isOwnerCliCommand(raw: string): boolean {
  return isTerminalBuiltin(raw) || isOwnerShellCommand(raw);
}

export function formatPrompt(cwd: string): string {
  const short = cwd === WORKSPACE_ROOT ? '/workspace' : cwd.replace(/^\/workspace\/?/, '') || '/workspace';
  return `${short} $`;
}

export async function loadCwd(workspaceId: string): Promise<string> {
  if (!isCloudflareComputerReady()) return WORKSPACE_ROOT;
  try {
    const raw = (await cfGetFile(CWD_FILE, workspaceId)).trim();
    return resolveCwd(WORKSPACE_ROOT, raw) || WORKSPACE_ROOT;
  } catch {
    return WORKSPACE_ROOT;
  }
}

export async function saveCwd(workspaceId: string, cwd: string): Promise<void> {
  const next = resolveCwd(WORKSPACE_ROOT, cwd) || WORKSPACE_ROOT;
  await cfPutFile(CWD_FILE, `${next}\n`, workspaceId);
}

export type OwnerShellResult = {
  ok: boolean;
  cwd: string;
  text: string;
  kind: 'exec' | 'cd' | 'put' | 'clear' | 'help' | 'vcode';
};

export async function runOwnerShellLine(command: string, workspaceId: string): Promise<OwnerShellResult> {
  const cmd = command.trim().slice(0, 4000);
  const cwd = await loadCwd(workspaceId);
  if (!cmd) return { ok: false, cwd, text: 'empty command', kind: 'exec' };
  if (cmd === 'clear') return { ok: true, cwd, text: '', kind: 'clear' };
  if (cmd === 'examples' || /^help\s+examples\b/i.test(cmd)) {
    return { ok: true, cwd, text: OWNER_CLI_EXAMPLES, kind: 'help' };
  }
  if (cmd === 'help' || cmd.startsWith('help ')) {
    return { ok: true, cwd, text: OWNER_CLI_HELP, kind: 'help' };
  }
  if (/^vcode\b/i.test(cmd)) {
    const { parseVcode, generateScratchFile } = await import('./voiceScratch');
    const parsed = parseVcode(cmd);
    if (!parsed) return { ok: false, cwd, text: 'vcode: say a file and what to write', kind: 'vcode' };
    const made = await generateScratchFile(parsed.prompt, cwd, parsed.pathHint);
    if (!made.ok) return { ok: false, cwd, text: made.text, kind: 'vcode' };
    await cfPutFile(made.path, clip(made.body, 64 * 1024), workspaceId);
    return { ok: true, cwd, text: `${made.path}\n${clip(made.body, 800)}`, kind: 'vcode' };
  }

  const dest = parseCd(cmd);
  if (dest !== null) {
    const next = resolveCwd(cwd, dest);
    if (!next) return { ok: false, cwd, text: 'cd: path stays under /workspace', kind: 'cd' };
    await saveCwd(workspaceId, next);
    return { ok: true, cwd: next, text: next, kind: 'cd' };
  }

  const put = parsePut(cmd, cwd);
  if (cmd.startsWith('put ') || cmd.startsWith('write ') || cmd.startsWith('put\n') || cmd.startsWith('write\n')) {
    if (!put) return { ok: false, cwd, text: 'put only under scratch/reports/artifacts', kind: 'put' };
    await cfPutFile(put.path, clip(put.body, 64 * 1024), workspaceId);
    return { ok: true, cwd, text: put.path, kind: 'put' };
  }

  if (!isOwnerShellCommand(cmd)) {
    return { ok: false, cwd, text: `command not allowlisted: ${cmd.split(/\s+/)[0]}`, kind: 'exec' };
  }
  const run = await cfExec(cmd, cwd, workspaceId);
  const text = [run.stdout, run.stderr].filter(Boolean).join('\n') || `exit ${run.exitCode}`;
  return { ok: run.exitCode === 0, cwd, text: clip(text, 4000), kind: 'exec' };
}
