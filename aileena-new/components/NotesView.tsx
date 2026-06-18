'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { NotesCategory } from '../lib/notes/types';

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
 * Apple Notes–style list.
 *
 *   left  — sidebar of categories (sticky on desktop, segmented strip on mobile)
 *   right — items in the active category, each ○ Title | Author
 *
 * Click the ○ to toggle a per-visitor "saved" mark (persisted in localStorage).
 * Click the title row to navigate to the item's url (if any) in a new tab.
 *
 * Aesthetic is a deliberate copy of macOS Notes: white background, system-ui,
 * minimal chrome. Sits inside the rest of the site's dark theme via a wrapper
 * that resets the background.
 */
export default function NotesView({ categories }: { categories: NotesCategory[] }) {
  const [activeSlug, setActiveSlug] = useState<string>(categories[0]?.slug ?? '');
  const [checked, setChecked] = useState<CheckedMap>({});
  const [mounted, setMounted] = useState(false);

  // Restore checked state once on mount + flag that we're hydrated. Until
  // mounted is true, every checkbox renders as unchecked — avoids an SSR/CSR
  // mismatch warning.
  useEffect(() => {
    setChecked(readChecked());
    setMounted(true);
  }, []);

  const active = useMemo(
    () => categories.find((c) => c.slug === activeSlug) ?? categories[0],
    [categories, activeSlug],
  );

  function toggle(slug: string, id: string) {
    const k = `${slug}:${id}`;
    const next = { ...checked };
    if (next[k]) delete next[k];
    else next[k] = true;
    setChecked(next);
    writeChecked(next);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f6] text-[#1d1d1f]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
      {/* Top chrome — back link + traffic-light flavour */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#f6f6f6]/95 backdrop-blur border-b border-black/[0.08]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="inline-block w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="inline-block w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-[#6e6e73] uppercase tracking-[0.18em]">Notes</span>
        </div>
        <Link
          href="/"
          className="text-xs sm:text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          ← Home
        </Link>
      </header>

      {/* Mobile sidebar — horizontal segmented strip across the top of the list */}
      <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 py-2.5 bg-white border-b border-black/[0.06]">
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setActiveSlug(c.slug)}
            className={
              'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ' +
              (c.slug === active.slug
                ? 'bg-[#1d1d1f] text-white'
                : 'text-[#1d1d1f] hover:bg-black/[0.04]')
            }
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Body — desktop two-column */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-black/[0.08] bg-[#ececec]">
          <div className="px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-[#6e6e73]">
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
                        ? 'bg-black/[0.08] text-[#1d1d1f] font-semibold'
                        : 'text-[#1d1d1f]/90 hover:bg-black/[0.04]')
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
        <main className="flex-1 min-w-0 overflow-y-auto bg-white">
          <div className="max-w-[840px] mx-auto px-6 sm:px-10 pt-8 pb-24">
            <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight mb-5">
              {active.label}
            </h1>

            {active.items.length === 0 ? (
              <p className="text-[15px] text-[#6e6e73]">
                Empty list. Add items in <code className="font-mono text-sm">data/notes/{active.slug}.json</code>.
              </p>
            ) : (
              <ul className="divide-y divide-black/[0.05]">
                {active.items.map((item) => {
                  const k = `${active.slug}:${item.id}`;
                  const isChecked = mounted && Boolean(checked[k]);
                  return (
                    <li key={item.id} className="flex items-start gap-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(active.slug, item.id)}
                        aria-pressed={isChecked}
                        aria-label={isChecked ? 'Unmark as saved' : 'Mark as saved'}
                        className={
                          'mt-1 w-[18px] h-[18px] shrink-0 rounded-full border transition-colors flex items-center justify-center ' +
                          (isChecked
                            ? 'bg-[#1d1d1f] border-[#1d1d1f]'
                            : 'border-[#c7c7cc] hover:border-[#1d1d1f]')
                        }
                      >
                        {isChecked && (
                          <svg
                            viewBox="0 0 12 12"
                            className="w-[10px] h-[10px] text-white"
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

                      {item.url ? (
                        <Link
                          href={item.url}
                          target={item.url.startsWith('http') ? '_blank' : undefined}
                          rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className={
                            'flex-1 text-[15px] leading-6 hover:text-[#0066cc] transition-colors ' +
                            (isChecked ? 'text-[#6e6e73] line-through' : 'text-[#1d1d1f]')
                          }
                        >
                          <span>{item.title}</span>
                          {item.author && (
                            <span className="text-[#6e6e73]"> | {item.author}</span>
                          )}
                        </Link>
                      ) : (
                        <span
                          className={
                            'flex-1 text-[15px] leading-6 ' +
                            (isChecked ? 'text-[#6e6e73] line-through' : 'text-[#1d1d1f]')
                          }
                        >
                          {item.title}
                          {item.author && (
                            <span className="text-[#6e6e73]"> | {item.author}</span>
                          )}
                        </span>
                      )}
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
