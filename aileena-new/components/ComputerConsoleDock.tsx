'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComputerTask } from '../lib/computer/types';
import type { ProofItem } from '../lib/proofQueue/types';

type AppTab = 'note' | 'find' | 'git';

type Light = 'idle' | 'running' | 'blocked' | 'done' | 'failed';

const LIGHT_COLOR: Record<Light, string> = {
  idle: '#b8b2a8',
  running: '#008f86',
  blocked: '#c4a35a',
  done: '#2f7d4a',
  failed: '#a33b32',
};

const APP_TABS: AppTab[] = ['note', 'find', 'git'];

function lightForApp(tab: AppTab, tasks: ComputerTask[]): Light {
  const related = tasks.filter((t) => {
    if (tab === 'note') return t.taskType === 'write_scratch_file';
    if (tab === 'find') return t.taskType.startsWith('files_');
    return t.taskType.startsWith('git_');
  });
  const latest = related[0];
  if (!latest) return 'idle';
  if (latest.status === 'queued' || latest.status === 'running') return 'running';
  if (latest.status === 'blocked' || latest.status === 'needs_input') return 'blocked';
  if (latest.status === 'failed') return 'failed';
  if (latest.status === 'completed') return 'done';
  return 'idle';
}

function compactCopy(status: string): string {
  if (status === 'queued') return '⚡ queued.';
  if (status === 'running') return '⚡ running.';
  if (status === 'completed' || status === 'done') return '⚡ done.';
  if (status === 'failed') return '⚡ failed.';
  if (status === 'blocked') return '⚡ blocked.';
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
  const [flash, setFlash] = useState('⚡ three apps: note, find, git');
  const [cloudflare, setCloudflare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<ComputerTask[]>([]);
  const [proof, setProof] = useState<ProofItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<AppTab>('note');
  const [note, setNote] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const prevStatus = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/agent/computer/tasks', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      tasks?: ComputerTask[];
      proof?: ProofItem[];
      cloudflareComputer?: boolean;
    };
    setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    setProof(Array.isArray(data.proof) ? data.proof.filter((p) => p.status !== 'shipped') : []);
    setCloudflare(Boolean(data.cloudflareComputer));
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
        if (t.status === 'completed') setFlash('⚡ done.');
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
  const gitLogTask = tasks.find((t) => t.taskType === 'git_log' && t.status === 'completed') ?? tasks.find((t) => t.taskType === 'git_log') ?? null;
  const gitStatusTask = tasks.find((t) => t.taskType === 'git_status') ?? null;
  const noteTask =
    tasks.find((t) => t.taskType === 'write_scratch_file' && t.status === 'completed') ??
    tasks.find((t) => t.taskType === 'write_scratch_file') ??
    null;
  const findTask =
    tasks.find((t) => (t.taskType === 'files_search' || t.taskType === 'files_tree') && t.status === 'completed') ??
    tasks.find((t) => t.taskType === 'files_search' || t.taskType === 'files_tree') ??
    null;

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
      setFlash(data.spoken || '⚡ queued.');
      if (data.task?.id) setSelected(data.task.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const btn =
    'min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#007d75] border border-[#00a89d]/35 bg-white px-2 py-1 disabled:opacity-40';

  return (
    <div
      data-testid="computer-console-dock"
      data-harness="machina-owner-prototype"
      data-open-proof={String(proof.length)}
      className="border-t border-[#e7e0d6] px-4 py-2 space-y-2 bg-[#fffcf7]/80 max-h-[46vh] overflow-y-auto"
    >
      <p className="font-mono text-[0.52rem] tracking-[0.2em] uppercase text-[#008f86]/80">
        computer · {cloudflare ? 'worker-shell' : 'local shim'}
      </p>
      <p className="font-mono text-[0.62rem] leading-relaxed text-[#008f86] whitespace-pre-wrap" data-testid="proof-flash">
        {flash}
      </p>
      <div className="flex flex-wrap gap-1" data-testid="computer-tabs">
        {APP_TABS.map((id) => {
          const light = lightForApp(id, tasks);
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
              {id}
            </button>
          );
        })}
      </div>

      {tab === 'note' ? (
        <div className="space-y-2" data-testid="computer-tab-panel-note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a line to keep"
            rows={3}
            className="w-full font-mono text-[0.72rem] border border-[#e7e0d6] bg-white px-2 py-1.5 text-[#1b1713]"
            aria-label="note"
          />
          <button
            type="button"
            className={btn}
            disabled={busy || !note.trim()}
            data-testid="harness-plugin-note"
            onClick={() => void queue({ taskType: 'write_scratch_file', instructions: note.trim() })}
          >
            save
          </button>
          <pre className="font-mono text-[0.52rem] leading-relaxed text-[#1b1713]/60 whitespace-pre-wrap max-h-24 overflow-y-auto">
            {noteTask?.artifacts[0]?.preview || compactCopy(noteTask?.status || 'idle')}
          </pre>
        </div>
      ) : null}

      {tab === 'find' ? (
        <div className="space-y-2" data-testid="computer-tab-panel-find">
          <div className="flex flex-wrap gap-1.5">
            <input
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="search workspace"
              className="min-h-9 flex-1 min-w-[10rem] font-mono text-[0.58rem] border border-[#e7e0d6] bg-white px-2"
              aria-label="search workspace"
            />
            <button
              type="button"
              className={btn}
              disabled={busy || !findQuery.trim()}
              data-testid="harness-plugin-find"
              onClick={() =>
                void queue({
                  taskType: 'files_search',
                  instructions: `/workspace ${findQuery.trim()}`,
                })
              }
            >
              search
            </button>
            <button
              type="button"
              className={btn}
              disabled={busy}
              data-testid="files-action-workspace"
              onClick={() => void queue({ taskType: 'files_tree', instructions: '/workspace' })}
            >
              list
            </button>
          </div>
          <pre
            data-testid="files-readonly"
            className="font-mono text-[0.52rem] leading-relaxed text-[#1b1713]/60 whitespace-pre-wrap max-h-28 overflow-y-auto"
          >
            {findTask?.artifacts[0]?.preview || compactCopy(findTask?.status || 'idle')}
          </pre>
        </div>
      ) : null}

      {tab === 'git' ? (
        <div className="space-y-2" data-testid="computer-tab-panel-git">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btn}
              disabled={busy}
              data-testid="git-action-status"
              onClick={() => void queue({ taskType: 'git_status', instructions: 'git status --short' })}
            >
              status
            </button>
            <button
              type="button"
              className={btn}
              disabled={busy}
              data-testid="git-action-recent"
              onClick={() => void queue({ taskType: 'git_log', route: '/sound', instructions: 'n:20' })}
            >
              recent
            </button>
          </div>
          {gitStatusTask?.resultSummary ? (
            <p className="font-mono text-[0.58rem] text-[#1b1713]/55 whitespace-pre-wrap">{gitStatusTask.resultSummary}</p>
          ) : null}
          {gitLogTask ? (
            <ul data-testid="git-recent-commits" className="space-y-0.5 font-mono text-[0.55rem] text-[#1b1713]/60">
              {(gitLogTask.artifacts[0]?.preview || gitLogTask.resultSummary)
                .split('\n')
                .filter(Boolean)
                .slice(0, 10)
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          ) : null}
          <p data-testid="git-merge-candidates" className="sr-only">
            inspect only
          </p>
        </div>
      ) : null}

      <button
        type="button"
        data-testid="harness-merge-blocked"
        disabled
        title="GitHub merge is owner-only and not a plugin"
        className="min-h-8 font-mono text-[0.45rem] tracking-[0.16em] uppercase text-[#1b1713]/25"
      >
        merge blocked
      </button>

      <ul className="space-y-1" data-testid="computer-task-list">
        {tasks.length === 0 ? (
          <li className="text-[0.68rem] text-[#1b1713]/40">empty</li>
        ) : (
          tasks.slice(0, 4).map((task) => (
            <li key={task.id}>
              <button
                type="button"
                data-testid={`computer-task-${task.status}`}
                onClick={() => setSelected(task.id)}
                className="w-full text-left font-mono text-[0.58rem] text-[#1b1713]/60"
              >
                {task.taskType === 'write_scratch_file'
                  ? 'note'
                  : task.taskType.startsWith('files_')
                    ? 'find'
                    : task.taskType.startsWith('git_')
                      ? 'git'
                      : task.taskType}{' '}
                · {compactCopy(task.status)}
              </button>
            </li>
          ))
        )}
      </ul>
      {selectedTask ? (
        <div data-testid="computer-task-detail" className="space-y-1">
          <p className="text-[0.68rem] text-[#1b1713]/50" data-testid="computer-task-summary">
            {selectedTask.resultSummary || compactCopy(selectedTask.status)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
