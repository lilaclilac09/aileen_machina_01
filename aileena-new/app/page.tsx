'use client';

import Link from 'next/link';
import Header from '../components/Header';
import DJStation from '../components/DJStation';
import { SnapContainer, SnapSection } from '../components/SnapScroll';
import { useLanguage } from '../components/LanguageProvider';
import { t } from '../lib/translations';

export default function Home() {
  const { language } = useLanguage();
  const tx = t[language];

  return (
    <>
      <Header />
      <SnapContainer key={language}>

        {/* ── 01 HERO ── */}
        <SnapSection id="hero">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,.08) 0%, rgba(0,0,0,.5) 55%, rgba(0,0,0,.98) 100%), url('/bg_pic/04.jpeg')",
              backgroundSize: 'auto 100%',
              backgroundPosition: '58% center',
            }}
            aria-hidden
          />
          <div className="relative z-10 h-full mx-auto max-w-[1600px] grid grid-cols-1 lg:grid-cols-2 px-5 sm:px-10 lg:px-12">
            <div className="flex items-end pb-16">
              <h1 className="anim-up text-[clamp(4rem,11vw,10rem)] font-black leading-[0.86] tracking-[0.06em] text-white">
                <span className="block">AILEENA</span>
                <span className="block text-[#00ffea]">MACHINA</span>
              </h1>
            </div>
            <div className="flex items-end justify-start pb-16 lg:justify-end">
              <div className="anim-left max-w-xs">
                <p className="text-xs uppercase tracking-[0.5em] text-white/50">{tx.hero.tag}</p>
                <h2 className="mt-4 text-lg font-light tracking-[0.22em] text-white/85">{tx.hero.heading}</h2>
                <p className="mt-4 text-sm leading-7 text-white/55">{tx.hero.body}</p>
                <div className="mt-8 text-xs uppercase tracking-[0.4em] text-white/35">{tx.hero.footer}</div>
              </div>
            </div>
          </div>
          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/30" />
            <span className="text-[0.6rem] uppercase tracking-[0.5em] text-white/35">scroll</span>
          </div>
        </SnapSection>

        {/* ── 02 PROGRAMME ── */}
        <SnapSection id="programme">
          <div className="h-full flex flex-col justify-center bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="anim-up flex items-end justify-between border-b border-white/8 pb-5 mb-12">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.programme.tag}</p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/35">{tx.programme.heading}</p>
              </div>
              <div>
                {tx.programme.items.map((item, i) => (
                  <Link key={item.index} href={item.href}
                    className={`group grid grid-cols-[3rem_1fr_auto] items-center gap-8 border-b border-white/6 py-7 hover:border-white/15 transition-colors anim-up-${i + 1 > 3 ? 3 : i + 1}`}
                  >
                    <span className="font-mono text-xs tracking-widest text-white/35">{item.index}</span>
                    <div>
                      <h3 className="text-[clamp(1.4rem,3.5vw,2.8rem)] font-semibold tracking-[0.1em] text-white group-hover:text-[#00ffea] transition-colors">{item.title}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.35em] text-white/45">{item.meta}</p>
                    </div>
                    <span className="text-[#00ffea] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-xl">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 03 GALLERY ── */}
        <SnapSection id="gallery">
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
              <div className="anim-fade bg-cover bg-center" style={{ backgroundImage: "url('/bg_pic/01.jpeg')", animationDelay: '0.1s' }} />
              <div className="anim-fade bg-cover bg-center" style={{ backgroundImage: "url('/bg_pic/02.jpeg')", animationDelay: '0.2s' }} />
            </div>
          </div>
        </SnapSection>

        {/* ── 04 SOUND / DJ ── */}
        <SnapSection id="sound">
          <div className="h-full flex flex-col bg-black px-5 sm:px-10 lg:px-12 pt-6 pb-4 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="flex items-end border-b border-white/8 pb-3 mb-6">
                <p className="text-[0.58rem] uppercase tracking-[0.55em] text-white/25">{tx.sound.tag}</p>
              </div>
              <DJStation />
            </div>
          </div>
        </SnapSection>

        {/* ── 05 WORKS ── */}
        <SnapSection id="works">
          <div className="h-full flex flex-col justify-center bg-[#050505] px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="anim-up flex items-end border-b border-white/8 pb-5 mb-12">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.works.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-14 text-[clamp(2rem,6vw,6rem)] font-semibold tracking-[0.1em]">{tx.works.heading}</h2>
              <div className="grid gap-0 lg:grid-cols-3">
                {tx.works.items.map((title, i) => (
                  <div key={title} className={`border-t border-white/8 pt-8 pb-6 lg:border-l lg:border-t-0 lg:px-10 first:lg:border-l-0 first:lg:pl-0 anim-up-${Math.min(i + 1, 3)}`}>
                    <p className="font-mono text-xs tracking-widest text-white/40">0{i + 1}</p>
                    <h3 className="mt-5 text-2xl font-semibold tracking-[0.12em]">{title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/50">{tx.works.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 06 BLOG ── */}
        <SnapSection id="blog">
          <div className="h-full flex flex-col justify-center bg-black px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="anim-up flex items-end border-b border-white/8 pb-5 mb-12">
                <p className="text-xs uppercase tracking-[0.5em] text-white/45">{tx.blog.tag}</p>
              </div>
              <h2 className="anim-up-2 mb-12 text-[clamp(2rem,6vw,6rem)] font-semibold tracking-[0.1em]">{tx.blog.heading}</h2>
              <div>
                {tx.blog.posts.map((title, i) => (
                  <div key={title} className={`group grid grid-cols-[7rem_1fr] items-start gap-8 border-b border-white/8 py-7 anim-up-${Math.min(i + 1, 3)}`}>
                    <p className="font-mono text-xs tracking-widest text-white/40 pt-1">2026.0{i + 1}.15</p>
                    <div>
                      <h3 className="text-[clamp(1rem,2.5vw,2rem)] tracking-[0.1em] text-white/85 group-hover:text-white transition-colors">{title}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/50">{tx.blog.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 07 CONTACT ── */}
        <SnapSection id="contact">
          <div className="h-full flex flex-col justify-center bg-[#050505] px-5 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-[1400px] grid gap-16 lg:grid-cols-[0.5fr_1fr] items-center">
              <div>
                <div className="anim-up flex items-center gap-3 mb-8">
                  <div className="h-px flex-1" style={{ background: 'rgba(0,255,234,0.18)' }} />
                  <span className="font-mono text-[0.58rem] tracking-[0.5em] text-[#00ffea]/30">SAT-LINK · NODE-7</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(0,255,234,0.18)' }} />
                </div>
                <h2 className="anim-up-2 font-mono text-[clamp(1.9rem,4vw,4rem)] font-light tracking-[0.15em] text-white">{tx.contact.heading}</h2>
                <div className="anim-up-3 mt-8 space-y-2">
                  <p className="font-mono text-[0.58rem] tracking-[0.4em] text-white/30">UPLINK · 2.4 GHz · SAT-A7</p>
                  <p className="font-mono text-[0.58rem] tracking-[0.4em] text-white/30">ENCRYPTION · AES-256 · ACTIVE</p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/50 shadow-[0_0_6px_rgba(0,255,234,0.6)] animate-pulse" />
                    <p className="font-mono text-[0.58rem] tracking-[0.4em] text-[#00ffea]/50">STANDBY</p>
                  </div>
                </div>
              </div>

              <div className="anim-left font-mono">
                <div className="flex items-center justify-between border border-[#00ffea]/10 px-4 py-2" style={{ background: 'rgba(0,255,234,0.025)' }}>
                  <span className="text-[0.58rem] tracking-[0.5em] text-[#00ffea]/40 uppercase">TRANSMISSION TERMINAL</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/55 shadow-[0_0_4px_rgba(0,255,234,0.5)] animate-pulse" />
                  </div>
                </div>
                <div className="border border-t-0 border-[#00ffea]/10 p-5 space-y-0">
                  <div className="border-b border-white/6 py-4">
                    <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">SIGNAL ORIGIN ·</p>
                    <input className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85" placeholder={tx.contact.name} />
                  </div>
                  <div className="border-b border-white/6 py-4">
                    <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">RETURN FREQUENCY ·</p>
                    <input className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85" placeholder={tx.contact.email} />
                  </div>
                  <div className="border-b border-white/6 py-4">
                    <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">PAYLOAD ·</p>
                    <textarea className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85 min-h-20 resize-none" placeholder={tx.contact.message} />
                  </div>
                  <div className="flex items-center justify-between pt-5">
                    <span className="text-[0.5rem] tracking-[0.4em] text-white/20">PKT · AUTO · ENC · ON</span>
                    <button className="group flex items-center gap-2 hover:opacity-70 transition-opacity">
                      <span className="text-[0.65rem] tracking-[0.55em] text-[#00ffea]/70 group-hover:text-[#00ffea]">{tx.contact.send}</span>
                      <span className="text-sm text-[#00ffea]/55 group-hover:text-[#00ffea] transition-colors">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 08 FOOTER ── */}
        <SnapSection>
          <div className="h-full flex flex-col justify-between bg-[#030303] px-5 sm:px-10 lg:px-16 py-16">
            <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col justify-between">
              <div className="anim-up border-b border-white/8 pb-12">
                <p className="text-[clamp(2.5rem,8vw,8rem)] font-black tracking-[0.08em] text-white/6 leading-none">AILEENA MACHINA</p>
              </div>
              <div className="grid gap-8 md:grid-cols-[1fr_auto]">
                <p className="anim-up text-sm leading-7 text-white/45 max-w-sm">{tx.footer.body}</p>
                <div className="anim-left grid grid-cols-3 gap-10">
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
