'use client';

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

const PINS: Array<{
  src?: string;
  alt: string;
  caption?: string;
  href?: string;
  object?: 'note' | 'cassette' | 'window' | 'spine';
}> = [
  { src: '/pate-glass.jpg', alt: 'kiln glass', caption: 'kiln', href: '/blog/pate-de-verre' },
  { src: '/zine/clipping-desk.jpg', alt: 'zine clipping', href: '/updates' },
  { src: '/shelf/didion-center.jpg', alt: 'Joan Didion documentary still', caption: 'witness', href: '/blog/watch-listening-shelf' },
  { src: '/dispatch-covers/books-joan-didion-readings.jpg', alt: 'Didion readings', caption: 'pages', href: '/updates' },
  { src: '/dj-set/assets/covers/love-honey.jpg', alt: 'love honey record', caption: 'mix', href: '/sound' },
  { src: '/projects/keyshield.png', alt: 'keyshield board', caption: 'board', href: '/tools' },
  { src: '/shelf/french-dispatch.jpg', alt: 'The French Dispatch', href: '/blog/watch-listening-shelf' },
  { src: '/bg_pic/03.jpeg', alt: 'machina portrait', href: '/' },
];

const DOORS: Array<{
  href: string;
  name: string;
  kind: 'note' | 'cassette' | 'photo' | 'window' | 'spine' | 'scrap';
  src?: string;
  alt?: string;
}> = [
  { href: '/daily', name: 'two lines', kind: 'note' },
  {
    href: '/sound',
    name: 'sound lab',
    kind: 'cassette',
    src: '/dj-set/assets/covers/love-honey.jpg',
    alt: 'sound lab cassette',
  },
  {
    href: '/updates',
    name: 'book club',
    kind: 'spine',
  },
  {
    href: '/blog/watch-listening-shelf',
    name: 'watch / listen',
    kind: 'photo',
    src: '/shelf/french-dispatch.jpg',
    alt: 'watch and listen shelf',
  },
  {
    href: '/tools',
    name: 'tools',
    kind: 'scrap',
    src: '/projects/keyshield.png',
    alt: 'tools lab',
  },
  {
    href: '/dispatch',
    name: 'updates',
    kind: 'window',
    src: '/dispatch-covers/investing-hero.jpg',
    alt: 'dispatch updates',
  },
];

function PinFace({
  src,
  alt,
  caption,
  object,
}: {
  src?: string;
  alt: string;
  caption?: string;
  object?: 'note' | 'cassette' | 'window' | 'spine';
}) {
  if (object === 'note') {
    return (
      <span className="landing-object landing-object--note" aria-hidden>
        two lines
      </span>
    );
  }
  if (object === 'spine') {
    return <span className="landing-object landing-object--spine">Didion</span>;
  }
  if (!src) return null;
  return (
    <span className="landing-object">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} />
      {caption ? <span data-cap>{caption}</span> : null}
    </span>
  );
}

function DoorFace({ door }: { door: (typeof DOORS)[number] }) {
  if (door.kind === 'note') {
    return (
      <span className="landing-object landing-object--note landing-door__face" aria-hidden>
        one line
        <br />
        two lines
      </span>
    );
  }
  if (door.kind === 'spine') {
    return (
      <span className="landing-object landing-object--spine landing-door__face">
        book club
      </span>
    );
  }
  if (door.kind === 'cassette' && door.src) {
    return (
      <span className="landing-object landing-object--cassette landing-door__face">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={door.src} alt="" draggable={false} />
        <span>tape</span>
      </span>
    );
  }
  if (door.kind === 'window' && door.src) {
    return (
      <span className="landing-object landing-object--window landing-door__face">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={door.src} alt="" draggable={false} />
        <span>desk</span>
      </span>
    );
  }
  if (door.src) {
    return (
      <span className="landing-door__face">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={door.src} alt="" draggable={false} />
      </span>
    );
  }
  return null;
}

/**
 * Experimental landing opening: tracing-paper studio, not a site rewrite.
 * Existing snap sections (desk / doors directory / kiln) stay below.
 */
export default function LandingStudio() {
  const marqueeLoop = [...MARQUEE, ...MARQUEE, ...MARQUEE];

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
          <pre
            className="landing-ascii landing-ascii--full"
            aria-hidden
          >
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

        <div className="landing-moodboard" aria-label="moodboard">
          {PINS.map((pin) => {
            const body = (
              <PinFace
                src={pin.src}
                alt={pin.alt}
                caption={pin.caption}
                object={pin.object}
              />
            );
            if (pin.href === '/') {
              return (
                <button
                  key={pin.alt}
                  type="button"
                  className="landing-pin"
                  aria-label="Open Machina console"
                  onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
                >
                  {body}
                </button>
              );
            }
            return (
              <Link
                key={pin.alt}
                href={pin.href ?? '/doors'}
                className="landing-pin"
              >
                {body}
              </Link>
            );
          })}
        </div>

        <nav className="landing-doors" aria-label="doors">
          {DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="landing-door"
              data-landing-door={door.name}
              aria-label={door.name}
            >
              <DoorFace door={door} />
              <span className="landing-door__name">{door.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
