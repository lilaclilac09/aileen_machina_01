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
  "council online.\nshow me the mess. i'll find the invoice hiding inside it.";
