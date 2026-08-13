'use client';

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';
import GlassBench from '../components/GlassBench';
import DoorsDirectory from '../components/DoorsDirectory';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { ScrapPhoto } from '../components/zine/ScrapPhoto';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';
import { ALL_ISSUES } from '../lib/research/issues';
import './blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const palette = {
  ink: '#14110c',
  page: '#fbfaf6',
  paper: '#fffdf7',
  cream: '#f8f5ee',
  graphite: '#171513',
  soot: '#0d1110',
  cyan: '#00a99f',
  cyanSoft: 'rgba(0,169,159,0.18)',
  amber: '#c9872f',
  amberSoft: 'rgba(201,135,47,0.28)',
  softPink: '#e9829d',
  oxblood: '#4c1512',
  chipGreen: '#abc967',
};

const SESSION_LOADED_KEY = 'aileena_loaded_once';
/** Ink 「drag me」 — cream desk / white paper scraps */
const dragMeCursor =
  'url("data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20width=\'104\'%20height=\'34\'%20viewBox=\'0%200%20104%2034\'%3E%3Ctext%20x=\'4\'%20y=\'23\'%20font-family=\'Georgia%2Cserif\'%20font-size=\'20\'%20font-style=\'italic\'%20fill=\'%2314110c\'%3Edrag%20me%3C/text%3E%3C/svg%3E") 8 18, grab';
/** Cream 「drag me」 + dark stroke — dark photo scraps */
const dragMeCursorOnDark =
  'url("data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20width=\'104\'%20height=\'34\'%20viewBox=\'0%200%20104%2034\'%3E%3Ctext%20x=\'4\'%20y=\'23\'%20font-family=\'Georgia%2Cserif\'%20font-size=\'20\'%20font-style=\'italic\'%20fill=\'%23fffdf8\'%20stroke=\'%23000000\'%20stroke-width=\'2.5\'%20paint-order=\'stroke\'%20stroke-linejoin=\'round\'%3Edrag%20me%3C/text%3E%3C/svg%3E") 8 18, grab';
const dragThreshold = 3;
/** Invisible editorial table — size tiers, not a grid. */
const deskHeroWidth = 'min(30vw, 292px)';
const deskMediumWidth = 'min(18vw, 184px)';
const deskSmallWidth = 'min(13vw, 128px)';
const deskTinyWidth = 'min(11vw, 108px)';
const deskAskWidth = 'clamp(152px, 16.5vw, 176px)';

type DragOffset = {
  x: number;
  y: number;
};

type DragState = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type RoomDoor = {
  id: string;
  index: string;
  label: string;
  href: string;
  category: string;
  blurb: string;
  signal: string;
  motif: 'article' | 'hbm' | 'pcb' | 'trendy' | 'record' | 'investing';
  placement: CSSProperties;
  note?: string;
};

function isDarkScrapMotif(motif: RoomDoor['motif']): boolean {
  return motif === 'hbm' || motif === 'pcb' || motif === 'investing' || motif === 'record';
}

function dragMeCursorFor(onDark: boolean): string {
  return onDark ? dragMeCursorOnDark : dragMeCursor;
}

const livedInBase: Record<string, string> = {
  'kiln-glass': 'rotate(-2.6deg)',
  'street-back': 'rotate(1.6deg)',
  'vinyl-surface': 'rotate(-2.4deg)',
};
const livedInZ: Record<string, number> = {
  'kiln-glass': 11,
  'street-back': 7,
  'vinyl-surface': 13,
};
const livedInDark = new Set(['street-back', 'vinyl-surface']);

function dragMeCursorForId(id: string, rooms: RoomDoor[]): string {
  if (id in livedInBase) {
    return livedInDark.has(id) ? dragMeCursorOnDark : dragMeCursor;
  }
  if (
    id === 'woman-cover-print' ||
    id === 'didion-scrap' ||
    id === 'machina-polaroid' ||
    id === 'zine-clipping'
  ) {
    return dragMeCursorOnDark;
  }
  const room = rooms.find((r) => r.id === id);
  if (!room) return dragMeCursor;
  return dragMeCursorFor(isDarkScrapMotif(room.motif));
}

