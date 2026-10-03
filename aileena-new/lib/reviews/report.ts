/** Report shape saved by devagrawal09/jev-review. Loose on purpose so older files still open. */

export type ReviewMode = 'changes' | 'codebase';

export type ReviewReport = {
  mode?: ReviewMode;
  scope: string;
  dimensions?: Array<{ key: string; label: string; short: string }>;
  config?: {
    screenThreshold?: number;
    severityMax?: number;
    maxFollowUps?: number;
    maxProfiles?: number;
  };
  screenedFiles: number;
  contextFiles?: string[];
  changedTestFiles?: string[];
  matrix: Array<Record<string, unknown>>;
  followedSignals: number;
  profiles?: Array<Record<string, unknown>>;
  workflow?: {
    screenedCells?: number;
    thresholdSignals?: number;
    profiledFiles?: number;
    followedSignals?: number;
    locatedFindings?: number;
    routedFindings?: number;
  };
  findings: Array<Record<string, unknown>>;
};

export function isReviewReport(value: unknown): value is ReviewReport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  return (
    typeof report.scope === 'string' &&
    typeof report.screenedFiles === 'number' &&
    Array.isArray(report.matrix) &&
    typeof report.followedSignals === 'number' &&
    Array.isArray(report.findings)
  );
}

export function unwrapReport(value: unknown): ReviewReport | null {
  if (isReviewReport(value)) return value;
  if (value && typeof value === 'object' && 'report' in value) {
    const inner = (value as { report: unknown }).report;
    if (isReviewReport(inner)) return inner;
  }
  return null;
}
