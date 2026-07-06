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
  motif: 'article' | 'radar' | 'ticker' | 'record';
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
      motif: 'radar',
      placement: { top: '4%', left: '39%', transform: 'rotate(-4deg)', zIndex: 4 },
    },
    {
      id: 'dispatch',
      index: '02',
      label: 'News Desk',
      href: '/dispatch',
      category: 'Dispatch',
      blurb: 'Fresh dispatches and analysis.',
      signal: latestDispatch ? latestDispatch.title : 'Open the archive',
      motif: 'ticker',
      placement: { top: '9%', right: '7%', transform: 'rotate(3deg)', zIndex: 2 },
    },
    {
      id: 'library',
      index: '03',
      label: 'Library',
      href: latestWomanInTech ? latestWomanInTech.href : '/dispatch',
      category: 'Long-form',
      blurb: latestWomanInTech ? latestWomanInTech.body : 'Long-form essays and the back catalogue.',
      signal: latestWomanInTech ? latestWomanInTech.title : 'Open the catalogue',
      motif: 'article',
      placement: { top: '19%', left: '4%', transform: 'rotate(-1.5deg)', zIndex: 6 },
    },
    {
      id: 'sound',
      index: '04',
      label: 'Sound',
      href: '/sound',
      category: 'Set',
      blurb: 'DJ sets and the music she ships.',
      signal: 'Mix 02 · Berlin',
      motif: 'record',
      placement: { top: '42%', right: '19%', transform: 'rotate(-2deg)', zIndex: 5 },
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
        background: 'linear-gradient(#050505 0 76px, #f8f5ee 76px)',
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
              <Link key={room.id} href={room.href} style={topLinkStyle}>
                {room.label.toLowerCase()}.
              </Link>
            ))}
          </nav>
        </header>

        <div
          className="relative z-10 min-h-[610px] flex-1"
          style={{
            outline: dropActive ? '1px dashed rgba(20,17,12,0.32)' : '1px dashed transparent',
            outlineOffset: -18,
            transition: 'outline-color 0.18s ease',
          }}
        >
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
            const isRecord = room.motif === 'record';

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
                  width: isArticle ? 'min(78vw, 430px)' : isRecord ? 'min(56vw, 290px)' : 'min(60vw, 330px)',
                  minHeight: isArticle ? 420 : isRecord ? 300 : 250,
                  padding: 0,
                  border: isArticle ? '1px solid rgba(20,17,12,0.2)' : 'none',
                  background: isArticle ? '#fffdf7' : 'transparent',
                  color: '#14110c',
                  cursor: isActive ? 'grabbing' : 'grab',
                  boxShadow: isActive
                    ? '0 34px 90px -34px rgba(20,17,12,0.55)'
                    : isArticle
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

          <div
            aria-hidden
            className="absolute right-[14%] top-[39%] z-[7] hidden h-[92px] w-[300px] items-center justify-center sm:flex"
            style={{
              background:
                'radial-gradient(circle at 18% 34%, #14110c 0 7px, transparent 8px), radial-gradient(circle at 42% 68%, #14110c 0 6px, transparent 7px), radial-gradient(circle at 72% 38%, #14110c 0 8px, transparent 9px), #f2d6ab',
              color: '#14110c',
              border: '7px solid #ff1f9a',
              borderRadius: 18,
              boxShadow: '0 6px 0 #ff1f9a, 0 16px 0 rgba(20,17,12,0.9)',
              transform: 'rotate(2deg)',
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 900,
              letterSpacing: '-0.07em',
              textShadow: '3px 3px 0 #f8f5ee, -2px -2px 0 #f8f5ee',
              WebkitTextStroke: '1px #14110c',
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

const topLinkStyle: CSSProperties = {
  color: '#14110c',
  fontFamily: 'Georgia, serif',
  fontSize: '1rem',
  fontStyle: 'italic',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

function ObjectFace({ room }: { room: RoomDoor }) {
  if (room.motif === 'article') {
    return (
      <span style={{ display: 'block', padding: '42px 34px 32px' }}>
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
            letterSpacing: '-0.06em',
            lineHeight: 0.96,
            margin: '0 auto 24px',
            maxWidth: 350,
            textAlign: 'center',
          }}
        >
          {room.signal}
        </span>
        <span
          style={{
            display: 'block',
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

  if (room.motif === 'radar') {
    return (
      <span style={objectShellStyle}>
        <span style={objectKickerStyle}>{room.category}</span>
        <span
          aria-hidden
          style={{
            position: 'relative',
            display: 'block',
            width: 170,
            height: 170,
            margin: '16px auto',
            borderRadius: '50%',
            border: '1px solid rgba(20,17,12,0.22)',
            background:
              'radial-gradient(circle, transparent 0 22%, rgba(20,17,12,0.09) 23% 24%, transparent 25% 47%, rgba(20,17,12,0.09) 48% 49%, transparent 50%), conic-gradient(from 20deg, rgba(255,167,38,0.65), rgba(0,255,234,0.35), rgba(20,17,12,0.08), rgba(255,167,38,0.65))',
          }}
        >
          <span style={{ position: 'absolute', left: '50%', top: 14, width: 1, height: 142, background: 'rgba(20,17,12,0.18)' }} />
          <span style={{ position: 'absolute', left: 14, top: '50%', width: 142, height: 1, background: 'rgba(20,17,12,0.18)' }} />
        </span>
        <span style={objectTitleStyle}>{room.label}</span>
        <span style={objectTextStyle}>{room.signal}</span>
      </span>
    );
  }

  if (room.motif === 'ticker') {
    return (
      <span style={{ ...objectShellStyle, background: '#fff8d8' }}>
        <span style={objectKickerStyle}>{room.category}</span>
        <span
          aria-hidden
          style={{
            display: 'grid',
            gap: 8,
            margin: '20px 0 18px',
          }}
        >
          {[0.9, 0.68, 0.82, 0.5].map((width, idx) => (
            <span
              key={idx}
              style={{
                display: 'block',
                width: `${width * 100}%`,
                height: idx === 0 ? 12 : 8,
                background: idx === 0 ? '#14110c' : 'rgba(20,17,12,0.28)',
              }}
            />
          ))}
        </span>
        <span style={objectTitleStyle}>{room.label}</span>
        <span style={objectTextStyle}>{room.signal}</span>
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
