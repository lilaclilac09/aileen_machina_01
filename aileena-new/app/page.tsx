'use client';

import { useEffect, useState } from 'react';
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

/* ── Atrium homepage ──────────────────────────────────────────────────
 *
 * The system frame Aileen settled on: Aileena Machina is an editorial
 * house with four departments and one concierge. The homepage is the
 * atrium — a cinematic opening, then a quiet dock of four doors, then
 * the DJ station, then footer. Information is intentionally minimal:
 * the homepage's job is to *send* you somewhere, not to *contain* the
 * content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  The atrium          — four department doors
 *   Section 03  Sound               — DJ station (unchanged)
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

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_LOADED_KEY) !== '1') {
        setShowLoadingScreen(true);
        setLoaded(false);
      }
    } catch {
      /* sessionStorage unavailable — fall through */
    }
  }, []);

  // Latest items from each department for the atrium dock
  const latestIssue = ALL_ISSUES[0];
  const latestDispatch = tx.blog.researchDispatch.posts.slice(-1)[0];
  const latestWomanInTech = tx.blog.womanInTech.posts[0];

  return (
    <>
      {showLoadingScreen && !loaded && (
        <LoadingScreen
          onDone={() => {
            setLoaded(true);
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
                    href={`/research/${latestIssue!.slug}`}
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

        {/* ── 02 THE ATRIUM — four doors ────────────────────────── */}
        <SnapSection id="atrium" className="order-2">
          <div className="h-full flex flex-col bg-black px-6 sm:px-10 lg:px-16" style={{ fontFamily: nunito }}>
            <div className="mx-auto w-full max-w-[1180px] flex h-full flex-col py-12 sm:py-16">
              <header className="mb-10">
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
                  The atrium
                </p>
                <h2
                  className="anim-up-2"
                  style={{
                    fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '-0.012em',
                    lineHeight: 1.15,
                    maxWidth: 600,
                  }}
                >
                  Four rooms. Pick one.
                </h2>
              </header>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <Door
                  label="Magazine"
                  description="Interactive judgments, one book per issue."
                  latest={`${latestIssue!.issueNumber} · ${latestIssue!.coverTitle}`}
                  href={`/research/${latestIssue!.slug}`}
                  accent="#ffa726"
                  index="01"
                />
                <Door
                  label="News Desk"
                  description="Latest dispatches and analysis."
                  latest={latestDispatch ? latestDispatch.title : 'Open the archive'}
                  href="/dispatch"
                  accent="#ffa726"
                  index="02"
                />
                <Door
                  label="Library"
                  description="Long-form essays and the back catalogue."
                  latest={latestWomanInTech ? latestWomanInTech.title : 'Open the catalogue'}
                  href={latestWomanInTech ? latestWomanInTech.href : '/dispatch'}
                  accent="#ffa726"
                  index="03"
                />
                <Door
                  label="Sound"
                  description="DJ sets and the music she ships."
                  latest="Mix 02 · Berlin"
                  href="/sound"
                  accent="#ffa726"
                  index="04"
                />
              </div>

              <p
                className="anim-up-3 mt-8 self-center"
                style={{
                  fontFamily: mono,
                  fontSize: '0.55rem',
                  letterSpacing: '0.32em',
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                ↓ Or stay for the music
              </p>
            </div>
          </div>
        </SnapSection>

        {/* ── 03 SOUND — DJ station (preserved) ─────────────────── */}
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

/* ── Door — one department tile in the atrium ─────────────────────── */
function Door({
  label,
  description,
  latest,
  href,
  accent,
  index,
}: {
  label: string;
  description: string;
  latest: string;
  href: string;
  accent: string;
  index: string;
}) {
  return (
    <Link
      href={href}
      className="anim-up-2 group"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 24,
        padding: '24px 22px',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.02)',
        textDecoration: 'none',
        color: '#fff',
        transition: 'border-color 0.18s ease, background 0.18s ease, transform 0.18s ease',
        minHeight: 240,
      }}
    >
      <div>
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.55rem',
            letterSpacing: '0.32em',
            color: accent,
            textTransform: 'uppercase',
            marginBottom: 10,
            fontWeight: 600,
          }}
        >
          {index}
        </p>
        <h3
          style={{
            fontSize: '1.55rem',
            fontWeight: 600,
            letterSpacing: '-0.012em',
            marginBottom: 8,
            lineHeight: 1.15,
          }}
        >
          {label}
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>
      <div>
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.55rem',
            letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Latest
        </p>
        <p
          style={{
            fontSize: '0.88rem',
            color: 'rgba(255,255,255,0.78)',
            lineHeight: 1.45,
            marginBottom: 14,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {latest}
        </p>
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.6rem',
            letterSpacing: '0.22em',
            color: accent,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Enter →
        </span>
      </div>
    </Link>
  );
}
