'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import DJStation from '../components/DJStation';
import LoadingScreen from '../components/LoadingScreen';
import OscilloscopeBackground from '../components/OscilloscopeBackground';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';

export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];
  const [loaded, setLoaded] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <Header />
      <SnapContainer key={language}>

        {/* ── 01 HERO ── */}
        <SnapSection id="hero" className="order-1">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,.08) 0%, rgba(0,0,0,.5) 55%, rgba(0,0,0,.98) 100%), url('/bg_pic/04.jpeg')",
              backgroundSize: 'auto 70%',
              backgroundPosition: '58% calc(50% - 48px)',
              backgroundRepeat: 'no-repeat',
            }}
            aria-hidden
          />
          <div className="relative z-10 h-full mx-auto max-w-[1600px] grid grid-cols-1 lg:grid-cols-2 px-5 sm:px-10 lg:px-12">
            <div className="flex items-end pb-8 sm:pb-16">
              <h1 className="anim-up text-[clamp(4rem,11vw,10rem)] font-black leading-[0.86] tracking-[0.06em] text-white">
                <span className="block">AILEENA</span>
                <span className="block text-[#00ffea]">MACHINA</span>
              </h1>
            </div>
            <div className="flex items-end justify-start pb-10 sm:pb-16 lg:justify-end">
              <div className="anim-left max-w-md lg:max-w-xs">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] sm:tracking-[0.5em] text-white/50">{tx.hero.tag}</p>
                <h2 className="mt-3 sm:mt-4 text-base sm:text-lg font-light tracking-[0.15em] sm:tracking-[0.22em] text-white/85">{tx.hero.heading}</h2>
                <p className="mt-3 sm:mt-4 text-sm leading-6 sm:leading-7 text-white/55">{tx.hero.body}</p>
                <div className="mt-6 sm:mt-8 text-[0.62rem] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/35">{tx.hero.footer}</div>
              </div>
            </div>
          </div>
          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/30" />
            <span className="text-[0.6rem] uppercase tracking-[0.5em] text-white/35">{tx.hero.scroll}</span>
          </div>
        </SnapSection>

        {/* ── 02 PROGRAMME ── */}
        <SnapSection id="programme" className="order-2">
          <OscilloscopeBackground />
          <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="anim-up flex items-end justify-between border-b border-white/8 pb-5 mb-12">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.programme.tag}</p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/35">{tx.programme.heading}</p>
              </div>
              <div>
                {tx.programme.items.map((item, i) => (
                  <Link key={item.index} href={item.href}
                    className={`group grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto] items-center gap-4 sm:gap-8 border-b border-white/6 py-5 sm:py-7 hover:border-white/15 transition-colors anim-up-${i + 1 > 3 ? 3 : i + 1}`}
                  >
                    <span className="font-mono text-xs tracking-widest text-white/35">{item.index}</span>
                    <div>
                      <h3 className="text-[clamp(1.05rem,6vw,2.8rem)] font-semibold tracking-[0.07em] sm:tracking-[0.1em] text-white group-hover:text-[#00ffea] transition-colors">{item.title}</h3>
                      <p className="mt-1 text-[0.62rem] sm:text-xs uppercase tracking-[0.24em] sm:tracking-[0.35em] text-white/45">{item.meta}</p>
                    </div>
                    <span className="text-[#00ffea] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-xl">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 03 OPEN TO WORK ── */}
        <SnapSection id="open-to-work" className="order-3">
          <div className="h-full flex flex-col bg-[#070707] px-5 sm:px-10 lg:px-16 py-8 sm:py-12">
            <div className="mx-auto w-full max-w-[1100px] flex h-full flex-col">
              <div className="anim-up flex items-center gap-3 mb-3 sm:mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_8px_rgba(0,255,234,0.7)] animate-pulse" />
                <p className="font-mono text-xs uppercase tracking-[0.5em] text-[#00ffea]/70">{tx.openToWork.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-3 sm:mb-5 text-[clamp(1.8rem,6vw,4.5rem)] font-semibold tracking-[0.1em] text-white">{tx.openToWork.heading}</h2>

              <div className="dispatch-scroll flex-1 overflow-y-auto pr-1 sm:pr-2 -mx-1 px-1">
                <p className="anim-up-3 mb-6 sm:mb-8 max-w-2xl text-sm sm:text-base leading-7 sm:leading-8 text-white/75">
                  {tx.openToWork.body}
                </p>

                <div className="grid gap-6 sm:gap-10 sm:grid-cols-2 mb-6 sm:mb-8">
                  <div className="anim-up">
                    <p className="font-mono text-[0.6rem] tracking-[0.4em] text-white/40 uppercase mb-3 sm:mb-4">{tx.openToWork.stackLabel}</p>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {tx.openToWork.stack.map(row => (
                        <li key={row.tag} className="text-sm leading-6 text-white/75">
                          <span className="font-mono text-[0.62rem] tracking-[0.25em] uppercase text-[#00ffea]/70 mr-2">{row.tag}</span>
                          <span>{row.items}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="anim-up-2">
                    <p className="font-mono text-[0.6rem] tracking-[0.4em] text-white/40 uppercase mb-3 sm:mb-4">{tx.openToWork.builtLabel}</p>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {tx.openToWork.built.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-white/75">
                          <span className="mt-2 h-1 w-1 rounded-full bg-[#00ffea]/60 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="anim-up-3 mb-6 sm:mb-8">
                  <p className="font-mono text-[0.6rem] tracking-[0.4em] text-white/40 uppercase mb-3 sm:mb-4">{tx.openToWork.modeLabel}</p>
                  <ul className="space-y-2 sm:space-y-2.5 max-w-3xl">
                    {tx.openToWork.modes.map(mode => (
                      <li key={mode} className="flex items-start gap-2 text-sm leading-6 text-white/75">
                        <span className="mt-2 h-1 w-1 rounded-full bg-[#00ffea]/60 shrink-0" />
                        <span>{mode}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="#contact"
                  className="anim-up-3 inline-flex items-center gap-2 rounded-md border border-[#00ffea]/40 bg-[#00ffea]/5 px-5 py-3 font-mono text-xs tracking-[0.4em] uppercase text-[#00ffea] hover:bg-[#00ffea]/15 transition-colors"
                >
                  {tx.openToWork.cta}
                </Link>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 04 FEATURED REPO ── */}
        <SnapSection id="featured-repo" className="order-4">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px] flex h-full flex-col py-6 sm:py-12">
              <div className="anim-up flex items-end border-b border-white/8 pb-3 mb-4 sm:mb-8">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.pow.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-4 sm:mb-8 text-[clamp(1.5rem,6vw,6rem)] font-semibold tracking-[0.1em]">{tx.pow.heading}</h2>
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {tx.pow.items.map((item, i) => (
                    <Link key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={`group anim-up-${Math.min(i + 1, 3)} flex flex-col rounded-lg border border-white/8 bg-white/[0.02] overflow-hidden transition-colors hover:border-[#00ffea]/30 hover:bg-white/[0.04] no-underline`}>
                      <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-black/50">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                            <span className="font-mono text-[0.5rem] tracking-[0.5em] text-[#00ffea]/25 uppercase">Under Construction</span>
                            <span className="mt-2 font-mono text-[0.45rem] tracking-[0.3em] text-white/15 uppercase">Frontend coming soon</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-4 sm:p-6">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags.map(tag => (
                              <span key={tag} className="font-mono text-[0.55rem] tracking-[0.3em] text-[#00ffea]/40 uppercase border border-[#00ffea]/15 rounded px-2 py-0.5">{tag}</span>
                            ))}
                          </div>
                          <h3 className="text-[clamp(1rem,2.5vw,1.4rem)] tracking-[0.07em] text-white/85 group-hover:text-white transition-colors">{item.name}</h3>
                          <p className="mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-white/50">{item.description}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                          <span className="font-mono text-[0.6rem] tracking-[0.35em] text-[#00ffea]/50 group-hover:text-[#00ffea] transition-colors uppercase">{item.cta}</span>
                          {'liveHref' in item && item.liveHref && (
                            <span onClick={(e) => { e.preventDefault(); window.open(item.liveHref as string, '_blank'); }} className="font-mono text-[0.6rem] tracking-[0.35em] text-[#00ffea]/30 hover:text-[#00ffea] transition-colors uppercase cursor-pointer">Live →</span>
                          )}
                          {'pdfHref' in item && item.pdfHref && (
                            <span onClick={(e) => { e.preventDefault(); window.open(item.pdfHref as string, '_blank'); }} className="font-mono text-[0.6rem] tracking-[0.35em] text-white/30 hover:text-white/70 transition-colors uppercase cursor-pointer">PDF →</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 05 RESEARCH DISPATCH ── */}
        <SnapSection id="blog" className="order-5">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px] flex h-full flex-col py-10 sm:py-12">
              <div className="anim-up flex items-end border-b border-white/8 pb-5 mb-12">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.blog.researchDispatch.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-8 text-[clamp(1.5rem,6vw,6rem)] font-semibold tracking-[0.1em]">{tx.blog.researchDispatch.heading}</h2>
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {tx.blog.researchDispatch.posts.map((post, i) => (
                    <Link
                      key={post.title}
                      href={post.href}
                      className={`group anim-up-${Math.min(i + 1, 3)} flex min-h-[160px] sm:min-h-[200px] flex-col justify-between rounded-lg border border-white/8 bg-white/[0.02] p-4 sm:p-7 transition-colors hover:border-white/20 hover:bg-white/[0.05] no-underline`}
                    >
                      <div>
                        <p className="font-mono text-[0.68rem] sm:text-xs tracking-[0.22em] sm:tracking-widest text-white/40">{post.date}</p>
                        <h3 className="mt-3 text-[clamp(1.05rem,3.5vw,2rem)] tracking-[0.07em] sm:tracking-[0.1em] text-white/85 group-hover:text-white transition-colors">{post.title}</h3>
                        <p className="mt-3 text-sm leading-6 sm:leading-7 text-white/55" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden' }}>
                          {post.body}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="font-mono text-[0.6rem] tracking-[0.35em] text-[#00ffea]/50 group-hover:text-[#00ffea] transition-colors uppercase">{tx.blog.researchDispatch.watch}</span>
                        <span className="text-[#00ffea]/50 group-hover:text-[#00ffea] transition-colors">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 06 WOMAN IN TECH ── */}
        <SnapSection id="woman-in-tech" className="order-6">
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
                      className={`group anim-up-${Math.min(i + 1, 3)} flex min-h-[240px] flex-col justify-between rounded-lg border border-white/8 bg-white/[0.02] p-6 sm:p-7 transition-colors hover:border-white/20 hover:bg-white/[0.05] no-underline`}
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

        {/* ── 07 SOUND / DJ ── */}
        <SnapSection id="sound" className="order-7">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-12 pt-6 pb-4 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="flex items-end border-b border-white/8 pb-3 mb-6">
                <p className="text-[0.58rem] uppercase tracking-[0.55em] text-white/25">{tx.sound.tag}</p>
              </div>
              <DJStation />
            </div>
          </div>
        </SnapSection>

        {/* ── 08 GALLERY ── */}
        <SnapSection id="gallery" className="order-8">
          <div className="h-full grid lg:grid-cols-[0.55fr_1fr] bg-[#050505]">
            {/* Left */}
            <div className="flex flex-col justify-end px-5 pb-12 sm:px-10 lg:px-12">
              <p className="anim-up text-xs uppercase tracking-[0.5em] text-white/45">{tx.gallery.tag}</p>
              <h2 className="anim-up-2 mt-4 text-[clamp(2rem,5vw,5rem)] font-semibold tracking-[0.12em]">{tx.gallery.heading}</h2>
              <p className="anim-up-3 mt-5 max-w-sm text-sm leading-7 text-white/55">{tx.gallery.body}</p>
            </div>
            {/* Right — images */}
            <div className="grid grid-rows-2 grid-cols-2 gap-px h-full">
              <div className="col-span-2 anim-fade bg-cover bg-center" style={{ backgroundImage: "url('/bg_pic/03.jpeg')" }} />
              <div className="anim-fade overflow-hidden relative" style={{ animationDelay: '0.1s' }}>
                <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src="/bg_pic/01v.MP4" />
              </div>
              <div className="anim-fade bg-cover bg-center" style={{ backgroundImage: "url('/bg_pic/02.jpeg')", animationDelay: '0.2s' }} />
            </div>
          </div>
        </SnapSection>

        {/* ── 09 CONTACT ── */}
        <SnapSection id="contact" className="order-9">
          <div className="h-full flex flex-col justify-center bg-[#050505] px-5 sm:px-10 lg:px-16 py-10 sm:py-0">
            <div className="mx-auto w-full max-w-[1400px] grid gap-8 sm:gap-12 lg:gap-16 lg:grid-cols-[0.5fr_1fr] items-center">
              <div>
                <div className="anim-up flex items-center gap-2 sm:gap-3 mb-5 sm:mb-8">
                  <div className="h-px flex-1" style={{ background: 'rgba(0,255,234,0.18)' }} />
                  <span className="font-mono text-[0.52rem] sm:text-[0.58rem] tracking-[0.25em] sm:tracking-[0.5em] text-[#00ffea]/30">SAT-LINK · NODE-7</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(0,255,234,0.18)' }} />
                </div>
                <h2 className="anim-up-2 font-mono text-[clamp(1.9rem,4vw,4rem)] font-light tracking-[0.15em] text-white">{tx.contact.heading}</h2>
                <div className="anim-up-3 mt-8 space-y-2">
                  <p className="font-mono text-[0.58rem] tracking-[0.4em] text-white/30">UPLINK · 2.4 GHz · SAT-A7</p>
                  <p className="font-mono text-[0.58rem] tracking-[0.4em] text-white/30">ENCRYPTION · AES-256 · ACTIVE</p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/50 shadow-[0_0_6px_rgba(0,255,234,0.6)] animate-pulse" />
                    <p className="font-mono text-[0.58rem] tracking-[0.4em] text-[#00ffea]/50">{tx.contact.standby}</p>
                  </div>
                </div>
              </div>

              <div className="anim-left font-mono">
                <div className="flex items-center justify-between border border-[#00ffea]/10 px-4 py-2" style={{ background: 'rgba(0,255,234,0.025)' }}>
                  <span className="text-[0.52rem] sm:text-[0.58rem] tracking-[0.2em] sm:tracking-[0.5em] text-[#00ffea]/40 uppercase">{tx.contact.terminal}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/55 shadow-[0_0_4px_rgba(0,255,234,0.5)] animate-pulse" />
                  </div>
                </div>
                <div className="border border-t-0 border-[#00ffea]/10 p-5 space-y-0">
                  <div className="border-b border-white/6 py-4">
                    <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">{tx.contact.origin} ·</p>
                    <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85" placeholder={tx.contact.name} />
                  </div>
                  <div className="border-b border-white/6 py-4">
                    <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">{tx.contact.frequency} ·</p>
                    <input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85" placeholder={tx.contact.email} />
                  </div>
                  <div className="border-b border-white/6 py-4">
                    <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">{tx.contact.payload} ·</p>
                    <textarea value={formMsg} onChange={e => setFormMsg(e.target.value)} className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85 min-h-20 resize-none" placeholder={tx.contact.message} />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-5">
                    <span className="text-[0.5rem] tracking-[0.2em] sm:tracking-[0.4em] text-white/20">
                      {sent ? 'TRANSMISSION SENT ·' : 'PKT · AUTO · ENC · ON'}
                    </span>
                    <button
                      disabled={sending || sent}
                      onClick={async () => {
                        setSending(true);
                        await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formName, email: formEmail, message: formMsg }) });
                        setSending(false);
                        setSent(true);
                        setFormName(''); setFormEmail(''); setFormMsg('');
                      }}
                      className="group flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-40"
                    >
                      <span className="text-[0.62rem] sm:text-[0.65rem] tracking-[0.28em] sm:tracking-[0.55em] text-[#00ffea]/70 group-hover:text-[#00ffea]">
                        {sending ? 'SENDING...' : sent ? 'SENT ✓' : tx.contact.send}
                      </span>
                      {!sent && <span className="text-sm text-[#00ffea]/55 group-hover:text-[#00ffea] transition-colors">↗</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 10 FOOTER ── */}
        <SnapSection className="order-10">
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
            </div>
          </div>
        </SnapSection>

      </SnapContainer>
    </>
  );
}
