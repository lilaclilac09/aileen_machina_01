'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  DUO_PRESETS,
  poseFromMetrics,
  useDuoLayout,
  type DuoMetrics,
} from '../lib/duoPose';

type PoseId =
  | 'cover'
  | 'inner-l'
  | 'inner-p'
  | 'tent'
  | 'split'
  | 'phone'
  | 'ipad';

const POSES: { id: PoseId; label: string; metrics: DuoMetrics; stage: string }[] = [
  { id: 'cover', label: 'Cover', metrics: DUO_PRESETS.cover, stage: 'is-cover' },
  { id: 'inner-l', label: 'Inner open', metrics: DUO_PRESETS.innerLandscape, stage: 'is-inner-l' },
  { id: 'inner-p', label: 'Inner portrait', metrics: DUO_PRESETS.innerPortrait, stage: 'is-inner-p' },
  { id: 'tent', label: 'Tent', metrics: DUO_PRESETS.tent, stage: 'is-tent' },
  { id: 'split', label: 'Split View', metrics: DUO_PRESETS.split, stage: 'is-split' },
  { id: 'phone', label: 'iPhone 18', metrics: DUO_PRESETS.phone18, stage: 'is-phone' },
  { id: 'ipad', label: 'iPad', metrics: DUO_PRESETS.ipad, stage: 'is-ipad' },
];

type Light = 'on' | 'wait' | 'off';

type ApiRow = {
  id: string;
  name: string;
  ios: string;
  live: Light;
  note: string;
};

function mediaParses(query: string): boolean {
  try {
    return window.matchMedia(query).media !== 'not all';
  } catch {
    return false;
  }
}

function probeApis(): ApiRow[] {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const css = typeof CSS !== 'undefined' ? CSS.supports.bind(CSS) : () => false;
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { devicePosture?: { type?: string } }) : null;
  const hSeg = mediaParses('(horizontal-viewport-segments: 2)');
  const vSeg = mediaParses('(vertical-viewport-segments: 2)');
  const hMatch = hSeg && window.matchMedia('(horizontal-viewport-segments: 2)').matches;
  const spanning = mediaParses('(spanning: single-fold-vertical)');
  const segmentEnv =
    css('width', 'env(viewport-segment-width 0 0)') ||
    css('width', 'env(viewport-segment-width 0 0, 0px)');

  return [
    {
      id: 'vv',
      name: 'visualViewport + innerWidth',
      ios: 'Safari now',
      live: vv ? 'on' : 'off',
      note: vv ? `${Math.round(vv.width)}×${Math.round(vv.height)}` : 'missing',
    },
    {
      id: 'safe',
      name: 'env(safe-area-inset-*) + viewport-fit=cover',
      ios: 'Safari now · Island / corner chrome',
      live: css('padding-top', 'env(safe-area-inset-top, 0px)') ? 'on' : 'off',
      note: 'Dynamic Island + home indicator',
    },
    {
      id: 'dvh',
      name: 'dvh / svh / lvh',
      ios: 'Safari now',
      live: css('height', '100dvh') ? 'on' : 'off',
      note: 'Replaces 100vh toolbar jump',
    },
    {
      id: 'cq',
      name: '@container queries',
      ios: 'Safari 16+',
      live: css('container-type', 'inline-size') ? 'on' : 'off',
      note: 'Split View / half Safari — not just width breakpoints',
    },
    {
      id: 'clamp',
      name: 'clamp() fluid type',
      ios: 'Safari now',
      live: css('font-size', 'clamp(1rem, 2vw, 1.4rem)') ? 'on' : 'off',
      note: 'Cover → inner scales without a jump',
    },
    {
      id: 'prm',
      name: 'prefers-reduced-motion',
      ios: 'Safari now',
      live: mediaParses('(prefers-reduced-motion: reduce)') ? 'on' : 'off',
      note: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'reduce is on'
        : 'reduce is off',
    },
    {
      id: 'hseg',
      name: '@media (horizontal-viewport-segments: 2)',
      ios: 'iOS 27 Duo expected · Chromium foldables now',
      live: hMatch ? 'on' : hSeg ? 'wait' : 'off',
      note: hMatch ? 'two panes live' : 'fallback: width ≥580 / ≥720',
    },
    {
      id: 'vseg',
      name: '@media (vertical-viewport-segments: 2)',
      ios: 'iOS 27 Duo expected · Chromium now',
      live: vSeg && window.matchMedia('(vertical-viewport-segments: 2)').matches ? 'on' : vSeg ? 'wait' : 'off',
      note: 'Tent / seated stack',
    },
    {
      id: 'segEnv',
      name: 'env(viewport-segment-width 0 0)',
      ios: 'iOS 27 Duo expected · Chromium now',
      live: segmentEnv ? 'on' : 'wait',
      note: 'Crease gutter — 16/28px fallback',
    },
    {
      id: 'posture',
      name: 'navigator.devicePosture',
      ios: 'Unknown on iOS · Chromium origin',
      live: nav?.devicePosture ? 'on' : 'off',
      note: nav?.devicePosture?.type ?? 'no hinge angle on the web',
    },
    {
      id: 'span',
      name: '@media (spanning: single-fold-vertical)',
      ios: 'Not iOS · old Surface Duo / Android',
      live: spanning && window.matchMedia('(spanning: single-fold-vertical)').matches ? 'on' : spanning ? 'wait' : 'off',
      note: 'Keep as extra path, do not replace segments',
    },
    {
      id: 'srcset',
      name: 'img srcset / object-fit: contain',
      ios: 'Safari now',
      live: 'on',
      note: '5.4" + 7.6" — no cover-crop',
    },
    {
      id: 'pencil',
      name: 'Apple Pencil / pointer: fine',
      ios: 'Later · hits stay ≥44px',
      live: mediaParses('(pointer: fine)') && window.matchMedia('(pointer: fine)').matches ? 'on' : 'wait',
      note: 'Hover is extra; thumb path stays first',
    },
  ];
}

