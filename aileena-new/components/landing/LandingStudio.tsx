'use client';

import { useCallback, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import './landing-studio.css';

const MARQUEE = [
  'two lines is open',
  'sound lab is learning to mix',
  'book shelf rearranged',
];

const ASCII_FULL = `
                 ___________________________
                /                           \\
               |   [·]  [·]  [·]   desk      |
               |  .-----------------------.  |
               |  | aileena               |  |
               |  |  > notes              |  |
               |  |  > sound              |  |
               |  |           (='.'=)     |  |
               |  '-----------------------'  |
               |      ||             ||      |
               |_____/__\\___________/__\\_____|
`.trimEnd();

const ASCII_COMPACT = `
  .----------------------.
 /  paper / notes / mix /
'------------------------'
|  [aileena]             |
|   > two lines          |
|   > sound              |
|          (='.'=)       |
|____||__________||______|
`.trimEnd();

type Volume = {
  no: string;
  door: string;
  title: string;
  line: string;
  href: string;
  status: 'open' | 'new' | 'live';
  cover?: string;
  fragments: string[];
};

const VOLUMES: Volume[] = [
  {
    no: 'vol. 01',
    door: 'two lines',
    title: 'two lines',
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
    line: 'things that train the eye and ear.',
    href: '/blog/watch-listening-shelf',
    status: 'live',
    cover: '/shelf/didion-center.jpg',
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
    line: 'small machines, some useful.',
    href: '/tools',
    status: 'live',
    cover: '/projects/keyshield.png',
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
    line: 'two decks, one export, no fake knobs.',
    href: '/sound',
    status: 'new',
    cover: '/dj-set/assets/covers/love-honey.jpg',
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
    line: 'a shelf with opinions.',
    href: '/updates',
    status: 'live',
    cover: '/dispatch-covers/books-joan-didion-readings.jpg',
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
    line: 'receipts from the machine.',
    href: '/dispatch',
    status: 'live',
    cover: '/dispatch-covers/investing-hero.jpg',
    fragments: [
      'receipts from the machine.',
      'not a changelog, a trail.',
      'if it broke, it gets a line.',
    ],
  },
];

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
      <header className="landing-serials__head">
        <h2>serials</h2>
        <p>small volumes. not a feed.</p>
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
            <span className="landing-volume__spine" aria-hidden />
            {item.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.cover} alt="" draggable={false} className="landing-volume__print" />
            ) : (
              <span className="landing-volume__ruled" aria-hidden />
            )}
            <span className="landing-volume__no">{item.no}</span>
            <span className="landing-volume__title">{item.title}</span>
            <span className="landing-volume__line">{item.line}</span>
          </button>
        ))}
      </div>

      <div className="landing-inside" data-serial-expanded>
        <div className="landing-inside__meta">
          <span>{vol.no}</span>
          <h3>{vol.title}</h3>
          <Link href={vol.href} className="landing-inside__open" data-landing-door={vol.door}>
            open →
          </Link>
        </div>
        <ul className="landing-inside__frags">
          {vol.fragments.map((line, idx) => (
            <li key={line}>
              <span>{String(idx + 1).padStart(2, '0')}</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Experimental landing: tracing paper, one physical issue, serials as doors.
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

        <div className="landing-hero">
          <pre className="landing-ascii landing-ascii--full" aria-hidden>
            {ASCII_FULL}
          </pre>
          <pre className="landing-ascii landing-ascii--compact" aria-hidden>
            {ASCII_COMPACT}
          </pre>
          <p className="sr-only">
            A text drawing of a personal desk machine with a small cat at the console.
          </p>
          <aside className="landing-intro">
            <h1>aileena</h1>
            <span className="landing-intro__rule" aria-hidden />
            <p>investor / tools / notes / sound / small machines</p>
          </aside>
        </div>

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

        <SerialsShelf active={active} onSelect={setActive} />
      </div>
    </section>
  );
}
