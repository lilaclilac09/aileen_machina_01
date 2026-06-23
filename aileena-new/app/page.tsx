'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import DJStation from '../components/DJStation';
import LoadingScreen from '../components/LoadingScreen';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';
import SwipeRow from '../components/SwipeRow';
import CoverflowPanel from '../components/CoverflowPanel';
import { useCoverflowSettings } from '../lib/useCoverflowSettings';
import './blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

const SESSION_LOADED_KEY = 'aileena_loaded_once';

export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];
  // Default to "already loaded" on every render after the first visit
  // within a tab/session, so navigating back from an article does NOT
  // re-play the loading-screen buffer. First-visit flow stays intact —
  // the useEffect below detects the flag is missing and only THEN keeps
  // the LoadingScreen mounted until its onDone fires.
  const [loaded, setLoaded] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_LOADED_KEY) !== '1') {
        setShowLoadingScreen(true);
        setLoaded(false);
      }
    } catch {
      // sessionStorage unavailable (private mode) — fall through to "no
      // loading screen" rather than risk the buffer playing on every nav.
    }
  }, []);

  const dispatchTop3 = tx.blog.researchDispatch.posts.slice(-3).reverse();
  // Mirror dispatch's pattern: top-3 newest for the homepage showcase;
  // full archives live on /dispatch.
  const investingTop3 = [...tx.blog.investing.posts].reverse().slice(0, 3);
  // Authored order (NOT reverse-chrono) so the #MeToo essay stays first.
  // Matches /dispatch/page.tsx:219 — Aileen's display preference.
  const womanInTechTop3 = tx.blog.womanInTech.posts.slice(0, 3);

  const coverflow = useCoverflowSettings();

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

        {/* ── 01 HERO — one human sentence + agent door ── */}
        <SnapSection id="hero" className="order-1">
          <div className="h-full flex items-center justify-center bg-[#070707] px-6 sm:px-10 relative">
            {/* Floating agent figure — zoomed Natalia-with-antennae portrait
                anchored off the hero column. Decorative + clickable; opens
                the same console as the pill CTA. Hidden on small phones so
                the hero copy stays centered. */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
              aria-label={tx.hero.talkAgent}
              className="hidden md:flex absolute top-1/2 right-[5%] lg:right-[8%] xl:right-[12%] -translate-y-1/2 flex-col items-center gap-2 cursor-pointer group z-10"
            >
              <span className="relative inline-block agent-float">
                <span
                  aria-hidden
                  className="block h-[220px] w-[180px] lg:h-[260px] lg:w-[212px] rounded-[18px] bg-no-repeat ring-1 ring-[#00ffea]/35 shadow-[0_30px_70px_-18px_rgba(0,255,234,0.22)] transition-all duration-300 group-hover:ring-[#00ffea]/80 group-hover:scale-[1.02] group-hover:shadow-[0_36px_80px_-18px_rgba(0,255,234,0.38)]"
                  style={{
                    backgroundImage: "url('/bg_pic/03.jpeg')",
                    backgroundPosition: '18% 5%',
                    backgroundSize: '175%',
                  }}
                />
                <span aria-hidden className="agent-scan pointer-events-none absolute inset-0 rounded-[18px] overflow-hidden" />
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#00ffea] shadow-[0_0_10px_rgba(0,255,234,0.95)] animate-pulse ring-2 ring-[#070707]"
                />
              </span>
              <span className="font-mono text-[0.55rem] tracking-[0.35em] uppercase text-[#00ffea]/55 group-hover:text-[#00ffea] transition-colors select-none">
                machina
              </span>
            </button>

            <div className="max-w-[680px] w-full text-center" style={{ fontFamily: nunito }}>
              <p
                className="anim-up-2 text-[clamp(1.4rem,3.6vw,2.2rem)] leading-snug text-white/85"
                style={{ fontWeight: 500 }}
              >
                {tx.hero.line}
              </p>

              {/* Pill CTA — "this is a door, there's something behind it" */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
                className="anim-up-3 mt-10 inline-flex items-center gap-2.5 rounded-full border border-[#00ffea]/35 bg-[#00ffea]/[0.06] px-6 py-3 text-[0.95rem] text-white/90 hover:bg-[#00ffea]/[0.12] hover:border-[#00ffea]/60 hover:text-[#00ffea] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
                aria-label={tx.hero.talkAgent}
              >
                <span>{tx.hero.talkAgent}</span>
                <span aria-hidden>→</span>
              </button>

              {/* Status cue — "agent online" + provenance */}
              <div className="anim-up-3 mt-4 flex items-center justify-center gap-2 text-[0.7rem] text-white/40" style={{ fontFamily: nunito }}>
                <span className="relative inline-flex">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3df0a6]" />
                  <span className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-[#3df0a6] animate-ping opacity-60" />
                </span>
                <span>{tx.hero.agentStatus}</span>
              </div>

              {/* Prompt chips — examples make the agent feel callable, not abstract */}
              <div className="anim-up-3 mt-7 flex flex-wrap justify-center gap-2">
                {tx.hero.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('open-agent-chat', { detail: { prompt: chip } }),
                      );
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.025] px-3.5 py-1.5 text-[0.78rem] text-white/55 hover:border-white/25 hover:bg-white/[0.05] hover:text-white/90 transition-all cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade">
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/25" />
            <span className="text-[0.55rem] uppercase tracking-[0.5em] text-white/30" style={{ fontFamily: nunito }}>{tx.hero.scroll}</span>
          </div>
        </SnapSection>

        {/* ── 02 LATEST DISPATCH (3) ── */}
        <SnapSection id="dispatch" className="order-2">
          <div className="h-full flex flex-col bg-black px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[760px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.blog.researchDispatch.tag}
              </p>
              <h2
                className="anim-up-2 mb-10 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95"
                style={{ fontWeight: 500 }}
              >
                {tx.blog.researchDispatch.heading}
              </h2>
              <div className="anim-up flex-1 flex items-center">
                <SwipeRow posts={dispatchTop3} hijackScroll settings={coverflow.settings} />
              </div>
              <Link
                href="/dispatch"
                className="anim-up-3 mt-8 inline-block text-[0.8rem] text-white/55 hover:text-white transition-colors no-underline border-b border-white/15 hover:border-white pb-0.5 self-start"
                style={{ fontWeight: 500 }}
              >
                See the whole archive →
              </Link>
            </div>
          </div>
        </SnapSection>

        {/* ── 04 INVESTING ── */}
        <SnapSection id="investing" className="order-4">
          <div className="h-full flex flex-col bg-[#070707] px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[760px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.blog.investing.tag}
              </p>
              <h2
                className="anim-up-2 mb-10 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95"
                style={{ fontWeight: 500 }}
              >
                {tx.blog.investing.heading}
              </h2>
              <div className="anim-up flex-1 flex items-center">
                <SwipeRow posts={investingTop3} hijackScroll settings={coverflow.settings} />
              </div>
              <Link
                href="/dispatch#investing"
                className="anim-up-3 mt-8 inline-block text-[0.8rem] text-white/55 hover:text-white transition-colors no-underline border-b border-white/15 hover:border-white pb-0.5 self-start"
                style={{ fontWeight: 500 }}
              >
                See the whole archive →
              </Link>
            </div>
          </div>
        </SnapSection>

        {/* ── 05 SOUND — full DJ station ── */}
        <SnapSection id="sound" className="order-5">
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

        {/* ── 03 WOMAN IN TECH ── */}
        <SnapSection id="woman-in-tech" className="order-3">
          <div className="h-full flex flex-col bg-black px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[760px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.blog.womanInTech.tag}
              </p>
              <h2 className="anim-up-2 mb-10 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95" style={{ fontWeight: 500 }}>
                {tx.blog.womanInTech.heading}
              </h2>

              <div className="anim-up flex-1 flex items-center">
                <SwipeRow posts={womanInTechTop3} hijackScroll settings={coverflow.settings} />
              </div>
              <Link
                href="/dispatch#woman-in-tech"
                className="anim-up-3 mt-8 inline-block text-[0.8rem] text-white/55 hover:text-white transition-colors no-underline border-b border-white/15 hover:border-white pb-0.5 self-start"
                style={{ fontWeight: 500 }}
              >
                See the whole archive →
              </Link>
            </div>
          </div>
        </SnapSection>

        {/* ── 06 FOOTER ── */}
        <SnapSection className="order-6">
          <div className="h-full flex flex-col justify-end bg-[#030303] px-6 sm:px-10 lg:px-16 py-14 sm:py-16" style={{ fontFamily: nunito }}>
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
      <CoverflowPanel
        settings={coverflow.settings}
        update={coverflow.update}
        reset={coverflow.reset}
        open={coverflow.panelOpen}
        onToggle={coverflow.togglePanel}
        hydrated={coverflow.hydrated}
        isMobile={coverflow.isMobile}
        t={tx.coverflow}
      />
    </>
  );
}

