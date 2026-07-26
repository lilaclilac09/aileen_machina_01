'use client';

import { useEffect, useRef, ReactNode } from 'react';

/**
 * Kinfolk-style glide: soft proximity snap, sections can flow taller than
 * the viewport so the page feels continuous — not hard page-locks.
 */
export function SnapContainer({ children }: { children: ReactNode }) {
  return (
    <div className="snap-container flex flex-col">
      {children}
    </div>
  );
}

export function SnapSection({
  children,
  id,
  className,
  /** stage = one cinematic viewport; flow = Kinfolk continuous scroll */
  variant = 'flow',
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  variant?: 'stage' | 'flow';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
        } else {
          el.classList.remove('in-view');
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const variantClass = variant === 'stage' ? 'snap-section--stage' : 'snap-section--flow';

  return (
    <div
      ref={ref}
      id={id}
      className={`snap-section ${variantClass}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
