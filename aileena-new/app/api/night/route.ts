import { NextResponse } from 'next/server';
import {
  deleteNight,
  deskReply,
  exportNight,
  NIGHT_TTL_SECONDS,
  nightKey,
  pinLine,
  readNight,
  touchNight,
  writeNight,
} from '../../../lib/nightDesk';
import { getVisitorRedis } from '../../../lib/visitorMemory';

export const dynamic = 'force-dynamic';

type Body = {
  userId?: string;
  text?: string;
  paid?: boolean;
  ageOk?: boolean;
  mode?: string;
  action?: 'turn' | 'delete' | 'export' | 'pin';
};

async function persist(record: Parameters<typeof writeNight>[0]): Promise<void> {
  writeNight(record);
  const redis = getVisitorRedis();
  if (!redis) return;
  await redis.set(nightKey(record.userId), JSON.stringify(record), { ex: NIGHT_TTL_SECONDS });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const userId = (body.userId || '').trim();
  if (!userId) return NextResponse.json({ error: 'user id required' }, { status: 400 });
  if (body.mode !== 'night') {
    return NextResponse.json({ error: 'mode must be night' }, { status: 400 });
  }

  try {
    nightKey(userId);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'bad id' }, { status: 400 });
  }

  if (body.action === 'delete') {
    const empty = deleteNight(userId);
    writeNight(empty);
    const redis = getVisitorRedis();
    if (redis) await redis.del(nightKey(userId));
    return NextResponse.json({ ok: true, record: empty });
  }

  const record = readNight(userId);
  if (body.action === 'export') {
    return NextResponse.json({ ok: true, export: exportNight(record) });
  }

  if (body.action === 'pin') {
    const line = (body.text || '').trim();
    if (!line) return NextResponse.json({ error: 'nothing to pin' }, { status: 400 });
    const next = pinLine(record, line, new Date().toISOString());
    await persist(next);
    return NextResponse.json({ ok: true, record: next });
  }

  const reply = deskReply({
    mode: 'night',
    paid: false,
    ageOk: Boolean(body.ageOk),
    text: body.text || '',
  });
  let next = record;
  if (reply.store) {
    next = touchNight(record, (body.text || '').trim().slice(0, 160), new Date().toISOString());
    await persist(next);
  }
  return NextResponse.json({
    ok: true,
    key: nightKey(userId),
    reply,
    record: next,
    euTraining: false,
  });
}
