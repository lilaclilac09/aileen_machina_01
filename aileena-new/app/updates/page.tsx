'use client';

import ArchivePage from '../_archive/ArchivePage';

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
    'The calibration text. Didion reports on her own mind without turning grief into performance — identity is what remains when the furniture of a life has been rearranged overnight.',
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

function BookRow({ book }: { book: Book }) {
  return (
    <li className="arc-item">
      <span className="arc-item-title">{book.title}</span>
      <span className="arc-item-meta">{book.author}</span>
    </li>
  );
}

export default function UpdatesPage() {
  return (
    <ArchivePage
      room="club"
      title="book club"
      dek="Didion on the desk. A quiet record of what she’s actually reading."
    >
      <section className="arc-section" id="this-issue" aria-labelledby="current-reading">
        <p className="arc-kicker" id="current-reading">
          current reading
        </p>
        <article className="arc-now">
          <h2 className="arc-item-title">{FEATURED.title}</h2>
          <span className="arc-item-meta">{FEATURED.author}</span>
          <p className="arc-item-note">{FEATURED.body}</p>
        </article>
      </section>

      <section className="arc-section" id="didion-shelf" aria-labelledby="shelf-label">
        <p className="arc-kicker" id="shelf-label">
          shelf
        </p>
        <ul className="arc-list">
          {DIDION_SHELF.map((book) => (
            <BookRow key={book.title} book={book} />
          ))}
        </ul>
      </section>

      <section className="arc-section" id="adjacent-shelf" aria-labelledby="reading-now">
        <p className="arc-kicker" id="reading-now">
          reading now
        </p>
        <ul className="arc-list">
          {ADJACENT.map((book) => (
            <BookRow key={book.title} book={book} />
          ))}
        </ul>
      </section>

      <section className="arc-section" id="updates-log" aria-labelledby="notes-label">
        <p className="arc-kicker" id="notes-label">
          notes
        </p>
        <ul className="arc-list">
          {UPDATES.map((item) => (
            <li key={item.title} className="arc-item">
              <span className="arc-item-title">{item.title}</span>
              <span className="arc-item-meta">{item.date}</span>
              <p className="arc-item-note">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </ArchivePage>
  );
}
