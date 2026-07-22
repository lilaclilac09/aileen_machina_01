import { getContactInbox } from '@/lib/contact-inbox';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Lead capture endpoint for the agent console.
 *
 * Hard-gated: chat is free for the first 2 messages, then the lead panel
 * appears and the chat input is locked until the visitor submits an email
 * here. Submissions land in this route and are forwarded as a single email
 * to Aileen's inbox via Resend (the same path the old contact form used).
 * No database.
 */

const COOKIE_NAME = '__aileena_lead';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function emailLooksValid(s: string): boolean {
  // Lightweight check — Resend will do the real validation server-side.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
}

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

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Server is missing RESEND_API_KEY. Set it in Vercel project settings.' },
      { status: 500 },
    );
  }

  let body: { email?: unknown; name?: unknown; note?: unknown; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '';

  if (!email || !emailLooksValid(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const transcript = renderTranscript(body.transcript);
  const referer = req.headers.get('referer') ?? '(none)';
  const ua = req.headers.get('user-agent') ?? '(unknown)';

  const subject = `[AILEENA] Agent lead · ${name || email}`;
  const text = [
    `Email: ${email}`,
    `Name / context: ${name || '(not provided)'}`,
    note ? `Note from visitor:\n${note}` : null,
    '',
    '────────── Transcript ──────────',
    transcript,
    '────────── /Transcript ─────────',
    '',
    `Referer: ${referer}`,
    `User agent: ${ua}`,
    `Captured at: ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n');

  const inbox = getContactInbox();
  if (!inbox) {
    return NextResponse.json({ error: 'Contact inbox not configured.' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'AILEENA MACHINA <onboarding@resend.dev>',
    to: inbox,
    replyTo: email,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to send.' }, { status: 502 });
  }

  // Set a cookie so the console doesn't re-prompt this browser for 30 days.
  const res = NextResponse.json({ ok: true });
  res.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
  );
  return res;
}
