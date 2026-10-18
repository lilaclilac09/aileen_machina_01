/**
 * One code-mode chat turn, end to end, with the Machina action rules:
 *
 *   /code <task>                → new run on AGENT_CODE_REPO
 *   /code owner/repo: <task>    → new run on another repo the token can reach
 *   /code continue              → resume the last paused or failed run
 *
 * - Run id = actionId('code.run', actor, turn). A retried turn replays the
 *   stored answer; it never re-runs the model or opens a second PR.
 * - The agent loop pauses before the request deadline and saves its state
 *   (conversation, staged edits, budgets). `/code continue` picks it up.
 * - Publishing is three checkpointed steps (commit → branch → draft PR) via
 *   runSteps; a failure resumes at the first unfinished step. The commit
 *   carries an `Action-Id:` trailer. Only `machina/code-*` branches are written.
 * - The audit log keeps repo, run id, tool names, paths and sizes. No code.
 */
import { actionId, runSteps } from '../agentRuntime/actions';
import { runtimeKv } from '../agentRuntime/kv';
import { deepSeekModelId, DEEPSEEK_DEFAULT_BASE_URL } from '../modelRouter';
import { Agent, newAgentState, openAiCompatibleClient, type AgentState, type ChatClient, type Workspace } from './agent';
import { GitHub, parseRepo, type RepoRef } from './github';
import { ownerPolicy, type CodePolicy } from './policy';

export type CodeCommand = { kind: 'help' } | { kind: 'continue' } | { kind: 'task'; repo?: string; task: string };

/** `/code …` in chat. Null when the message is not a code command. */
export function parseCodeCommand(text: string): CodeCommand | null {
  const m = text.trim().match(/^\/code(?:\s+([\s\S]*))?$/i);
  if (!m) return null;
  const rest = (m[1] ?? '').trim();
  if (!rest || /^help$/i.test(rest)) return { kind: 'help' };
  if (/^(continue|resume|go on)$/i.test(rest)) return { kind: 'continue' };
  const r = rest.match(/^([A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}):\s*([\s\S]+)$/);
  return r ? { kind: 'task', repo: r[1], task: r[2].trim() } : { kind: 'task', task: rest };
}

export const CODE_HELP = [
  'Code mode (owner only). I edit a GitHub repo on a new branch and open a draft PR; I never push to main.',
  '• `/code <task>`: work on the default repo',
  '• `/code owner/repo: <task>`: work on another repo the token can reach',
  '• `/code continue`: resume a paused run',
].join('\n');

export type CodeConfig = { token: string; repo: RepoRef } | { off: string };

export function ownerCodeConfig(): CodeConfig {
  const token = (process.env.AGENT_CODE_GITHUB_TOKEN ?? '').trim();
  if (!token) return { off: 'Code mode is off. Set AGENT_CODE_GITHUB_TOKEN (fine-grained, Contents + Pull requests read/write) in Vercel to turn it on.' };
  const repo = parseRepo(process.env.AGENT_CODE_REPO || 'lilaclilac09/aileen_machina_01');
  if (!repo) return { off: 'AGENT_CODE_REPO must look like owner/repo.' };
  return { token, repo };
}

export function defaultCodeModel(): ChatClient | null {
  const apiKey = process.env.AGENT_CODE_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.AGENT_API_KEY;
  if (!apiKey) return null;
  return openAiCompatibleClient({
    baseURL: process.env.AGENT_CODE_BASE_URL || process.env.DEEPSEEK_BASE_URL || DEEPSEEK_DEFAULT_BASE_URL,
    apiKey,
    model: process.env.AGENT_CODE_MODEL || deepSeekModelId(),
    thinking: process.env.AGENT_CODE_THINKING === '1',
  });
}

type RunRecord = {
  runId: string;
  repo: string;
  task: string;
  base: { branch: string; sha: string };
  status: 'working' | 'publishing' | 'done';
  agent: AgentState;
  summary?: string;
  answer?: string;
  pr?: { url: string; number: number };
};

const RUN_TTL = 60 * 60 * 24;
const runKey = (id: string) => `code:run:v1:${id}`;
const lastKey = (actor: string) => `code:last:v1:${actor}`;
export const CODE_AUDIT_KEY = 'code:audit:v1';

/** Keep stored state small and code-light: tool outputs over 4 KB are dropped (re-read on resume). */
function forStorage(rec: RunRecord): RunRecord {
  return {
    ...rec,
    agent: {
      ...rec.agent,
      conversation: rec.agent.conversation.map((m) =>
        m.role === 'tool' && m.content.length > 4000 ? { ...m, content: '[tool output dropped when the run was saved; call the tool again if you still need it]' } : m,
      ),
    },
  };
}

