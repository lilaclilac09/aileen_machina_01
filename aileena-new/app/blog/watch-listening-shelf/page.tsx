'use client';

import SubstackShell from '../_substack/SubstackShell';

const PODCAST_RECS = [
  {
    title: 'Fashion Neurosis with Bella Freud',
    label: 'podcast',
    meta: 'Kate Moss episode',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
    body:
      'A velvet couch, fashion as anxiety, and the kind of conversation that makes taste feel less like certainty and more like confession.',
  },
  {
    title: 'Do You Read Her',
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
    year: '2018',
    label: 'writer / witness',
    href: 'https://www.rottentomatoes.com/m/joan_didion_the_center_will_not_hold',
    image: '/shelf/didion-center.jpg',
    body:
      'Didion as calibration: how to watch a sentence hold together while the world refuses to.',
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image: '/shelf/hockney-ra.jpg',
    body:
      'A studio-eye film: colour, scale, looking slowly, and the pleasure of seeing a picture decide what it wants to be.',
  },
  {
    title: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: '/shelf/bigger-splash.jpg',
    body:
      'Image-making as theatre: pool water, staged intimacy, and the strange flatness that makes Hockney feel alive.',
  },
];

/** Narrative cinema — life-texture, not a Letterboxd dump. Same Watch wall as docs. */
const FILM_RECS = [
  {
    title: 'Blue Is the Warmest Color',
    year: '2013',
    label: 'Léa · intimacy',
    href: 'https://en.wikipedia.org/wiki/Blue_Is_the_Warmest_Colour',
    image: '/shelf/blue-is-the-warmest-color.jpg',
    body: 'Léa early: intimacy, pain, growing up. Honesty in the body — not spectacle.',
  },
  {
    title: 'The French Dispatch',
    year: '2021',
    label: 'magazine life · Léa',
    href: 'https://en.wikipedia.org/wiki/The_French_Dispatch',
    image: '/shelf/french-dispatch.jpg',
    body: 'Fashion magazine, European literary rooms. Layout, short chapters, city as set — life aesthetics you can steal.',
  },
  {
    title: 'Spectre / No Time to Die',
    year: '2015–21',
    label: 'Bond girl arc',
    href: 'https://en.wikipedia.org/wiki/No_Time_to_Die',
    image: '/shelf/spectre.jpg',
    body: 'The Bond-girl line she already likes — restraint, distance, black-and-white emotion. Finish the arc.',
  },
  {
    title: 'The Crown',
    year: 'series',
    label: 'British public life',
    href: 'https://en.wikipedia.org/wiki/The_Crown_(TV_series)',
    image: '/shelf/the-crown.jpg',
    body:
      'British public life: crown, cabinet, marriage, press. Power worn on a body — cold elegance.',
  },
  {
    title: 'The Capture',
    year: 'series',
    label: 'new untrust',
    href: 'https://en.wikipedia.org/wiki/The_Capture_(TV_series)',
    image: '/shelf/the-capture.jpg',
    body:
      'Surveillance, deepfakes, fake evidence. Opposite of The Crown: old-order dignity vs a world you cannot trust.',
  },
  {
    title: 'Bodyguard',
    year: '2018',
    label: 'BBC thriller',
    href: 'https://en.wikipedia.org/wiki/Bodyguard_(British_TV_series)',
    image: '/shelf/bodyguard.jpg',
    body:
      'Protection detail, Westminster, paranoia paced like a thriller — same British-public-life room as The Crown, hotter pulse.',
  },
  {
    title: 'Miss Sloane',
    year: '2016',
    label: 'lobby · power',
    href: 'https://en.wikipedia.org/wiki/Miss_Sloane',
    image: '/shelf/miss-sloane.jpg',
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
    label: 'markets / narratives',
    href: 'https://asymmetricalbets.substack.com',
    body:
      'Narrative-driven market reading with enough conviction to be useful and enough taste to stay readable.',
  },
  {
    title: 'SemiAnalysis',
    label: 'semis / AI infrastructure',
    href: 'https://www.semianalysis.com',
    body:
      'The semiconductor and AI-infrastructure shelf: supply chains, chips, clusters, and the bottlenecks underneath the headline.',
  },
  {
    title: 'Branch Education',
    label: 'semis basics / YouTube',
    href: '/blog/semi-basics-review',
    body:
      'Cache, memory, storage · PCB (+ factory walk) · GPU architecture — three explainers you think you already know. Start with the five-minute review, then watch.',
  },
  {
    title: 'TPU & CPO (high-signal YouTube)',
    label: 'semis / curated video',
    href: '/blog/semi-watch-tpu-cpo',
    body:
      'Ironwood unbox, TPU data-center + systolic array, NVIDIA / Broadcom CPO, Corning glass 3D — in-page player + playlist. Watch NVIDIA + Broadcom CPO and Ironwood first.',
  },
  {
    title: 'Software YouTube — MCP',
    label: 'agents / protocol',
    href: '/blog/software-watch',
    body:
      'What MCP is, then MCP vs API — in-page theater. Rust quick-master slot open until a link lands.',
  },
  {
    title: 'Post-Training Path',
    label: 'Rust · CLI · Eval · SFT',
    href: '/blog/post-training-path',
    body:
      'Order of operations to post-train a small base model: Rust literacy, thin CLIs, holdout exact_match, LoRA on Qwen2.5-0.5B (Polar Lab).',
  },
  {
    title: 'Know Good Code. Own the Repo.',
    label: 'taste · stack · needs',
    href: '/blog/own-your-stack',
    body:
      'Recognize good code, own it on GitHub, name your real stack, know what you need before you build.',
  },
];

