import { getContactInbox } from '@/lib/contact-inbox';
import { getResendFrom, resendFailureMessage } from '@/lib/resend-from';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createMagicToken } from '../../../../lib/auth';
import { visitorLines } from '../../../../lib/visitor';

/**
 * Step 1 of email login: visitor submits their email, we mail them a
 * one-time magic link (valid 30 min). No password, no database.
 *
 * From-address must be on a Resend-verified domain (see getResendFrom).
 * The wallet login path needs no email.
 */
export const runtime = 'nodejs';

function emailLooksValid(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Server is missing RESEND_API_KEY.' }, { status: 500 });
  }

  let body: { email?: unknown; next?: unknown; client?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !emailLooksValid(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  // Keep the redirect target same-origin only.
  const rawNext = typeof body.next === 'string' ? body.next : '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/blog/nokia-dci';

  const token = await createMagicToken(email);
  const origin = req.nextUrl.origin;
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;

  const inbox = getContactInbox();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getResendFrom();
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: 'Your link to read aileena.xyz',
    text: [
      'Tap to sign in and unlock the writing:',
      '',
      link,
      '',
      'This link expires in 30 minutes and can be used once.',
      "If you didn't request this, ignore it.",
    ].join('\n'),
  });

  if (error) {
    const { publicError, logDetail } = resendFailureMessage(error);
    console.error('[api/auth/request] Resend failed', { from, to: email, detail: logDetail });
    return NextResponse.json(
      { error: publicError === 'Failed to send.' ? 'Could not send the email. Try wallet login.' : publicError },
      { status: 502 },
    );
  }

  // Let the owner see who's coming in — full visitor fingerprint.
  try {
    if (inbox) {
      await resend.emails.send({
        from,
        to: inbox,
        subject: `[AILEENA] Blog login · email · ${email}`,
        text: `Email login requested.\nEmail: ${email}\n${visitorLines(req, { reading: next, client: body.client })}`,
      });
    }
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true });
}
