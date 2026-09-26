/**
 * iPhone Duo / foldable pose — layout only.
 *
 * Breakpoints (CSS px, 3× from the physical canvases in the Duo brief):
 *   cover closed  ~466×678   5.4" mini portrait   pose=phone surface=cover
 *   inner portrait ~626×890  7.6" book upright    pose=book  surface=inner
 *   inner landscape ~890×626 default open book    pose=book  surface=inner
 *   tent / seated  2 segments + short height      pose=book  tent=true
 *   classic phone  ~390–430 × 844+                pose=phone surface=phone
 *   desktop        ≥1100                          pose=wide  surface=desk
 *
 * Listeners (subscribe): window resize, visualViewport resize/scroll,
 *   matchMedia(horizontal|vertical-viewport-segments: 2),
 *   navigator.devicePosture change when present.
 * No hinge-angle → audio/pitch. Crease from segments or 16/28px fallback.
 *
 * Viewport Segments / env(viewport-segment-*) : Chromium foldables now;
 *   iOS 27 Duo — progressive enhancement. Safari today: size fallbacks.
 */

import { useSyncExternalStore } from 'react';

export type DuoPose = 'phone' | 'closed' | 'book' | 'wide';
export type ChromeEdge = 'start' | 'end';
export type DuoSurface = 'phone' | 'cover' | 'inner' | 'desk';

export type DuoMetrics = {
  w: number;
  h: number;
  segments: number;
  offsetLeft: number;
};

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
  /** Which glass we think this is. Additive — existing callers ignore it. */
  surface: DuoSurface;
  segments: number;
  /** Half-fold / tent / seated: keep media off the crease. */
  tent: boolean;
};

/** CSS-px presets for /duo theater + verify. Physical ÷ 3. */
export const DUO_PRESETS = {
  phone: { w: 390, h: 844, segments: 1, offsetLeft: 0 },
  phone18: { w: 430, h: 932, segments: 1, offsetLeft: 0 },
  cover: { w: 466, h: 678, segments: 1, offsetLeft: 0 },
  innerPortrait: { w: 626, h: 890, segments: 1, offsetLeft: 0 },
  innerLandscape: { w: 890, h: 626, segments: 1, offsetLeft: 0 },
  tent: { w: 890, h: 500, segments: 2, offsetLeft: 0 },
  closedLandscape: { w: 750, h: 360, segments: 1, offsetLeft: 0 },
  split: { w: 400, h: 800, segments: 1, offsetLeft: 0 },
  ipad: { w: 1024, h: 768, segments: 1, offsetLeft: 0 },
  desktop: { w: 1440, h: 900, segments: 1, offsetLeft: 0 },
} as const;

export function poseFromMetrics(m: DuoMetrics): DuoLayout {
  const { w, h, segments, offsetLeft } = m;
  const chromeEdge: ChromeEdge = w < 720 && offsetLeft < 24 ? 'start' : 'end';
  const aspect = h > 0 ? h / w : 1;

  if (segments >= 2) {
    const tent = h < 560;
    return {
      pose: 'book',
      stack: false,
      book: true,
      wide: false,
      chromeEdge,
      foldGutter: 28,
      surface: 'inner',
      segments,
      tent,
    };
  }
  if (w >= 1100) {
    return {
      pose: 'wide',
      stack: false,
      book: false,
      wide: true,
      chromeEdge: 'end',
      foldGutter: 0,
      surface: 'desk',
      segments: 1,
      tent: false,
    };
  }
  // Duo closed / seated: wider + shorter than a classic iPhone.
  if (w >= 640 && h < 520 && w > h) {
    return {
      pose: 'closed',
      stack: true,
      book: false,
      wide: false,
      chromeEdge,
      foldGutter: 0,
      surface: 'cover',
      segments: 1,
      tent: true,
    };
  }
  if (w >= 720 && h >= 520) {
    return {
      pose: 'book',
      stack: false,
      book: true,
      wide: false,
      chromeEdge,
      foldGutter: 16,
      surface: 'inner',
      segments: 1,
      tent: false,
    };
  }
  // Inner portrait: wider than a phone, passport aspect (~1:1.4).
  if (w >= 580 && h >= 640 && aspect <= 1.65) {
    return {
      pose: 'book',
      stack: false,
      book: true,
      wide: false,
      chromeEdge,
      foldGutter: 16,
      surface: 'inner',
      segments: 1,
      tent: false,
    };
  }
  const cover =
    w >= 400 && w <= 520 && h > w && aspect <= 1.7;
  return {
    pose: 'phone',
    stack: true,
    book: false,
    wide: false,
    chromeEdge,
    foldGutter: 0,
    surface: cover ? 'cover' : 'phone',
    segments: 1,
    tent: false,
  };
}

