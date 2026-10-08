import { prepareBrowseResult } from '@/lib/browserUse/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Dry status only. Never creates a Cloud run. */
export async function GET() {
  return Response.json(prepareBrowseResult());
}

export async function POST(req: Request) {
  let task = '';
  try {
    const body = (await req.json()) as { task?: unknown };
    if (typeof body.task === 'string') task = body.task;
  } catch {
    task = '';
  }
  return Response.json(prepareBrowseResult(task));
}
