/**
 * /api/chat agentMode.
 *
 * public  — visitor hall (orb console). Default when omitted or "site".
 * council — owner war room. Non-owners get 403 (never silent fallback).
 * machina — existing first-person API; not the public console.
 *
 * Hiding a UI button is not access control. The server decides.
 * Public contact/forward must not trust client agentMode as the only gate.
 */

import { COUNCIL_OPENING } from './councilCopy';

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

export type CouncilPipelineProbe = {
  agentMode?: unknown;
  councilLens?: unknown;
  transcript?: unknown;
  context?: unknown;
  note?: unknown;
  name?: unknown;
};

function looksLikeCouncilContext(context: unknown): boolean {
  if (typeof context !== 'string' || !context.trim()) return false;
  const raw = context.trim();
  try {
    const url = new URL(raw, 'https://aileena.xyz');
    const path = url.pathname.replace(/\/+$/, '').toLowerCase() || '/';
    return path === '/council' || path.startsWith('/council/');
  } catch {
    return /(^|[/?#])council(\/|$|[?#])/i.test(raw);
  }
}

function contactTextBlob(opts: CouncilPipelineProbe): string {
  const parts: string[] = [];
  if (typeof opts.note === 'string') parts.push(opts.note);
  if (typeof opts.name === 'string') parts.push(opts.name);
  if (typeof opts.transcript === 'string') {
    parts.push(opts.transcript);
  } else if (Array.isArray(opts.transcript)) {
    for (const m of opts.transcript) {
      if (!m || typeof m !== 'object') continue;
      const text =
        (m as { text?: unknown }).text ?? (m as { content?: unknown }).content;
      if (typeof text === 'string') parts.push(text);
    }
  }
  return parts.join('\n');
}

function looksLikeCouncilOpening(blob: string): boolean {
  const text = blob.toLowerCase();
  const opening = COUNCIL_OPENING.toLowerCase();
  if (text.includes(opening)) return true;
  const compact = (s: string) => s.replace(/\s+/g, ' ').trim();
  return compact(text).includes(compact(opening));
}

function looksLikeCouncilFormat(blob: string): boolean {
  const messy =
    /^\s*read\s*:/im.test(blob) &&
    /^\s*risk\s*:/im.test(blob) &&
    /^\s*(?:next\s+)?move\s*:/im.test(blob) &&
    /^\s*wording\s*:/im.test(blob);
  if (messy) return true;
  return (
    /^\s*judgment\s*:/im.test(blob) &&
    /^\s*leverage\s*:/im.test(blob) &&
    /^\s*(?:next\s+)?move\s*:/im.test(blob) &&
    /^\s*do not\s*:/im.test(blob)
  );
}

/**
 * True when a contact/forward payload is council-shaped and must not enter
 * the public pipeline. Client agentMode is one signal, not the only gate.
 */
export function isCouncilPipelineRequest(opts: CouncilPipelineProbe): boolean {
  if (typeof opts.agentMode === 'string' && opts.agentMode.trim().toLowerCase() === 'council') {
    return true;
  }
  if (typeof opts.councilLens === 'string' && opts.councilLens.trim()) {
    return true;
  }
  if (looksLikeCouncilContext(opts.context)) {
    return true;
  }
  const blob = contactTextBlob(opts);
  return Boolean(blob) && (looksLikeCouncilOpening(blob) || looksLikeCouncilFormat(blob));
}