function githubWorkspace(gh: GitHub, sha: string): Workspace {
  let paths: Promise<string[]> | null = null;
  const files = new Map<string, Promise<string | null>>();
  return {
    label: `${gh.ref.owner}/${gh.ref.repo}`,
    listPaths: () => (paths ??= gh.listPaths(sha)),
    readFile: (p) => {
      if (!files.has(p)) files.set(p, gh.readFile(p, sha));
      return files.get(p)!;
    },
  };
}

export type CodeTurnDeps = { client?: ChatClient | null; github?: (token: string, repo: RepoRef) => GitHub; now?: () => number };
export type CodeTurnResult = { text: string; status: 'help' | 'off' | 'done' | 'paused' | 'error' | 'busy' | 'replay'; prUrl?: string; runId?: string };

export async function runCodeTurn(opts: {
  actor: string;
  command: CodeCommand;
  /** Stable per chat turn (sessionId + turnId); a retry with the same key is replayed. */
  turnKey: string;
  budgetMs?: number;
  policy?: CodePolicy;
  config?: CodeConfig;
  deps?: CodeTurnDeps;
}): Promise<CodeTurnResult> {
  const { command, actor } = opts;
  if (command.kind === 'help') return { text: CODE_HELP, status: 'help' };
  const cfg = opts.config ?? ownerCodeConfig();
  if ('off' in cfg) return { text: cfg.off, status: 'off' };
  const client = opts.deps && 'client' in opts.deps ? opts.deps.client : defaultCodeModel();
  if (!client) return { text: 'Code mode needs a model key (DEEPSEEK_API_KEY or AGENT_CODE_API_KEY).', status: 'off' };
  const now = opts.deps?.now ?? Date.now;
  const started = now();
  const budget = opts.budgetMs ?? 22_000;
  const policy = opts.policy ?? ownerPolicy();
  const kv = runtimeKv();
  const makeGh = opts.deps?.github ?? ((t: string, r: RepoRef) => new GitHub(t, r));

  // Which run?
  let runId: string;
  let rec: RunRecord | null;
  if (command.kind === 'continue') {
    runId = (await kv.get<string>(lastKey(actor))) ?? '';
    rec = runId ? await kv.get<RunRecord>(runKey(runId)) : null;
    if (!rec) return { text: 'Nothing to continue. Start with `/code <task>`.', status: 'error' };
  } else {
    runId = await actionId('code.run', actor, opts.turnKey, command.repo ?? '', command.task);
    rec = await kv.get<RunRecord>(runKey(runId));
  }
  if (rec?.status === 'done') return { text: rec.answer ?? '', status: 'replay', prUrl: rec.pr?.url, runId };

  // One live worker per run (a concurrent duplicate delivery waits).
  const lease = `code:lease:v1:${runId}`;
  if (!(await kv.set(lease, '1', { nx: true, ex: Math.ceil(budget / 1000) + 15 }))) {
    return { text: 'That code run is already in progress. Give it a moment, then `/code continue`.', status: 'busy', runId };
  }
  try {
    const repoRef = rec ? parseRepo(rec.repo)! : command.kind === 'task' && command.repo ? parseRepo(command.repo) : cfg.repo;
    if (!repoRef) return { text: 'Repo must look like owner/repo.', status: 'error' };
    const gh = makeGh(cfg.token, repoRef);
    const label = `${repoRef.owner}/${repoRef.repo}`;
    if (!rec) {
      const task = (command as { task: string }).task.slice(0, 4000);
      const base = await gh.defaultBranch();
      rec = { runId, repo: label, task, base, status: 'working', agent: newAgentState(label, task) };
      await kv.set(lastKey(actor), runId, { ex: RUN_TTL });
    }

    if (rec.status === 'working') {
      const agent = new Agent(client, githubWorkspace(gh, rec.base.sha), policy);
      const out = await agent.run(rec.agent, started + budget - 7_000, started + budget + 3_000);
      if (out.status === 'paused' || out.status === 'error') {
        await kv.set(runKey(runId), forStorage(rec), { ex: RUN_TTL });
        await audit(rec, actor, out.status);
        const why = out.status === 'paused' ? 'Still working and out of time for this message.' : `The model call failed (${out.text.slice(0, 160)}).`;
        return { text: `${why} ${Object.keys(rec.agent.staged).length} file(s) staged so far. Send \`/code continue\` to pick up where I stopped.`, status: out.status, runId };
      }
      rec.summary = out.text || (out.status === 'capped' ? out.text : '');
      if (!Object.keys(rec.agent.staged).length) {
        rec.status = 'done';
        rec.answer = `${rec.summary || 'Done.'}\n\n(No files changed, so no pull request.)`;
        await kv.set(runKey(runId), forStorage(rec), { ex: RUN_TTL });
        await audit(rec, actor, 'done');
        return { text: rec.answer, status: 'done', runId };
      }
      rec.status = 'publishing';
      await kv.set(runKey(runId), forStorage(rec), { ex: RUN_TTL });
    }

    // Publish: commit → branch → draft PR, one checkpoint each.
    const hex = runId.split(':')[1];
    const branch = `machina/code-${hex.slice(0, 12)}`;
    const commitActionId = await actionId('code.commit', runId);
    const r = rec;
    const title = `Machina code: ${r.task.split('\n')[0].slice(0, 72)}`;
    const steps = await runSteps(runId, [
      {
        name: 'commit',
        run: async () =>
          gh.createCommit(r.base.sha, r.agent.staged, `${title}\n\n${(r.summary ?? '').slice(0, 1500)}\n\nRequested-by: ${actor === 'owner' ? 'owner (Machina code mode)' : 'visitor'}\nAction-Id: ${commitActionId}`, {
            name: 'lilaclilac09',
            email: '68252598+lilaclilac09@users.noreply.github.com',
          }),
      },
      { name: 'branch', run: async (ctx) => (await gh.createBranch(branch, String(ctx.results.commit), r.base.branch), branch) },
      {
        name: 'pr',
        run: () =>
          gh.openDraftPr(
            branch,
            r.base.branch,
            title,
            [
              '**Draft opened by Machina code mode.** Review before merging.',
              '',
              `**Task:** ${r.task.slice(0, 1500)}`,
              '',
              `**Summary:** ${(r.summary ?? '').slice(0, 3000)}`,
              '',
              `Files: ${Object.keys(r.agent.staged).map((p) => `\`${p}\``).join(', ')}`,
              '',
              `Action-Id: ${commitActionId}`,
            ].join('\n'),
          ),
      },
    ], { results: {} as Record<string, unknown> });
    if (!steps.ok) {
      await kv.set(runKey(runId), forStorage(rec), { ex: RUN_TTL });
      await audit(rec, actor, 'publish_failed');
      const why = steps.busyAt ? `${steps.busyAt} is still running` : `${steps.failedAt} failed: ${(steps.error ?? '').slice(0, 200)}`;
      return { text: `Edits are ready but publishing stopped (${why}). Send \`/code continue\` to retry from that step.`, status: 'error', runId };
    }
    rec.pr = steps.results.pr as { url: string; number: number };
    rec.status = 'done';
    rec.answer = `${rec.summary || 'Done.'}\n\nDraft PR: ${rec.pr.url}\nBranch \`${branch}\` · ${Object.keys(rec.agent.staged).length} file(s) · Action-Id \`${commitActionId}\``;
    await kv.set(runKey(runId), forStorage(rec), { ex: RUN_TTL });
    await audit(rec, actor, 'pr_opened');
    return { text: rec.answer, status: 'done', prUrl: rec.pr.url, runId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: `Code mode hit an error: ${msg.slice(0, 200)}`, status: 'error', runId };
  } finally {
    await kv.del(lease);
  }
}

export type CodeAuditRow = {
  at: number;
  actor: string;
  repo: string;
  runId: string;
  event: string;
  steps: number;
  tools: { name: string; path?: string; ok: boolean }[];
  files: { path: string; bytes: number }[];
  pr?: string;
};

/** Metadata only: never file contents, never the task text (it may quote code). */
async function audit(rec: RunRecord, actor: string, event: string): Promise<void> {
  const row: CodeAuditRow = {
    at: Date.now(),
    actor,
    repo: rec.repo,
    runId: rec.runId,
    event,
    steps: rec.agent.steps,
    tools: rec.agent.toolLog.slice(-40),
    files: Object.entries(rec.agent.staged).map(([path, v]) => ({ path, bytes: v.length })),
    pr: rec.pr?.url,
  };
  try {
    await runtimeKv().listPush(CODE_AUDIT_KEY, [row], 200, 60 * 60 * 24 * 30);
  } catch (err) {
    console.warn('[code] audit write failed', err);
  }
}

export async function readCodeAudit(limit = 50): Promise<CodeAuditRow[]> {
  return runtimeKv().listRange<CodeAuditRow>(CODE_AUDIT_KEY, limit);
}
