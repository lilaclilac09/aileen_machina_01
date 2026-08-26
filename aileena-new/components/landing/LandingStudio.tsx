'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import './vellum.css';
import './landing-studio.css';

const MARQUEE = [
  'two lines is open',
  'sound lab is learning to mix',
  'book shelf rearranged',
];

const REF_FULL = '/bg_pic/04.jpeg';
const REF_FACE = '/landing/seedance/02-face.jpeg';
const REF_HAND = '/landing/seedance/03-hand.jpeg';
const REF_CHROME = '/landing/seedance/04-chrome.jpeg';
const REF_BACK = '/bg_pic/02.jpeg';
const REF_ZINE = '/zine/clipping-desk.jpg';

const TILT_MAX = 7;

const ASCII_INK = `
  map / notes / sound / shelves
  [aileena]
    > two lines
    > watch / listen
    > tools lab
    > sound lab
    > book room
    > updates
`.trim();

const ASCII_HOUSE = `
      .--------.
     / /______/|
    | | .--. | |
    | | |[]| | |
    | | '--' | /
    | | [][] |/
    | |  __  |
    |_|_|__|_|
      ||  ||
     /__||__\\
`.replace(/^\n/, '').replace(/\n$/, '');

const ASCII_FACES = ['z3', 'z2', 'z1', 'bleed', 'front'] as const;

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

function EmbodiedHero() {
  const stageRef = useRef<HTMLDivElement>(null);

  const resetTilt = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty('--tilt-x', '0deg');
    stage.style.setProperty('--tilt-y', '0deg');
    stage.style.setProperty('--px', '0');
    stage.style.setProperty('--py', '0');
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
    stage.style.setProperty('--px', x.toFixed(3));
    stage.style.setProperty('--py', y.toFixed(3));
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!canTilt()) resetTilt();
    };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(pointer: fine)');
    motion.addEventListener('change', onChange);
    pointer.addEventListener('change', onChange);
    return () => {
      motion.removeEventListener('change', onChange);
      pointer.removeEventListener('change', onChange);
    };
  }, [resetTilt]);

  return (
    <div
      className="hero-object"
      data-landing-hero
      data-reference-hero
      ref={stageRef}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
    >
      <span className="hero-object__shadow" aria-hidden />
      {/* Plate is not transformed — vellum must sample the photos behind it. */}
      <div className="hero-object__plate">
        <div className="hero-layer hero-layer--bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={REF_BACK} alt="" draggable={false} />
        </div>
        <div className="hero-layer hero-layer--base">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={REF_FULL}
            alt="Close-up side profile, eyes closed, ornate chrome mechanical arm against a dark field."
            width={2752}
            height={1536}
            draggable={false}
          />
        </div>
        <div className="hero-layer hero-layer--face" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={REF_FACE} alt="" draggable={false} />
        </div>
        <div className="hero-layer hero-layer--hand" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={REF_HAND} alt="" draggable={false} />
        </div>
        <div className="hero-layer hero-layer--chrome-plate" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={REF_CHROME} alt="" draggable={false} />
        </div>
        <span className="hero-layer hero-layer--chrome" aria-hidden />
        <span className="hero-layer hero-layer--vellum vellum" data-vellum aria-hidden />
        <span className="hero-layer hero-layer--scan" aria-hidden />
        <div className="hero-object__frame" aria-hidden>
          <span className="hero-object__bracket hero-object__bracket--tl" />
          <span className="hero-object__bracket hero-object__bracket--tr" />
          <span className="hero-object__bracket hero-object__bracket--bl" />
          <span className="hero-object__bracket hero-object__bracket--br" />
        </div>
        <span className="hero-object__serial" aria-hidden>
          AILEENA · PLATE 04
        </span>
      </div>
    </div>
  );
}

function AsciiBuilding() {
  return (
    <div className="ascii-building" data-ascii-building aria-hidden="true">
      <div className="ascii-building__scene">
        <span className="ascii-building__shadow" />
        <div className="ascii-building__stack">
          {ASCII_FACES.map((face) => (
            <pre key={face} className={`ascii-building__face ascii-building__face--${face}`}>
              {ASCII_HOUSE}
            </pre>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Landing opening: ink-under-vellum, embodied reference plate,
 * floating ascii building, serial doors.
 * Desk / /doors / kiln stay below. No invented body.
 */
export default function LandingStudio() {
  const marqueeLoop = [...MARQUEE, ...MARQUEE, ...MARQUEE];
  const [active, setActive] = useState(0);

  return (
    <section className="landing-studio" data-landing-studio aria-label="studio landing">
      <div className="landing-bg" aria-hidden>
        <span className="landing-bg__paper" data-bg="paper" />
        <span className="landing-bg__fiber" data-bg="fibers" />
        <pre className="landing-bg__ink" data-bg="black-ink">
          {ASCII_INK}
        </pre>
        <span className="landing-bg__reg" data-bg="red-registration" />
        <span className="landing-bg__bleed" data-bg="ink-bleed" />
        <span className="landing-bg__dark" data-bg="dark-contrast">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={REF_BACK} alt="" draggable={false} />
        </span>
      </div>

      <div className="landing-studio__inner">
        <div className="landing-marquee" data-landing-marquee aria-label="site news">
          <span className="landing-marquee__label" data-ink-bleed>
            new
          </span>
          <div className="landing-marquee__window">
            <div className="landing-marquee__track">
              {marqueeLoop.map((item, i) => (
                <span className="landing-marquee__item" key={`${item}-${i}`}>
                  <em data-ink-bleed>new →</em> {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="landing-hero">
          <span className="landing-ink-veil vellum" data-vellum data-landing-ink-veil aria-hidden />
          <aside className="landing-intro vellum" data-vellum data-ink-bleed>
            <h1>aileena</h1>
            <span className="landing-intro__rule" aria-hidden />
            <p>sitting inside the machine.</p>
          </aside>
          <EmbodiedHero />
          <AsciiBuilding />
          <nav className="landing-term" data-landing-term aria-label="serials index">
            <div className="landing-term__head">
              <span>index</span>
              <span>serials</span>
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
              <span className="landing-volume__spine" aria-hidden />
              <span className="landing-volume__no" data-ink-bleed>
                vol. {item.no}
              </span>
              <span className="landing-volume__title">{item.title}</span>
              <span className="landing-volume__line">{item.line}</span>
            </Link>
          ))}
        </section>

        <Link
          href="/updates"
          className="zine-object"
          data-zine-object
          aria-label="view issue — metal and pages"
        >
          <span className="zine-object__spine" aria-hidden />
          <span className="zine-object__frame">
            <span className="zine-object__bracket zine-object__bracket--tl" aria-hidden />
            <span className="zine-object__bracket zine-object__bracket--br" aria-hidden />
            <span className="zine-object__plate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={REF_ZINE} alt="" draggable={false} />
              <span className="zine-object__scan" aria-hidden />
              <span className="zine-object__veil vellum" data-vellum aria-hidden />
            </span>
            <span className="zine-object__meta">
              <span>issue 01</span>
              <span>metal &amp; pages</span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
