'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import './writing-wall.css';

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
};

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

const RAIL_FACE: Record<Rail, { ground: string; glow: string; label: string }> = {
  dispatch: { ground: '#0d1110', glow: 'rgba(0,169,159,0.42)', label: 'dispatch' },
  investing: { ground: '#171208', glow: 'rgba(201,135,47,0.40)', label: 'investing' },
  woman: { ground: '#33100f', glow: 'rgba(233,130,157,0.36)', label: 'woman in tech' },
  mars: { ground: '#0f1626', glow: 'rgba(120,164,255,0.34)', label: 'mars & moon' },
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
 * A cover is either a photograph she owns, or a typeset one where the
 * title itself is the picture. Titles stay visible on both: a wall of
 * identical dark rectangles tells you nothing about 34 different pieces.
 */
function ArticleCover({ post, compact }: { post: WallPost; compact?: boolean }) {
  const slug = slugOf(post.href);
  const photo = PHOTO_BY_SLUG[slug];
  const face = RAIL_FACE[post.rail];
  const pad = compact ? 9 : 15;

  const h = hashOf(slug);
  // Spin the light and nudge the ground per piece so a screen of typeset
  // covers reads as a set, not as one swatch repeated.
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
              filter: 'saturate(0.9) contrast(1.05)',
            }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(9,10,11,0.1) 0%, rgba(9,10,11,0.34) 46%, rgba(9,10,11,0.88) 100%)',
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
          color: 'rgba(255,253,248,0.6)',
          fontFamily: mono,
          fontSize: compact ? '0.4rem' : '0.48rem',
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textShadow: photo ? '0 1px 8px rgba(0,0,0,0.7)' : 'none',
        }}
      >
        {face.label}
      </span>

      <span
        style={{
          position: 'absolute',
          left: pad,
          right: pad,
          bottom: pad,
          display: '-webkit-box',
          WebkitLineClamp: compact ? 4 : 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          color: '#fffdf8',
          fontFamily: serif,
          fontSize: compact ? '0.78rem' : 'clamp(0.86rem, 2.6vw, 1.06rem)',
          fontWeight: 500,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
          textShadow: photo ? '0 1px 12px rgba(0,0,0,0.8)' : 'none',
        }}
      >
        {post.title}
      </span>

      <span
        aria-hidden
        className="wall-cover__sheen"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,253,248,0.1) 0%, transparent 40%)',
          opacity: 0,
        }}
      />
    </>
  );
}

export default function WritingWall({ posts }: { posts: WallPost[] }) {
  const rackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

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
    paintRack();
    window.addEventListener('resize', paintRack);
    return () => {
      window.removeEventListener('resize', paintRack);
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [paintRack]);

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
            Writing · {ordered.length} pieces
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
            Every piece, as a cover.
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
            Push the rack to browse by feel. The wall underneath holds the whole
            archive at once — one cover per piece, nothing hidden in a menu.
          </p>
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
            Open the archive
            <span style={{ color: teal, fontStyle: 'normal' }} aria-hidden>
              →
            </span>
          </Link>
        </div>

        {/* Rack — native scroll-snap cover flow */}
        <div className="mt-9 sm:mt-11">
          <div className="wall-head">
            <span className="wall-head__label">The rack · latest {rack.length}</span>
            <span className="wall-head__hint">push me</span>
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
            {rack.map((post) => (
              <div className="wall-rack__item" key={post.href}>
                <Link
                  href={post.href}
                  className="wall-cover wall-cover--rack"
                  aria-label={post.title}
                  onClickCapture={suppressDragClick}
                  draggable={false}
                >
                  <ArticleCover post={post} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Wall — every cover in one screen */}
        <div className="mt-7">
          <div className="wall-head">
            <span className="wall-head__label">The wall · all {ordered.length}</span>
            <span className="wall-head__hint">every piece</span>
          </div>
          <ul
            className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2 lg:grid-cols-8"
            style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}
          >
            {ordered.map((post) => (
              <li key={post.href}>
                <Link href={post.href} className="wall-cover" aria-label={post.title}>
                  <ArticleCover post={post} compact />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
