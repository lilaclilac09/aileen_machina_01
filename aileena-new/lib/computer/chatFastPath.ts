import { isComputerPrototypeEnabled } from './flag';
import { parseOwnerComputerCommand } from './parseOwnerCommand';
import { queuedChatResponse } from './queuedStream';

/**
 * Fast owner path for /api/chat (Edge).
 * Enqueues a Node computer task via HTTP and returns immediately.
 * Visitors never enter this path (caller must pass isOwner).
 */
export async function tryOwnerComputerFastPath(opts: {
  req: Request;
  isOwner: boolean;
  lastQ: string;
}): Promise<Response | null> {
  if (!opts.isOwner) return null;
  if (!isComputerPrototypeEnabled()) return null;
  const command = parseOwnerComputerCommand(opts.lastQ);
  if (!command) return null;

  const cookie = opts.req.headers.get('cookie') || '';
  const origin = new URL(opts.req.url).origin;

  if (command.kind === 'show_queue') {
    return queuedChatResponse('⚡ Proof queue: /proof — prototype only, owner review, no merge.');
  }

  if (command.kind === 'log_issue') {
    const res = await fetch(`${origin}/api/agent/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ action: 'create', title: command.title, status: 'observed', route: '/' }),
    });
    if (!res.ok) return queuedChatResponse('⚡ Nope. Proof log failed.');
    const body = (await res.json()) as { item?: { id?: string } };
    return queuedChatResponse(`⚡ Logged. ${body.item?.id ?? ''} — /proof`);
  }

  if (command.kind === 'propose_fix') {
    await fetch(`${origin}/api/agent/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({
        action: 'create',
        title: `fix ${command.route}`,
        route: command.route,
        problem: command.instructions,
        status: 'proposed',
      }),
    });
    return queuedChatResponse('⚡ Proposed. Open /proof — not started on the computer yet.');
  }

  if (command.kind === 'approve' || command.kind === 'reject') {
    const res = await fetch(`${origin}/api/agent/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ action: command.kind, id: command.id }),
    });
    if (!res.ok) return queuedChatResponse('⚡ Nope.');
    return queuedChatResponse(command.kind === 'approve' ? '⚡ Saved.' : '⚡ Nope. Rejected.');
  }

  if (command.kind === 'prepare_pr') {
    const res = await fetch(`${origin}/api/agent/computer/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({
        proofItemId: command.id,
        taskType: 'generate_implementation_prompt',
        route: '/proof',
        instructions: `prepare PR summary for ${command.id}. do not merge.`,
      }),
    });
    if (res.status === 403 || res.status === 401) return queuedChatResponse('⚡ Owner only.');
    if (!res.ok) return queuedChatResponse('⚡ Nope. Computer did not accept the task.');
    return queuedChatResponse('⚡ queued.');
  }

  const res = await fetch(`${origin}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      taskType: command.taskType,
      route: command.route,
      instructions: command.instructions,
      scope: 'owner-computer-prototype',
    }),
  });
  if (res.status === 403 || res.status === 401) return queuedChatResponse('⚡ Owner only.');
  if (res.status === 429) return queuedChatResponse('⚡ Slow down. Rate limit.');
  if (!res.ok) return queuedChatResponse('⚡ Nope. Computer did not accept the task.');
  return queuedChatResponse('⚡ queued.');
}
