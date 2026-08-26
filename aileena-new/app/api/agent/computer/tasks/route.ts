import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { checkRateLimit, COMPUTER_TASK_RATE } from '@/lib/api/ratelimit';
import { COMPUTER_LIMITS, forbiddenShellFields, isComputerTaskType } from '@/lib/computer/allowlist';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { clip, redactSecrets } from '@/lib/computer/redact';
import { runComputerTask } from '@/lib/computer/runner';
import { canEnqueueTask, getComputerTask, listComputerTasks, newId, nowIso, upsertComputerTask } from '@/lib/computer/store';
import type { ComputerTask } from '@/lib/computer/types';
import {
  attachTaskToProof,
  getProofItem,
  listProofItems,
  newProofId,
  upsertProofItem,
} from '@/lib/proofQueue/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error, prototype: true, backend: 'local-shim' }, { status });
}

export async function GET(req: Request) {
  if (!isComputerPrototypeEnabled()) return deny(404, prototypeDisabledReason());
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return deny(403, 'Owner only.');
  return NextResponse.json({
    ok: true,
    prototype: true,
    backend: 'local-shim',
    cloudflareComputer: false,
    tasks: listComputerTasks(),
    proof: listProofItems(),
  });
}

export async function POST(req: Request) {
  if (!isComputerPrototypeEnabled()) return deny(404, prototypeDisabledReason());
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return deny(403, 'Owner only.');

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return deny(400, 'invalid');
  }

  const forbidden = forbiddenShellFields(body);
  if (forbidden.length) {
    return deny(400, `Arbitrary shell is not allowed (${forbidden.join(', ')}).`);
  }

  if (!isComputerTaskType(body.taskType)) {
    return deny(400, 'taskType is not on the allowlist.');
  }

  const rl = checkRateLimit(req, COMPUTER_TASK_RATE, 'computer-tasks');
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limit', prototype: true },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const gate = canEnqueueTask();
  if (!gate.ok) return deny(409, gate.error);

  const route = clip(typeof body.route === 'string' ? body.route : '/daily', 80) || '/daily';
  const scope = clip(typeof body.scope === 'string' ? body.scope : 'prototype', COMPUTER_LIMITS.scopeChars);
  const instructions = redactSecrets(
    clip(typeof body.instructions === 'string' ? body.instructions : '', COMPUTER_LIMITS.instructionChars),
  );

  let proofItemId = typeof body.proofItemId === 'string' ? body.proofItemId.trim() : '';
  let proof = proofItemId ? getProofItem(proofItemId) : null;
  if (!proof) {
    const seeded =
      route === '/daily'
        ? getProofItem('proof-daily-owner-key')
        : null;
    proof = seeded;
    if (!proof) {
      const now = nowIso();
      proof = upsertProofItem({
        id: newProofId(),
        title: clip(instructions || `${body.taskType} ${route}`, 120) || 'computer task',
        route,
        problem: instructions || 'owner computer task',
        proposedChange: '',
        source: 'computer',
        status: 'proposed',
        risk: 'medium',
        acceptanceCriteria: ['Owner reviews report', 'No merge without approval', 'Screenshots before ready_for_review'],
        screenshots: [],
        filesChanged: [],
        checksRun: [],
        computerTaskIds: [],
        resultSummary: '',
        createdAt: now,
        updatedAt: now,
      });
    }
    proofItemId = proof.id;
  }

  const now = nowIso();
  const task: ComputerTask = {
    id: newId('ctask'),
    proofItemId,
    taskType: body.taskType,
    status: 'queued',
    route,
    scope,
    instructions,
    resultSummary: '',
    artifacts: [],
    logsRedacted: ['queued'],
    filesInspected: [],
    problemsFound: [],
    proposedFilesToChange: [],
    implementationPlan: [],
    risksBlockers: [],
    backend: 'local-shim',
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelled: false,
  };
  upsertComputerTask(task);
  attachTaskToProof(proofItemId, task.id, 'approved');

  after(async () => {
    await runComputerTask(task.id);
  });

  return NextResponse.json(
    {
      ok: true,
      message: '⚡ queued.',
      prototype: true,
      backend: 'local-shim',
      cloudflareComputer: false,
      task: getComputerTask(task.id),
      proofItem: getProofItem(proofItemId),
    },
    { status: 202 },
  );
}
