'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PillToggle from './PillToggle';
import './writing-wall.css';

type WallView = 'rack' | 'wall';
const VIEW_KEY = 'writing-wall-view';

const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const serif = 'Georgia, Times New Roman, serif';
const ink = '#14110c';
const teal = '#00a99f';

export type Rail = 'dispatch' | 'investing' | 'woman' | 'mars';

export type WallPost = {
  date: string;
  href: string;
  title: string;
  body: string;
  rail: Rail;
  /** The rail's own tag, already translated — printed on the plate. */
  railLabel: string;
};

export type WallCopy = {
  kicker: string;
  heading: string;
  body: string;
  cta: string;
  modeRack: string;
  modeWall: string;
  modeLabel: string;
  rack: string;
  rackHint: string;
  wall: string;
  wallHint: string;
};

/** Copy carries counts as {n} so EN and DE can put the number where it belongs. */
function withCount(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

/**
 * Writing wall — the picture entrance to everything she has written.
 *
 *   rack — a cover flow you push with your thumb, for browsing by feel
 *   wall — every cover at once, for finding one piece
 *
 * Covers: five pieces own a real photograph. The rest get a typeset cover
 * built from the rail's colour, so the wall reads as one designed archive
 * instead of the same four stock photos repeating fourteen times.
 */

const RAIL_FACE: Record<Rail, { ground: string; glow: string }> = {
  dispatch: { ground: '#0d1110', glow: 'rgba(0,169,159,0.42)' },
  investing: { ground: '#171208', glow: 'rgba(201,135,47,0.40)' },
  woman: { ground: '#33100f', glow: 'rgba(233,130,157,0.36)' },
  mars: { ground: '#0f1626', glow: 'rgba(120,164,255,0.34)' },
};

/** Only pieces with a photograph that actually means something. */
const PHOTO_BY_SLUG: Record<string, string> = {
  harassment: '/dispatch-covers/harassment.jpg',
  misread: '/dispatch-covers/misread-boy-girl.jpg',
  'watch-listening-shelf': '/dispatch-covers/books-joan-didion-readings.jpg',
  'third-culture-power': '/dispatch-covers/fashion-simon-encouragement.jpg',
  'nvidia-flywheel': '/dispatch-covers/investing-hero.jpg',
};

function slugOf(href: string): string {
  return href.replace(/^\/blog\//, '');
}

function hashOf(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * The plate — the work itself, and nothing else on it. Five pieces own a
 * photograph; the rest get a colour plate carrying only its rail, the way
 * a catalogue prints a tinted plate when there is no reproduction.
 * Identification happens on the label underneath, never over the work.
 */
function CoverPlate({ post, compact }: { post: WallPost; compact?: boolean }) {
  const slug = slugOf(post.href);
  const photo = PHOTO_BY_SLUG[slug];
  const face = RAIL_FACE[post.rail];
  const pad = compact ? 9 : 14;

  const h = hashOf(slug);
  // Spin the light per piece so a screen of colour plates reads as a set
  // rather than one swatch repeated.
  const angle = 118 + (h % 5) * 31;
  const originX = 16 + (h % 4) * 24;
  const lift = (h % 3) * 0.06;

  return (
    <>
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            className="wall-cover__img"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.92) contrast(1.04)',
            }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(9,10,11,0.14) 0%, transparent 42%, rgba(9,10,11,0.3) 100%)',
            }}
          />
        </>
      ) : (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(130% 95% at ${originX}% 4%, ${face.glow} 0%, transparent 60%), linear-gradient(${angle}deg, ${face.ground} 0%, rgba(8,9,10,${0.98 - lift}) 100%)`,
          }}
        />
      )}

      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: pad,
          top: pad,
          color: 'rgba(255,253,248,0.58)',
          fontFamily: mono,
          fontSize: compact ? '0.4rem' : '0.46rem',
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textShadow: photo ? '0 1px 8px rgba(0,0,0,0.7)' : 'none',
        }}
      >
        {post.railLabel}
      </span>

      <span
        aria-hidden
        className="wall-cover__sheen"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,253,248,0.12) 0%, transparent 45%)',
          opacity: 0,
        }}
      />
    </>
  );
}

/** Tombstone label — same voice as the glass bench: (01) then the title. */
function CoverLabel({ index, post, compact }: { index: number; post: WallPost; compact?: boolean }) {
  const n = String(index + 1).padStart(2, '0');
  return (
    <span className={compact ? 'wall-label wall-label--compact' : 'wall-label'}>
      <span className="wall-label__id">({n})</span> {post.title}
    </span>
  );
}

export default function WritingWall({ posts, copy }: { posts: WallPost[]; copy: WallCopy }) {
  const rackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [view, setView] = useState<WallView>('rack');

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(VIEW_KEY);
        if (saved === 'rack' || saved === 'wall') setView(saved);
      } catch {
        /* private mode */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const setViewPersist = useCallback((next: WallView) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* private mode */
    }
  }, []);

  const ordered = useMemo(() => {
    const seen = new Set<string>();
    return posts
      .filter((post) => {
        if (!post.href.startsWith('/blog/') || seen.has(post.href)) return false;
        seen.add(post.href);
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [posts]);

  const rack = ordered.slice(0, 10);

  // Depth painted off native scroll position, so iOS keeps its own momentum
  // and rubber-band. Focus sits left of centre: the shelf recedes rightward
  // instead of stranding an empty gutter before the newest cover.
  const paintRack = useCallback(() => {
    const el = rackRef.current;
    if (!el) return;
    const focus = el.scrollLeft + el.clientWidth * 0.3;
    const items = el.querySelectorAll<HTMLElement>('.wall-rack__item');
    items.forEach((item) => {
      const itemMid = item.offsetLeft + item.offsetWidth / 2;
      const d = Math.max(-1, Math.min(1, (itemMid - focus) / (el.clientWidth * 0.72)));
      const a = Math.abs(d);
      item.style.transform = `perspective(1200px) translateZ(${-a * 110}px) rotateY(${-d * 22}deg) scale(${1 - a * 0.12})`;
      item.style.opacity = String(1 - a * 0.3);
      item.style.zIndex = String(20 - Math.round(a * 10));
    });
  }, []);

  const onScroll = useCallback(() => {
    if (frameRef.current != null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      paintRack();
    });
  }, [paintRack]);

  useEffect(() => {
    if (view !== 'rack') return;
    paintRack();
    window.addEventListener('resize', paintRack);
    return () => {
      window.removeEventListener('resize', paintRack);
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [paintRack, view]);

  // Mouse users have no horizontal gesture — let them drag the rack.
  const dragRef = useRef<{ id: number; startX: number; startLeft: number; moved: boolean } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const el = rackRef.current;
    if (!el) return;
    dragRef.current = { id: event.pointerId, startX: event.clientX, startLeft: el.scrollLeft, moved: false };
    el.style.cursor = 'grabbing';
    el.style.scrollSnapType = 'none';
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = rackRef.current;
    if (!drag || !el || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < 4) return;
    drag.moved = true;
    el.scrollLeft = drag.startLeft - dx;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = rackRef.current;
    if (!drag || !el || drag.id !== event.pointerId) return;
    dragRef.current = null;
    el.style.cursor = '';
    el.style.scrollSnapType = '';
  };

  const suppressDragClick = (event: React.MouseEvent<HTMLElement>) => {
    if (dragRef.current?.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <section
      className="min-h-full px-5 sm:px-9 lg:px-14"
      style={{ background: '#ffffff', color: ink, fontFamily: "'Nunito', system-ui, sans-serif" }}
      aria-label="Writing wall"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col pb-24 pt-[88px] sm:pb-28 lg:pt-[100px]">
        {/* Entrance */}
        <div style={{ maxWidth: 620 }}>
          <p
            style={{
              color: teal,
              fontFamily: mono,
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.3em',
              marginBottom: 16,
              textTransform: 'uppercase',
            }}
          >
            {withCount(copy.kicker, ordered.length)}
          </p>
          <h2
            style={{
              color: ink,
              fontFamily: serif,
              fontSize: 'clamp(2.3rem, 5.4vw, 3.9rem)',
              fontStyle: 'italic',
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              marginBottom: 16,
            }}
          >
            {copy.heading}
          </h2>
          <p
            style={{
              color: 'rgba(10,10,10,0.58)',
              fontSize: '1.02rem',
              lineHeight: 1.6,
              marginBottom: 22,
              maxWidth: 480,
            }}
          >
            {copy.body}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '14px 20px',
            }}
          >
            <Link
              href="/dispatch"
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 10,
                color: ink,
                fontFamily: serif,
                fontSize: 'clamp(1.3rem, 2.4vw, 1.6rem)',
                fontStyle: 'italic',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                textDecoration: 'none',
              }}
            >
              {copy.cta}
              <span style={{ color: teal, fontStyle: 'normal' }} aria-hidden>
                →
              </span>
            </Link>
            <PillToggle
              value={view}
              onChange={setViewPersist}
              ariaLabel={copy.modeLabel}
              options={[
                { id: 'rack', label: copy.modeRack },
                { id: 'wall', label: copy.modeWall },
              ]}
            />
          </div>
        </div>

        {view === 'rack' ? (
          <div className="mt-9 sm:mt-11">
            <div className="wall-head">
              <span className="wall-head__label">{withCount(copy.rack, rack.length)}</span>
              <span className="wall-head__hint">{copy.rackHint}</span>
            </div>
            <div
              ref={rackRef}
              className="wall-rack"
              onScroll={onScroll}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={endDrag}
              role="region"
              aria-label="Latest writing, cover flow"
            >
              {rack.map((post, i) => (
                <div className="wall-rack__item" key={post.href}>
                  <Link
                    href={post.href}
                    className="wall-work"
                    aria-label={post.title}
                    onClickCapture={suppressDragClick}
                    draggable={false}
                  >
                    <span className="wall-cover wall-cover--rack">
                      <CoverPlate post={post} />
                    </span>
                    <CoverLabel index={i} post={post} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-9 sm:mt-11">
            <div className="wall-head">
              <span className="wall-head__label">{withCount(copy.wall, ordered.length)}</span>
              <span className="wall-head__hint">{copy.wallHint}</span>
            </div>
            <ul
              className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-5 sm:gap-x-3 lg:grid-cols-8 lg:gap-x-2 lg:gap-y-3"
              style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}
            >
              {ordered.map((post, i) => (
                <li key={post.href}>
                  <Link href={post.href} className="wall-work" aria-label={post.title}>
                    <span className="wall-cover wall-cover--plate">
                      <CoverPlate post={post} compact />
                    </span>
                    <CoverLabel index={i} post={post} compact />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
