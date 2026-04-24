'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

export function SnapContainer({ children }: { children: ReactNode }) {
  return (
    <div className="snap-container">
      {children}
    </div>
  );
}

export function SnapSection({ children, id }: { children: ReactNode; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          if (id) document.dispatchEvent(new CustomEvent('section-view', { detail: { id } }));
        } else {
          el.classList.remove('in-view');
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className="snap-section">
      {children}
    </div>
  );
}
