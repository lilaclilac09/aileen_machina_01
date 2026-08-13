import {
  buildOwnerChatSetCookie,
  createOwnerChatToken,
  hasOwnerUnlimitedChat,
  isOwnerEmail,
} from '@/lib/owner-access';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Owner console unlock — enter recognized email → long-lived signed cookie
 * → unlimited /api/chat (visitors stay at 20/day). Does not require Resend.
 */

export async function GET(req: NextRequest) {
  const unlimited = await hasOwnerUnlimitedChat(req);
  return NextResponse.json({ ok: true, unlimited });
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 });
  }

  if (!isOwnerEmail(email)) {
    // Do not reveal whether an address is on the allow-list.
    return NextResponse.json({ ok: true, unlimited: false });
  }

  const token = await createOwnerChatToken(email);
  const res = NextResponse.json({ ok: true, unlimited: true });
  res.headers.set('Set-Cookie', buildOwnerChatSetCookie(token));
  return res;
}
