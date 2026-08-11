/**
 * Safe local test for the leave-a-note / Resend pipeline.
 *
 * Usage (from aileena-new/):
 *   pnpm lead:test                 # dry-run: print payload + env status, no send
 *   pnpm lead:test -- --send       # real Resend send (needs env)
 *   pnpm lead:test -- --curl       # print curl against local /api/lead
 *
 * Required for --send:
 *   RESEND_API_KEY
 *   CONTACT_TO | CONTACT_TO_EMAIL | LEAD_INBOX | NOTIFY_CC_EMAIL
 * Optional:
 *   RESEND_FROM | FROM_EMAIL | CONTACT_FROM
 *   (default From: AILEENA MACHINA <cafe@aileena.xyz>)
 */

import { Resend } from 'resend';
import { getContactInbox, getContactMailStatus } from '../lib/contact-inbox';
import {
  normalizeTranscript,
  renderTranscriptHtml,
  renderTranscriptText,
} from '../lib/mail-transcript';
import { getResendFrom, resendFailureMessage } from '../lib/resend-from';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '(invalid)';
  return `${user.slice(0, 2)}***@${domain}`;
}

const fakeTranscript = [
  {
    role: 'user',
    text: 'Hello Aileena — this is a lead pipeline test.',
    at: new Date().toISOString(),
  },
  {
    role: 'assistant',
    text: 'Got it. If you see this email, Resend delivery is working.',
    at: new Date().toISOString(),
  },
];

async function main() {
  const args = process.argv.slice(2);
  const doSend = args.includes('--send');
  const showCurl = args.includes('--curl');

  const status = getContactMailStatus();
  const inbox = getContactInbox();
  const from = getResendFrom();
  const lines = normalizeTranscript(fakeTranscript);

  console.log('=== lead mail status (no secrets) ===');
  console.log({
    hasResendKey: status.hasResendKey,
    hasInbox: status.hasInbox,
    sandboxFrom: status.sandboxFrom,
    from: status.from,
    to: inbox ? maskEmail(inbox) : null,
    ready: status.hasResendKey && status.hasInbox && !status.sandboxFrom,
    transcriptLength: lines.length,
  });

  const payload = {
    email: 'visitor-test@example.com',
    name: 'Lead pipeline test',
    note: 'Lead pipeline test',
    transcript: fakeTranscript,
    context: 'http://localhost:3000/?lead-test=1',
  };

  console.log('\n=== sample payload keys ===');
  console.log(Object.keys(payload));
  console.log('\n=== plain text body preview ===');
  console.log(renderTranscriptText(lines));

  if (showCurl) {
    console.log('\n=== curl (local) ===');
    console.log(`curl -sS -X POST http://localhost:3000/api/lead \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload)}'`);
    console.log('\n# status probe (no secrets):');
    console.log('curl -sS http://localhost:3000/api/lead');
  }

  if (!doSend) {
    console.log('\nDry-run only. Pass --send to deliver via Resend.');
    if (!(status.hasResendKey && status.hasInbox && !status.sandboxFrom)) {
      console.warn('Mail backend not ready in this env (expected in cloud agents without secrets).');
    }
    process.exit(0);
  }

  if (!status.hasResendKey || !inbox || status.sandboxFrom) {
    console.error('Cannot --send: mail backend not ready (see status above).');
    process.exit(1);
  }

  const capturedAt = new Date().toISOString();
  const subject = `[AILEENA] Agent lead TEST · ${capturedAt}`;
  const text = [
    `Email: ${payload.email}`,
    `Name / WeChat / note: ${payload.note}`,
    '',
    '────────── Transcript ──────────',
    renderTranscriptText(lines),
    '────────── /Transcript ─────────',
    '',
    `Page: ${payload.context}`,
    `Captured at: ${capturedAt}`,
  ].join('\n');

  const html = `
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#1b1713;line-height:1.5">
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Name / WeChat / note:</strong> ${payload.note}</p>
      <hr style="border:none;border-top:1px solid #e7e0d6;margin:16px 0" />
      <h3 style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#007d75">Transcript</h3>
      ${renderTranscriptHtml(lines)}
      <p style="color:#888;font-size:11px">Page: ${payload.context}<br/>Captured: ${capturedAt}</p>
    </div>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from,
    to: inbox,
    replyTo: payload.email,
    subject,
    text,
    html,
  });

  if (error) {
    const { logDetail } = resendFailureMessage(error);
    console.error('Resend failed:', logDetail);
    process.exit(1);
  }
  if (!data?.id) {
    console.error('Resend returned no id', data);
    process.exit(1);
  }
  console.log('Sent ok:', { id: data.id, to: maskEmail(inbox), from });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