function lightLabel(l: Light) {
  if (l === 'on') return 'this browser';
  if (l === 'wait') return 'parses / Duo later';
  return 'not here';
}

export default function DuoLabClient() {
  const live = useDuoLayout();
  const [pose, setPose] = useState<PoseId>('cover');
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [mounted, setMounted] = useState(false);
  const [vv, setVv] = useState({ w: 0, h: 0, offsetLeft: 0, scale: 1 });

  useEffect(() => {
    const sync = () => {
      setMounted(true);
      setRows(probeApis());
      const v = window.visualViewport;
      setVv({
        w: v?.width ?? window.innerWidth,
        h: v?.height ?? window.innerHeight,
        offsetLeft: v?.offsetLeft ?? 0,
        scale: v?.scale ?? 1,
      });
    };
    sync();
    window.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
    };
  }, []);

  const current = POSES.find((p) => p.id === pose) ?? POSES[0];
  const simulated = useMemo(() => poseFromMetrics(current.metrics), [current]);

  return (
    <main
      className="duo-lab mobile-page min-h-[100dvh] pb-[max(2rem,env(safe-area-inset-bottom,0px))]"
      data-testid="duo-lab"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(4.5rem,calc(env(safe-area-inset-top,0px)+4.25rem))] w-full min-w-0">
        <p className="duo-lab-kicker">Duo lab · iOS web</p>
        <h1 className="duo-lab-title mt-3">Which of this ships in Safari.</h1>
        <p className="duo-lab-lead mt-3">
          Cover is a one-handed mini. Inner is a small landscape book. Same
          aspect — fluid grid + container queries, not a second site. Green =
          this browser. Amber = parses here, real crease waits on Duo / Chromium
          foldables.
        </p>

        <section className="mt-10" aria-labelledby="duo-theater">
          <h2 id="duo-theater" className="duo-lab-kicker">
            pose theater
          </h2>
          <p className="duo-lab-lead mt-3">
            Tap a pose. The frame uses container queries — Split View and a
            real Duo both hit the same rules. Crease stripe stays off copy.
          </p>
          <div className="duo-lab-poses mt-5" role="group" aria-label="Duo poses">
            {POSES.map((p) => (
              <button
                key={p.id}
                type="button"
                className="duo-hit duo-pose-shift"
                aria-pressed={pose === p.id}
                data-testid={`duo-pose-${p.id}`}
                onClick={() => setPose(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="duo-lab-kicker mt-6" data-testid="duo-sim-pose">
            sim {current.metrics.w}×{current.metrics.h}
            {current.metrics.segments >= 2 ? ' · 2 segments' : ''} → {simulated.pose} /{' '}
            {simulated.surface}
            {simulated.tent ? ' · tent' : ''}
            {simulated.book ? ' · two-col' : ' · stack'}
          </p>

          <div className="duo-lab-stage-wrap mt-4">
            <div
              className={`duo-lab-stage duo-pose-shift ${current.stage}`}
              data-testid="duo-stage"
              data-pose={pose}
            >
              <div className="duo-lab-crease" aria-hidden />
              <div className="duo-lab-thumb" aria-hidden />
              <div className="duo-lab-inner">
                <div className="duo-lab-hero">
                  {/* next/image not required — lab preview, same asset as home */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/bg_pic/03.jpeg"
                    srcSet="/bg_pic/03.jpeg 800w"
                    sizes="(min-width: 700px) 320px, 60vw"
                    alt=""
                  />
                  <div className="duo-lab-copy">
                    <p className="duo-lab-kicker">opening</p>
                    <p className="duo-lab-type mt-2 font-semibold leading-tight tracking-tight">
                      {simulated.stack
                        ? 'One hand. CTA in the thumb arc.'
                        : simulated.tent
                          ? 'Tent — media left, type right of the fold.'
                          : 'Inner book. Sidebar + main, not a stretched phone.'}
                    </p>
                    <Link href="/" className="duo-lab-cta duo-hit mt-4">
                      machina →
                    </Link>
                  </div>
                </div>
                <div className="duo-lab-cards" aria-label="sample doors">
                  <div className="duo-lab-card">sound · decks</div>
                  <div className="duo-lab-card">daily · two lines</div>
                  <div className="duo-lab-card">doors · directory</div>
                  <div className="duo-lab-card">dispatch · essays</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="duo-live">
          <h2 id="duo-live" className="duo-lab-kicker">
            this window
          </h2>
          <dl className="duo-lab-metrics mt-4" data-testid="duo-live-metrics">
            <div>
              <dt className="text-[rgba(20,17,12,0.4)]">inner</dt>
              <dd>
                {live.pose} · {mounted ? `${Math.round(vv.w)}×${Math.round(vv.h)}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[rgba(20,17,12,0.4)]">surface</dt>
              <dd>
                {live.surface}
                {live.tent ? ' · tent' : ''}
              </dd>
            </div>
            <div>
              <dt className="text-[rgba(20,17,12,0.4)]">visualViewport.scale</dt>
              <dd>{mounted ? vv.scale.toFixed(2) : '—'}</dd>
            </div>
            <div>
              <dt className="text-[rgba(20,17,12,0.4)]">offsetLeft / crease</dt>
              <dd>
                {mounted ? `${Math.round(vv.offsetLeft)} / ${live.foldGutter}px` : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12" aria-labelledby="duo-apis">
          <h2 id="duo-apis" className="duo-lab-kicker">
            iOS web APIs
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="duo-lab-api" data-testid="duo-api-table">
              <thead>
                <tr>
                  <th>API</th>
                  <th>iOS web</th>
                  <th>this browser</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} data-api={row.id} data-live={row.live}>
                    <td>
                      <strong>{row.name}</strong>
                      <div className="text-[rgba(20,17,12,0.45)] mt-1">{row.note}</div>
                    </td>
                    <td>{row.ios}</td>
                    <td>
                      <span className={`duo-lab-light ${row.live}`} aria-hidden />
                      {lightLabel(row.live)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="duo-lab-lead mt-10">
          Preview: resize this tab, or lock the theater. Cover 466×678 · inner
          890×626 · tent 890×500 with a 28px crease. Home stay cinematic —
          this page is the lab.
        </p>
      </div>
    </main>
  );
}
