/**
 * Visitor-facing Console prefix copy. Tiny on purpose — imported by
 * the client overlay. Do not put Redis / tool routing here.
 */

export const COMPACTION_PING =
  'Context is full. Fresh thread — earlier turns stay on the desk, not in this kiln.';

export const MODEL_SWAP_PING =
  'Switching brains. Fresh thread — Cloud and on-device do not share a prefix.';

export const ACCENT_SWAP_PING =
  'Accent changed. Fresh thread — spoken register stays frozen for one root.';

export type NewRootReason = 'compaction' | 'model_swap' | 'accent_swap';

export function pingForNewRootReason(reason: string | undefined, fallback?: string): string {
  if (reason === 'model_swap') return MODEL_SWAP_PING;
  if (reason === 'accent_swap') return ACCENT_SWAP_PING;
  if (reason === 'compaction') return COMPACTION_PING;
  return fallback || COMPACTION_PING;
}

/** Parse /api/chat 409 JSON (also useChat error.message, which may wrap JSON). */
export function parseNewRootError(raw: string): { reason: NewRootReason | string; message: string } | null {
  const t = raw.trim();
  if (!t) return null;
  const jsonStart = t.indexOf('{');
  const jsonEnd = t.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
  let parsed: { code?: unknown; reason?: unknown; error?: unknown };
  try {
    parsed = JSON.parse(t.slice(jsonStart, jsonEnd + 1)) as typeof parsed;
  } catch {
    return null;
  }
  if (parsed.code !== 'new_root') return null;
  const reason = typeof parsed.reason === 'string' ? parsed.reason : 'compaction';
  const fallback = typeof parsed.error === 'string' ? parsed.error : COMPACTION_PING;
  return { reason, message: pingForNewRootReason(reason, fallback) };
}
