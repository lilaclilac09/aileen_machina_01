'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComputerTask } from '../lib/computer/types';
import type { ProofItem } from '../lib/proofQueue/types';
import { HARNESS_PLUGINS } from '../lib/computer/plugins';
import { COMPUTER_TABS, TAB_WIRE, type ComputerTabId } from '../lib/computer/capabilities';

type GitRow = {
  hash: string;
  date: string;
  message: string;
  filesChanged: number;
  soundFiles: string[];
  merge?: boolean;
  why: string;
};

type Light = 'idle' | 'running' | 'blocked' | 'done' | 'failed';

const LIGHT_COLOR: Record<Light, string> = {
  idle: '#b8b2a8',
  running: '#008f86',
  blocked: '#c4a35a',
  done: '#2f7d4a',
  failed: '#a33b32',
};

const TAB_LABEL: Record<ComputerTabId, string> = {
  chat: 'chat',
  files: 'files',
  git: 'git',
  browser: 'browser',
  code: 'code',
  email: 'email',
  proof: 'proof',
  tasks: 'tasks',
};

function lightForTab(tab: ComputerTabId, tasks: ComputerTask[]): Light {
  const wire = TAB_WIRE[tab];
  if (wire === 'blocked') return 'blocked';
  const related = tasks.filter((t) => capabilityOf(t.taskType) === tab);
  const latest = related[0];
  if (!latest) return wire === 'draft-only' ? 'blocked' : 'idle';
  if (latest.status === 'queued' || latest.status === 'running') return 'running';
  if (latest.status === 'blocked' || latest.status === 'needs_input') return 'blocked';
  if (latest.status === 'failed') return 'failed';
  if (latest.status === 'completed') return wire === 'draft-only' ? 'blocked' : 'done';
  return 'idle';
}

function capabilityOf(taskType: string): ComputerTabId {
  if (taskType.startsWith('git_')) return 'git';
  if (taskType.startsWith('files_')) return 'files';
  if (taskType.startsWith('email_')) return 'email';
  if (taskType.startsWith('browser_') || taskType === 'collect_screenshot_checklist') return 'browser';
  if (taskType === 'update_proof_queue') return 'proof';
  if (taskType === 'write_scratch_file') return 'files';
  if (
    taskType === 'draft_patch' ||
    taskType === 'draft_daily_fix_plan' ||
    taskType === 'inspect_route_files' ||
    taskType === 'generate_implementation_prompt' ||
    taskType === 'run_build_check'
  ) {
    return 'code';
  }
  return 'tasks';
}

function parseGitRows(task: ComputerTask | null): GitRow[] {
  const text = [
    task?.artifacts.find((a) => a.kind === 'git')?.preview,
    task?.resultSummary,
  ]
    .filter(Boolean)
    .join('\n');
  const rows: GitRow[] = [];
  const seen = new Set<string>();
  for (const line of text.split('\n')) {
    const parts = line.split(' | ');
    if (parts.length < 6) continue;
    if (!/^[0-9a-f]{7,40}$/i.test(parts[0])) continue;
    if (seen.has(parts[0])) continue;
    seen.add(parts[0]);
    rows.push({
      hash: parts[0],
      date: parts[1],
      message: parts[2],
      filesChanged: Number(parts[3]) || 0,
      soundFiles: parts[4] === '—' ? [] : parts[4].split(',').map((s) => s.trim()).filter(Boolean),
      why: parts.slice(5).join(' | '),
    });
  }
  return rows;
}

function compactCopy(status: string, wire?: string): string {
  if (status === 'queued') return '⚡ queued.';
  if (status === 'running') return '⚡ running.';
  if (status === 'needs_input' || status === 'needs approval') return '⚡ needs approval.';
  if (status === 'blocked' || wire === 'blocked' || wire === 'draft-only') return '⚡ blocked.';
  if (status === 'completed' || status === 'done') return '⚡ done.';
  if (status === 'failed') return '⚡ failed.';
  return '⚡ idle.';
}

function StatusDot({ light }: { light: Light }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
      style={{ background: LIGHT_COLOR[light] }}
    />
  );
}

/**
 * Computer lives inside the site-agent dialog. Not a separate window.
 * Owner-only — AgentChat mounts this only when isOwner.
 */