export default function WatchListeningShelfArticle() {
  return (
    <SubstackShell
      category="Recommendations"
      date="2026.07.12"
      tags="Podcast · Film · European living · Lifestyle"
      title="The Listening and Watching Shelf"
      dek="A small rotation of podcasts, films, Euro life guide, and Lifestyle weekly practices beside the essays — life-texture, not a moodboard dump."
      showNarration={false}
    >
      <main className="recommendation-issue" aria-label="Listening, watching, and living recommendations">
        <section className="rec-issue-note">
          <p className="rec-issue-kicker">fashion police</p>
          <h2>Trendy is obsolete.</h2>
          <p>
            This is where the listening shelf lives now: not mixed into the glass work,
            not glued onto every essay, just its own little issue. The rule is simple:
            if it changes how I hear a sentence, look at an image, assemble a week, or
            read a market, it can sit here.
          </p>
        </section>

        <section className="rec-section" id="podcasts" aria-labelledby="podcast-recs">
          <p className="rec-section-label">listen</p>
          <h2 id="podcast-recs">Podcasts</h2>
          <div className="podcast-rec-grid">
            {PODCAST_RECS.map((item) => (
              <a
                key={item.title}
                className="podcast-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="podcast-card-label">{item.label}</span>
                <span className="podcast-card-title">{item.title}</span>
                <span className="podcast-card-meta">{item.meta}</span>
                <span className="podcast-wave" aria-hidden>
                  {[18, 31, 22, 42, 27, 36, 20, 30, 16].map((height, index) => (
                    <span key={`${height}-${index}`} style={{ height }} />
                  ))}
                </span>
                <span className="podcast-card-body">{item.body}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rec-section" id="films" aria-labelledby="watch-recs">
          <p className="rec-section-label">watch · listening shelf</p>
          <h2 id="watch-recs">Watch — documentaries & films</h2>
          <p className="rec-section-dek">
            Didion / Hockney for calibration; Léa · Bond · The Crown · The Capture · Bodyguard · Miss
            Sloane for life-texture — pacing and temperature, not a checklist.
          </p>
          <div className="documentary-rec-wall">
            {WATCH_ITEMS.map((item) => (
              <a
                key={item.title}
                className="documentary-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span
                  className="documentary-rec-image"
                  aria-hidden
                  style={{ backgroundImage: `url("${item.image}")` }}
                />
                <span className="documentary-rec-meta">
                  {item.year} · {item.label}
                </span>
                <span className="documentary-rec-title">{item.title}</span>
                <span className="documentary-rec-body">{item.body}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rec-section" id="euro-life" aria-labelledby="euro-life-recs">
          <p className="rec-section-label">Euro life guide</p>
          <h2 id="euro-life-recs">European living</h2>
          <p className="rec-section-dek">
            Off-screen notes for a European life-texture — walk, look, language, cut, museum pace, table ritual.
            Steal method from the films; do not cosplay them.
          </p>
          <div className="channel-rec-grid">
            {EURO_LIFE_GUIDE.map((item) => (
              <div key={item.title} className="channel-rec-card life-note-card">
                <span className="channel-rec-title">{item.title}</span>
                <span className="channel-rec-label">{item.label}</span>
                <span className="channel-rec-body">{item.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rec-section" id="lifestyle" aria-labelledby="lifestyle-recs">
          <p className="rec-section-label">Lifestyle</p>
          <h2 id="lifestyle-recs">Weekly practices</h2>
          <p className="rec-section-dek">
            Turn the shelf into a week. Small repeats beat long lists.
          </p>
          <div className="channel-rec-grid">
            {LIFESTYLE_RECS.map((item) => (
              <div key={item.title} className="channel-rec-card life-note-card">
                <span className="channel-rec-title">{item.title}</span>
                <span className="channel-rec-label">{item.label}</span>
                <span className="channel-rec-body">{item.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rec-section" id="channels" aria-labelledby="channel-recs">
          <p className="rec-section-label">read next</p>
          <h2 id="channel-recs">Substack Channels</h2>
          <div className="channel-rec-grid">
            {CHANNEL_RECS.map((item) => (
              <a
                key={item.title}
                className="channel-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="channel-rec-title">{item.title}</span>
                <span className="channel-rec-label">{item.label}</span>
                <span className="channel-rec-body">{item.body}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </SubstackShell>
  );
}