function segmentCount(): number {
  try {
    if (window.matchMedia('(horizontal-viewport-segments: 2)').matches) return 2;
    if (window.matchMedia('(vertical-viewport-segments: 2)').matches) return 2;
  } catch {
    /* older engines */
  }
  return 1;
}

function readMetrics(): DuoMetrics {
  const vv = window.visualViewport;
  return {
    w: window.innerWidth,
    h: window.innerHeight,
    segments: segmentCount(),
    offsetLeft: vv?.offsetLeft ?? 0,
  };
}

const listeners = new Set<() => void>();
let cached: DuoLayout | null = null;
let watching = false;
const mediaQueries: MediaQueryList[] = [];
let posture: { addEventListener(type: string, fn: () => void): void; removeEventListener(type: string, fn: () => void): void } | null =
  null;

function emit() {
  cached = poseFromMetrics(readMetrics());
  const root = document.documentElement;
  root.dataset.duoPose = cached.pose;
  root.dataset.duoChrome = cached.chromeEdge;
  root.dataset.duoSurface = cached.surface;
  root.dataset.duoTent = cached.tent ? '1' : '0';
  root.style.setProperty('--duo-crease', `${cached.foldGutter}px`);
  listeners.forEach((fn) => fn());
}

function startWatch() {
  if (watching) return;
  watching = true;
  emit();
  window.addEventListener('resize', emit);
  window.addEventListener('orientationchange', emit);
  window.visualViewport?.addEventListener('resize', emit);
  window.visualViewport?.addEventListener('scroll', emit);
  for (const q of [
    '(horizontal-viewport-segments: 2)',
    '(vertical-viewport-segments: 2)',
  ]) {
    try {
      const mql = window.matchMedia(q);
      mql.addEventListener('change', emit);
      mediaQueries.push(mql);
    } catch {
      /* ignore */
    }
  }
  const nav = navigator as Navigator & {
    devicePosture?: {
      addEventListener(type: string, fn: () => void): void;
      removeEventListener(type: string, fn: () => void): void;
    };
  };
  if (nav.devicePosture) {
    posture = nav.devicePosture;
    posture.addEventListener('change', emit);
  }
}

function stopWatch() {
  if (!watching) return;
  watching = false;
  window.removeEventListener('resize', emit);
  window.removeEventListener('orientationchange', emit);
  window.visualViewport?.removeEventListener('resize', emit);
  window.visualViewport?.removeEventListener('scroll', emit);
  for (const mql of mediaQueries) {
    mql.removeEventListener('change', emit);
  }
  mediaQueries.length = 0;
  posture?.removeEventListener('change', emit);
  posture = null;
}

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) startWatch();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) stopWatch();
  };
}

function getSnapshot(): DuoLayout {
  if (!cached) cached = poseFromMetrics(readMetrics());
  return cached;
}

/** SSR first paint matches iPhone stack; desktop hydrates up to wide/book. */
const SERVER_SNAPSHOT: DuoLayout = poseFromMetrics({
  w: 390,
  h: 844,
  segments: 1,
  offsetLeft: 0,
});

function getServerSnapshot(): DuoLayout {
  return SERVER_SNAPSHOT;
}

export function useDuoLayout(): DuoLayout {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
