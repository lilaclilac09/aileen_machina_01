/**
 * Thresholds live here. Branching lives here.
 * The model's next_action answer is not the action we return.
 */

import type { Scenario } from './questions';

export const THRESHOLDS = {
  escalateNoul: 0.7,
  urgentScore: 2,
  lowConfidence: 0.5,
  reviseNoul: 0.7,
  highResistance: 2,
  approveResistance: 1,
  approveRevision: 0.5,
} as const;

export type AnswerMap = Record<string, unknown>;

type ChoiceAnswer = { choice?: unknown; confidence?: unknown };
type ScoreAnswer = { score?: unknown };
type NoulAnswer = { noul?: unknown };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function choiceOf(answers: AnswerMap, id: string): { choice: string; confidence: number } | null {
  const row = asRecord(answers[id]) as ChoiceAnswer | null;
  if (!row || typeof row.choice !== 'string') return null;
  const confidence = typeof row.confidence === 'number' ? row.confidence : 0;
  return { choice: row.choice, confidence };
}

function scoreOf(answers: AnswerMap, id: string): number | null {
  const row = asRecord(answers[id]) as ScoreAnswer | null;
  if (!row || typeof row.score !== 'number') return null;
  return row.score;
}

function noulOf(answers: AnswerMap, id: string): number | null {
  const row = asRecord(answers[id]) as NoulAnswer | null;
  if (!row || typeof row.noul !== 'number') return null;
  return row.noul;
}

function customerAction(answers: AnswerMap): string {
  const human = noulOf(answers, 'needs_human');
  const urgency = scoreOf(answers, 'urgency');
  const intent = choiceOf(answers, 'intent');
  if (human == null || urgency == null || intent == null) return 'follow_up';
  if (human >= THRESHOLDS.escalateNoul) return 'escalate_human';
  if (intent.choice === 'complaint' || intent.choice === 'refund') {
    if (urgency >= THRESHOLDS.urgentScore) return 'escalate_human';
    return 'create_ticket';
  }
  if (intent.choice === 'undecided' || intent.confidence < THRESHOLDS.lowConfidence) {
    return 'follow_up';
  }
  if (intent.choice === 'purchase' || intent.choice === 'price_comparison') return 'follow_up';
  return 'auto_reply';
}

function meetingAction(answers: AnswerMap): string {
  const stance = choiceOf(answers, 'stance');
  const resistance = scoreOf(answers, 'resistance');
  const revision = noulOf(answers, 'wants_revision');
  if (stance == null || resistance == null || revision == null) return 'shelve';
  if (stance.choice === 'oppose' && resistance >= THRESHOLDS.highResistance) return 'escalate';
  if (stance.choice === 'oppose') return 'shelve';
  if (revision >= THRESHOLDS.reviseNoul || stance.choice === 'skeptical') return 'revise';
  if (stance.choice === 'undecided' || stance.confidence < THRESHOLDS.lowConfidence) return 'shelve';
  if (
    stance.choice === 'support' &&
    resistance < THRESHOLDS.approveResistance &&
    revision < THRESHOLDS.approveRevision
  ) {
    return 'approve';
  }
  return 'revise';
}

function ticketAction(answers: AnswerMap): string {
  const department = choiceOf(answers, 'department');
  const urgent = noulOf(answers, 'is_urgent');
  if (department == null || urgent == null) return 'hold';
  if (department.choice === 'undecided' || department.confidence < THRESHOLDS.lowConfidence) {
    return 'hold';
  }
  if (urgent >= THRESHOLDS.escalateNoul) return `urgent_${department.choice}`;
  return `route_${department.choice}`;
}

export function suggestedAction(scenario: Scenario, answers: AnswerMap): string {
  if (scenario === 'customer') return customerAction(answers);
  if (scenario === 'meeting') return meetingAction(answers);
  return ticketAction(answers);
}
