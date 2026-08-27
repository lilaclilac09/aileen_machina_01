import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { clip, redactSecrets } from '@/lib/computer/redact';
import { nowIso } from '@/lib/computer/store';
import {
  applyOwnerProofAction,
  getProofItem,
  listProofItems,
  newProofId,
  upsertProofItem,
} from '@/lib/proofQueue/store';
import type { ProofStatus } from '@/lib/proofQueue/types';
import { PROOF_STATUSES } from '@/lib/proofQueue/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isProofStatus(value: unknown): value is ProofStatus {
  return typeof value === 'string' && (PROOF_STATUSES as readonly string[]).includes(value);
}

export async function GET(req: Request) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ ok: false, error: 'Owner only.' }, { status: 403 });
  return NextResponse.json({
    ok: true,
    prototype: true,
    items: listProofItems(),
  });
}

export async function POST(req: Request) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ ok: false, error: 'Owner only.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action : 'create';
  if (action === 'approve' || action === 'reject') {
    const id = typeof body.id === 'string' ? body.id : '';
    const result = applyOwnerProofAction(id, action);
    if ('error' in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, item: result, prototype: true });
  }

  const now = nowIso();
  const existingId = typeof body.id === 'string' ? body.id.trim() : '';
  const existing = existingId ? getProofItem(existingId) : null;
  const item = upsertProofItem({
    id: existing?.id ?? newProofId(),
    title: clip(typeof body.title === 'string' ? body.title : existing?.title || 'issue', 160),
    route: clip(typeof body.route === 'string' ? body.route : existing?.route || '/', 80),
    problem: redactSecrets(clip(typeof body.problem === 'string' ? body.problem : existing?.problem || '', 2000)),
    proposedChange: clip(typeof body.proposedChange === 'string' ? body.proposedChange : existing?.proposedChange || '', 2000),
    source: existing?.source ?? 'owner',
    status: isProofStatus(body.status) ? body.status : existing?.status ?? 'observed',
    risk: existing?.risk ?? 'medium',
    acceptanceCriteria: existing?.acceptanceCriteria ?? [],
    screenshots: existing?.screenshots ?? [],
    filesChanged: existing?.filesChanged ?? [],
    checksRun: existing?.checksRun ?? [],
    computerTaskIds: existing?.computerTaskIds ?? [],
    resultSummary: existing?.resultSummary ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
  return NextResponse.json({ ok: true, item, prototype: true });
}
