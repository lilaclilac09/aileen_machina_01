import { getContactInbox } from '@/lib/contact-inbox';
import { getResendFrom, resendFailureMessage } from '@/lib/resend-from';
import {
  makeForwardId,
  saveChatForward,
  type ChatForwardMessage,
} from '@/lib/chatForwardStore';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auto-forward endpoint for the agent console.
 *
 * Every chat session — anonymous or otherwise — gets emailed to Aileen as a
 * transcript snapshot. The client fires this from AgentChat.tsx via
 * navigator.sendBeacon / fetch keepalive on three triggers:
 *   1. Debounced ~4 s after the assistant finishes a response.
 *   2. On `pagehide` (visitor closes the tab or navigates away).
 *   3. Immediately when the per-session chat limit is reached.
 *
 * Dedup strategy: the subject line includes a short prefix of the sessionId,
 * so Gmail threads multiple snapshots for the same conversation into a single
 * thread.
 *
 * Durability: every attempt is also written to Redis (`chatForwardStore`) when
 * Upstash is configured — failed sends (including missing RESEND_API_KEY) stay
 * in `chat:forward:pending` so `pnpm chat:pending` / `pnpm chat:resend-pending`
 * (and the 6h GH Action) can recover them.
 *
 * Distinct from /api/lead, which is the synchronous lead-form submission
 * fired when the visitor hits the 2-message hard gate. Auto-forward fires
 * for every session — including short ones that never reach the gate —
 * so Aileen sees every conversation, gated or not.
 */

function normalizeTranscript(transcript: unknown): ChatForwardMessage[] {
  if (!Array.isArray(transcript)) return [];
  const out: ChatForwardMessage[] = [];
  for (const m of transcript) {
    if (!m || typeof m !== 'object') continue;
    const roleRaw = (m as { role?: string }).role;
    const role = roleRaw === 'user' ? 'user' : roleRaw === 'assistant' ? 'assistant' : null;
    const text = (m as { text?: string }).text;
    if (!role || typeof text !== 'string' || !text.trim()) continue;
    out.push({ role, text: text.trim() });
  }
  return out;
}

function renderTranscript(messages: ChatForwardMessage[]): string {
  if (messages.length === 0) return '(empty conversation)';
  return messages
    .map((m) => `[${m.role === 'user' ? 'VISITOR' : 'AGENT'}]\n${m.text}`)
    .join('\n\n');
}

function firstUserSnippet(messages: ChatForwardMessage[]): string {
  for (const m of messages) {
    if (m.role === 'user' && m.text) return m.text.slice(0, 80);
  }
  return '';
}

export async function POST(req: NextRequest) {
  let body: { sessionId?: unknown; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const messages = normalizeTranscript(body.transcript);
  if (messages.length === 0) {
    // Visitor opened the console but never sent a message — nothing to forward.
    return NextResponse.json({ ok: true, skipped: 'empty' });
  }

  const transcriptText = renderTranscript(messages);
  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.length > 0
      ? body.sessionId.slice(0, 100)
      : 'unknown';

  const snippet = firstUserSnippet(messages) || '(no user message)';
  const referer = req.headers.get('referer') ?? '(none)';
  const ua = req.headers.get('user-agent') ?? '(unknown)';
  const createdAt = new Date().toISOString();
  const id = makeForwardId(sessionId, messages);

  // sessionId prefix in the subject so Gmail threads same-session snapshots together.
  const subject = `[AILEENA Chat ${sessionId.slice(0, 8)}] ${snippet}`;
  const text = [
    `Session: ${sessionId}`,
    `ForwardId: ${id}`,
    `Captured: ${createdAt}`,
    `Referer:  ${referer}`,
    `UA:       ${ua}`,
    '',
    '────────── Transcript ──────────',
    transcriptText,
    '────────── /Transcript ─────────',
  ].join('\n');

  const baseRecord = {
    id,
    sessionId,
    subject,
    transcript: messages,
    referer,
    ua,
    createdAt,
  };

  const inbox = getContactInbox();
  if (!inbox) {
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: 'Contact inbox not configured.',
    });
    return NextResponse.json({ error: 'Contact inbox not configured.', id }, { status: 503 });
  }

  if (!process.env.RESEND_API_KEY) {
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: 'Server is missing RESEND_API_KEY.',
    });
    return NextResponse.json(
      { error: 'Server is missing RESEND_API_KEY.', id },
      { status: 500 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getResendFrom();
  const { error } = await resend.emails.send({
    from,
    to: inbox,
    subject,
    text,
  });

  if (error) {
    const { publicError, logDetail } = resendFailureMessage(error);
    console.error('[api/chat/forward] Resend failed', { from, to: inbox, detail: logDetail });
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: logDetail,
    });
    return NextResponse.json({ error: publicError, id }, { status: 502 });
  }

  await saveChatForward({
    ...baseRecord,
    status: 'sent',
    sentAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id });
}
