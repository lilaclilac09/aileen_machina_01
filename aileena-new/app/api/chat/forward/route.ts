import { getContactInbox } from '@/lib/contact-inbox';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auto-forward endpoint for the agent console.
 *
 * Every chat session — anonymous or otherwise — gets emailed to Aileen as a
 * transcript snapshot. The client fires this from AgentChat.tsx via
 * navigator.sendBeacon on three triggers:
 *   1. Debounced ~4 s after the assistant finishes a response.
 *   2. On `pagehide` (visitor closes the tab or navigates away).
 *   3. Immediately when the per-session chat limit is reached.
 *
 * Dedup strategy: the subject line includes a short prefix of the sessionId,
 * so Gmail threads multiple snapshots for the same conversation into a single
 * thread. We don't store any server-side state.
 *
 * Distinct from /api/lead, which is the synchronous lead-form submission
 * fired when the visitor hits the 2-message hard gate. Auto-forward fires
 * for every session — including short ones that never reach the gate —
 * so Aileen sees every conversation, gated or not.
 */

function renderTranscript(transcript: unknown): string {
  if (!Array.isArray(transcript)) return '(no transcript)';
  const lines: string[] = [];
  for (const m of transcript) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: string }).role === 'user' ? 'VISITOR' : 'AGENT';
    const text = (m as { text?: string }).text;
    if (typeof text !== 'string' || !text.trim()) continue;
    lines.push(`[${role}]\n${text.trim()}`);
  }
  return lines.length > 0 ? lines.join('\n\n') : '(empty conversation)';
}

function firstUserSnippet(transcript: unknown): string {
  if (!Array.isArray(transcript)) return '';
  for (const m of transcript) {
    if (!m || typeof m !== 'object') continue;
    if ((m as { role?: string }).role !== 'user') continue;
    const text = (m as { text?: string }).text;
    if (typeof text === 'string' && text.trim()) {
      return text.trim().slice(0, 80);
    }
  }
  return '';
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Server is missing RESEND_API_KEY.' },
      { status: 500 },
    );
  }

  let body: { sessionId?: unknown; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const transcript = body.transcript;
  if (!Array.isArray(transcript) || transcript.length === 0) {
    // Visitor opened the console but never sent a message — nothing to forward.
    return NextResponse.json({ ok: true, skipped: 'empty' });
  }

  const transcriptText = renderTranscript(transcript);
  if (transcriptText === '(empty conversation)') {
    return NextResponse.json({ ok: true, skipped: 'empty' });
  }

  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.length > 0
      ? body.sessionId.slice(0, 100)
      : 'unknown';

  const snippet = firstUserSnippet(transcript) || '(no user message)';
  const referer = req.headers.get('referer') ?? '(none)';
  const ua = req.headers.get('user-agent') ?? '(unknown)';

  // sessionId prefix in the subject so Gmail threads same-session snapshots together.
  const subject = `[AILEENA Chat ${sessionId.slice(0, 8)}] ${snippet}`;
  const text = [
    `Session: ${sessionId}`,
    `Captured: ${new Date().toISOString()}`,
    `Referer:  ${referer}`,
    `UA:       ${ua}`,
    '',
    '────────── Transcript ──────────',
    transcriptText,
    '────────── /Transcript ─────────',
  ].join('\n');

  const inbox = getContactInbox();
  if (!inbox) {
    return NextResponse.json({ error: 'Contact inbox not configured.' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'AILEENA MACHINA <onboarding@resend.dev>',
    to: inbox,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to send.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
