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
    image:
      'https://resizing.flixster.com/onSFETOELTXATdk56VRhXRScAvA=/206x305/v2/https://resizing.flixster.com/JbJYntMfetJO6X_4lj7ZrJdwmn4=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2U5ZTQ5ODMzLWFiNGUtNGM1Ny1iNjk3LTkyNzI0YmFiZDEwMy53ZWJw',
    body:
      'Didion as calibration: how to watch a sentence hold together while the world refuses to.',
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image:
      'https://d7hftxdivxxvm.cloudfront.net/?height=800&quality=80&resize_to=fit&src=https%3A%2F%2Fd32dm0rphc51dk.cloudfront.net%2FxVvYx_HSwpadXmaJ91XLWQ%2Fmain.jpg&width=535',
    body:
      'A studio-eye film: colour, scale, looking slowly, and the pleasure of seeing a picture decide what it wants to be.',
  },
  {
    title: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: 'https://www.ecartelera.com/carteles/10100/10114/004.jpg',
    body:
      'Image-making as theatre: pool water, staged intimacy, and the strange flatness that makes Hockney feel alive.',
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
];

export default function WatchListeningShelfArticle() {
  return (
    <SubstackShell
      category="Recommendations"
      date="2026.07.06"
      tags="Podcast · Documentary · Substack"
      title="The Listening and Watching Shelf"
      dek="A small rotation of podcasts, films, and research channels that sit beside the essays. Not a moodboard for everything — just the shelf for listening, watching, and reading next."
      showNarration={false}
    >
      <main className="recommendation-issue" aria-label="Podcast and documentary recommendations">
        <section className="rec-issue-note">
          <p className="rec-issue-kicker">fashion police</p>
          <h2>Trendy is obsolete.</h2>
          <p>
            This is where the listening shelf lives now: not mixed into the glass work,
            not glued onto every essay, just its own little issue. The rule is simple:
            if it changes how I hear a sentence, look at an image, or read a market,
            it can sit here.
          </p>
        </section>

        <section className="rec-section" aria-labelledby="podcast-recs">
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

        <section className="rec-section" aria-labelledby="documentary-recs">
          <p className="rec-section-label">watch</p>
          <h2 id="documentary-recs">Documentaries</h2>
          <div className="documentary-rec-wall">
            {DOCUMENTARY_RECS.map((item, index) => (
              <a
                key={item.title}
                className="documentary-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ['--tilt' as string]: `${[-2.6, 1.8, -1.1][index]}deg` }}
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

        <section className="rec-section" aria-labelledby="channel-recs">
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