export default function ComputerConsoleDock() {
  const [flash, setFlash] = useState('⚡ computer ready · same dialog');
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<ComputerTask[]>([]);
  const [proof, setProof] = useState<ProofItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<ComputerTabId>('chat');
  const [filePath, setFilePath] = useState('aileena-new/app/sound/page.tsx');
  const [fileQuery, setFileQuery] = useState('Sound Lab');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [logOpen, setLogOpen] = useState<string | null>(null);
  const prevStatus = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/agent/computer/tasks', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { tasks?: ComputerTask[]; proof?: ProofItem[] };
    setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    setProof(Array.isArray(data.proof) ? data.proof : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = tasks.some((t) => t.status === 'queued' || t.status === 'running');
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => void load(), 900);
    return () => window.clearInterval(id);
  }, [open, load]);

  useEffect(() => {
    for (const t of tasks) {
      const prev = prevStatus.current[t.id];
      if (prev && prev !== t.status) {
        if (t.status === 'completed') setFlash('⚡ ready.');
        else if (t.status === 'blocked') setFlash('⚡ blocked.');
        else if (t.status === 'failed') setFlash('⚡ failed.');
        else if (t.status === 'running') setFlash('⚡ running.');
      }
      prevStatus.current[t.id] = t.status;
    }
  }, [tasks]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selected) ?? tasks[0] ?? null,
    [tasks, selected],
  );
  const hung = proof.find((p) => p.status !== 'shipped' && p.status !== 'rejected') ?? null;
  const rollback = proof.find((p) => p.id === 'proof-sound-lab-rollback') ?? null;
  const gitFind =
    tasks.find((t) => t.taskType === 'git_find_commit' && (t.status === 'queued' || t.status === 'running')) ??
    tasks.find((t) => t.taskType === 'git_find_commit' && t.status === 'completed') ??
    tasks.find((t) => t.taskType === 'git_find_commit') ??
    null;
  const gitLogTask = tasks.find((t) => t.taskType === 'git_log' && t.status === 'completed') ?? tasks.find((t) => t.taskType === 'git_log') ?? null;
  const gitStatusTask = tasks.find((t) => t.taskType === 'git_status') ?? null;
  const filesOpenTask =
    tasks.find((t) => t.taskType === 'files_open' && t.status === 'completed') ??
    tasks.find((t) => t.taskType === 'files_open') ??
    null;
  const candidates = parseGitRows(gitFind);

  const queue = async (opts: {
    taskType: string;
    route?: string;
    instructions?: string;
    proofItemId?: string;
  }) => {
    setBusy(true);
    try {
      const res = await fetch('/api/agent/computer/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: opts.taskType,
          route: opts.route ?? '/proof',
          proofItemId: opts.proofItemId,
          instructions: opts.instructions ?? '',
        }),
      });
      const data = (await res.json()) as {
        spoken?: string;
        error?: string;
        task?: ComputerTask;
      };
      if (!res.ok) {
        setFlash(`⚡ Nope. ${data.error || res.status}`);
        return;
      }
      setFlash(data.spoken || '⚡ queued. I can still talk.');
      if (data.task?.id) setSelected(data.task.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const run = async (pluginId: string) => {
    const plugin = HARNESS_PLUGINS.find((p) => p.id === pluginId);
    if (!plugin) return;
    if (plugin.kind === 'merge-gate') {
      setFlash('⚡ Merge stays in this dialog as a gate. GitHub merge is not a plugin.');
      return;
    }
    if (!plugin.taskType) return;
    await queue({
      taskType: plugin.taskType,
      route: plugin.taskType === 'draft_daily_fix_plan' ? '/daily' : '/proof',
      instructions: plugin.blurb,
    });
  };

  const proofAction = async (action: 'approve' | 'reject') => {
    if (!hung) return;
    setBusy(true);
    try {
      const res = await fetch('/api/agent/proof', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: hung.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash(`⚡ Nope. ${data.error || res.status}`);
        return;
      }
      setFlash(
        action === 'approve'
          ? `⚡ Approved ${hung.id}. Still not merged. Computer does not deploy.`
          : `⚡ Rejected ${hung.id}. Queue left it. I am still here.`,
      );
      await load();
    } finally {
      setBusy(false);
    }
  };

  const attachFinding = async (task: ComputerTask | null) => {
    if (!task) return;
    const itemId = rollback?.id || hung?.id;
    if (!itemId) {
      setFlash('⚡ Nope. No proof item to attach.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/agent/proof', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'attach_finding',
          id: itemId,
          computerTaskId: task.id,
          summary: task.resultSummary || task.artifacts[0]?.preview || task.taskType,
          extraFiles: task.filesInspected.slice(0, 8),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash(`⚡ Nope. ${data.error || res.status}`);
        return;
      }
      setFlash(`⚡ Attached to ${itemId}.`);
      setTab('proof');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const cancelTask = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/agent/computer/tasks/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      setFlash('⚡ Nope. Cancelled.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setFlash(`⚡ copied ${hash}`);
    } catch {
      setFlash(`⚡ ${hash}`);
    }
  };

  const btn =
    'min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#007d75] border border-[#00a89d]/35 bg-white px-2 py-1 disabled:opacity-40';

  const plugins = (
    <div className="flex flex-wrap gap-1.5" data-testid="harness-plugin-dock">
      {HARNESS_PLUGINS.map((p) => (
        <button
          key={p.id}
          type="button"
          data-testid={`harness-plugin-${p.id}`}
          disabled={busy}
          onClick={() => void run(p.id)}
          className={btn}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  const gates = (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" data-testid="harness-approve" disabled={busy || !hung} onClick={() => void proofAction('approve')} className={btn}>
        approve
      </button>
      <button
        type="button"
        data-testid="harness-reject"
        disabled={busy || !hung}
        onClick={() => void proofAction('reject')}
        className="min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#a33b32] border border-[#a33b32]/35 bg-white px-2 py-1 disabled:opacity-40"
      >
        reject
      </button>
      <button
        type="button"
        data-testid="harness-merge-blocked"
        disabled
        title="GitHub merge is owner-only and not a plugin"
        className="min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#1b1713]/30 border border-[#ded8ce] bg-[#f6f3ee] px-2 py-1 cursor-not-allowed"
      >
        merge (blocked)
      </button>
    </div>
  );

  return (
    <div
      data-testid="computer-console-dock"
      data-harness="machina-owner-prototype"
      className="border-t border-[#e7e0d6] px-4 py-2 space-y-2 bg-[#fffcf7]/80 max-h-[46vh] overflow-y-auto"
    >
      <p className="font-mono text-[0.52rem] tracking-[0.2em] uppercase text-[#008f86]/80">
        computer · same dialog · not a window
      </p>
      <p className="font-mono text-[0.62rem] leading-relaxed text-[#008f86] whitespace-pre-wrap" data-testid="proof-flash">
        {flash}
      </p>
      <div className="flex flex-wrap gap-1" data-testid="computer-tabs">
        {COMPUTER_TABS.map((id) => {
          const light = lightForTab(id, tasks);
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`computer-tab-${id}`}
              onClick={() => setTab(id)}
              className={`min-h-8 font-mono text-[0.5rem] tracking-[0.14em] uppercase px-2 py-1 border flex items-center gap-1 ${
                on ? 'border-[#00a89d] text-[#007d75] bg-white' : 'border-transparent text-[#1b1713]/45'
              }`}
            >
              <StatusDot light={light} />
              {TAB_LABEL[id]}
            </button>
          );
        })}
      </div>

      {tab === 'chat' ? (
        <div className="space-y-2">
          <p className="text-[0.68rem] text-[#1b1713]/50">Talk in the transcript. Heavy work says ⚡ queued. Same dialog.</p>
          {plugins}
          {gates}
        </div>
      ) : null}

      {tab === 'git' ? (
        <div className="space-y-2" data-testid="computer-tab-panel-git">
          <p className="text-[0.68rem] text-[#1b1713]/50">
            inspect only · {compactCopy(gitFind?.status || gitLogTask?.status || gitStatusTask?.status || 'idle')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={btn} disabled={busy} data-testid="git-action-status" onClick={() => void queue({ taskType: 'git_status', route: '/proof', instructions: 'git status --short' })}>
              status
            </button>
            <button
              type="button"
              className={btn}
              disabled={busy}
              data-testid="git-action-recent"
              onClick={() => void queue({ taskType: 'git_log', route: '/sound', instructions: 'n:50' })}
            >
              recent
            </button>
            <button
              type="button"
              className={btn}
              disabled={busy}
              data-testid="git-action-find-sound"
              onClick={() =>
                void queue({
                  taskType: 'git_find_commit',
                  route: '/sound',
                  instructions: 'find me the commit where I merged Sound Lab changes',
                  proofItemId: 'proof-sound-lab-rollback',
                })
              }
            >
              find sound merge
            </button>
            <button type="button" className={btn} disabled={busy || !gitFind} onClick={() => void attachFinding(gitFind)}>
              attach to proof
            </button>
          </div>
          {gitStatusTask?.resultSummary ? (
            <p className="font-mono text-[0.58rem] text-[#1b1713]/55">{gitStatusTask.resultSummary}</p>
          ) : null}
          {gitLogTask ? (
            <ul data-testid="git-recent-commits" className="space-y-0.5 font-mono text-[0.55rem] text-[#1b1713]/60">
              {(gitLogTask.artifacts[0]?.preview || gitLogTask.resultSummary)
                .split('\n')
                .filter(Boolean)
                .slice(0, 12)
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          ) : null}
          {candidates.length > 0 ? (
            <ul data-testid="git-merge-candidates" className="space-y-1">
              {candidates.map((c) => (
                <li key={c.hash} className="font-mono text-[0.55rem] text-[#1b1713]/70 leading-relaxed">
                  <button type="button" className="underline decoration-[#00a89d]/40" onClick={() => void copyHash(c.hash)}>
                    {c.hash}
                  </button>{' '}
                  {c.date.slice(0, 10)} · {c.message}
                  <br />
                  files={c.filesChanged} sound={c.soundFiles.length} · {c.why}
                </li>
              ))}
            </ul>
          ) : gitFind?.resultSummary ? (
            <p data-testid="git-merge-candidates" className="font-mono text-[0.58rem] text-[#1b1713]/55">
              {gitFind.resultSummary}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === 'files' ? (
        <div className="space-y-2">
          <p className="text-[0.68rem] text-[#1b1713]/50">read-only · secrets blocked · {compactCopy(filesOpenTask?.status || 'idle')}</p>
          <div className="flex flex-wrap gap-1.5">
            <input
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="min-h-9 flex-1 min-w-[12rem] font-mono text-[0.58rem] border border-[#e7e0d6] bg-white px-2"
              aria-label="file path"
            />
            <button
              type="button"
              className={btn}
              disabled={busy}
              data-testid="files-action-open"
              onClick={() => void queue({ taskType: 'files_open', route: '/sound', instructions: filePath })}
            >
              open
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <input
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
              className="min-h-9 flex-1 min-w-[12rem] font-mono text-[0.58rem] border border-[#e7e0d6] bg-white px-2"
              aria-label="search files"
            />
            <button
              type="button"
              className={btn}
              disabled={busy}
              onClick={() => void queue({ taskType: 'files_search', route: '/sound', instructions: fileQuery })}
            >
              search
            </button>
            <button
              type="button"
              className={btn}
              disabled={busy}
              onClick={() => void queue({ taskType: 'files_tree', route: '/sound', instructions: 'aileena-new' })}
            >
              tree
            </button>
          </div>
          <pre
            data-testid="files-readonly"
            className="font-mono text-[0.52rem] leading-relaxed text-[#1b1713]/60 whitespace-pre-wrap max-h-28 overflow-y-auto"
          >
            {filesOpenTask?.artifacts[0]?.preview ||
              tasks.find((t) => t.taskType === 'files_search' || t.taskType === 'files_tree')?.artifacts[0]?.preview ||
              'open a file to preview. .env and keys stay blocked.'}
          </pre>
        </div>
      ) : null}

      {tab === 'browser' ? (
        <div className="space-y-1">
          <p className="text-[0.68rem] text-[#1b1713]/55">⚡ blocked. Browser automation is not wired.</p>
          <p className="font-mono text-[0.55rem] text-[#1b1713]/45">
            Checklist only: /daily · /sound · landing · 390px · no invented screenshot names.
          </p>
        </div>
      ) : null}

      {tab === 'code' ? (
        <div className="space-y-2">
          <p className="text-[0.68rem] text-[#1b1713]/50">⚡ draft-only. Plan and inspect. No apply. No merge.</p>
          {plugins}
          {gates}
        </div>
      ) : null}

      {tab === 'email' ? (
        <div className="space-y-2">
          <p className="text-[0.68rem] text-[#1b1713]/55">⚡ email not connected. Draft / copy only.</p>
          <input
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="recipient"
            className="min-h-9 w-full font-mono text-[0.58rem] border border-[#e7e0d6] bg-white px-2"
          />
          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="subject"
            className="min-h-9 w-full font-mono text-[0.58rem] border border-[#e7e0d6] bg-white px-2"
          />
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="body"
            rows={3}
            className="w-full font-mono text-[0.58rem] border border-[#e7e0d6] bg-white px-2 py-1"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btn}
              disabled={busy}
              onClick={() =>
                void queue({
                  taskType: 'email_draft',
                  route: '/proof',
                  instructions: `draft email to ${emailTo || '(unspecified)'} about ${emailSubject || emailBody || 'draft'}`,
                })
              }
            >
              draft
            </button>
            <button
              type="button"
              disabled
              title="Send needs owner confirm and a connected provider"
              className="min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#1b1713]/30 border border-[#ded8ce] bg-[#f6f3ee] px-2 py-1 cursor-not-allowed"
            >
              send (blocked)
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'proof' ? (
        <div className="space-y-2">
          {gates}
          {hung ? (
            <p className="text-[0.68rem] text-[#1b1713]/50">
              hung on {hung.id} · {hung.status}
            </p>
          ) : null}
          {rollback ? (
            <div data-testid="proof-attachment" className="font-mono text-[0.55rem] text-[#1b1713]/65 whitespace-pre-wrap">
              {rollback.title} · {rollback.status}
              {'\n'}
              {rollback.resultSummary || 'no git finding attached yet'}
              {candidates.length
                ? `\n${candidates.map((c) => `${c.hash} | ${c.date.slice(0, 10)} | ${c.message}`).join('\n')}`
                : ''}
            </div>
          ) : (
            <p data-testid="proof-attachment" className="text-[0.68rem] text-[#1b1713]/40">
              no proof attachment yet
            </p>
          )}
        </div>
      ) : null}

      {tab === 'tasks' ? (
        <p className="text-[0.68rem] text-[#1b1713]/50">running jobs · compact logs</p>
      ) : null}

      <ul className="space-y-1" data-testid="computer-task-list">
        {tasks.length === 0 ? (
          <li className="text-[0.68rem] text-[#1b1713]/40">no computer tasks yet</li>
        ) : (
          tasks.slice(0, tab === 'tasks' ? 12 : 4).map((task) => (
            <li key={task.id} className="space-y-0.5">
              <button
                type="button"
                data-testid={`computer-task-${task.status}`}
                onClick={() => setSelected(task.id)}
                className="w-full text-left font-mono text-[0.58rem] text-[#1b1713]/60"
              >
                {task.taskType} · {task.status}
              </button>
              {tab === 'tasks' ? (
                <div className="flex flex-wrap gap-1">
                  {task.status === 'queued' || task.status === 'running' ? (
                    <button type="button" className={btn} disabled={busy} onClick={() => void cancelTask(task.id)}>
                      cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={btn}
                      disabled={busy}
                      onClick={() =>
                        void queue({
                          taskType: task.taskType,
                          route: task.route,
                          instructions: task.instructions,
                          proofItemId: task.proofItemId,
                        })
                      }
                    >
                      retry
                    </button>
                  )}
                  <button type="button" className={btn} onClick={() => setLogOpen(logOpen === task.id ? null : task.id)}>
                    logs
                  </button>
                </div>
              ) : null}
              {tab === 'tasks' && logOpen === task.id ? (
                <pre className="font-mono text-[0.5rem] text-[#1b1713]/50 whitespace-pre-wrap">
                  {task.logsRedacted.slice(-8).join('\n')}
                </pre>
              ) : null}
            </li>
          ))
        )}
      </ul>
      {selectedTask ? (
        <div data-testid="computer-task-detail" className="space-y-1">
          <p className="text-[0.68rem] text-[#1b1713]/50" data-testid="computer-task-summary">
            {selectedTask.taskType} · {selectedTask.status} · {selectedTask.resultSummary || 'waiting'}
          </p>
          {selectedTask.problemsFound.length > 0 ? (
            <ul data-testid="computer-task-problems" className="text-[0.65rem] text-[#1b1713]/55 list-disc pl-4">
              {selectedTask.problemsFound.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
