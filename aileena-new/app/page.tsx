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
  motif: 'article' | 'hbm' | 'pcb' | 'record';
  placement: CSSProperties;
};

type VisualItem = {
  src: string;
  alt: string;
  caption: string;
  href?: string;
};

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then a draggable clipping desk, then restored
 * personal rooms for podcast and handmade work, then the DJ station and
 * footer. Information is intentionally minimal: the homepage's job is to
 * set the mood, not to contain the content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  Clipping desk       — article scraps + social rail
 *   Section 03  Trendy              — podcast / fashion police notes
 *   Section 04  Visual              — handmade glass / handwritten scraps
 *   Section 05  Sound               — DJ station
 *   Section 06  Footer
 *
 * Cover-agent (Natalia portrait + Ask the agent) is preserved on the
 * cinematic opening; it doubles as the door to the agent department.
 *
 * Visual language: white editorial base, amber for Magazine, cyan/teal for
 * machina links. The DJ station stays black.
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
  const glassHref = tx.visual.items.find((item) => item.href)?.href ?? '/blog/pate-de-verre';
  const trendLinks = [
    { label: 'handmade', href: glassHref },
    { label: 'handwritten', href: '#visual' },
    { label: 'podcast', href: tx.trendy.podcast.kateHref, external: true },
  ];
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
      href: '/dispatch',
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
      placement: { top: '43%', right: '17%', transform: 'rotate(-2deg)', zIndex: 5 },
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
                    color: '#14110c',
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
                      gap: 8,
                      background: '#fff',
                      color: '#00a99f',
                      padding: '13px 22px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,169,159,0.38)',
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
                        background: '#00a99f',
                        boxShadow: '0 0 8px rgba(0,169,159,0.55)',
                      }}
                    />
                    Ask the agent
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

        {/* ── 02 DRAG DOCK — rooms as movable signals ───────────── */}
        <SnapSection id="dock" className="order-2">
          <AtriumDragDock rooms={rooms} />
        </SnapSection>

        {/* ── 03 TRENDY — fashion police + podcast ─────────────── */}
        <SnapSection id="trendy" className="order-3">
          <div
            className="h-full bg-white px-5 sm:px-9 lg:px-14"
            style={{
              fontFamily: nunito,
            }}
          >
            <div className="mx-auto flex h-full w-full max-w-[1180px] flex-col overflow-hidden pb-7 pt-[84px] sm:pb-8 sm:pt-[90px]">
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="anim-up mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#14110c]/10 pb-4">
                  <div>
                    <p className="mb-3 text-[0.58rem] uppercase tracking-[0.3em] text-[#14110c]/45" style={{ fontFamily: mono, fontWeight: 700 }}>
                      {tx.trendy.tag}
                    </p>
                    <h2 className="text-[clamp(2rem,4.6vw,4.05rem)] leading-none text-[#14110c]" style={{ fontWeight: 650 }}>
                      {tx.trendy.heading}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendLinks.map((item) => (
                      item.external ? (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[#14110c]/14 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-[#14110c]/54 no-underline transition-colors hover:border-[#00a99f]/45 hover:text-[#00a99f]"
                          style={{ fontFamily: mono, fontWeight: 700 }}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="rounded-full border border-[#14110c]/14 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-[#14110c]/54 no-underline transition-colors hover:border-[#00a99f]/45 hover:text-[#00a99f]"
                          style={{ fontFamily: mono, fontWeight: 700 }}
                        >
                          {item.label}
                        </Link>
                      )
                    ))}
                  </div>
                </div>

                <div className="grid items-start gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-7">
                  <section
                    className="anim-up-2 rounded-md border border-[#14110c]/10 bg-[#fbfaf7] p-5 sm:p-7"
                    style={{ boxShadow: '0 22px 70px -58px rgba(20,17,12,0.38)' }}
                  >
                    <p className="mb-5 max-w-[420px] text-[1.02rem] leading-relaxed text-[#14110c]/68" style={{ fontFamily: 'Georgia, serif' }}>
                      {tx.trendy.body} The listening shelf sits next to the glass bench: handmade, handwritten, and replayed until it turns into taste.
                    </p>
                    <Link
                      href="#visual"
                      className="mb-4 block rounded-md border border-[#14110c]/10 bg-white p-5 text-[#14110c] no-underline transition-colors hover:border-[#00a99f]/45"
                      style={{
                        background:
                          'repeating-linear-gradient(180deg, #fff 0 31px, rgba(20,17,12,0.06) 32px 33px)',
                      }}
                    >
                      <p className="mb-4 text-[0.58rem] uppercase tracking-[0.24em] text-[#14110c]/40" style={{ fontFamily: mono, fontWeight: 700 }}>
                        handwriting
                      </p>
                      <p className="text-[1.55rem] leading-none text-[#ff6f91]" style={{ fontFamily: "'Allura', cursive" }}>
                        {tx.visual.note}
                      </p>
                    </Link>
                    <div className="rounded-md border border-[#14110c]/10 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[0.56rem] uppercase tracking-[0.22em] text-[#14110c]/42" style={{ fontFamily: mono, fontWeight: 800 }}>
                          {tx.visual.kilnTag}
                        </p>
                        <Link
                          href={glassHref}
                          className="text-[0.58rem] uppercase tracking-[0.14em] text-[#00a99f] no-underline"
                          style={{ fontFamily: mono, fontWeight: 800 }}
                        >
                          {tx.visual.readGlass}
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tx.visual.items.map((img: VisualItem) => (
                          <Link
                            key={img.src}
                            href={img.href ?? glassHref}
                            className="group block no-underline"
                            aria-label={img.caption}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.src}
                              alt={img.alt}
                              className="aspect-[4/3] w-full rounded-[4px] object-cover opacity-90 transition-opacity group-hover:opacity-100"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="anim-up-3 grid gap-4 sm:grid-cols-2">
                    <a
                      href={tx.trendy.podcast.kateHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md border border-[#14110c]/10 bg-white p-5 text-[#14110c] no-underline transition-colors hover:border-[#00a99f]/45 sm:p-6"
                    >
                      <span className="mb-4 block text-[0.58rem] uppercase tracking-[0.24em] text-[#14110c]/42" style={{ fontFamily: mono, fontWeight: 800 }}>
                        {tx.trendy.rotationTag}
                      </span>
                      <span className="mb-3 block text-[1.38rem] leading-tight" style={{ fontWeight: 700 }}>
                        {tx.trendy.podcast.title}
                      </span>
                      <span className="mb-5 block text-[0.92rem] leading-relaxed text-[#14110c]/64" style={{ fontFamily: 'Georgia, serif' }}>
                        {tx.trendy.podcast.body}
                      </span>
                      <span aria-hidden className="mb-5 flex h-9 items-end gap-1">
                        {[18, 28, 14, 34, 24, 30, 16, 26, 20, 32].map((height, idx) => (
                          <span
                            key={`${height}-${idx}`}
                            style={{
                              display: 'block',
                              width: 5,
                              height,
                              borderRadius: 999,
                              background: idx % 3 === 0 ? '#00a99f' : 'rgba(20,17,12,0.22)',
                            }}
                          />
                        ))}
                      </span>
                      <span className="text-[0.7rem] uppercase tracking-[0.16em] text-[#00a99f]" style={{ fontFamily: mono, fontWeight: 800 }}>
                        {tx.trendy.podcast.kateLabel} →
                      </span>
                    </a>

                    <a
                      href={tx.trendy.doYouReadHer.episodeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md border border-[#14110c]/10 bg-white p-5 text-[#14110c] no-underline transition-colors hover:border-[#00a99f]/45 sm:p-6"
                    >
                      <span className="mb-4 block text-[0.58rem] uppercase tracking-[0.24em] text-[#14110c]/42" style={{ fontFamily: mono, fontWeight: 800 }}>
                        {tx.trendy.doYouReadHer.sectionLabel}
                      </span>
                      <span className="mb-3 block text-[1.38rem] leading-tight" style={{ fontWeight: 700 }}>
                        {tx.trendy.doYouReadHer.title}
                      </span>
                      <span className="mb-5 block text-[0.92rem] leading-relaxed text-[#14110c]/64" style={{ fontFamily: 'Georgia, serif' }}>
                        {tx.trendy.doYouReadHer.body}
                      </span>
                      <span className="text-[0.7rem] uppercase tracking-[0.16em] text-[#00a99f]" style={{ fontFamily: mono, fontWeight: 800 }}>
                        {tx.trendy.doYouReadHer.episodeLabel} →
                      </span>
                    </a>
                  </section>
                </div>

              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 04 VISUAL — handmade glass + handwritten note ─────── */}
        <SnapSection id="visual" className="order-4">
          <div className="h-full flex flex-col bg-white px-6 sm:px-10 lg:px-16">
            <div className="mx-auto flex h-full w-full max-w-[920px] flex-col py-12 sm:py-16" style={{ fontFamily: nunito }}>
              <p
                className="anim-up mb-4 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.32em] text-[#14110c]/40"
                style={{ fontWeight: 500 }}
              >
                {tx.visual.tag} <Sparkle />
              </p>
              <h2
                className="anim-up-2 mb-3 flex items-center gap-3 text-[clamp(1.6rem,4.2vw,2.6rem)] tracking-tight text-[#14110c]"
                style={{ fontWeight: 500 }}
              >
                {tx.visual.heading} <Heart />
              </h2>
              <p className="anim-up-3 mb-8 max-w-lg text-[1rem] leading-relaxed text-[#14110c]/62" style={{ fontWeight: 400 }}>
                {tx.visual.body}
              </p>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {tx.visual.items.map((img: VisualItem) => {
                    const tile = (
                      <figure className="m-0 rounded-md border border-[#14110c]/10 bg-white p-2 transition-colors group-hover:border-[#00a99f]/45">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="aspect-square w-full rounded-[4px] object-cover opacity-90 transition-opacity group-hover:opacity-100"
                        />
                        <figcaption
                          className="mt-2 min-h-[2rem] text-center"
                          style={{
                            fontFamily: "'Allura', cursive",
                            color: '#ff6f91',
                            fontSize: 'clamp(1.1rem, 2.4vw, 1.45rem)',
                            letterSpacing: '0.01em',
                            lineHeight: 1,
                          }}
                        >
                          {img.caption}
                          {img.href && (
                            <span
                              className="ml-3 opacity-0 transition-opacity group-hover:opacity-100"
                              style={{
                                color: '#00a99f',
                                fontFamily: "'Allura', cursive",
                                fontSize: '0.55em',
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

                <div className="anim-up mt-9 flex items-center gap-3 text-[#14110c]/30">
                  <Sparkle />
                  <Heart />
                  <Star />
                  <Flower />
                  <span
                    className="ml-1 text-[#14110c]/55"
                    style={{
                      color: '#ff6f91',
                      fontFamily: "'Allura', cursive",
                      fontSize: '1.35rem',
                      lineHeight: 1,
                    }}
                  >
                    {tx.visual.note}
                  </span>
                </div>
                <Link
                  href="/blog/pate-de-verre"
                  className="anim-up mt-4 inline-block text-[0.82rem] text-[#00a99f] transition-colors hover:text-[#008f86]"
                  style={{ fontWeight: 500 }}
                >
                  {tx.visual.readGlass}
                </Link>
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ── 05 SOUND — DJ station ─────────────────────────────── */}
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

        {/* ── 06 FOOTER ─────────────────────────────────────────── */}
        <SnapSection className="order-6">
          <div
            className="h-full flex flex-col justify-end bg-white px-6 sm:px-10 lg:px-16 py-14 sm:py-16"
            style={{ fontFamily: nunito }}
          >
            <div className="mx-auto w-full max-w-[920px]">
              <p className="anim-up text-sm leading-7 text-[#14110c]/58 mb-10 max-w-md" style={{ fontWeight: 400 }}>
                {tx.footer.body}
              </p>
              <div className="grid grid-cols-2 gap-10 sm:gap-14 mb-10">
                {tx.footer.columns.map((col) => (
                  <div key={col.heading} className="anim-left">
                    <h3 className="text-[0.66rem] uppercase tracking-[0.28em] text-[#14110c]/38 mb-4" style={{ fontWeight: 500 }}>
                      {col.heading}
                    </h3>
                    <ul className="space-y-2.5 text-[0.92rem] text-[#14110c]/62" style={{ fontWeight: 400 }}>
                      {col.links.map((link) => (
                        <li key={link.label}>
                          {link.href.startsWith('http')
                            ? <a href={link.href} className="hover:text-[#00a99f] transition-colors">{link.label}</a>
                            : <Link href={link.href} className="hover:text-[#00a99f] transition-colors">{link.label}</Link>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="anim-fade text-[0.6rem] tracking-[0.3em] text-[#14110c]/30" style={{ fontWeight: 500 }}>
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
        background: '#fff',
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
            className="absolute right-[11%] top-[38%] z-[7] hidden h-[168px] w-[360px] overflow-hidden sm:block"
            style={{
              background:
                'radial-gradient(circle at 78% 24%, rgba(255,255,255,0.92) 0 40px, transparent 41px), linear-gradient(135deg, #ff2f2f 0%, #14110c 48%, #09d66f 100%)',
              border: '6px solid #f8f5ee',
              borderRadius: 22,
              boxShadow: '0 0 0 7px #ff1f9a, 0 14px 0 rgba(20,17,12,0.92), 0 28px 60px -28px rgba(20,17,12,0.75)',
              transform: 'rotate(2deg)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 16,
                top: 13,
                display: 'flex',
                gap: 8,
              }}
            >
              {['11.3x', '19.4x', '12.4x'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px 2px',
                    background: '#f8f5ee',
                    border: '2px solid #14110c',
                    borderRadius: 8,
                    color: '#14110c',
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
                bottom: 16,
                color: '#f8f5ee',
                fontSize: '2.65rem',
                fontWeight: 950,
                letterSpacing: '-0.08em',
                lineHeight: 0.84,
                textShadow: '4px 4px 0 #14110c',
                WebkitTextStroke: '1px #14110c',
              }}
            >
              JENSEN
              <br />
              STICKER
            </span>
            <span
              style={{
                position: 'absolute',
                right: 28,
                bottom: 22,
                width: 92,
                height: 112,
                borderRadius: '46% 46% 40% 40%',
                background: '#f3c49a',
                border: '4px solid #14110c',
                boxShadow: 'inset 0 -14px 0 rgba(20,17,12,0.16)',
              }}
            >
              <span style={{ position: 'absolute', left: 18, top: 36, width: 56, height: 14, border: '3px solid #14110c', borderRadius: 999, background: 'rgba(248,245,238,0.88)' }} />
              <span style={{ position: 'absolute', left: 21, top: 39, width: 14, height: 8, borderRadius: '50%', background: '#14110c' }} />
              <span style={{ position: 'absolute', right: 21, top: 39, width: 14, height: 8, borderRadius: '50%', background: '#14110c' }} />
              <span style={{ position: 'absolute', left: 28, top: 67, width: 36, height: 16, borderBottom: '4px solid #14110c', borderRadius: '0 0 999px 999px' }} />
              <span style={{ position: 'absolute', left: -7, bottom: -20, width: 106, height: 38, borderRadius: '18px 18px 0 0', background: '#14110c' }} />
            </span>
            <span
              style={{
                position: 'absolute',
                right: 18,
                top: 16,
                padding: '4px 8px',
                borderRadius: 8,
                background: '#76ff03',
                color: '#14110c',
                fontFamily: mono,
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.02em',
              }}
            >
              NVIDIA
            </span>
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

const thumbnailShellStyle: CSSProperties = {
  display: 'block',
  padding: 0,
  background: 'transparent',
};

const thumbnailTitleStyle: CSSProperties = {
  display: 'block',
  color: '#14110c',
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
          display: 'block',
          minHeight: 420,
          padding: '42px 34px 32px',
          background:
            'repeating-linear-gradient(180deg, transparent 0 33px, rgba(20,17,12,0.055) 34px 35px), linear-gradient(90deg, transparent 0 56px, rgba(255,94,166,0.12) 57px 58px, transparent 59px)',
        }}
      >
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
            letterSpacing: '-0.055em',
            lineHeight: 0.94,
            margin: '0 auto 24px',
            maxWidth: 350,
            textAlign: 'center',
            fontFamily: "'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive",
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

  if (room.motif === 'hbm') {
    return (
      <span style={thumbnailShellStyle}>
        <span
          aria-hidden
          style={{
            position: 'relative',
            display: 'block',
            height: 178,
            overflow: 'hidden',
            borderRadius: 14,
            background:
              'radial-gradient(circle at 24% 34%, #f2c09a 0 30px, transparent 31px), radial-gradient(circle at 50% 34%, #f2c09a 0 34px, transparent 35px), radial-gradient(circle at 78% 34%, #f2c09a 0 30px, transparent 31px), linear-gradient(135deg, #b80000 0%, #240000 48%, #070707 100%)',
            boxShadow: 'inset 0 0 0 3px #14110c',
          }}
        >
          {['11.3x', '19.4x', '12.4x'].map((tag, idx) => (
            <span
              key={tag}
              style={{
                position: 'absolute',
                left: 10 + idx * 86,
                top: 10,
                padding: '3px 8px 2px',
                borderRadius: 8,
                border: '2px solid #14110c',
                background: '#f8f5ee',
                color: '#14110c',
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
          {[24, 111, 202].map((left, idx) => (
            <span
              key={left}
              style={{
                position: 'absolute',
                left,
                bottom: 34,
                width: 58,
                height: 76,
                borderRadius: '44% 44% 38% 38%',
                background: '#f2c09a',
                border: '3px solid #14110c',
                boxShadow: '0 20px 0 #14110c',
                transform: `rotate(${idx === 1 ? 0 : idx === 0 ? -4 : 4}deg)`,
              }}
            >
              <span style={{ position: 'absolute', left: 11, top: 26, width: 36, height: 10, border: '2px solid #14110c', borderRadius: 999, background: '#f8f5ee' }} />
              <span style={{ position: 'absolute', left: 21, top: 47, width: 18, height: 9, borderBottom: '3px solid #14110c', borderRadius: '0 0 999px 999px' }} />
            </span>
          ))}
          <span
            style={{
              position: 'absolute',
              left: 12,
              bottom: 8,
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
                  background: logo === 'NVIDIA' ? '#76ff03' : '#f8f5ee',
                  border: '2px solid #14110c',
                  color: '#14110c',
                  fontFamily: mono,
                  fontSize: '0.72rem',
                  fontWeight: 900,
                }}
              >
                {logo}
              </span>
            ))}
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
            height: 178,
            overflow: 'hidden',
            borderRadius: 14,
            background:
              'linear-gradient(90deg, rgba(8,16,18,0.92), rgba(8,16,18,0.1)), repeating-linear-gradient(90deg, #161616 0 18px, #252525 19px 24px), #0a0a0a',
            boxShadow: 'inset 0 0 0 3px #14110c',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              color: '#f8f5ee',
              fontSize: '2.35rem',
              fontWeight: 950,
              letterSpacing: '-0.08em',
              lineHeight: 0.9,
              textShadow: '3px 3px 0 #14110c',
            }}
          >
            800V
            <br />
            IS HERE
          </span>
          {[0, 1, 2, 3, 4].map((idx) => (
            <span
              key={idx}
              style={{
                position: 'absolute',
                right: 22 + idx * 24,
                bottom: 22,
                width: 14,
                height: 98 + idx * 8,
                borderRadius: 5,
                background: idx % 2 === 0 ? '#1f1f1f' : '#333',
                border: '2px solid rgba(248,245,238,0.65)',
              }}
            />
          ))}
          <span
            style={{
              position: 'absolute',
              right: 28,
              top: 28,
              width: 78,
              height: 78,
              borderRight: '5px solid #76ff03',
              borderBottom: '5px solid #76ff03',
              borderRadius: '0 0 50% 0',
              transform: 'rotate(8deg)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 28,
              bottom: 28,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: '#f8f5ee',
              boxShadow: '0 0 0 4px #76ff03',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 16,
              bottom: 15,
              padding: '4px 9px',
              borderRadius: 8,
              background: '#f8f5ee',
              color: '#14110c',
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
