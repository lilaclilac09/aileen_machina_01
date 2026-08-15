import { getContactInbox, getContactMailStatus } from '@/lib/contact-inbox';
import {
  CONTACT_OFFLINE_PUBLIC,
  escapeHtml,
  normalizeTranscript,
  renderTranscriptHtml,
  renderTranscriptText,
} from '@/lib/mail-transcript';
import { getResendFrom, resendFailureMessage } from '@/lib/resend-from';
import { isCouncilPipelineRequest } from '@/lib/agentMode';
import { checkRateLimit, LLM_RATE } from '@/lib/api/ratelimit';
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
 * Every chat session gets emailed to Aileen as a transcript snapshot.
 * Client fires via sendBeacon / fetch keepalive (debounce / pagehide / session max).
 * Durability: Redis chatForwardStore when Upstash is configured.
 */

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '(invalid)';
  return `${user.slice(0, 2)}***@${domain}`;
}

function firstUserSnippet(messages: ChatForwardMessage[]): string {
  for (const m of messages) {
    if (m.role === 'user' && m.text) return m.text.slice(0, 80);
  }
  return '';
}

function toStoreMessages(
  lines: ReturnType<typeof normalizeTranscript>,
): ChatForwardMessage[] {
  return lines
    .filter((m): m is { role: 'user' | 'assistant'; text: string; at?: string } =>
      m.role === 'user' || m.role === 'assistant',
    )
    .map((m) => ({ role: m.role, text: m.text }));
}

/** Ops status — no secrets. */
export async function GET() {
  const status = getContactMailStatus();
  return NextResponse.json({
    ok: status.hasResendKey && status.hasInbox && !status.sandboxFrom,
    hasResendKey: status.hasResendKey,
    hasInbox: status.hasInbox,
    sandboxFrom: status.sandboxFrom,
    from: status.from,
    missing: status.missing,
  });
}

export async function POST(req: NextRequest) {
  console.info('[api/chat/forward] contact route called');

  const rl = checkRateLimit(req, LLM_RATE, 'chat-forward');
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          rl.reason === 'burst'
            ? `Too many requests. Try again in ${rl.retryAfterSec}s.`
            : `Daily rate limit reached. Resets in ${Math.round(rl.retryAfterSec / 3600)}h.`,
        code: rl.reason === 'burst' ? 'rate_limit_burst' : 'rate_limit_daily',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
    );
  }

  let body: { sessionId?: unknown; transcript?: unknown; agentMode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (isCouncilPipelineRequest({ agentMode: body.agentMode })) {
    return NextResponse.json({ error: 'Council transcripts stay private.' }, { status: 403 });
  }

  console.info('[api/chat/forward] payload keys', {
    keys: Object.keys(body ?? {}),
    transcriptIsArray: Array.isArray(body.transcript),
  });

  const lines = normalizeTranscript(body.transcript);
  console.info('[api/chat/forward] transcript length', lines.length);

  if (lines.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'empty' });
  }

  const messages = toStoreMessages(lines);
  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.length > 0
      ? body.sessionId.slice(0, 100)
      : 'unknown';

  const snippet = firstUserSnippet(messages) || '(no user message)';
  const referer = req.headers.get('referer') ?? '(none)';
  const ua = req.headers.get('user-agent') ?? '(unknown)';
  const createdAt = new Date().toISOString();
  const id = makeForwardId(sessionId, messages);

  const subject = `[AILEENA Chat ${sessionId.slice(0, 8)}] ${snippet}`;
  const transcriptText = renderTranscriptText(lines);
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

  const html = `
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#1b1713;line-height:1.5">
      <p><strong>Session:</strong> ${escapeHtml(sessionId)}</p>
      <p><strong>ForwardId:</strong> ${escapeHtml(id)}</p>
      <p><strong>Captured:</strong> ${escapeHtml(createdAt)}</p>
      <p><strong>Page:</strong> ${escapeHtml(referer)}</p>
      <hr style="border:none;border-top:1px solid #e7e0d6;margin:16px 0" />
      <h3 style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#007d75">Transcript</h3>
      ${renderTranscriptHtml(lines)}
    </div>
  `;

  const baseRecord = {
    id,
    sessionId,
    subject,
    transcript: messages,
    referer,
    ua,
    createdAt,
  };

  const status = getContactMailStatus();
  const inbox = getContactInbox();
  const from = getResendFrom();

  console.info('[api/chat/forward] target', {
    to: inbox ? maskEmail(inbox) : null,
    from,
    hasResendKey: status.hasResendKey,
    hasInbox: status.hasInbox,
  });

  if (!inbox) {
    console.error('[api/chat/forward] contact inbox not configured');
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: 'Contact inbox not configured.',
    });
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC, id },
      { status: 503 },
    );
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error('[api/chat/forward] RESEND_API_KEY missing');
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: 'Server is missing RESEND_API_KEY.',
    });
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC, id },
      { status: 503 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from,
    to: inbox,
    subject,
    text,
    html,
  });

  if (error) {
    const { logDetail } = resendFailureMessage(error);
    console.error('[api/chat/forward] Resend failed', {
      from,
      to: maskEmail(inbox),
      detail: logDetail,
    });
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: logDetail,
    });
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC, id },
      { status: 502 },
    );
  }

  if (!data?.id) {
    console.error('[api/chat/forward] Resend returned no id', { data });
    await saveChatForward({
      ...baseRecord,
      status: 'failed',
      error: 'Resend returned no id.',
    });
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC, id },
      { status: 502 },
    );
  }

  console.info('[api/chat/forward] Resend ok', {
    id: data.id,
    to: maskEmail(inbox),
  });

  await saveChatForward({
    ...baseRecord,
    status: 'sent',
    sentAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id: data.id });
}
