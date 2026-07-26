'use client';

import { useCallback, useEffect, useState } from 'react';

export type CoverflowSettings = {
  gap: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  translateX: number;
  translateY: number;
  depth: number;
  perspective: number;
  opacityMin: number;
  scaleMin: number;
  stiffness: number;
  damping: number;
  mass: number;
  velocityE: number;
};

export const COVERFLOW_DEFAULTS: CoverflowSettings = {
  gap: 42,
  rotateX: 0,
  rotateY: 65,
  rotateZ: 0,
  translateX: 0,
  translateY: 0,
  depth: 40,
  perspective: 1200,
  opacityMin: 0,
  scaleMin: 0.6,
  stiffness: 220,
  damping: 26,
  mass: 1,
  velocityE: 0.6,
};

export const COVERFLOW_RANGES: Record<keyof CoverflowSettings, { min: number; max: number; step: number }> = {
  gap: { min: 0, max: 120, step: 1 },
  rotateX: { min: -45, max: 45, step: 1 },
  rotateY: { min: 0, max: 90, step: 1 },
  rotateZ: { min: -15, max: 15, step: 0.5 },
  translateX: { min: -50, max: 50, step: 1 },
  translateY: { min: -50, max: 50, step: 1 },
  depth: { min: 0, max: 300, step: 1 },
  perspective: { min: 600, max: 2400, step: 25 },
  opacityMin: { min: 0, max: 1, step: 0.01 },
  scaleMin: { min: 0.3, max: 1, step: 0.01 },
  stiffness: { min: 50, max: 500, step: 5 },
  damping: { min: 5, max: 60, step: 1 },
  mass: { min: 0.1, max: 3, step: 0.05 },
  velocityE: { min: 0, max: 2, step: 0.05 },
};

const STORAGE_KEY = 'aileena-coverflow-settings-v1';
const PANEL_OPEN_KEY = 'aileena-coverflow-panel-open-v1';

const MOBILE_MAX_PX = 767;

function readStoredSettings(): CoverflowSettings | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CoverflowSettings>;
    return { ...COVERFLOW_DEFAULTS, ...parsed };
  } catch {
    return null;
  }
}

function writeStoredSettings(next: CoverflowSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — keep in-memory only */
  }
}

export function useCoverflowSettings() {
  const [settings, setSettings] = useState<CoverflowSettings>(COVERFLOW_DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     First-render hydration from localStorage. Server renders defaults;
     client upgrades to stored values post-mount so SSR markup matches. */
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`);
    setIsMobile(mq.matches);

    const stored = readStoredSettings();
    if (stored) setSettings(stored);

    // Explicit user preference wins; otherwise keep the tuner closed.
    const open = window.localStorage.getItem(PANEL_OPEN_KEY);
    if (open === '0') setPanelOpen(false);
    else if (open === '1') setPanelOpen(true);

    setHydrated(true);

    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);

    // Re-apply if another tab writes settings (same-origin).
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const again = readStoredSettings();
      if (again) setSettings(again);
      else setSettings(COVERFLOW_DEFAULTS);
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const update = useCallback(<K extends keyof CoverflowSettings>(key: K, value: CoverflowSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      writeStoredSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(COVERFLOW_DEFAULTS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PANEL_OPEN_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { settings, update, reset, panelOpen, togglePanel, hydrated, isMobile };
}
