'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

export type Post = { date: string; href: string; title: string; body: string };

// ── Cover palette ─────────────────────────────────────────────
// Placeholder per-article covers. Each slug maps to one URL; if the
// URL ever 404s, the dark card background + centred title still reads.

const COVER_SILICON =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';
const COVER_CIRCUIT_CLOSEUP =
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80';
const COVER_SERVERS =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80';
const COVER_DATACENTER =
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80';
const COVER_RACK =
  'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&q=80';
const COVER_SERVER_CABLES =
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&q=80';
const COVER_GPU =
  'https://images.unsplash.com/photo-1591789881337-bdc4fa6f3a45?w=1200&q=80';
const COVER_FIBER =
  'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80';
const COVER_LIGHT =
  'https://images.unsplash.com/photo-1496359311989-d9f2b3f0acd9?w=1200&q=80';
const COVER_CODE =
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80';
const COVER_TERMINAL =
  'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&q=80';
const COVER_AI_ABSTRACT =
  'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=1200&q=80';
const COVER_FINANCE =
  'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=1200&q=80';
const COVER_NEBULA =
  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&q=80';
const COVER_GALAXY =
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200&q=80';
const COVER_LION =
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1200&q=80';
const COVER_PORTRAIT =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80';

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
  // Research Dispatch — on-chain infrastructure
  wire: COVER_FIBER,
  rpc: COVER_RACK,
  'shred-economy': COVER_RACK,
  'validator-clients': COVER_SERVERS,
  doublezero: COVER_FIBER,
  'reading-solana': COVER_CODE,
  'instant-inference': COVER_GPU,

  // MEV / markets
  clob: COVER_FINANCE,
  'cex-dex-arb': COVER_FINANCE,
  'cex-dex-dashboard': COVER_FINANCE,
  'prop-amm-dict': COVER_CODE,
  'humidifi-decoded': COVER_CODE,

  // Agents / robotics
  robots: COVER_AI_ABSTRACT,
  centaur: COVER_AI_ABSTRACT,
  cli: COVER_TERMINAL,

  // Privacy / Zcash
  'zcash-fpga': COVER_CIRCUIT_CLOSEUP,
  'zec-arbitrage': COVER_GALAXY,

  // Investing — AI hardware silicon
  'ai-pcb': COVER_SILICON,
  broadcom: COVER_SILICON,
  marvell: COVER_CIRCUIT_CLOSEUP,
  'ai-hardware-scarcity': COVER_SILICON,
  'huawei-hbm': COVER_CIRCUIT_CLOSEUP,

  // Optical / fibre
  cpo: COVER_FIBER,
  'let-there-be-light': COVER_LIGHT,
  'nokia-dci': COVER_FIBER,

  // Data centre / cooling
  'ai-cooling': COVER_DATACENTER,

  // Capital / flywheels
  'nvidia-flywheel': COVER_GPU,
  'dell-nvidia-flywheel': COVER_SERVER_CABLES,

  // Sales / channels
  'tech-sales': COVER_NEBULA,

  // Woman in Tech
  lion: COVER_LION,
  misread: COVER_PORTRAIT,
  harassment: '/dispatch-covers/harassment.jpg',

  // Mars and Moon
  '#mars-moon': COVER_GALAXY,
};

export function getCover(slug: string): string {
  if (COVER_BY_SLUG[slug]) return COVER_BY_SLUG[slug];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffffffff;
  return FALLBACK_COVERS[Math.abs(h) % FALLBACK_COVERS.length];
}

/**
 * SwipeRow — Cover Flow carousel. Horizontal row of cards with the
 * centre card flat-facing the viewer; neighbours rotate inward on the
 * Y-axis (≈ ±65°) and sit closer in Z. Drag, click, or use the prev/
 * next chevrons to advance. Keyboard ArrowLeft/Right also work.
 *
 *  - Stage gets `perspective: 1200px` so the rotateY tilts read as real
 *    depth.
 *  - Per-card transform is a function of offset = i - current and the
 *    drag preview. Cards with |offset| > 2 fade out but stay rendered
 *    so a flick scrolls into them smoothly.
 *  - Centre card is a `<Link>` (navigates on click). Side card is a
 *    `<button>` (recentres on click).
 *  - Easing on snap: cubic-bezier(0.22, 1, 0.36, 1) — easeOutExpo.
 */
const COVER_FLOW_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SIDE_ROTATE_DEG = 65;

