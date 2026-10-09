import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { skipVisitorQuota } from '@/lib/agentMode';
import { hasOwnerUnlimitedChat } from '@/lib/owner-access';
import { prepareBrowseResult, publicPrepareBrowseResult } from '@/lib/browserUse/status';
import { QUOTA_EXHAUSTED_MSG, takeVisitorChatTurn } from '@/lib/chatQuota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pack(task?: string, owner?: unknown) {
  return owner ? prepareBrowseResult(task) : publicPrepareBrowseResult(task);
}

function jsonWithHeaders(body: unknown, status: number, extra?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extra,
    },
  });
}

/** Dry status only. Never creates a Cloud run. Visitors do not see key/live. Free — no quota burn. */
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

  const trimmed = task.trim();
  if (!trimmed) {
    return Response.json(pack(task, owner));
  }

  const unlimited = skipVisitorQuota(Boolean(owner)) || (await hasOwnerUnlimitedChat(req));
  const turn = await takeVisitorChatTurn(req, unlimited);
  if (!turn.ok) {
    return jsonWithHeaders(
      { error: QUOTA_EXHAUSTED_MSG, dryRun: true, billed: false },
      429,
      {
        ...(turn.cookie ? { 'Set-Cookie': turn.cookie } : {}),
        'X-Daily-Remaining': '0',
        'X-Quota-Day': turn.quota.date,
      },
    );
  }

  return jsonWithHeaders(pack(trimmed, owner), 200, {
    ...(turn.cookie ? { 'Set-Cookie': turn.cookie } : {}),
    'X-Daily-Remaining': turn.remaining,
    'X-Quota-Day': turn.quota.date,
  });
}
