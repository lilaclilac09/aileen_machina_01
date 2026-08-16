'use client';

import Image from 'next/image';
import ArchivePage from '../_archive/ArchivePage';

type Book = {
  title: string;
  author: string;
  tags: string[];
  body: string;
  status?: string;
  tone?: 'ink' | 'cream' | 'teal' | 'dust' | 'slate';
};

const FEATURED: Book = {
  title: 'The Year of Magical Thinking',
  author: 'Joan Didion',
  tags: ['grief', 'ritual'],
  status: 'issue 01',
  tone: 'ink',
  body: 'Grief as observation, not performance.',
};

const DIDION_SHELF: Book[] = [
  {
    title: 'Slouching Towards Bethlehem',
    author: 'Joan Didion',
    tags: ['essays'],
    status: '31% in',
    tone: 'cream',
    body: 'California as a measuring instrument.',
  },
  {
    title: 'The White Album',
    author: 'Joan Didion',
    tags: ['essays'],
    tone: 'slate',
    body: 'A decade in fragments.',
  },
  {
    title: 'Play It As It Lays',
    author: 'Joan Didion',
    tags: ['novel'],
    tone: 'dust',
    body: 'Freeways. Silence.',
  },
  {
    title: 'Notes to John',
    author: 'Joan Didion',
    tags: ['archive'],
    tone: 'teal',
    body: 'The mind before it becomes the essay.',
  },
  {
    title: 'Let Me Tell You What I Mean',
    author: 'Joan Didion',
    tags: ['essays'],
    tone: 'ink',
    body: 'Short. Exact. Allergic to vagueness.',
  },
  {
    title: 'Philosophy and Vulnerability',
    author: 'Matthew R. McLennan',
    tags: ['Didion'],
    tone: 'cream',
    body: 'Vulnerability as method.',
  },
];

const ADJACENT: Book[] = [
  {
    title: 'Crying in H Mart',
    author: 'Michelle Zauner',
    tags: ['grief'],
    tone: 'dust',
    body: 'Loss through the grocery aisle.',
  },
  {
    title: 'Bad Feminist',
    author: 'Roxane Gay',
    tags: ['essays'],
    tone: 'slate',
    body: 'Contradictions stay on the table.',
  },
  {
    title: 'On Earth We’re Briefly Gorgeous',
    author: 'Ocean Vuong',
    tags: ['letter'],
    tone: 'teal',
    body: 'A letter that becomes a life.',
  },
  {
    title: 'Still Born',
    author: 'Guadalupe Nettel',
    tags: ['choice'],
    tone: 'cream',
    body: 'What we owe. What we refuse.',
  },
];

const UPDATES = [
  {
    date: '2026.07.25',
    kind: 'design',
    title: 'Metal & Pages goes magazine',
    body: 'White field, teal accent.',
  },
  {
    date: '2026.07.17',
    kind: 'bookclub',
    title: 'Metal & Pages opens',
    body: 'Didion shelf first.',
  },
  {
    date: '2026.07.17',
    kind: 'shelf',
    title: 'Library pull from Apple Books',
    body: 'Didion core plus adjacent voltage.',
  },
];

function BookObject({
  book,
  featured,
}: {
  book: Book;
  featured?: boolean;
}) {
  return (
    <article
      className={`arc-book${featured ? ' arc-book--featured' : ''} arc-book--${book.tone ?? 'cream'}`}
    >
      <div className="arc-book-object" aria-hidden>
        <span className="arc-book-spine" />
        <span className="arc-book-face">
          <span className="arc-book-face-author">{book.author}</span>
          <span className="arc-book-face-title">{book.title}</span>
        </span>
      </div>
      <h2 className="arc-book-title">{book.title}</h2>
      <p className="arc-book-meta">
        {book.author}
        {book.status ? ` · ${book.status}` : ''}
      </p>
      <p className="arc-book-note">{book.body}</p>
    </article>
  );
}

export default function UpdatesPage() {
  return (
    <ArchivePage
      room="club"
      title="book club"
      dek="Didion on the desk."
    >
      <section className="arc-section" aria-labelledby="desk-photo">
        <p className="arc-kicker" id="desk-photo">
          desk
        </p>
        <figure className="arc-hero-visual">
          <Image
            src="/dispatch-covers/books-joan-didion-readings.jpg"
            alt="Annotated readings from the work of Joan Didion"
            width={1600}
            height={1200}
            priority
            sizes="(min-width: 820px) 820px, 100vw"
          />
        </figure>
      </section>

      <section className="arc-section" id="this-issue" aria-labelledby="current-reading">
        <p className="arc-kicker" id="current-reading">
          current reading
        </p>
        <BookObject book={FEATURED} featured />
      </section>

      <section className="arc-section" id="didion-shelf" aria-labelledby="shelf-label">
        <p className="arc-kicker" id="shelf-label">
          didion desk
        </p>
        <div className="arc-book-shelf">
          {DIDION_SHELF.map((book) => (
            <BookObject key={book.title} book={book} />
          ))}
        </div>
      </section>

      <section className="arc-section" id="adjacent-shelf" aria-labelledby="reading-now">
        <p className="arc-kicker" id="reading-now">
          adjacent
        </p>
        <div className="arc-book-shelf">
          {ADJACENT.map((book) => (
            <BookObject key={book.title} book={book} />
          ))}
        </div>
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
