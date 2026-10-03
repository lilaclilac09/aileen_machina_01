import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { unwrapReport } from '@/lib/reviews/report';
import { listReviews, saveReview } from '@/lib/reviews/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 1_500_000;

export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const reviews = await listReviews();
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const report = unwrapReport(parsed);
  if (!report) {
    return NextResponse.json({ error: 'not_review' }, { status: 400 });
  }
  const saved = await saveReview(report);
  return NextResponse.json({ review: saved });
}
