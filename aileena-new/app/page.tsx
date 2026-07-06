'use client';

import { useEffect, useState, type CSSProperties, type DragEvent } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';
import { ALL_ISSUES } from '../lib/research/issues';
import './blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const SESSION_LOADED_KEY = 'aileena_loaded_once';

type RoomDoor = {
  id: string;
  index: string;
  label: string;
  href: string;
  category: string;
  blurb: string;
  signal: string;
  motif: 'article' | 'hbm' | 'pcb' | 'trendy' | 'record';
  placement: CSSProperties;
  note?: string;
  glassItems?: VisualItem[];
};

type VisualItem = {
  src: string;
  alt: string;
  caption: string;
  href?: string;
};

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then one draggable clipping desk. Information is
 * intentionally minimal: the homepage's job is to set the mood, not to
 * contain the content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  Clipping desk       — article scraps + handmade/podcast signals
 *
 * Cover-agent (Natalia portrait + Ask the agent) is preserved on the
 * cinematic opening; it doubles as the door to the agent department.
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
  const latestIssueHref = latestIssue ? `/research/${latestIssue.slug}` : '/research';
  const latestDispatch = tx.blog.researchDispatch.posts.slice(-1)[0];
  const metooArticle = tx.blog.womanInTech.posts.find((post) => post.href === '/blog/harassment') ?? tx.blog.womanInTech.posts[0];
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
      placement: { top: '4%', left: '39%', transform: 'rotate(-4deg)', zIndex: 4 },
    },
    {
      id: 'dispatch',
      index: '02',
      label: 'News Desk',
      href: '/dispatch',
      category: 'PCB stack',
      blurb: 'GB200 boards, CCL, M8/M9, and who gets to choose the board.',
      signal: latestDispatch ? latestDispatch.title : 'Open the archive',
      motif: 'pcb',
      placement: { top: '7%', right: '4%', transform: 'rotate(3deg)', zIndex: 2 },
    },
    {
      id: 'library',
      index: '03',
      label: 'Library',
      href: metooArticle ? metooArticle.href : '/dispatch',
      category: 'Woman in Tech',
      blurb: metooArticle ? metooArticle.body : 'Long-form essays and the back catalogue.',
      signal: metooArticle ? metooArticle.title : 'Every Woman in Tech Has a #MeToo Story',
      motif: 'article',
      placement: { top: '19%', left: '4%', transform: 'rotate(-1.5deg)', zIndex: 6 },
    },
    {
      id: 'trendy',
      index: '04',
      label: 'Trendy',
      href: tx.trendy.podcast.kateHref,
      category: tx.trendy.tag,
      blurb: `${tx.trendy.body} The listening shelf sits next to the glass bench: handmade, handwritten, replayed until it turns into taste.`,
      signal: tx.trendy.heading,
      motif: 'trendy',
      note: tx.visual.note,
      glassItems: tx.visual.items,
      placement: { top: '31%', left: '34%', transform: 'rotate(1.5deg)', zIndex: 8 },
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
                    color: '#ffa726',
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
                    color: '#14110c',
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
                      gap: 8,
                      background: '#fff',
                      color: '#00a99f',
                      padding: '13px 22px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,169,159,0.38)',
                      fontFamily: mono,
                      fontSize: '0.64rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    aria-label={tx.hero.talkAgent}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#00a99f',
                        boxShadow: '0 0 8px rgba(0,169,159,0.55)',
                      }}
                    />
                    Ask the agent
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

        {/* ── 02 DRAG DOCK — rooms as movable signals ───────────── */}
        <SnapSection id="dock" className="order-2">
          <AtriumDragDock rooms={rooms} />
        </SnapSection>

      </SnapContainer>
    </>
  );
}

