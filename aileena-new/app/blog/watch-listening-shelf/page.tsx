'use client';

import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const PODCAST_RECS = [
  {
    title: 'Fashion Neurosis with Bella Freud',
    shelfTitle: 'Fashion Neurosis',
    label: 'podcast',
    meta: 'Kate Moss episode',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
    body:
      'A velvet couch, fashion as anxiety, and the kind of conversation that makes taste feel less like certainty and more like confession.',
  },
  {
    title: 'Do You Read Her',
    shelfTitle: 'Do You Read Her',
    label: 'podcast',
    meta: 'women / reading / voice',
    href: 'https://open.spotify.com/episode/0cx1oBoJEwfaKGVbITcD5K',
    body:
      'A show about how we read the women we love, the women we resist, and the private canon we build around them.',
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
    note: 'a sentence holding while the world refuses to.',
    body:
      'Didion as calibration: how to watch a sentence hold together while the world refuses to.',
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    shelfTitle: 'David Hockney',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image: '/shelf/hockney-ra.jpg',
    note: 'colour, scale, looking slowly.',
    body:
      'A studio-eye film: colour, scale, looking slowly, and the pleasure of seeing a picture decide what it wants to be.',
  },
  {
    title: 'A Bigger Splash',
    shelfTitle: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: '/shelf/bigger-splash.jpg',
    note: 'pool water, staged intimacy.',
    body:
      'Image-making as theatre: pool water, staged intimacy, and the strange flatness that makes Hockney feel alive.',
  },
];

/** Narrative cinema — life-texture, not a Letterboxd dump. Same Watch wall as docs. */
const FILM_RECS = [
  {
    title: 'Blue Is the Warmest Color',
    shelfTitle: 'Blue Is the Warmest Color',
    year: '2013',
    label: 'Léa · intimacy',
    href: 'https://en.wikipedia.org/wiki/Blue_Is_the_Warmest_Colour',
    image: '/shelf/blue-is-the-warmest-color.jpg',
    note: 'honesty in the body — not spectacle.',
    body: 'Léa early: intimacy, pain, growing up. Honesty in the body — not spectacle.',
  },
  {
    title: 'The French Dispatch',
    shelfTitle: 'The French Dispatch',
    year: '2021',
    label: 'magazine life · Léa',
    href: 'https://en.wikipedia.org/wiki/The_French_Dispatch',
    image: '/shelf/french-dispatch.jpg',
    note: 'layout, short chapters, city as set.',
    body: 'Fashion magazine, European literary rooms. Layout, short chapters, city as set — life aesthetics you can steal.',
  },
  {
    title: 'Spectre / No Time to Die',
    shelfTitle: 'Bond arc',
    year: '2015–21',
    label: 'Bond girl arc',
    href: 'https://en.wikipedia.org/wiki/No_Time_to_Die',
    image: '/shelf/spectre.jpg',
    note: 'restraint, distance. finish the arc.',
    body: 'The Bond-girl line she already likes — restraint, distance, black-and-white emotion. Finish the arc.',
  },
  {
    title: 'The Crown',
    shelfTitle: 'The Crown',
    year: 'series',
    label: 'British public life',
    href: 'https://en.wikipedia.org/wiki/The_Crown_(TV_series)',
    image: '/shelf/the-crown.jpg',
    note: 'power worn on a body.',
    body:
      'British public life: crown, cabinet, marriage, press. Power worn on a body — cold elegance.',
  },
  {
    title: 'The Capture',
    shelfTitle: 'The Capture',
    year: 'series',
    label: 'new untrust',
    href: 'https://en.wikipedia.org/wiki/The_Capture_(TV_series)',
    image: '/shelf/the-capture.jpg',
    note: 'a world you cannot trust.',
    body:
      'Surveillance, deepfakes, fake evidence. Opposite of The Crown: old-order dignity vs a world you cannot trust.',
  },
  {
    title: 'Bodyguard',
    shelfTitle: 'Bodyguard',
    year: '2018',
    label: 'BBC thriller',
    href: 'https://en.wikipedia.org/wiki/Bodyguard_(British_TV_series)',
    image: '/shelf/bodyguard.jpg',
    note: 'same room as The Crown, hotter pulse.',
    body:
      'Protection detail, Westminster, paranoia paced like a thriller — same British-public-life room as The Crown, hotter pulse.',
  },
  {
    title: 'Miss Sloane',
    shelfTitle: 'Miss Sloane',
    year: '2016',
    label: 'lobby · power',
    href: 'https://en.wikipedia.org/wiki/Miss_Sloane',
    image: '/shelf/miss-sloane.jpg',
    note: 'strategy as bloodsport.',
    body:
      'Jessica Chastain as the sharpest lobbyist in the room — strategy as bloodsport, guns as numbers, and a woman who refuses to lose quietly. 斯隆女士.',
  },
];

const WATCH_ITEMS = [...DOCUMENTARY_RECS, ...FILM_RECS];

