/**
 * iPhone Duo / foldable pose for /sound.
 * Web has no hinge layout API — use viewport segments + size.
 * Layout only. Do not drive pitch from hinge angle.
 */

import { useSyncExternalStore } from 'react';

export type DuoPose = 'phone' | 'closed' | 'book' | 'wide';
export type ChromeEdge = 'start' | 'end';

export type DuoLayout = {
  pose: DuoPose;
  /** One-column stack (phone portrait or Duo closed / short). */
  stack: boolean;
  /** Two-up A | xfade | B (open inner / book / landscape tablet). */
  book: boolean;
  /** Desktop club console. */
  wide: boolean;
  /** Split View: chrome on the outer edge of the device. */
  chromeEdge: ChromeEdge;
  /** Extra px to keep hits off the fold curve. */
  foldGutter: number;
};

export function poseFromMetrics(m: {
  w: number;
  h: number;
  segments: number;
  offsetLeft: number;
}): DuoLayout {
  const { w, h, segments, offsetLeft } = m;
  const chromeEdge: ChromeEdge = w < 720 && offsetLeft < 24 ? 'start' : 'end';

  if (segments >= 2) {
    return { pose: 'book', stack: false, book: true, wide: false, chromeEdge, foldGutter: 28 };
  }
  if (w >= 1100) {
    return { pose: 'wide', stack: false, book: false, wide: true, chromeEdge: 'end', foldGutter: 0 };
  }
  // Duo closed: wider + shorter than a classic iPhone.
  if (w >= 640 && h < 520 && w > h) {
    return { pose: 'closed', stack: true, book: false, wide: false, chromeEdge, foldGutter: 0 };
  }
  if (w >= 720 && h >= 520) {
    return { pose: 'book', stack: false, book: true, wide: false, chromeEdge, foldGutter: 16 };
  }
  return { pose: 'phone', stack: true, book: false, wide: false, chromeEdge, foldGutter: 0 };
}

function readMetrics() {
  let segments = 1;
  try {
    if (window.matchMedia('(horizontal-viewport-segments: 2)').matches) segments = 2;
  } catch {
    /* older engines */
  }
  const vv = window.visualViewport;
  return {
    w: window.innerWidth,
    h: window.innerHeight,
    segments,
    offsetLeft: vv?.offsetLeft ?? 0,
  };
}

const listeners = new Set<() => void>();
let cached: DuoLayout | null = null;

function emit() {
  cached = poseFromMetrics(readMetrics());
  listeners.forEach((fn) => fn());
}

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) {
    window.addEventListener('resize', emit);
    window.visualViewport?.addEventListener('resize', emit);
    window.visualViewport?.addEventListener('scroll', emit);
    try {
      window.matchMedia('(horizontal-viewport-segments: 2)').addEventListener('change', emit);
    } catch {
      /* ignore */
    }
  }
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      window.removeEventListener('resize', emit);
      window.visualViewport?.removeEventListener('resize', emit);
      window.visualViewport?.removeEventListener('scroll', emit);
    }
  };
}

function getSnapshot(): DuoLayout {
  if (!cached) cached = poseFromMetrics(readMetrics());
  return cached;
}

function getServerSnapshot(): DuoLayout {
  return poseFromMetrics({ w: 1100, h: 800, segments: 1, offsetLeft: 0 });
}

export function useDuoLayout(): DuoLayout {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
