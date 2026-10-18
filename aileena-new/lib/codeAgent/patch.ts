/**
 * suggest_patch: the code-mode loop with no write access at all. The caller
 * (a visitor's own Claude / Cursor, usually next to GitHub's MCP server)
 * sends the task and the files; Machina runs read_file / list_files /
 * search_files / edit_file over those files in memory and returns unified
 * diffs plus the full new contents. The caller applies them with its own
 * GitHub credentials (e.g. GitHub MCP create_branch + push_files +
 * create_pull_request). Machina never sees a GitHub token here.
 */
import { runtimeKv } from '../agentRuntime/kv';
import { Agent, newAgentState, type ChatClient, type Workspace } from './agent';
import { checkPath, DEFAULT_LIMITS, type CodePolicy } from './policy';
import { CODE_AUDIT_KEY, defaultCodeModel, type CodeAuditRow } from './run';

export const PATCH_LIMITS = { maxInputFiles: 20, maxInputBytes: 200_000, maxTaskChars: 2000 };

export const PUBLIC_PATCH_POLICY: CodePolicy = {
  allow: [],
  allowWorkflows: false,
  limits: { ...DEFAULT_LIMITS, maxSteps: 8, maxFiles: 8, maxWriteBytes: 200_000, maxReadBytes: 300_000 },
};

export type PatchInput = { task: string; files: { path: string; content: string }[]; repo?: string };
export type PatchChange = { path: string; status: 'modified' | 'added'; diff: string; content: string };
export type PatchResult =
  | { ok: true; status: 'done' | 'partial'; summary: string; changes: PatchChange[]; skipped: { path: string; reason: string }[] }
  | { ok: false; error: string };

export function memoryWorkspace(files: Record<string, string>, label = 'caller-provided files'): Workspace {
  return { label, listPaths: async () => Object.keys(files), readFile: async (p) => (p in files ? files[p] : null) };
}

/** Unified diff with one hunk around the changed region (3 lines of context). Applies with `git apply` / `patch -p1`. */
export function unifiedDiff(path: string, before: string | null, after: string): string {
  const split = (t: string) => {
    const nl = t.endsWith('\n');
    const body = nl ? t.slice(0, -1) : t;
    return { lines: t === '' ? [] : body.split('\n'), nl: t === '' || nl };
  };
  const A = split(before ?? '');
  const B = split(after);
  const a = A.lines;
  const b = B.lines;
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  // A change in the final newline changes the last line, so it may not be shared context.
  const sameEof = A.nl === B.nl;
  while (sameEof && suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  if (!sameEof && pre === Math.min(a.length, b.length) && pre > 0) pre--;
  const ctx = 3;
  const start = Math.max(0, pre - ctx);
  const aEnd = Math.min(a.length, a.length - suf + ctx);
  const bEnd = Math.min(b.length, b.length - suf + ctx);
  const out: string[] = [];
  const noNl = '\\ No newline at end of file';
  for (let i = start; i < pre; i++) out.push(` ${a[i]}`);
  for (let i = pre; i < a.length - suf; i++) {
    out.push(`-${a[i]}`);
    if (i === a.length - 1 && !A.nl) out.push(noNl);
  }
  for (let i = pre; i < b.length - suf; i++) {
    out.push(`+${b[i]}`);
    if (i === b.length - 1 && !B.nl) out.push(noNl);
  }
  for (let i = a.length - suf; i < aEnd; i++) {
    out.push(` ${a[i]}`);
    if (i === a.length - 1 && !A.nl) out.push(noNl);
  }
  const range = (s: number, n: number) => `${n === 0 ? s : s + 1},${n}`;
  return [
    before === null ? '--- /dev/null' : `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -${range(start, aEnd - start)} +${range(start, bEnd - start)} @@`,
    ...out,
    '',
  ].join('\n');
}

export async function suggestPatch(input: PatchInput, opts: { client?: ChatClient | null; budgetMs?: number; caller?: string } = {}): Promise<PatchResult> {
  const task = typeof input.task === 'string' ? input.task.trim() : '';
  if (!task) return { ok: false, error: 'task is required' };
  if (task.length > PATCH_LIMITS.maxTaskChars) return { ok: false, error: `task is longer than ${PATCH_LIMITS.maxTaskChars} characters` };
  if (!Array.isArray(input.files) || input.files.length > PATCH_LIMITS.maxInputFiles) return { ok: false, error: `files must be an array of at most ${PATCH_LIMITS.maxInputFiles}` };
  const files: Record<string, string> = {};
  const skipped: { path: string; reason: string }[] = [];
  let bytes = 0;
  for (const f of input.files) {
    const c = checkPath(f?.path, PUBLIC_PATCH_POLICY);
    if (!c.ok) {
      skipped.push({ path: String(f?.path ?? '').slice(0, 200), reason: c.error });
      continue;
    }
    if (typeof f.content !== 'string') {
      skipped.push({ path: c.path, reason: 'content must be a string' });
      continue;
    }
    bytes += f.content.length;
    if (bytes > PATCH_LIMITS.maxInputBytes) return { ok: false, error: `files are larger than ${PATCH_LIMITS.maxInputBytes} bytes in total; send only the files the change needs` };
    files[c.path] = f.content;
  }
  const client = opts.client === undefined ? defaultCodeModel() : opts.client;
  if (!client) return { ok: false, error: 'suggest_patch is not available right now (no model configured).' };

  const repo = typeof input.repo === 'string' ? input.repo.trim().slice(0, 140) : '';
  const label = repo ? `${repo} (files sent by the caller)` : 'files sent by the caller';
  const state = newAgentState(label, task);
  state.conversation[0].content +=
    '\nYou only see the files the caller sent. You cannot write to any repo: your edits come back to the caller as diffs. If a file you need is missing, say which one in your summary.';
  const out = await new Agent(client, memoryWorkspace(files, label), PUBLIC_PATCH_POLICY).run(state, Date.now() + (opts.budgetMs ?? 20_000) - 8_000, Date.now() + (opts.budgetMs ?? 20_000) + 3_000);
  if (out.status === 'error') return { ok: false, error: `model call failed: ${out.text.slice(0, 160)}` };

  const changes: PatchChange[] = Object.entries(state.staged)
    .filter(([p, content]) => files[p] !== content)
    .map(([path, content]) => ({ path, status: path in files ? 'modified' : 'added', diff: unifiedDiff(path, path in files ? files[path] : null, content), content }));
  const row: CodeAuditRow = {
    at: Date.now(),
    actor: `mcp:${(opts.caller ?? 'anon').slice(0, 16)}`,
    repo: repo || '(caller files)',
    runId: 'suggest_patch',
    event: `patch_${out.status}`,
    steps: state.steps,
    tools: state.toolLog.slice(-40),
    files: changes.map((c) => ({ path: c.path, bytes: c.content.length })),
  };
  await runtimeKv().listPush(CODE_AUDIT_KEY, [row], 200, 60 * 60 * 24 * 30).catch(() => {});
  return {
    ok: true,
    status: out.status === 'done' ? 'done' : 'partial',
    summary: out.status === 'done' ? out.text : `${out.text} Partial result: apply what is here or call again with a narrower task.`,
    changes,
    skipped,
  };
}
