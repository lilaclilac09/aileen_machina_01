'use client';

import { useEffect, useState, type DragEvent } from 'react';
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
  blurb: string;
  signal: string;
};

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then the DJ station, then footer. Information is
 * intentionally minimal: the homepage's job is to set the mood, not to
 * contain the content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  Sound               — DJ station
 *   Section 03  Footer
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
      blurb: 'Interactive judgments, one issue at a time.',
      signal: latestIssue ? `${latestIssue.issueNumber} · ${latestIssue.coverTitle}` : 'Open the magazine rack',
    },
    {
      id: 'dispatch',
      index: '02',
      label: 'News Desk',
      href: '/dispatch',
      blurb: 'Fresh dispatches and analysis.',
      signal: latestDispatch ? latestDispatch.title : 'Open the archive',
    },
    {
      id: 'library',
      index: '03',
      label: 'Library',
      href: latestWomanInTech ? latestWomanInTech.href : '/dispatch',
      blurb: 'Long-form essays and the back catalogue.',
      signal: latestWomanInTech ? latestWomanInTech.title : 'Open the catalogue',
    },
    {
      id: 'sound',
      index: '04',
      label: 'Sound',
      href: '/sound',
      blurb: 'DJ sets and the music she ships.',
      signal: 'Mix 02 · Berlin',
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
  const activeRoom = rooms.find((room) => room.id === (draggingId || enteringId));

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
    <div className="h-full flex flex-col bg-black px-6 sm:px-10 lg:px-16" style={{ fontFamily: nunito }}>
      <div className="mx-auto grid h-full w-full max-w-[1180px] grid-rows-[auto_1fr] gap-8 py-12 sm:py-16 lg:gap-10">
        <header className="max-w-[760px]">
          <p
            className="anim-up"
            style={{
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.4em',
              color: '#ffa726',
              textTransform: 'uppercase',
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            The dock
          </p>
          <h2
            className="anim-up-2"
            style={{
              fontSize: 'clamp(1.7rem, 3.4vw, 2.65rem)',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '-0.012em',
              lineHeight: 1.12,
            }}
          >
            Pull a room into signal.
          </h2>
        </header>

        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rooms.map((room) => {
              const isActive = draggingId === room.id || enteringId === room.id;

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
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr',
                    gap: 16,
                    alignItems: 'center',
                    width: '100%',
                    minHeight: 84,
                    padding: '14px 16px',
                    border: `1px solid ${isActive ? 'rgba(255,167,38,0.58)' : 'rgba(255,255,255,0.1)'}`,
                    background: isActive ? 'rgba(255,167,38,0.08)' : 'rgba(255,255,255,0.025)',
                    color: '#fff',
                    cursor: isActive ? 'grabbing' : 'grab',
                    transition: 'border-color 0.18s ease, background 0.18s ease, transform 0.18s ease',
                  }}
                  aria-label={`Open ${room.label}`}
                >
                  <span
                    aria-hidden
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 42,
                      height: 42,
                      border: '1px solid rgba(255,167,38,0.36)',
                      color: '#ffa726',
                      fontFamily: mono,
                      fontSize: '0.58rem',
                      letterSpacing: '0.18em',
                    }}
                  >
                    {room.index}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        color: 'rgba(255,255,255,0.94)',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      {room.label}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 5,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.82rem',
                        lineHeight: 1.35,
                      }}
                    >
                      {room.blurb}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
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
            className="anim-up-3 relative grid min-h-[340px] place-items-center overflow-hidden border border-white/10 bg-white/[0.02] p-8 sm:min-h-[420px]"
            style={{
              boxShadow: dropActive
                ? '0 0 90px -35px rgba(0,255,234,0.7), inset 0 0 80px -55px rgba(0,255,234,0.72)'
                : 'inset 0 0 80px -70px rgba(255,255,255,0.5)',
              transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
              borderColor: dropActive ? 'rgba(0,255,234,0.42)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(0,255,234,0.16), transparent 30%), linear-gradient(90deg, transparent 49.8%, rgba(255,255,255,0.08) 50%, transparent 50.2%), linear-gradient(0deg, transparent 49.8%, rgba(255,255,255,0.08) 50%, transparent 50.2%)',
              }}
            />
            <div
              aria-hidden
              className="absolute h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full"
              style={{
                border: `1px solid ${dropActive ? 'rgba(0,255,234,0.5)' : 'rgba(255,255,255,0.13)'}`,
                boxShadow: dropActive
                  ? '0 0 50px -18px rgba(0,255,234,0.85), inset 0 0 50px -30px rgba(0,255,234,0.85)'
                  : '0 0 40px -30px rgba(255,255,255,0.5)',
                transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
              }}
            />
            <div className="relative z-10 max-w-[420px] text-center">
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '0.58rem',
                  letterSpacing: '0.38em',
                  color: dropActive ? '#00ffea' : 'rgba(0,255,234,0.7)',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                  fontWeight: 700,
                }}
              >
                {dropActive ? 'Signal open' : 'Drop zone'}
              </p>
              <h3
                style={{
                  color: '#fff',
                  fontSize: 'clamp(1.6rem, 3vw, 2.35rem)',
                  fontWeight: 500,
                  lineHeight: 1.12,
                  letterSpacing: '-0.016em',
                  marginBottom: 16,
                }}
              >
                {activeRoom ? activeRoom.label : 'Choose the room'}
              </h3>
              <p
                style={{
                  color: 'rgba(255,255,255,0.58)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  minHeight: 54,
                }}
              >
                {activeRoom ? activeRoom.signal : 'Magazine · News Desk · Library · Sound'}
              </p>
              <p
                style={{
                  marginTop: 26,
                  fontFamily: mono,
                  fontSize: '0.58rem',
                  letterSpacing: '0.28em',
                  color: 'rgba(255,167,38,0.76)',
                  textTransform: 'uppercase',
                }}
              >
                Drag here · tap also works
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