/** Euro life guide — how to assemble a European life-texture off-screen. */
const EURO_LIFE_GUIDE = [
  {
    title: 'Urban roam, not tourism',
    label: 'walk / cafés',
    body:
      'Train stations, café tables, signage, light on stone. One neighborhood at a time. Before Sunrise rule: conversation over landmarks.',
  },
  {
    title: 'See in black and white',
    label: 'eye / frame',
    body:
      'Phone camera is enough. Practice composition and contrast. Same as the B&W films — less color, more decision.',
  },
  {
    title: 'Language scraps',
    label: 'FR / IT',
    body:
      'Enough French or Italian to catch ~20% of dialogue. Films open; cities open too.',
  },
  {
    title: 'Wardrobe as Bond cool',
    label: 'cut / repeat',
    body:
      'Léa / Bond-girl line: fewer colors, better cut, repeat wears. Moodboard over trend-chase.',
  },
  {
    title: 'Slow museum',
    label: 'one room',
    body:
      'One gallery, not the whole building. Practice the same patience as a European long take.',
  },
  {
    title: 'Table as ritual',
    label: 'IT / FR kitchen',
    body:
      'Olive oil, tomatoes, bread, one good knife. Make an ordinary meal feel staged — without performing for anyone.',
  },
];

/** Lifestyle — practices that turn taste into a week. */
const LIFESTYLE_RECS = [
  {
    title: 'Urban drift diary',
    label: 'weekly',
    body: 'Walk. Note light, doorways, overheard lines. Not a "trip" — a practice.',
  },
  {
    title: 'One letter or collage page',
    label: 'paper',
    body: 'Physical scrapbook of living — one page a week. Scraps, tickets, one line that stayed.',
  },
  {
    title: 'Soundtrack as room',
    label: 'listen',
    body: 'Jazz, chanson, film score as background — closer to European cinema than algorithm pop.',
  },
  {
    title: 'Watch in pairs, not piles',
    label: 'pace',
    body: 'The Crown for British public life, then The Capture or Bodyguard — texture over binge.',
  },
];

const CHANNEL_RECS = [
  {
    title: 'Asymmetrical Bets',
    shelfTitle: 'Asymmetrical Bets',
    label: 'markets / narratives',
    href: 'https://asymmetricalbets.substack.com',
    body:
      'Narrative-driven market reading with enough conviction to be useful and enough taste to stay readable.',
  },
  {
    title: 'SemiAnalysis',
    shelfTitle: 'SemiAnalysis',
    label: 'semis / AI infrastructure',
    href: 'https://www.semianalysis.com',
    body:
      'The semiconductor and AI-infrastructure shelf: supply chains, chips, clusters, and the bottlenecks underneath the headline.',
  },
  {
    title: 'Branch Education',
    shelfTitle: 'Branch Education',
    label: 'semis basics / YouTube',
    href: '/blog/semi-basics-review',
    body:
      'Cache, memory, storage · PCB (+ factory walk) · GPU architecture — three explainers you think you already know. Start with the five-minute review, then watch.',
  },
  {
    title: 'TPU & CPO (high-signal YouTube)',
    shelfTitle: 'TPU & CPO',
    label: 'semis / curated video',
    href: '/blog/semi-watch-tpu-cpo',
    body:
      'Ironwood unbox, TPU data-center + systolic array, NVIDIA / Broadcom CPO, Corning glass 3D — in-page player + playlist. Watch NVIDIA + Broadcom CPO and Ironwood first.',
  },
  {
    title: 'Software YouTube — MCP',
    shelfTitle: 'MCP',
    label: 'agents / protocol',
    href: '/blog/software-watch',
    body:
      'What MCP is, then MCP vs API — in-page theater. Rust quick-master slot open until a link lands.',
  },
  {
    title: 'Post-Training Path',
    shelfTitle: 'Post-Training Path',
    label: 'Rust · CLI · Eval · SFT',
    href: '/blog/post-training-path',
    body:
      'Order of operations to post-train a small base model: Rust literacy, thin CLIs, holdout exact_match, LoRA on Qwen2.5-0.5B (Polar Lab).',
  },
  {
    title: 'Know Good Code. Own the Repo.',
    shelfTitle: 'Own the Repo',
    label: 'taste · stack · needs',
    href: '/blog/own-your-stack',
    body:
      'Recognize good code, own it on GitHub, name your real stack, know what you need before you build.',
  },
];

function bodyOf(
  rows: { title: string; body: string }[],
  title: string,
): string {
  const row = rows.find((item) => item.title === title);
  return row?.body ?? '';
}