function AtriumDragDock({ rooms }: { rooms: RoomDoor[] }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const glassItems = rooms.find((room) => room.id === 'trendy')?.glassItems ?? [];
  const socialLinks = [
    { label: 'github', href: 'https://github.com/lilaclilac09' },
    { label: 'substack', href: '/dispatch' },
    { label: 'airmail', href: 'mailto:rosazxc0915@gmail.com' },
    { label: 'sound', href: '/sound' },
  ];

  function enterRoom(room: RoomDoor) {
    setEnteringId(room.id);
    window.setTimeout(() => {
      window.location.href = room.href;
    }, 180);
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, room: RoomDoor) {
    setDraggingId(room.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-aileena-room', room.id);
    event.dataTransfer.setData('text/plain', room.id);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedId = event.dataTransfer.getData('application/x-aileena-room') || draggingId;
    const room = rooms.find((item) => item.id === droppedId);

    setDropActive(false);
    setDraggingId(null);
    if (room) enterRoom(room);
  }

  return (
    <div
      className="h-full px-5 sm:px-9 lg:px-14"
      style={{
        fontFamily: nunito,
        background: '#fff',
      }}
    >
      <div
        className="relative mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden pb-8 pt-[92px] sm:pb-10"
        onDragEnter={(event) => {
          event.preventDefault();
          setDropActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setDropActive(true);
        }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            setDropActive(false);
          }
        }}
        onDrop={handleDrop}
      >
        <header className="relative z-20 flex items-start justify-between gap-6">
          <a
            href="mailto:rosazxc0915@gmail.com"
            className="hidden sm:inline-block"
            style={{
              color: '#17130d',
              fontFamily: 'Georgia, serif',
              fontSize: '1.02rem',
              fontStyle: 'italic',
              lineHeight: 1.3,
              textDecoration: 'none',
            }}
          >
            Aileena Machina
          </a>
          <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Article rooms">
            {rooms.map((room) => (
              room.href.startsWith('http') ? (
                <a key={room.id} href={room.href} target="_blank" rel="noopener noreferrer" style={topLinkStyle}>
                  {room.label.toLowerCase()}.
                </a>
              ) : (
                <Link key={room.id} href={room.href} style={topLinkStyle}>
                  {room.label.toLowerCase()}.
                </Link>
              )
            ))}
          </nav>
        </header>

        <div
          className="relative z-10 min-h-0 flex-1 sm:min-h-[610px]"
          style={{
            outline: dropActive ? '1px dashed rgba(20,17,12,0.32)' : '1px dashed transparent',
            outlineOffset: -18,
            transition: 'outline-color 0.18s ease',
          }}
        >
          <div className="h-full overflow-y-auto pb-8 pt-4 sm:hidden">
            <div className="grid gap-4">
              {rooms.map((room) => {
                const isArticle = room.motif === 'article';
                const isTrendy = room.motif === 'trendy';
                const isRecord = room.motif === 'record';
                const isPaper = isArticle || isTrendy;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => enterRoom(room)}
                    className="text-left"
                    style={{
                      width: '100%',
                      minHeight: isArticle ? 360 : isTrendy ? 390 : isRecord ? 280 : 238,
                      height: isTrendy ? 390 : undefined,
                      padding: 0,
                      border: isPaper ? '1px solid rgba(20,17,12,0.2)' : 'none',
                      background: isPaper ? '#fffdf7' : 'transparent',
                      color: '#14110c',
                      cursor: 'pointer',
                      boxShadow: isPaper ? '0 24px 70px -48px rgba(20,17,12,0.5)' : 'none',
                    }}
                    aria-label={`Open ${room.label}`}
                  >
                    <ObjectFace room={room} />
                  </button>
                );
              })}

              {glassItems.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {glassItems.map((img) => (
                    <Link
                      key={img.src}
                      href={img.href ?? '/blog/pate-de-verre'}
                      className="block bg-white p-2 pb-4 no-underline"
                      aria-label={img.caption}
                      style={{ boxShadow: '0 18px 42px -32px rgba(20,17,12,0.55)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="aspect-square w-full object-cover"
                        style={{ display: 'block' }}
                      />
                      <span
                        className="mt-2 block text-center"
                        style={{
                          color: '#ff6f91',
                          fontFamily: "'Allura', cursive",
                          fontSize: '1.1rem',
                          lineHeight: 0.92,
                        }}
                      >
                        {img.caption}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p
            className="absolute left-[8%] top-[31%] z-30 hidden sm:block"
            style={{
              color: 'rgba(20,17,12,0.62)',
              fontFamily: 'Georgia, serif',
              fontSize: '1rem',
              fontStyle: 'italic',
              transform: 'rotate(-8deg)',
            }}
          >
            drag me
          </p>

          {rooms.map((room) => {
            const isActive = draggingId === room.id || enteringId === room.id;
            const baseTransform = String(room.placement.transform ?? '');
            const isArticle = room.motif === 'article';
            const isTrendy = room.motif === 'trendy';
            const isRecord = room.motif === 'record';
            const isPaper = isArticle || isTrendy;

            return (
              <button
                key={room.id}
                type="button"
                draggable
                onClick={() => enterRoom(room)}
                onDragStart={(event) => handleDragStart(event, room)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropActive(false);
                }}
                className="hidden text-left sm:block"
                style={{
                  ...room.placement,
                  position: 'absolute',
                  width: isArticle ? 'min(78vw, 430px)' : isTrendy ? 'min(76vw, 470px)' : isRecord ? 'min(56vw, 290px)' : 'min(60vw, 330px)',
                  minHeight: isArticle ? 420 : isTrendy ? 390 : isRecord ? 300 : 250,
                  height: isTrendy ? 390 : undefined,
                  padding: 0,
                  border: isPaper ? '1px solid rgba(20,17,12,0.2)' : 'none',
                  background: isPaper ? '#fffdf7' : 'transparent',
                  color: '#14110c',
                  cursor: isActive ? 'grabbing' : 'grab',
                  boxShadow: isActive
                    ? '0 34px 90px -34px rgba(20,17,12,0.55)'
                    : isPaper
                      ? '0 24px 70px -42px rgba(20,17,12,0.5)'
                      : 'none',
                  transform: `${baseTransform} ${isActive ? 'scale(1.035)' : ''}`,
                  transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                }}
                aria-label={`Open ${room.label}`}
              >
                <ObjectFace room={room} />
              </button>
            );
          })}

          {glassItems.length > 0 && (
            <div className="absolute bottom-[7%] left-[46%] z-[11] hidden -translate-x-1/2 items-end gap-3 sm:flex">
              {glassItems.map((img, idx) => (
                <Link
                  key={img.src}
                  href={img.href ?? '/blog/pate-de-verre'}
                  className="block no-underline"
                  aria-label={img.caption}
                  style={{
                    transform: `rotate(${[-6, 2, -2, 5][idx % 4]}deg)`,
                    transition: 'transform 0.18s ease',
                  }}
                >
                  <figure
                    className="m-0 bg-white p-2 pb-4"
                    style={{
                      width: 98,
                      boxShadow: '0 18px 42px -30px rgba(20,17,12,0.65)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="aspect-square w-full object-cover"
                      style={{ display: 'block' }}
                    />
                    <figcaption
                      className="mt-2 text-center"
                      style={{
                        color: '#ff6f91',
                        fontFamily: "'Allura', cursive",
                        fontSize: '1.04rem',
                        lineHeight: 0.92,
                      }}
                    >
                      {img.caption}
                    </figcaption>
                  </figure>
                </Link>
              ))}
            </div>
          )}

          <div
            aria-hidden
            className="absolute right-[11%] top-[38%] z-[7] hidden h-[168px] w-[360px] overflow-hidden sm:block"
            style={{
              background:
                'radial-gradient(circle at 78% 24%, rgba(255,255,255,0.92) 0 40px, transparent 41px), linear-gradient(135deg, #ff2f2f 0%, #14110c 48%, #09d66f 100%)',
              border: '6px solid #f8f5ee',
              borderRadius: 22,
              boxShadow: '0 0 0 7px #ff1f9a, 0 14px 0 rgba(20,17,12,0.92), 0 28px 60px -28px rgba(20,17,12,0.75)',
              transform: 'rotate(2deg)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 16,
                top: 13,
                display: 'flex',
                gap: 8,
              }}
            >
              {['11.3x', '19.4x', '12.4x'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px 2px',
                    background: '#f8f5ee',
                    border: '2px solid #14110c',
                    borderRadius: 8,
                    color: '#14110c',
                    fontFamily: mono,
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    transform: 'rotate(-3deg)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </span>
            <span
              style={{
                position: 'absolute',
                left: 22,
                bottom: 16,
                color: '#f8f5ee',
                fontSize: '2.65rem',
                fontWeight: 950,
                letterSpacing: '-0.08em',
                lineHeight: 0.84,
                textShadow: '4px 4px 0 #14110c',
                WebkitTextStroke: '1px #14110c',
              }}
            >
              JENSEN
              <br />
              STICKER
            </span>
            <span
              style={{
                position: 'absolute',
                right: 28,
                bottom: 22,
                width: 92,
                height: 112,
                borderRadius: '46% 46% 40% 40%',
                background: '#f3c49a',
                border: '4px solid #14110c',
                boxShadow: 'inset 0 -14px 0 rgba(20,17,12,0.16)',
              }}
            >
              <span style={{ position: 'absolute', left: 18, top: 36, width: 56, height: 14, border: '3px solid #14110c', borderRadius: 999, background: 'rgba(248,245,238,0.88)' }} />
              <span style={{ position: 'absolute', left: 21, top: 39, width: 14, height: 8, borderRadius: '50%', background: '#14110c' }} />
              <span style={{ position: 'absolute', right: 21, top: 39, width: 14, height: 8, borderRadius: '50%', background: '#14110c' }} />
              <span style={{ position: 'absolute', left: 28, top: 67, width: 36, height: 16, borderBottom: '4px solid #14110c', borderRadius: '0 0 999px 999px' }} />
              <span style={{ position: 'absolute', left: -7, bottom: -20, width: 106, height: 38, borderRadius: '18px 18px 0 0', background: '#14110c' }} />
            </span>
            <span
              style={{
                position: 'absolute',
                right: 18,
                top: 16,
                padding: '4px 8px',
                borderRadius: 8,
                background: '#76ff03',
                color: '#14110c',
                fontFamily: mono,
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.02em',
              }}
            >
              NVIDIA
            </span>
          </div>

          <p
            className="absolute bottom-4 left-1/2 z-[1] hidden -translate-x-1/2 sm:block"
            style={{
              color: 'rgba(20,17,12,0.8)',
              fontFamily: 'Georgia, serif',
              fontSize: '1.05rem',
              fontStyle: 'italic',
            }}
          >
            {dropActive ? 'release to open' : 'refresh'}
          </p>
        </div>

        <div className="relative z-20 mb-1 flex items-end justify-between gap-6">
          <p
            className="hidden max-w-[520px] text-[0.9rem] sm:block"
            style={{
              color: 'rgba(20,17,12,0.82)',
              fontFamily: 'Georgia, serif',
              fontSize: '1.02rem',
              fontStyle: 'italic',
              lineHeight: 1.45,
            }}
          >
            For collaboration, notes, and strange little dispatches, write to{' '}
            <a href="mailto:rosazxc0915@gmail.com" style={{ color: '#14110c', textDecoration: 'underline' }}>
              rosazxc0915@gmail.com
            </a>
          </p>

          <nav className="ml-auto hidden flex-col items-end gap-2 sm:flex" aria-label="Social links">
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
  color: '#14110c',
  fontFamily: 'Georgia, serif',
  fontSize: '1.08rem',
  fontStyle: 'italic',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const topLinkStyle: CSSProperties = {
  color: '#14110c',
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
};

const thumbnailTitleStyle: CSSProperties = {
  display: 'block',
  color: '#14110c',
  fontSize: '1.45rem',
  fontWeight: 850,
  letterSpacing: '-0.055em',
  lineHeight: 0.98,
  marginTop: 14,
  maxWidth: 292,
};

const thumbnailDekStyle: CSSProperties = {
  display: 'block',
  color: 'rgba(20,17,12,0.68)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.92rem',
  lineHeight: 1.24,
  marginTop: 8,
  maxWidth: 292,
};

function ObjectFace({ room }: { room: RoomDoor }) {
  if (room.motif === 'article') {
    return (
      <span
        style={{
          display: 'block',
          minHeight: 420,
          padding: '42px 34px 32px',
          background:
            'repeating-linear-gradient(180deg, transparent 0 33px, rgba(20,17,12,0.055) 34px 35px), linear-gradient(90deg, transparent 0 56px, rgba(255,94,166,0.12) 57px 58px, transparent 59px)',
        }}
      >
        <span
          style={{
            display: 'block',
            color: 'rgba(20,17,12,0.62)',
            fontFamily: mono,
            fontSize: '0.56rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            marginBottom: 6,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Viewpoint
        </span>
        <span
          style={{
            display: 'block',
            color: 'rgba(20,17,12,0.64)',
            fontFamily: mono,
            fontSize: '0.54rem',
            letterSpacing: '0.22em',
            marginBottom: 18,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Woman in Tech
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 'clamp(2.05rem, 4.2vw, 3.8rem)',
            fontWeight: 500,
            letterSpacing: '-0.055em',
            lineHeight: 0.94,
            margin: '0 auto 24px',
            maxWidth: 350,
            textAlign: 'center',
            fontFamily: "'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive",
          }}
        >
          {room.signal}
        </span>
        <span
          style={{
            color: 'rgba(20,17,12,0.72)',
            fontFamily: 'Georgia, serif',
            fontSize: '0.98rem',
            lineHeight: 1.52,
            margin: '0 auto',
            maxWidth: 320,
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
    );
  }

  if (room.motif === 'trendy') {
    return (
      <span
        style={{
          position: 'relative',
          display: 'block',
          height: 390,
          overflow: 'hidden',
          padding: '42px 32px 24px',
          background:
            'repeating-linear-gradient(180deg, transparent 0 33px, rgba(20,17,12,0.052) 34px 35px), linear-gradient(90deg, transparent 0 58px, rgba(255,94,166,0.12) 59px 60px, transparent 61px)',
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
            background: 'rgba(255,189,95,0.42)',
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
            color: '#14110c',
            fontFamily: "'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive",
            fontSize: 'clamp(2.45rem, 4.8vw, 4.25rem)',
            letterSpacing: '-0.055em',
            lineHeight: 0.86,
            marginBottom: 22,
          }}
        >
          {room.signal}
        </span>
        <span
          style={{
            display: 'block',
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
                background: idx % 3 === 0 ? '#00a99f' : 'rgba(20,17,12,0.18)',
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
          {['handmade', 'handwritten', 'podcast', 'visual'].map((tag) => (
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
              color: '#ff6f91',
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
        <span
          aria-hidden
          style={{
            position: 'relative',
            display: 'block',
            height: 178,
            overflow: 'hidden',
            borderRadius: 14,
            background:
              'radial-gradient(circle at 24% 34%, #f2c09a 0 30px, transparent 31px), radial-gradient(circle at 50% 34%, #f2c09a 0 34px, transparent 35px), radial-gradient(circle at 78% 34%, #f2c09a 0 30px, transparent 31px), linear-gradient(135deg, #b80000 0%, #240000 48%, #070707 100%)',
            boxShadow: 'inset 0 0 0 3px #14110c',
          }}
        >
          {['11.3x', '19.4x', '12.4x'].map((tag, idx) => (
            <span
              key={tag}
              style={{
                position: 'absolute',
                left: 10 + idx * 86,
                top: 10,
                padding: '3px 8px 2px',
                borderRadius: 8,
                border: '2px solid #14110c',
                background: '#f8f5ee',
                color: '#14110c',
                fontFamily: mono,
                fontSize: '1.02rem',
                fontWeight: 950,
                letterSpacing: '-0.06em',
                transform: `rotate(${idx === 1 ? -2 : 2}deg)`,
              }}
            >
              {tag}
            </span>
          ))}
          {[24, 111, 202].map((left, idx) => (
            <span
              key={left}
              style={{
                position: 'absolute',
                left,
                bottom: 34,
                width: 58,
                height: 76,
                borderRadius: '44% 44% 38% 38%',
                background: '#f2c09a',
                border: '3px solid #14110c',
                boxShadow: '0 20px 0 #14110c',
                transform: `rotate(${idx === 1 ? 0 : idx === 0 ? -4 : 4}deg)`,
              }}
            >
              <span style={{ position: 'absolute', left: 11, top: 26, width: 36, height: 10, border: '2px solid #14110c', borderRadius: 999, background: '#f8f5ee' }} />
              <span style={{ position: 'absolute', left: 21, top: 47, width: 18, height: 9, borderBottom: '3px solid #14110c', borderRadius: '0 0 999px 999px' }} />
            </span>
          ))}
          <span
            style={{
              position: 'absolute',
              left: 12,
              bottom: 8,
              display: 'flex',
              gap: 8,
            }}
          >
            {['HPE', 'NVIDIA', 'ASIC'].map((logo) => (
              <span
                key={logo}
                style={{
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: logo === 'NVIDIA' ? '#76ff03' : '#f8f5ee',
                  border: '2px solid #14110c',
                  color: '#14110c',
                  fontFamily: mono,
                  fontSize: '0.72rem',
                  fontWeight: 900,
                }}
              >
                {logo}
              </span>
            ))}
          </span>
        </span>
        <span style={thumbnailTitleStyle}>5 AI Supply Bets</span>
        <span style={thumbnailDekStyle}>{room.signal}</span>
      </span>
    );
  }

  if (room.motif === 'pcb') {
    return (
      <span style={thumbnailShellStyle}>
        <span
          aria-hidden
          style={{
            position: 'relative',
            display: 'block',
            height: 178,
            overflow: 'hidden',
            borderRadius: 14,
            background:
              'linear-gradient(90deg, rgba(8,16,18,0.92), rgba(8,16,18,0.1)), repeating-linear-gradient(90deg, #161616 0 18px, #252525 19px 24px), #0a0a0a',
            boxShadow: 'inset 0 0 0 3px #14110c',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              color: '#f8f5ee',
              fontSize: '2.35rem',
              fontWeight: 950,
              letterSpacing: '-0.08em',
              lineHeight: 0.9,
              textShadow: '3px 3px 0 #14110c',
            }}
          >
            800V
            <br />
            IS HERE
          </span>
          {[0, 1, 2, 3, 4].map((idx) => (
            <span
              key={idx}
              style={{
                position: 'absolute',
                right: 22 + idx * 24,
                bottom: 22,
                width: 14,
                height: 98 + idx * 8,
                borderRadius: 5,
                background: idx % 2 === 0 ? '#1f1f1f' : '#333',
                border: '2px solid rgba(248,245,238,0.65)',
              }}
            />
          ))}
          <span
            style={{
              position: 'absolute',
              right: 28,
              top: 28,
              width: 78,
              height: 78,
              borderRight: '5px solid #76ff03',
              borderBottom: '5px solid #76ff03',
              borderRadius: '0 0 50% 0',
              transform: 'rotate(8deg)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 28,
              bottom: 28,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: '#f8f5ee',
              boxShadow: '0 0 0 4px #76ff03',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 16,
              bottom: 15,
              padding: '4px 9px',
              borderRadius: 8,
              background: '#f8f5ee',
              color: '#14110c',
              fontFamily: mono,
              fontSize: '0.72rem',
              fontWeight: 900,
            }}
          >
            PCB / CCL / M9
          </span>
        </span>
      </span>
    );
  }

  return (
    <span style={{ ...objectShellStyle, background: '#101010', color: '#f5f1e8' }}>
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
          background: 'radial-gradient(circle, #f5f1e8 0 8%, #101010 9% 28%, #f5f1e8 29% 30%, #101010 31% 100%)',
          boxShadow: '0 0 0 12px rgba(245,241,232,0.08)',
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#ffa726' }} />
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
  background: '#fffdf7',
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
