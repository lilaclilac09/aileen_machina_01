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

// Placeholder cover images per Research Dispatch / Investing article.
// Aileen will swap each URL for her own uploaded image later — slug →
// URL is the contract.
//
// Curated Unsplash IDs grouped by article subject. If a URL ever 404s,
// the dark background + centred title still reads — no broken-image
// icon.
const COVER_SILICON =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80'; // circuit-board macro
const COVER_CIRCUIT_CLOSEUP =
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80'; // circuit board closeup, blue
const COVER_SERVERS =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80'; // server room
const COVER_DATACENTER =
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80'; // datacenter cables
const COVER_RACK =
  'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&q=80'; // server rack
const COVER_SERVER_CABLES =
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&q=80'; // server cabling, cyan
const COVER_GPU =
  'https://images.unsplash.com/photo-1591789881337-bdc4fa6f3a45?w=1200&q=80'; // graphics card
const COVER_FIBER =
  'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80'; // fiber optic
const COVER_LIGHT =
  'https://images.unsplash.com/photo-1496359311989-d9f2b3f0acd9?w=1200&q=80'; // abstract light / waves
const COVER_CODE =
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80'; // code on screen
const COVER_TERMINAL =
  'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&q=80'; // terminal/dark screen
const COVER_AI_ABSTRACT =
  'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=1200&q=80'; // abstract AI / robot
const COVER_FINANCE =
  'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=1200&q=80'; // finance / abstract numbers
const COVER_NEBULA =
  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&q=80'; // nebula
const COVER_GALAXY =
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200&q=80'; // galaxy
// Woman-in-Tech essays — human / poetic imagery, not tech stock.
const COVER_LION =
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1200&q=80'; // lion close-up
const COVER_PORTRAIT =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80'; // portrait
const COVER_SHADOW =
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=80'; // silhouette / quiet portrait

const FALLBACK_COVERS = [
  COVER_SILICON,
  COVER_SERVERS,
  COVER_DATACENTER,
  COVER_RACK,
  COVER_CIRCUIT_CLOSEUP,
  COVER_FIBER,
  COVER_CODE,
  COVER_GPU,
];

