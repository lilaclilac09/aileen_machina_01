'use client';

import Link from 'next/link';
import type { SiteStep } from '../lib/product-surface/lookup';

/** Clickable path. The console uses the map instead of guessing a room. */
export default function SiteMapSteps({ steps }: { steps: SiteStep[] }) {
  if (!steps.length) return null;
  return (
    <div className="flex gap-3 mt-1 mb-2" data-testid="site-map-steps">
      <span className="text-[#00a89d]/40 select-none leading-[1.7]">│</span>
      <ol className="flex flex-wrap gap-1.5">
        {steps.map((step, i) => {
          const label = `${i + 1}. ${step.name}`;
          const className =
            'inline-flex items-center text-[0.72rem] leading-none tracking-wide text-[#007d75] border border-[#00a89d]/35 rounded-full px-2 py-1 hover:bg-[#00a89d]/10';
          if (!step.href || step.to === 'console') {
            return (
              <li key={`${step.to}-${i}`}>
                <span className={className} title={step.label}>
                  {label}
                </span>
              </li>
            );
          }
          const external = step.href.startsWith('http');
          return (
            <li key={`${step.to}-${i}`}>
              {external ? (
                <a href={step.href} className={className} title={step.label}>
                  {label}
                </a>
              ) : (
                <Link href={step.href} className={className} title={step.label}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
