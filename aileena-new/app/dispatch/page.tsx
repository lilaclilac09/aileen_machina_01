'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

type Post = { date: string; href: string; title: string; body: string };

// Slug → topic. Articles inside Dispatch + Investing get grouped under
// these small subheaders. Articles not listed here fall under "Other"
// and render at the end of the section.
const SLUG_TOPIC: Record<string, string> = {
  // ── Research Dispatch ─────────────────────────────────────
  wire: 'On-chain infrastructure',
  rpc: 'On-chain infrastructure',
  'shred-economy': 'On-chain infrastructure',
  'validator-clients': 'On-chain infrastructure',
  doublezero: 'On-chain infrastructure',
  'reading-solana': 'On-chain infrastructure',
  'instant-inference': 'On-chain infrastructure',

  clob: 'MEV & markets',
  'cex-dex-arb': 'MEV & markets',
  'cex-dex-dashboard': 'MEV & markets',
  'prop-amm-dict': 'MEV & markets',
  'humidifi-decoded': 'MEV & markets',

  robots: 'Agents & robotics',
  centaur: 'Agents & robotics',
  cli: 'Agents & robotics',

  'zcash-fpga': 'Privacy',
  'zec-arbitrage': 'Privacy',

  // ── Investing ─────────────────────────────────────────────
  'ai-pcb': 'AI hardware',
  broadcom: 'AI hardware',
  marvell: 'AI hardware',
  cpo: 'AI hardware',
  'ai-cooling': 'AI hardware',
  'ai-hardware-scarcity': 'AI hardware',
  'let-there-be-light': 'AI hardware',
  'nokia-dci': 'AI hardware',

  'nvidia-flywheel': 'Capital flywheels',
  'dell-nvidia-flywheel': 'Capital flywheels',

  'tech-sales': 'Sales & channels',
};

const TOPIC_ORDER: Record<string, string[]> = {
  dispatch: ['On-chain infrastructure', 'MEV & markets', 'Agents & robotics', 'Privacy'],
  investing: ['AI hardware', 'Capital flywheels', 'Sales & channels'],
  perspective: [],
  marsAndMoon: [],
};

// Placeholder cover images per Research Dispatch article. Aileen will
// swap each URL out for her own uploaded image later — slug → URL is
// the contract. Falls back to a dark cyan gradient if an URL 404s.
//
// Unsplash open-license, theme: space / GPU / datacenter / server rack /
// circuit board / network — picked to match the "AI infrastructure +
// on-chain compute" voice of the rail.
const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80',
  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=900&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=900&q=80',
  'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=900&q=80',
];
const COVER_BY_SLUG: Record<string, string> = {
  // empty for now — Aileen will fill in. Until a slug has an explicit
  // mapping, getCover() rotates through FALLBACK_COVERS by slug hash.
};

function getCover(slug: string): string {
  if (COVER_BY_SLUG[slug]) return COVER_BY_SLUG[slug];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffffffff;
  return FALLBACK_COVERS[Math.abs(h) % FALLBACK_COVERS.length];
}

function slugOf(post: Post): string {
  return post.href.replace(/^\/blog\//, '');
}

function groupByTopic(
  posts: readonly Post[],
  railKey: keyof typeof TOPIC_ORDER,
): { topic: string | null; posts: Post[] }[] {
  const order = TOPIC_ORDER[railKey];
  if (order.length === 0) return [{ topic: null, posts: [...posts] }];

  const byTopic = new Map<string, Post[]>();
  for (const post of posts) {
    const topic = SLUG_TOPIC[slugOf(post)] ?? 'Other';
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(post);
  }

  const out: { topic: string | null; posts: Post[] }[] = [];
  for (const t of order) {
    const items = byTopic.get(t);
    if (items && items.length > 0) out.push({ topic: t, posts: items });
  }
  const otherItems = byTopic.get('Other');
  if (otherItems && otherItems.length > 0) out.push({ topic: 'Other', posts: otherItems });
  return out;
}

/**
 * /dispatch — four rails. Research Dispatch renders as horizontal
 * swipeable cover-card rows (per topic). The other three rails keep
 * the existing substack-list rendering.
 */
export default function DispatchArchive() {
  const { language } = useLanguage();
  const tx = t[language];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: nunito,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '18px 24px',
          background: 'var(--bg-primary)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
          opacity: 0.96,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: nunito,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              opacity: 0.6,
              textDecoration: 'none',
            }}
          >
            ← Home
          </Link>
          <span
            style={{
              fontFamily: nunito,
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              color: 'var(--text-primary)',
              opacity: 0.35,
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Archive
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '56px 24px 120px' }}>
        {/* Research Dispatch — swipe rows */}
        <SwipeRail
          tag={tx.blog.researchDispatch.tag}
          heading={tx.blog.researchDispatch.heading}
          groups={groupByTopic([...tx.blog.researchDispatch.posts].reverse(), 'dispatch')}
          firstSection
        />

        {/* Investing — substack list (unchanged) */}
        <RailSection
          tag={tx.blog.investing.tag}
          heading={tx.blog.investing.heading}
          groups={groupByTopic([...tx.blog.investing.posts].reverse(), 'investing')}
        />

        {/* Perspective — flat substack list (unchanged) */}
        <RailSection
          tag={tx.blog.womanInTech.tag}
          heading={tx.blog.womanInTech.heading}
          groups={groupByTopic([...tx.blog.womanInTech.posts].reverse(), 'perspective')}
        />

        {/* Mars and Moon Magic — flat substack list (unchanged) */}
        <RailSection
          tag={tx.blog.marsAndMoon.tag}
          heading={tx.blog.marsAndMoon.heading}
          groups={groupByTopic([...tx.blog.marsAndMoon.posts].reverse(), 'marsAndMoon')}
        />
      </main>
    </div>
  );
}

