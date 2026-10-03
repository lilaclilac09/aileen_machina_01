'use client';

import { reviewsFlow } from '../../lib/product-surface/graph';

/**
 * The review room as a product-surface path.
 * Same nodes the site agent looks up. Buttons are edges.
 */

const FLOW = reviewsFlow();

export default function ReviewFlow({ onOpenReport }: { onOpenReport: (regionId: string) => void }) {
  return (
    <div data-testid="reviews-flow">
      <p className="section-note">
        Unlock, then the list, then the open report. The site agent looks up this path. It does not redraw the room.
      </p>
      <ol className="flow flow-path">
        {FLOW.steps.map((step, index) => (
          <li key={step.id}>
            {index > 0 ? (
              <span className="flow-arrow" aria-hidden="true">
                →
              </span>
            ) : null}
            <button type="button" className="flow-step flow-hit" onClick={() => onOpenReport(step.id)}>
              <strong>{index + 1}</strong>
              <span>{step.name}</span>
              <small>{step.kind}</small>
            </button>
          </li>
        ))}
      </ol>
      <table className="findings">
        <thead>
          <tr>
            <th scope="col">Surface</th>
            <th scope="col">Trigger</th>
            <th scope="col">Code</th>
          </tr>
        </thead>
        <tbody>
          {FLOW.steps.map((step) => (
            <tr key={step.id}>
              <td className="dim">
                <span>{step.name}</span>
                <small>{step.detail}</small>
              </td>
              <td className="owner">{step.trigger}</td>
              <td className="loc">
                <code>
                  <span className="base">{step.file}</span>
                </code>
              </td>
            </tr>
          ))}
          {FLOW.regions.map((region) => (
            <tr key={region.id}>
              <td className="dim">
                <span>{region.name}</span>
                <small>region on Report</small>
              </td>
              <td className="owner">{region.trigger}</td>
              <td className="act comment">
                <button type="button" className="flow-hit" onClick={() => onOpenReport(region.id)}>
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
