import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { CWID_RE, OWNER_COMPUTER_ID } from './workspaceName';

export { CWID_RE, OWNER_COMPUTER_ID, isComputerWorkspaceName } from './workspaceName';

/** Per-visitor scratch-pad id. Not the owner Durable Object. Not `__aileena_vid`. */
export const COMPUTER_WORKSPACE_COOKIE = '__aileena_cwid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ComputerActor = {
  kind: 'owner' | 'visitor';
  id: string;
  /** Set when a new visitor workspace cookie must be minted. */
  cookie?: string;
};

function newComputerVisitorId(): string {
  const c = globalThis.crypto;
  const raw =
    c && typeof c.randomUUID === 'function'
      ? c.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return `v-${raw.slice(0, 16)}`;
}

export function readComputerWorkspaceId(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COMPUTER_WORKSPACE_COOKIE}=([^;]+)`));
  if (!match) return null;
  let value = match[1];
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep raw */
  }
  return CWID_RE.test(value) ? value : null;
}

export async function computerActorFromRequest(req: Request): Promise<ComputerActor> {
  const owner = await requireOwnerFromRequest(req);
  if (owner) return { kind: 'owner', id: OWNER_COMPUTER_ID };
  const existing = readComputerWorkspaceId(req.headers.get('cookie'));
  if (existing) return { kind: 'visitor', id: existing };
  const id = newComputerVisitorId();
  return { kind: 'visitor', id, cookie: id };
}

export function computerActorSetCookie(actor: ComputerActor): string | null {
  if (!actor.cookie) return null;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COMPUTER_WORKSPACE_COOKIE}=${actor.cookie}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`;
}

export function applyComputerActorCookie(response: NextResponse, actor: ComputerActor): NextResponse {
  if (!actor.cookie) return response;
  response.cookies.set({
    name: COMPUTER_WORKSPACE_COOKIE,
    value: actor.cookie,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

/** Forward a freshly minted cwid on same-origin server fetches (chat → tasks). */
export function cookieHeaderWithActor(existing: string | null, actor: ComputerActor): string {
  const current = existing || '';
  if (actor.kind === 'owner') return current;
  const pair = `${COMPUTER_WORKSPACE_COOKIE}=${actor.cookie || actor.id}`;
  if (!current) return pair;
  if (current.includes(COMPUTER_WORKSPACE_COOKIE)) {
    return current.replace(new RegExp(`${COMPUTER_WORKSPACE_COOKIE}=[^;]*`), pair);
  }
  return `${current}; ${pair}`;
}
