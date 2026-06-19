'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { NoteItem, NotesCategory } from '../lib/notes/types';

const STORAGE_KEY = 'aileena-notes-checked';

type CheckedMap = Record<string, true>;

function readChecked(): CheckedMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CheckedMap) : {};
  } catch {
    return {};
  }
}

function writeChecked(map: CheckedMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode / quota — silently drop */
  }
}

/**
 * iPhone Notes–style category list on the site's dark theme.
 *
 *   left:   sidebar of categories (sticky desktop, segmented strip on mobile)
 *   right:  items in the active category, each ○ Title | Author
 *
 *   Tap the ○      → toggle "saved" mark, no navigation
 *   Tap the title  → open the url (new tab for http(s)) AND auto-mark as
 *                    saved. iPhone Notes behaviour — you tapped to read
 *                    it, so it counts as read.
 *
 * Saved state is per-visitor, localStorage-only, no server involvement.
 */
export default function NotesView({ categories }: { categories: NotesCategory[] }) {
  const [activeSlug, setActiveSlug] = useState<string>(categories[0]?.slug ?? '');
  const [checked, setChecked] = useState<CheckedMap>({});
  const [mounted, setMounted] = useState(false);

  // Restore checked state once on mount + flag that we're hydrated. Until
  // mounted is true, every checkbox renders as unchecked — avoids SSR/CSR
  // mismatch.
  useEffect(() => {
    setChecked(readChecked());
    setMounted(true);
  }, []);

  const active = useMemo(
    () => categories.find((c) => c.slug === activeSlug) ?? categories[0],
    [categories, activeSlug],
  );

  function setMark(slug: string, id: string, value: boolean) {
    const k = `${slug}:${id}`;
    const next = { ...checked };
    if (value) next[k] = true;
    else delete next[k];
    setChecked(next);
    writeChecked(next);
  }

  function toggle(slug: string, id: string) {
    const k = `${slug}:${id}`;
    setMark(slug, id, !checked[k]);
  }

  function openAndMark(slug: string, item: NoteItem) {
    if (!item.url) return;
    setMark(slug, item.id, true);
    if (item.url.startsWith('http')) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(item.url);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#070707] text-white/90"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      {/* Top bar — minimal iOS-flavoured chrome */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#070707]/95 backdrop-blur border-b border-white/[0.06]">
        <Link
          href="/"
          className="text-xs sm:text-sm text-white/55 hover:text-[#00ffea] transition-colors"
        >
          ← Home
        </Link>
        <span className="text-[11px] tracking-[0.22em] uppercase text-white/35">Notes</span>
        <span className="w-12 text-right" aria-hidden /> {/* spacer balances the back link */}
      </header>

      {/* Mobile sidebar — horizontal segmented strip across the top of the list */}
      <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 py-2.5 bg-[#0a0a0a] border-b border-white/[0.04]">
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setActiveSlug(c.slug)}
            className={
              'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ' +
              (c.slug === active.slug
                ? 'bg-[#00ffea]/[0.12] text-[#00ffea]'
                : 'text-white/70 hover:bg-white/[0.04]')
            }
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Body — desktop two-column */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0c]">
          <div className="px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white/35">
            Notes
          </div>
          <ul className="flex-1 overflow-y-auto px-2 pb-6">
            {categories.map((c) => {
              const isActive = c.slug === active.slug;
              return (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => setActiveSlug(c.slug)}
                    className={
                      'w-full text-left px-3 py-1.5 rounded transition-colors text-[15px] ' +
                      (isActive
                        ? 'bg-[#00ffea]/[0.08] text-[#00ffea] font-semibold'
                        : 'text-white/80 hover:bg-white/[0.04]')
                    }
                  >
                    {c.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right pane — items */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#070707]">
          <div className="max-w-[840px] mx-auto px-6 sm:px-10 pt-8 pb-24">
            <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight mb-5 text-white">
              {active.label}
            </h1>

            {active.items.length === 0 ? (
              <p className="text-[15px] text-white/45">
                Empty list. Add items in{' '}
                <code className="font-mono text-sm text-white/55">data/notes/{active.slug}.json</code>.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {active.items.map((item) => {
                  const k = `${active.slug}:${item.id}`;
                  const isChecked = mounted && Boolean(checked[k]);
                  const hasUrl = Boolean(item.url);
                  return (
                    <li
                      key={item.id}
                      className={
                        'flex items-start gap-3 py-2.5 px-1 rounded transition-colors ' +
                        (hasUrl ? 'cursor-pointer hover:bg-white/[0.04]' : '')
                      }
                      onClick={() => hasUrl && openAndMark(active.slug, item)}
                    >
                      {/* Circle — pure toggle, doesn't navigate. */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(active.slug, item.id);
                        }}
                        aria-pressed={isChecked}
                        aria-label={isChecked ? 'Unmark as read' : 'Mark as read'}
                        className={
                          'mt-1 w-[18px] h-[18px] shrink-0 rounded-full border transition-colors flex items-center justify-center ' +
                          (isChecked
                            ? 'bg-[#00ffea] border-[#00ffea]'
                            : 'border-white/30 hover:border-[#00ffea]')
                        }
                      >
                        {isChecked && (
                          <svg
                            viewBox="0 0 12 12"
                            className="w-[10px] h-[10px] text-black"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                          </svg>
                        )}
                      </button>

                      {/* Title row — visually a link when there's a url. Click is
                          handled by the parent <li>, so this stays a span. */}
                      <span
                        className={
                          'flex-1 text-[15px] leading-6 transition-colors ' +
                          (isChecked
                            ? 'text-white/40 line-through'
                            : hasUrl
                              ? 'text-white/90 hover:text-[#00ffea]'
                              : 'text-white/90')
                        }
                      >
                        {item.title}
                        {item.author && (
                          <span className={isChecked ? 'text-white/35' : 'text-white/45'}>
                            {' '}| {item.author}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
