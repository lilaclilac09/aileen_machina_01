/** Capability tabs for the owner computer. Visitors never see these. */

export const COMPUTER_TABS = [
  'chat',
  'files',
  'git',
  'browser',
  'code',
  'email',
  'proof',
  'tasks',
] as const;

export type ComputerTabId = (typeof COMPUTER_TABS)[number];

export type TabWireState = 'wired' | 'blocked' | 'draft-only';

export const TAB_WIRE: Record<ComputerTabId, TabWireState> = {
  chat: 'wired',
  files: 'wired',
  git: 'wired',
  browser: 'blocked',
  code: 'draft-only',
  email: 'draft-only',
  proof: 'wired',
  tasks: 'wired',
};

export const TAB_STATUS_COPY: Record<TabWireState, string> = {
  wired: 'idle',
  blocked: 'blocked',
  'draft-only': 'blocked',
};

export function capabilityForTaskType(taskType: string): ComputerTabId {
  if (taskType.startsWith('git_')) return 'git';
  if (taskType.startsWith('files_')) return 'files';
  if (taskType.startsWith('email_')) return 'email';
  if (taskType.startsWith('browser_')) return 'browser';
  if (taskType === 'update_proof_queue') return 'proof';
  if (
    taskType === 'draft_patch' ||
    taskType === 'draft_daily_fix_plan' ||
    taskType === 'inspect_route_files' ||
    taskType === 'generate_implementation_prompt' ||
    taskType === 'run_build_check'
  ) {
    return 'code';
  }
  if (taskType === 'write_scratch_file') return 'files';
  if (taskType === 'collect_screenshot_checklist') return 'browser';
  return 'tasks';
}
