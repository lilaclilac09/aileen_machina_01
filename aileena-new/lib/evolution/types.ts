/**
 * Site-agent self-evolution types.
 * Skills are versioned patches. Weights are never updated here.
 */

export const SKILL_KINDS = ['site-agent', 'maintainer'] as const;
export type SkillKind = (typeof SKILL_KINDS)[number];

export const TASK_SPLITS = ['train', 'held-out'] as const;
export type TaskSplit = (typeof TASK_SPLITS)[number];

export const DIFFICULTY_BUCKETS = ['easy', 'medium', 'hard', 'adversarial'] as const;
export type DifficultyBucket = (typeof DIFFICULTY_BUCKETS)[number];

export const TRAJECTORY_CORPORA = [
  'sft',
  'dpo_chosen',
  'dpo_rejected',
  'rlvr',
  'hack_attempt',
] as const;
export type TrajectoryCorpus = (typeof TRAJECTORY_CORPORA)[number];

export type CheckKind = 'includes_any' | 'excludes_any' | 'includes_all' | 'not_empty';

export type VerifierCheck = {
  type: CheckKind;
  values?: string[];
};

export type SkillPatch = {
  id: string;
  version: number;
  kind: SkillKind;
  parent: number | null;
  triggers: string[];
  mustInclude: string[];
  mustNot: string[];
  replyGuidance: string;
  body: string;
  /** Failures this patch claims to cover. */
  rootCause: string;
};

export type TaskPrompt = {
  id: string;
  split: TaskSplit;
  bucket: DifficultyBucket;
  prompt: string;
  /** Structure tags for dedup / collapse control. */
  structure: string[];
};

export type TaskVerifier = {
  id: string;
  checks: VerifierCheck[];
};

export type SolverStep = {
  skillId: string | null;
  action: string;
  detail: string;
};

export type SolverOutput = {
  reply: string;
  skillIds: string[];
  steps: SolverStep[];
  hackAttempt: boolean;
  hackReason?: string;
};

export type ScoreCard = {
  taskId: string;
  prompt: string;
  structure: string[];
  split: TaskSplit;
  bucket: DifficultyBucket;
  pass: boolean;
  failedChecks: string[];
  solver: SolverOutput;
};

export type EvalReport = {
  skillSet: string[];
  passed: number;
  total: number;
  heldOutPassed: number;
  heldOutTotal: number;
  trainPassed: number;
  trainTotal: number;
  byBucket: Record<DifficultyBucket, { passed: number; total: number }>;
  scores: ScoreCard[];
  verifierHash: string;
  verifierMutated: boolean;
};

export type RatchetDecision =
  | {
      promote: true;
      reason: string;
      candidateId: string;
      before: number;
      after: number;
    }
  | {
      promote: false;
      reason: string;
      candidateId: string;
      before: number;
      after: number;
    };

export type LedgerEntry = {
  at: string;
  action: 'promote' | 'reject' | 'rollback' | 'seed';
  skillId: string;
  version: number;
  heldOutBefore: number;
  heldOutAfter: number;
  reason: string;
};

export type TrajectoryRecord = {
  id: string;
  at: string;
  taskId: string;
  split: TaskSplit;
  bucket: DifficultyBucket;
  skillIds: string[];
  steps: SolverStep[];
  reply: string;
  pass: boolean;
  corpus: TrajectoryCorpus;
  verifierHash: string;
  pairedWith?: string;
};

export type LoopResult = {
  evaluated: EvalReport;
  synthesized: SkillPatch[];
  decisions: RatchetDecision[];
  promoted: SkillPatch[];
  generatedTasks: number;
  expandedHeldOut: number;
  trajectories: number;
  ledgerSize: number;
};
