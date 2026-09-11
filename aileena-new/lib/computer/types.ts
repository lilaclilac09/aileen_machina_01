/**
 * Computer-task prototype.
 *
 * Owner tasks may use the Cloudflare Worker Durable Object (`owner`).
 * Visitor tasks are a local scratch pad only — never the owner DO, never
 * site git. This is NOT installing @cloudflare/computer in Next.js.
 */

export const COMPUTER_TASK_TYPES = [
  'inspect_route_files',
  'generate_implementation_prompt',
  'draft_patch',
  'run_build_check',
  'collect_screenshot_checklist',
  'update_proof_queue',
  'draft_daily_fix_plan',
  'write_scratch_file',
  'shell_exec',
  'git_status',
  'git_log',
  'git_find_commit',
  'git_show',
  'files_tree',
  'files_search',
  'files_open',
  'email_draft',
  'email_send',
  'browser_screenshot',
] as const;

export type ComputerTaskType = (typeof COMPUTER_TASK_TYPES)[number];

export const COMPUTER_TASK_STATUSES = [
  'queued',
  'running',
  'needs_input',
  'blocked',
  'failed',
  'completed',
] as const;

export type ComputerTaskStatus = (typeof COMPUTER_TASK_STATUSES)[number];

export type ComputerArtifact = {
  id: string;
  kind: 'report' | 'file' | 'checklist' | 'scratch' | 'git';
  path: string;
  title: string;
  bytes: number;
  /** Redacted preview; never includes secrets. */
  preview?: string;
};

export type ComputerTask = {
  id: string;
  /** `owner` or `v-…`. Missing on old rows → treat as owner. */
  actorId?: string;
  proofItemId: string;
  taskType: ComputerTaskType;
  status: ComputerTaskStatus;
  route: string;
  scope: string;
  instructions: string;
  resultSummary: string;
  artifacts: ComputerArtifact[];
  logsRedacted: string[];
  filesInspected: string[];
  problemsFound: string[];
  proposedFilesToChange: string[];
  implementationPlan: string[];
  risksBlockers: string[];
  backend: 'local-shim' | 'cloudflare-worker-shell';
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelled: boolean;
};

export type CreateComputerTaskInput = {
  proofItemId?: string;
  taskType: ComputerTaskType;
  scope?: string;
  route?: string;
  instructions?: string;
};
