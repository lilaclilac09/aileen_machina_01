import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { prepareBrowseResult, publicPrepareBrowseResult } from '@/lib/browserUse/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pack(task?: string, owner?: unknown) {
  return owner ? prepareBrowseResult(task) : publicPrepareBrowseResult(task);
}

/** Dry status only. Never creates a Cloud run. Visitors do not see key/live. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  return Response.json(pack(undefined, owner));
}

export async function POST(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  let task = '';
  try {
    const body = (await req.json()) as { task?: unknown };
    if (typeof body.task === 'string') task = body.task;
  } catch {
    task = '';
  }
  return Response.json(pack(task, owner));
}
