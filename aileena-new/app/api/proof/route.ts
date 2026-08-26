import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { isProofRisk } from '@/lib/proofQueue';
import {
  attachProof,
  createObserved,
  createProposal,
  editProposalScope,
  ensureProofQueueSeeds,
  executeProofCommand,
  listProofQueue,
  markReady,
  preparePr,
  proofQueueWritesOk,
  requestScreenshots,
  runProofCommand,
  scanOwnerSignals,
  transitionProposal,
} from '@/lib/proofQueueStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function writesBlocked() {
  return NextResponse.json({ error: 'not_stored', persistence: 'memory' }, { status: 503 });
}

/** Owner-only queue. Visitors get 403 — use POST /api/proof/observe for public friction. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: '⚡ Owner only.' }, { status: 403 });
  }
  if (proofQueueWritesOk()) {
    await ensureProofQueueSeeds();
  }
  const queue = await listProofQueue();
  return NextResponse.json({
    owner: true,
    merge: false,
    autoMerge: false,
    ...queue,
  });
}

export async function POST(req: Request) {
  const owner = Boolean(await requireOwnerFromRequest(req));
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  if (typeof rec.text === 'string') {
    if (!proofQueueWritesOk()) return writesBlocked();
    const result = await runProofCommand(rec.text, owner);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, merge: false }, { status: result.status });
    }
    return NextResponse.json({ ok: true, merge: false, reply: result.reply, proposal: result.proposal });
  }

  const action = typeof rec.action === 'string' ? rec.action : '';
  const id = typeof rec.id === 'string' ? rec.id : '';

  if (action === 'list') {
    if (!owner) return NextResponse.json({ error: '⚡ Owner only.' }, { status: 403 });
    const result = await executeProofCommand({ kind: 'list' }, true);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, reply: result.reply, merge: false });
  }

  if (!proofQueueWritesOk()) return writesBlocked();

  if (action === 'log') {
    const proposal = await createObserved({
      title: typeof rec.title === 'string' ? rec.title : undefined,
      message: typeof rec.problem === 'string' ? rec.problem : typeof rec.message === 'string' ? rec.message : '',
      route: typeof rec.route === 'string' ? rec.route : '/',
      source: owner ? 'owner' : 'visitor',
    });
    return NextResponse.json({ ok: true, proposal, merge: false });
  }

  if (action === 'propose') {
    const proposal = await createProposal({
      title: typeof rec.title === 'string' ? rec.title : undefined,
      message: typeof rec.problem === 'string' ? rec.problem : typeof rec.message === 'string' ? rec.message : '',
      route: typeof rec.route === 'string' ? rec.route : '/',
      source: owner ? 'owner' : 'visitor',
      owner,
      proposedChange: typeof rec.proposedChange === 'string' ? rec.proposedChange : undefined,
      acceptanceCriteria: typeof rec.acceptanceCriteria === 'string' ? rec.acceptanceCriteria : undefined,
      risk: isProofRisk(rec.risk) ? rec.risk : undefined,
    });
    return NextResponse.json({ ok: true, proposal, merge: false });
  }

  if (action === 'scan') {
    if (!owner) return NextResponse.json({ error: '⚡ Owner only.' }, { status: 403 });
    const created = await scanOwnerSignals(true);
    return NextResponse.json({ ok: true, created, merge: false });
  }

  if (action === 'seed') {
    if (!owner) return NextResponse.json({ error: '⚡ Owner only.' }, { status: 403 });
    const proposals = await ensureProofQueueSeeds();
    return NextResponse.json({ ok: true, proposals, merge: false });
  }

  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  if (action === 'approve') {
    const moved = await transitionProposal(id, 'approved', owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error, merge: false }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'reject') {
    const moved = await transitionProposal(id, 'rejected', owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error, merge: false }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'promote') {
    const moved = await transitionProposal(id, 'proposed', owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error, merge: false }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'start') {
    const moved = await transitionProposal(id, 'in_progress', owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error, merge: false }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'ship') {
    const moved = await transitionProposal(id, 'shipped', owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error, merge: false }, { status: moved.status });
    return NextResponse.json({
      ok: true,
      proposal: moved.proposal,
      merge: false,
      note: 'Marked shipped after owner merge. This button does not merge.',
    });
  }
  if (action === 'ready') {
    const moved = await markReady(id, owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error, merge: false }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'request_screenshots') {
    const moved = await requestScreenshots(id, owner);
    if (!moved.ok) return NextResponse.json({ error: moved.error }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'edit') {
    const moved = await editProposalScope(id, owner, {
      proposedChange: typeof rec.proposedChange === 'string' ? rec.proposedChange : undefined,
      acceptanceCriteria: typeof rec.acceptanceCriteria === 'string' ? rec.acceptanceCriteria : undefined,
      risk: isProofRisk(rec.risk) ? rec.risk : undefined,
      route: typeof rec.route === 'string' ? rec.route : undefined,
      title: typeof rec.title === 'string' ? rec.title : undefined,
      problem: typeof rec.problem === 'string' ? rec.problem : undefined,
    });
    if (!moved.ok) return NextResponse.json({ error: moved.error }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'attach_proof') {
    const moved = await attachProof(id, owner, {
      screenshots: Array.isArray(rec.screenshots) ? rec.screenshots : undefined,
      implementationSummary: typeof rec.implementationSummary === 'string' ? rec.implementationSummary : undefined,
      filesChanged: rec.filesChanged,
      checksRun: rec.checksRun,
      knownIssues: typeof rec.knownIssues === 'string' ? rec.knownIssues : undefined,
    });
    if (!moved.ok) return NextResponse.json({ error: moved.error }, { status: moved.status });
    return NextResponse.json({ ok: true, proposal: moved.proposal, merge: false });
  }
  if (action === 'prepare_pr') {
    const prepared = await preparePr(id, owner);
    if (!prepared.ok) return NextResponse.json({ error: prepared.error, merge: false }, { status: prepared.status });
    return NextResponse.json({
      ok: true,
      proposal: prepared.proposal,
      prompt: prepared.prompt,
      merge: false,
      autoMerge: false,
    });
  }

  return NextResponse.json({ error: 'unknown action', merge: false }, { status: 400 });
}
