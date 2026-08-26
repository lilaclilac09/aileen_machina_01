'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComputerTask, ComputerTaskType } from '../lib/computer/types';
import type { HarnessPlugin } from '../lib/computer/plugins';
import { HARNESS_PLUGINS } from '../lib/computer/plugins';
import type { ProofItem } from '../lib/proofQueue/types';

type QueuePayload = {
  ok?: boolean;
  tasks?: ComputerTask[];
  proof?: ProofItem[];
  plugins?: HarnessPlugin[];
};

const LED: Record<string, string> = {
  queued: '#c9a227',
  running: '#00a89d',
  in_progress: '#00a89d',
  completed: '#2f6f4e',
  needs_screenshots: '#c46b2e',
  ready_for_review: '#008f86',
  failed: '#a33b32',
  observed: '#8a8378',
  proposed: '#6b8f8c',
  approved: '#007d75',
  rejected: '#a33b32',
  shipped: '#2f6f4e',
  needs_input: '#c9a227',
};

function Dot({ status }: { status: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: LED[status] || '#8a8378',
        boxShadow: status === 'running' || status === 'in_progress' ? '0 0 0 3px rgba(0,168,157,0.18)' : 'none',
      }}
    />
  );
}

export default function ProofQueuePanel() {
  const [tasks, setTasks] = useState<ComputerTask[]>([]);
  const [proof, setProof] = useState<ProofItem[]>([]);
  const [plugins, setPlugins] = useState<HarnessPlugin[]>([...HARNESS_PLUGINS]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [flash, setFlash] = useState('⚡ Ready. Visitor chat still answers. Heavy work queues here.');
  const [busy, setBusy] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/agent/computer/tasks', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as QueuePayload;
    setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    setProof(Array.isArray(data.proof) ? data.proof : []);
    if (Array.isArray(data.plugins) && data.plugins.length) setPlugins(data.plugins);
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

  const selectedProofItem = useMemo(
    () => proof.find((p) => p.id === selectedProof) ?? proof[0] ?? null,
    [proof, selectedProof],
  );

  const queue = async (taskType: ComputerTaskType, proofItemId?: string) => {
    setBusy(true);
    setFlash('⚡ queued.');
    try {
      const res = await fetch('/api/agent/computer/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          proofItemId: proofItemId || selectedProofItem?.id,
          route: taskType === 'draft_daily_fix_plan' ? '/daily' : selectedProofItem?.route || '/proof',
          scope: 'prototype',
          instructions:
            taskType === 'write_scratch_file'
              ? 'write /scratch/hello.txt and read it back'
              : 'prepare fix for /daily owner key UI',
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        spoken?: string;
        task?: ComputerTask;
        proofItem?: ProofItem;
        error?: string;
      };
      if (!res.ok) {
        setFlash(`⚡ Nope. ${data.error || res.status}`);
        return;
      }
      setFlash(data.spoken || `${data.message || '⚡ queued.'} I am still here. No merge.`);
      if (data.task?.id) setSelected(data.task.id);
      if (data.proofItem?.id) setSelectedProof(data.proofItem.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const runPlugin = (plugin: HarnessPlugin) => {
    if (plugin.kind === 'merge-gate') {
      setMergeOpen(true);
      setFlash(
        '⚡ Merge stays in this window as a gate. Approve or reject the proof. GitHub merge is not a plugin. Not DeepSeek Harness.',
      );
      return;
    }
    if (!plugin.taskType) return;
    void queue(plugin.taskType);
  };

  const proofAction = async (id: string, action: 'approve' | 'reject') => {
    setBusy(true);
    try {
      const res = await fetch('/api/agent/proof', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash(`⚡ Nope. ${data.error || res.status}`);
        return;
      }
      setFlash(
        action === 'approve'
          ? `⚡ Approved ${id}. Still not merged. Computer does not deploy.`
          : `⚡ Rejected ${id}. Queue left it. I am still here.`,
      );
      await load();
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    await fetch(`/api/agent/computer/tasks/${id}/cancel`, { method: 'POST', credentials: 'include' });
    setFlash('⚡ Nope. Cancelled. I am still here.');
    await load();
  };

  return (
    <div className="space-y-8" data-testid="proof-queue-panel" data-harness="machina-owner-prototype">
      <p className="font-mono text-[0.7rem] tracking-[0.08em] text-[#008f86] whitespace-pre-wrap" data-testid="proof-flash">
        {flash}
      </p>
      <p className="text-[0.82rem] leading-relaxed text-[#1b1713]/55 max-w-2xl">
        One owner window: plugins, proof, computer, merge gate. Public chat still
        answers. This is Machina&apos;s harness prototype — not DeepSeek Harness,
        not Cloudflare Computer, not production merge.
      </p>

      <section>
        <h2 className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85 mb-3">
          plugins
        </h2>
        <div className="flex flex-wrap gap-2" data-testid="harness-plugin-dock">
          {plugins.map((plugin) => (
            <button
              key={plugin.id}
              type="button"
              data-testid={`harness-plugin-${plugin.id}`}
              disabled={busy}
              title={plugin.blurb}
              onClick={() => runPlugin(plugin)}
              className="min-h-11 font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc] disabled:opacity-40"
            >
              {plugin.label}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[0.55rem] tracking-[0.08em] text-[#1b1713]/40">
          slots are allowlisted. more plugins can dock here. none of them merge.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="proof-queue-daily"
          disabled={busy}
          onClick={() => void queue('draft_daily_fix_plan')}
          className="min-h-11 font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc] disabled:opacity-40"
        >
          queue /daily plan
        </button>
        <button
          type="button"
          data-testid="proof-queue-scratch"
          disabled={busy}
          onClick={() => void queue('write_scratch_file')}
          className="min-h-11 font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc] disabled:opacity-40"
        >
          write scratch file
        </button>
      </div>

      <section>
        <h2 className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85 mb-3">
          proof queue
        </h2>
        <ul className="space-y-2" data-testid="proof-item-list">
          {proof.map((item) => (
            <li key={item.id} data-testid={`proof-item-${item.id}`}>
              <button
                type="button"
                onClick={() => setSelectedProof(item.id)}
                className={`w-full text-left border bg-white px-4 py-3 ${
                  selectedProofItem?.id === item.id ? 'border-[#00a89d]/70' : 'border-[#ded8ce]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Dot status={item.status} />
                  <span className="font-medium">{item.title}</span>
                  <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#1b1713]/45">
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-[0.78rem] text-[#1b1713]/55">
                  {item.id} · {item.route} · {item.problem}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {mergeOpen ? (
        <section
          data-testid="harness-merge-pane"
          className="border border-[#ded8ce] bg-white px-4 py-4 space-y-3"
        >
          <h2 className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#c46b2e]">
            merge gate · same window · never auto
          </h2>
          <p className="text-[0.8rem] leading-relaxed text-[#1b1713]/60">
            Approve or reject the selected proof here. This does not call GitHub
            merge. This does not deploy. This is not DeepSeek Harness.
          </p>
          {selectedProofItem ? (
            <p className="font-mono text-[0.7rem] text-[#1b1713]/70">
              {selectedProofItem.id} · {selectedProofItem.status}
            </p>
          ) : (
            <p className="text-[0.8rem] text-[#1b1713]/45">pick a proof item</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="harness-approve"
              disabled={busy || !selectedProofItem}
              onClick={() => selectedProofItem && void proofAction(selectedProofItem.id, 'approve')}
              className="min-h-11 font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc] disabled:opacity-40"
            >
              approve
            </button>
            <button
              type="button"
              data-testid="harness-reject"
              disabled={busy || !selectedProofItem}
              onClick={() => selectedProofItem && void proofAction(selectedProofItem.id, 'reject')}
              className="min-h-11 font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#a33b32] border border-[#a33b32]/35 bg-white px-4 py-2 hover:bg-[#fff4f2] disabled:opacity-40"
            >
              reject
            </button>
            <button
              type="button"
              data-testid="harness-merge-blocked"
              disabled
              title="GitHub merge is owner-only and not a plugin"
              className="min-h-11 font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#1b1713]/30 border border-[#ded8ce] bg-[#f6f3ee] px-4 py-2 cursor-not-allowed"
            >
              merge (blocked)
            </button>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85 mb-3">
          computer tasks
        </h2>
        <ul className="space-y-2" data-testid="computer-task-list">
          {tasks.length === 0 ? (
            <li className="text-[0.8rem] text-[#1b1713]/45">none yet</li>
          ) : (
            tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  data-testid={`computer-task-${task.status}`}
                  onClick={() => setSelected(task.id)}
                  className="w-full text-left border border-[#ded8ce] bg-white px-4 py-3 hover:border-[#00a89d]/50"
                >
                  <div className="flex items-center gap-2">
                    <Dot status={task.status} />
                    <span className="font-mono text-[0.72rem]">{task.taskType}</span>
                    <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#1b1713]/45">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.78rem] text-[#1b1713]/55">
                    {task.proofItemId} · {task.route} · {task.resultSummary || task.instructions || 'queued'}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      {selectedTask ? (
        <section
          data-testid="computer-task-detail"
          className="border border-[#ded8ce] bg-white px-4 py-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Dot status={selectedTask.status} />
            <h3 className="font-mono text-[0.7rem] tracking-[0.12em] uppercase">
              {selectedTask.id}
            </h3>
            {(selectedTask.status === 'queued' || selectedTask.status === 'running') && (
              <button
                type="button"
                onClick={() => void cancel(selectedTask.id)}
                className="ml-auto font-mono text-[0.58rem] tracking-[0.2em] uppercase text-[#a33b32]"
              >
                cancel
              </button>
            )}
          </div>
          <p className="text-[0.8rem] text-[#1b1713]/60" data-testid="computer-task-summary">
            {selectedTask.resultSummary || 'waiting'}
          </p>
          {selectedTask.filesInspected.length > 0 ? (
            <div>
              <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#1b1713]/40">files inspected</p>
              <ul className="mt-1 text-[0.75rem] leading-relaxed text-[#1b1713]/70 break-all">
                {selectedTask.filesInspected.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selectedTask.problemsFound.length > 0 ? (
            <div data-testid="computer-task-problems">
              <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#1b1713]/40">problems</p>
              <ul className="mt-1 text-[0.75rem] leading-relaxed text-[#1b1713]/70 list-disc pl-4 break-words">
                {selectedTask.problemsFound.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selectedTask.artifacts[0]?.preview ? (
            <pre
              data-testid="computer-task-report"
              className="whitespace-pre-wrap text-[0.72rem] leading-relaxed text-[#1b1713]/75 max-h-72 overflow-auto"
            >
              {selectedTask.artifacts[0].preview}
            </pre>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
