import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { listAvailableEpubSlugs } from '@/lib/shelfEpub';
import { readShelfReadingState, shelfReadingPersistence } from '@/lib/shelfReadingStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Owner catalog: which book slugs have private EPUBs + reading state. 403 visitors. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const [available, reading] = await Promise.all([
    listAvailableEpubSlugs(),
    readShelfReadingState(),
  ]);

  return NextResponse.json({
    available,
    reading,
    persistence: shelfReadingPersistence(),
  });
}
