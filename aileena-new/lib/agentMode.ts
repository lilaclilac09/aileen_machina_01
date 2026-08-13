/**
 * /api/chat agentMode.
 *
 * public  — visitor hall (orb console). Default when omitted or "site".
 * council — owner war room. Non-owners get 403 (never silent fallback).
 * machina — existing first-person API; not the public console.
 *
 * Hiding a UI button is not access control. The server decides.
 */

export type AgentMode = 'public' | 'machina' | 'council';

export type AgentModeDecision =
  | { ok: true; mode: AgentMode }
  | { ok: false; status: 403; error: string };

function normalizeRequested(requested: string | undefined): string {
  if (!requested) return 'public';
  const raw = requested.trim().toLowerCase();
  if (raw === 'site') return 'public';
  return raw;
}

/** Owner skips the visitor 20/day cap (council and public Console preview). */
export function skipVisitorQuota(isOwner: boolean): boolean {
  return isOwner;
}

export function decideAgentMode(
  requested: string | undefined,
  isOwner: boolean,
): AgentModeDecision {
  const raw = normalizeRequested(requested);
  if (raw === 'council') {
    if (!isOwner) {
      return { ok: false, status: 403, error: 'Council is owner-only.' };
    }
    return { ok: true, mode: 'council' };
  }
  if (raw === 'machina') return { ok: true, mode: 'machina' };
  return { ok: true, mode: 'public' };
}

/** True when a contact/forward payload is marked as council and must not enter the public pipeline. */
export function isCouncilPipelineRequest(opts: { agentMode?: unknown }): boolean {
  return typeof opts.agentMode === 'string' && opts.agentMode.trim().toLowerCase() === 'council';
}
