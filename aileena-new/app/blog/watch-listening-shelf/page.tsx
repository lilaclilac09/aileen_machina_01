'use client';

import Image from 'next/image';
import Link from 'next/link';
import { slugify } from '../../_archive/ArchiveIndex';
import ArchivePage from '../../_archive/ArchivePage';

const PODCAST_RECS = [
  {
    title: 'Fashion Neurosis with Bella Freud',
    shelfTitle: 'Fashion Neurosis',
    label: 'podcast',
    meta: 'Kate Moss episode',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
    body: 'A velvet couch, fashion as anxiety, and taste as confession rather than certainty.',
    why: 'A velvet couch, fashion as anxiety, and taste as confession rather than certainty.',
    tags: ['voice', 'taste', 'anxiety'],
    featured: true,
  },
  {
    title: 'Do You Read Her',
    shelfTitle: 'Do You Read Her',
    label: 'podcast',
    meta: 'episode · women reading women',
    href: 'https://open.spotify.com/episode/0cx1oBoJEwfaKGVbITcD5K',
    body: 'Private canon, women reading women, the voice as a room.',
    signal: 'Private canon, women reading women, the voice as a room.',
    tags: ['voice', 'reading', 'women'],
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
    note: 'Watch the sentence hold together while the world refuses to.',
    body: 'Watch the sentence hold together while the world refuses to.',
    tags: ['seeing', 'women'],
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    shelfTitle: 'David Hockney',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image: '/shelf/hockney-ra.jpg',
    note: 'Colour, scale, and the pleasure of looking slowly.',
    body: 'Colour, scale, and the pleasure of looking slowly.',
    tags: ['colour', 'seeing', 'studio'],
  },
  {
    title: 'A Bigger Splash',
    shelfTitle: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    note: 'Staged intimacy; the pool as a pose that will not stay still.',
    body: 'Staged intimacy; the pool as a pose that will not stay still.',
    tags: ['seeing'],
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
    note: 'Honesty in the body — looking that does not flinch.',
    body: 'Honesty in the body — looking that does not flinch.',
    tags: ['seeing'],
  },
  {
    title: 'The French Dispatch',
    shelfTitle: 'The French Dispatch',
    year: '2021',
    label: 'magazine life · Léa',
    href: 'https://en.wikipedia.org/wiki/The_French_Dispatch',
    note: 'The city dressed as a magazine; looking as layout.',
    body: 'The city dressed as a magazine; looking as layout.',
    tags: ['colour'],
  },
  {
    title: 'Spectre / No Time to Die',
    shelfTitle: 'Bond arc',
    year: '2015–21',
    label: 'Bond girl arc',
    href: 'https://en.wikipedia.org/wiki/No_Time_to_Die',
    note: 'Finish the arc. Clothes as the second script.',
    body: 'Finish the arc. Clothes as the second script.',
  },
  {
    title: 'The Crown',
    shelfTitle: 'The Crown',
    year: 'series',
    label: 'British public life',
    href: 'https://en.wikipedia.org/wiki/The_Crown_(TV_series)',
    note: 'Power worn until the body is the office.',
    body: 'Power worn until the body is the office.',
  },
  {
    title: 'The Capture',
    shelfTitle: 'The Capture',
    year: 'series',
    label: 'new untrust',
    href: 'https://en.wikipedia.org/wiki/The_Capture_(TV_series)',
    note: 'A world you cannot trust, framed as evidence.',
    body: 'A world you cannot trust, framed as evidence.',
  },
  {
    title: 'Bodyguard',
    shelfTitle: 'Bodyguard',
    year: '2018',
    label: 'BBC thriller',
    href: 'https://en.wikipedia.org/wiki/Bodyguard_(British_TV_series)',
    note: 'Same rooms, hotter pulse. Proximity as plot.',
    body: 'Same rooms, hotter pulse. Proximity as plot.',
  },
  {
    title: 'Miss Sloane',
    shelfTitle: 'Miss Sloane',
    year: '2016',
    label: 'lobby · power',
    href: 'https://en.wikipedia.org/wiki/Miss_Sloane',
    note: 'Strategy as bloodsport. The voice does the cutting.',
    body: 'Strategy as bloodsport. The voice does the cutting.',
    tags: ['voice'],
  },
];

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

const RAIL = [
  { href: '#featured-listen', label: 'featured listen' },
  { href: '#podcasts', label: 'listen' },
  { href: '#watch', label: 'watch' },
  { href: '#channels', label: 'read' },
  { href: '#euro-life', label: 'living' },
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

function Tags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return <p className="shelf-tags">{tags.join(' / ')}</p>;
}

function WatchCard({
  title,
  shelfTitle,
  year,
  href,
  frame,
  image,
  tags,
}: {
  title: string;
  shelfTitle: string;
  year: string;
  href: string;
  frame: string;
  image?: string;
  tags?: string[];
}) {
  return (
    <ShelfHref href={href} className="shelf-watch-card">
      <article id={slugify(shelfTitle)} className="shelf-watch-inner">
        {image ? (
          <span className="shelf-watch-thumb">
            <Image src={image} alt="" fill sizes="88px" style={{ objectFit: 'contain' }} />
          </span>
        ) : null}
        <div className="shelf-watch-copy">
          <header className="shelf-card-head">
            <p className="shelf-card-kicker">watch</p>
            <p className="shelf-card-meta">{year}</p>
          </header>
          <h3 className="shelf-card-title">{shelfTitle}</h3>
          <p className="shelf-card-source">{title}</p>
          <dl className="shelf-fields">
            <div>
              <dt>frame</dt>
              <dd>{frame}</dd>
            </div>
          </dl>
          <Tags tags={tags} />
        </div>
      </article>
    </ShelfHref>
  );
}

