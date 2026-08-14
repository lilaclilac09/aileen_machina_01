/**
 * Frozen Console prefix — one root per visitor session.
 *
 * System prompt + tool table stay still. RAG hits, visitor soft memory,
 * this-turn tool-route hints, draw recitation, quota chips, Whisper text,
 * and tool RESULTS belong in the conversation tail — never rewritten into
 * the prefix. Model swap or compaction → ping, then a new root.
 *
 * Draw / quota numbers are not part of this module on purpose.
 */

import { MEMORY_STACK_PROMPT } from './memoryStack';
import { spokenRegisterPrompt, type VoiceAccent } from './voiceAccent';
import type { ToolRoute } from './toolRouter';
import { formatToolRouteForPrompt } from './toolRouter';
import {
  formatVisitorSoftMemoryForPrompt,
  type VisitorSoftMemory,
} from './visitorMemory';
import type { AgentMode } from './agentMode';

export {
  ACCENT_SWAP_PING,
  COMPACTION_PING,
  MODEL_SWAP_PING,
  parseNewRootError,
  pingForNewRootReason,
} from './consolePrefixCopy';

/** Match the old silent window — but never slice. Ping + new root instead. */
export const FROZEN_MAX_MESSAGES = 20;

export const FROZEN_PREFIX_NOTE = `
# Frozen prefix
This system block and the tool table are the session root. They do not change mid-thread.
Retrieval hits, route hints, and visitor notes arrive in a trailing block after the messages — not here.
Do not rewrite persona. Do not wait for a card, a quota chip, or a transcript in this block.`;

export type FrozenPrefixInput = {
  baseSystem: string;
  agentMode: AgentMode;
  voiceAccent: VoiceAccent | null;
  memoryIndexLine: string;
  publicToolTable: string;
  machinaToolTable: string;
  councilToolTable: string;
};

export type SessionTailInput = {
  agentMode: AgentMode;
  memoryPrefetchBlock: string;
  toolRoute: ToolRoute;
  visitorSoft: VisitorSoftMemory;
  priorTopics: string[];
  lastQuestion: string;
  councilLensBlock: string;
};

export function buildFrozenSystemPrompt(input: FrozenPrefixInput): string {
  const spoken = input.agentMode === 'council' ? '' : spokenRegisterPrompt(input.voiceAccent);
  const memory =
    input.agentMode === 'council' ? '' : MEMORY_STACK_PROMPT + input.memoryIndexLine;
  const tools =
    input.agentMode === 'council'
      ? input.councilToolTable
      : input.agentMode === 'machina'
        ? input.machinaToolTable
        : input.publicToolTable;

  return input.baseSystem + spoken + memory + FROZEN_PREFIX_NOTE + tools;
}

export function buildSessionTail(input: SessionTailInput): string {
  const parts: string[] = [
    '[session tail — not the frozen prefix. Answer the visitor\'s last question. Tool results already in the thread win over this block.]',
  ];

  if (input.memoryPrefetchBlock) parts.push(input.memoryPrefetchBlock);
  if (input.agentMode !== 'council') {
    parts.push(formatToolRouteForPrompt(input.toolRoute).trim());
    parts.push(
      formatVisitorSoftMemoryForPrompt(
        input.visitorSoft,
        input.priorTopics,
        input.lastQuestion,
      ).trim(),
    );
  }
  if (input.agentMode === 'council' && input.councilLensBlock) {
    parts.push(input.councilLensBlock.trim());
  }

  const body = parts.filter((p) => p.length > 0).join('\n\n');
  return body.trim();
}

export function needsNewRootForLength(messageCount: number): boolean {
  return messageCount > FROZEN_MAX_MESSAGES;
}

export function readSessionProviderLock(
  bodyValue: unknown,
  headerValue: string | null,
): string | undefined {
  const fromBody = typeof bodyValue === 'string' ? bodyValue.trim() : '';
  const fromHeader = (headerValue ?? '').trim();
  const raw = fromBody || fromHeader;
  return raw.length > 0 ? raw : undefined;
}

export function needsNewRootForProvider(
  sessionProvider: string | undefined,
  pickedProvider: string,
): boolean {
  if (!sessionProvider) return false;
  return sessionProvider !== pickedProvider;
}

export function readSessionAccentLock(
  bodyValue: unknown,
  headerValue: string | null,
): string | undefined {
  const fromBody = typeof bodyValue === 'string' ? bodyValue.trim().toLowerCase() : '';
  const fromHeader = (headerValue ?? '').trim().toLowerCase();
  const raw = fromBody || fromHeader;
  return raw.length > 0 ? raw : undefined;
}

/** Locked spoken register vs this request. Empty lock = first turn of a root. */
export function needsNewRootForAccent(
  sessionAccent: string | undefined,
  current: VoiceAccent | null,
): boolean {
  if (!sessionAccent) return false;
  const locked = sessionAccent === 'off' ? 'off' : sessionAccent;
  const now = current ?? 'off';
  return locked !== now;
}

/** Guard: frozen text must not contain draw / quota / prefetch hits. */
export function frozenPrefixForbidden(text: string): string[] {
  const hits: string[] = [];
  if (/# Memory prefetch/i.test(text)) hits.push('prefetch');
  if (/\b(抽牌|今日牌|tarot|draw deck|daily card)\b/i.test(text)) hits.push('draw');
  if (/voice-code n\/5|chat \d+\/20|X-Daily-Remaining/i.test(text)) hits.push('quota');
  return hits;
}
