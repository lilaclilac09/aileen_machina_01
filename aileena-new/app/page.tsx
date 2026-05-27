'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';
import './blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];
  const [loaded, setLoaded] = useState(false);

  const dispatchTop3 = tx.blog.researchDispatch.posts.slice(-3).reverse();
  const notesTop2 = tx.blog.womanInTech.posts.slice(0, 2);

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <Header />
      <SnapContainer key={language}>

        {/* ── 01 HERO — one human sentence ── */}
        <SnapSection id="hero" className="order-1">
          <div className="h-full flex items-center justify-center bg-[#070707] px-6 sm:px-10">
            <div className="max-w-[680px] w-full text-center" style={{ fontFamily: nunito }}>
              <p
                className="anim-up-2 text-[clamp(1.4rem,3.6vw,2.2rem)] leading-snug text-white/85"
                style={{ fontWeight: 500 }}
              >
                {tx.hero.line}
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
                className="anim-up-3 mt-10 inline-flex items-center gap-2 text-[0.82rem] text-white/55 hover:text-[#00ffea] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {tx.hero.talkAgent}
              </button>
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
              <div className="flex-1 overflow-y-auto pr-1 substack-list">
                {dispatchTop3.map((post) => (
                  <Link key={post.title} href={post.href}>
                    <p className="sl-date">{post.date}</p>
                    <h3 className="sl-title">{post.title}</h3>
                    <p className="sl-body">{post.body}</p>
                  </Link>
                ))}
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

        {/* ── 03 SELECTED WORK (2) ── */}
        <SnapSection id="work" className="order-3">
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

        {/* ── 04 SOUND — minimal player teaser ── */}
        <SnapSection id="sound" className="order-4">
          <div className="h-full flex flex-col justify-center bg-black px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[680px]" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.sound.tag}
              </p>
              <h2 className="anim-up-2 mb-5 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95" style={{ fontWeight: 500 }}>
                {tx.sound.heading}
              </h2>
              <p className="anim-up-3 mb-10 text-[1rem] leading-relaxed text-white/60 max-w-md" style={{ fontWeight: 400 }}>
                {tx.sound.teaser}
              </p>

              {/* Minimal player teaser — no full deck */}
              <div className="anim-up mb-10 flex items-center gap-4 py-4 border-y border-white/10">
                <button
                  type="button"
                  onClick={() => { window.location.href = '/sound'; }}
                  className="h-11 w-11 rounded-full bg-white/5 border border-white/15 flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-colors cursor-pointer"
                  aria-label="Open the full DJ station"
                >
                  <span className="text-white/70 text-sm leading-none ml-0.5">▶</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.78rem] uppercase tracking-[0.18em] text-white/40 mb-1" style={{ fontWeight: 500 }}>
                    {tx.sound.track1Tag} · Berlin
                  </p>
                  <p className="text-[0.95rem] text-white/80 truncate" style={{ fontWeight: 500 }}>
                    {tx.sound.track1Title}
                  </p>
                </div>
              </div>

              <Link
                href="/sound"
                className="anim-up-3 inline-block text-[0.8rem] text-white/55 hover:text-white transition-colors no-underline border-b border-white/15 hover:border-white pb-0.5"
                style={{ fontWeight: 500 }}
              >
                {tx.sound.viewAll}
              </Link>
            </div>
          </div>
        </SnapSection>

        {/* ── 05 VISUAL — small image grid ── */}
        <SnapSection id="visual" className="order-5">
          <div className="h-full flex flex-col bg-[#070707] px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[920px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.visual.tag}
              </p>
              <h2 className="anim-up-2 mb-3 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95" style={{ fontWeight: 500 }}>
                {tx.visual.heading}
              </h2>
              <p className="anim-up-3 mb-10 text-[1rem] leading-relaxed text-white/55 max-w-lg" style={{ fontWeight: 400 }}>
                {tx.visual.body}
              </p>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {tx.visual.items.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.src}
                      src={img.src}
                      alt={img.alt}
                      className="anim-up w-full aspect-[3/4] object-cover rounded-sm opacity-85 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 06 NOTES (formerly Woman in Tech) ── */}
        <SnapSection id="notes" className="order-6">
          <div className="h-full flex flex-col bg-black px-6 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[760px] flex h-full flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p className="anim-up text-[0.7rem] uppercase tracking-[0.32em] text-white/40 mb-4" style={{ fontWeight: 500 }}>
                {tx.blog.womanInTech.tag}
              </p>
              <h2 className="anim-up-2 mb-10 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95" style={{ fontWeight: 500 }}>
                {tx.blog.womanInTech.heading}
              </h2>

              <div className="flex-1 overflow-y-auto pr-1 substack-list">
                {notesTop2.map((post) => (
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

        {/* ── 07 FOOTER ── */}
        <SnapSection className="order-7">
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
