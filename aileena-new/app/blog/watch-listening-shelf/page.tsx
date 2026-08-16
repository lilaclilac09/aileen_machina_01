'use client';

import Image from 'next/image';
import Link from 'next/link';
import ArchivePage from '../../_archive/ArchivePage';

const PODCAST_RECS = [
  {
    title: 'Fashion Neurosis with Bella Freud',
    shelfTitle: 'Fashion Neurosis',
    label: 'podcast',
    meta: 'Kate Moss episode',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
    body: 'Taste as confession.',
  },
  {
    title: 'Do You Read Her',
    shelfTitle: 'Do You Read Her',
    label: 'podcast',
    meta: 'women / reading',
    href: 'https://open.spotify.com/episode/0cx1oBoJEwfaKGVbITcD5K',
    body: 'A private canon of women.',
  },
];

const DOCUMENTARY_RECS = [
  {
    title: 'Joan Didion: The Center Will Not Hold',
    shelfTitle: 'Joan Didion',
    year: '2018',
    label: 'writer / witness',
    href: 'https://www.rottentomatoes.com/m/joan_didion_the_center_will_not_hold',
    image: '/shelf/didion-center.jpg',
    note: 'a sentence holding.',
    body: 'a sentence holding.',
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    shelfTitle: 'David Hockney',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image: '/shelf/hockney-ra.jpg',
    note: 'looking slowly.',
    body: 'looking slowly.',
  },
  {
    title: 'A Bigger Splash',
    shelfTitle: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: '/shelf/bigger-splash.jpg',
    note: 'staged intimacy.',
    body: 'staged intimacy.',
  },
];

const FILM_RECS = [
  {
    title: 'Blue Is the Warmest Color',
    shelfTitle: 'Blue Is the Warmest Color',
    year: '2013',
    label: 'Léa · intimacy',
    href: 'https://en.wikipedia.org/wiki/Blue_Is_the_Warmest_Colour',
    image: '/shelf/blue-is-the-warmest-color.jpg',
    note: 'honesty in the body.',
    body: 'honesty in the body.',
  },
  {
    title: 'The French Dispatch',
    shelfTitle: 'The French Dispatch',
    year: '2021',
    label: 'magazine life · Léa',
    href: 'https://en.wikipedia.org/wiki/The_French_Dispatch',
    image: '/shelf/french-dispatch.jpg',
    note: 'city as set.',
    body: 'city as set.',
  },
  {
    title: 'Spectre / No Time to Die',
    shelfTitle: 'Bond arc',
    year: '2015–21',
    label: 'Bond girl arc',
    href: 'https://en.wikipedia.org/wiki/No_Time_to_Die',
    image: '/shelf/spectre.jpg',
    note: 'finish the arc.',
    body: 'finish the arc.',
  },
  {
    title: 'The Crown',
    shelfTitle: 'The Crown',
    year: 'series',
    label: 'British public life',
    href: 'https://en.wikipedia.org/wiki/The_Crown_(TV_series)',
    image: '/shelf/the-crown.jpg',
    note: 'power worn on a body.',
    body: 'power worn on a body.',
  },
  {
    title: 'The Capture',
    shelfTitle: 'The Capture',
    year: 'series',
    label: 'new untrust',
    href: 'https://en.wikipedia.org/wiki/The_Capture_(TV_series)',
    image: '/shelf/the-capture.jpg',
    note: 'a world you cannot trust.',
    body: 'a world you cannot trust.',
  },
  {
    title: 'Bodyguard',
    shelfTitle: 'Bodyguard',
    year: '2018',
    label: 'BBC thriller',
    href: 'https://en.wikipedia.org/wiki/Bodyguard_(British_TV_series)',
    image: '/shelf/bodyguard.jpg',
    note: 'same room, hotter pulse.',
    body: 'same room, hotter pulse.',
  },
  {
    title: 'Miss Sloane',
    shelfTitle: 'Miss Sloane',
    year: '2016',
    label: 'lobby · power',
    href: 'https://en.wikipedia.org/wiki/Miss_Sloane',
    image: '/shelf/miss-sloane.jpg',
    note: 'strategy as bloodsport.',
    body: 'strategy as bloodsport.',
  },
];

const WATCH_ITEMS = [...DOCUMENTARY_RECS, ...FILM_RECS];

const EURO_LIFE_GUIDE = [
  { title: 'Urban roam, not tourism', label: 'walk', body: 'Conversation over landmarks.' },
  { title: 'See in black and white', label: 'eye', body: 'Less color, more decision.' },
  { title: 'Language scraps', label: 'FR / IT', body: 'Enough to catch 20% of dialogue.' },
  { title: 'Wardrobe as Bond cool', label: 'cut', body: 'Fewer colors, better cut.' },
  { title: 'Slow museum', label: 'one room', body: 'Not the whole building.' },
  { title: 'Table as ritual', label: 'kitchen', body: 'An ordinary meal, staged.' },
];

