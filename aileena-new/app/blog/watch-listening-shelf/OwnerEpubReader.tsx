'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { Book, Rendition } from 'epubjs';
import type { ShelfProgress } from '../../../lib/shelfReadingStore';

type Props = {
  slug: string;
  title: string;
  initialCfi?: string | null;
  onProgress: (slug: string, progress: ShelfProgress) => void;
  onClose: () => void;
};

type RelocatedLocation = {
  start: { cfi: string; displayed?: { page: number; total: number } };
  atStart?: boolean;
  atEnd?: boolean;
  percentage?: number;
};

/**
 * Owner-only iBooks-inspired paginated reader.
 * Uses site serif stack (--arc-serif); no separate ebook font family.
 */
export default function OwnerEpubReader({
  slug,
  title,
  initialCfi,
  onProgress,
  onClose,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLabel, setPageLabel] = useState('—');
  const [percentLabel, setPercentLabel] = useState('0%');
  const lastCfiRef = useRef<string | null>(null);

  const report = useCallback(
    (loc: RelocatedLocation, locationsReady: boolean, book: Book) => {
      const cfi = loc.start?.cfi;
      if (!cfi) return;
      lastCfiRef.current = cfi;
      let percent = typeof loc.percentage === 'number' ? loc.percentage : 0;
      let page: number | null = loc.start.displayed?.page ?? null;
      if (locationsReady) {
        try {
          const fromLoc = book.locations.percentageFromCfi(cfi);
          if (typeof fromLoc === 'number' && Number.isFinite(fromLoc)) percent = fromLoc;
          const locIndex = book.locations.locationFromCfi(cfi);
          if (typeof locIndex === 'number' && Number.isFinite(locIndex)) page = locIndex + 1;
        } catch {
          /* keep displayed */
        }
      }
      const total = loc.start.displayed?.total;
      if (page != null && total) {
        setPageLabel(`${page} / ${total}`);
      } else if (page != null) {
        setPageLabel(String(page));
      }
      setPercentLabel(`${Math.round(percent * 100)}%`);
      onProgress(slug, {
        cfi,
        percent,
        page,
        updatedAt: Date.now(),
      });
    },
    [onProgress, slug],
  );

  useEffect(() => {
    let cancelled = false;
    let book: Book | null = null;
    let rendition: Rendition | null = null;

    async function boot() {
      setReady(false);
      setError(null);
      const host = hostRef.current;
      if (!host) return;

      try {
        const ePub = (await import('epubjs')).default;
        if (cancelled) return;

        book = ePub(`/api/owner/shelf/epub/${encodeURIComponent(slug)}`, {
          openAs: 'epub',
        });
        bookRef.current = book;

        rendition = book.renderTo(host, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        // Site fonts only — mirror archive.css --arc-serif / body stack.
        rendition.themes.default({
          body: {
            'font-family':
              "var(--arc-serif, 'Iowan Old Style', 'Charter', 'Georgia', 'Times New Roman', serif) !important",
            'font-size': '1.05rem !important',
            'line-height': '1.55 !important',
            color: '#111 !important',
            background: 'transparent !important',
            padding: '0 !important',
            margin: '0 !important',
          },
          p: {
            'font-family': 'inherit !important',
            'line-height': 'inherit !important',
          },
          a: { color: '#008f84 !important' },
        });

        await book.ready;
        if (cancelled) return;

        let locationsReady = false;
        book.locations
          .generate(1600)
          .then(() => {
            locationsReady = true;
          })
          .catch(() => {
            locationsReady = false;
          });

        rendition.on('relocated', (loc: RelocatedLocation) => {
          if (cancelled || !book) return;
          report(loc, locationsReady, book);
        });

        await rendition.display(initialCfi || undefined);
        if (cancelled) return;
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'failed to open epub';
        setError(message);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      try {
        renditionRef.current?.destroy();
      } catch {
        /* ignore */
      }
      try {
        bookRef.current?.destroy();
      } catch {
        /* ignore */
      }
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [slug, initialCfi, report]);

  const goPrev = useCallback(() => {
    void renditionRef.current?.prev();
  }, []);

  const goNext = useCallback(() => {
    void renditionRef.current?.next();
  }, []);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="shelf-reader"
      data-testid="owner-epub-reader"
      tabIndex={0}
      onKeyDown={onKey}
      aria-label={`Reading ${title}`}
    >
      <header className="shelf-reader-bar">
        <button type="button" className="shelf-reader-close" onClick={onClose}>
          close
        </button>
        <p className="shelf-reader-title">{title}</p>
        <p className="shelf-reader-meta" data-testid="owner-epub-progress">
          <span>{pageLabel}</span>
          <span aria-hidden="true"> · </span>
          <span>{percentLabel}</span>
        </p>
      </header>

      <div className="shelf-reader-stage">
        <button
          type="button"
          className="shelf-reader-nav shelf-reader-nav--prev"
          onClick={goPrev}
          aria-label="Previous page"
        >
          ‹
        </button>
        <div className="shelf-reader-page" ref={hostRef} />
        <button
          type="button"
          className="shelf-reader-nav shelf-reader-nav--next"
          onClick={goNext}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      {!ready && !error ? <p className="shelf-reader-status">opening…</p> : null}
      {error ? (
        <p className="shelf-reader-status is-error" role="alert">
          {error.includes('404') || error.toLowerCase().includes('not found')
            ? `no epub on disk — drop ${slug}.epub into .data/shelf-epubs/`
            : error}
        </p>
      ) : null}
    </div>
  );
}