/* ─── Rail headings (shared by both renderers) ──────────────── */

function RailHeader({ tag, heading }: { tag: string; heading: string }) {
  return (
    <>
      <p
        style={{
          fontFamily: nunito,
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          color: 'var(--text-primary)',
          opacity: 0.4,
          textTransform: 'uppercase',
          fontWeight: 500,
          marginBottom: 14,
        }}
      >
        {tag}
      </p>
      <h2
        style={{
          fontSize: 'clamp(1.7rem, 4.4vw, 2.6rem)',
          fontWeight: 500,
          letterSpacing: '-0.005em',
          color: 'var(--text-primary)',
          marginBottom: 36,
          lineHeight: 1.15,
        }}
      >
        {heading}
      </h2>
    </>
  );
}

function TopicHeader({ topic }: { topic: string }) {
  return (
    <p
      style={{
        fontFamily: nunito,
        fontSize: '0.68rem',
        letterSpacing: '0.22em',
        color: 'var(--text-primary)',
        opacity: 0.55,
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 16,
      }}
    >
      {topic}
    </p>
  );
}

/* ─── Swipeable cover-card rail (Research Dispatch) ─────────── */

function SwipeRail({
  tag,
  heading,
  groups,
  firstSection = false,
}: {
  tag: string;
  heading: string;
  groups: { topic: string | null; posts: Post[] }[];
  firstSection?: boolean;
}) {
  return (
    <section style={{ marginTop: firstSection ? 0 : 88 }}>
      <RailHeader tag={tag} heading={heading} />
      {groups.map((g, i) => (
        <div key={g.topic ?? `g-${i}`} style={{ marginTop: i > 0 ? 44 : 0 }}>
          {g.topic && <TopicHeader topic={g.topic} />}
          <SwipeRow posts={g.posts} />
        </div>
      ))}
    </section>
  );
}

/**
 * SwipeRow — 3D deck carousel. One card sits dead-centre; its
 * neighbours are scaled down and offset on each side. Drag in either
 * direction (any axis dominant on X) advances or retreats the deck.
 * Click the centre card → navigate to that article. Click a side card
 * → it slides to centre, no navigation yet.
 *
 * Implementation notes:
 *  - Each card is absolutely positioned at centre via translate(-50%, -50%).
 *  - Per-card transform is derived from offset = i - current. Side
 *    cards translate ±55 % of their own width and scale to 0.72.
 *  - Pointer events on the stage capture the drag. Delta < threshold →
 *    no change. Delta > threshold → advance by one (clamped).
 *  - Visual drag preview: the entire deck's offset shifts proportionally
 *    to the active drag, so it feels like fingers are pulling it.
 */
