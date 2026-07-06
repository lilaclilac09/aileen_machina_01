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

export function useCoverflowSettings() {
  const [settings, setSettings] = useState<CoverflowSettings>(COVERFLOW_DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     First-render hydration from localStorage. The setState calls here
     are intentional and the standard React pattern for client-only
     state that must not differ from the server-rendered snapshot —
     server renders with defaults, client upgrades to stored values
     post-mount. */
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`);
    const mobile = mq.matches;
    setIsMobile(mobile);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CoverflowSettings>;
        setSettings({ ...COVERFLOW_DEFAULTS, ...parsed });
      }
      // Explicit user preference wins; otherwise keep the tuner closed.
      // The public archive should show the cards first; the panel is an
      // optional control, not the main composition.
      const open = window.localStorage.getItem(PANEL_OPEN_KEY);
      if (open === '0') setPanelOpen(false);
      else if (open === '1') setPanelOpen(true);
    } catch {
      /* localStorage unavailable — keep defaults */
    }
    setHydrated(true);

    // Keep isMobile reactive to rotation / resize so the panel can
    // switch between right-sidebar and bottom-drawer layouts live.
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const update = useCallback(<K extends keyof CoverflowSettings>(key: K, value: CoverflowSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
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
