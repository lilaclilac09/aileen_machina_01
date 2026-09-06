/**
 * Owner computer apps in the site-agent dialog.
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
    id: 'note',
    label: 'note',
    kind: 'computer',
    taskType: 'write_scratch_file',
    blurb: 'Save a note into /workspace/scratch/notes.',
    canMerge: false,
  },
  {
    id: 'find',
    label: 'find',
    kind: 'computer',
    taskType: 'files_tree',
    blurb: 'List /workspace',
    canMerge: false,
  },
  {
    id: 'git',
    label: 'git',
    kind: 'computer',
    taskType: 'git_status',
    blurb: 'git status --short',
    canMerge: false,
  },
  {
    id: 'merge',
    label: 'merge',
    kind: 'merge-gate',
    taskType: null,
    blurb: 'Approve or reject in this dialog. GitHub merge stays owner-only outside the worker.',
    canMerge: false,
  },
] as const;

export function listHarnessPlugins(): HarnessPlugin[] {
  return [...HARNESS_PLUGINS];
}
