import {
  countPendingChatForwards,
  listChatForwards,
} from '@/lib/chatForwardStore';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { visitorSoftMemoryEnabled } from '@/lib/visitorMemory';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Owner-only: list durable console chat forwards (Redis, ~90d).
 * GET /api/owner/chat-forwards?days=14&limit=200&status=all|sent|failed|pending
 */
export async function GET(req: NextRequest) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ ok: false, error: 'Owner session required.' }, { status: 401 });
  }

  const daysRaw = Number(req.nextUrl.searchParams.get('days') ?? '14');
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 90) : 14;
  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? '200');
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 200;
  const statusParam = (req.nextUrl.searchParams.get('status') ?? 'all').toLowerCase();
  const status =
    statusParam === 'sent' || statusParam === 'failed' || statusParam === 'pending'
      ? statusParam
      : undefined;

  if (!visitorSoftMemoryEnabled()) {
    return NextResponse.json({
      ok: true,
      redis: false,
      pending: 0,
      days,
      items: [],
      note:
        'Upstash Redis is not configured on this deployment. Check Resend → Emails for subject [AILEENA Chat …]. Full transcript log started 2026-08-04.',
    });
  }

  const pending = await countPendingChatForwards();
  const rows = await listChatForwards({
    status:
      status === 'pending'
        ? 'pending'
        : status === 'failed'
          ? 'failed'
          : status === 'sent'
            ? 'sent'
            : undefined,
    limit,
  });

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const items = rows
    .filter((r) => {
      const t = Date.parse(r.createdAt);
      return Number.isFinite(t) ? t >= cutoff : true;
    })
    .map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      status: r.status,
      subject: r.subject,
      createdAt: r.createdAt,
      sentAt: r.sentAt,
      error: r.error,
      referer: r.referer,
      messageCount: r.transcript.length,
      preview:
        r.transcript.find((m) => m.role === 'user')?.text.replace(/\s+/g, ' ').slice(0, 120) ?? '',
    }));

  return NextResponse.json({
    ok: true,
    redis: true,
    pending,
    days,
    count: items.length,
    items,
    note:
      'Durable Redis log since 2026-08-04 (~90d TTL). Older chats: Resend dashboard / inbox only.',
  });
}
