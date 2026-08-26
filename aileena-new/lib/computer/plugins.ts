/**
 * Owner harness plugins. Allowlisted slots in one /proof window.
 * This is Machina's owner harness prototype — not DeepSeek Harness (dsh).
 * Do not import @deepseek-ai/dsh. Merge is a pane, not a git action.
 */

import type { ComputerTaskType } from './types';

export type HarnessPluginKind = 'computer' | 'merge-gate';

export type HarnessPlugin = {
  id: string;
  label: string;
  kind: HarnessPluginKind;
  taskType: ComputerTaskType | null;
  blurb: string;
  /** Always false. GitHub merge is never a plugin. */
  canMerge: false;
};

export const HARNESS_PLUGINS: readonly HarnessPlugin[] = [
  {
    id: 'inspect',
    label: 'inspect',
    kind: 'computer',
    taskType: 'draft_daily_fix_plan',
    blurb: 'Read /daily files and draft a plan. Does not write the repo.',
    canMerge: false,
  },
  {
    id: 'scratch',
    label: 'scratch',
    kind: 'computer',
    taskType: 'write_scratch_file',
    blurb: 'Write /scratch/hello.txt in the workspace and read it back.',
    canMerge: false,
  },
  {
    id: 'screenshots',
    label: 'screenshots',
    kind: 'computer',
    taskType: 'collect_screenshot_checklist',
    blurb: 'Collect a screenshot checklist for the proof item.',
    canMerge: false,
  },
  {
    id: 'checks',
    label: 'checks',
    kind: 'computer',
    taskType: 'run_build_check',
    blurb: 'Run an allowlisted probe. Not pnpm build. Not deploy.',
    canMerge: false,
  },
  {
    id: 'patch',
    label: 'patch',
    kind: 'computer',
    taskType: 'draft_patch',
    blurb: 'Draft a patch plan. Does not apply. Does not commit.',
    canMerge: false,
  },
  {
    id: 'merge',
    label: 'merge',
    kind: 'merge-gate',
    taskType: null,
    blurb: 'Approve or reject in this window. GitHub merge stays owner-only outside the worker.',
    canMerge: false,
  },
] as const;

export function listHarnessPlugins(): HarnessPlugin[] {
  return [...HARNESS_PLUGINS];
}
