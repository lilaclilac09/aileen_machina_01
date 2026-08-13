import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';

/** Client-readable owner flag. Cookie is httpOnly; public Console uses this to skip the visitor 20/day cap for Aileen. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  return NextResponse.json({ owner: Boolean(owner) });
}
