'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import ArchivePage from '../../_archive/ArchivePage';
import {
  FEATURED_SHELF_ID,
  SHELF_GROUPS,
  SHELF_ITEMS,
  resolveShelfHash,
  shelfItemById,
  shelfRowsInSection,
  type ShelfItem,
} from '../../../lib/watchListeningShelf';
import type { ShelfProgress, ShelfReadingState } from '../../../lib/shelfReadingStore';
import {
  mergeReadingStates,
  readLocalShelfReading,
  writeLocalShelfReading,
} from './shelfReadingLocal';
import './watch-shelf.css';

const OwnerEpubReader = dynamic(() => import('./OwnerEpubReader'), { ssr: false });

function OpenHref({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (/^https?:\/\//.test(href)) {
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

function coverKindClass(kind: ShelfItem['coverKind']): string {
  if (kind === 'still') return ' is-still';
  if (kind === 'spine') return ' is-spine';
  if (kind === 'object') return ' is-object';
  if (kind === 'cutout') return ' is-cutout';
  if (kind === 'framed') return ' is-framed';
  return '';
}

function ShelfObject({ item }: { item: ShelfItem }) {
  const still = item.coverKind === 'still';
  const spinePhoto = item.coverKind === 'spine';
  const objectPhoto = item.coverKind === 'object';
  const cutout = item.coverKind === 'cutout';
  const framed = item.coverKind === 'framed';
  const ridgeFill = spinePhoto || objectPhoto;
  return (
    <span
      className={`watch-obj watch-obj--${item.object}${coverKindClass(item.coverKind)}`}
      aria-hidden={item.object !== 'cover'}
    >
      {item.object === 'cover' && item.cover ? (
        <Image
          src={item.cover}
          alt=""
          width={cutout ? 140 : framed ? 160 : spinePhoto ? 90 : still || objectPhoto ? 160 : 72}
          height={cutout ? 180 : framed ? 130 : spinePhoto ? 160 : still || objectPhoto ? 90 : 108}
          className={`watch-obj-cover${coverKindClass(item.coverKind)}`}
          style={{
            objectFit: ridgeFill ? 'cover' : 'contain',
            width: ridgeFill ? undefined : 'auto',
            height: ridgeFill ? undefined : cutout ? 92 : framed ? 76 : 72,
            background: 'transparent',
          }}
        />
      ) : null}
      {item.object === 'cassette' ? (
        <span className="watch-cassette">
          <span className="watch-cassette-window">
            <span className="watch-cassette-reel" />
            <span className="watch-cassette-reel" />
          </span>
        </span>
      ) : null}
      {item.object === 'spine' ? <span className="watch-spine">{item.title}</span> : null}
    </span>
  );
}

const HASH_EVENT = 'watch-shelf-hash';
const EMPTY_READING: ShelfReadingState = {
  favorites: [],
  currentlyReading: null,
  progress: {},
};

function subscribeShelfHash(onStoreChange: () => void) {
  const onChange = () => onStoreChange();
  window.addEventListener('hashchange', onChange);
  window.addEventListener(HASH_EVENT, onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(HASH_EVENT, onChange);
  };
}

function readShelfHash() {
  return resolveShelfHash(window.location.hash);
}

export default function WatchShelf({ owner }: { owner: boolean }) {
  const selectedId = useSyncExternalStore(
    subscribeShelfHash,
    readShelfHash,
    () => FEATURED_SHELF_ID,
  );
  const selected = shelfItemById(selectedId) ?? SHELF_ITEMS[0];

  const [available, setAvailable] = useState<string[]>([]);
  const [reading, setReading] = useState<ShelfReadingState>(() => {
    if (typeof window === 'undefined') return EMPTY_READING;
    return readLocalShelfReading();
  });
  const [readingSlug, setReadingSlug] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const select = useCallback((id: string) => {
    setReadingSlug((prev) => (prev && prev !== id ? null : prev));
    const url = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new Event(HASH_EVENT));
  }, []);

  const onIndexKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const ids = SHELF_ITEMS.map((item) => item.id);
    const index = Math.max(0, ids.indexOf(selectedId));
    const next =
      event.key === 'ArrowDown'
        ? ids[Math.min(ids.length - 1, index + 1)]
        : ids[Math.max(0, index - 1)];
    select(next);
  };

  useEffect(() => {
    if (!owner) return;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/owner/shelf/catalog', { credentials: 'same-origin' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          available?: string[];
          reading?: ShelfReadingState;
        };
        if (cancelled) return;
        setAvailable(Array.isArray(data.available) ? data.available : []);
        if (data.reading) {
          const merged = mergeReadingStates(data.reading, readLocalShelfReading());
          setReading(merged);
          writeLocalShelfReading(merged);
        }
      } catch {
        /* keep local */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [owner]);


  const persistReading = useCallback(async (next: ShelfReadingState) => {
    setReading(next);
    writeLocalShelfReading(next);
    try {
      await fetch('/api/owner/shelf/reading', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favorites: next.favorites,
          currentlyReading: next.currentlyReading,
          progress: next.progress,
        }),
      });
    } catch {
      /* local already saved */
    }
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!owner || selected.type !== 'book') return;
    const on = reading.favorites.includes(selected.id);
    const favorites = on
      ? reading.favorites.filter((id) => id !== selected.id)
      : [...reading.favorites, selected.id];
    void persistReading({ ...reading, favorites });
  }, [owner, selected, reading, persistReading]);

  const setCurrentlyReading = useCallback(() => {
    if (!owner || selected.type !== 'book') return;
    const next =
      reading.currentlyReading === selected.id ? null : selected.id;
    void persistReading({ ...reading, currentlyReading: next });
  }, [owner, selected, reading, persistReading]);

  const onProgress = useCallback(
    (slug: string, progress: ShelfProgress) => {
      setReading((prev) => {
        const next = {
          ...prev,
          currentlyReading: prev.currentlyReading ?? slug,
          progress: { ...prev.progress, [slug]: progress },
        };
        writeLocalShelfReading(next);
        if (progressTimer.current) clearTimeout(progressTimer.current);
        progressTimer.current = setTimeout(() => {
          void fetch('/api/owner/shelf/reading', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              progress: { [slug]: progress },
              currentlyReading: next.currentlyReading,
            }),
          }).catch(() => undefined);
        }, 400);
        return next;
      });
    },
    [],
  );

  const hasEpub = owner && selected.type === 'book' && available.includes(selected.id);
  const showReader = Boolean(hasEpub && readingSlug === selected.id);
  const isFavorite = reading.favorites.includes(selected.id);
  const isCurrent = reading.currentlyReading === selected.id;
  const progress = reading.progress[selected.id];
  const progressPct =
    progress && typeof progress.percent === 'number'
      ? Math.round(progress.percent * 100)
      : null;

  const favoriteSet = useMemo(() => new Set(reading.favorites), [reading.favorites]);

  return (
    <ArchivePage
      room="shelf"
      date="2026.07.12"
      title="watch / listening shelf"
      dek="things that tune the eye and ear"
    >
      <div className="watch-shelf">
        <div className={`watch-shelf-split${showReader ? ' is-reading' : ''}`}>
          <nav
            className="watch-shelf-index"
            aria-label="shelf objects"
            onKeyDown={onIndexKey}
          >
            {SHELF_GROUPS.map((group) => {
              const rows = shelfRowsInSection(group.section);
              return (
                <section
                  key={group.section}
                  className="watch-shelf-group"
                  aria-labelledby={`shelf-${group.section}`}
                >
                  {group.anchors.map((anchor) => (
                    <span key={anchor} id={anchor} className="watch-shelf-anchor" />
                  ))}
                  <h2 className="watch-shelf-kicker" id={`shelf-${group.section}`}>
                    {group.label}
                  </h2>
                  {rows.map((row) => {
                    const ridge =
                      row.row === 'watch' ||
                      row.row === 'notes' ||
                      row.row === 'video' ||
                      row.row === 'living' ||
                      row.row === 'scent' ||
                      row.row === 'gallery';
                    return (
                      <div key={row.row} className="watch-shelf-lane">
                        {row.label ? (
                          <p className="watch-shelf-subkicker">{row.label}</p>
                        ) : null}
                        <ul
                          className={`watch-shelf-row${ridge ? ' watch-shelf-row--ridge' : ''}`}
                          data-testid={`watch-shelf-row-${row.row}`}
                        >
                          {row.items.map((item) => {
                            const on = item.id === selected.id;
                            const fav = owner && favoriteSet.has(item.id);
                            const cur = owner && reading.currentlyReading === item.id;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  id={item.id}
                                  className={`watch-shelf-item${on ? ' is-on' : ''}${item.featured ? ' is-featured' : ''}${coverKindClass(item.coverKind)}${fav ? ' is-favorite' : ''}${cur ? ' is-current' : ''}`}
                                  aria-pressed={on}
                                  aria-current={on ? 'true' : undefined}
                                  onClick={() => select(item.id)}
                                >
                                  <ShelfObject item={item} />
                                  <span className="watch-shelf-item-copy">
                                    <span className="watch-shelf-item-title">{item.title}</span>
                                    <span className="watch-shelf-item-type">
                                      {item.type}
                                      {cur ? ' · reading' : fav ? ' · ♥' : ''}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </nav>

          <article className="watch-shelf-detail" aria-live="polite">
            {showReader ? (
              <OwnerEpubReader
                slug={selected.id}
                title={selected.title}
                initialCfi={progress?.cfi ?? null}
                onProgress={onProgress}
                onClose={() => setReadingSlug(null)}
              />
            ) : (
              <>
                {selected.cover ? (
                  <div className="watch-shelf-detail-cover">
                    <Image
                      src={selected.cover}
                      alt=""
                      width={
                        selected.coverKind === 'framed'
                          ? 880
                          : selected.coverKind === 'still' || selected.coverKind === 'object'
                            ? 320
                            : selected.coverKind === 'cutout'
                              ? 280
                              : selected.coverKind === 'spine'
                                ? 180
                                : 220
                      }
                      height={
                        selected.coverKind === 'framed'
                          ? 714
                          : selected.coverKind === 'still' || selected.coverKind === 'object'
                            ? 180
                            : selected.coverKind === 'cutout'
                              ? 360
                              : selected.coverKind === 'spine'
                                ? 320
                                : 320
                      }
                      className={`watch-shelf-detail-image${coverKindClass(selected.coverKind)}`}
                      quality={selected.coverKind === 'framed' ? 90 : undefined}
                      sizes={
                        selected.coverKind === 'framed' ? '(min-width: 900px) 560px, 92vw' : undefined
                      }
                      style={{ objectFit: 'contain', background: 'transparent' }}
                    />
                  </div>
                ) : (
                  <div className="watch-shelf-detail-object" data-object={selected.object}>
                    <ShelfObject item={selected} />
                  </div>
                )}
                <p className="watch-shelf-detail-kicker">
                  {selected.type}
                  {selected.creator ? ` · ${selected.creator}` : ''}
                </p>
                <h2 className="watch-shelf-detail-title" data-testid="watch-shelf-detail-title">
                  {selected.title}
                </h2>
                {selected.source ? <p className="watch-shelf-detail-source">{selected.source}</p> : null}
                {selected.note ? (
                  <dl className="watch-shelf-fields">
                    <div>
                      <dt>why it stays</dt>
                      <dd>{selected.note}</dd>
                    </div>
                  </dl>
                ) : owner ? (
                  <dl className="watch-shelf-fields">
                    <div>
                      <dt>why it stays</dt>
                      <dd className="watch-shelf-note-pending">drop a note later</dd>
                    </div>
                  </dl>
                ) : null}
                {selected.tags?.length ? (
                  <p className="watch-shelf-tags">{selected.tags.join(' / ')}</p>
                ) : null}
                {selected.href ? (
                  <OpenHref href={selected.href} className="watch-shelf-open">
                    open ↗
                  </OpenHref>
                ) : null}

                {owner && selected.type === 'book' ? (
                  <div className="watch-shelf-owner-actions">
                    <button
                      type="button"
                      className={`watch-shelf-owner-btn${isFavorite ? ' is-on' : ''}`}
                      onClick={toggleFavorite}
                      aria-pressed={isFavorite}
                    >
                      {isFavorite ? '♥ favorite' : '♡ favorite'}
                    </button>
                    <button
                      type="button"
                      className={`watch-shelf-owner-btn${isCurrent ? ' is-on' : ''}`}
                      onClick={setCurrentlyReading}
                      aria-pressed={isCurrent}
                    >
                      {isCurrent ? 'reading now' : 'mark reading'}
                    </button>
                    {hasEpub ? (
                      <button
                        type="button"
                        className="watch-shelf-owner-btn watch-shelf-owner-btn--read"
                        onClick={() => setReadingSlug(selected.id)}
                        data-testid="owner-open-epub"
                      >
                        read
                        {progressPct != null ? ` · ${progressPct}%` : ''}
                      </button>
                    ) : (
                      <p className="watch-shelf-owner-hint">
                        drop {selected.id}.epub into .data/shelf-epubs/ to read
                      </p>
                    )}
                    {progressPct != null ? (
                      <p className="watch-shelf-owner-progress" data-testid="owner-shelf-progress">
                        {progressPct}%
                        {progress?.page != null ? ` · p.${progress.page}` : ''}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {owner ? <p className="watch-shelf-owner">owner · private shelf</p> : null}
              </>
            )}
          </article>
        </div>
      </div>
    </ArchivePage>
  );
}
