'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import './vellum.css';
import './landing-studio.css';
import {
  CrayonArrow,
  CrayonBracket,
  CrayonCircle,
  CrayonDefs,
  CrayonDot,
  CrayonFrame,
  CrayonSitemap,
  CrayonScribble,
  CrayonUnderline,
  CrayonX,
} from './CrayonMarks';

const MARQUEE = [
  'two lines is open',
  'sound lab is learning to mix',
  'book shelf rearranged',
];

const REF_PRINT = '/bg_pic/04.jpeg';
const REF_ZINE = '/zine/clipping-desk.jpg';

const TILT_MAX = 2.4;

const DIAGRAM = `
  proof / plate 04
  map · notes · sound · shelves
`.trim();

const THEMES = ['cyan', 'coral', 'graphite', 'acid', 'violet', 'cobalt'] as const;
type CrayonTheme = (typeof THEMES)[number];

function parseTheme(value: string | null): CrayonTheme {
  return THEMES.includes(value as CrayonTheme) ? (value as CrayonTheme) : 'cyan';
}

const VOLUMES = [
  { no: '01', door: 'two lines', title: 'two lines', line: 'daily residue, kept small.', href: '/daily' },
  { no: '02', door: 'watch / listen', title: 'watch / listen', line: 'eye and ear.', href: '/blog/watch-listening-shelf' },
  { no: '03', door: 'tools', title: 'tools lab', line: 'small machines.', href: '/tools' },
  { no: '04', door: 'sound lab', title: 'sound lab', line: 'two decks, one export.', href: '/sound' },
  { no: '05', door: 'book club', title: 'book room', line: 'a shelf with opinions.', href: '/updates' },
  { no: '06', door: 'updates', title: 'updates', line: 'receipts from the machine.', href: '/dispatch' },
] as const;

function canTilt() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function PrintHero() {
  const stageRef = useRef<HTMLDivElement>(null);

  const resetTilt = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty('--tilt-x', '0deg');
    stage.style.setProperty('--tilt-y', '0deg');
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!canTilt()) return;
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    stage.style.setProperty('--tilt-x', `${(-y * TILT_MAX).toFixed(2)}deg`);
    stage.style.setProperty('--tilt-y', `${(x * TILT_MAX).toFixed(2)}deg`);
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!canTilt()) resetTilt();
    };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change', onChange);
    return () => motion.removeEventListener('change', onChange);
  }, [resetTilt]);

  return (
    <div
      className="print-hero"
      data-landing-hero
      data-reference-hero
      ref={stageRef}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
    >
      <span className="print-hero__shadow" aria-hidden />
      <div className="print-hero__mat">
        <div className="print-hero__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={REF_PRINT}
            alt="Printed side profile, eyes closed, chrome mechanical arm. Plate 04."
            width={2752}
            height={1536}
            draggable={false}
          />
          <span className="print-hero__scan" aria-hidden />
          <span className="print-hero__vellum vellum" data-vellum aria-hidden />
          <span className="print-hero__circle" aria-hidden>
            <CrayonCircle />
          </span>
          <span className="print-hero__hand-mark" aria-hidden>
            <CrayonBracket corner="br" />
          </span>
          <span className="print-hero__arrow" aria-hidden>
            <CrayonArrow />
            <em className="crayon-note">chrome / still</em>
          </span>
          <div className="print-hero__frame" aria-hidden>
            <CrayonBracket corner="tl" />
            <CrayonBracket corner="tr" />
            <CrayonBracket corner="bl" />
            <CrayonBracket corner="br" />
          </div>
        </div>
        <span className="print-hero__caption crayon-note">
          plate 04 · print
        </span>
      </div>
    </div>
  );
}

function CrayonSiteSketch() {
  return (
    <aside className="site-sketch" data-crayon-sketch aria-hidden="true">
      <CrayonSitemap />
      <ol className="site-sketch__notes">
        <li><CrayonDot /> two lines</li>
        <li><CrayonDot /> sound</li>
        <li><CrayonDot /> shelves</li>
      </ol>
      <span className="site-sketch__label crayon-note">site / rooms</span>
    </aside>
  );
}