function LivedInPrint({
  src,
  filter,
  caption,
}: {
  src: string;
  filter?: string;
  caption: string;
}) {
  return (
    <>
      <ScrapPhoto src={src} filter={filter} className="scrap-photo--paper" />
      <span
        style={{
          display: 'block',
          marginTop: 7,
          color: 'rgba(20,17,12,0.52)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.82rem',
          fontStyle: 'italic',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {caption}
      </span>
    </>
  );
}

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then one clickable clipping desk. Information is
 * intentionally minimal: the homepage's job is to set the mood, not to
 * contain the content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  Clipping desk       — editorial table: hero left, ask center,
 *                                     rail right; lived-in prints mixed in
 *   Section 03  Watch / Listen      — labeled doors (DJ → /sound, shelf, …)
 *   Section 04  Visual              — kiln / glass bench (handmade work)
 *
 * The Machina mark on the cinematic opening doubles as the door to the
 * agent department.
 *
 * Visual language: white editorial base, amber for Magazine, cyan/teal for
 * machina links. The standalone DJ station stays black on /sound.
 */
export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];
  const [loaded, setLoaded] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const latestIssue = ALL_ISSUES[0];
  const latestIssueHref = latestIssue?.longFormHref ?? (latestIssue ? `/blog/${latestIssue.slug}` : '/dispatch');
  const latestDispatch = tx.blog.researchDispatch.posts.slice(-1)[0];
  const metooArticle = tx.blog.womanInTech.posts.find((post) => post.href === '/blog/harassment') ?? tx.blog.womanInTech.posts[0];
  // Newest investing essay on the desk (posts are chronological; last = latest).
  const featuredInvesting = tx.blog.investing.posts.slice(-1)[0] ?? tx.blog.investing.posts[0];
  const rooms: RoomDoor[] = [
    {
      id: 'magazine',
      index: '01',
      label: 'Magazine',
      href: latestIssueHref,
      category: 'AI stock',
      blurb: 'HBM stacks, David, and the day the stockpile hits zero.',
      signal: latestIssue ? `${latestIssue.issueNumber} · ${latestIssue.coverTitle}` : 'Open the magazine rack',
      motif: 'hbm',
      placement: { top: '10%', right: '10%', transform: 'rotate(-2deg)', zIndex: 6 },
    },
    {
      id: 'dispatch',
      index: '02',
      label: 'News Desk',
      href: latestDispatch ? latestDispatch.href : '/dispatch',
      category: 'PCB stack',
      blurb: 'GB200 boards, CCL, M8/M9, and who gets to choose the board.',
      signal: latestDispatch ? latestDispatch.title : 'Open the archive',
      motif: 'pcb',
      placement: { top: '38%', right: '10%', transform: 'rotate(1.6deg)', zIndex: 5 },
    },
    {
      id: 'woman-tech',
      index: '03',
      label: 'Woman in Tech',
      href: '/blog/harassment',
      category: 'Woman in Tech',
      blurb: metooArticle ? metooArticle.body : 'Long-form essays and the back catalogue.',
      signal: metooArticle ? metooArticle.title : 'Every Woman in Tech Has a #MeToo Story',
      motif: 'article',
      placement: { top: '11%', left: '10%', transform: 'rotate(-1deg)', zIndex: 14 },
    },
    {
      id: 'woman-investing',
      index: '04',
      label: 'Woman Investing',
      href: featuredInvesting ? featuredInvesting.href : '/dispatch#investing',
      category: tx.blog.investing.tag,
      blurb: featuredInvesting ? featuredInvesting.body : 'A woman should have her own portfolio.',
      signal: featuredInvesting ? featuredInvesting.title : tx.blog.investing.heading,
      motif: 'investing',
      placement: { top: '64%', right: '10%', transform: 'rotate(1.2deg)', zIndex: 12 },
    },
  ];

  useEffect(() => {
    let shouldShow = false;

    try {
      shouldShow = window.sessionStorage.getItem(SESSION_LOADED_KEY) !== '1';
    } catch {
      return;
    }

    if (!shouldShow) return;

    const frame = window.requestAnimationFrame(() => {
      setShowLoadingScreen(true);
      setLoaded(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {showLoadingScreen && !loaded && (
        <LoadingScreen
          onDone={() => {
            setLoaded(true);
            setShowLoadingScreen(false);
            try {
              sessionStorage.setItem(SESSION_LOADED_KEY, '1');
            } catch {
              /* ignore */
            }
          }}
        />
      )}
      <Header />
      <SnapContainer key={language}>

        {/* ── 01 CINEMATIC OPENING ──────────────────────────────── */}
        <SnapSection id="opening" className="order-1">
          <div
            className="h-full flex flex-col bg-white relative overflow-hidden"
            style={{ fontFamily: nunito }}
          >
            {/* Background portrait — large, partially out of frame on the right */}
            <div
              aria-hidden
              className="hidden md:block absolute top-1/2 right-[-4%] lg:right-[-2%] -translate-y-1/2 z-0"
              style={{
                width: 'clamp(380px, 42vw, 620px)',
                height: 'clamp(540px, 60vw, 880px)',
                backgroundImage: "url('/bg_pic/03.jpeg')",
                backgroundPosition: '22% 8%',
                backgroundSize: '180%',
                backgroundRepeat: 'no-repeat',
                borderRadius: '24px',
                boxShadow: '0 34px 110px -64px rgba(20,17,12,0.45), 0 0 0 1px rgba(20,17,12,0.08)',
              }}
            />

            {/* Mobile-only portrait — smaller, top */}
            <div
              aria-hidden
              className="md:hidden self-center mt-12"
              style={{
                width: 140,
                height: 180,
                backgroundImage: "url('/bg_pic/03.jpeg')",
                backgroundPosition: '22% 8%',
                backgroundSize: '180%',
                borderRadius: 14,
                boxShadow: '0 24px 60px -34px rgba(20,17,12,0.45)',
              }}
            />

            {/* Foreground content */}
            <div className="relative z-10 flex-1 flex items-center px-6 sm:px-12 lg:px-20">
              <div className="max-w-[640px] w-full">
                <p
                  className="anim-up"
                  style={{
                    fontFamily: mono,
                    fontSize: '0.62rem',
                    letterSpacing: '0.4em',
                    color: palette.amber,
                    textTransform: 'uppercase',
                    marginBottom: 28,
                    fontWeight: 600,
                  }}
                >
                  Aileena Machina · Berlin
                </p>
                <h1
                  className="anim-up-2"
                  style={{
                    fontSize: 'clamp(2.2rem, 5.6vw, 4.2rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.022em',
                    lineHeight: 1.04,
                    color: palette.ink,
                    marginBottom: 40,
                  }}
                >
                  {tx.hero.line}
                </h1>
                <div
                  className="anim-up-3"
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}
                >
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 16,
                      minHeight: 76,
                      background: 'rgba(255,253,247,0.82)',
                      color: palette.ink,
                      padding: '11px 16px 11px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,169,159,0.26)',
                      boxShadow:
                        '0 20px 48px -34px rgba(20,17,12,0.52), 0 0 0 1px rgba(255,255,255,0.74) inset',
                      cursor: 'pointer',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                    }}
                    aria-label={tx.hero.talkAgent}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        width: 56,
                        height: 56,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        backgroundImage: "url('/bg_pic/03.jpeg')",
                        backgroundPosition: '22% 8%',
                        backgroundSize: '180%',
                        boxShadow: `0 0 0 1px ${palette.cyan}, 0 10px 24px -18px rgba(20,17,12,0.9)`,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          right: -3,
                          top: 1,
                          width: 15,
                          height: 15,
                          borderRadius: '50%',
                          background: palette.cyan,
                          boxShadow: '0 0 0 4px rgba(255,253,247,0.96), 0 0 14px rgba(0,169,159,0.62)',
                        }}
                      />
                    </span>
                    <span style={{ display: 'grid', gap: 5, minWidth: 0, paddingRight: 6 }}>
                      <span
                        style={{
                          color: palette.cyan,
                          fontFamily: mono,
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          letterSpacing: '0.44em',
                          lineHeight: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        Machina
                      </span>
                      <span
                        style={{
                          color: 'rgba(20,17,12,0.56)',
                          fontFamily: 'Georgia, serif',
                          fontSize: '0.82rem',
                          fontStyle: 'italic',
                          lineHeight: 1.15,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ask the agent
                      </span>
                    </span>
                    <span
                      aria-hidden
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 38,
                        height: 38,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        background: 'rgba(20,17,12,0.08)',
                        color: palette.ink,
                        fontFamily: mono,
                        fontSize: '1.05rem',
                      }}
                    >
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scroll cue */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade z-10">
              <div className="w-px h-10 bg-gradient-to-b from-transparent to-[#14110c]/20" />
              <span
                className="text-[#14110c]/32"
                style={{
                  fontFamily: mono,
                  fontSize: '0.55rem',
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                }}
              >
                {tx.hero.scroll}
              </span>
            </div>
          </div>
        </SnapSection>

        {/* ── 02 LINK DOCK — article objects as direct doors ────── */}
        <SnapSection id="dock" className="order-2">
          <AtriumLinkDock rooms={rooms} />
        </SnapSection>

        {/* ── 03 WATCH / LISTEN HUB ─────────────────────────────── */}
        <SnapSection id="watch-hub" className="order-3">
          <DoorsDirectory />
        </SnapSection>

        {/* ── 04 VISUAL — kiln / glass (homepage only, not /sound) ─ */}
        <SnapSection id="visual" className="order-4">
          <div style={{ fontFamily: nunito }}>
            <GlassBench
              tag={tx.visual.kilnTag}
              title={tx.visual.heading}
              body={tx.visual.kilnNote}
              linkLabel={tx.visual.readGlass}
              items={tx.visual.items}
            />
          </div>
        </SnapSection>

      </SnapContainer>
    </>
  );
}

function AtriumLinkDock({ rooms }: { rooms: RoomDoor[] }) {
  const [dragOffsets, setDragOffsets] = useState<Record<string, DragOffset>>({});
  const dragStateRef = useRef<DragState | null>(null);
  const dragOffsetsRef = useRef<Record<string, DragOffset>>({});
  const baseTransformRef = useRef<Record<string, string>>({});
  const dragNodeRef = useRef<HTMLElement | null>(null);
  const socialLinks = [
    { label: 'github', href: 'https://github.com/lilaclilac09' },
    { label: 'substack', href: '/dispatch' },
    { label: 'gather', href: 'https://album.aileena.xyz' },
  ];
  const getDragOffset = (id: string) => dragOffsets[id] ?? { x: 0, y: 0 };
  const baseFor = (id: string) => {
    if (id in livedInBase) return livedInBase[id];
    if (id === 'woman-cover-print') return 'rotate(2.2deg)';
    if (id === 'machina-polaroid') return 'rotate(2.2deg)';
    if (id === 'didion-scrap') return 'rotate(-2.4deg)';
    if (id === 'zine-clipping') return 'rotate(-2.6deg)';
    return String(rooms.find((room) => room.id === id)?.placement.transform ?? '');
  };
  const paint = (node: HTMLElement, id: string, x: number, y: number) => {
    const base = baseTransformRef.current[id] ?? baseFor(id);
    node.style.transition = 'none';
    node.style.transform = `translate3d(${x}px, ${y}px, 0) ${base}`;
  };
  const dragTransform = (id: string, baseTransform: string) => {
    const offset = getDragOffset(id);
    const translate = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
    return baseTransform ? `${translate} ${baseTransform}` : translate;
  };
  const homeZFor = (id: string) =>
    String(
      id in livedInZ
        ? livedInZ[id]
        : id === 'machina-polaroid'
          ? 16
          : id === 'zine-clipping'
            ? 10
            : id === 'woman-cover-print'
              ? 8
              : id === 'didion-scrap'
                ? 9
                : rooms.find((r) => r.id === id)?.placement.zIndex ?? 1,
    );
  const finishDrag = (pointerId: number, moved: boolean) => {
    const drag = dragStateRef.current;
    const node = dragNodeRef.current;
    if (!drag || drag.pointerId !== pointerId || !node) return;
    if (moved) node.dataset.dragged = 'true';
    const final = dragOffsetsRef.current[drag.id] ?? { x: 0, y: 0 };
    const base = baseTransformRef.current[drag.id] ?? baseFor(drag.id);
    node.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)';
    node.style.transform = `translate3d(${final.x}px, ${final.y}px, 0) ${base}`;
    node.style.willChange = 'auto';
    // Keep 「drag me」 cursor after release — never clear to default.
    node.style.cursor = dragMeCursorForId(drag.id, rooms);
    delete node.dataset.dragging;
    node.style.zIndex = homeZFor(drag.id);
    setDragOffsets({ ...dragOffsetsRef.current });
    dragStateRef.current = null;
    dragNodeRef.current = null;
    if (node.hasPointerCapture(pointerId)) {
      node.releasePointerCapture(pointerId);
    }
    window.setTimeout(() => {
      delete node.dataset.dragged;
    }, 0);
  };
  const onWindowPointerMove = (event: PointerEvent) => {
    const drag = dragStateRef.current;
    const node = dragNodeRef.current;
    if (!drag || !node || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) <= dragThreshold) return;
    event.preventDefault();
    drag.moved = true;
    // Keep 「drag me」 painted while moving — never bare grabbing.
    node.style.cursor = dragMeCursorForId(drag.id, rooms);
    const next = { x: drag.originX + dx, y: drag.originY + dy };
    dragOffsetsRef.current[drag.id] = next;
    paint(node, drag.id, next.x, next.y);
  };
  const onWindowPointerUp = (event: PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    window.removeEventListener('pointermove', onWindowPointerMove);
    window.removeEventListener('pointerup', onWindowPointerUp);
    window.removeEventListener('pointercancel', onWindowPointerUp);
    finishDrag(event.pointerId, drag.moved);
  };
  const beginDrag = (id: string, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const offset = dragOffsetsRef.current[id] ?? dragOffsets[id] ?? { x: 0, y: 0 };
    baseTransformRef.current[id] = baseFor(id);
    dragStateRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
    // DOM-only while dragging — never setState mid-drag (that re-renders the desk).
    const node = event.currentTarget;
    dragNodeRef.current = node;
    node.dataset.dragging = 'true';
    node.style.zIndex = '60';
    // Keep the 「drag me」 cursor visible the whole time — never swap to bare grabbing.
    node.style.cursor = dragMeCursorForId(id, rooms);
    node.style.transition = 'none';
    node.style.willChange = 'transform';
    node.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
  };
  const blockNativeDrag = (event: ReactDragEvent<HTMLElement>) => {
    event.preventDefault();
  };
  const suppressDragClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.currentTarget.dataset.dragged !== 'true') return;
    event.preventDefault();
    event.stopPropagation();
  };
  const dragHandlers = (id: string) => ({
    draggable: false,
    onClickCapture: suppressDragClick,
    onDragStart: blockNativeDrag,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => beginDrag(id, event),
  });

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listeners bound only for live drag session
  }, []);

  return (
    <div
      className="h-full px-5 sm:px-9 lg:px-14"
      style={{
        fontFamily: nunito,
        background: palette.page,
      }}
    >
      <div
        className="relative mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-visible pb-5 pt-[78px] sm:pb-6 sm:pt-[82px] lg:pt-[88px]"
      >
        <header className="relative z-20 flex items-start justify-between gap-6">
          <span
            className="hidden sm:inline-block"
            style={{
              color: palette.graphite,
              fontFamily: 'Georgia, serif',
              fontSize: '1.02rem',
              fontStyle: 'italic',
              lineHeight: 1.3,
              textDecoration: 'none',
            }}
          >
            Aileena Machina
          </span>
          <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Site">
            <Link href="/doors" style={topLinkStyle}>
              doors.
            </Link>
            <Link href="/works" style={topLinkStyle}>
              work.
            </Link>
            <button
              type="button"
              style={{
                ...topLinkStyle,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('open-agent-chat'))}
            >
              contact.
            </button>
          </nav>
        </header>

        <div
          className="relative z-10 min-h-0 flex-1 sm:min-h-0"
          data-atrium-stage
          style={{
            // Ink 「drag me」 on blank cream canvas; scraps override with their own cursors.
            cursor: dragMeCursor,
            background:
              'radial-gradient(ellipse 70% 55% at 72% 18%, rgba(232,180,184,0.10), transparent 58%), radial-gradient(ellipse 55% 45% at 12% 78%, rgba(0,169,159,0.06), transparent 55%)',
          }}
        >
          {/* One global hint — stage layer only; never on cards; does not move with scraps */}
          <span
            aria-hidden
            data-drag-me-canvas
            className="pointer-events-none hidden select-none sm:block"
            style={{
              position: 'absolute',
              left: '14%',
              bottom: '6%',
              zIndex: 0,
              color: 'rgba(20,17,12,0.16)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.72rem',
              fontStyle: 'italic',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            move things around
          </span>
          <div className="min-h-full overflow-visible px-3 pb-24 pt-8 sm:hidden">
            <div className="grid gap-14">
              {[...rooms]
                .sort((a, b) => Number(b.id === 'woman-tech') - Number(a.id === 'woman-tech'))
                .map((room) => {
                const isArticle = room.motif === 'article';
                const isRecord = room.motif === 'record';
                const mobileRoomStyle: CSSProperties = {
                  display: 'block',
                  width: '100%',
                  minHeight: isArticle ? 380 : isRecord ? 240 : undefined,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: palette.ink,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  boxShadow: 'none',
                };

                const roomLink = room.href.startsWith('http') ? (
                  <a
                    href={room.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-left"
                    style={mobileRoomStyle}
                    aria-label={`Open ${room.label}`}
                  >
                    <ObjectFace room={room} />
                  </a>
                ) : (
                  <Link
                    href={room.href}
                    className="text-left"
                    style={mobileRoomStyle}
                    aria-label={`Open ${room.label}`}
                  >
                    <ObjectFace room={room} />
                  </Link>
                );

                return (
                  <Fragment key={room.id}>
                    {roomLink}
                    {room.id === 'woman-tech' ? (
                      <button
                        type="button"
                        aria-label="Open Aileena console — machina polaroid"
                        data-desk-role="anchor"
                        className="text-left"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: 'min(52%, 168px)',
                          margin: '8px auto 4px',
                          padding: 0,
                          border: 0,
                          outline: 'none',
                          background: 'transparent',
                          boxShadow: 'none',
                          cursor: 'pointer',
                          transform: 'rotate(2deg)',
                        }}
                        onClick={() => window.dispatchEvent(new CustomEvent('open-agent-chat'))}
                      >
                        <ScrapPhoto
                          src="/bg_pic/03.jpeg"
                          filter="saturate(0.94) contrast(1.04)"
                        />
                        <span
                          style={{
                            marginTop: 8,
                            color: 'rgba(20,17,12,0.55)',
                            fontFamily: mono,
                            fontSize: '0.5rem',
                            fontWeight: 800,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                          }}
                        >
                          ask · machina
                        </span>
                      </button>
                    ) : null}
                  </Fragment>
                );
              })}

              <Link
                href="/dispatch#woman-in-tech"
                aria-label="Open Woman in Tech archive — cover print"
                className="text-left"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 8,
                  padding: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  boxShadow: 'none',
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                <ScrapPhoto
                  src="/dispatch-covers/harassment.jpg"
                  filter="contrast(1.05) saturate(0.92)"
                  overlay="linear-gradient(180deg, transparent 55%, rgba(20,17,12,0.58) 100%)"
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 12,
                      bottom: 12,
                      zIndex: 1,
                      padding: '4px 8px',
                      background: 'rgba(20,17,12,0.72)',
                      color: '#fffdf8',
                      fontFamily: mono,
                      fontSize: '0.52rem',
                      fontWeight: 850,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    woman in tech archive →
                  </span>
                </ScrapPhoto>
              </Link>

              <Link
                href="/blog/pate-de-verre"
                aria-label="Open pâte de verre — kiln glass on the bench"
                className="text-left"
                data-lived-in="kiln-glass"
                style={{
                  display: 'block',
                  width: 'min(56%, 176px)',
                  margin: '18px auto 4px',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  textDecoration: 'none',
                  transform: 'rotate(-2.4deg)',
                  filter: 'drop-shadow(2px 8px 14px rgba(20,17,12,0.14))',
                }}
              >
                <LivedInPrint
                  src="/pate-glass.jpg"
                  filter="saturate(0.9) contrast(1.02)"
                  caption="kiln"
                />
              </Link>

              <Link
                href="/updates"
                aria-label="Open Metal & Pages — zine clipping poster"
                className="text-left"
                style={{
                  display: 'block',
                  width: 'min(68%, 220px)',
                  margin: '20px auto 8px',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  textDecoration: 'none',
                  transform: 'rotate(-2.8deg)',
                  filter: 'drop-shadow(2px 8px 14px rgba(20,17,12,0.16))',
                }}
              >
                {/* Natural aspect — poster art already has torn edges; no CSS crop shell */}
                <Image
                  src="/zine/clipping-desk.jpg"
                  alt=""
                  width={640}
                  height={960}
                  sizes="220px"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    border: 'none',
                  }}
                />
              </Link>

            </div>
          </div>

          {rooms.map((room) => {
            const baseTransform = String(room.placement.transform ?? '');
            const isArticle = room.motif === 'article';
            const isTrendy = room.motif === 'trendy';
            const isInvesting = room.motif === 'investing';
            const isRecord = room.motif === 'record';
            const isPaper = isTrendy;
            const onDarkCursor = isDarkScrapMotif(room.motif);
            const desktopRoomStyle: CSSProperties = {
              ...room.placement,
              position: 'absolute',
              width: isArticle
                ? deskHeroWidth
                : isInvesting
                  ? deskSmallWidth
                  : isTrendy
                    ? 'min(70vw, 430px)'
                    : isRecord
                      ? 'min(56vw, 290px)'
                      : deskMediumWidth,
              minHeight: isArticle
                ? 'clamp(250px, 34dvh, 310px)'
                : isTrendy
                  ? undefined
                  : isRecord
                    ? 300
                    : undefined,
              height: undefined,
              padding: 0,
              border: isPaper ? '1px solid rgba(20,17,12,0.16)' : 'none',
              background: isPaper ? palette.paper : 'transparent',
              color: palette.ink,
              cursor: dragMeCursorFor(onDarkCursor),
              textDecoration: 'none',
              boxShadow: isPaper ? '0 24px 70px -42px rgba(20,17,12,0.5)' : 'none',
              transform: dragTransform(room.id, baseTransform),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: Number(room.placement.zIndex ?? 1),
            };

            return room.href.startsWith('http') ? (
              <a
                key={room.id}
                href={room.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-left sm:block"
                data-desk-role={room.id === 'woman-tech' ? 'hero' : 'rail'}
                style={desktopRoomStyle}
                aria-label={`Open ${room.label}`}
                {...dragHandlers(room.id)}
              >
                <ObjectFace room={room} />
              </a>
            ) : (
              <Link
                key={room.id}
                href={room.href}
                className="hidden text-left sm:block"
                data-desk-role={room.id === 'woman-tech' ? 'hero' : 'rail'}
                style={desktopRoomStyle}
                aria-label={`Open ${room.label}`}
                {...dragHandlers(room.id)}
              >
                <ObjectFace room={room} />
              </Link>
            );
          })}

          {/* Editorial table — hero left, ask center, rail right. Not a three-lane grid. */}
          <Link
            href="/dispatch#woman-in-tech"
            aria-label="Open Woman in Tech archive — cover print"
            className="absolute z-[8] hidden sm:block"
            style={{
              top: '9%',
              left: '34%',
              width: deskSmallWidth,
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursorOnDark,
              transform: dragTransform('woman-cover-print', 'rotate(2.2deg)'),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: 8,
              textDecoration: 'none',
            }}
            {...dragHandlers('woman-cover-print')}
          >
            <ScrapPhoto
              src="/dispatch-covers/harassment.jpg"
              filter="contrast(1.05) saturate(0.92)"
              overlay="linear-gradient(180deg, transparent 55%, rgba(20,17,12,0.58) 100%)"
            >
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 12,
                  zIndex: 1,
                  color: '#fffdf8',
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.95rem',
                  fontStyle: 'italic',
                  textShadow: '0 1px 10px rgba(0,0,0,0.5)',
                  pointerEvents: 'none',
                }}
              >
                essay
              </span>
            </ScrapPhoto>
          </Link>

          <Link
            href="/updates"
            aria-label="Open Metal & Pages — Didion readings"
            className="absolute z-[9] hidden lg:block"
            style={{
              top: '58%',
              left: '29%',
              width: deskSmallWidth,
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursorOnDark,
              transform: dragTransform('didion-scrap', 'rotate(-2.4deg)'),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: 9,
              textDecoration: 'none',
            }}
            {...dragHandlers('didion-scrap')}
          >
            <ScrapPhoto
              src="/dispatch-covers/books-joan-didion-readings.jpg"
              filter="saturate(0.88) contrast(1.04)"
              overlay="linear-gradient(180deg, transparent 50%, rgba(20,17,12,0.6) 100%)"
            >
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 10,
                  zIndex: 1,
                  color: '#fffdf8',
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  textShadow: '0 1px 10px rgba(0,0,0,0.45)',
                  pointerEvents: 'none',
                }}
              >
                reading
              </span>
            </ScrapPhoto>
          </Link>

          <Link
            href="/updates"
            aria-label="Open Metal & Pages — zine clipping poster"
            className="absolute z-[10] hidden md:block"
            style={{
              top: '34%',
              left: '58%',
              width: deskSmallWidth,
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursorOnDark,
              transform: dragTransform('zine-clipping', 'rotate(-2.6deg)'),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: 10,
              textDecoration: 'none',
              filter: 'drop-shadow(2px 8px 14px rgba(20,17,12,0.16))',
              position: 'relative' as const,
            }}
            {...dragHandlers('zine-clipping')}
          >
            <Image
              src="/zine/clipping-desk.jpg"
              alt=""
              width={640}
              height={960}
              sizes="128px"
              draggable={false}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                border: 'none',
                pointerEvents: 'none',
              }}
            />
          </Link>

          {/* Lived-in fragments — mixed with posters, not a gallery */}
          <Link
            href="/blog/pate-de-verre"
            aria-label="Open pâte de verre — kiln glass on the bench"
            data-lived-in="kiln-glass"
            className="absolute hidden sm:block"
            style={{
              top: '46%',
              left: '17%',
              width: deskSmallWidth,
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursor,
              transform: dragTransform('kiln-glass', livedInBase['kiln-glass']),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: livedInZ['kiln-glass'],
              textDecoration: 'none',
            }}
            {...dragHandlers('kiln-glass')}
          >
            <LivedInPrint
              src="/pate-glass.jpg"
              filter="saturate(0.9) contrast(1.02)"
              caption="kiln"
            />
          </Link>

          <Link
            href="/blog/misread"
            aria-label="Open Misread — street back, elsewhere"
            data-lived-in="street-back"
            className="absolute hidden sm:block"
            style={{
              top: '68%',
              left: '45%',
              width: deskTinyWidth,
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursorOnDark,
              transform: dragTransform('street-back', livedInBase['street-back']),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: livedInZ['street-back'],
              textDecoration: 'none',
            }}
            {...dragHandlers('street-back')}
          >
            <LivedInPrint
              src="/dispatch-covers/misread-boy-girl.jpg"
              filter="saturate(0.82) contrast(1.03)"
              caption="elsewhere"
            />
          </Link>

          <Link
            href="/sound#dj-set"
            aria-label="Open DJ set — vinyl surface"
            data-lived-in="vinyl-surface"
            className="absolute hidden md:block"
            style={{
              top: '56%',
              right: '26%',
              width: deskTinyWidth,
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursorOnDark,
              transform: dragTransform('vinyl-surface', livedInBase['vinyl-surface']),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: livedInZ['vinyl-surface'],
              textDecoration: 'none',
            }}
            {...dragHandlers('vinyl-surface')}
          >
            <LivedInPrint
              src="/dj-set/assets/covers/surface.jpg"
              filter="saturate(0.88) contrast(1.04)"
              caption="sound"
            />
          </Link>

          <button
            type="button"
            aria-label="Open Aileena console — machina portrait"
            data-desk-role="anchor"
            className="absolute z-[16] hidden sm:block"
            style={{
              top: '22%',
              left: '44%',
              width: deskAskWidth,
              padding: 0,
              margin: 0,
              border: 0,
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: dragMeCursorOnDark,
              transform: dragTransform('machina-polaroid', 'rotate(2.2deg)'),
              transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: 16,
            }}
            {...dragHandlers('machina-polaroid')}
            onClick={(event) => {
              if (event.currentTarget.dataset.dragged === 'true') return;
              window.dispatchEvent(new CustomEvent('open-agent-chat'));
            }}
          >
            <ScrapPhoto
              src="/bg_pic/03.jpeg"
              filter="saturate(0.94) contrast(1.04)"
            >
            </ScrapPhoto>
            <span
              style={{
                display: 'block',
                marginTop: 8,
                color: 'rgba(20,17,12,0.55)',
                fontFamily: 'Georgia, serif',
                fontSize: '0.9rem',
                fontStyle: 'italic',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              ask
            </span>
          </button>

          <nav
            className="absolute hidden flex-col items-end gap-1.5 sm:flex"
            aria-label="Social links"
            data-desk-role="links"
            style={{
              right: '10%',
              bottom: '5%',
              zIndex: 20,
            }}
          >
            {socialLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link key={link.label} href={link.href} style={socialLinkStyle}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} style={socialLinkStyle}>
                  {link.label}
                </a>
              )
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

const socialLinkStyle: CSSProperties = {
  color: palette.ink,
  fontFamily: 'Georgia, serif',
  fontSize: '0.92rem',
  fontStyle: 'italic',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const topLinkStyle: CSSProperties = {
  color: palette.ink,
  fontFamily: 'Georgia, serif',
  fontSize: '1rem',
  fontStyle: 'italic',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const thumbnailShellStyle: CSSProperties = {
  display: 'block',
  padding: 0,
  background: 'transparent',
  boxShadow: 'none',
};


/** Natural-aspect scrap — see `ScrapPhoto`. */
function ObjectFace({ room }: { room: RoomDoor }) {
  if (room.motif === 'article') {
    return (
      <span
        style={{
          position: 'relative',
          display: 'block',
          minHeight: 'clamp(250px, 34dvh, 310px)',
          padding: '4px 0 12px',
        }}
      >
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'block',
            width: deskHeroWidth,
            minHeight: 'clamp(240px, 32dvh, 300px)',
            padding: 'clamp(20px, 2.8dvh, 28px) clamp(16px, 2.6vw, 24px) clamp(16px, 2.4dvh, 22px)',
            background:
              'linear-gradient(165deg, #ffffff 0%, #fffdf8 55%, #f7f1e8 100%)',
            boxShadow: 'none',
            border: 'none',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 'clamp(18px, 3.2dvh, 26px)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'block',
                width: 28,
                height: 1,
                background: palette.oxblood,
                opacity: 0.55,
              }}
            />
            <span
              style={{
                color: palette.oxblood,
                fontFamily: mono,
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Viewpoint
            </span>
            <span
              aria-hidden
              style={{
                display: 'block',
                width: 28,
                height: 1,
                background: palette.oxblood,
                opacity: 0.55,
              }}
            />
          </span>
          <span
            style={{
              display: 'block',
              color: palette.ink,
              fontFamily: nunito,
              fontSize: 'clamp(1.45rem, 2.6vw, 2.1rem)',
              fontWeight: 850,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              margin: '0 auto clamp(12px, 2dvh, 18px)',
              maxWidth: 280,
              textAlign: 'center',
            }}
          >
            {room.signal}
          </span>
          <span
            aria-hidden
            style={{
              display: 'block',
              width: 36,
              height: 2,
              margin: '0 auto 12px',
              background: palette.softPink,
              opacity: 0.7,
            }}
          />
          <span
            style={{
              color: 'rgba(20,17,12,0.72)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.92rem',
              lineHeight: 1.4,
              margin: '0 auto',
              maxWidth: 280,
              overflow: 'hidden',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {room.blurb}
          </span>
        </span>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 14,
            bottom: 6,
            zIndex: 2,
            color: palette.softPink,
            fontFamily: "'Allura', cursive",
            fontSize: '1.28rem',
            lineHeight: 1,
            transform: 'rotate(-2deg)',
          }}
        >
          no more whisper network
        </span>
      </span>
    );
  }

  if (room.motif === 'investing') {
    return (
      <ScrapPhoto
        src="/dispatch-covers/investing-hero.jpg"
        style={{ width: '100%' }}
        overlay="linear-gradient(180deg, rgba(13,17,16,0.18) 0%, rgba(13,17,16,0.2) 35%, rgba(13,17,16,0.82) 100%)"
      >
        <span
          style={{
            position: 'absolute',
            left: 16,
            bottom: 18,
            zIndex: 1,
            color: '#fffdf8',
            fontFamily: 'Georgia, serif',
            fontSize: '1.05rem',
            fontStyle: 'italic',
            textShadow: '0 1px 10px rgba(0,0,0,0.45)',
          }}
        >
          investing
        </span>
      </ScrapPhoto>
    );
  }

  if (room.motif === 'trendy') {
    return (
      <span
        style={{
          position: 'relative',
          display: 'block',
          padding: 'clamp(34px, 5dvh, 42px) 32px 22px',
          background:
            `repeating-linear-gradient(180deg, transparent 0 33px, rgba(20,17,12,0.052) 34px 35px), linear-gradient(90deg, transparent 0 58px, ${palette.cyanSoft} 59px 60px, transparent 61px)`,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: 12,
            width: 116,
            height: 30,
            background: palette.amberSoft,
            transform: 'translateX(-50%) rotate(-1deg)',
          }}
        />
        <span
          style={{
            display: 'block',
            color: 'rgba(20,17,12,0.46)',
            fontFamily: mono,
            fontSize: '0.58rem',
            fontWeight: 800,
            letterSpacing: '0.34em',
            marginBottom: 18,
            textTransform: 'uppercase',
          }}
        >
          {room.category}
        </span>
        <span
          style={{
            display: 'block',
            color: palette.ink,
            fontFamily: "'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive",
            fontSize: 'clamp(2.1rem, 4.2vw, 3.75rem)',
            letterSpacing: '-0.055em',
            lineHeight: 0.86,
            marginBottom: 'clamp(14px, 2.4dvh, 22px)',
          }}
        >
          {room.signal}
        </span>
        <span
          style={{
            color: 'rgba(20,17,12,0.68)',
            fontFamily: 'Georgia, serif',
            fontSize: '1.02rem',
            lineHeight: 1.5,
            maxWidth: 368,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {room.blurb}
        </span>
        <span
          aria-hidden
          style={{
            display: 'flex',
            height: 38,
            alignItems: 'end',
            gap: 6,
            marginTop: 14,
          }}
        >
          {[18, 30, 14, 36, 22, 34, 16, 28, 20].map((height, idx) => (
            <span
              key={`${height}-${idx}`}
              style={{
                display: 'block',
                width: 5,
                height,
                borderRadius: 999,
                background: idx % 3 === 0 ? palette.cyan : 'rgba(20,17,12,0.18)',
              }}
            />
          ))}
        </span>
        <span
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
          }}
        >
          {['handmade', 'handwritten', 'podcast'].map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                border: '1px solid rgba(20,17,12,0.12)',
                borderRadius: 999,
                color: 'rgba(20,17,12,0.56)',
                fontFamily: mono,
                fontSize: '0.54rem',
                fontWeight: 800,
                letterSpacing: '0.18em',
                padding: '5px 10px',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </span>
          ))}
        </span>
        {room.note && (
          <span
            style={{
              display: 'block',
              color: palette.softPink,
              fontFamily: "'Allura', cursive",
              fontSize: '1.34rem',
              lineHeight: 1,
              marginTop: 14,
            }}
          >
            {room.note}
          </span>
        )}
      </span>
    );
  }

  if (room.motif === 'hbm') {
    return (
      <span style={thumbnailShellStyle}>
        <ScrapPhoto
          src="/dispatch-covers/investing-hero.jpg"
          filter="saturate(0.9) contrast(1.05)"
          overlay="linear-gradient(180deg, rgba(10,13,12,0.08), rgba(10,13,12,0.7))"
        >
          <span
            style={{
              position: 'absolute',
              left: 14,
              bottom: 14,
              zIndex: 1,
              color: '#fffdf8',
              fontFamily: 'Georgia, serif',
              fontSize: '1.05rem',
              fontStyle: 'italic',
              textShadow: '0 1px 10px rgba(0,0,0,0.55)',
            }}
          >
            magazine
          </span>
        </ScrapPhoto>
      </span>
    );
  }

  if (room.motif === 'pcb') {
    return (
      <span style={thumbnailShellStyle}>
        <ScrapPhoto
          src="/projects/keyshield.png"
          filter="saturate(0.9) contrast(1.08)"
          overlay="linear-gradient(90deg, rgba(8,16,18,0.72), rgba(8,16,18,0.18))"
        >
          <span
            style={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              zIndex: 1,
              color: '#fffdf8',
              fontFamily: 'Georgia, serif',
              fontSize: '1.05rem',
              fontStyle: 'italic',
              textShadow: '0 1px 10px rgba(0,0,0,0.55)',
            }}
          >
            news
          </span>
        </ScrapPhoto>
      </span>
    );
  }

  return (
    <span style={{ ...objectShellStyle, background: palette.soot, color: '#f5f1e8', position: 'relative' }}>
      <span style={{ ...objectKickerStyle, color: 'rgba(245,241,232,0.55)' }}>{room.category}</span>
      <span
        aria-hidden
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 168,
          height: 168,
          margin: '16px auto',
          borderRadius: '50%',
          background: `radial-gradient(circle, #f5f1e8 0 8%, ${palette.soot} 9% 28%, #f5f1e8 29% 30%, ${palette.soot} 31% 100%)`,
          boxShadow: '0 0 0 12px rgba(245,241,232,0.08)',
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: palette.amber }} />
      </span>
      <span style={{ ...objectTitleStyle, color: '#f5f1e8' }}>{room.label}</span>
      <span style={{ ...objectTextStyle, color: 'rgba(245,241,232,0.72)' }}>{room.signal}</span>
    </span>
  );
}

const objectShellStyle: CSSProperties = {
  display: 'block',
  minHeight: 250,
  padding: '22px 22px 24px',
  background: palette.paper,
  border: '1px solid rgba(20,17,12,0.16)',
  boxShadow: '0 22px 55px -40px rgba(20,17,12,0.5)',
};

const objectKickerStyle: CSSProperties = {
  display: 'block',
  color: 'rgba(20,17,12,0.52)',
  fontFamily: mono,
  fontSize: '0.56rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};

const objectTitleStyle: CSSProperties = {
  display: 'block',
  fontSize: '1.42rem',
  fontWeight: 650,
  letterSpacing: '-0.04em',
  lineHeight: 1,
  marginBottom: 10,
};

const objectTextStyle: CSSProperties = {
  display: 'block',
  color: 'rgba(20,17,12,0.68)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.93rem',
  lineHeight: 1.35,
};
