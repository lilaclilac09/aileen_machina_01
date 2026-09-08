import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, COMPUTER_TASK_RATE, COMPUTER_VISITOR_TASK_RATE } from '@/lib/api/ratelimit';
import {
  COMPUTER_LIMITS,
  forbiddenShellFields,
  isComputerTaskType,
  isVisitorComputerTaskType,
} from '@/lib/computer/allowlist';
import { isComputerPrototypeEnabled, isVercelProduction, prototypeDisabledReason } from '@/lib/computer/flag';
import { isCloudflareComputerReady, reportedBackend } from '@/lib/computer/cfClient';
import { clip, redactSecrets } from '@/lib/computer/redact';
import { runComputerTask } from '@/lib/computer/runner';
import { canEnqueueTask, getComputerTask, hydrateComputerStore, listComputerTasks, newId, nowIso, upsertComputerTask } from '@/lib/computer/store';
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
import { spokenQueued, spokenVisitorQueued } from '@/lib/computer/spokenQueue';
import { labelForTask, listLearned, rememberCommand } from '@/lib/computer/learned';
import {
  applyComputerActorCookie,
  computerActorFromRequest,
  type ComputerActor,
} from '@/lib/computer/actor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VISITOR_PROOF_ID = 'visitor-scratch';

function deny(status: number, error: string, actor?: ComputerActor) {
  const res = NextResponse.json({ ok: false, error, prototype: true, backend: reportedBackend() }, { status });
  return actor ? applyComputerActorCookie(res, actor) : res;
}

function jsonActor(actor: ComputerActor, body: unknown, status = 200) {
  return applyComputerActorCookie(NextResponse.json(body, { status }), actor);
}

async function kickComputerTask(id: string): Promise<void> {
  const run = async () => {
    try {
      await runComputerTask(id);
    } catch (err) {
      const existing = getComputerTask(id);
      if (!existing) return;
      await upsertComputerTask({
        ...existing,
        status: 'failed',
        error: redactSecrets(err instanceof Error ? err.message : 'run failed'),
        resultSummary: `failed: ${redactSecrets(err instanceof Error ? err.message : 'run failed')}`,
        completedAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  };
  if (isCloudflareComputerReady() || isVercelProduction()) {
    await run();
    return;
  }
  after(run);
}

export async function GET(req: Request) {
  if (!isComputerPrototypeEnabled()) return deny(404, prototypeDisabledReason());
  const actor = await computerActorFromRequest(req);
  await hydrateComputerStore(actor.id);
  if (actor.kind === 'visitor') {
    return jsonActor(actor, {
      ok: true,
      prototype: true,
      backend: reportedBackend(),
      cloudflareComputer: isCloudflareComputerReady(),
      tasks: listComputerTasks(actor.id),
      proof: [],
      tabs: COMPUTER_TABS.map((id) => ({ id, wire: TAB_WIRE[id] })),
      plugins: [],
      learned: [],
      harness: 'machina-visitor-scratch',
      deepSeekHarness: false,
      actor: 'visitor',
    });
  }
  return jsonActor(actor, {
    ok: true,
    prototype: true,
    backend: reportedBackend(),
    cloudflareComputer: isCloudflareComputerReady(),
    tasks: listComputerTasks('owner'),
    proof: listProofItems(),
    tabs: COMPUTER_TABS.map((id) => ({ id, wire: TAB_WIRE[id] })),
    plugins: listHarnessPlugins(),
    learned: listLearned(),
    harness: 'machina-owner-prototype',
    deepSeekHarness: false,
    actor: 'owner',
  });
}

export async function POST(req: Request) {
  if (!isComputerPrototypeEnabled()) return deny(404, prototypeDisabledReason());
  const actor = await computerActorFromRequest(req);

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return deny(400, 'invalid', actor);
  }

  const forbidden = forbiddenShellFields(body);
  if (forbidden.length) {
    return deny(400, `Arbitrary shell is not allowed (${forbidden.join(', ')}).`, actor);
  }

  if (!isComputerTaskType(body.taskType)) {
    return deny(400, 'taskType is not on the allowlist.', actor);
  }

  if (actor.kind === 'visitor' && !isVisitorComputerTaskType(body.taskType)) {
    return deny(403, 'Scratch pad only. No site git, no merge, no owner computer.', actor);
  }

  const rl = checkRateLimit(
    req,
    actor.kind === 'visitor' ? COMPUTER_VISITOR_TASK_RATE : COMPUTER_TASK_RATE,
    actor.kind === 'visitor' ? 'computer-tasks-visitor' : 'computer-tasks',
  );
  if (!rl.ok) {
    const res = NextResponse.json(
      { ok: false, error: 'rate_limit', prototype: true },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
    return applyComputerActorCookie(res, actor);
  }

  const gate = await canEnqueueTask(actor.id);
  if (!gate.ok) return deny(409, gate.error, actor);

  const route = clip(typeof body.route === 'string' ? body.route : '/daily', 80) || '/daily';
  const scope = clip(typeof body.scope === 'string' ? body.scope : 'prototype', COMPUTER_LIMITS.scopeChars);
  const instructions = redactSecrets(
    clip(typeof body.instructions === 'string' ? body.instructions : '', COMPUTER_LIMITS.instructionChars),
  );

  if (actor.kind === 'visitor') {
    const now = nowIso();
    const task: ComputerTask = {
      id: newId('ctask'),
      actorId: actor.id,
      proofItemId: VISITOR_PROOF_ID,
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
    await upsertComputerTask(task);
    await kickComputerTask(task.id);
    return jsonActor(
      actor,
      {
        ok: true,
        message: '⚡ queued.',
        spoken: spokenVisitorQueued(task.taskType),
        prototype: true,
        backend: reportedBackend(),
        cloudflareComputer: isCloudflareComputerReady(),
        task: getComputerTask(task.id),
        proofItem: null,
        actor: 'visitor',
      },
      202,
    );
  }

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
    actorId: 'owner',
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
  await upsertComputerTask(task);
  const phrase = typeof body.phrase === 'string' ? body.phrase.trim().slice(0, 40) : '';
  const skipOneOffNote = task.taskType === 'write_scratch_file' && /^note:/i.test(phrase);
  if (!skipOneOffNote) {
    rememberCommand({
      alias: phrase || labelForTask(task.taskType, task.instructions),
      expands: phrase || labelForTask(task.taskType, task.instructions),
      taskType: task.taskType,
      instructions: task.instructions,
      route: task.route,
    });
  }
  const proofStatus =
    typeof body.taskType === 'string' &&
    (body.taskType.startsWith('git_') ||
      body.taskType.startsWith('files_') ||
      body.taskType.startsWith('email_') ||
      body.taskType.startsWith('browser_'))
      ? 'in_progress'
      : 'approved';
  attachTaskToProof(proofItemId, task.id, proofStatus);

  await kickComputerTask(task.id);

  const spoken = spokenQueued({
    taskType: task.taskType,
    route,
    proofItemId,
    proofTitle: proof.title,
  });

  return jsonActor(
    actor,
    {
      ok: true,
      message: '⚡ queued.',
      spoken,
      prototype: true,
      backend: reportedBackend(),
      cloudflareComputer: isCloudflareComputerReady(),
      task: getComputerTask(task.id),
      proofItem: getProofItem(proofItemId),
      actor: 'owner',
    },
    202,
  );
}
