'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComputerTask } from '../lib/computer/types';
import type { ProofItem } from '../lib/proofQueue/types';

type AppTab = 'note' | 'find' | 'git';
type LearnedChip = { alias: string; taskType: string; instructions: string; route: string };

const APP_TABS: AppTab[] = ['note', 'find', 'git'];

const OWNER_STARTER_CHIPS: LearnedChip[] = [
  { alias: 'git status', taskType: 'git_status', instructions: 'git status --short', route: '/proof' },
  { alias: 'list', taskType: 'files_tree', instructions: '/workspace', route: '/proof' },
];

const VISITOR_STARTER_CHIPS: LearnedChip[] = [
  { alias: 'list', taskType: 'files_tree', instructions: '/workspace', route: '/proof' },
];

/** One mark per act. Screen and keys share these. */
function sign(task: ComputerTask): string {
  if (task.taskType === 'write_scratch_file') return '+';
  if (task.taskType.startsWith('files_')) return '◎';
  if (task.taskType.startsWith('git_')) return '⎇';
  return '·';
}

function SignMark({ kind }: { kind: 'note' | 'look' | 'find' | 'git' }) {
  const svg = {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.45,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (kind === 'note') {
    return (
      <svg {...svg}>
        <rect x="4.5" y="3.2" width="11" height="13.6" rx="1.2" />
        <path d="M7.2 8.2h5.6M7.2 11.4h3.6" />
      </svg>
    );
  }
  if (kind === 'look') {
    return (
      <svg {...svg}>
        <ellipse cx="10" cy="10" rx="7.2" ry="4.6" />
        <circle cx="10" cy="10" r="2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === 'find') {
    return (
      <svg {...svg}>
        <circle cx="8.4" cy="8.4" r="4.6" />
        <path d="M11.8 12.2 16 16.4" />
      </svg>
    );
  }
  return (
    <svg {...svg}>
      <circle cx="10" cy="4.4" r="1.55" fill="currentColor" stroke="none" />
      <circle cx="5.4" cy="15.2" r="1.55" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="15.2" r="1.55" fill="currentColor" stroke="none" />
      <path d="M10 6v3.4M10 9.4 5.4 13.6M10 9.4l4.6 4.2" />
    </svg>
  );
}

function parseLine(raw: string): { taskType: string; instructions: string; route?: string } {
  const t = raw.trim();
  if (/^git(\s+status)?$/i.test(t)) {
    return { taskType: 'git_status', instructions: 'git status --short' };
  }
  if (/^git\s+recent$/i.test(t) || /^recent$/i.test(t)) {
    return { taskType: 'git_log', route: '/sound', instructions: 'n:20' };
  }
  if (/^list$/i.test(t)) {
    return { taskType: 'files_tree', instructions: '/workspace' };
  }
  const find = /^find(?:\s+|:\s*)(.+)$/i.exec(t);
  if (find) {
    return { taskType: 'files_search', instructions: `/workspace ${find[1].trim().slice(0, 80)}` };
  }
  return {
    taskType: 'write_scratch_file',
    instructions: t.replace(/^note:\s*/i, '').slice(0, 4000),
  };
}

function monitorText(task: ComputerTask | null, backend: string): string {
  if (!task) return `◎\n${backend}`;
  const logs = task.logsRedacted.slice(-8).join('\n');
  const bit = (task.error || task.artifacts[0]?.preview || task.resultSummary || '').trim().slice(0, 360);
  return [logs, bit].filter(Boolean).join('\n');
}

const KEY_CLASS =
  'inline-flex flex-1 min-h-11 min-w-0 items-center justify-center px-2 rounded-[8px] text-[#007d75] border border-[#d8cfc0] border-b-2 border-b-[#c2b7a3] bg-white shadow-[0_1px_0_rgba(27,23,19,0.05)] active:translate-y-[1px] active:border-b disabled:opacity-40';

function chipKey(alias: string): string {
  return alias.replace(/[^\w\u4e00-\u9fff-]+/g, '-').slice(0, 40) || 'chip';
}

/**
 * Computer lives inside the site-agent dialog. Not a separate window.
 * Hidden until the Computer header toggle. Visitors get a scratch pad only.
 */
export default function ComputerConsoleDock({ isOwner }: { isOwner: boolean }) {
  const [flash, setFlash] = useState('◎');
  const [cloudflare, setCloudflare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<ComputerTask[]>([]);
  const [proof, setProof] = useState<ProofItem[]>([]);
  const [learned, setLearned] = useState<LearnedChip[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<AppTab>('note');
  const [line, setLine] = useState('');
  const prevStatus = useRef<Record<string, string>>({});
  const logRef = useRef<HTMLPreElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/agent/computer/tasks', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      tasks?: ComputerTask[];
      proof?: ProofItem[];
      cloudflareComputer?: boolean;
      learned?: LearnedChip[];
    };
    setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    setProof(Array.isArray(data.proof) ? data.proof.filter((p) => p.status !== 'shipped') : []);
    setCloudflare(Boolean(data.cloudflareComputer));
    setLearned(Array.isArray(data.learned) ? data.learned : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 900);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    for (const t of tasks) {
      const prev = prevStatus.current[t.id];
      if (!prev) {
        prevStatus.current[t.id] = t.status;
        if (t.status === 'queued') setFlash('…');
        else if (t.status === 'running') setFlash(`${sign(t)}…`);
        else if (t.status === 'completed') setFlash(sign(t));
        else if (t.status === 'failed') setFlash('×');
        else if (t.status === 'blocked') setFlash('×');
        continue;
      }
      if (prev !== t.status) {
        if (t.status === 'completed') setFlash(sign(t));
        else if (t.status === 'blocked') setFlash('×');
        else if (t.status === 'failed') setFlash('×');
        else if (t.status === 'running') setFlash(`${sign(t)}…`);
        else if (t.status === 'queued') setFlash('…');
      }
      prevStatus.current[t.id] = t.status;
    }
  }, [tasks]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selected) ?? tasks.find((t) => t.status === 'running' || t.status === 'queued') ?? tasks[0] ?? null,
    [tasks, selected],
  );

  const gitLogTask = tasks.find((t) => t.taskType === 'git_log' && t.status === 'completed') ?? tasks.find((t) => t.taskType === 'git_log') ?? null;
  const findTask =
    tasks.find((t) => (t.taskType === 'files_search' || t.taskType === 'files_tree') && t.status === 'completed') ??
    tasks.find((t) => t.taskType === 'files_search' || t.taskType === 'files_tree') ??
    null;

  const backend = cloudflare ? 'worker-shell' : 'local shim';
  const live = selectedTask?.status === 'queued' || selectedTask?.status === 'running';

  const chips = useMemo(() => {
    const seen = new Set<string>();
    const rows: LearnedChip[] = [];
    for (const row of [...(isOwner ? OWNER_STARTER_CHIPS : VISITOR_STARTER_CHIPS), ...(isOwner ? learned : [])]) {
      const key = row.alias.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (rows.length >= 6) break;
    }
    return rows;
  }, [learned, isOwner]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [selectedTask?.updatedAt, selectedTask?.logsRedacted.length]);

  const queue = async (opts: {
    taskType: string;
    route?: string;
    instructions?: string;
    proofItemId?: string;
    phrase?: string;
  }) => {
    if (
      !isOwner &&
      (opts.taskType.startsWith('git_') ||
        opts.taskType === 'files_open' ||
        opts.taskType.startsWith('email_') ||
        opts.taskType.startsWith('browser_') ||
        opts.taskType.startsWith('draft_') ||
        opts.taskType.startsWith('inspect_'))
    ) {
      setFlash('×');
      return;
    }
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
          phrase: opts.phrase,
        }),
      });
      const data = (await res.json()) as { spoken?: string; error?: string; task?: ComputerTask };
      if (!res.ok) {
        setFlash(data.error || String(res.status));
        return;
      }
      if (data.task?.id) setSelected(data.task.id);
      if (data.task?.status === 'completed') setFlash(sign(data.task));
      else if (data.task?.status === 'failed') setFlash('×');
      else if (data.task?.status === 'blocked') setFlash('×');
      else setFlash('…');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const noteNow = (raw: string) => {
    setTab('note');
    void queue({
      taskType: 'write_scratch_file',
      instructions: raw.slice(0, 4000),
      phrase: raw || 'note',
    });
    setLine('');
  };

  const lookNow = () => {
    setTab('find');
    void queue({ taskType: 'files_tree', instructions: '/workspace', phrase: 'list' });
  };

  const go = () => {
    const raw = line.trim();
    if (!raw) {
      noteNow('');
      return;
    }
    const parsed = parseLine(raw);
    setTab(parsed.taskType === 'write_scratch_file' ? 'note' : parsed.taskType.startsWith('git_') ? 'git' : 'find');
    void queue({ ...parsed, phrase: raw });
    setLine('');
  };

  return (
    <div
      data-testid="computer-console-dock"
      data-harness="machina-owner-prototype"
      data-open-proof={String(proof.length)}
      className="border-b border-[#e7e0d6] px-3 py-2 bg-[#fffcf7]/90 shrink-0"
    >
      {/* Small computer: cream chassis, teal screen, power light, keycaps. */}
      <div className="rounded-[12px] border border-[#d8cfc0] bg-[#f6f0e4] px-2.5 pt-2 pb-2.5 space-y-1.5 shadow-[inset_0_1px_0_#ffffff,0_2px_6px_rgba(27,23,19,0.08)]">
        <p className="flex items-center gap-1.5 font-mono text-[0.52rem] tracking-[0.18em] uppercase text-[#008f86]/80" data-testid="proof-flash">
          <span
            aria-hidden
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
              live ? 'bg-[#00a89d] shadow-[0_0_6px_rgba(0,168,157,0.9)]' : 'bg-[#c9bfae]'
            }`}
          />
          <span className="min-w-0 truncate">
            {backend}
            {isOwner ? '' : ' · 30d'} · {flash}
          </span>
        </p>

        <div
          className={`rounded-[8px] border p-1 bg-[#0b2422] shadow-[inset_0_2px_8px_rgba(0,0,0,0.55)] ${
            live ? 'border-[#00a89d]/60' : 'border-[#1b1713]/60'
          }`}
        >
          <pre
            ref={logRef}
            data-testid="computer-monitor"
            data-live={live ? '1' : '0'}
            className="font-mono text-[0.58rem] leading-relaxed text-[#8fe6dd] whitespace-pre-wrap max-h-24 overflow-y-auto px-2 py-1.5 [text-shadow:0_0_5px_rgba(0,168,157,0.35)]"
          >
            {monitorText(selectedTask, backend)}
          </pre>
        </div>

        <div className="flex gap-1.5" data-testid="computer-simple-keys">
          <button
            type="button"
            disabled={busy}
            data-testid="computer-key-note"
            aria-label="note"
            onClick={() => noteNow(line.trim())}
            className={KEY_CLASS}
          >
            <SignMark kind="note" />
          </button>
          <button
            type="button"
            disabled={busy}
            data-testid="computer-learned-list"
            aria-label="look"
            onClick={lookNow}
            className={KEY_CLASS}
          >
            <SignMark kind="look" />
          </button>
          <button
            type="button"
            disabled={busy}
            data-testid="computer-key-find"
            aria-label="find"
            onClick={() => {
              const q = line.trim().slice(0, 80);
              if (!q) {
                lookNow();
                return;
              }
              setTab('find');
              void queue({
                taskType: 'files_search',
                instructions: `/workspace ${q}`,
                phrase: `find ${q}`,
              });
            }}
            className={KEY_CLASS}
          >
            <SignMark kind="find" />
          </button>
          {isOwner ? (
            <button
              type="button"
              disabled={busy}
              data-testid="computer-learned-git-status"
              aria-label="git"
              onClick={() => {
                setTab('git');
                void queue({
                  taskType: 'git_status',
                  instructions: 'git status --short',
                  phrase: 'git status',
                });
              }}
              className={KEY_CLASS}
            >
              <SignMark kind="git" />
            </button>
          ) : null}
        </div>

        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            aria-label="note"
            className="min-h-11 min-w-0 flex-1 font-mono text-[0.8rem] rounded-[8px] border border-[#d8cfc0] bg-white px-2.5 text-[#1b1713]"
          />
          <button type="submit" disabled={busy} data-testid="harness-plugin-note" className="sr-only">
            note
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5" data-testid="computer-learned">
        {chips
          .filter((chip) => chip.alias !== 'list' && chip.alias !== 'git status')
          .map((chip) => (
          <button
            key={chip.alias}
            type="button"
            disabled={busy}
            data-testid={`computer-learned-${chipKey(chip.alias)}`}
            onClick={() =>
              void queue({
                taskType: chip.taskType,
                route: chip.route,
                instructions: chip.instructions,
                phrase: chip.alias,
              })
            }
            className="min-h-9 px-2.5 rounded-[6px] font-mono text-[0.52rem] tracking-[0.12em] uppercase text-[#007d75] border border-[#d8cfc0] border-b-2 border-b-[#c2b7a3] bg-white shadow-[0_1px_0_rgba(27,23,19,0.05)] active:translate-y-[1px] active:border-b disabled:opacity-40"
          >
            {chip.alias}
          </button>
        ))}
      </div>

      <div className="sr-only" data-testid="computer-tabs">
        {APP_TABS.map((id) => (
          <button key={id} type="button" data-testid={`computer-tab-${id}`} onClick={() => setTab(id)}>
            {id}
          </button>
        ))}
        <button
          type="button"
          data-testid="harness-plugin-find"
          onClick={() => void queue({ taskType: 'files_search', instructions: `/workspace ${line.trim() || 'hello'}`, phrase: `find ${line.trim() || 'hello'}` })}
        >
          find
        </button>
        <button
          type="button"
          data-testid="files-action-workspace"
          onClick={() => void queue({ taskType: 'files_tree', instructions: '/workspace', phrase: 'list' })}
        >
          list
        </button>
        <button
          type="button"
          data-testid="git-action-status"
          onClick={() => void queue({ taskType: 'git_status', instructions: 'git status --short', phrase: 'git status' })}
        >
          status
        </button>
        <button
          type="button"
          data-testid="git-action-recent"
          onClick={() => void queue({ taskType: 'git_log', route: '/sound', instructions: 'n:20', phrase: 'git recent' })}
        >
          recent
        </button>
        <button type="button" data-testid="harness-merge-blocked" disabled>
          merge blocked
        </button>
      </div>

      {tab === 'find' ? (
        <pre data-testid="files-readonly" className="sr-only">
          {findTask?.artifacts[0]?.preview || ''}
        </pre>
      ) : (
        <pre data-testid="files-readonly" className="sr-only">
          {findTask?.artifacts[0]?.preview || ''}
        </pre>
      )}

      {gitLogTask ? (
        <ul data-testid="git-recent-commits" className="sr-only">
          {(gitLogTask.artifacts[0]?.preview || gitLogTask.resultSummary)
            .split('\n')
            .filter(Boolean)
            .slice(0, 10)
            .map((row) => (
              <li key={row}>{row}</li>
            ))}
        </ul>
      ) : (
        <ul data-testid="git-recent-commits" className="sr-only" />
      )}
      <p data-testid="git-merge-candidates" className="sr-only">
        inspect only
      </p>

      <ul className="sr-only" data-testid="computer-task-list">
        {tasks.slice(0, 4).map((task) => (
          <li key={task.id}>
            <button type="button" data-testid={`computer-task-${task.status}`} onClick={() => setSelected(task.id)}>
              {sign(task)} · {task.status}
            </button>
          </li>
        ))}
      </ul>
      {selectedTask ? (
        <div data-testid="computer-task-detail" className="sr-only">
          <p data-testid="computer-task-summary">{selectedTask.resultSummary || selectedTask.status}</p>
        </div>
      ) : null}
      </div>
    </div>
  );
}
