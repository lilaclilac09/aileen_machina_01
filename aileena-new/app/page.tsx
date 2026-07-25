'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';
import GlassBench from '../components/GlassBench';
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
const dragMeCursor =
  'url("data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20width=\'104\'%20height=\'34\'%20viewBox=\'0%200%20104%2034\'%3E%3Ctext%20x=\'4\'%20y=\'23\'%20font-family=\'Georgia%2Cserif\'%20font-size=\'20\'%20font-style=\'italic\'%20fill=\'%2314110c\'%3Edrag%20me%3C/text%3E%3C/svg%3E") 8 18, grab';
const dragThreshold = 3;

type DragOffset = {
  x: number;
  y: number;
};

type DragState = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type RoomDoor = {
  id: string;
  index: string;
  label: string;
  href: string;
  category: string;
  blurb: string;
  signal: string;
  motif: 'article' | 'hbm' | 'pcb' | 'trendy' | 'record' | 'investing';
  placement: CSSProperties;
  note?: string;
};

type HubItem = { title: string; meta: string; href?: string };

type HubShelfData = {
  id: string;
  title: string;
  lead?: string;
  featured: HubItem;
  items: HubItem[];
  clipping?: { src: string; alt: string; href: string; caption?: string };
};

const HOME_PODCASTS: HubShelfData = {
  id: 'hub-podcast',
  title: 'Listen',
  lead: 'Voice in the room',
  featured: {
    title: 'Fashion Neurosis',
    meta: 'Bella Freud · Kate Moss',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
  },
  items: [
    { title: 'Do You Read Her', meta: 'women / reading / voice', href: 'https://open.spotify.com/episode/0cx1oBoJEwfaKGVbITcD5K' },
  ],
};

const HOME_CHANNELS: HubShelfData = {
  id: 'hub-channels',
  title: 'Channels',
  lead: 'Ongoing reads',
  featured: {
    title: 'SemiAnalysis',
    meta: 'semis / AI infrastructure',
    href: 'https://www.semianalysis.com',
  },
  items: [
    { title: 'Asymmetrical Bets', meta: 'markets / narratives', href: 'https://asymmetricalbets.substack.com' },
    { title: 'Tools', meta: 'small utilities · quiet door', href: '/tools' },
  ],
};

