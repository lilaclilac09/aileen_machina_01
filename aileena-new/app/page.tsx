'use client';

import { useEffect, useState, type CSSProperties, type DragEvent } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import DJStation from '../components/DJStation';
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
  image: string;
  placement: CSSProperties;
};

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then a draggable clipping desk, then the DJ station,
 * then footer. Information is intentionally minimal: the homepage's job is
 * to set the mood, not to contain the content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  Clipping desk       — article scraps + social rail
 *   Section 03  Sound               — DJ station
 *   Section 04  Footer
 *
 * Cover-agent (Natalia portrait + Ask the agent) is preserved on the
 * cinematic opening; it doubles as the door to the agent department.
 *
 * Visual language: dark base (#070707), amber primary (#ffa726, the
 * editorial / Magazine signal), cyan accent (#00ffea, the agent /
 * machina signal). No third accent.
 */
export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];
  const [loaded, setLoaded] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const latestIssue = ALL_ISSUES[0];
  const latestIssueHref = latestIssue ? `/research/${latestIssue.slug}` : '/research';
  const latestDispatch = tx.blog.researchDispatch.posts.slice(-1)[0];
  const latestWomanInTech = tx.blog.womanInTech.posts[0];
  const rooms: RoomDoor[] = [
    {
      id: 'magazine',
      index: '01',
      label: 'Magazine',
      href: latestIssueHref,
      category: 'Issue',
      blurb: 'Interactive judgments, one issue at a time.',
      signal: latestIssue ? `${latestIssue.issueNumber} · ${latestIssue.coverTitle}` : 'Open the magazine rack',
      image: '/research/prop-amm-radar.png',
      placement: { top: '9%', left: '28%', transform: 'rotate(-5deg)', zIndex: 2 },
    },
    {
      id: 'dispatch',
      index: '02',
      label: 'News Desk',
      href: '/dispatch',
      category: 'Dispatch',
      blurb: 'Fresh dispatches and analysis.',
      signal: latestDispatch ? latestDispatch.title : 'Open the archive',
      image: '/dispatch-covers/investing-hero.jpg',
      placement: { top: '2%', right: '12%', transform: 'rotate(4deg)', zIndex: 1 },
    },
    {
      id: 'library',
      index: '03',
      label: 'Library',
      href: latestWomanInTech ? latestWomanInTech.href : '/dispatch',
      category: 'Long-form',
      blurb: 'Long-form essays and the back catalogue.',
      signal: latestWomanInTech ? latestWomanInTech.title : 'Open the catalogue',
      image: '/dispatch-covers/harassment.jpg',
      placement: { top: '39%', left: '13%', transform: 'rotate(3deg)', zIndex: 4 },
    },
    {
      id: 'sound',
      index: '04',
      label: 'Sound',
      href: '/sound',
      category: 'Set',
      blurb: 'DJ sets and the music she ships.',
      signal: 'Mix 02 · Berlin',
      image: '/berlin.jpg',
      placement: { top: '42%', right: '7%', transform: 'rotate(-2deg)', zIndex: 3 },
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
            className="h-full flex flex-col bg-[#070707] relative overflow-hidden"
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
                boxShadow: '0 60px 140px -40px rgba(0,255,234,0.18), 0 0 0 1px rgba(0,255,234,0.18)',
                maskImage: 'linear-gradient(270deg, #000 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(270deg, #000 60%, transparent 100%)',
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
                boxShadow: '0 30px 60px -20px rgba(0,255,234,0.25)',
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
                    color: '#fff',
                    marginBottom: 40,
                    textShadow: '0 4px 30px rgba(0,0,0,0.6)',
                  }}
                >
                  {tx.hero.line}
                </h1>
                <div
                  className="anim-up-3"
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}
                >
                  <Link
                    href={latestIssueHref}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#ffa726',
                      color: '#070707',
                      padding: '14px 26px',
                      borderRadius: 999,
                      fontFamily: mono,
                      fontSize: '0.68rem',
                      letterSpacing: '0.28em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 14px 40px -10px rgba(255,167,38,0.55)',
                    }}
                  >
                    Open the latest issue →
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'transparent',
                      color: '#00ffea',
                      padding: '13px 22px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,255,234,0.45)',
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
                        background: '#00ffea',
                        boxShadow: '0 0 8px rgba(0,255,234,0.9)',
                      }}
                    />
                    Ask the agent
                  </button>
                </div>
              </div>
            </div>

            {/* Scroll cue */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade z-10">
              <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/25" />
              <span
                className="text-white/30"
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

        {/* ── 03 SOUND — DJ station ─────────────────────────────── */}
        <SnapSection id="sound" className="order-3">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-12 pt-6 pb-4 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px]" style={{ fontFamily: nunito }}>
              <div className="flex items-end border-b border-white/8 pb-3 mb-6">
                <p className="text-[0.58rem] uppercase tracking-[0.55em] text-white/25" style={{ fontWeight: 500 }}>
                  {tx.sound.tag}
                </p>
              </div>
              <DJStation />
            </div>
          </div>
        </SnapSection>

        {/* ── 04 FOOTER ─────────────────────────────────────────── */}
        <SnapSection className="order-4">
          <div
            className="h-full flex flex-col justify-end bg-[#030303] px-6 sm:px-10 lg:px-16 py-14 sm:py-16"
            style={{ fontFamily: nunito }}
          >
            <div className="mx-auto w-full max-w-[920px]">
              <p className="anim-up text-sm leading-7 text-white/45 mb-10 max-w-md" style={{ fontWeight: 400 }}>
                {tx.footer.body}
              </p>
              <div className="grid grid-cols-2 gap-10 sm:gap-14 mb-10">
                {tx.footer.columns.map((col) => (
                  <div key={col.heading} className="anim-left">
                    <h3 className="text-[0.66rem] uppercase tracking-[0.28em] text-white/35 mb-4" style={{ fontWeight: 500 }}>
                      {col.heading}
                    </h3>
                    <ul className="space-y-2.5 text-[0.92rem] text-white/55" style={{ fontWeight: 400 }}>
                      {col.links.map((link) => (
                        <li key={link.label}>
                          {link.href.startsWith('http')
                            ? <a href={link.href} className="hover:text-white transition-colors">{link.label}</a>
                            : <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="anim-fade text-[0.6rem] tracking-[0.3em] text-white/25" style={{ fontWeight: 500 }}>
                EST 2025 · AILEENA · MACHINA
              </p>
            </div>
          </div>
        </SnapSection>

      </SnapContainer>
    </>
  );
}

function AtriumDragDock({ rooms }: { rooms: RoomDoor[] }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
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
        background: 'linear-gradient(#050505 0 76px, #f5f1e8 76px)',
      }}
    >
      <div
        className="relative mx-auto flex h-full w-full max-w-[1280px] flex-col overflow-hidden pb-10 pt-24 sm:pb-12 sm:pt-24"
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
          <div>
            <p
              className="anim-up"
              style={{
                color: '#17130d',
                fontFamily: 'Georgia, serif',
                fontSize: '1rem',
                fontStyle: 'italic',
                marginBottom: 10,
              }}
            >
              drag me
            </p>
            <h2
              className="anim-up-2"
              style={{
                color: '#14110c',
                fontSize: 'clamp(2.1rem, 5vw, 4.6rem)',
                fontWeight: 500,
                letterSpacing: '-0.035em',
                lineHeight: 0.95,
                maxWidth: 560,
              }}
            >
              Clip an article. Drop into the room.
            </h2>
          </div>
        </header>

        <div
          className="relative z-10 mt-5 min-h-[520px] flex-1 sm:mt-2"
          style={{
            outline: dropActive ? '1px dashed rgba(20,17,12,0.32)' : '1px dashed transparent',
            outlineOffset: -18,
            transition: 'outline-color 0.18s ease',
          }}
        >
          <p
            className="absolute left-[8%] top-[39%] z-30 hidden sm:block"
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
                className="anim-up-2 text-left"
                style={{
                  ...room.placement,
                  position: 'absolute',
                  width: 'min(70vw, 360px)',
                  minHeight: 286,
                  padding: 0,
                  border: '1px solid rgba(20,17,12,0.14)',
                  background: '#fffdf7',
                  color: '#14110c',
                  cursor: isActive ? 'grabbing' : 'grab',
                  boxShadow: isActive
                    ? '0 34px 90px -34px rgba(20,17,12,0.55)'
                    : '0 24px 70px -42px rgba(20,17,12,0.5)',
                  transform: `${baseTransform} ${isActive ? 'scale(1.035)' : ''}`,
                  transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                }}
                aria-label={`Open ${room.label}`}
              >
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    height: 128,
                    backgroundImage: `url('${room.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'saturate(0.86) contrast(1.02)',
                  }}
                />
                <span style={{ display: 'block', padding: '18px 20px 20px' }}>
                  <span
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 12,
                      color: 'rgba(20,17,12,0.58)',
                      fontFamily: mono,
                      fontSize: '0.58rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>{room.category}</span>
                    <span>{room.index}</span>
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'clamp(1.5rem, 2.7vw, 2.15rem)',
                      fontWeight: 600,
                      letterSpacing: '-0.035em',
                      lineHeight: 0.98,
                      marginBottom: 14,
                    }}
                  >
                    {room.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      color: 'rgba(20,17,12,0.72)',
                      fontFamily: 'Georgia, serif',
                      fontSize: '1rem',
                      lineHeight: 1.38,
                    }}
                  >
                    {room.signal}
                  </span>
                </span>
              </button>
            );
          })}

          <div
            aria-hidden
            className="absolute right-[12%] top-[48%] z-[5] hidden h-[98px] w-[310px] items-center justify-center sm:flex"
            style={{
              background: '#ff1f9a',
              color: '#14110c',
              border: '4px solid #ff1f9a',
              boxShadow: '0 12px 0 rgba(20,17,12,0.88)',
              transform: 'rotate(2deg)',
              fontSize: 'clamp(2.8rem, 6vw, 4.6rem)',
              fontWeight: 900,
              letterSpacing: '-0.08em',
              WebkitTextStroke: '1px #f5f1e8',
            }}
          >
            words
          </div>

          <p
            className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
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

          <nav className="ml-auto flex flex-col items-end gap-2" aria-label="Social links">
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
