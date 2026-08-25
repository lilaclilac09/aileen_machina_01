'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { slugify } from '../_archive/ArchiveIndex';
import ArchivePage from '../_archive/ArchivePage';
import './updates.css';

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

type UpdateNote = {
  date: string;
  kind: string;
  title: string;
  body: string;
  href?: string;
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

const UPDATES: UpdateNote[] = [
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

const MONTH_LABELS = [
  '',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

function groupNotesByYear(notes: UpdateNote[]) {
  const byYear = new Map<string, Map<number, UpdateNote[]>>();
  for (const note of notes) {
    const year = note.date.slice(0, 4);
    const month = Number(note.date.slice(5, 7));
    if (!byYear.has(year)) byYear.set(year, new Map());
    const months = byYear.get(year)!;
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(note);
  }

  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, months]) => ({
      year,
      id: `year-${year}`,
      months: [...months.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, items]) => ({
          month,
          label: MONTH_LABELS[month] || String(month).padStart(2, '0'),
          items,
        })),
    }));
}

const YEAR_SECTIONS = groupNotesByYear(UPDATES);
const OPEN_NOTE_TITLES = new Set(UPDATES.slice(0, 2).map((note) => note.title));
const INDEX = [
  { id: 'latest', label: 'latest' },
  ...YEAR_SECTIONS.map((section) => ({ id: section.id, label: section.year })),
  { id: 'archive', label: 'archive' },
];

const BOOK_IDS = new Set(
  SHELF_GROUPS.flatMap((group) => [group.id, ...group.books.map((book) => slugify(book.title))]),
);
const NOTE_YEAR = new Map(UPDATES.map((note) => [slugify(note.title), `year-${note.date.slice(0, 4)}`]));

function sectionForHash(id: string): string | null {
  if (
    id === 'latest' ||
    id === 'this-issue' ||
    id === 'reading-threads' ||
    id === slugify(FEATURED.title)
  ) {
    return 'latest';
  }
  if (id === 'archive' || id === 'didion-shelf' || BOOK_IDS.has(id)) return 'archive';
  if (id.startsWith('year-') || id === 'updates-log') {
    return id === 'updates-log' ? (YEAR_SECTIONS[0]?.id ?? 'latest') : id;
  }
  return NOTE_YEAR.get(id) ?? null;
}

function openDrawer(id: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLDetailsElement) el.open = true;
}

function bindDefaultOpen(defaultOpen: boolean) {
  return (el: HTMLDetailsElement | null) => {
    if (!el || !defaultOpen || el.dataset.updatesInit) return;
    el.open = true;
    el.dataset.updatesInit = '1';
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
  children: ReactNode;
  testId?: string;
}) {
  return (
    <details
      id={id}
      className="updates-drawer"
      data-testid={testId}
      ref={bindDefaultOpen(defaultOpen)}
    >
      <summary className="updates-drawer-label">{label}</summary>
      {children}
    </details>
  );
}

function FoldRow({
  id,
  title,
  date,
  tag,
  meta,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  date?: string;
  tag?: string;
  meta?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} className="updates-row" ref={bindDefaultOpen(defaultOpen)}>
      <summary className="updates-row-summary">
        {date ? <span className="updates-row-date">{date}</span> : null}
        <span className="updates-row-title">{title}</span>
        {tag ? <span className="updates-row-tag">{tag}</span> : null}
        {meta ? <span className="updates-row-meta">{meta}</span> : null}
      </summary>
      <div className="updates-row-panel">{children}</div>
    </details>
  );
}

export default function UpdatesPage() {
  const [active, setActive] = useState(INDEX[0]?.id ?? 'latest');

  const goTo = useCallback((hashId: string) => {
    const key = hashId.replace(/^#/, '');
    const section = sectionForHash(key);
    if (section) {
      openDrawer(section);
      setActive(section);
    }
    const target = document.getElementById(key);
    if (target instanceof HTMLDetailsElement) target.open = true;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace(/^#/, '');
      if (!raw) return;
      const section = sectionForHash(raw);
      if (section) openDrawer(section);
      const target = document.getElementById(raw);
      if (target instanceof HTMLDetailsElement) target.open = true;
      target?.scrollIntoView({ block: 'start' });
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <ArchivePage
      room="club"
      title="book club"
      dek="Didion on the desk. Why these books share a room."
    >
      <div className="arc-stage updates-stage">
        <nav className="updates-index" aria-label="update index" data-testid="updates-index">
          {INDEX.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={active === item.id ? 'is-active' : undefined}
              aria-current={active === item.id ? 'location' : undefined}
              data-testid={`updates-index-${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                goTo(item.id);
                history.replaceState(null, '', `#${item.id}`);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="arc-stage-main updates-log">
          <Drawer id="latest" label="latest" defaultOpen testId="updates-drawer-latest">
            <span id="this-issue" className="shelf-hash-alias" />
            <span id="reading-threads" className="shelf-hash-alias" />
            <ul className="updates-threads" aria-label="reading threads">
              {READING_THREADS.map((thread) => (
                <li key={thread}>{thread}</li>
              ))}
            </ul>
            <FoldRow
              id={slugify(FEATURED.title)}
              title={FEATURED.title}
              tag={FEATURED.status}
              meta={FEATURED.author}
              defaultOpen
            >
              <p>{FEATURED.why}</p>
              <p>{FEATURED.body}</p>
              <dl className="updates-fields">
                <div>
                  <dt>mood</dt>
                  <dd>{FEATURED.mood}</dd>
                </div>
                <div>
                  <dt>thread</dt>
                  <dd>{FEATURED.thread}</dd>
                </div>
              </dl>
            </FoldRow>
          </Drawer>

          {YEAR_SECTIONS.map((section, index) => (
            <Drawer
              key={section.id}
              id={section.id}
              label={section.year}
              defaultOpen={index === 0}
              testId={`updates-drawer-${section.id}`}
            >
              {index === 0 ? <span id="updates-log" className="shelf-hash-alias" /> : null}
              {section.months.map((month) => (
                <div
                  key={`${section.year}-${month.month}`}
                  className="updates-month"
                  id={`${section.id}-${String(month.month).padStart(2, '0')}`}
                >
                  <p className="updates-month-label">
                    {month.label} {section.year}
                  </p>
                  {month.items.map((note) => (
                    <FoldRow
                      key={note.title}
                      id={slugify(note.title)}
                      date={note.date}
                      title={note.title}
                      tag={note.kind}
                      defaultOpen={OPEN_NOTE_TITLES.has(note.title)}
                    >
                      <p>{note.body}</p>
                      {note.href ? (
                        <ul className="updates-row-links">
                          <li>
                            <a href={note.href}>open ↗</a>
                          </li>
                        </ul>
                      ) : null}
                    </FoldRow>
                  ))}
                </div>
              ))}
            </Drawer>
          ))}

          <Drawer id="archive" label="archive" testId="updates-drawer-archive">
            <span id="didion-shelf" className="shelf-hash-alias" />
            {SHELF_GROUPS.map((group) => (
              <div key={group.id} className="updates-month" id={group.id}>
                <p className="updates-shelf-label" id={`${group.id}-title`}>
                  {group.title}
                </p>
                <p className="updates-shelf-dek">{group.dek}</p>
                {group.books.map((book) => (
                  <FoldRow
                    key={book.title}
                    id={slugify(book.title)}
                    title={book.title}
                    tag={book.status ?? book.tags[0]}
                    meta={book.author}
                  >
                    <p>{book.body}</p>
                  </FoldRow>
                ))}
              </div>
            ))}
          </Drawer>
        </div>
      </div>
    </ArchivePage>
  );
}