function LandingStudioInner({ theme }: { theme: CrayonTheme }) {
  const marqueeLoop = [...MARQUEE, ...MARQUEE, ...MARQUEE];
  const [active, setActive] = useState(0);

  return (
    <section
      className="landing-studio"
      data-landing-studio
      data-theme={theme}
      data-landing-theme={theme}
      aria-label="studio landing"
    >
      <CrayonDefs />
      <div className="landing-bg" aria-hidden>
        <span className="landing-bg__paper" data-bg="paper" />
        <span className="landing-bg__fiber" data-bg="fibers" />
        <pre className="landing-bg__ink" data-bg="diagram">
          {DIAGRAM}
        </pre>
        <span className="landing-bg__crayon" data-bg="crayon">
          <CrayonScribble className="landing-bg__scribble" />
          <CrayonX className="landing-bg__x" />
          <CrayonDot className="landing-bg__dot" />
        </span>
        <span className="landing-bg__bleed" data-bg="ink-bleed" />
      </div>

      <div className="landing-studio__inner">
        <div className="landing-marquee" data-landing-marquee aria-label="site news">
          <span className="landing-marquee__label">
            new
            <CrayonUnderline />
          </span>
          <div className="landing-marquee__window">
            <div className="landing-marquee__track">
              {marqueeLoop.map((item, i) => (
                <span className="landing-marquee__item" key={`${item}-${i}`}>
                  <em>new →</em> {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="landing-hero">
          <aside className="landing-intro vellum" data-vellum>
            <h1>
              aileena
              <CrayonUnderline />
            </h1>
            <p>sitting inside the machine.</p>
          </aside>
          <PrintHero />
          <CrayonSiteSketch />
          <nav className="landing-term" data-landing-term aria-label="serials index">
            <div className="landing-term__head">
              <span>index</span>
              <span>rooms</span>
            </div>
            {VOLUMES.map((item, i) => (
              <Link
                key={item.no}
                href={item.href}
                className="landing-term__row"
                data-landing-door={item.door}
                data-active={i === active ? 'true' : 'false'}
                onFocus={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
              >
                <em>{item.no}</em>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        <section className="landing-serials" data-landing-serials aria-label="serials">
          {VOLUMES.map((item) => (
            <Link
              key={item.no}
              href={item.href}
              className="landing-volume"
              data-landing-door={item.door}
            >
              <span className="landing-volume__no">
                vol. {item.no}
                <CrayonUnderline />
              </span>
              <span className="landing-volume__title">
                {item.title}
                {item.no === '01' ? <CrayonScribble className="landing-volume__scribble" /> : null}
              </span>
              <span className="landing-volume__line">{item.line}</span>
              <CrayonArrow className="landing-volume__arrow" />
            </Link>
          ))}
        </section>

        <Link
          href="/updates"
          className="zine-object"
          data-zine-object
          aria-label="view issue — metal and pages"
        >
          <span className="zine-object__frame">
            <CrayonFrame className="zine-object__crayon-frame" />
            <span className="zine-object__plate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={REF_ZINE} alt="" draggable={false} />
              <span className="zine-object__scan" aria-hidden />
              <span className="zine-object__veil vellum" data-vellum aria-hidden />
            </span>
            <span className="zine-object__meta crayon-note">
              issue 01 · metal &amp; pages
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function LandingStudioFromQuery() {
  const params = useSearchParams();
  return <LandingStudioInner theme={parseTheme(params.get('theme'))} />;
}

/**
 * Landing opening: scanned paper, crayon markup, printed plate.
 * Review colors via /?theme=cyan|coral|graphite|acid|violet|cobalt
 * No fake 3D. Desk / /doors / kiln stay below.
 */
export default function LandingStudio() {
  return (
    <Suspense fallback={<LandingStudioInner theme="cyan" />}>
      <LandingStudioFromQuery />
    </Suspense>
  );
}