/** Distilled from EURO_LIFE_GUIDE + LIFESTYLE_RECS — same text, different plane. */
const SHELF_TIPS = [
  {
    tip: 'walk one neighborhood',
    body: `${bodyOf(EURO_LIFE_GUIDE, 'Urban roam, not tourism')} ${bodyOf(LIFESTYLE_RECS, 'Urban drift diary')}`,
  },
  {
    tip: 'watch in pairs, not piles',
    body: bodyOf(LIFESTYLE_RECS, 'Watch in pairs, not piles'),
  },
  {
    tip: 'one museum room',
    body: bodyOf(EURO_LIFE_GUIDE, 'Slow museum'),
  },
  {
    tip: 'phone in black and white',
    body: bodyOf(EURO_LIFE_GUIDE, 'See in black and white'),
  },
  {
    tip: 'one letter or collage page',
    body: bodyOf(LIFESTYLE_RECS, 'One letter or collage page'),
  },
  {
    tip: 'table as ritual',
    body: bodyOf(EURO_LIFE_GUIDE, 'Table as ritual'),
  },
  {
    tip: 'repeat better clothes',
    body: bodyOf(EURO_LIFE_GUIDE, 'Wardrobe as Bond cool'),
  },
  {
    tip: 'language scraps',
    body: bodyOf(EURO_LIFE_GUIDE, 'Language scraps'),
    quiet: true,
  },
  {
    tip: 'soundtrack as room',
    body: bodyOf(LIFESTYLE_RECS, 'Soundtrack as room'),
    quiet: true,
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
    <SubstackShell
      date="2026.07.12"
      title="watch · listening shelf"
      dek="covers first. notes after. what to steal for a week, last."
      showNarration={false}
    >
      <main className="recommendation-issue shelf-issue" aria-label="watch listening shelf">
        <section className="poster-shelf" aria-labelledby="poster-shelf-label">
          <p className="shelf-layer-label" id="poster-shelf-label">
            poster shelf
          </p>
          <div className="poster-shelf-rail">
            {WATCH_ITEMS.map((item) => (
              <a
                key={item.title}
                className="poster-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="poster-card-frame">
                  <img src={item.image} alt="" />
                </span>
                <span className="poster-card-title">{item.shelfTitle}</span>
                <span className="poster-card-meta">
                  {item.year} · {item.label}
                </span>
                <span className="poster-card-note">{item.note}</span>
              </a>
            ))}
          </div>
          <div className="poster-shelf-ledge" aria-hidden />
        </section>

        <section className="shelf-notes" aria-labelledby="shelf-notes-label">
          <p className="shelf-layer-label" id="shelf-notes-label">
            notes from the shelf
          </p>
          <p className="shelf-notes-lede">
            if it changes how I hear a sentence, look at an image, assemble a week, or
            read a market — it sits here.
          </p>

          <div className="notes-group" id="podcasts" aria-labelledby="listen-recs">
            <h2 id="listen-recs">listen</h2>
            <ul className="notes-list">
              {PODCAST_RECS.map((item) => (
                <li key={item.title} className="notes-item">
                  <ShelfHref href={item.href} className="notes-item-title">
                    {item.shelfTitle}
                  </ShelfHref>
                  <span className="notes-item-meta">
                    {item.shelfTitle !== item.title
                      ? `${item.title} · ${item.meta}`
                      : `${item.label} · ${item.meta}`}
                  </span>
                  <p className="notes-item-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="notes-group" id="films" aria-labelledby="watch-recs">
            <h2 id="watch-recs">watch</h2>
            <ul className="notes-list">
              {WATCH_ITEMS.map((item) => (
                <li key={item.title} className="notes-item">
                  <ShelfHref href={item.href} className="notes-item-title">
                    {item.shelfTitle}
                  </ShelfHref>
                  <span className="notes-item-meta">
                    {item.shelfTitle !== item.title
                      ? `${item.title} · ${item.year}`
                      : `${item.year} · ${item.label}`}
                  </span>
                  <p className="notes-item-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="notes-group" id="channels" aria-labelledby="channel-recs">
            <h2 id="channel-recs">read next</h2>
            <ul className="notes-list">
              {CHANNEL_RECS.map((item) => (
                <li key={item.title} className="notes-item">
                  <ShelfHref href={item.href} className="notes-item-title">
                    {item.shelfTitle}
                  </ShelfHref>
                  <span className="notes-item-meta">
                    {item.shelfTitle !== item.title
                      ? `${item.title} · ${item.label}`
                      : item.label}
                  </span>
                  <p className="notes-item-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="shelf-tips"
          id="euro-life"
          aria-labelledby="shelf-tips-label"
        >
          <span id="lifestyle" className="shelf-hash-alias" />
          <p className="shelf-layer-label" id="shelf-tips-label">
            life tips stolen from the shelf
          </p>
          <p className="tips-epigraph">Trendy is obsolete.</p>
          <div className="tips-grid">
            {SHELF_TIPS.map((item) => (
              <article
                key={item.tip}
                className={item.quiet ? 'tip-card tip-card-quiet' : 'tip-card'}
              >
                <h3 className="tip-card-title">{item.tip}</h3>
                <p className="tip-card-body">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </SubstackShell>
  );
}