export default function WatchListeningShelfArticle() {
  const featured = PODCAST_RECS.find((item) => item.featured) ?? PODCAST_RECS[0];
  const listens = PODCAST_RECS.filter((item) => !item.featured);

  return (
    <ArchivePage
      room="shelf"
      date="2026.07.12"
      title="watch / listening shelf"
      dek="things that tune the eye and ear"
    >
      <div className="arc-stage shelf-stage">
        <div className="arc-stage-main">
          <p className="arc-lede">
            a shelf for things that recalibrate taste: voices, films, interviews, and small
            obsessions.
          </p>
          <p className="shelf-intro-note">
            not a recommendation list. a record of what trains the eye and ear.
          </p>

          <section
            id="featured-listen"
            className="arc-section shelf-section"
            aria-labelledby="featured-listen-label"
          >
            <p className="arc-kicker" id="featured-listen-label">
              featured listen
            </p>
            <ShelfHref href={featured.href} className="shelf-feature">
              <article id={slugify(featured.shelfTitle)} className="shelf-feature-inner">
                <header className="shelf-card-head">
                  <p className="shelf-card-kicker">listen</p>
                  <p className="shelf-card-meta">{featured.meta}</p>
                </header>
                <h2 className="shelf-feature-title">{featured.shelfTitle}</h2>
                <p className="shelf-card-source">{featured.title}</p>
                <dl className="shelf-fields">
                  <div>
                    <dt>why it stays</dt>
                    <dd>{featured.why}</dd>
                  </div>
                </dl>
                <Tags tags={featured.tags} />
                <span className="shelf-cta">open ↗</span>
              </article>
            </ShelfHref>
          </section>

          <section
            id="podcasts"
            className="arc-section shelf-section"
            aria-labelledby="listen-recs"
          >
            <p className="arc-kicker" id="listen-recs">
              listen
            </p>
            <p className="shelf-section-hint">voice notes — what the episode tunes</p>
            <div className="shelf-listen-list">
              {listens.map((item) => (
                <ShelfHref key={item.title} href={item.href} className="shelf-listen-card">
                  <article id={slugify(item.shelfTitle)} className="shelf-listen-inner">
                    <header className="shelf-card-head">
                      <p className="shelf-card-kicker">listen</p>
                      <p className="shelf-card-meta">{item.label}</p>
                    </header>
                    <h3 className="shelf-card-title">{item.shelfTitle}</h3>
                    <p className="shelf-card-source">{item.meta}</p>
                    <dl className="shelf-fields">
                      <div>
                        <dt>signal</dt>
                        <dd>{item.signal ?? item.body}</dd>
                      </div>
                    </dl>
                    <Tags tags={item.tags} />
                    <span className="shelf-cta">open ↗</span>
                  </article>
                </ShelfHref>
              ))}
            </div>
          </section>

          <section id="watch" className="arc-section shelf-section" aria-labelledby="watch-label">
            <p className="arc-kicker" id="watch-label">
              watch
            </p>
            <p className="shelf-section-hint">screening notes — what to look for</p>

            <div id="documentaries" className="shelf-watch-group">
              <p className="shelf-subkicker">docs</p>
              <div className="shelf-watch-list">
                {DOCUMENTARY_RECS.map((item) => (
                  <WatchCard
                    key={item.title}
                    title={item.title}
                    shelfTitle={item.shelfTitle}
                    year={item.year}
                    href={item.href}
                    frame={item.note}
                    image={item.image}
                    tags={item.tags}
                  />
                ))}
              </div>
            </div>

            <div id="films" className="shelf-watch-group">
              <p className="shelf-subkicker">films</p>
              <div className="shelf-watch-list">
                {FILM_RECS.map((item) => (
                  <WatchCard
                    key={item.title}
                    title={item.title}
                    shelfTitle={item.shelfTitle}
                    year={item.year}
                    href={item.href}
                    frame={item.note}
                    image={item.image}
                    tags={item.tags}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="arc-section" id="channels" aria-labelledby="channel-recs">
            <p className="arc-kicker" id="channel-recs">
              read
            </p>
            <ul className="arc-list">
              {CHANNEL_RECS.map((item) => (
                <li key={item.title} id={slugify(item.shelfTitle)} className="arc-item">
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
            <p className="arc-kicker" id="shelf-tips-label">
              living
            </p>
            <ul className="arc-list">
              {[...EURO_LIFE_GUIDE, ...LIFESTYLE_RECS].map((item) => (
                <li key={item.title} id={slugify(item.title)} className="arc-item">
                  <span className="arc-item-title">{item.title}</span>
                  <span className="arc-item-meta">{item.label}</span>
                  <p className="arc-item-note">{item.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="shelf-rail" aria-label="shelf notes">
          <p className="shelf-rail-kicker">on this shelf</p>
          <nav className="shelf-rail-nav">
            {RAIL.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <p className="shelf-rail-note">
            listen asks what a voice tunes.
            <br />
            watch asks what a frame trains.
          </p>
        </aside>
      </div>
    </ArchivePage>
  );
}
