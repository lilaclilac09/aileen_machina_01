'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

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
}: {
  children: ReactNode;
  id?: string;
  className?: string;
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
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={`snap-section${className ? ' ' + className : ''}`}>
      {children}
    </div>
  );
}
