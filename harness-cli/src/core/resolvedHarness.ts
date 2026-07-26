/**
 * Resolved harness identity — what actually ran (not the A/B bucket label).
 *
 * Bug this encodes against: UI treated any A/B session as "Codex*" even when
 * the persisted/resolved harness was Nanocodex. Footer must use `resolved.name`.
 */

export type HarnessName = 'Codex' | 'Nanocodex' | 'hx';

export type AbCohort = 'A' | 'B';

/** Sticky A/B assignment provenance (keep in logs / metadata — not in footer label). */
export type AbAssignment = {
  experiment: string;
  cohort: AbCohort;
  /** Which harness the cohort *maps* to (may match resolved after override). */
  mappedHarness: HarnessName;
  reason: 'sticky-session' | 'explicit-flag' | 'hash' | 'none';
  assignedAt: string;
};

export type ResolvedHarness = {
  /** Display name for footers — must reflect what actually executed. */
  name: HarnessName;
  profile: 'agent' | 'ask' | 'plan' | 'review' | 'run';
  provider: string;
  write: boolean;
  shell: boolean;
  readOnly: boolean;
  sessionId?: string;
};

export type ExecutionMetadata = {
  resolved: ResolvedHarness;
  /** Present when session is in an A/B experiment; never use alone for footer text. */
  assignment: AbAssignment | null;
  checkpointId?: string;
  toolNames?: string[];
};

/** Slack Console–style footer. Uses resolved.name — never assignment.mappedHarness alone. */
export function formatSlackConsoleFooter(meta: ExecutionMetadata): string {
  const { resolved, assignment } = meta;
  const bits = [
    `harness=${resolved.name}`,
    `profile=${resolved.profile}`,
    `provider=${resolved.provider}`,
  ];
  if (assignment) {
    bits.push(`ab=${assignment.experiment}:${assignment.cohort}`);
  }
  // Historical bug rendered "Codex*" for every A/B hit. We show resolved only.
  return `—— ${bits.join(' · ')} ——`;
}

/** stderr / CLI footer */
export function formatCliHarnessFooter(meta: ExecutionMetadata): string {
  const { resolved, assignment, checkpointId, toolNames } = meta;
  const parts = [
    `[harness] ${resolved.name}`,
    `profile=${resolved.profile}`,
    `provider=${resolved.provider}`,
    resolved.readOnly ? 'read-only' : `write=${resolved.write ? 1 : 0}`,
  ];
  if (assignment) {
    parts.push(`ab=${assignment.cohort}→${assignment.mappedHarness}`);
  }
  if (toolNames?.length) parts.push(`tools=${toolNames.join(',')}`);
  if (checkpointId) parts.push(`ckpt=${checkpointId.slice(0, 8)}`);
  return parts.join(' ');
}

/**
 * BUG reproduction helper — DO NOT USE in production paths.
 * Old Slack footer: any A/B → Codex*
 */
export function formatBuggyAbFooter(meta: ExecutionMetadata): string {
  if (meta.assignment) return '—— harness=Codex* ——';
  return formatSlackConsoleFooter(meta);
}
