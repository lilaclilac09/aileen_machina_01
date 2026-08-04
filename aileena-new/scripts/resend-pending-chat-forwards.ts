/**
 * Resend failed agent chat transcript forwards from the Redis pending queue.
 *
 * Usage:
 *   pnpm chat:resend-pending
 *   pnpm chat:resend-pending -- --limit 10
 *   pnpm chat:resend-pending -- --dry-run
 *
 * Requires: UPSTASH_* + RESEND_API_KEY (+ CONTACT_TO / default cafe@ inbox).
 */

import { Resend } from 'resend';
import { getContactInbox } from '../lib/contact-inbox';
import { getResendFrom, resendFailureMessage } from '../lib/resend-from';
import {
  listChatForwards,
  markChatForwardSent,
  saveChatForward,
  type ChatForwardRecord,
} from '../lib/chatForwardStore';
import { visitorSoftMemoryEnabled } from '../lib/visitorMemory';

function renderTranscript(rec: ChatForwardRecord): string {
  return rec.transcript
    .map((m) => `[${m.role === 'user' ? 'VISITOR' : 'AGENT'}]\n${m.text}`)
    .join('\n\n');
}

async function sendOne(rec: ChatForwardRecord, dryRun: boolean): Promise<boolean> {
  const inbox = getContactInbox();
  if (!inbox) {
    console.error('No contact inbox configured');
    return false;
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return false;
  }

  const text = [
    `Session: ${rec.sessionId}`,
    `ForwardId: ${rec.id}`,
    `Original: ${rec.createdAt}`,
    `Resent:   ${new Date().toISOString()}`,
    `Referer:  ${rec.referer ?? '(none)'}`,
    `UA:       ${rec.ua ?? '(unknown)'}`,
    '',
    '────────── Transcript ──────────',
    renderTranscript(rec),
    '────────── /Transcript ─────────',
  ].join('\n');

  if (dryRun) {
    console.log(`[dry-run] would send ${rec.id} → ${inbox}: ${rec.subject}`);
    return true;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getResendFrom();
  const { error } = await resend.emails.send({
    from,
    to: inbox,
    subject: rec.subject.startsWith('[AILEENA Chat')
      ? rec.subject
      : `[AILEENA Chat RESEND] ${rec.subject}`,
    text,
  });

  if (error) {
    const { logDetail } = resendFailureMessage(error);
    console.error(`[fail] ${rec.id}`, logDetail);
    await saveChatForward({
      ...rec,
      status: 'failed',
      error: logDetail,
      createdAt: rec.createdAt,
    });
    return false;
  }

  await markChatForwardSent(rec.id, { status: 'sent', sentAt: new Date().toISOString() });
  console.log(`[sent] ${rec.id} → ${inbox}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 20 : 20;

  if (!visitorSoftMemoryEnabled()) {
    console.error('[chat:resend-pending] UPSTASH Redis not configured — nothing to resend.');
    process.exit(2);
  }

  const pending = await listChatForwards({ status: 'pending', limit });
  console.log(`[chat:resend-pending] ${pending.length} failed forwards (limit ${limit})`);
  if (pending.length === 0) return;

  let ok = 0;
  let fail = 0;
  for (const rec of pending) {
    const sent = await sendOne(rec, dryRun);
    if (sent) ok += 1;
    else fail += 1;
  }
  console.log(`[chat:resend-pending] done ok=${ok} fail=${fail}${dryRun ? ' (dry-run)' : ''}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
