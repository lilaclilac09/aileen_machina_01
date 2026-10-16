/**
 * Server-side turn ledger (P1.3). One state owner for what was said in a
 * session: assistant turns are rebuilt from here, never trusted from the
 * client. A turn is committed only when the model finished (stop/length).
 * turnId makes retries idempotent: a committed turn is replayed, not re-run
 * and not re-charged.
 */
import type { UIMessage } from 'ai';
import { runtimeKv } from './kv';

export type LedgerTurn = {
  turnId: string;
  user: string;
  assistant: string;
  finishReason: string;
  at: number;
};

export const LEDGER_TTL_SEC = 60 * 60 * 24;
export const LEDGER_MAX_TURNS = 24;
const ID_RE = /^[A-Za-z0-9_-]{8,80}$/;

export function validLedgerId(v: unknown): v is string {
  return typeof v === 'string' && ID_RE.test(v);
}

function key(sessionId: string): string {
  return `ledger:v1:${sessionId}`;
}

export async function readLedger(sessionId: string): Promise<LedgerTurn[]> {
  const raw = await runtimeKv().get<LedgerTurn[] | string>(key(sessionId));
  if (!raw) return [];
  try {
    const list = typeof raw === 'string' ? (JSON.parse(raw) as LedgerTurn[]) : raw;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function findCommittedTurn(sessionId: string, turnId: string): Promise<LedgerTurn | null> {
  return (await readLedger(sessionId)).find((t) => t.turnId === turnId) ?? null;
}

/** Idempotent append. Returns false when the turnId was already committed. */
export async function commitTurn(sessionId: string, turn: LedgerTurn): Promise<boolean> {
  const list = await readLedger(sessionId);
  if (list.some((t) => t.turnId === turn.turnId)) return false;
  list.push({ ...turn, user: turn.user.slice(0, 2000), assistant: turn.assistant.slice(0, 4000) });
  await runtimeKv().set(key(sessionId), JSON.stringify(list.slice(-LEDGER_MAX_TURNS)), { ex: LEDGER_TTL_SEC });
  return true;
}

function textOf(m: UIMessage): string {
  return (m.parts ?? [])
    .map((p) => (p.type === 'text' ? (p as { text: string }).text : ''))
    .join('')
    .trim();
}

/**
 * Rebuild the transcript from the ledger. With committed turns, the history is
 * the ledger (server-written user + assistant text) followed by the client's
 * newest user message. Without a ledger (first turn, or the store missed), the
 * client transcript is used as-is; the input guard has already reduced it to
 * text and neutralized markers.
 */
export function rebuildTranscript(
  client: UIMessage[],
  ledger: LedgerTurn[],
): { messages: UIMessage[]; source: 'ledger' | 'client'; replacedAssistant: number } {
  if (ledger.length === 0) return { messages: client, source: 'client', replacedAssistant: 0 };
  const lastUser = [...client].reverse().find((m) => m.role === 'user');
  if (!lastUser) return { messages: client, source: 'client', replacedAssistant: 0 };
  const out: UIMessage[] = [];
  for (const t of ledger) {
    out.push({ id: `${t.turnId}-u`, role: 'user', parts: [{ type: 'text', text: t.user }] });
    if (t.assistant) out.push({ id: `${t.turnId}-a`, role: 'assistant', parts: [{ type: 'text', text: t.assistant }] });
  }
  out.push(lastUser);
  const replacedAssistant = client.filter((m) => m.role === 'assistant' && textOf(m)).length;
  return { messages: out, source: 'ledger', replacedAssistant };
}