function SwipeRow({ posts }: { posts: Post[] }) {
  const [current, setCurrent] = useState(0);
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Drag state — tracked outside React to avoid 60-fps re-renders during
  // pointer move; we apply transforms imperatively while the user drags.
  const dragRef = useRef<{ active: boolean; startX: number; lastDelta: number }>({
    active: false,
    startX: 0,
    lastDelta: 0,
  });
  const [, forceRender] = useState(0);

  useLayoutEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(() => {
      if (stageRef.current) setStageWidth(stageRef.current.clientWidth);
    });
    ro.observe(stageRef.current);
    setStageWidth(stageRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(posts.length - 1, next));
      setCurrent(clamped);
    },
    [posts.length],
  );

  const advance = useCallback(
    (direction: 1 | -1) => goTo(current + direction),
    [current, goTo],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (posts.length <= 1) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, lastDelta: 0 };
    forceRender((v) => v + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.lastDelta = e.clientX - dragRef.current.startX;
    forceRender((v) => v + 1);
  };

  const onPointerUp = () => {
    const { active, lastDelta } = dragRef.current;
    if (!active) return;
    dragRef.current = { active: false, startX: 0, lastDelta: 0 };
    const threshold = Math.max(50, stageWidth * 0.12);
    if (Math.abs(lastDelta) > threshold) {
      advance(lastDelta > 0 ? -1 : 1);
    } else {
      forceRender((v) => v + 1); // snap back via re-render
    }
  };

  // Drag preview offset (px). Convert to a fractional shift so the
  // entire deck moves with the finger before snapping.
  const dragOffsetPx = dragRef.current.active ? dragRef.current.lastDelta : 0;

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      className="dispatch-swipe-stage"
      style={{
        position: 'relative',
        width: '100%',
        height: 'min(78vw, 380px)',
        margin: '8px 0 36px',
        cursor: dragRef.current.active ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
    >
      {posts.map((post, i) => {
        const offset = i - current;
        const absOffset = Math.abs(offset);
        // Cards beyond the immediate neighbours are hidden — keeps the
        // stage clean and avoids stacking-context paint cost.
        if (absOffset > 2) return null;

        const slug = post.href.replace(/^\/blog\//, '');
        const cover = getCover(slug);

        // Position relative to the centre, plus the drag preview.
        // 55% per neighbour position; drag adds a fractional shift.
        const dragShift = stageWidth > 0 ? (dragOffsetPx / stageWidth) * 55 : 0;
        const translateXPct = offset * 55 - dragShift;
        const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.72 : 0.5;
        const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.78 : 0.32;
        const zIndex = 10 - absOffset;
        const transition = dragRef.current.active
          ? 'none'
          : 'transform 0.4s cubic-bezier(0.22, 0.9, 0.32, 1), opacity 0.4s, box-shadow 0.4s';

        const isCentre = offset === 0;
        const cardStyle: React.CSSProperties = {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateXPct}%) scale(${scale})`,
          opacity,
          zIndex,
          transition,
          width: 'min(64vw, 280px)',
          height: 'min(74vw, 360px)',
          borderRadius: 18,
          overflow: 'hidden',
          background: `linear-gradient(135deg, rgba(0,255,234,0.18) 0%, rgba(0,0,0,0.85) 70%), url('${cover}') center/cover no-repeat`,
          boxShadow: isCentre
            ? '0 36px 80px -20px rgba(0,255,234,0.32)'
            : '0 18px 40px -16px rgba(0,0,0,0.6)',
          textDecoration: 'none',
          color: '#fff',
          cursor: isCentre ? 'pointer' : 'pointer',
        };

        const inner = (
          <>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                textAlign: 'center',
                fontFamily: nunito,
                fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)',
                fontWeight: 600,
                lineHeight: 1.25,
                color: '#fff',
                textShadow: '0 2px 18px rgba(0,0,0,0.85)',
                pointerEvents: 'none',
              }}
            >
              {post.title}
            </span>
            <span
              style={{
                position: 'absolute',
                bottom: 14,
                left: 16,
                fontFamily: nunito,
                fontSize: '0.62rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                pointerEvents: 'none',
              }}
            >
              {post.date}
            </span>
          </>
        );

        // Centre card → real Link (navigates on click)
        // Side card → button (slides to centre on click, no nav)
        if (isCentre) {
          return (
            <Link
              key={post.href}
              href={post.href}
              style={cardStyle}
              onClick={(e) => {
                // Suppress click that arrives at the end of a drag — pointer
                // events fire onClick even after pointerup of a drag, which
                // would unintentionally navigate when the user just swiped.
                if (Math.abs(dragRef.current.lastDelta) > 12) e.preventDefault();
              }}
            >
              {inner}
            </Link>
          );
        }
        return (
          <button
            type="button"
            key={post.href}
            style={cardStyle}
            onClick={(e) => {
              e.preventDefault();
              if (Math.abs(dragRef.current.lastDelta) > 12) return;
              goTo(i);
            }}
            aria-label={`Go to ${post.title}`}
          >
            {inner}
          </button>
        );
      })}

      {/* Position dots — small index in the bottom centre */}
      {posts.length > 1 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -22,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            pointerEvents: 'none',
          }}
        >
          {posts.map((_, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: 999,
                background: i === current ? '#00ffea' : 'rgba(255,255,255,0.18)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Substack-list rail (Investing / Perspective / Mars and Moon) ── */

function RailSection({
  tag,
  heading,
  groups,
  firstSection = false,
}: {
  tag: string;
  heading: string;
  groups: { topic: string | null; posts: Post[] }[];
  firstSection?: boolean;
}) {
  return (
    <section style={{ marginTop: firstSection ? 0 : 88 }}>
      <RailHeader tag={tag} heading={heading} />
      {groups.map((g, i) => (
        <div key={g.topic ?? `g-${i}`} style={{ marginTop: i > 0 ? 44 : 0 }}>
          {g.topic && <TopicHeader topic={g.topic} />}
          <div className="substack-list">
            {g.posts.map((post) => (
              <Link key={`${post.href}-${post.date}`} href={post.href}>
                <p className="sl-date">{post.date}</p>
                <h3 className="sl-title">{post.title}</h3>
                <p className="sl-body">{post.body}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
