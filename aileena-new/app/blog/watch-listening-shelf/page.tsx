'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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

const INDEX = [
  { id: 'featured', label: 'featured' },
  { id: 'listen', label: 'listen' },
  { id: 'watch', label: 'watch' },
  { id: 'notes', label: 'notes' },
] as const;

const HASH_SECTION: Record<string, (typeof INDEX)[number]['id']> = {
  featured: 'featured',
  'featured-listen': 'featured',
  listen: 'listen',
  podcasts: 'listen',
  watch: 'watch',
  films: 'watch',
  documentaries: 'watch',
  notes: 'notes',
  channels: 'notes',
  'euro-life': 'notes',
  lifestyle: 'notes',
};

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

function openDrawer(id: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLDetailsElement) el.open = true;
}

function bindDefaultOpen(defaultOpen: boolean) {
  return (el: HTMLDetailsElement | null) => {
    if (!el || !defaultOpen || el.dataset.shelfInit) return;
    el.open = true;
    el.dataset.shelfInit = '1';
  };
}

function Drawer({
  id,
  label,
  defaultOpen = false,
  children,
  testId,
}: {
  id: string;
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <details
      id={id}
      className="shelf-drawer"
      data-testid={testId}
      ref={bindDefaultOpen(defaultOpen)}
    >
      <summary className="shelf-drawer-label">{label}</summary>
      {children}
    </details>
  );
}

function ShelfRow({
  id,
  title,
  type,
  note,
  href,
  image,
  tags,
  detail,
  defaultOpen = false,
}: {
  id: string;
  title: string;
  type: string;
  note?: string;
  href?: string;
  image?: string;
  tags?: string[];
  detail?: string;
  defaultOpen?: boolean;
}) {
  const extra = detail && detail !== note ? detail : null;
  const canExpand = Boolean(extra || href || tags?.length);
  const head = (
    <>
      {image ? (
        <span className="shelf-row-thumb">
          <Image src={image} alt="" fill sizes="48px" style={{ objectFit: 'contain' }} />
        </span>
      ) : null}
      <span className="shelf-row-copy">
        <span className="shelf-row-title">{title}</span>
        <span className="shelf-row-type">{type}</span>
        {note ? <span className="shelf-row-note">{note}</span> : null}
      </span>
    </>
  );
  const panel = (
    <div className="shelf-row-panel">
      {extra ? <p className="shelf-row-detail">{extra}</p> : null}
      <Tags tags={tags} />
      {href ? (
        <ShelfHref href={href} className="shelf-cta">
          open ↗
        </ShelfHref>
      ) : null}
    </div>
  );

  if (!canExpand) {
    return (
      <div id={id} className="shelf-row is-static">
        {head}
      </div>
    );
  }

  return (
    <details id={id} className="shelf-row" ref={bindDefaultOpen(defaultOpen)}>
      <summary className="shelf-row-summary">{head}</summary>
      {panel}
    </details>
  );
}

export default function WatchListeningShelfArticle() {
  const featured = PODCAST_RECS.find((item) => item.featured) ?? PODCAST_RECS[0];
  const listens = PODCAST_RECS.filter((item) => !item.featured);
  const [active, setActive] = useState<(typeof INDEX)[number]['id']>('featured');

  const goTo = useCallback((hashId: string) => {
    const section = HASH_SECTION[hashId] ?? HASH_SECTION[hashId.replace(/^#/, '')];
    if (section) {
      openDrawer(section);
      setActive(section);
    }
    const target = document.getElementById(hashId.replace(/^#/, ''));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    if (raw) {
      goTo(raw);
    }
    const drawers = INDEX.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!drawers.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = hit?.target.id;
        if (id && HASH_SECTION[id]) setActive(HASH_SECTION[id]);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    );
    drawers.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [goTo]);

  return (
    <ArchivePage
      room="shelf"
      date="2026.07.12"
      title="watch / listening shelf"
      dek="things that tune the eye and ear"
    >
      <div className="arc-stage shelf-stage">
        <nav className="shelf-index" aria-label="shelf labels" data-testid="shelf-index">
          {INDEX.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={active === item.id ? 'is-active' : undefined}
              aria-current={active === item.id ? 'location' : undefined}
              data-testid={`shelf-index-${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                goTo(item.id);
                history.replaceState(null, '', `#${item.id}`);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="arc-stage-main shelf-drawers">
          <Drawer id="featured" label="featured" defaultOpen testId="shelf-drawer-featured">
            <span id="featured-listen" className="shelf-hash-alias" />
            <ShelfRow
              id={slugify(featured.shelfTitle)}
              title={featured.shelfTitle}
              type={featured.label}
              note={featured.meta}
              href={featured.href}
              tags={featured.tags}
              detail={featured.why}
              defaultOpen
            />
          </Drawer>

          <Drawer id="listen" label="listen" defaultOpen testId="shelf-drawer-listen">
            <span id="podcasts" className="shelf-hash-alias" />
            {listens.map((item) => (
              <ShelfRow
                key={item.title}
                id={slugify(item.shelfTitle)}
                title={item.shelfTitle}
                type={item.label}
                note={item.meta}
                href={item.href}
                tags={item.tags}
                detail={item.signal ?? item.body}
              />
            ))}
          </Drawer>

          <Drawer id="watch" label="watch" testId="shelf-drawer-watch">
            <div id="documentaries" className="shelf-group">
              <p className="shelf-subkicker">docs</p>
              {DOCUMENTARY_RECS.map((item) => (
                <ShelfRow
                  key={item.title}
                  id={slugify(item.shelfTitle)}
                  title={item.shelfTitle}
                  type={`${item.label} · ${item.year}`}
                  note={item.note}
                  href={item.href}
                  image={item.image}
                  tags={item.tags}
                />
              ))}
            </div>
            <div id="films" className="shelf-group">
              <p className="shelf-subkicker">films</p>
              {FILM_RECS.map((item) => (
                <ShelfRow
                  key={item.title}
                  id={slugify(item.shelfTitle)}
                  title={item.shelfTitle}
                  type={`${item.label} · ${item.year}`}
                  note={item.note}
                  href={item.href}
                  image={item.image}
                  tags={item.tags}
                />
              ))}
            </div>
          </Drawer>

          <Drawer id="notes" label="notes" testId="shelf-drawer-notes">
            <div id="channels" className="shelf-group">
              <p className="shelf-subkicker">read</p>
              {CHANNEL_RECS.map((item) => (
                <ShelfRow
                  key={item.title}
                  id={slugify(item.shelfTitle)}
                  title={item.shelfTitle}
                  type={item.label}
                  note={item.body}
                  href={item.href}
                />
              ))}
            </div>
            <div id="euro-life" className="shelf-group">
              <span id="lifestyle" className="shelf-hash-alias" />
              <p className="shelf-subkicker">living</p>
              {[...EURO_LIFE_GUIDE, ...LIFESTYLE_RECS].map((item) => (
                <ShelfRow
                  key={item.title}
                  id={slugify(item.title)}
                  title={item.title}
                  type={item.label}
                  note={item.body}
                />
              ))}
            </div>
          </Drawer>
        </div>
      </div>
    </ArchivePage>
  );
}
