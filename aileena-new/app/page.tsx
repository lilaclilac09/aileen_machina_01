'use client';

import { useEffect, useState, type CSSProperties } from 'react';
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
};

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then one clickable clipping desk. Information is
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
      href: latestDispatch ? latestDispatch.href : '/dispatch',
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
      placement: { top: '12%', left: '1%', transform: 'rotate(-1deg)', zIndex: 9 },
    },
    {
      id: 'trendy',
      index: '04',
      label: 'Trendy',
      href: tx.trendy.podcast.kateHref,
      category: tx.trendy.tag,
      blurb: `${tx.trendy.body} The listening shelf stays with the sound notes: handmade, handwritten, replayed until it turns into taste.`,
      signal: tx.trendy.heading,
      motif: 'trendy',
      note: tx.visual.note,
      placement: { top: '24%', left: '39%', transform: 'rotate(1.5deg)', zIndex: 8 },
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
                      gap: 13,
                      minHeight: 66,
                      background: `linear-gradient(135deg, ${palette.soot} 0%, #121a18 62%, #18221f 100%)`,
                      color: palette.cream,
                      padding: '10px 12px 10px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,169,159,0.46)',
                      boxShadow:
                        '0 24px 70px -38px rgba(0,169,159,0.9), 0 12px 30px -26px rgba(20,17,12,0.8), inset 0 1px 0 rgba(255,255,255,0.16)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    aria-label={tx.hero.talkAgent}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        width: 48,
                        height: 48,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        backgroundImage: "url('/agent-portrait.jpeg')",
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        boxShadow: `0 0 0 1px ${palette.cyanSoft}, 0 0 20px rgba(0,169,159,0.22)`,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          right: -1,
                          top: 3,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          background: palette.cyan,
                          boxShadow: '0 0 12px rgba(0,169,159,0.7)',
                        }}
                      />
                    </span>
                    <span style={{ display: 'grid', gap: 3, minWidth: 0 }}>
                      <span
                        style={{
                          color: palette.cyan,
                          fontFamily: mono,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.24em',
                          lineHeight: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        Ask the agent
                      </span>
                      <span
                        style={{
                          color: 'rgba(248,245,238,0.74)',
                          fontFamily: 'Georgia, serif',
                          fontSize: '0.88rem',
                          fontStyle: 'italic',
                          lineHeight: 1.15,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        open the machine room
                      </span>
                    </span>
                    <span
                      aria-hidden
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 32,
                        height: 32,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        background: 'rgba(248,245,238,0.1)',
                        color: palette.cream,
                        fontFamily: mono,
                        fontSize: '1rem',
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

      </SnapContainer>
    </>
  );
}

function AtriumLinkDock({ rooms }: { rooms: RoomDoor[] }) {
  const jensenHref = rooms.find((room) => room.id === 'magazine')?.href ?? '/research';
  const socialLinks = [
    { label: 'github', href: 'https://github.com/lilaclilac09' },
    { label: 'substack', href: '/dispatch' },
    { label: 'sound', href: '/sound' },
  ];

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
          className="relative z-10 min-h-0 flex-1 sm:min-h-0"
        >
          <div className="h-full overflow-y-auto pb-8 pt-4 sm:hidden">
            <div className="grid gap-4">
              {rooms.map((room) => {
                const isArticle = room.motif === 'article';
                const isTrendy = room.motif === 'trendy';
                const isRecord = room.motif === 'record';
                const isPaper = isTrendy;
                const mobileRoomStyle: CSSProperties = {
                  display: 'block',
                  width: '100%',
                  minHeight: isArticle ? 500 : isTrendy ? 410 : isRecord ? 280 : 238,
                  height: isTrendy ? 410 : undefined,
                  padding: 0,
                  border: isPaper ? '1px solid rgba(20,17,12,0.16)' : 'none',
                  background: isPaper ? palette.paper : 'transparent',
                  color: palette.ink,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  boxShadow: isPaper ? '0 24px 70px -48px rgba(20,17,12,0.5)' : 'none',
                };

                return room.href.startsWith('http') ? (
                  <a
                    key={room.id}
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
                    key={room.id}
                    href={room.href}
                    className="text-left"
                    style={mobileRoomStyle}
                    aria-label={`Open ${room.label}`}
                  >
                    <ObjectFace room={room} />
                  </Link>
                );
              })}

            </div>
          </div>

          {rooms.map((room) => {
            const baseTransform = String(room.placement.transform ?? '');
            const isArticle = room.motif === 'article';
            const isTrendy = room.motif === 'trendy';
            const isRecord = room.motif === 'record';
            const isPaper = isTrendy;
            const desktopRoomStyle: CSSProperties = {
              ...room.placement,
              position: 'absolute',
              width: isArticle ? 'min(86vw, 610px)' : isTrendy ? 'min(76vw, 470px)' : isRecord ? 'min(56vw, 290px)' : 'min(60vw, 330px)',
              minHeight: isArticle ? 'clamp(455px, 58dvh, 520px)' : isTrendy ? 'clamp(360px, 46dvh, 410px)' : isRecord ? 300 : 250,
              height: isTrendy ? 'clamp(360px, 46dvh, 410px)' : undefined,
              padding: 0,
              border: isPaper ? '1px solid rgba(20,17,12,0.16)' : 'none',
              background: isPaper ? palette.paper : 'transparent',
              color: palette.ink,
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: isPaper ? '0 24px 70px -42px rgba(20,17,12,0.5)' : 'none',
              transform: baseTransform,
              transition: 'box-shadow 0.18s ease, transform 0.18s ease',
            };

            return room.href.startsWith('http') ? (
              <a
                key={room.id}
                href={room.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-left sm:block"
                style={desktopRoomStyle}
                aria-label={`Open ${room.label}`}
              >
                <ObjectFace room={room} />
              </a>
            ) : (
              <Link
                key={room.id}
                href={room.href}
                className="hidden text-left sm:block"
                style={desktopRoomStyle}
                aria-label={`Open ${room.label}`}
              >
                <ObjectFace room={room} />
              </Link>
            );
          })}

          <Link
            href={jensenHref}
            aria-label="Open Jensen AI stock article"
            className="absolute right-[11%] top-[38%] z-[7] hidden h-[190px] w-[365px] overflow-visible sm:block"
            style={{
              padding: 8,
              background: palette.cream,
              border: '1px solid rgba(20,17,12,0.13)',
              borderRadius: 18,
              cursor: 'pointer',
              boxShadow: '0 18px 0 rgba(20,17,12,0.86), 0 28px 66px -30px rgba(20,17,12,0.72)',
              transform: 'rotate(2deg)',
              transition: 'transform 0.18s ease',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                top: -18,
                width: 96,
                height: 28,
                background: palette.amberSoft,
                boxShadow: '0 1px 0 rgba(255,255,255,0.45) inset',
                transform: 'translateX(-50%) rotate(-2deg)',
                zIndex: 5,
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 8,
                overflow: 'hidden',
                borderRadius: 12,
                backgroundImage:
                  "linear-gradient(90deg, rgba(10,13,12,0.78), rgba(10,13,12,0.12)), url('/projects/us-stocks.png')",
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
                filter: 'saturate(0.92) contrast(1.03)',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 8,
                borderRadius: 12,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 -70px 80px -55px rgba(0,0,0,0.9)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 20,
                top: 20,
                display: 'flex',
                gap: 7,
                zIndex: 2,
              }}
            >
              {['11.3x', '19.4x', '12.4x'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px 2px',
                    background: palette.cream,
                    border: `2px solid ${palette.ink}`,
                    borderRadius: 8,
                    color: palette.ink,
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
                bottom: 22,
                zIndex: 2,
                padding: '5px 9px',
                borderRadius: 999,
                background: palette.cream,
                color: palette.ink,
                fontFamily: mono,
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              AI stock print
            </span>
            <span
              style={{
                position: 'absolute',
                right: 19,
                top: 20,
                zIndex: 2,
                padding: '4px 8px',
                borderRadius: 8,
                background: palette.chipGreen,
                color: palette.ink,
                fontFamily: mono,
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.02em',
              }}
            >
              NVIDIA
            </span>
            <span
              style={{
                position: 'absolute',
                right: 18,
                bottom: 21,
                zIndex: 2,
                padding: '5px 9px',
                borderRadius: 999,
                background: palette.cream,
                color: palette.ink,
                fontFamily: mono,
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Jensen / HBM
            </span>
          </Link>
        </div>

        <div className="relative z-20 mb-1 flex items-end justify-end gap-6">
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
  color: palette.ink,
  fontFamily: 'Georgia, serif',
  fontSize: '1.08rem',
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
};

const thumbnailTitleStyle: CSSProperties = {
  display: 'block',
  color: palette.ink,
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
          position: 'relative',
          display: 'block',
          minHeight: 'clamp(455px, 58dvh, 520px)',
          padding: '14px 0 36px',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            top: 4,
            zIndex: 0,
            width: 'min(42vw, 245px)',
            height: 'clamp(330px, 47dvh, 420px)',
            backgroundImage: "url('/dispatch-covers/harassment.jpg')",
            backgroundPosition: '48% 50%',
            backgroundSize: 'cover',
            boxShadow: '0 24px 70px -36px rgba(20,17,12,0.48)',
            filter: 'contrast(1.03) grayscale(0.08)',
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 76,
            bottom: 12,
            zIndex: 2,
            width: 'clamp(118px, 11vw, 150px)',
            height: 'clamp(140px, 13vw, 178px)',
            background: palette.cream,
            boxShadow: '0 18px 46px -30px rgba(20,17,12,0.55)',
            padding: 8,
            transform: 'rotate(4deg)',
          }}
        >
          <span
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              backgroundImage: "url('/bg_pic/03.jpeg')",
              backgroundPosition: '36% 18%',
              backgroundSize: '190%',
              filter: 'saturate(0.84) contrast(0.98)',
            }}
          />
        </span>
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'block',
            width: 'min(88vw, 475px)',
            minHeight: 'clamp(430px, 55dvh, 500px)',
            marginLeft: 0,
            padding: 'clamp(42px, 6dvh, 58px) clamp(24px, 7vw, 46px) clamp(30px, 5dvh, 42px)',
            background: '#fff',
            boxShadow: '0 22px 70px -42px rgba(20,17,12,0.5)',
          }}
        >
          <span
            style={{
              display: 'block',
              color: 'rgba(20,17,12,0.74)',
              fontFamily: mono,
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.22em',
              marginBottom: 'clamp(18px, 3.4dvh, 28px)',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            Viewpoint
          </span>
          <span
            style={{
              display: 'block',
              color: palette.ink,
              fontFamily: nunito,
              fontSize: 'clamp(1.9rem, 4.35vw, 3.75rem)',
              fontWeight: 850,
              letterSpacing: '-0.055em',
              lineHeight: 1.02,
              margin: '0 auto clamp(20px, 3.8dvh, 32px)',
              maxWidth: 398,
              textAlign: 'center',
            }}
          >
            {room.signal}
          </span>
          <span
            style={{
              color: 'rgba(20,17,12,0.78)',
              fontFamily: 'Georgia, serif',
              fontSize: '1.02rem',
              lineHeight: 1.44,
              margin: '0 auto',
              maxWidth: 355,
              overflow: 'hidden',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 4,
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
            top: -6,
            zIndex: 3,
            color: 'rgba(20,17,12,0.72)',
            fontFamily: 'Georgia, serif',
            fontSize: '1.02rem',
            fontStyle: 'italic',
          }}
        >
          drag me
        </span>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 18,
            bottom: 20,
            zIndex: 2,
            color: palette.softPink,
            fontFamily: "'Allura', cursive",
            fontSize: '1.22rem',
            lineHeight: 1,
            transform: 'rotate(-2deg)',
          }}
        >
          no more whisper network
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
          height: 'clamp(360px, 46dvh, 410px)',
          overflow: 'hidden',
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
        <span
          aria-hidden
          style={{
            position: 'relative',
            display: 'block',
            height: 190,
            overflow: 'visible',
            borderRadius: 18,
            background: palette.cream,
            padding: 8,
            boxShadow: '0 18px 46px -30px rgba(20,17,12,0.66)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 26,
              top: -12,
              width: 86,
              height: 24,
              background: palette.amberSoft,
              transform: 'rotate(-3deg)',
              zIndex: 4,
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 8,
              overflow: 'hidden',
              borderRadius: 12,
              backgroundImage:
                "linear-gradient(180deg, rgba(10,13,12,0.1), rgba(10,13,12,0.72)), url('/dispatch-covers/investing-hero.jpg')",
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'saturate(0.88) contrast(1.04)',
            }}
          />
          {['11.3x', '19.4x', '12.4x'].map((tag, idx) => (
            <span
              key={tag}
              style={{
                position: 'absolute',
                left: 18 + idx * 86,
                top: 18,
                padding: '3px 8px 2px',
                borderRadius: 8,
                border: `2px solid ${palette.ink}`,
                background: palette.cream,
                color: palette.ink,
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
          <span
            style={{
              position: 'absolute',
              left: 18,
              bottom: 16,
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
                  background: logo === 'NVIDIA' ? palette.chipGreen : palette.cream,
                  border: `2px solid ${palette.ink}`,
                  color: palette.ink,
                  fontFamily: mono,
                  fontSize: '0.72rem',
                fontWeight: 900,
              }}
            >
              {logo}
            </span>
          ))}
          </span>
          <span
            style={{
              position: 'absolute',
              right: 17,
              bottom: 16,
              color: palette.cream,
              fontFamily: mono,
              fontSize: '0.58rem',
              fontWeight: 900,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: '0 1px 8px rgba(0,0,0,0.75)',
            }}
          >
            evidence print
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
            height: 190,
            overflow: 'visible',
            borderRadius: 18,
            background: palette.cream,
            padding: 8,
            boxShadow: '0 18px 46px -30px rgba(20,17,12,0.66)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: 24,
              top: -12,
              width: 78,
              height: 24,
              background: palette.cyanSoft,
              transform: 'rotate(4deg)',
              zIndex: 4,
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 8,
              overflow: 'hidden',
              borderRadius: 12,
              backgroundImage:
                "linear-gradient(90deg, rgba(8,16,18,0.9), rgba(8,16,18,0.18)), url('/projects/keyshield.png')",
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'saturate(0.86) contrast(1.08)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 20,
              top: 18,
              color: palette.cream,
              fontSize: '2.35rem',
              fontWeight: 950,
              letterSpacing: '-0.08em',
              lineHeight: 0.9,
              textShadow: `3px 3px 0 ${palette.ink}`,
            }}
          >
            800V
            <br />
            IS HERE
          </span>
          <span
            style={{
              position: 'absolute',
              right: 32,
              top: 36,
              width: 94,
              height: 72,
              borderRight: `5px solid ${palette.cyan}`,
              borderBottom: `5px solid ${palette.cyan}`,
              borderRadius: '0 0 50% 0',
              transform: 'rotate(8deg)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 32,
              bottom: 32,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: palette.cream,
              boxShadow: `0 0 0 4px ${palette.cyan}`,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 20,
              bottom: 18,
              padding: '4px 9px',
              borderRadius: 8,
              background: palette.cream,
              color: palette.ink,
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
    <span style={{ ...objectShellStyle, background: palette.soot, color: '#f5f1e8' }}>
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
