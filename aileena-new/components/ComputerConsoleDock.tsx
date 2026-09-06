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

function verb(task: ComputerTask): string {
  if (task.taskType === 'write_scratch_file') return 'note';
  if (task.taskType.startsWith('files_')) return 'find';
  if (task.taskType.startsWith('git_')) return 'git';
  return task.taskType;
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
  if (!task) return `idle · ${backend}\nwaiting`;
  const now = `NOW  ${verb(task)} · ${task.status}`;
  const cmd = task.instructions.replace(/\s+/g, ' ').trim().slice(0, 80);
  const logs = task.logsRedacted.slice(-10).join('\n');
  const bit = (task.error || task.artifacts[0]?.preview || task.resultSummary || '').trim().slice(0, 360);
  return [now, cmd, logs, bit ? `──\n${bit}` : ''].filter(Boolean).join('\n');
}

function chipKey(alias: string): string {
  return alias.replace(/[^\w\u4e00-\u9fff-]+/g, '-').slice(0, 40) || 'chip';
}

/**
 * Computer lives inside the site-agent dialog. Not a separate window.
 * Hidden until the Computer header toggle. Visitors get a scratch pad only.
 */
export default function ComputerConsoleDock({ isOwner }: { isOwner: boolean }) {
  const [flash, setFlash] = useState('waiting');
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
        if (t.status === 'queued') setFlash('queued');
        else if (t.status === 'running') setFlash(`${verb(t)}…`);
        continue;
      }
      if (prev !== t.status) {
        if (t.status === 'completed') setFlash(`${verb(t)} done`);
        else if (t.status === 'blocked') setFlash('blocked');
        else if (t.status === 'failed') setFlash('failed');
        else if (t.status === 'running') setFlash(`${verb(t)}…`);
        else if (t.status === 'queued') setFlash('queued');
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
      setFlash('scratch pad only');
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
      setFlash('queued');
      if (data.task?.id) setSelected(data.task.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const go = () => {
    const raw = line.trim();
    if (!raw) return;
    const parsed = parseLine(raw);
    setTab(parsed.taskType === 'write_scratch_file' ? 'note' : parsed.taskType.startsWith('git_') ? 'git' : 'find');
    void queue({ ...parsed, phrase: raw });
  };

  return (
    <div
      data-testid="computer-console-dock"
      data-harness="machina-owner-prototype"
      data-open-proof={String(proof.length)}
      className="border-b border-[#e7e0d6] px-3 py-2 space-y-1.5 bg-[#fffcf7]/90 shrink-0"
    >
      <p className="font-mono text-[0.52rem] tracking-[0.18em] uppercase text-[#008f86]/80" data-testid="proof-flash">
        computer · {backend} · {flash}
      </p>

      <pre
        ref={logRef}
        data-testid="computer-monitor"
        data-live={live ? '1' : '0'}
        className={`font-mono text-[0.58rem] leading-relaxed text-[#1b1713]/75 whitespace-pre-wrap max-h-40 overflow-y-auto bg-white border border-[#e7e0d6] px-2 py-1.5 ${live ? 'border-[#00a89d]/50' : ''}`}
      >
        {monitorText(selectedTask, backend)}
      </pre>

      <div className="flex flex-wrap gap-1" data-testid="computer-learned">
        {chips.map((chip) => (
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
            className="min-h-9 px-2 font-mono text-[0.52rem] tracking-[0.12em] uppercase text-[#007d75] border border-[#00a89d]/35 bg-white disabled:opacity-40"
          >
            {chip.alias}
          </button>
        ))}
      </div>

      <form
        className="sr-only"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="note,  find word,  git status"
          aria-label="note"
          className="min-h-9 flex-1 font-mono text-[0.72rem] border border-[#e7e0d6] bg-white px-2 text-[#1b1713]"
        />
        <button
          type="submit"
          disabled={busy || !line.trim()}
          data-testid="harness-plugin-note"
          className="min-h-9 font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#007d75] border border-[#00a89d]/40 bg-white px-3 disabled:opacity-40"
        >
          go
        </button>
      </form>

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
              {verb(task)} · {task.status}
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
  );
}
