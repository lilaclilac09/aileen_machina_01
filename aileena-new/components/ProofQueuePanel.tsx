'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComputerTask } from '../lib/computer/types';
import type { ProofItem } from '../lib/proofQueue/types';

type QueuePayload = {
  ok?: boolean;
  tasks?: ComputerTask[];
  proof?: ProofItem[];
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
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState('⚡ Ready.');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/agent/computer/tasks', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as QueuePayload;
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

  const queue = async (taskType: 'draft_daily_fix_plan' | 'write_scratch_file') => {
    setBusy(true);
    setFlash('⚡ queued.');
    try {
      const res = await fetch('/api/agent/computer/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          route: taskType === 'draft_daily_fix_plan' ? '/daily' : '/proof',
          scope: 'prototype',
          instructions:
            taskType === 'draft_daily_fix_plan'
              ? 'prepare fix for /daily owner key UI'
              : 'write /scratch/hello.txt and read it back',
        }),
      });
      const data = (await res.json()) as { message?: string; task?: ComputerTask; error?: string };
      if (!res.ok) {
        setFlash(`⚡ Nope. ${data.error || res.status}`);
        return;
      }
      setFlash(data.message || '⚡ queued.');
      if (data.task?.id) setSelected(data.task.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    await fetch(`/api/agent/computer/tasks/${id}/cancel`, { method: 'POST', credentials: 'include' });
    setFlash('⚡ Nope. Cancelled.');
    await load();
  };

  return (
    <div className="space-y-8" data-testid="proof-queue-panel">
      <p className="font-mono text-[0.7rem] tracking-[0.08em] text-[#008f86]" data-testid="proof-flash">
        {flash}
      </p>
      <p className="text-[0.82rem] leading-relaxed text-[#1b1713]/55 max-w-2xl">
        Prototype computer: local shim, not Cloudflare Durable Objects. Fast path
        stays the site agent. This worker inspects, plans, and writes scratch
        reports. It does not merge, deploy, or take visitor shell.
      </p>

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
            <li
              key={item.id}
              className="border border-[#ded8ce] bg-white px-4 py-3 text-[0.85rem]"
              data-testid={`proof-item-${item.id}`}
            >
              <div className="flex items-center gap-2">
                <Dot status={item.status} />
                <span className="font-medium">{item.title}</span>
                <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#1b1713]/45">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-[0.78rem] text-[#1b1713]/55">{item.route} · {item.problem}</p>
            </li>
          ))}
        </ul>
      </section>

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
                    {task.route} · {task.resultSummary || task.instructions || 'queued'}
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
              <ul className="mt-1 text-[0.75rem] leading-relaxed text-[#1b1713]/70">
                {selectedTask.filesInspected.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selectedTask.problemsFound.length > 0 ? (
            <div data-testid="computer-task-problems">
              <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#1b1713]/40">problems</p>
              <ul className="mt-1 text-[0.75rem] leading-relaxed text-[#1b1713]/70 list-disc pl-4">
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
