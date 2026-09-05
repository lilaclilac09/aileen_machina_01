import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { checkRateLimit, COMPUTER_TASK_RATE } from '@/lib/api/ratelimit';
import { COMPUTER_LIMITS, forbiddenShellFields, isComputerTaskType } from '@/lib/computer/allowlist';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { isCloudflareComputerReady, reportedBackend } from '@/lib/computer/cfClient';
import { clip, redactSecrets } from '@/lib/computer/redact';
import { runComputerTask } from '@/lib/computer/runner';
import { canEnqueueTask, getComputerTask, listComputerTasks, newId, nowIso, upsertComputerTask } from '@/lib/computer/store';
import type { ComputerTask } from '@/lib/computer/types';
import {
  attachTaskToProof,
  ensureProofItem,
  getProofItem,
  listProofItems,
  nextOpenProof,
  newProofId,
  SOUND_LAB_ROLLBACK_PROOF_ID,
  upsertProofItem,
} from '@/lib/proofQueue/store';
import { COMPUTER_TABS, TAB_WIRE } from '@/lib/computer/capabilities';
import { listHarnessPlugins } from '@/lib/computer/plugins';
import { spokenQueued } from '@/lib/computer/spokenQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error, prototype: true, backend: reportedBackend() }, { status });
}

export async function GET(req: Request) {
  if (!isComputerPrototypeEnabled()) return deny(404, prototypeDisabledReason());
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return deny(403, 'Owner only.');
  return NextResponse.json({
    ok: true,
    prototype: true,
    backend: reportedBackend(),
    cloudflareComputer: isCloudflareComputerReady(),
    tasks: listComputerTasks(),
    proof: listProofItems(),
    tabs: COMPUTER_TABS.map((id) => ({ id, wire: TAB_WIRE[id] })),
    plugins: listHarnessPlugins(),
    harness: 'machina-owner-prototype',
    deepSeekHarness: false,
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
  if (!proof && body.taskType === 'git_find_commit') {
    proof = ensureProofItem({
      id: SOUND_LAB_ROLLBACK_PROOF_ID,
      title: 'Sound Lab rollback investigation',
      route: '/sound',
      problem:
        'Find the commit where Sound Lab changes were merged. Inspection only. No checkout, no reset, no merge.',
      proposedChange: 'Report candidate commits. Do not roll back until the owner approves a separate task.',
      source: 'computer',
      status: 'proposed',
      risk: 'medium',
      acceptanceCriteria: [
        'Git find returns 3–5 candidates',
        'No repo mutation',
        'Owner reviews before any rollback',
      ],
      screenshots: [],
      filesChanged: [],
      checksRun: [],
      computerTaskIds: [],
      resultSummary: '',
    });
    proofItemId = proof.id;
  }
  if (!proof) {
    proof = nextOpenProof(route);
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
    backend: reportedBackend(),
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelled: false,
  };
  upsertComputerTask(task);
  const proofStatus =
    typeof body.taskType === 'string' &&
    (body.taskType.startsWith('git_') ||
      body.taskType.startsWith('files_') ||
      body.taskType.startsWith('email_') ||
      body.taskType.startsWith('browser_'))
      ? 'in_progress'
      : 'approved';
  attachTaskToProof(proofItemId, task.id, proofStatus);

  after(async () => {
    await runComputerTask(task.id);
  });

  const spoken = spokenQueued({
    taskType: task.taskType,
    route,
    proofItemId,
    proofTitle: proof.title,
  });

  return NextResponse.json(
    {
      ok: true,
      message: '⚡ queued.',
      spoken,
      prototype: true,
      backend: reportedBackend(),
      cloudflareComputer: isCloudflareComputerReady(),
      task: getComputerTask(task.id),
      proofItem: getProofItem(proofItemId),
    },
    { status: 202 },
  );
}
