import { NextResponse } from 'next/server';
import { clipProof, sanitizeRoute } from '@/lib/proofQueue';
import { observeRuntime, proofQueueWritesOk } from '@/lib/proofQueueStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public, redacted friction intake.
 * Creates observed issues only. Never approves. Never merges.
 */
export async function POST(req: Request) {
  if (!proofQueueWritesOk()) {
    return NextResponse.json({ error: 'not_stored' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const message = clipProof(typeof rec.message === 'string' ? rec.message : '', 160);
  if (!message) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const result = await observeRuntime({
    type: typeof rec.type === 'string' ? rec.type : 'error',
    route: sanitizeRoute(rec.route),
    message,
    source: rec.source === 'qa' ? 'qa' : 'error',
  });

  return NextResponse.json({
    ok: true,
    observed: Boolean(result.proposal),
    id: result.proposal?.id ?? null,
    skipped: result.skipped,
    merge: false,
  });
}

export async function GET() {
  return NextResponse.json({ error: '⚡ Owner only.' }, { status: 403 });
}
