/**
 * Proof queue — Design OS self-evolution statuses.
 * Public visitors may only create `observed`. Owner is the only approver.
 * No merge from this queue.
 */

export const PROOF_STATUSES = [
  'observed',
  'proposed',
  'approved',
  'in_progress',
  'needs_screenshots',
  'ready_for_review',
  'rejected',
  'shipped',
] as const;

export type ProofStatus = (typeof PROOF_STATUSES)[number];

export type ProofItem = {
  id: string;
  title: string;
  route: string;
  problem: string;
  proposedChange: string;
  source: 'owner' | 'visitor' | 'seed' | 'computer';
  status: ProofStatus;
  risk: 'low' | 'medium' | 'high';
  acceptanceCriteria: string[];
  screenshots: string[];
  filesChanged: string[];
  checksRun: string[];
  computerTaskIds: string[];
  resultSummary: string;
  createdAt: string;
  updatedAt: string;
};
