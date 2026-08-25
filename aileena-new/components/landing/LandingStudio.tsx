'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import Link from 'next/link';
import './landing-studio.css';

const MARQUEE = [
  'vol. 01 two lines is open',
  'sound lab is learning to mix',
  'all knobs must have consequences',
];

/** Existing mechanical side plate. Do not substitute or invent a body. */
const REFERENCE_HERO = '/bg_pic/04.jpeg';
const TILT_MAX = 7;

type Volume = {
  no: string;
  door: string;
  title: string;
  stack: string[];
  line: string;
  href: string;
  status: 'open' | 'new' | 'live';
  fragments: string[];
};

const VOLUMES: Volume[] = [
  {
    no: 'vol. 01',
    door: 'two lines',
    title: 'two lines',
    stack: ['two', 'lines'],
    line: 'daily residue, kept small.',
    href: '/daily',
    status: 'open',
    fragments: [
      'write less, leave a trace.',
      'a cursor is a heartbeat pretending to be UI.',
      'one sentence is enough if it has teeth.',
    ],
  },
  {
    no: 'vol. 02',
    door: 'watch / listen',
    title: 'watch / listen',
    stack: ['watch', 'listen'],
    line: 'things that train the eye and ear.',
    href: '/blog/watch-listening-shelf',
    status: 'live',
    fragments: [
      'voices as rooms.',
      'watch the frame, not the plot.',
      'taste is trained by repetition.',
    ],
  },
  {
    no: 'vol. 03',
    door: 'tools',
    title: 'tools lab',
    stack: ['tools', 'lab'],
    line: 'small machines, some useful.',
    href: '/tools',
    status: 'live',
    fragments: [
      'not every tool deserves to become a product.',
      'small, ugly, useful.',
      'if it beats doing it manually, it lives.',
    ],
  },
  {
    no: 'vol. 04',
    door: 'sound lab',
    title: 'sound lab',
    stack: ['sound', 'lab'],
    line: 'two decks, one export, no fake knobs.',
    href: '/sound',
    status: 'new',
    fragments: [
      'spotify is a shelf, not a pipe.',
      'all knobs must have consequences.',
      'export or it didn’t happen.',
    ],
  },
  {
    no: 'vol. 05',
    door: 'book club',
    title: 'book room',
    stack: ['book', 'room'],
    line: 'a shelf with opinions.',
    href: '/updates',
    status: 'live',
    fragments: [
      'the shelf is not neutral.',
      'a book spine is a small door.',
      'notes should cut without shouting.',
    ],
  },
  {
    no: 'vol. 06',
    door: 'updates',
    title: 'updates',
    stack: ['updates'],
    line: 'receipts from the machine.',
    href: '/dispatch',
    status: 'live',
    fragments: [
      'receipts from the machine.',
      'not a changelog, a trail.',
      'if it broke, it gets a line.',
    ],
  },
];

