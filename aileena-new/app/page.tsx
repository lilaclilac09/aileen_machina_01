'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import DJStation from '../components/DJStation';
import LoadingScreen from '../components/LoadingScreen';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';
import './blog/_substack/substack.css';

export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <Header />
      <SnapContainer key={language}>

        {/* ── 01 OPEN TO WORK (landing) ── */}
        <SnapSection id="open-to-work" className="order-1">
          <div className="h-full flex flex-col bg-[#070707] px-5 sm:px-10 lg:px-16 py-10 sm:py-14"
               style={{ fontFamily: "'Nunito', system-ui, -apple-system, sans-serif" }}>
            <div className="mx-auto w-full max-w-[920px] flex h-full flex-col">

              <div className="dispatch-scroll flex-1 overflow-y-auto pr-1 sm:pr-2 -mx-1 px-1">

                {/* status + headline */}
                <div className="anim-up flex items-center gap-3 mb-5 sm:mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_10px_rgba(0,255,234,0.75)] animate-pulse" />
                  <p className="text-[0.72rem] uppercase tracking-[0.32em] text-white/60" style={{ fontWeight: 500 }}>
                    {tx.openToWork.tag}
                  </p>
                </div>

                <h1 className="anim-up-2 mb-5 sm:mb-6 text-[clamp(2.4rem,7vw,4.8rem)] tracking-tight text-white"
                    style={{ fontWeight: 600, lineHeight: 1.05 }}>
                  {tx.openToWork.heading}
                </h1>

                <p className="anim-up-3 mb-10 sm:mb-12 max-w-2xl text-base sm:text-[1.05rem] leading-relaxed text-white/65"
                   style={{ fontWeight: 400 }}>
                  {tx.openToWork.body}
                </p>

                {/* Featured AI Agent CTA — the centerpiece */}
                <div className="anim-up mb-12 sm:mb-14 rounded-2xl bg-gradient-to-br from-[#00ffea]/[0.06] via-[#00ffea]/[0.02] to-transparent border border-[#00ffea]/25 p-6 sm:p-9 shadow-[0_0_80px_-25px_rgba(0,255,234,0.45)]">
                  <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                    <span className="h-2 w-2 rounded-full bg-[#00ffea] shadow-[0_0_12px_rgba(0,255,234,0.9)] animate-pulse" />
                    <p className="text-[0.68rem] sm:text-[0.72rem] tracking-[0.34em] text-[#00ffea]/85 uppercase" style={{ fontWeight: 500 }}>
                      {tx.openToWork.aiAgents.tag}
                    </p>
                  </div>

                  <h2 className="text-[clamp(1.5rem,4.2vw,2.4rem)] leading-tight text-white mb-4 sm:mb-5"
                      style={{ fontWeight: 600 }}>
                    {tx.openToWork.aiAgents.heading}
                  </h2>

                  <p className="text-[0.95rem] sm:text-[1.02rem] leading-relaxed text-white/72 max-w-2xl mb-6 sm:mb-7"
                     style={{ fontWeight: 400 }}>
                    {tx.openToWork.aiAgents.body}
                  </p>

                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
                    className="inline-flex items-center gap-2 rounded-full bg-[#00ffea] px-5 sm:px-6 py-2.5 sm:py-3 text-[0.74rem] sm:text-[0.78rem] tracking-[0.18em] uppercase text-black hover:bg-[#00ffea]/85 transition-colors cursor-pointer"
                    style={{ fontWeight: 700 }}
                  >
                    {tx.openToWork.aiAgents.footer}
                    <span aria-hidden>→</span>
                  </button>
                </div>

                {/* Stack + How I Work — two clean columns, no boxes */}
                <div className="anim-up grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 mb-12 sm:mb-14">
                  <div>
                    <p className="text-[0.66rem] tracking-[0.32em] text-white/40 uppercase mb-5" style={{ fontWeight: 500 }}>
                      {tx.openToWork.stackLabel}
                    </p>
                    <ul className="space-y-4">
                      {tx.openToWork.stack.map(row => (
                        <li key={row.tag}>
                          <p className="text-[0.68rem] tracking-[0.22em] text-[#00ffea]/75 uppercase mb-1.5" style={{ fontWeight: 600 }}>{row.tag}</p>
                          <p className="text-[0.92rem] leading-relaxed text-white/65" style={{ fontWeight: 400 }}>{row.items}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[0.66rem] tracking-[0.32em] text-white/40 uppercase mb-5" style={{ fontWeight: 500 }}>
                      {tx.openToWork.modeLabel}
                    </p>
                    <ul className="space-y-3.5">
                      {tx.openToWork.modes.map((mode, i) => (
                        <li key={i} className="flex gap-3 text-[0.92rem] leading-relaxed text-white/65" style={{ fontWeight: 400 }}>
                          <span className="mt-2 h-1 w-1 rounded-full bg-[#00ffea]/55 shrink-0" />
                          <span>{mode}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href="mailto:rosazxc0915@gmail.com"
                  className="anim-up-3 inline-flex items-center gap-2 text-[0.82rem] sm:text-[0.88rem] tracking-[0.14em] text-white/80 hover:text-white transition-colors no-underline border-b border-white/25 hover:border-white pb-1"
                  style={{ fontWeight: 500 }}
                >
                  {tx.openToWork.cta}
                </a>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 02 FEATURED REPO ── */}
        <SnapSection id="featured-repo" className="order-2">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px] flex h-full flex-col py-6 sm:py-12">
              <div className="anim-up flex items-end border-b border-white/8 pb-3 mb-4 sm:mb-8">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.pow.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-4 sm:mb-8 text-[clamp(1.5rem,6vw,6rem)] font-semibold tracking-[0.1em]">{tx.pow.heading}</h2>
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {tx.pow.items.map((item, i) => (
                    <div key={item.name} className={`group anim-up-${Math.min(i + 1, 3)} flex flex-col rounded-lg border border-white/8 bg-white/[0.02] overflow-hidden transition-colors hover:border-[#00ffea]/30 hover:bg-white/[0.04]`}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="relative block h-32 sm:h-40 w-full overflow-hidden bg-black/50 no-underline">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                            <span className="font-mono text-[0.5rem] tracking-[0.5em] text-[#00ffea]/25 uppercase">Under Construction</span>
                            <span className="mt-2 font-mono text-[0.45rem] tracking-[0.3em] text-white/15 uppercase">Frontend coming soon</span>
                          </div>
                        )}
                      </a>
                      <div className="flex flex-col justify-between flex-1 p-4 sm:p-6">
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="no-underline">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags.map(tag => (
                              <span key={tag} className="font-mono text-[0.55rem] tracking-[0.3em] text-[#00ffea]/40 uppercase border border-[#00ffea]/15 rounded px-2 py-0.5">{tag}</span>
                            ))}
                          </div>
                          <h3 className="text-[clamp(1rem,2.5vw,1.4rem)] tracking-[0.07em] text-white/85 group-hover:text-white transition-colors">{item.name}</h3>
                          <p className="mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-white/50">{item.description}</p>
                        </a>
                        <div className="mt-4 flex items-center gap-4">
                          <a href={item.href} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.6rem] tracking-[0.35em] text-[#00ffea]/50 hover:text-[#00ffea] transition-colors uppercase no-underline">{item.cta}</a>
                          {'liveHref' in item && item.liveHref && (
                            <a href={item.liveHref as string} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.6rem] tracking-[0.35em] text-[#00ffea]/30 hover:text-[#00ffea] transition-colors uppercase no-underline">Live →</a>
                          )}
                          {'pdfHref' in item && item.pdfHref && (
                            <a href={item.pdfHref as string} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.6rem] tracking-[0.35em] text-white/30 hover:text-white/70 transition-colors uppercase no-underline">PDF →</a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 03 RESEARCH DISPATCH ── */}
        <SnapSection id="blog" className="order-3">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[760px] flex h-full flex-col py-10 sm:py-12">
              <div className="anim-up flex items-end pb-5 mb-8">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.blog.researchDispatch.tag}</p>
              </div>
              <h2
                className="anim-up-2 mb-10 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-white/95"
                style={{ fontFamily: "'Nunito', system-ui, -apple-system, sans-serif", fontWeight: 500 }}
              >
                {tx.blog.researchDispatch.heading}
              </h2>
              <div className="flex-1 overflow-y-auto pr-1 substack-list">
                {tx.blog.researchDispatch.posts.map((post) => (
                  <Link key={post.title} href={post.href}>
                    <p className="sl-date">{post.date}</p>
                    <h3 className="sl-title">{post.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 04 WOMAN IN TECH ── */}
        <SnapSection id="woman-in-tech" className="order-4">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px] flex h-full flex-col py-10 sm:py-12">
              <div className="anim-up flex items-end border-b border-white/8 pb-5 mb-12">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.blog.womanInTech.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-12 text-[clamp(2rem,6vw,6rem)] font-semibold tracking-[0.1em]">{tx.blog.womanInTech.heading}</h2>
              <div className="dispatch-scroll relative flex-1 overflow-y-auto pr-1 sm:pr-2">
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {tx.blog.womanInTech.posts.map((post, i) => (
                    <Link
                      key={post.title}
                      href={post.href}
                      className={`group anim-up-${Math.min(i + 1, 3)} flex min-h-[240px] flex-col justify-between rounded-lg bg-white/[0.02] p-6 sm:p-7 transition-colors hover:bg-white/[0.06] no-underline`}
                    >
                      <div>
                        <p className="font-mono text-[0.68rem] sm:text-xs tracking-[0.22em] sm:tracking-widest text-white/40">{post.date}</p>
                        <h3 className="mt-3 text-[clamp(1.05rem,3.5vw,2rem)] tracking-[0.07em] sm:tracking-[0.1em] text-white/85 group-hover:text-white transition-colors">{post.title}</h3>
                        <p className="mt-3 text-sm leading-6 sm:leading-7 text-white/55" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden' }}>
                          {post.body}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="font-mono text-[0.6rem] tracking-[0.35em] text-[#00ffea]/50 group-hover:text-[#00ffea] transition-colors uppercase">{tx.blog.womanInTech.read}</span>
                        <span className="text-[#00ffea]/50 group-hover:text-[#00ffea] transition-colors">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="pointer-events-none sticky bottom-0 h-12 bg-gradient-to-t from-black to-transparent" />
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 05 SOUND / DJ ── */}
        <SnapSection id="sound" className="order-5">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-12 pt-6 pb-4 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="flex items-end border-b border-white/8 pb-3 mb-6">
                <p className="text-[0.58rem] uppercase tracking-[0.55em] text-white/25">{tx.sound.tag}</p>
              </div>
              <DJStation />
            </div>
          </div>
        </SnapSection>

        {/* ── 06 FOOTER ── */}
        <SnapSection className="order-6">
          <div className="h-full flex flex-col justify-between bg-[#030303] px-5 sm:px-10 lg:px-16 py-16">
            <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col justify-between">
              <div className="anim-up border-b border-white/8 pb-12">
                <p className="text-[clamp(2.5rem,8vw,8rem)] font-black tracking-[0.08em] text-white/6 leading-none">AILEENA MACHINA</p>
              </div>
              <div className="grid gap-8 md:grid-cols-[1fr_auto]">
                <p className="anim-up text-sm leading-7 text-white/45 max-w-sm">{tx.footer.body}</p>
                <div className="anim-left grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                  {tx.footer.columns.map((col) => (
                    <div key={col.heading}>
                      <h3 className="text-xs uppercase tracking-[0.45em] text-white/40 mb-5">{col.heading}</h3>
                      <ul className="space-y-3 text-sm text-white/55">
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
              </div>
              <p className="anim-fade font-mono text-[0.62rem] tracking-[0.45em] text-white/30 mt-8">EST 2025 · AILEENA · MACHINA</p>
              <p className="anim-fade font-mono text-[0.55rem] tracking-[0.3em] text-white/20 mt-2">
                Open source · AGPL-3.0 ·{' '}
                <a href="https://github.com/lilaclilac09/aileen_machina_01" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">github.com/lilaclilac09/aileen_machina_01</a>
              </p>
            </div>
          </div>
        </SnapSection>

      </SnapContainer>
    </>
  );
}
