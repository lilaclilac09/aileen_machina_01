'use client';

import { surfaceById } from '../../lib/product-surface/graph';
import { reviewRoomPath } from '../../lib/product-surface/lookup';

/**
 * One path from the map: door → list → report.
 * Funnel, matrix, and findings stay on the report. They are not other routes.
 */

const STEPS = reviewRoomPath();
const ORIGIN = surfaceById('reviews-door');
const NODES = [
  ...(ORIGIN ? [{ id: ORIGIN.id, name: ORIGIN.name, kind: ORIGIN.kind }] : []),
  ...STEPS.map((step) => ({
    id: step.to,
    name: step.name,
    kind: surfaceById(step.to)?.kind ?? 'region',
  })),
];

export default function ReviewFlow({ onOpenReport }: { onOpenReport: (regionId: string) => void }) {
  const end = STEPS.at(-1)?.to ?? 'reviews-report';
  return (
    <div data-testid="reviews-flow">
      <p className="section-note">One path. Open shows the report.</p>
      <ol className="flow flow-path">
        {NODES.map((node, index) => (
          <li key={node.id}>
            {index > 0 ? (
              <span className="flow-arrow" aria-hidden="true">
                →
              </span>
            ) : null}
            <div className="flow-step">
              <strong>{index + 1}</strong>
              <span>{node.name}</span>
              <small>{STEPS[index]?.label ?? ''}</small>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="toggle" onClick={() => onOpenReport(end)}>
        Open
      </button>
    </div>
  );
}