/** Watch: films only — Didion lives on Read (one home for her). */
const HOME_WATCH: HubShelfData = {
  id: 'hub-film',
  title: 'Watch',
  lead: 'Screen queue',
  featured: {
    title: 'Blue Is the Warmest Color',
    meta: 'Léa · intimacy',
    href: '/blog/watch-listening-shelf#films',
  },
  items: [
    { title: 'The French Dispatch', meta: 'magazine life · Léa', href: '/blog/watch-listening-shelf#films' },
    { title: 'The Crown / Bodyguard', meta: 'British public life', href: '/blog/watch-listening-shelf#films' },
    { title: 'David Hockney RA', meta: '2017 · exhibition film', href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen' },
  ],
};

/** Read: Didion clipping is the visual lead; Metal & Pages is #01. */
const HOME_BOOKS: HubShelfData = {
  id: 'hub-books',
  title: 'Read',
  lead: 'Pages in rotation',
  featured: {
    title: 'Metal & Pages',
    meta: 'biweekly bookclub',
    href: '/updates',
  },
  items: [
    {
      title: 'Living notes',
      meta: '欧洲生活 · 生活方式',
      href: '/blog/watch-listening-shelf#euro-life',
    },
  ],
  clipping: {
    src: '/dispatch-covers/books-joan-didion-readings.jpg',
    alt: 'Readings from Joan Didion — notebook',
    href: '/updates',
    caption: 'Didion notebook → Metal & Pages',
  },
};

const HOME_SHELVES: HubShelfData[] = [HOME_WATCH, HOME_PODCASTS, HOME_BOOKS, HOME_CHANNELS];

/* ── Homepage ─────────────────────────────────────────────────────────
 *
 * A cinematic opening, then one clickable clipping desk. Information is
 * intentionally minimal: the homepage's job is to set the mood, not to
 * contain the content.
 *
 *   Section 01  Cinematic opening   — scene + one line + one CTA
 *   Section 02  Clipping desk       — article scraps + direct doors
 *   Section 03  Watch hub           — DJ sets, podcasts, documentaries, channels
 *   Section 04  Visual              — kiln / glass bench (handmade work)
 *
 * The Machina mark on the cinematic opening doubles as the door to the
 * agent department.
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
  const latestIssueHref = latestIssue?.longFormHref ?? (latestIssue ? `/blog/${latestIssue.slug}` : '/dispatch');
  const latestDispatch = tx.blog.researchDispatch.posts.slice(-1)[0];
  const metooArticle = tx.blog.womanInTech.posts.find((post) => post.href === '/blog/harassment') ?? tx.blog.womanInTech.posts[0];
  const featuredInvesting = tx.blog.investing.posts.find((post) => post.href === '/blog/nvidia-flywheel') ?? tx.blog.investing.posts[0];
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
      placement: { top: '6%', right: '4%', transform: 'rotate(-2.8deg)', zIndex: 6 },
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
      placement: { top: '44%', right: '5%', transform: 'rotate(2.2deg)', zIndex: 5 },
    },
    {
      id: 'woman-tech',
      index: '03',
      label: 'Woman in Tech',
      href: '/blog/harassment',
      category: 'Woman in Tech',
      blurb: metooArticle ? metooArticle.body : 'Long-form essays and the back catalogue.',
      signal: metooArticle ? metooArticle.title : 'Every Woman in Tech Has a #MeToo Story',
      motif: 'article',
      placement: { top: '5%', left: '3%', transform: 'rotate(-1.2deg)', zIndex: 14 },
    },
    {
      id: 'woman-investing',
      index: '04',
      label: 'Woman Investing',
      href: '/dispatch#investing',
      category: tx.blog.investing.tag,
      blurb: featuredInvesting ? featuredInvesting.body : 'A woman should have her own portfolio.',
      signal: featuredInvesting ? featuredInvesting.title : tx.blog.investing.heading,
      motif: 'investing',
      placement: { top: '58%', left: '4%', transform: 'rotate(1.6deg)', zIndex: 12 },
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
        <SnapSection id="opening" className="order-1" variant="stage">
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
                      gap: 16,
                      minHeight: 76,
                      background: 'rgba(255,253,247,0.82)',
                      color: palette.ink,
                      padding: '11px 16px 11px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,169,159,0.26)',
                      boxShadow:
                        '0 20px 48px -34px rgba(20,17,12,0.52), 0 0 0 1px rgba(255,255,255,0.74) inset',
                      cursor: 'pointer',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                    }}
                    aria-label={tx.hero.talkAgent}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        width: 56,
                        height: 56,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        backgroundImage: "url('/bg_pic/03.jpeg')",
                        backgroundPosition: '22% 8%',
                        backgroundSize: '180%',
                        boxShadow: `0 0 0 1px ${palette.cyan}, 0 10px 24px -18px rgba(20,17,12,0.9)`,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          right: -3,
                          top: 1,
                          width: 15,
                          height: 15,
                          borderRadius: '50%',
                          background: palette.cyan,
                          boxShadow: '0 0 0 4px rgba(255,253,247,0.96), 0 0 14px rgba(0,169,159,0.62)',
                        }}
                      />
                    </span>
                    <span style={{ display: 'grid', gap: 5, minWidth: 0, paddingRight: 6 }}>
                      <span
                        style={{
                          color: palette.cyan,
                          fontFamily: mono,
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          letterSpacing: '0.44em',
                          lineHeight: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        Machina
                      </span>
                      <span
                        style={{
                          color: 'rgba(20,17,12,0.56)',
                          fontFamily: 'Georgia, serif',
                          fontSize: '0.82rem',
                          fontStyle: 'italic',
                          lineHeight: 1.15,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ask the agent
                      </span>
                    </span>
                    <span
                      aria-hidden
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 38,
                        height: 38,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        background: 'rgba(20,17,12,0.08)',
                        color: palette.ink,
                        fontFamily: mono,
                        fontSize: '1.05rem',
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
        <SnapSection id="dock" className="order-2" variant="stage">
          <AtriumLinkDock rooms={rooms} />
        </SnapSection>

        {/* ── 03 WATCH / LISTEN HUB ─────────────────────────────── */}
        <SnapSection id="watch-hub" className="order-3" variant="flow">
          <HomeWatchHub />
        </SnapSection>

        {/* ── 04 VISUAL — kiln / glass (homepage only, not /sound) ─ */}
        <SnapSection id="visual" className="order-4" variant="flow">
          <div style={{ fontFamily: nunito }}>
            <GlassBench
              tag={tx.visual.kilnTag}
              title={tx.visual.heading}
              body={tx.visual.kilnNote}
              linkLabel={tx.visual.readGlass}
              items={tx.visual.items}
            />
          </div>
        </SnapSection>

      </SnapContainer>
    </>
  );
}

