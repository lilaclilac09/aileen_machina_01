/**
 * GET/POST /api/draw — one trailing card per Asia/Taipei civil day.
 * Recite only. Same day → same card. Does not write the site.
 * Idle chat must not call this; Console sends only on draw intent.
 */

import { taipeiDay } from '../../../lib/taipeiDay';
import { cardById, pickDrawCard, reciteDrawCard, type DrawCard } from '../../../lib/drawDeck';
import { ensureVisitorId, buildVisitorCookie } from '../../../lib/visitorMemory';

export const runtime = 'edge';

const DRAW_COOKIE = '__aileena_draw';

type DrawCookie = { date: string; cardId: string };

function parseDrawCookie(req: Request, today: string): DrawCookie | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${DRAW_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const decoded = JSON.parse(decodeURIComponent(match[1])) as Partial<DrawCookie>;
    if (decoded.date !== today || typeof decoded.cardId !== 'string') return null;
    if (!cardById(decoded.cardId)) return null;
    return { date: decoded.date, cardId: decoded.cardId };
  } catch {
    return null;
  }
}

function buildDrawCookie(state: DrawCookie): string {
  const value = encodeURIComponent(JSON.stringify(state));
  return `${DRAW_COOKIE}=${value}; Path=/; Max-Age=90000; HttpOnly; Secure; SameSite=Strict`;
}

function payload(card: DrawCard, date: string, repeat: boolean) {
  return {
    ok: true,
    date,
    timezone: 'Asia/Taipei',
    repeat,
    card: {
      id: card.id,
      room: card.room,
      title: card.title,
      recitation: card.recitation,
      href: card.href,
    },
    text: reciteDrawCard(card),
  };
}

async function handle(req: Request): Promise<Response> {
  const today = taipeiDay();
  const existing = parseDrawCookie(req, today);
  const { id: visitorId, isNew } = await ensureVisitorId(req);

  let card: DrawCard;
  let repeat = false;
  if (existing) {
    card = cardById(existing.cardId) ?? pickDrawCard(today, visitorId);
    repeat = true;
  } else {
    card = pickDrawCard(today, visitorId);
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', buildDrawCookie({ date: today, cardId: card.id }));
  if (isNew) {
    const vid = await buildVisitorCookie(visitorId);
    if (vid) headers.append('Set-Cookie', vid);
  }
  headers.set('X-Draw-Day', today);
  headers.set('X-Draw-Room', card.room);

  return new Response(JSON.stringify(payload(card, today, repeat)), { status: 200, headers });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
