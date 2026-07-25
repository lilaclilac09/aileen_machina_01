'use client';

import Link from 'next/link';
import ScrollUnlock from '../blog/ScrollUnlock';
import './updates.css';

type Book = {
  title: string;
  author: string;
  tags: string[];
  body: string;
  status?: string;
};

const FEATURED: Book = {
  title: 'The Year of Magical Thinking',
  author: 'Joan Didion',
  tags: ['grief', 'ritual', 'observation'],
  status: "Aileena's Biweekly Read · Issue 01",
  body:
    'The calibration text. Didion watches herself refuse the ordinary grammar of loss — and somehow still writes the room with the lights on. Identity here is not a brand; it is what remains when the furniture of a life has been rearranged overnight.',
};

const DIDION_SHELF: Book[] = [
  {
    title: 'Slouching Towards Bethlehem',
    author: 'Joan Didion',
    tags: ['essays', 'California'],
    status: '31% in',
    body:
      'The early sharp eye: counterculture, place, and the sentence as a measuring instrument.',
  },
  {
    title: 'The White Album',
    author: 'Joan Didion',
    tags: ['essays', '1960s'],
    body:
      'A decade dissolving into fragments — Hollywood, hospitals, politics — held by a refusal to pretend the center is holding.',
  },
  {
    title: 'Play It As It Lays',
    author: 'Joan Didion',
    tags: ['novel', 'Los Angeles'],
    body:
      'Freeways, silence, and a woman learning how little narrative can save you.',
  },
  {
    title: 'Notes to John',
    author: 'Joan Didion',
    tags: ['private voice', 'archive'],
    body:
      'Closer to the desk and the ordinary day — notes that feel like overhearing the mind before it becomes the essay.',
  },
  {
    title: 'Let Me Tell You What I Mean',
    author: 'Joan Didion',
    tags: ['essays', 'precision'],
    body:
      'Later pieces, same steel: short, exact, allergic to vagueness.',
  },
  {
    title: 'Philosophy and Vulnerability',
    author: 'Matthew R. McLennan',
    tags: ['Didion', 'Lorde'],
    body:
      'A side door into Didion through philosophy — vulnerability as method, not soft branding.',
  },
];

const ADJACENT: Book[] = [
  {
    title: 'Crying in H Mart',
    author: 'Michelle Zauner',
    tags: ['grief', 'food'],
    body:
      'Loss through taste and aisle fluorescent light — inheritance as something you can still cook.',
  },
  {
    title: 'Bad Feminist',
    author: 'Roxane Gay',
    tags: ['essays', 'feminism'],
    body:
      'Feminism without the costume. Gay keeps the contradictions on the table.',
  },
  {
    title: 'On Earth We’re Briefly Gorgeous',
    author: 'Ocean Vuong',
    tags: ['identity', 'letter'],
    body:
      'A letter that becomes a life: migration, desire, and the violence of beautiful English.',
  },
  {
    title: 'Still Born',
    author: 'Guadalupe Nettel',
    tags: ['motherhood', 'choice'],
    body:
      'What we owe children — and what we refuse. Quietly radical social observation.',
  },
];

const UPDATES = [
  {
    date: '2026.07.25',
    kind: 'design',
    title: 'Metal & Pages goes magazine',
    body: 'White field, heavy headlines, dashed rules — Service95 book-club energy with Aileena teal as the only accent.',
  },
  {
    date: '2026.07.17',
    kind: 'bookclub',
    title: 'Metal & Pages opens',
    body: 'Biweekly bookclub page is live — Didion shelf first, then adjacent reads that share the same sharp voltage: identity, grief, feminism, social observation.',
  },
  {
    date: '2026.07.17',
    kind: 'shelf',
    title: 'Library pull from Apple Books',
    body: 'Selections from the current library: Didion core plus Zauner, Gay, Vuong, and Nettel.',
  },
];

export default function UpdatesPage() {
  return (
    <div className="mp-page">
      <ScrollUnlock />

      <header className="mp-nav site-top-nav">
        <Link href="/" className="mp-nav-brand">
          Aileena
        </Link>
        <Link href="/#watch-hub" className="mp-nav-link">
          Watch / Listen →
        </Link>
      </header>

      <main className="mp-wrap">
        <section className="mp-hero" aria-labelledby="mp-hero-title">
          <div>
            <p className="mp-kicker">Book Club</p>
            <h1 id="mp-hero-title" className="mp-hero-title">
              Metal & Pages
            </h1>
          </div>
          <div>
            <p className="mp-hero-dek">
              A space for the pages that rearrange the room — personal selections with
              that sharp, introspective Joan Didion energy. Identity, grief, feminism,
              social observation. Biweekly, not everything.
            </p>
            <div className="mp-meta-row">
              <span className="mp-meta">Issue 01</span>
              <span className="mp-meta">Biweekly</span>
              <span className="mp-meta">Didion spine</span>
            </div>
          </div>
        </section>

        <hr className="mp-rule" />

        <article className="mp-featured" aria-labelledby="featured-title">
          <div>
            <p className="mp-featured-label">{FEATURED.status}</p>
            <h2 id="featured-title">{FEATURED.title}</h2>
            <p className="mp-featured-author">{FEATURED.author}</p>
            <p>{FEATURED.body}</p>
          </div>
          <aside className="mp-featured-aside">
            <p className="mp-featured-label">Why this fortnight</p>
            <p>
              Because grief is a public and private architecture at once — and Didion
              still teaches how to report on your own mind without turning it into
              performance.
            </p>
          </aside>
        </article>

        <section className="mp-section" aria-labelledby="didion-shelf">
          <div className="mp-section-head">
            <h2 id="didion-shelf">Previous reads</h2>
            <p className="mp-section-note">Didion core · from the library</p>
          </div>
          <div className="mp-book-grid">
            {DIDION_SHELF.map((book, index) => (
              <article key={book.title} className="mp-book">
                <span className="mp-book-index">
                  {book.status ?? `0${index + 1}`}
                </span>
                <h3 className="mp-book-title">{book.title}</h3>
                <p className="mp-book-author">{book.author}</p>
                <div className="mp-book-tags">
                  {book.tags.map((tag) => (
                    <span key={tag} className="mp-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mp-book-body">{book.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mp-section" aria-labelledby="adjacent-shelf">
          <div className="mp-section-head">
            <h2 id="adjacent-shelf">What we’re reading now</h2>
            <p className="mp-section-note">Same frequency · other rooms</p>
          </div>
          <div className="mp-book-grid">
            {ADJACENT.map((book, index) => (
              <article key={book.title} className="mp-book">
                <span className="mp-book-index">A{index + 1}</span>
                <h3 className="mp-book-title">{book.title}</h3>
                <p className="mp-book-author">{book.author}</p>
                <div className="mp-book-tags">
                  {book.tags.map((tag) => (
                    <span key={tag} className="mp-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mp-book-body">{book.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mp-section" aria-labelledby="updates-log">
          <div className="mp-section-head">
            <h2 id="updates-log">Latest notes</h2>
            <p className="mp-section-note">Site updates</p>
          </div>
          <div className="mp-updates">
            {UPDATES.map((item) => (
              <article key={item.title} className="mp-update">
                <div className="mp-update-meta">
                  <span className="mp-update-date">{item.date}</span>
                  <span className="mp-update-kind">{item.kind}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mp-footer">
          <Link href="/">← Home</Link>
          <Link href="/blog/watch-listening-shelf">Full listening shelf</Link>
        </footer>
      </main>
    </div>
  );
}
