'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
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
  type ShelfItem,
} from '../../../lib/watchListeningShelf';
import './watch-shelf.css';

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

function ShelfObject({ item, selected }: { item: ShelfItem; selected: boolean }) {
  return (
    <span className={`watch-obj watch-obj--${item.object}`} aria-hidden={item.object !== 'cover'}>
      {item.object === 'cover' && item.cover ? (
        <Image
          src={item.cover}
          alt=""
          width={72}
          height={108}
          className="watch-obj-cover"
          style={{ objectFit: 'contain' }}
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
      {item.object === 'slip' ? <span className="watch-slip-mark" data-on={selected ? '1' : undefined} /> : null}
    </span>
  );
}

const HASH_EVENT = 'watch-shelf-hash';

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

  const select = useCallback((id: string) => {
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

  return (
    <ArchivePage
      room="shelf"
      date="2026.07.12"
      title="watch / listening shelf"
      dek="things that tune the eye and ear"
    >
      <div className="watch-shelf">
        <div className="watch-shelf-split">
          <nav
            className="watch-shelf-index"
            aria-label="shelf objects"
            onKeyDown={onIndexKey}
          >
            {SHELF_GROUPS.map((group) => {
              const items = SHELF_ITEMS.filter((item) => item.section === group.section);
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
                  <ul className="watch-shelf-row">
                    {items.map((item) => {
                      const on = item.id === selected.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            id={item.id}
                            className={`watch-shelf-item${on ? ' is-on' : ''}${item.featured ? ' is-featured' : ''}`}
                            aria-pressed={on}
                            aria-current={on ? 'true' : undefined}
                            onClick={() => select(item.id)}
                          >
                            <ShelfObject item={item} selected={on} />
                            <span className="watch-shelf-item-copy">
                              <span className="watch-shelf-item-title">{item.title}</span>
                              <span className="watch-shelf-item-type">{item.type}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </nav>

          <article className="watch-shelf-detail" aria-live="polite">
            {selected.cover ? (
              <div className="watch-shelf-detail-cover">
                <Image
                  src={selected.cover}
                  alt=""
                  width={220}
                  height={320}
                  className="watch-shelf-detail-image"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div className="watch-shelf-detail-object" data-object={selected.object}>
                <ShelfObject item={selected} selected />
              </div>
            )}
            <p className="watch-shelf-detail-kicker">
              {selected.type}
              {selected.creator ? ` · ${selected.creator}` : ''}
            </p>
            <h2 className="watch-shelf-detail-title">{selected.title}</h2>
            {selected.source ? <p className="watch-shelf-detail-source">{selected.source}</p> : null}
            <dl className="watch-shelf-fields">
              <div>
                <dt>why it stays</dt>
                <dd>{selected.note}</dd>
              </div>
            </dl>
            {selected.tags?.length ? (
              <p className="watch-shelf-tags">{selected.tags.join(' / ')}</p>
            ) : null}
            {selected.href ? (
              <OpenHref href={selected.href} className="watch-shelf-open">
                open ↗
              </OpenHref>
            ) : null}
            {owner ? <p className="watch-shelf-owner">owner · edit later</p> : null}
          </article>
        </div>
      </div>
    </ArchivePage>
  );
}
