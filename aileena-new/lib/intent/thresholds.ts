/**
 * Same gates as intent-aggregator/src/decide.rs.
 * The model's next_action answer is not the action we return.
 */

import type { Scenario } from './questions';

export const THRESHOLDS = {
  lowConfidence: 0.5,
  needsHumanNoul: 0.7,
  wantsRevisionNoul: 0.7,
  isUrgentNoul: 0.7,
  urgentScore: 2,
  quietResistance: 1,
} as const;

export type AnswerMap = Record<string, unknown>;

type ChoiceAnswer = { choice?: unknown; confidence?: unknown };
type ScoreAnswer = { score?: unknown; confidence?: unknown };
type NoulAnswer = { noul?: unknown };

export type Decision = {
  action: string;
  lowConfidence: string[];
};

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

function lowConfidenceIds(answers: AnswerMap): string[] {
  const ids: string[] = [];
  for (const [id, value] of Object.entries(answers)) {
    const row = asRecord(value);
    if (!row || typeof row.confidence !== 'number') continue;
    if (row.confidence < THRESHOLDS.lowConfidence) ids.push(id);
  }
  return ids;
}

function mapScenario(scenario: Scenario, answers: AnswerMap): string {
  if (scenario === 'customer') {
    const intent = choiceOf(answers, 'intent');
    if (!intent) return 'review_manually';
    const urgency = scoreOf(answers, 'urgency') ?? 0;
    if (intent.choice === 'purchase' || intent.choice === 'price_comparison') return 'follow_up';
    if (intent.choice === 'inquiry' || intent.choice === 'chitchat') return 'auto_reply';
    if (intent.choice === 'complaint' || intent.choice === 'refund') {
      return urgency >= THRESHOLDS.urgentScore ? 'escalate_human' : 'create_ticket';
    }
    return 'review_manually';
  }
  if (scenario === 'meeting') {
    const stance = choiceOf(answers, 'stance');
    if (!stance) return 'review_manually';
    const resistance = scoreOf(answers, 'resistance') ?? 0;
    if (stance.choice === 'support' && resistance < THRESHOLDS.quietResistance) return 'approve';
    if (stance.choice === 'support' || stance.choice === 'skeptical') return 'prepare_revision';
    if (stance.choice === 'oppose') return 'shelve';
    return 'review_manually';
  }
  const department = choiceOf(answers, 'department');
  if (!department) return 'review_manually';
  if (department.choice === 'billing' || department.choice === 'technical' || department.choice === 'sales') {
    return `route_${department.choice}`;
  }
  return 'review_manually';
}

export function suggestedAction(scenario: Scenario, answers: AnswerMap): Decision {
  const lowConfidence = lowConfidenceIds(answers);
  if (lowConfidence.length > 0) return { action: 'review_manually', lowConfidence };
  const human = noulOf(answers, 'needs_human');
  if (human != null && human > THRESHOLDS.needsHumanNoul) return { action: 'escalate_human', lowConfidence };
  const revision = noulOf(answers, 'wants_revision');
  if (revision != null && revision > THRESHOLDS.wantsRevisionNoul) {
    return { action: 'prepare_revision', lowConfidence };
  }
  const urgent = noulOf(answers, 'is_urgent');
  if (urgent != null && urgent > THRESHOLDS.isUrgentNoul) return { action: 'handle_immediately', lowConfidence };
  return { action: mapScenario(scenario, answers), lowConfidence };
}