const LIFESTYLE_RECS = [
  { title: 'Urban drift diary', label: 'weekly', body: 'Walk. Note light. Not a trip.' },
  { title: 'One letter or collage page', label: 'paper', body: 'One page a week.' },
  { title: 'Soundtrack as room', label: 'listen', body: 'Closer to cinema than algorithm pop.' },
  { title: 'Watch in pairs, not piles', label: 'pace', body: 'Texture over binge.' },
];

const CHANNEL_RECS = [
  {
    title: 'Asymmetrical Bets',
    shelfTitle: 'Asymmetrical Bets',
    label: 'markets',
    href: 'https://asymmetricalbets.substack.com',
    body: 'Narrative-driven market reading.',
  },
  {
    title: 'SemiAnalysis',
    shelfTitle: 'SemiAnalysis',
    label: 'semis',
    href: 'https://www.semianalysis.com',
    body: 'Chips, clusters, bottlenecks.',
  },
  {
    title: 'Branch Education',
    shelfTitle: 'Branch Education',
    label: 'YouTube',
    href: '/blog/semi-basics-review',
    body: 'Cache, PCB, GPU — five-minute review.',
  },
  {
    title: 'TPU & CPO (high-signal YouTube)',
    shelfTitle: 'TPU & CPO',
    label: 'video',
    href: '/blog/semi-watch-tpu-cpo',
    body: 'Ironwood, systolic array, CPO.',
  },
  {
    title: 'Software YouTube — MCP',
    shelfTitle: 'MCP',
    label: 'agents',
    href: '/blog/software-watch',
    body: 'What MCP is, then MCP vs API.',
  },
  {
    title: 'Post-Training Path',
    shelfTitle: 'Post-Training Path',
    label: 'SFT',
    href: '/blog/post-training-path',
    body: 'Rust, CLI, holdout, LoRA.',
  },
  {
    title: 'Know Good Code. Own the Repo.',
    shelfTitle: 'Own the Repo',
    label: 'taste',
    href: '/blog/own-your-stack',
    body: 'Own the repo before you build.',
  },
];

function ShelfHref({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export default function WatchListeningShelfArticle() {
  return (
    <ArchivePage
      room="shelf"
      date="2026.07.12"
      title="watch · listening shelf"
      dek="covers first."
    >
      <section className="arc-section" aria-labelledby="poster-shelf-label">
        <p className="arc-kicker" id="poster-shelf-label">
          watch
        </p>
        <div className="arc-posters">
          {WATCH_ITEMS.map((item) => (
            <a
              key={item.title}
              className="arc-poster"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="arc-poster-frame">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 820px) 140px, 108px"
                  style={{ objectFit: 'contain' }}
                />
              </span>
              <span className="arc-poster-title">{item.shelfTitle}</span>
              <span className="arc-poster-meta">{item.year}</span>
              <span className="arc-poster-note">{item.note}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="arc-section" id="podcasts" aria-labelledby="listen-recs">
        <p className="arc-kicker" id="listen-recs">
          listen
        </p>
        <div className="arc-cassettes">
          {PODCAST_RECS.map((item) => (
            <ShelfHref key={item.title} href={item.href} className="arc-cassette">
              <span className="arc-cassette-body" aria-hidden>
                <span className="arc-cassette-window">
                  <span className="arc-cassette-reel" />
                  <span className="arc-cassette-reel" />
                </span>
              </span>
              <span>
                <span className="arc-cassette-title">{item.shelfTitle}</span>
                <span className="arc-cassette-meta">{item.meta}</span>
                <span className="arc-cassette-note">{item.body}</span>
              </span>
            </ShelfHref>
          ))}
        </div>
      </section>

      <section className="arc-section" id="channels" aria-labelledby="channel-recs">
        <p className="arc-kicker" id="channel-recs">
          read next
        </p>
        <ul className="arc-list">
          {CHANNEL_RECS.map((item) => (
            <li key={item.title} className="arc-item">
              <ShelfHref href={item.href} className="arc-item-title">
                {item.shelfTitle}
              </ShelfHref>
              <span className="arc-item-meta">{item.label}</span>
              <p className="arc-item-note">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="arc-section" id="euro-life" aria-labelledby="shelf-tips-label">
        <span id="lifestyle" className="shelf-hash-alias" />
        <span id="films" className="shelf-hash-alias" />
        <p className="arc-kicker" id="shelf-tips-label">
          stolen from the shelf
        </p>
        <ul className="arc-list">
          {[...EURO_LIFE_GUIDE, ...LIFESTYLE_RECS].map((item) => (
            <li key={item.title} className="arc-item">
              <span className="arc-item-title">{item.title}</span>
              <span className="arc-item-meta">{item.label}</span>
              <p className="arc-item-note">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </ArchivePage>
  );
}
