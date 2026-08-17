'use client';

import { slugify } from '../_archive/ArchiveIndex';
import ArchivePage from '../_archive/ArchivePage';

type Book = {
  title: string;
  author: string;
  tags: string[];
  body: string;
  status?: string;
};

type FeaturedBook = Book & {
  why: string;
  mood: string;
  thread: string;
};

type ShelfGroup = {
  id: string;
  title: string;
  dek: string;
  books: Book[];
};

const FEATURED: FeaturedBook = {
  title: 'The Year of Magical Thinking',
  author: 'Joan Didion',
  tags: ['grief', 'ritual', 'observation'],
  status: 'reading now',
  mood: 'grief as structure',
  thread: 'identity / loss / performance',
  why: 'The calibration text. Grief treated as structure, not sentiment.',
  body: 'She reports on her own mind without turning the room into a eulogy.',
};

const READING_THREADS = [
  'grief',
  'identity',
  'systems',
  'women writing',
  'performance',
] as const;

const DIDION_SHELF: Book[] = [
  {
    title: 'Slouching Towards Bethlehem',
    author: 'Joan Didion',
    tags: ['essays'],
    status: '31% in',
    body: 'the sentence as a measuring instrument',
  },
  {
    title: 'The White Album',
    author: 'Joan Didion',
    tags: ['essays'],
    body: 'fragmented america, fragmented self',
  },
  {
    title: 'Play It As It Lays',
    author: 'Joan Didion',
    tags: ['novel'],
    body: 'california as a nervous system',
  },
  {
    title: 'Notes to John',
    author: 'Joan Didion',
    tags: ['archive'],
    body: 'private record, public discomfort',
  },
  {
    title: 'Let Me Tell You What I Mean',
    author: 'Joan Didion',
    tags: ['essays'],
    body: 'later pieces, same steel',
  },
];

const SYSTEMS_SHELF: Book[] = [
  {
    title: 'Philosophy and Vulnerability',
    author: 'Matthew R. McLennan',
    tags: ['systems'],
    body: 'where exposure becomes a system problem',
  },
];

const ADJACENT: Book[] = [
  {
    title: 'Crying in H Mart',
    author: 'Michelle Zauner',
    tags: ['grief'],
    body: 'loss through the grocery aisle',
  },
  {
    title: 'Bad Feminist',
    author: 'Roxane Gay',
    tags: ['essays'],
    body: 'contradictions left on the table',
  },
  {
    title: 'On Earth We’re Briefly Gorgeous',
    author: 'Ocean Vuong',
    tags: ['identity'],
    body: 'a letter that becomes a life',
  },
  {
    title: 'Still Born',
    author: 'Guadalupe Nettel',
    tags: ['choice'],
    body: 'what we owe, what we refuse',
  },
];

const SHELF_GROUPS: ShelfGroup[] = [
  {
    id: 'didion-desk',
    title: 'didion desk',
    dek: 'sentences that cut without raising their voice.',
    books: DIDION_SHELF,
  },
  {
    id: 'systems-vulnerability',
    title: 'systems / vulnerability',
    dek: 'where exposure is treated as method, not branding.',
    books: SYSTEMS_SHELF,
  },
  {
    id: 'women-writing',
    title: 'women writing',
    dek: 'the same voltage: identity, grief, the social eye.',
    books: ADJACENT,
  },
];

const UPDATES = [
  {
    date: '2026.08.16',
    kind: 'design',
    title: 'Book club as a room',
    body: 'Current reading is the feature. Shelf splits so the page answers why these books share a room.',
  },
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
];

function BookRow({ book }: { book: Book }) {
  const tag = book.tags[0];
  return (
    <li id={slugify(book.title)} className="arc-book-row">
      <div className="arc-book-row-main">
        <span className="arc-item-title">{book.title}</span>
        <span className="arc-item-meta">
          {book.author}
          {book.status ? ` · ${book.status}` : ''}
        </span>
        <p className="arc-book-row-note">{book.body}</p>
      </div>
      {tag ? <span className="arc-book-row-tag">{tag}</span> : null}
    </li>
  );
}

export default function UpdatesPage() {
  return (
    <ArchivePage
      room="club"
      title="book club"
      dek="Didion on the desk. Why these books share a room."
    >
      <section className="arc-section" id="this-issue" aria-labelledby="current-reading">
        <p className="arc-kicker" id="current-reading">
          current reading
        </p>
        <article className="arc-feature" id={slugify(FEATURED.title)}>
          <div className="arc-feature-copy">
            <h2 className="arc-feature-title">{FEATURED.title}</h2>
            <p className="arc-feature-author">{FEATURED.author}</p>
            <p className="arc-why-label">why it’s here</p>
            <p className="arc-feature-why">{FEATURED.why}</p>
            <p className="arc-feature-note">{FEATURED.body}</p>
          </div>
          <dl className="arc-feature-meta">
            <div>
              <dt>mood</dt>
              <dd>{FEATURED.mood}</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>{FEATURED.status}</dd>
            </div>
            <div>
              <dt>thread</dt>
              <dd>{FEATURED.thread}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="arc-section" id="reading-threads" aria-labelledby="threads-label">
        <p className="arc-kicker" id="threads-label">
          reading threads
        </p>
        <ul className="arc-threads">
          {READING_THREADS.map((thread) => (
            <li key={thread}>{thread}</li>
          ))}
        </ul>
      </section>

      <section className="arc-section" id="didion-shelf" aria-labelledby="shelf-label">
        <p className="arc-kicker" id="shelf-label">
          shelf
        </p>
        {SHELF_GROUPS.map((group) => (
          <div
            key={group.id}
            className="arc-group"
            id={group.id}
            aria-labelledby={`${group.id}-title`}
          >
            <h3 className="arc-group-title" id={`${group.id}-title`}>
              {group.title}
            </h3>
            <p className="arc-group-dek">{group.dek}</p>
            <ul className="arc-list">
              {group.books.map((book) => (
                <BookRow key={book.title} book={book} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="arc-section" id="updates-log" aria-labelledby="notes-label">
        <p className="arc-kicker" id="notes-label">
          notes
        </p>
        <ul className="arc-list">
          {UPDATES.map((item) => (
            <li key={item.title} id={slugify(item.title)} className="arc-item">
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