function canTilt() {
  if (typeof window === 'undefined') return false;
  return (
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
    stage.style.setProperty('--shift-x', '0px');
    stage.style.setProperty('--shift-y', '0px');
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
    stage.style.setProperty('--shift-x', `${(x * 10).toFixed(2)}px`);
    stage.style.setProperty('--shift-y', `${(y * 8).toFixed(2)}px`);
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
      data-reference-hero
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
    >
      <div className="hero-object__perspective">
        <div className="hero-object__stage" ref={stageRef}>
          <span className="hero-object__shadow" aria-hidden />
          <div className="hero-object__print">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={REFERENCE_HERO}
              alt="Close-up side profile, eyes closed, mechanical chrome arms against a dark field."
              width={2752}
              height={1536}
              draggable={false}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-object__glint"
            src={REFERENCE_HERO}
            alt=""
            aria-hidden
            draggable={false}
          />
          <span className="hero-object__chrome" aria-hidden />
          <span className="hero-object__vellum" aria-hidden />
          <span className="hero-object__scan" aria-hidden />
          <div className="hero-object__frame" aria-hidden>
            <span className="hero-object__bracket hero-object__bracket--tl" />
            <span className="hero-object__bracket hero-object__bracket--tr" />
            <span className="hero-object__bracket hero-object__bracket--bl" />
            <span className="hero-object__bracket hero-object__bracket--br" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SerialsShelf({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (i: number) => void;
}) {
  const vol = VOLUMES[active];

  return (
    <section className="landing-serials" data-landing-serials aria-label="serials">
      <header className="landing-serials__top">
        <div className="landing-serials__title">
          <h2>serials</h2>
          <p>small volumes from the machine. notes, tools, shelves, sound, receipts.</p>
        </div>
        <aside className="landing-serials__note">
          <b>root@aileena:~$</b>
          <span>open volume</span>
          <span>read fragment</span>
          <span>leave before it becomes content</span>
        </aside>
      </header>

      <div className="landing-shelf">
        {VOLUMES.map((item, i) => (
          <button
            key={item.no}
            type="button"
            className="landing-volume"
            data-vol={item.no}
            data-tone={i}
            aria-expanded={i === active}
            onClick={() => onSelect(i)}
          >
            <span className="landing-volume__no">{item.no}</span>
            <h3 className="landing-volume__title">
              {item.stack.map((word, line) => (
                <Fragment key={word}>
                  {line > 0 ? <br /> : null}
                  {word}
                </Fragment>
              ))}
            </h3>
            <p className="landing-volume__line">{item.line}</p>
          </button>
        ))}
      </div>

      <div className="landing-inside" data-serial-expanded>
        <div className="landing-inside__meta">
          <span className="landing-inside__label">{vol.no}</span>
          <h3>{vol.title}</h3>
          <Link href={vol.href} className="landing-inside__open" data-landing-door={vol.door}>
            open →
          </Link>
        </div>
        <ul className="landing-inside__frags">
          {vol.fragments.map((line, idx) => (
            <li key={line}>
              <span>{String(idx + 1).padStart(2, '0')}</span>
              <div>{line}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Experimental landing: tracing paper, embodied reference plate, serials as doors.
 * Desk / /doors / kiln snap sections stay below.
 */
export default function LandingStudio() {
  const marqueeLoop = [...MARQUEE, ...MARQUEE, ...MARQUEE];
  const [active, setActive] = useState(0);

  const onTermKey = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((i) => (i + 1) % VOLUMES.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((i) => (i - 1 + VOLUMES.length) % VOLUMES.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        window.location.assign(VOLUMES[active].href);
      }
    },
    [active],
  );

  return (
    <section className="landing-studio" data-landing-studio aria-label="studio landing">
      <div className="landing-studio__sheets" aria-hidden />
      <div className="landing-studio__grain" aria-hidden />
      <div className="landing-studio__stamps" aria-hidden />
      <div className="landing-studio__scan" aria-hidden />

      <div className="landing-studio__inner">
        <div className="landing-marquee" aria-label="site news">
          <span className="landing-marquee__label">new</span>
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

        <div className="landing-hero landing-hero--embodied">
          <EmbodiedHero />
          <aside className="landing-intro">
            <h1>aileena</h1>
            <span className="landing-intro__rule" aria-hidden />
            <p>sitting inside the machine.</p>
          </aside>
        </div>

        <SerialsShelf active={active} onSelect={setActive} />

        <div className="landing-issue" data-landing-moodboard>
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
                <img src="/zine/clipping-desk.jpg" alt="" draggable={false} />
                <span className="zine-object__scan" aria-hidden />
                <span className="zine-object__vellum" aria-hidden />
              </span>
              <span className="zine-object__meta">
                <span>issue 01</span>
                <span>metal &amp; pages</span>
              </span>
              <span className="zine-object__go">view issue →</span>
            </span>
          </Link>

          <nav
            className="landing-term"
            data-landing-term
            aria-label="serials index"
            tabIndex={0}
            onKeyDown={onTermKey}
          >
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
                <em>{item.no.replace('vol. ', '')}</em>
                <span>{item.title}</span>
                <b>{item.status}</b>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