function HomeWatchHub() {
  return (
    <section
      className="min-h-full px-5 sm:px-9 lg:px-14"
      style={{
        background: '#ffffff',
        color: palette.ink,
        fontFamily: nunito,
      }}
      aria-label="Watch and listen hub"
    >
      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 pb-28 pt-[96px] sm:gap-12 sm:pb-24 lg:gap-16 lg:pb-32 lg:pt-[104px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_auto] lg:items-end">
          <div style={{ maxWidth: 640 }}>
            <p
              style={{
                color: palette.cyan,
                fontFamily: nunito,
                fontSize: '0.62rem',
                fontWeight: 850,
                letterSpacing: '0.28em',
                marginBottom: 20,
                textTransform: 'uppercase',
              }}
            >
              Watch / Listen
            </p>
            <h2
              style={{
                color: palette.ink,
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: 'clamp(2.35rem, 5.2vw, 3.9rem)',
                fontWeight: 500,
                fontStyle: 'italic',
                letterSpacing: '-0.03em',
                lineHeight: 0.98,
                marginBottom: 18,
              }}
            >
              One shelf. DJ first.
            </h2>
            <p
              style={{
                color: 'rgba(10,10,10,0.58)',
                fontFamily: nunito,
                fontSize: '1.02rem',
                fontWeight: 500,
                lineHeight: 1.65,
                maxWidth: 480,
              }}
            >
              Documentaries, podcasts, and books stay on the index.
              The DJ set gets the black door — not another card in the list.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 18,
              alignContent: 'flex-end',
              paddingBottom: 6,
              borderBottom: '1px dashed rgba(10,10,10,0.16)',
            }}
          >
            {[
              { label: 'DJ set', href: '/sound', featured: true },
              { label: 'Film', href: '#hub-film' },
              { label: 'Podcast', href: '#hub-podcast' },
              { label: 'Books', href: '#hub-books' },
            ].map((tag) => (
              <a
                key={tag.label}
                href={tag.href}
                style={{
                  border: 0,
                  background: 'transparent',
                  borderRadius: 0,
                  color: tag.featured ? palette.cyan : 'rgba(10,10,10,0.45)',
                  fontFamily: nunito,
                  fontSize: '0.58rem',
                  fontWeight: 850,
                  letterSpacing: '0.16em',
                  padding: '4px 0',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>

        {/* DJ SET — Cereal: object on paper, more blank around */}
        <Link
          href="/sound"
          id="hub-dj"
          style={{
            display: 'block',
            marginTop: 12,
            marginBottom: 8,
            borderRadius: 2,
            overflow: 'hidden',
            textDecoration: 'none',
            background: '#0b0d10',
            color: '#fffdf8',
            boxShadow: 'none',
            border: '1px solid rgba(26,24,20,0.08)',
          }}
        >
          <div
            className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]"
            style={{ minHeight: 'clamp(200px, 28vh, 280px)' }}
          >
            <div
              style={{
                padding: 'clamp(26px, 3.6vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <div>
                <p
                  style={{
                    color: '#00a89d',
                    fontFamily: mono,
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    letterSpacing: '0.28em',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  Featured · DJ set
                </p>
                <h3
                  style={{
                    fontSize: 'clamp(1.7rem, 3.4vw, 2.7rem)',
                    fontWeight: 620,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.02,
                    marginBottom: 12,
                    color: '#fffdf8',
                  }}
                >
                  Two decks. Full library. Black room.
                </h3>
                <p
                  style={{
                    color: 'rgba(255,253,248,0.55)',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.98rem',
                    lineHeight: 1.55,
                    maxWidth: 420,
                  }}
                >
                  Handoff tracks plus the rest of the set — open the station, not a playlist card.
                </p>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#00a89d',
                  fontFamily: mono,
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                Enter /sound <span aria-hidden>→</span>
              </span>
            </div>
            <div
              aria-hidden
              style={{
                position: 'relative',
                minHeight: 160,
                background:
                  'radial-gradient(ellipse at 70% 40%, rgba(0,168,157,0.22) 0%, transparent 55%), linear-gradient(145deg, #12161b 0%, #0b0d10 60%)',
                borderLeft: '1px solid rgba(255,253,248,0.06)',
                display: 'grid',
                placeItems: 'center',
                padding: 28,
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: '50%',
                      border: '1px solid rgba(0,168,157,0.45)',
                      background:
                        'repeating-radial-gradient(circle at center, transparent 0 7px, rgba(255,253,248,0.06) 7px 8px)',
                      boxShadow: i === 0 ? '0 0 24px rgba(0,168,157,0.25)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* Index listing — numbered rows, not equal cards */}
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-20">
          {HOME_SHELVES.map((shelf) => (
            <HubIndex key={shelf.id} shelf={shelf} />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            paddingTop: 28,
            marginTop: 8,
            borderTop: '1px dashed rgba(20,17,12,0.12)',
          }}
        >
          <Link
            href="/blog/watch-listening-shelf"
            style={{
              color: 'rgba(20,17,12,0.45)',
              fontFamily: mono,
              fontSize: '0.58rem',
              fontWeight: 850,
              letterSpacing: '0.18em',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Full shelf article →
          </Link>
        </div>
      </div>
    </section>
  );
}

function HubIndex({ shelf }: { shelf: HubShelfData }) {
  const rows: HubItem[] = [shelf.featured, ...shelf.items];

  return (
    <section id={shelf.id} aria-labelledby={`${shelf.id}-title`}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 22,
          paddingBottom: 14,
          borderBottom: '1px solid rgba(20,17,12,0.12)',
        }}
      >
        <div>
          <h3
            id={`${shelf.id}-title`}
            style={{
              margin: 0,
              color: palette.ink,
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: '1.35rem',
              fontWeight: 500,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
            }}
          >
            {shelf.title}
          </h3>
          {shelf.lead ? (
            <p
              style={{
                margin: '6px 0 0',
                color: 'rgba(10,10,10,0.42)',
                fontFamily: nunito,
                fontSize: '0.82rem',
                fontWeight: 500,
                fontStyle: 'normal',
              }}
            >
              {shelf.lead}
            </p>
          ) : null}
        </div>
        <span
          style={{
            color: palette.cyan,
            fontFamily: mono,
            fontSize: '0.52rem',
            fontWeight: 850,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {String(rows.length).padStart(2, '0')} entries
        </span>
      </header>

      {shelf.clipping ? (
        <Link
          href={shelf.clipping.href}
          aria-label={shelf.clipping.alt}
          style={{
            display: 'block',
            marginBottom: 28,
            textDecoration: 'none',
            lineHeight: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shelf.clipping.src}
            alt={shelf.clipping.alt}
            style={{
              display: 'block',
              width: '100%',
              maxHeight: 148,
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
          {shelf.clipping.caption ? (
            <span
              style={{
                display: 'block',
                paddingTop: 8,
                color: 'rgba(20,17,12,0.4)',
                fontFamily: mono,
                fontSize: '0.5rem',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {shelf.clipping.caption}
            </span>
          ) : null}
        </Link>
      ) : null}

      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {rows.map((item, index) => {
          const isLead = index === 0;
          const n = String(index + 1).padStart(2, '0');
          return (
            <li key={`${shelf.id}-${item.title}`}>
              <Link
                href={item.href ?? '/blog/watch-listening-shelf'}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.4rem minmax(0, 1fr) auto',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: isLead ? '18px 0 20px' : '16px 0',
                  borderBottom: '1px dashed rgba(20,17,12,0.12)',
                  textDecoration: 'none',
                  color: palette.ink,
                }}
              >
                <span
                  style={{
                    color: isLead ? palette.cyan : 'rgba(20,17,12,0.32)',
                    fontFamily: mono,
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    letterSpacing: '0.08em',
                  }}
                >
                  {n}
                </span>
                <span
                  style={{
                    minWidth: 0,
                    fontSize: isLead ? '1.12rem' : '0.95rem',
                    fontWeight: isLead ? 740 : 580,
                    letterSpacing: isLead ? '-0.025em' : '-0.01em',
                    lineHeight: 1.25,
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    color: 'rgba(20,17,12,0.4)',
                    fontFamily: mono,
                    fontSize: '0.5rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textAlign: 'right',
                    textTransform: 'uppercase',
                    maxWidth: '12rem',
                    lineHeight: 1.35,
                  }}
                >
                  {item.meta}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AtriumLinkDock({ rooms }: { rooms: RoomDoor[] }) {
  const [dragOffsets, setDragOffsets] = useState<Record<string, DragOffset>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [raisedId, setRaisedId] = useState<string | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragOffsetsRef = useRef<Record<string, DragOffset>>({});
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const baseTransformRef = useRef<Record<string, string>>({});
  const rafRef = useRef<number | null>(null);
  const velocityRef = useRef({ x: 0, y: 0, t: 0 });
  // Quiet footer only — tools/sound have dedicated doors elsewhere.
  const socialLinks = [
    { label: 'github', href: 'https://github.com/lilaclilac09' },
    { label: 'substack', href: '/dispatch' },
    { label: 'gather', href: 'https://album.aileena.xyz' },
  ];
  const getDragOffset = (id: string) => dragOffsets[id] ?? { x: 0, y: 0 };
  const baseFor = (id: string) => {
    if (id === 'woman-cover-print') return 'rotate(2.8deg)';
    if (id === 'machina-polaroid') return 'rotate(3.6deg)';
    if (id === 'didion-scrap') return 'rotate(-3.4deg)';
    return String(rooms.find((room) => room.id === id)?.placement.transform ?? '');
  };
  const applyNodeTransform = (id: string, baseTransform: string, scale = 1) => {
    const node = nodeRefs.current[id];
    if (!node) return;
    const offset = dragOffsetsRef.current[id] ?? { x: 0, y: 0 };
    const translate = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
    const scaled = scale === 1 ? '' : ` scale(${scale})`;
    node.style.transform = baseTransform
      ? `${translate} ${baseTransform}${scaled}`
      : `${translate}${scaled}`;
    node.style.transition = 'none';
  };
  const dragTransform = (id: string, baseTransform: string) => {
    const offset = getDragOffset(id);
    const translate = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
    return baseTransform ? `${translate} ${baseTransform}` : translate;
  };
  const beginDrag = (id: string, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const offset = dragOffsetsRef.current[id] ?? dragOffsets[id] ?? { x: 0, y: 0 };
    const base = baseFor(id);
    baseTransformRef.current[id] = base;
    const next: DragState = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
    dragStateRef.current = next;
    velocityRef.current = { x: 0, y: 0, t: event.timeStamp };
    setActiveDragId(id);
    setRaisedId(id);
    nodeRefs.current[id] = event.currentTarget;
    event.currentTarget.style.transition = 'none';
    event.currentTarget.style.willChange = 'transform';
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const updateDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const moved = drag.moved || Math.hypot(dx, dy) > dragThreshold;
    if (!moved) return;
    event.preventDefault();
    if (!drag.moved) dragStateRef.current = { ...drag, moved: true };

    const now = event.timeStamp;
    const dt = Math.max(8, now - (velocityRef.current.t || now));
    const nextOffset = {
      x: drag.originX + dx,
      y: drag.originY + dy,
    };
    const prev = dragOffsetsRef.current[drag.id] ?? nextOffset;
    velocityRef.current = {
      x: ((nextOffset.x - prev.x) / dt) * 16,
      y: ((nextOffset.y - prev.y) / dt) * 16,
      t: now,
    };
    dragOffsetsRef.current = {
      ...dragOffsetsRef.current,
      [drag.id]: nextOffset,
    };
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const live = dragStateRef.current;
      if (!live) return;
      applyNodeTransform(live.id, baseTransformRef.current[live.id] ?? baseFor(live.id), 1.035);
    });
  };
  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > dragThreshold;
    const target = event.currentTarget;
    if (moved) target.dataset.dragged = 'true';
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Soft coast — tiny inertia so release feels silkier than a hard stop.
    const coast = dragOffsetsRef.current[drag.id] ?? { x: 0, y: 0 };
    const vx = Math.max(-18, Math.min(18, velocityRef.current.x));
    const vy = Math.max(-18, Math.min(18, velocityRef.current.y));
    const settled = {
      x: coast.x + vx * 4,
      y: coast.y + vy * 4,
    };
    dragOffsetsRef.current = { ...dragOffsetsRef.current, [drag.id]: settled };
    const base = baseTransformRef.current[drag.id] ?? baseFor(drag.id);
    target.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
    target.style.transform = `translate3d(${settled.x}px, ${settled.y}px, 0) ${base}`;

    setDragOffsets({ ...dragOffsetsRef.current });
    dragStateRef.current = null;
    setActiveDragId(null);
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      delete target.dataset.dragged;
      target.style.willChange = 'auto';
    }, 0);
  };
  const cancelDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragStateRef.current = null;
    setActiveDragId(null);
    event.currentTarget.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    event.currentTarget.style.willChange = 'auto';
  };
  const blockNativeDrag = (event: ReactDragEvent<HTMLElement>) => {
    event.preventDefault();
  };
  const suppressDragClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.currentTarget.dataset.dragged !== 'true') return;
    event.preventDefault();
    event.stopPropagation();
  };
  const dragHandlers = (id: string) => ({
    draggable: false,
    onClickCapture: suppressDragClick,
    onDragStart: blockNativeDrag,
    onPointerCancel: cancelDrag,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => beginDrag(id, event),
    onPointerMove: updateDrag,
    onPointerUp: endDrag,
  });

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
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 72% 18%, rgba(232,180,184,0.10), transparent 58%), radial-gradient(ellipse 55% 45% at 12% 78%, rgba(0,169,159,0.06), transparent 55%)',
          }}
        >
          <div className="h-full overflow-y-auto px-3 pb-24 pt-8 sm:hidden">
            <div className="grid gap-14">
              {rooms.map((room) => {
                const isArticle = room.motif === 'article';
                const isRecord = room.motif === 'record';
                const mobileRoomStyle: CSSProperties = {
                  display: 'block',
                  width: '100%',
                  minHeight: isArticle ? 380 : isRecord ? 240 : 200,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: palette.ink,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  boxShadow: 'none',
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

              <Link
                href="/dispatch#woman-in-tech"
                aria-label="Open Woman in Tech archive — cover print"
                className="text-left"
                style={{
                  display: 'block',
                  width: '100%',
                  minHeight: 220,
                  marginTop: 8,
                  padding: 0,
                  border: 'none',
                  outline: 'none',
                  backgroundImage: "url('/dispatch-covers/harassment.jpg')",
                  backgroundPosition: '48% 42%',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  boxShadow: 'none',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    padding: '4px 8px',
                    background: 'rgba(20,17,12,0.72)',
                    color: '#fffdf8',
                    fontFamily: mono,
                    fontSize: '0.52rem',
                    fontWeight: 850,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  woman in tech archive →
                </span>
              </Link>

              <button
                type="button"
                aria-label="Open Aileena console — machina polaroid"
                className="text-left"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 'min(52%, 168px)',
                  margin: '28px auto 24px',
                  padding: 0,
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transform: 'rotate(3deg)',
                }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-agent-chat'))}
              >
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '3 / 4',
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    backgroundImage: "url('/bg_pic/03.jpeg')",
                    backgroundPosition: '36% 14%',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: 'none',
                  }}
                />
                <span
                  style={{
                    marginTop: 8,
                    color: 'rgba(20,17,12,0.55)',
                    fontFamily: mono,
                    fontSize: '0.5rem',
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  ask · machina
                </span>
              </button>

            </div>
          </div>

          {rooms.map((room) => {
            const baseTransform = String(room.placement.transform ?? '');
            const isActiveDrag = activeDragId === room.id;
            const isRaised = isActiveDrag || raisedId === room.id;
            const isArticle = room.motif === 'article';
            const isTrendy = room.motif === 'trendy';
            const isInvesting = room.motif === 'investing';
            const isRecord = room.motif === 'record';
            const isPaper = isTrendy;
            const desktopRoomStyle: CSSProperties = {
              ...room.placement,
              position: 'absolute',
              width: isArticle
                ? 'min(70vw, 400px)'
                : isInvesting
                  ? 'min(58vw, 300px)'
                  : isTrendy
                    ? 'min(70vw, 430px)'
                    : isRecord
                      ? 'min(56vw, 290px)'
                      : 'min(52vw, 300px)',
              minHeight: isArticle
                ? 'clamp(400px, 52dvh, 480px)'
                : isInvesting
                  ? 280
                  : isTrendy
                    ? 'clamp(340px, 44dvh, 390px)'
                    : isRecord
                      ? 300
                      : 280,
              height: isTrendy ? 'clamp(340px, 44dvh, 390px)' : undefined,
              padding: 0,
              border: isPaper ? '1px solid rgba(20,17,12,0.16)' : 'none',
              background: isPaper ? palette.paper : 'transparent',
              color: palette.ink,
              cursor: isActiveDrag ? 'grabbing' : dragMeCursor,
              textDecoration: 'none',
              boxShadow: isPaper ? '0 24px 70px -42px rgba(20,17,12,0.5)' : 'none',
              transform: dragTransform(room.id, baseTransform),
              transition: isActiveDrag ? 'none' : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
              userSelect: 'none',
              willChange: isActiveDrag ? 'transform' : 'auto',
              zIndex: isRaised ? 40 : Number(room.placement.zIndex ?? 1),
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
                {...dragHandlers(room.id)}
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
                {...dragHandlers(room.id)}
              >
                <ObjectFace room={room} />
              </Link>
            );
          })}

          {/* Photo scraps — separate lanes, fuller crops, no white frames. */}
          <Link
            href="/dispatch#woman-in-tech"
            aria-label="Open Woman in Tech archive — cover print"
            className="absolute z-[8] hidden sm:block"
            style={{
              top: '8%',
              left: 'clamp(430px, 42vw, 520px)',
              width: 'min(24vw, 210px)',
              height: 'clamp(280px, 38dvh, 340px)',
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              backgroundImage: "url('/dispatch-covers/harassment.jpg')",
              backgroundPosition: '48% 38%',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent',
              boxShadow: '0 28px 60px -48px rgba(20,17,12,0.55)',
              filter: 'contrast(1.06) saturate(0.92)',
              cursor: activeDragId === 'woman-cover-print' ? 'grabbing' : dragMeCursor,
              transform: dragTransform('woman-cover-print', 'rotate(2.8deg)'),
              transition:
                activeDragId === 'woman-cover-print'
                  ? 'none'
                  : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
              userSelect: 'none',
              willChange: activeDragId === 'woman-cover-print' ? 'transform' : 'auto',
              zIndex: activeDragId === 'woman-cover-print' || raisedId === 'woman-cover-print' ? 41 : 8,
              textDecoration: 'none',
              overflow: 'hidden',
            }}
            {...dragHandlers('woman-cover-print')}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(20,17,12,0.08) 0%, transparent 28%, transparent 62%, rgba(20,17,12,0.55) 100%)',
                pointerEvents: 'none',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                color: 'rgba(255,253,248,0.88)',
                fontFamily: 'Georgia, serif',
                fontSize: '0.95rem',
                fontStyle: 'italic',
                textShadow: '0 1px 10px rgba(0,0,0,0.55)',
                pointerEvents: 'none',
              }}
            >
              drag me
            </span>
            <span
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 14,
                color: '#fffdf8',
                fontFamily: nunito,
                fontSize: '0.92rem',
                fontWeight: 750,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                textShadow: '0 2px 14px rgba(0,0,0,0.55)',
              }}
            >
              Woman in Tech
              <span
                style={{
                  display: 'block',
                  marginTop: 4,
                  fontFamily: mono,
                  fontSize: '0.5rem',
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  opacity: 0.82,
                }}
              >
                archive →
              </span>
            </span>
          </Link>

          <Link
            href="/updates"
            aria-label="Open Metal & Pages — Didion readings"
            className="absolute z-[9] hidden lg:block"
            style={{
              top: '42%',
              left: 'clamp(420px, 40vw, 500px)',
              width: 'min(20vw, 168px)',
              height: 'clamp(200px, 26dvh, 236px)',
              padding: 0,
              margin: 0,
              border: 'none',
              outline: 'none',
              backgroundImage: "url('/dispatch-covers/books-joan-didion-readings.jpg')",
              backgroundPosition: '50% 18%',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              boxShadow: '0 24px 50px -44px rgba(20,17,12,0.5)',
              filter: 'saturate(0.88) contrast(1.05)',
              cursor: activeDragId === 'didion-scrap' ? 'grabbing' : dragMeCursor,
              transform: dragTransform('didion-scrap', 'rotate(-3.4deg)'),
              transition:
                activeDragId === 'didion-scrap'
                  ? 'none'
                  : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
              userSelect: 'none',
              willChange: activeDragId === 'didion-scrap' ? 'transform' : 'auto',
              zIndex: activeDragId === 'didion-scrap' || raisedId === 'didion-scrap' ? 41 : 9,
              textDecoration: 'none',
              overflow: 'hidden',
            }}
            {...dragHandlers('didion-scrap')}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 45%, rgba(20,17,12,0.62) 100%)',
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 10,
                right: 10,
                bottom: 12,
                color: '#fffdf8',
                fontFamily: "'Allura', cursive",
                fontSize: '1.35rem',
                lineHeight: 1,
                textShadow: '0 2px 12px rgba(0,0,0,0.45)',
              }}
            >
              Metal & Pages
            </span>
          </Link>

          <button
            type="button"
            aria-label="Open Aileena console — machina portrait"
            className="absolute z-[16] hidden sm:block"
            style={{
              top: '58%',
              left: 'clamp(560px, 56vw, 680px)',
              width: 'clamp(148px, 14.5vw, 186px)',
              padding: 0,
              margin: 0,
              border: 0,
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              cursor: activeDragId === 'machina-polaroid' ? 'grabbing' : dragMeCursor,
              transform: dragTransform('machina-polaroid', 'rotate(3.6deg)'),
              transition:
                activeDragId === 'machina-polaroid'
                  ? 'none'
                  : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
              userSelect: 'none',
              willChange: activeDragId === 'machina-polaroid' ? 'transform' : 'auto',
              zIndex: activeDragId === 'machina-polaroid' || raisedId === 'machina-polaroid' ? 41 : 16,
            }}
            {...dragHandlers('machina-polaroid')}
            onClick={(event) => {
              if (event.currentTarget.dataset.dragged === 'true') return;
              window.dispatchEvent(new CustomEvent('open-agent-chat'));
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '3 / 4',
                margin: 0,
                padding: 0,
                border: 'none',
                outline: 'none',
                backgroundImage: "url('/bg_pic/03.jpeg')",
                backgroundPosition: '34% 10%',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                boxShadow: '0 26px 54px -42px rgba(20,17,12,0.55)',
                filter: 'saturate(0.94) contrast(1.04)',
                overflow: 'hidden',
              }}
            />
            <span
              aria-hidden
              style={{
                display: 'block',
                marginTop: 8,
                color: 'rgba(20,17,12,0.58)',
                fontFamily: 'Georgia, serif',
                fontSize: '0.92rem',
                fontStyle: 'italic',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              drag me
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 2,
                color: palette.cyan,
                fontFamily: mono,
                fontSize: '0.5rem',
                fontWeight: 850,
                letterSpacing: '0.18em',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              ask · machina
            </span>
          </button>
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
  boxShadow: 'none',
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
          minHeight: 'clamp(400px, 52dvh, 480px)',
          padding: '18px 0 34px',
        }}
      >
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'block',
            width: 'min(70vw, 380px)',
            minHeight: 'clamp(380px, 50dvh, 450px)',
            padding: 'clamp(34px, 5dvh, 46px) clamp(24px, 4.8vw, 40px) clamp(28px, 4.2dvh, 38px)',
            background:
              'linear-gradient(165deg, #ffffff 0%, #fffdf8 55%, #f7f1e8 100%)',
            boxShadow: '0 28px 70px -46px rgba(20,17,12,0.48)',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 'clamp(18px, 3.2dvh, 26px)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'block',
                width: 28,
                height: 1,
                background: palette.oxblood,
                opacity: 0.55,
              }}
            />
            <span
              style={{
                color: palette.oxblood,
                fontFamily: mono,
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Viewpoint
            </span>
            <span
              aria-hidden
              style={{
                display: 'block',
                width: 28,
                height: 1,
                background: palette.oxblood,
                opacity: 0.55,
              }}
            />
          </span>
          <span
            style={{
              display: 'block',
              color: palette.ink,
              fontFamily: nunito,
              fontSize: 'clamp(1.85rem, 3.4vw, 2.95rem)',
              fontWeight: 850,
              letterSpacing: '-0.048em',
              lineHeight: 1.02,
              margin: '0 auto clamp(20px, 3.6dvh, 28px)',
              maxWidth: 340,
              textAlign: 'center',
            }}
          >
            {room.signal}
          </span>
          <span
            aria-hidden
            style={{
              display: 'block',
              width: 42,
              height: 2,
              margin: '0 auto 18px',
              background: palette.softPink,
              opacity: 0.7,
            }}
          />
          <span
            style={{
              color: 'rgba(20,17,12,0.72)',
              fontFamily: 'Georgia, serif',
              fontSize: '1.05rem',
              lineHeight: 1.5,
              margin: '0 auto',
              maxWidth: 320,
              overflow: 'hidden',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 5,
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
            left: 16,
            top: 2,
            zIndex: 3,
            color: 'rgba(20,17,12,0.62)',
            fontFamily: 'Georgia, serif',
            fontSize: '1.05rem',
            fontStyle: 'italic',
          }}
        >
          drag me
        </span>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 14,
            bottom: 6,
            zIndex: 2,
            color: palette.softPink,
            fontFamily: "'Allura', cursive",
            fontSize: '1.28rem',
            lineHeight: 1,
            transform: 'rotate(-2deg)',
          }}
        >
          no more whisper network
        </span>
      </span>
    );
  }

  if (room.motif === 'investing') {
    return (
      <span
        style={{
          position: 'relative',
          display: 'block',
          width: 'min(58vw, 300px)',
          minHeight: 280,
          overflow: 'hidden',
          backgroundImage:
            "linear-gradient(180deg, rgba(13,17,16,0.18) 0%, rgba(13,17,16,0.2) 35%, rgba(13,17,16,0.82) 100%), url('/dispatch-covers/investing-hero.jpg')",
          backgroundPosition: 'center 30%',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 26px 58px -44px rgba(20,17,12,0.55)',
        }}
      >
        <span
          style={{
            display: 'block',
            padding: '22px 20px 24px',
            minHeight: 280,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: palette.chipGreen,
              color: palette.ink,
              fontFamily: mono,
              fontSize: '0.52rem',
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            {room.category}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: 88,
              color: '#fffdf8',
              fontFamily: nunito,
              fontSize: 'clamp(1.35rem, 2.4vw, 1.7rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
              textShadow: '0 2px 16px rgba(0,0,0,0.45)',
            }}
          >
            {room.signal}
          </span>
          <span
            style={{
              marginTop: 10,
              color: 'rgba(255,253,248,0.78)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.92rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {room.blurb}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: 16,
              color: 'rgba(255,253,248,0.55)',
              fontFamily: mono,
              fontSize: '0.5rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            investing archive →
          </span>
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
          height: 'clamp(340px, 44dvh, 390px)',
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
            height: 220,
            overflow: 'hidden',
            borderRadius: 0,
            backgroundImage:
              "linear-gradient(180deg, rgba(10,13,12,0.08), rgba(10,13,12,0.7)), url('/dispatch-covers/investing-hero.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: 'saturate(0.9) contrast(1.05)',
            boxShadow: '0 22px 48px -40px rgba(20,17,12,0.5)',
          }}
        >
          {['11.3x', '19.4x', '12.4x'].map((tag, idx) => (
            <span
              key={tag}
              style={{
                position: 'absolute',
                left: 14 + idx * 86,
                top: 14,
                padding: '3px 8px 2px',
                borderRadius: 0,
                border: `2px solid ${palette.ink}`,
                background: palette.cream,
                color: palette.ink,
                fontFamily: mono,
                fontSize: '1.02rem',
                fontWeight: 950,
                letterSpacing: '-0.06em',
              }}
            >
              {tag}
            </span>
          ))}
          <span
            style={{
              position: 'absolute',
              left: 14,
              bottom: 14,
              display: 'flex',
              gap: 8,
            }}
          >
            {['HPE', 'NVIDIA', 'ASIC'].map((logo) => (
              <span
                key={logo}
                style={{
                  padding: '3px 8px',
                  borderRadius: 0,
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
              right: 14,
              bottom: 14,
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
            height: 220,
            overflow: 'hidden',
            borderRadius: 0,
            backgroundImage:
              "linear-gradient(90deg, rgba(8,16,18,0.88), rgba(8,16,18,0.2)), url('/projects/keyshield.png')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: 'saturate(0.9) contrast(1.08)',
            boxShadow: '0 22px 48px -40px rgba(20,17,12,0.5)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: 16,
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
              right: 28,
              top: 32,
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
              right: 28,
              bottom: 28,
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
              left: 16,
              bottom: 16,
              padding: '4px 9px',
              borderRadius: 0,
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
