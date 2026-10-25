import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import {
  patchShelfReadingState,
  readShelfReadingState,
  shelfReadingPersistence,
  type ShelfReadingPatch,
} from '@/lib/shelfReadingStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 64_000;

export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const reading = await readShelfReadingState();
  return NextResponse.json({ reading, persistence: shelfReadingPersistence() });
}

export async function PUT(req: Request) {
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
  if (!parsed || typeof parsed !== 'object') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const reading = await patchShelfReadingState(parsed as ShelfReadingPatch);
  return NextResponse.json({ reading, persistence: shelfReadingPersistence() });
}