export default function SwipeRow({
  posts,
  hijackScroll = false,
}: {
  posts: Post[];
  /**
   * When the stage is the in-view snap section, convert vertical wheel
   * and touch-swipe gestures into one-card advances with the same
   * cooldown feel as the page's section snap. Only the last card
   * releases the scroll back to the snap container so the visitor can
   * leave the section. Off by default — opt in on the homepage.
   */
  hijackScroll?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{ active: boolean; startX: number; lastDelta: number }>({
    active: false,
    startX: 0,
    lastDelta: 0,
  });
  const [, forceRender] = useState(0);
  const currentRef = useRef(current);
  currentRef.current = current;
  const postsLenRef = useRef(posts.length);
  postsLenRef.current = posts.length;
  const cooldownRef = useRef(0);

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
      forceRender((v) => v + 1);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      advance(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      advance(1);
    }
  };

  // Scroll hijack — when the stage is the active snap section, convert
  // vertical wheel ticks and touch swipes into one-card advances. Only
  // the last/first card in the relevant direction releases the scroll
  // back to the snap container so the visitor can leave the section.
  useEffect(() => {
    if (!hijackScroll) return;
    const stage = stageRef.current;
    if (!stage) return;

    const COOLDOWN_MS = 650;
    const TOUCH_THRESHOLD_PX = 40;

    // Find the parent snap-section so we can ask "is this the one in view".
    let snapSection: HTMLElement | null = stage.closest('.snap-section');

    const isInView = () => {
      if (!snapSection) return false;
      return snapSection.classList.contains('in-view');
    };

    const canAdvance = (direction: 1 | -1) => {
      const c = currentRef.current;
      if (direction === 1) return c < postsLenRef.current - 1;
      return c > 0;
    };

    const tryAdvance = (direction: 1 | -1, e: Event) => {
      if (!isInView()) return false;
      const now = performance.now();
      if (now < cooldownRef.current) {
        // Still in cooldown — eat the event so the snap container doesn't
        // bypass us either.
        if (canAdvance(direction)) e.preventDefault();
        return false;
      }
      if (!canAdvance(direction)) return false;
      e.preventDefault();
      cooldownRef.current = now + COOLDOWN_MS;
      setCurrent((c) => Math.max(0, Math.min(postsLenRef.current - 1, c + direction)));
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 5) return;
      tryAdvance(e.deltaY > 0 ? 1 : -1, e);
    };

    let touchStartY = 0;
    let touchHandled = false;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchHandled = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchHandled) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = touchStartY - y;
      if (Math.abs(delta) < TOUCH_THRESHOLD_PX) return;
      touchHandled = tryAdvance(delta > 0 ? 1 : -1, e);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [hijackScroll]);

  // Convert the drag (px) into a fractional offset shift so the deck
  // moves with the finger before snapping. One full stage width ≈ 2
  // card advances; one card ≈ 50 % of the stage.
  const dragOffsetUnits =
    dragRef.current.active && stageWidth > 0
      ? -(dragRef.current.lastDelta / stageWidth) * 2
      : 0;

  const canPrev = current > 0;
  const canNext = current < posts.length - 1;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Research dispatch cover flow"
        className="dispatch-swipe-stage"
        style={{
          position: 'relative',
          width: '100%',
          height: 'min(64vw, 440px)',
          margin: '8px 0 28px',
          cursor: dragRef.current.active ? 'grabbing' : 'grab',
          touchAction: 'pan-y',
          userSelect: 'none',
          perspective: '1200px',
          perspectiveOrigin: '50% 55%',
          outline: 'none',
        }}
      >
        {posts.map((post, i) => {
          const offset = i - current + dragOffsetUnits;
          const absOffset = Math.abs(offset);
          // Render two cards each side; further-out fades but still in DOM
          // so a multi-step drag animates smoothly.
          if (absOffset > 3) return null;

          const slug = post.href.replace(/^\/blog\//, '');
          const cover = getCover(slug);

          // Cover Flow geometry. translateX scales with offset (overlap),
          // rotateY clamps at ±SIDE_ROTATE_DEG once you're a full card
          // away from centre, translateZ pulls side cards behind.
          const sign = offset === 0 ? 0 : offset > 0 ? 1 : -1;
          const tilt = Math.min(absOffset, 1) * SIDE_ROTATE_DEG * sign;
          const translateXPct =
            offset === 0
              ? 0
              : sign * (42 + (absOffset - 1) * 33); // 42, 75, 108 …
          const translateZPx =
            offset === 0 ? 60 : -40 - (absOffset - 1) * 50; // 60, -40, -90, -140
          const scale = Math.max(0.6, 1 - absOffset * 0.14);
          const opacity =
            absOffset < 1 ? 1 : Math.max(0, 1 - (absOffset - 1) * 0.45);
          const zIndex = 10 - Math.round(absOffset);
          const transition = dragRef.current.active
            ? 'none'
            : `transform 0.55s ${COVER_FLOW_EASING}, opacity 0.45s ${COVER_FLOW_EASING}, box-shadow 0.55s ${COVER_FLOW_EASING}`;

          const isCentre = Math.abs(offset) < 0.5;
          const cardStyle: React.CSSProperties = {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'min(60vw, 380px)',
            aspectRatio: '3 / 2',
            transform: `translate(-50%, -50%) translateX(${translateXPct}%) translateZ(${translateZPx}px) rotateY(${-tilt}deg) scale(${scale})`,
            transformStyle: 'preserve-3d',
            opacity,
            zIndex,
            transition,
            borderRadius: 4,
            overflow: 'hidden',
            background: `url('${cover}') center/cover no-repeat #0a0a0a`,
            boxShadow: isCentre
              ? '0 30px 60px -30px rgba(0,0,0,0.6)'
              : '0 18px 36px -18px rgba(0,0,0,0.45)',
            textDecoration: 'none',
            color: '#fff',
            cursor: 'pointer',
            pointerEvents: opacity > 0.1 ? 'auto' : 'none',
          };

          const inner = (
            <>
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

          if (isCentre) {
            return (
              <Link
                key={post.href}
                href={post.href}
                style={cardStyle}
                onClick={(e) => {
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

      <FlowButton
        direction="prev"
        onClick={() => advance(-1)}
        visible={canPrev}
      />
      <FlowButton
        direction="next"
        onClick={() => advance(1)}
        visible={canNext}
      />
    </div>
  );
}

function FlowButton({
  direction,
  onClick,
  visible,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  visible: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
      style={{
        position: 'absolute',
        top: 'calc(min(64vw, 440px) / 2 + 4px)',
        transform: 'translateY(-50%)',
        [direction === 'prev' ? 'left' : 'right']: 4,
        width: 44,
        height: 44,
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        cursor: visible ? 'pointer' : 'default',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: `opacity 0.3s ${COVER_FLOW_EASING}`,
        zIndex: 20,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{
          transform: direction === 'prev' ? 'rotate(180deg)' : undefined,
        }}
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </button>
  );
}
