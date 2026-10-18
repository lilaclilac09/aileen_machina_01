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
import { getResendFrom, resendFailureMessage, resendIdempotentDuplicate } from '../lib/resend-from';
import {
  listChatForwards,
  forwardSendActionId,
  markChatForwardSent,
  saveChatForward,
  type ChatForwardRecord,
} from '../lib/chatForwardStore';
import { visitorSoftMemoryEnabled } from '../lib/visitorMemory';
import { runOnce } from '../lib/agentRuntime/actions';

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

  // Action ledger: same action id as /api/chat/forward, so a forward that was
  // delivered (by the route or an earlier run of this job) is never sent again.
  // The Idempotency-Key differs from the route's because the body differs
  // (Resend rejects one key with two payloads); it is stable across job runs.
  const sendActionId = await forwardSendActionId(rec.id);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getResendFrom();
  const sent = await runOnce(
    sendActionId,
    async () => {
      const { error } = await resend.emails.send(
        {
          from,
          to: inbox,
          subject: rec.subject.startsWith('[AILEENA Chat') ? rec.subject : `[AILEENA Chat RESEND] ${rec.subject}`,
          text,
        },
        { idempotencyKey: `${sendActionId}.resend` },
      );
      if (resendIdempotentDuplicate(error)) return { ok: true as const };
      return error ? { ok: false as const, detail: resendFailureMessage(error).logDetail } : { ok: true as const };
    },
    { isFailure: (r) => (r.ok ? null : r.detail) },
  );

  if (sent.state === 'running') {
    console.log(`[busy] ${rec.id} is being sent by another delivery`);
    return true;
  }
  if (sent.state === 'failed') {
    console.error(`[fail] ${rec.id}`, sent.error);
    await saveChatForward({
      ...rec,
      status: 'failed',
      error: sent.error,
      createdAt: rec.createdAt,
    });
    return false;
  }
  if (sent.state === 'replay') console.log(`[skip] ${rec.id} already delivered (${sendActionId})`);

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
