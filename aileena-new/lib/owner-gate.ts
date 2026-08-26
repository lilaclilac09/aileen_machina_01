/**
 * Server-side owner gate for inbox / chat-forward APIs.
 * Requires owner KeyShield session (__aileena_pass via=owner).
 */

import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSession } from './auth';

export type OwnerIdentity = {
  sub: string;
  via: 'owner';
};

export async function identityFromSessionToken(
  token: string | undefined | null,
): Promise<OwnerIdentity | null> {
  try {
    const sess = await readSession(token);
    if (!sess) return null;
    if (sess.via === 'owner' || sess.sub === 'owner') {
      return { sub: sess.sub, via: 'owner' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function readOwnerIdentityFromCookieHeader(
  cookieHeader: string | null,
): Promise<OwnerIdentity | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  let token = match[1];
  try {
    token = decodeURIComponent(token);
  } catch {
    /* keep raw */
  }
  return identityFromSessionToken(token);
}

/** App Router pages / server components. */
export async function getOwnerIdentity(): Promise<OwnerIdentity | null> {
  const jar = await cookies();
  return identityFromSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireOwnerFromRequest(req: Request): Promise<OwnerIdentity | null> {
  return readOwnerIdentityFromCookieHeader(req.headers.get('cookie'));
}
