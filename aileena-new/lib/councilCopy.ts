/**
 * Visitor-safe council chrome. Tiny on purpose — imported by the owner UI.
 * The full council system prompt lives in lib/aileenaCouncil.ts (server).
 */

export const COUNCIL_LENSES = [
  'strategy',
  'negotiation',
  'product',
  'review',
  'editor',
  'political',
  'vent',
] as const;

export type CouncilLens = (typeof COUNCIL_LENSES)[number];

export function isCouncilLens(value: unknown): value is CouncilLens {
  return typeof value === 'string' && (COUNCIL_LENSES as readonly string[]).includes(value);
}

export const COUNCIL_OPENING =
  'Private council. Not the public guide. No leave-a-note, no visitor transcript. Goal, leverage, next move — or vent first.';
