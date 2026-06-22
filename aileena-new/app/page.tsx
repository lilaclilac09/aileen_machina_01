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
  const investingPosts = [...tx.blog.investing.posts].reverse();
  const womanInTechPosts = tx.blog.womanInTech.posts;

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
                <SwipeRow posts={dispatchTop3} hijackScroll />
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

        {/* ── 05 INVESTING — sits right above the DJ set ── */}
        <SnapSection id="investing" className="order-5">
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
              <div className="flex-1 overflow-y-auto pr-1 substack-list">
                {investingPosts.map((post) => (
                  <Link key={post.title} href={post.href}>
                    <p className="sl-date">{post.date}</p>
                    <h3 className="sl-title">{post.title}</h3>
                    <p className="sl-body">{post.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 04 SELECTED WORK (2) ── */}
        <SnapSection id="work" className="order-4">
          <div className="h-full flex flex-col bg-[#070707] px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[760px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.pow.tag}
              </p>
              <h2
                className="anim-up-2 mb-10 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95"
                style={{ fontWeight: 500 }}
              >
                {tx.pow.heading}
              </h2>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-8">
                {tx.pow.featured.map((item) => (
                  <div key={item.name} className="anim-up-2 py-2">
                    <h3 className="text-[clamp(1.2rem,2.6vw,1.75rem)] text-white mb-2.5" style={{ fontWeight: 600 }}>
                      {item.name}
                    </h3>
                    <p className="text-[0.98rem] leading-relaxed text-white/65 mb-4 max-w-xl" style={{ fontWeight: 400 }}>
                      {item.why}
                    </p>
                    <div className="flex items-center gap-5">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.78rem] text-white/55 hover:text-white transition-colors no-underline"
                        style={{ fontWeight: 500 }}
                      >
                        Source
                      </a>
                      {'liveHref' in item && item.liveHref ? (
                        <a
                          href={item.liveHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.78rem] text-[#00ffea]/70 hover:text-[#00ffea] transition-colors no-underline"
                          style={{ fontWeight: 500 }}
                        >
                          Live
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/works"
                className="anim-up-3 mt-10 inline-block text-[0.8rem] text-white/55 hover:text-white transition-colors no-underline border-b border-white/15 hover:border-white pb-0.5 self-start"
                style={{ fontWeight: 500 }}
              >
                {tx.pow.viewAll}
              </Link>
            </div>
          </div>
        </SnapSection>

        {/* ── 06 SOUND — full DJ station ── */}
        <SnapSection id="sound" className="order-6">
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

              <div className="flex-1 overflow-y-auto pr-1 substack-list">
                {womanInTechPosts.map((post) => (
                  <Link key={post.title} href={post.href}>
                    <p className="sl-date">{post.date}</p>
                    <h3 className="sl-title">{post.title}</h3>
                    <p className="sl-body">{post.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 07 TRENDY — fashion police + podcast, one tight card ── */}
        <SnapSection id="trendy" className="order-7">
          <div className="h-full flex items-center justify-center bg-[#050505] px-6 sm:px-10">
            <div className="max-w-[480px] w-full text-center" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.6rem] uppercase tracking-[0.45em] text-[#00ffea]/70 mb-4" style={{ fontWeight: 500 }}>
                {tx.trendy.tag}
              </p>
              <h2
                className="anim-up-2 text-[clamp(1.3rem,3.2vw,1.9rem)] tracking-tight text-white/95 leading-snug mb-2"
                style={{ fontWeight: 600 }}
              >
                {tx.trendy.heading}
              </h2>
              <p
                className="anim-up-3 text-[0.92rem] text-white/55 mb-8"
                style={{ fontWeight: 400 }}
              >
                {tx.trendy.body}
              </p>

              <div className="anim-up-3 pt-6 border-t border-white/10">
                <p className="text-[0.58rem] uppercase tracking-[0.45em] text-white/35 mb-2" style={{ fontWeight: 500 }}>
                  {tx.trendy.rotationTag}
                </p>
                <h3 className="text-[1rem] tracking-tight text-white/90 mb-2" style={{ fontWeight: 500 }}>
                  {tx.trendy.podcast.title}
                </h3>
                <p className="text-[0.84rem] leading-relaxed text-white/55 mb-4" style={{ fontWeight: 400 }}>
                  {tx.trendy.podcast.body}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                  <a
                    href={tx.trendy.podcast.kateHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.76rem] text-[#00ffea]/75 hover:text-[#00ffea] transition-colors no-underline"
                    style={{ fontWeight: 500 }}
                  >
                    {tx.trendy.podcast.kateLabel} →
                  </a>
                  <a
                    href={tx.trendy.podcast.showHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.76rem] text-white/55 hover:text-white transition-colors no-underline"
                    style={{ fontWeight: 500 }}
                  >
                    {tx.trendy.podcast.showLabel} →
                  </a>
                </div>
              </div>

              <div className="anim-up-3 pt-6 mt-6 border-t border-white/10">
                <p className="text-[0.58rem] uppercase tracking-[0.45em] text-white/35 mb-2" style={{ fontWeight: 500 }}>
                  {tx.trendy.doYouReadHer.sectionLabel}
                </p>
                <h3 className="text-[1rem] tracking-tight text-white/90 mb-2" style={{ fontWeight: 500 }}>
                  {tx.trendy.doYouReadHer.title}
                </h3>
                <p className="text-[0.84rem] leading-relaxed text-white/55 mb-4" style={{ fontWeight: 400 }}>
                  {tx.trendy.doYouReadHer.body}
                </p>
                <a
                  href={tx.trendy.doYouReadHer.episodeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.76rem] text-[#00ffea]/75 hover:text-[#00ffea] transition-colors no-underline"
                  style={{ fontWeight: 500 }}
                >
                  {tx.trendy.doYouReadHer.episodeLabel} →
                </a>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 08 VISUAL — cute little gallery ── */}
        <SnapSection id="visual" className="order-8">
          <div className="h-full flex flex-col bg-[#070707] px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[920px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.visual.tag} <Sparkle />
              </p>
              <h2 className="anim-up-2 flex items-center gap-3 mb-3 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95" style={{ fontWeight: 500 }}>
                {tx.visual.heading} <Heart />
              </h2>
              <p className="anim-up-3 mb-8 text-[1rem] leading-relaxed text-white/55 max-w-lg" style={{ fontWeight: 400 }}>
                {tx.visual.body}
              </p>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {tx.visual.items.map((img: { src: string; alt: string; caption: string; href?: string }) => {
                    const tile = (
                      <figure className="relative w-full aspect-square overflow-hidden rounded-md m-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        {/* Bottom soft gradient so the script reads on any photo */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
                          style={{
                            background:
                              'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)',
                          }}
                        />
                        {/* Film-credit overlay — flowing coral cursive */}
                        <figcaption
                          className="absolute left-[7%] right-[7%] bottom-[6%]"
                          style={{
                            fontFamily: "'Allura', cursive",
                            color: '#ffa590',
                            fontSize: 'clamp(1.3rem, 3.4vw, 2.2rem)',
                            lineHeight: 1.0,
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 14px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.6)',
                          }}
                        >
                          {img.caption}
                          {img.href && (
                            <span
                              className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                fontFamily: "'Allura', cursive",
                                fontSize: '0.55em',
                                color: '#ffd2bf',
                              }}
                            >
                              read →
                            </span>
                          )}
                        </figcaption>
                      </figure>
                    );
                    return img.href ? (
                      <Link key={img.src} href={img.href} className="anim-up group block cursor-pointer">
                        {tile}
                      </Link>
                    ) : (
                      <div key={img.src} className="anim-up group">
                        {tile}
                      </div>
                    );
                  })}
                </div>

                <div className="anim-up mt-9 flex items-center gap-3 text-white/30">
                  <Sparkle /><Heart /><Star /><Flower />
                  <span
                    className="ml-1 text-white/55"
                    style={{
                      fontFamily: "'Allura', cursive",
                      fontSize: '1.35rem',
                      color: '#ffa590',
                      lineHeight: 1,
                    }}
                  >
                    {tx.visual.note}
                  </span>
                </div>
                <Link href="/blog/pate-de-verre" className="anim-up mt-4 inline-block text-[0.82rem] text-[#00ffea]/70 hover:text-[#00ffea] transition-colors" style={{ fontWeight: 500 }}>
                  {tx.visual.readGlass}
                </Link>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 09 FOOTER ── */}
        <SnapSection className="order-9">
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
    </>
  );
}

/* ── tiny hand-drawn doodles ── */
function Sparkle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00ffea" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2c.8 5.6 3.6 8.4 9 9-5.4.6-8.2 3.4-9 9-.8-5.6-3.6-8.4-9-9 5.4-.6 8.2-3.4 9-9z" />
    </svg>
  );
}
function Heart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff9ecb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20S3.5 14.6 3.5 8.9A4.3 4.3 0 0 1 12 6.1a4.3 4.3 0 0 1 8.5 2.8C20.5 14.6 12 20 12 20z" />
    </svg>
  );
}
function Star() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffe08a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.8 6.6 19.5l1.2-6L3.4 9.3l6-.7z" />
    </svg>
  );
}
function Flower() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ee6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="2.3" />
      <path d="M12 3.8a2.7 2.7 0 0 1 0 5.4M20.2 12a2.7 2.7 0 0 1-5.4 0M12 20.2a2.7 2.7 0 0 1 0-5.4M3.8 12a2.7 2.7 0 0 1 5.4 0" />
    </svg>
  );
}
