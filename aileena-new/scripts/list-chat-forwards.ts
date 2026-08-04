/**
 * List agent chat transcript forwards (Redis durable log).
 *
 * Usage:
 *   pnpm chat:pending              # failed / unsent only
 *   pnpm chat:pending -- --all     # recent history
 *   pnpm chat:pending -- --limit 20
 *
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (same as visitor soft memory).
 * Historical chats from before this store existed cannot be recovered — check Resend dashboard.
 */

import {
  countPendingChatForwards,
  listChatForwards,
  type ChatForwardRecord,
} from '../lib/chatForwardStore';
import { visitorSoftMemoryEnabled } from '../lib/visitorMemory';

function summarize(rec: ChatForwardRecord): string {
  const firstUser = rec.transcript.find((m) => m.role === 'user')?.text ?? '';
  const snippet = firstUser.replace(/\s+/g, ' ').slice(0, 72);
  return [
    rec.status.toUpperCase().padEnd(7),
    rec.createdAt,
    rec.id,
    `sess=${rec.sessionId.slice(0, 8)}`,
    rec.error ? `err=${rec.error.slice(0, 60)}` : '',
    snippet ? `“${snippet}${firstUser.length > 72 ? '…' : ''}”` : '',
  ]
    .filter(Boolean)
    .join('  ');
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 50 : 50;

  if (!visitorSoftMemoryEnabled()) {
    console.error(
      '[chat:pending] UPSTASH Redis is not configured in this environment.\n' +
        'Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Vercel production env),\n' +
        'then re-run. Past emails: Resend dashboard → Emails.\n' +
        'Transcripts before the durable store shipped cannot be reconstructed from git.',
    );
    process.exit(2);
  }

  const pendingCount = await countPendingChatForwards();
  const rows = await listChatForwards({
    status: all ? undefined : 'pending',
    limit,
  });

  console.log(
    all
      ? `[chat:pending] last ${rows.length} forwards (pending queue size: ${pendingCount})`
      : `[chat:pending] ${pendingCount} pending/failed — showing ${rows.length}`,
  );

  if (rows.length === 0) {
    console.log('(none)');
    return;
  }

  for (const rec of rows) {
    console.log(summarize(rec));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
