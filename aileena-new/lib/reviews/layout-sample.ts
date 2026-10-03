import type { ReviewReport } from './report';
import type { ReviewSummary } from './store';

/** On-screen layout only. Not a saved jev-review run. */
export const LAYOUT_SAVED_AT = '2026-10-03T03:00:00.000Z';

const DIMENSIONS = [
  { key: 'correctness', label: 'Correctness', short: 'Corr' },
  { key: 'security', label: 'Security', short: 'Sec' },
  { key: 'reliability', label: 'Reliability', short: 'Rel' },
  { key: 'compatibility', label: 'Compatibility', short: 'Compat' },
  { key: 'testGap', label: 'Test gap', short: 'Tests' },
];

function sample(scope: string, action: 'comment' | 'request_changes'): ReviewReport {
  return {
    mode: 'changes',
    scope,
    dimensions: DIMENSIONS,
    screenedFiles: 2,
    contextFiles: ['app/reviews/page.tsx'],
    matrix: [
      {
        file: 'app/reviews/page.tsx',
        correctness: 0.82,
        security: 0.21,
        reliability: 0.44,
        compatibility: 0.12,
        testGap: 0.73,
      },
      {
        file: 'components/reviews/JevDashboard.tsx',
        correctness: 0.18,
        security: 0.08,
        reliability: 0.22,
        compatibility: 0.05,
        testGap: 0.31,
      },
    ],
    followedSignals: 2,
    profiles: [
      {
        file: 'app/reviews/page.tsx',
        category: 'owner door',
        categoryConfidence: 0.8,
        reviewPriority: 2.4,
        reviewPriorityConfidence: 0.7,
      },
    ],
    workflow: {
      screenedCells: 10,
      thresholdSignals: 2,
      profiledFiles: 1,
      followedSignals: 2,
      locatedFindings: 1,
      routedFindings: action === 'request_changes' ? 1 : 0,
    },
    findings: [
      {
        file: 'app/reviews/page.tsx',
        dimension: 'correctness',
        probability: 0.82,
        line: 24,
        locationConfidence: 0.9,
        mechanism: 'owner gate',
        mechanismConfidence: 0.8,
        severity: action === 'request_changes' ? 2.6 : 1.2,
        severityConfidence: 0.75,
        owner: 'security',
        ownerConfidence: 0.6,
        action,
      },
    ],
  };
}

export const LAYOUT_REPORTS: Array<{ summary: ReviewSummary; report: ReviewReport }> = [
  {
    summary: {
      id: 'layout-checkout',
      savedAt: LAYOUT_SAVED_AT,
      scope: 'layout/checkout',
      mode: 'changes',
      findings: 1,
      screenedFiles: 2,
      requestChanges: 1,
      writable: false,
    },
    report: sample('layout/checkout', 'request_changes'),
  },
  {
    summary: {
      id: 'layout-door',
      savedAt: LAYOUT_SAVED_AT,
      scope: 'layout/door',
      mode: 'changes',
      findings: 1,
      screenedFiles: 2,
      requestChanges: 0,
      writable: false,
    },
    report: sample('layout/door', 'comment'),
  },
];

export function isLayoutSampleId(id: string): boolean {
  return id.startsWith('layout-');
}