const COVER_BY_SLUG: Record<string, string> = {
  // ── Research Dispatch ───────────────────────────────────────
  // On-chain infrastructure
  wire: COVER_FIBER,                  // Solana shreds + Turbine, network
  rpc: COVER_RACK,                    // RPC infra
  'shred-economy': COVER_RACK,        // shred routing
  'validator-clients': COVER_SERVERS, // validator cluster
  doublezero: COVER_FIBER,            // backbone fibre
  'reading-solana': COVER_CODE,       // reading research
  'instant-inference': COVER_GPU,     // inference compute

  // MEV / markets
  clob: COVER_FINANCE,                // order book
  'cex-dex-arb': COVER_FINANCE,       // arbitrage charts
  'cex-dex-dashboard': COVER_FINANCE,
  'prop-amm-dict': COVER_CODE,        // reverse engineering
  'humidifi-decoded': COVER_CODE,     // decoded bytes

  // Agents / robotics
  robots: COVER_AI_ABSTRACT,          // NVIDIA Omniverse, robotics
  centaur: COVER_AI_ABSTRACT,         // Paradigm agent runtime
  cli: COVER_TERMINAL,                // CLI tools

  // Privacy / Zcash
  'zcash-fpga': COVER_CIRCUIT_CLOSEUP, // FPGA chip
  'zec-arbitrage': COVER_GALAXY,       // abstract privacy

  // ── Investing ───────────────────────────────────────────────
  // AI hardware silicon
  'ai-pcb': COVER_SILICON,            // PCB circuit
  broadcom: COVER_SILICON,            // silicon
  marvell: COVER_CIRCUIT_CLOSEUP,     // silicon, different angle
  'ai-hardware-scarcity': COVER_SILICON,

  // Optical / fibre
  cpo: COVER_FIBER,                   // co-packaged optics
  'let-there-be-light': COVER_LIGHT,  // laser / optical
  'nokia-dci': COVER_FIBER,           // DCI backbone

  // Data centre / cooling
  'ai-cooling': COVER_DATACENTER,     // datacenter cooling

  // Capital / flywheels
  'nvidia-flywheel': COVER_GPU,       // NVIDIA GPU
  'dell-nvidia-flywheel': COVER_SERVER_CABLES, // Dell server iron

  // Sales / channels
  'tech-sales': COVER_NEBULA,         // abstract — no on-the-nose photo

  // ── Perspective (Woman in Tech) ─────────────────────────────
  // Human / poetic imagery. Lion is literal because the title invites it;
  // the others use a still portrait + a quiet silhouette so the rail
  // reads as essays, not stock-photo themed.
  lion: COVER_LION,
  misread: COVER_PORTRAIT,
  harassment: COVER_SHADOW,

  // ── Mars and Moon Magic ─────────────────────────────────────
  // Placeholder rail; href is '#mars-moon' which lands as the lookup
  // key after the /blog/ strip. Map to galaxy so the cosmic theme
  // doesn't fall back into a server-rack rotation.
  '#mars-moon': COVER_GALAXY,
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
        {/* All four rails render as the same diagonal-fade carousel —
            topic-grouped for Dispatch + Investing, flat for Perspective
            + Mars and Moon. RailSection (substack list) kept in the
            file but no longer used; reachable for a quick revert. */}
        <SwipeRail
          tag={tx.blog.researchDispatch.tag}
          heading={tx.blog.researchDispatch.heading}
          groups={groupByTopic([...tx.blog.researchDispatch.posts].reverse(), 'dispatch')}
          firstSection
        />
        <SwipeRail
          tag={tx.blog.investing.tag}
          heading={tx.blog.investing.heading}
          groups={groupByTopic([...tx.blog.investing.posts].reverse(), 'investing')}
        />
        <SwipeRail
          tag={tx.blog.womanInTech.tag}
          heading={tx.blog.womanInTech.heading}
          // Authored order, NOT reverse-chrono — Aileen wants the #MeToo
          // piece first, regardless of date. translations.ts already
          // lists the essays in the intended display order.
          groups={groupByTopic([...tx.blog.womanInTech.posts], 'perspective')}
        />
        <SwipeRail
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
        height: 'min(64vw, 460px)',
        margin: '8px 0 28px',
        cursor: dragRef.current.active ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
    >
      {posts.map((post, i) => {
        const offset = i - current;
        const absOffset = Math.abs(offset);
        // Only the centre + immediate neighbours render — diagonal layout
        // needs the breathing room, more than that gets messy on a 4:5 card.
        if (absOffset > 1) return null;

        const slug = post.href.replace(/^\/blog\//, '');
        const cover = getCover(slug);

        // Position relative to the centre, plus the drag preview.
        // Diagonal layout: side cards shift toward upper-left (prev) and
        // lower-right (next), tilt toward the centre, AND fade + blur
        // out so the transition between centred cards reads as a true
        // diagonal dissolve, not a slide.
        const dragShift = stageWidth > 0 ? (dragOffsetPx / stageWidth) * 55 : 0;
        const translateXPct = offset * 55 - dragShift;
        const translateYPct = offset * 30; // diagonal Y component (stronger)
        const rotateDeg = offset * -10;    // tilt toward centre (stronger)
        const scale = absOffset === 0 ? 1 : 0.66;
        const opacity = absOffset === 0 ? 1 : 0.32;
        const blurPx = absOffset === 0 ? 0 : 3.5;
        const zIndex = 10 - absOffset;
        const transition = dragRef.current.active
          ? 'none'
          : 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0.0, 0.2, 1), filter 0.6s, box-shadow 0.6s';

        const isCentre = offset === 0;
        const cardStyle: React.CSSProperties = {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateXPct}%) translateY(${translateYPct}%) rotate(${rotateDeg}deg) scale(${scale})`,
          opacity,
          filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
          zIndex,
          transition,
          // 3:2 landscape, like a movie still — no card chrome.
          width: 'min(70vw, 420px)',
          aspectRatio: '3 / 2',
          borderRadius: 2,
          overflow: 'hidden',
          background: `url('${cover}') center/cover no-repeat #0a0a0a`,
          boxShadow: isCentre
            ? '0 22px 50px -22px rgba(0,0,0,0.55)'
            : 'none',
          textDecoration: 'none',
          color: '#fff',
          cursor: 'pointer',
        };

        const inner = (
          <>
            {/* Subtle darkening under the title so it stays legible on
                any cover image. No coloured gradient — the user asked
                for a clean background. */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 70%, rgba(0,0,0,0.6) 100%)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 32px',
                textAlign: 'center',
                fontFamily: nunito,
                fontSize: 'clamp(1.15rem, 2.6vw, 1.6rem)',
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.005em',
                color: '#fff',
                textShadow: '0 2px 22px rgba(0,0,0,0.9)',
                pointerEvents: 'none',
              }}
            >
              {post.title}
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
