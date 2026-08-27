'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComputerTask } from '../lib/computer/types';
import type { ProofItem } from '../lib/proofQueue/types';
import { HARNESS_PLUGINS } from '../lib/computer/plugins';

/**
 * Computer lives inside the site-agent dialog. Not a separate window.
 */
export default function ComputerConsoleDock() {
  const [flash, setFlash] = useState('⚡ computer ready · same dialog');
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<ComputerTask[]>([]);
  const [proof, setProof] = useState<ProofItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

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

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selected) ?? tasks[0] ?? null,
    [tasks, selected],
  );
  const hung = proof.find((p) => p.status !== 'shipped' && p.status !== 'rejected') ?? null;

  const run = async (pluginId: string) => {
    const plugin = HARNESS_PLUGINS.find((p) => p.id === pluginId);
    if (!plugin) return;
    if (plugin.kind === 'merge-gate') {
      setFlash('⚡ Merge stays in this dialog as a gate. GitHub merge is not a plugin.');
      return;
    }
    if (!plugin.taskType) return;
    setBusy(true);
    try {
      const res = await fetch('/api/agent/computer/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: plugin.taskType,
          route: plugin.taskType === 'draft_daily_fix_plan' ? '/daily' : '/proof',
          proofItemId: hung?.id,
          instructions: plugin.blurb,
        }),
      });
      const data = (await res.json()) as {
        spoken?: string;
        error?: string;
        task?: ComputerTask;
        proofItem?: ProofItem;
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

  return (
    <div
      data-testid="computer-console-dock"
      data-harness="machina-owner-prototype"
      className="border-t border-[#e7e0d6] px-4 py-2 space-y-2 bg-[#fffcf7]/80 max-h-[42vh] overflow-y-auto"
    >
      <p className="font-mono text-[0.52rem] tracking-[0.2em] uppercase text-[#008f86]/80">
        computer · same dialog · not a window
      </p>
      <p className="font-mono text-[0.62rem] leading-relaxed text-[#008f86] whitespace-pre-wrap" data-testid="proof-flash">
        {flash}
      </p>
      <div className="flex flex-wrap gap-1.5" data-testid="harness-plugin-dock">
        {HARNESS_PLUGINS.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={`harness-plugin-${p.id}`}
            disabled={busy}
            onClick={() => void run(p.id)}
            className="min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#007d75] border border-[#00a89d]/35 bg-white px-2 py-1 disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          data-testid="harness-approve"
          disabled={busy || !hung}
          onClick={() => void proofAction('approve')}
          className="min-h-9 font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#007d75] border border-[#00a89d]/35 bg-white px-2 py-1 disabled:opacity-40"
        >
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
      {hung ? (
        <p className="text-[0.68rem] text-[#1b1713]/50">
          hung on {hung.id} · {hung.status}
        </p>
      ) : null}
      <ul className="space-y-1" data-testid="computer-task-list">
        {tasks.length === 0 ? (
          <li className="text-[0.68rem] text-[#1b1713]/40">no computer tasks yet</li>
        ) : (
          tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                data-testid={`computer-task-${task.status}`}
                onClick={() => setSelected(task.id)}
                className="w-full text-left font-mono text-[0.58rem] text-[#1b1713]/60"
              >
                {task.taskType} · {task.status}
              </button>
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
