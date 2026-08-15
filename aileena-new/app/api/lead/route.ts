import { getContactInbox, getContactMailStatus } from '@/lib/contact-inbox';
import {
  CONTACT_OFFLINE_PUBLIC,
  escapeHtml,
  normalizeTranscript,
  renderTranscriptHtml,
  renderTranscriptText,
} from '@/lib/mail-transcript';
import {
  buildOwnerChatSetCookie,
  createOwnerChatToken,
  isOwnerEmail,
} from '@/lib/owner-access';
import { getResendFrom, resendFailureMessage } from '@/lib/resend-from';
import { isCouncilPipelineRequest } from '@/lib/agentMode';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Lead capture endpoint for the agent console.
 *
 * Soft invite after a few turns: visitor can leave email + note; we forward
 * one email (with transcript) to Aileen's inbox via Resend. No database.
 */

const COOKIE_NAME = '__aileena_lead';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function emailLooksValid(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '(invalid)';
  return `${user.slice(0, 2)}***@${domain}`;
}

/** Ops status — no secrets. Frontend uses this for gentle disabled state. */
export async function GET() {
  const status = getContactMailStatus();
  const ready = status.hasResendKey && status.hasInbox && !status.sandboxFrom;
  if (!ready) {
    console.warn('[api/lead] GET status: mail not ready', {
      hasResendKey: status.hasResendKey,
      hasInbox: status.hasInbox,
      sandboxFrom: status.sandboxFrom,
      from: status.from,
      missing: status.missing,
    });
  }
  return NextResponse.json({
    ok: ready,
    hasResendKey: status.hasResendKey,
    hasInbox: status.hasInbox,
    sandboxFrom: status.sandboxFrom,
    from: status.from,
    // Public-safe env *names* only — never values.
    missing: status.missing,
  });
}

export async function POST(req: NextRequest) {
  console.info('[api/lead] contact route called');

  let body: {
    email?: unknown;
    name?: unknown;
    note?: unknown;
    transcript?: unknown;
    context?: unknown;
    agentMode?: unknown;
    councilLens?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  if (
    isCouncilPipelineRequest({
      agentMode: body.agentMode,
      councilLens: body.councilLens,
      transcript: body.transcript,
      context: typeof body.context === 'string' ? body.context : req.headers.get('referer'),
      note: body.note,
      name: body.name,
    })
  ) {
    return NextResponse.json(
      { ok: false, error: 'Council transcripts stay private.' },
      { status: 403 },
    );
  }

  const status = getContactMailStatus();
  if (!status.hasResendKey || !status.hasInbox || status.sandboxFrom) {
    console.error('[api/lead] mail backend not configured', {
      hasResendKey: status.hasResendKey,
      hasInbox: status.hasInbox,
      sandboxFrom: status.sandboxFrom,
      from: status.from,
      missing: status.missing,
    });
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC, missing: status.missing },
      { status: 503 },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  // UI uses one memo field ("name / WeChat / note") — accept as name and/or note.
  const nameRaw = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  const noteRaw = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  const memo = (noteRaw || nameRaw).slice(0, 1000);
  const context =
    typeof body.context === 'string' ? body.context.trim().slice(0, 500) : '';
  const lines = normalizeTranscript(body.transcript);

  console.info('[api/lead] payload keys', {
    keys: Object.keys(body),
    hasEmail: Boolean(email),
    hasMemo: Boolean(memo),
    hasContext: Boolean(context),
    transcriptIsArray: Array.isArray(body.transcript),
    transcriptLength: lines.length,
  });

  // Current design: email required for reply path.
  if (!email || !emailLooksValid(email)) {
    return NextResponse.json(
      { ok: false, error: 'A valid email is required.' },
      { status: 400 },
    );
  }

  // Reject fully empty payloads (email alone is enough; note optional when
  // transcript exists — and also optional when visitor only wants a callback).
  if (!memo && lines.length === 0 && !email) {
    return NextResponse.json(
      { ok: false, error: 'Nothing to send.' },
      { status: 400 },
    );
  }

  const transcriptText = renderTranscriptText(lines);
  const transcriptHtml = renderTranscriptHtml(lines);
  const referer = context || req.headers.get('referer') || '(none)';
  const ua = req.headers.get('user-agent') ?? '(unknown)';
  const capturedAt = new Date().toISOString();

  const inbox = getContactInbox();
  if (!inbox) {
    console.error('[api/lead] contact inbox not configured');
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC },
      { status: 503 },
    );
  }

  const from = getResendFrom();
  const subject = `[AILEENA] Agent lead · ${memo || email}`;
  const text = [
    `Email: ${email}`,
    `Name / WeChat / note: ${memo || '(not provided)'}`,
    '',
    '────────── Transcript ──────────',
    transcriptText,
    '────────── /Transcript ─────────',
    '',
    `Page: ${referer}`,
    `User agent: ${ua}`,
    `Captured at: ${capturedAt}`,
  ].join('\n');

  const html = `
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#1b1713;line-height:1.5">
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Name / WeChat / note:</strong> ${escapeHtml(memo || '(not provided)')}</p>
      <hr style="border:none;border-top:1px solid #e7e0d6;margin:16px 0" />
      <h3 style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#007d75">Transcript</h3>
      ${transcriptHtml}
      <hr style="border:none;border-top:1px solid #e7e0d6;margin:16px 0" />
      <p style="color:#888;font-size:11px">Page: ${escapeHtml(referer)}<br/>Captured: ${escapeHtml(capturedAt)}</p>
    </div>
  `;

  console.info('[api/lead] sending', {
    to: maskEmail(inbox),
    from,
    transcriptLines: lines.length,
    subject,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from,
    to: inbox,
    replyTo: email,
    subject,
    text,
    html,
  });

  if (error) {
    const { publicError, logDetail } = resendFailureMessage(error);
    console.error('[api/lead] Resend failed', {
      from,
      to: maskEmail(inbox),
      detail: logDetail,
    });
    const soft =
      /inbox|configured|api key|verify a domain|resend\.dev|sender not ready|offline/i.test(
        publicError,
      ) || /verify a domain|onboarding@resend\.dev|testing emails/i.test(logDetail);
    return NextResponse.json(
      { ok: false, error: soft ? CONTACT_OFFLINE_PUBLIC : publicError },
      { status: 502 },
    );
  }

  if (!data?.id) {
    console.error('[api/lead] Resend returned no id', { data });
    return NextResponse.json(
      { ok: false, error: CONTACT_OFFLINE_PUBLIC },
      { status: 502 },
    );
  }

  console.info('[api/lead] Resend ok', { id: data.id, to: maskEmail(inbox) });

  const unlimited = isOwnerEmail(email);
  const res = NextResponse.json({ ok: true, id: data.id, unlimited });
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
  );
  if (unlimited) {
    const token = await createOwnerChatToken(email);
    res.headers.append('Set-Cookie', buildOwnerChatSetCookie(token));
  }
  return res;
}
