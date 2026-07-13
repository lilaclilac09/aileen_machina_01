'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';
import SwipeRow, { type Post } from '../../components/SwipeRow';
import CoverflowPanel from '../../components/CoverflowPanel';
import {
  useCoverflowSettings,
  type CoverflowSettings,
} from '../../lib/useCoverflowSettings';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

// Slug → topic. Articles inside Dispatch + Investing get grouped under
// these small subheaders. Articles not listed here fall under "Other"
// and render at the end of the section.
const SLUG_TOPIC: Record<string, string> = {
  // ── Research Dispatch ─────────────────────────────────────
  wire: 'On-chain infrastructure',
  rpc: 'On-chain infrastructure',
  'shred-economy': 'On-chain infrastructure',
  'validator-clients': 'On-chain infrastructure',
  doublezero: 'On-chain infrastructure',
  'reading-solana': 'On-chain infrastructure',
  'instant-inference': 'On-chain infrastructure',

  clob: 'MEV & markets',
  'cex-dex-arb': 'MEV & markets',
  'cex-dex-dashboard': 'MEV & markets',
  'prop-amm-dict': 'MEV & markets',
  'humidifi-decoded': 'MEV & markets',

  robots: 'Agents & robotics',
  centaur: 'Agents & robotics',
  cli: 'Agents & robotics',

  'zcash-fpga': 'Privacy',
  'zec-arbitrage': 'Privacy',

  'huawei-hbm': 'AI infrastructure',
  'huawei-supply': 'AI infrastructure',

  // ── Investing ─────────────────────────────────────────────
  'ai-pcb': 'AI hardware',
  broadcom: 'AI hardware',
  marvell: 'AI hardware',
  cpo: 'AI hardware',
  'ai-cooling': 'AI hardware',
  'ai-hardware-scarcity': 'AI hardware',
  'let-there-be-light': 'AI hardware',
  'nokia-dci': 'AI hardware',

  'nvidia-flywheel': 'Capital flywheels',
  'dell-nvidia-flywheel': 'Capital flywheels',

  'tech-sales': 'Sales & channels',
};

const TOPIC_ORDER: Record<string, string[]> = {
  dispatch: ['AI infrastructure', 'On-chain infrastructure', 'MEV & markets', 'Agents & robotics', 'Privacy'],
  investing: ['AI hardware', 'Capital flywheels', 'Sales & channels'],
  perspective: [],
  marsAndMoon: [],
};

function slugOf(post: Post): string {
  return post.href.replace(/^\/blog\//, '');
}

function groupByTopic(
  posts: readonly Post[],
  railKey: keyof typeof TOPIC_ORDER,
): { topic: string | null; posts: Post[] }[] {
  const order = TOPIC_ORDER[railKey];
  if (order.length === 0) return [{ topic: null, posts: [...posts] }];

  const byTopic = new Map<string, Post[]>();
  for (const post of posts) {
    const topic = SLUG_TOPIC[slugOf(post)] ?? 'Other';
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(post);
  }

  const out: { topic: string | null; posts: Post[] }[] = [];
  for (const t of order) {
    const items = byTopic.get(t);
    if (items && items.length > 0) out.push({ topic: t, posts: items });
  }
  const otherItems = byTopic.get('Other');
  if (otherItems && otherItems.length > 0) out.push({ topic: 'Other', posts: otherItems });
  return out;
}

type DispatchView = 'image' | 'text';
type DispatchTab = 'dispatch' | 'investing' | 'perspective' | 'watch';
const VIEW_STORAGE_KEY = 'aileena-dispatch-view';
const TAB_STORAGE_KEY = 'aileena-dispatch-tab';

const TAB_HASH: Record<DispatchTab, string> = {
  dispatch: 'dispatch',
  investing: 'investing',
  perspective: 'woman-in-tech',
  watch: 'watch-listen',
};

function tabFromHash(hash: string): DispatchTab | null {
  const clean = hash.replace(/^#/, '');
  const found = (Object.entries(TAB_HASH) as [DispatchTab, string][])
    .find(([, value]) => value === clean);
  return found?.[0] ?? null;
}

/**
 * /dispatch — four rails. Default renders as horizontal swipeable
 * cover-card carousels (image view); a sticky-header toggle flips
 * every rail back to the substack-list (text view). Choice persists
 * in localStorage.
 */
export default function DispatchArchive() {
  const { language } = useLanguage();
  const tx = t[language];

  const [view, setView] = useState<DispatchView>('image');
  const [activeTab, setActiveTab] = useState<DispatchTab>('dispatch');
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
        if (saved === 'image' || saved === 'text') setView(saved);
        const tab = tabFromHash(window.location.hash);
        if (tab) {
          setActiveTab(tab);
          return;
        }
        const savedTab = window.localStorage.getItem(TAB_STORAGE_KEY);
        if (
          savedTab === 'dispatch' ||
          savedTab === 'investing' ||
          savedTab === 'perspective' ||
          savedTab === 'watch'
        ) {
          setActiveTab(savedTab);
        }
      } catch {
        /* localStorage blocked — keep default */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  const updateView = useCallback((next: DispatchView) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* localStorage blocked — choice stays in-memory only */
    }
  }, []);
  const updateTab = useCallback((next: DispatchTab) => {
    setActiveTab(next);
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, next);
      window.history.replaceState(null, '', `#${TAB_HASH[next]}`);
    } catch {
      /* hash/localStorage unavailable — tab stays in-memory only */
    }
  }, []);

  const isImage = view === 'image';
  const coverflow = useCoverflowSettings();
  const watchIssue = tx.blog.marsAndMoon.posts[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#111',
        fontFamily: nunito,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      <header
        className="dispatch-archive-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '18px 24px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(17,17,17,0.08)',
          opacity: 0.96,
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <SectionTabs active={activeTab} setActive={updateTab} />
          <div
            className="dispatch-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginLeft: 'auto',
            }}
          >
            {activeTab !== 'watch' ? (
              <ViewToggle view={view} setView={updateView} />
            ) : null}
            <span
              style={{
                fontFamily: nunito,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                color: '#111',
                opacity: 0.35,
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Archive
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '56px 24px 120px' }}>
        {/* The category tabs keep recommendation shelves from becoming
            another buried rail. Image/Text still controls article rails. */}
        {activeTab === 'watch' ? (
          <WatchListenTab post={watchIssue} />
        ) : isImage ? (
          activeTab === 'dispatch' ? (
            <SwipeRail
              tag={tx.blog.researchDispatch.tag}
              heading={tx.blog.researchDispatch.heading}
              groups={groupByTopic([...tx.blog.researchDispatch.posts].reverse(), 'dispatch')}
              firstSection
              settings={coverflow.settings}
            />
          ) : activeTab === 'investing' ? (
            <SwipeRail
              tag={tx.blog.investing.tag}
              heading={tx.blog.investing.heading}
              groups={groupByTopic([...tx.blog.investing.posts].reverse(), 'investing')}
              heroImage="/dispatch-covers/investing-hero.jpg"
              firstSection
              settings={coverflow.settings}
            />
          ) : (
            <SwipeRail
              tag={tx.blog.womanInTech.tag}
              heading={tx.blog.womanInTech.heading}
              // Authored order, NOT reverse-chrono — Aileen wants the #MeToo
              // piece first, regardless of date. translations.ts already
              // lists the essays in the intended display order.
              groups={groupByTopic([...tx.blog.womanInTech.posts], 'perspective')}
              firstSection
              settings={coverflow.settings}
            />
          )
        ) : activeTab === 'dispatch' ? (
          <RailSection
            tag={tx.blog.researchDispatch.tag}
            heading={tx.blog.researchDispatch.heading}
            groups={groupByTopic([...tx.blog.researchDispatch.posts].reverse(), 'dispatch')}
            firstSection
          />
        ) : activeTab === 'investing' ? (
          <RailSection
            tag={tx.blog.investing.tag}
            heading={tx.blog.investing.heading}
            groups={groupByTopic([...tx.blog.investing.posts].reverse(), 'investing')}
            firstSection
          />
        ) : (
          <RailSection
            tag={tx.blog.womanInTech.tag}
            heading={tx.blog.womanInTech.heading}
            groups={groupByTopic([...tx.blog.womanInTech.posts], 'perspective')}
            firstSection
          />
        )}
      </main>
      {activeTab !== 'watch' ? (
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
      ) : null}
    </div>
  );
}

function SectionTabs({
  active,
  setActive,
}: {
  active: DispatchTab;
  setActive: (next: DispatchTab) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const activeButton = listRef.current?.querySelector('[aria-selected="true"]');
    activeButton?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);

  const tabs: { id: DispatchTab; label: string }[] = [
    { id: 'dispatch', label: 'Dispatch' },
    { id: 'investing', label: 'Investing' },
    { id: 'perspective', label: 'Woman in Tech' },
    { id: 'watch', label: 'Watch' },
  ];

  return (
    <nav
      className="dispatch-section-tabs"
      aria-label="Archive tabs"
      style={{
        display: 'inline-flex',
        flex: '1 1 460px',
        justifyContent: 'center',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div
        ref={listRef}
        role="tablist"
        style={{
          display: 'inline-flex',
          maxWidth: '100%',
          gap: 2,
          padding: 3,
          borderRadius: 999,
          border: '1px solid rgba(17,17,17,0.12)',
          background: '#fff',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              style={{
                appearance: 'none',
                border: 0,
                borderRadius: 999,
                background: selected ? '#111' : 'transparent',
                color: selected ? '#fff' : 'rgba(17,17,17,0.58)',
                cursor: 'pointer',
                flex: '0 0 auto',
                fontFamily:
                  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.13em',
                lineHeight: 1,
                padding: '8px 12px',
                textTransform: 'uppercase',
                transition: 'background 0.18s ease, color 0.18s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function WatchListenTab({ post }: { post?: Post }) {
  const href = post?.href ?? '/blog/watch-listening-shelf';
  const title = post?.title ?? 'The Listening and Watching Shelf';
  const body = post?.body ??
    'Podcast episodes, films, documentaries, and research channels that sit beside the essays.';

  const shelfDoors = [
    { tag: 'podcasts', href: '/blog/watch-listening-shelf#podcasts' },
    { tag: 'films', href: '/blog/watch-listening-shelf#films' },
    { tag: 'documentaries', href: '/blog/watch-listening-shelf#films' },
    { tag: 'living', href: '/blog/watch-listening-shelf#euro-life' },
    { tag: 'substacks', href: '/blog/watch-listening-shelf#channels' },
  ] as const;

  const filmLine = [
    { title: 'Blue Is the Warmest Color', image: '/shelf/blue-is-the-warmest-color.jpg' },
    { title: 'The French Dispatch', image: '/shelf/french-dispatch.jpg' },
    { title: 'Spectre / No Time to Die', image: '/shelf/spectre.jpg' },
    { title: 'The Crown', image: '/shelf/the-crown.jpg' },
    { title: 'The Capture', image: '/shelf/the-capture.jpg' },
    { title: 'Bodyguard', image: '/shelf/bodyguard.jpg' },
  ];

  return (
    <section>
      <p
        style={{
          fontFamily:
            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: '#008f84',
          margin: '0 0 14px',
          textTransform: 'uppercase',
        }}
      >
        Watch / Listen
      </p>
      <h1
        style={{
          color: '#111',
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 560,
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
          margin: '0 0 34px',
        }}
      >
        One shelf for podcasts, films, and documentaries.
      </h1>

      <div
        style={{
          position: 'relative',
          display: 'grid',
          gap: 22,
          minHeight: 430,
          padding: 'clamp(28px, 5vw, 48px)',
          border: 0,
          borderRadius: 0,
          background:
            "linear-gradient(180deg, rgba(8,8,8,0.18) 0%, rgba(8,8,8,0.72) 100%), url('/dispatch-covers/fashion-simon-encouragement.jpg') center/cover no-repeat #0a0a0a",
          color: '#fff',
          boxShadow: 'none',
          overflow: 'hidden',
        }}
      >
        <Link
          href={href}
          aria-label={`Open ${title}`}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        />
        <span
          style={{
            alignSelf: 'end',
            display: 'grid',
            gap: 18,
            maxWidth: 680,
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.62)',
              fontFamily:
                "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
            }}
          >
            fashion · standalone issue
          </span>
          <span
            style={{
              display: 'block',
              color: '#fff',
              fontSize: 'clamp(2.4rem, 8vw, 5.4rem)',
              fontWeight: 520,
              letterSpacing: '0',
              lineHeight: 0.88,
              fontFamily: "'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive",
              textShadow: '0 2px 24px rgba(0,0,0,0.45)',
            }}
          >
            Trendy is obsolete.
          </span>
          <span
            style={{
              display: 'block',
              color: 'rgba(255,255,255,0.78)',
              fontFamily: "'Iowan Old Style', 'Charter', 'Georgia', serif",
              fontSize: '1.12rem',
              lineHeight: 1.58,
              maxWidth: 620,
            }}
          >
            {body}
          </span>
          <span
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 9,
              pointerEvents: 'auto',
            }}
          >
            {shelfDoors.map(({ tag, href: doorHref }) => (
              <Link
                key={tag}
                href={doorHref}
                style={{
                  border: '1px solid rgba(255,255,255,0.28)',
                  borderRadius: 999,
                  color: 'rgba(255,255,255,0.72)',
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  padding: '7px 11px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  background: 'rgba(0,0,0,0.18)',
                }}
              >
                {tag}
              </Link>
            ))}
          </span>
          <Link
            href={href}
            style={{
              color: '#63f3d8',
              fontFamily:
                "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: '0.68rem',
              fontWeight: 850,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              pointerEvents: 'auto',
              width: 'fit-content',
            }}
          >
            Open {title} →
          </Link>
        </span>
      </div>

      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gap: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#008f84',
            fontFamily:
              "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: '0.58rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          On this shelf · films
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 14,
          }}
        >
          {filmLine.map((film) => (
            <Link
              key={film.title}
              href="/blog/watch-listening-shelf#films"
              aria-label={film.title}
              style={{
                display: 'block',
                border: 0,
                borderRadius: 0,
                padding: 0,
                background: 'transparent',
                textDecoration: 'none',
                lineHeight: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={film.image}
                alt={film.title}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '0.74',
                  objectFit: 'cover',
                  border: 0,
                  borderRadius: 0,
                  boxShadow: 'none',
                }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ViewToggle({
  view,
  setView,
}: {
  view: DispatchView;
  setView: (next: DispatchView) => void;
}) {
  const options: { id: DispatchView; label: string }[] = [
    { id: 'image', label: 'Image' },
    { id: 'text', label: 'Text' },
  ];
  return (
    <div
      role="group"
      aria-label="Dispatch view"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        borderRadius: 999,
        border: '1px solid rgba(17,17,17,0.12)',
        background: '#fff',
      }}
    >
      {options.map((opt) => {
        const active = view === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => setView(opt.id)}
            style={{
              appearance: 'none',
              border: 0,
              padding: '5px 12px',
              borderRadius: 999,
              fontFamily:
                "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 500,
              cursor: 'pointer',
              color: active ? '#fff' : 'rgba(17,17,17,0.58)',
              background: active ? '#008f84' : 'transparent',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Rail headings (shared by both renderers) ──────────────── */

function RailHeader({ tag, heading }: { tag: string; heading: string }) {
  return (
    <>
      <p
        style={{
          fontFamily: nunito,
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          color: '#111',
          opacity: 0.4,
          textTransform: 'uppercase',
          fontWeight: 500,
          marginBottom: 14,
        }}
      >
        {tag}
      </p>
      <h2
        style={{
          fontSize: 'clamp(1.7rem, 4.4vw, 2.6rem)',
          fontWeight: 500,
          letterSpacing: '-0.005em',
          color: '#111',
          marginBottom: 36,
          lineHeight: 1.15,
        }}
      >
        {heading}
      </h2>
    </>
  );
}

function TopicHeader({ topic }: { topic: string }) {
  return (
    <p
      style={{
        fontFamily: nunito,
        fontSize: '0.68rem',
        letterSpacing: '0.22em',
        color: '#111',
        opacity: 0.55,
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 16,
      }}
    >
      {topic}
    </p>
  );
}

/* Magazine-style banner that replaces the plain RailHeader when a rail
   has its own cover. Used on Investing — Aileen's "Heavens, a diamond!"
   film still. Image fills a 3:2 frame, tag + heading lie over a soft
   bottom gradient so they stay legible regardless of cover contrast. */
function RailHero({ tag, heading, src }: { tag: string; heading: string; src: string }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 2',
        maxHeight: 'min(64vw, 460px)',
        borderRadius: 2,
        overflow: 'hidden',
        background: `url('${src}') center/cover no-repeat #0a0a0a`,
        marginBottom: 36,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.72) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(20px, 4vw, 36px)',
          left: 'clamp(18px, 3.5vw, 32px)',
          right: 'clamp(18px, 3.5vw, 32px)',
          color: '#fff',
        }}
      >
        <p
          style={{
            fontFamily: nunito,
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            opacity: 0.78,
            textTransform: 'uppercase',
            fontWeight: 500,
            marginBottom: 10,
            textShadow: '0 1px 12px rgba(0,0,0,0.7)',
          }}
        >
          {tag}
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
            fontWeight: 500,
            letterSpacing: '-0.005em',
            lineHeight: 1.15,
            margin: 0,
            color: '#fff',
            textShadow: '0 2px 22px rgba(0,0,0,0.85)',
          }}
        >
          {heading}
        </h2>
      </div>
    </div>
  );
}

/* ─── Swipeable cover-card rail (Research Dispatch) ─────────── */

function SwipeRail({
  tag,
  heading,
  groups,
  firstSection = false,
  heroImage,
  settings,
}: {
  tag: string;
  heading: string;
  groups: { topic: string | null; posts: Post[] }[];
  firstSection?: boolean;
  heroImage?: string;
  settings: CoverflowSettings;
}) {
  return (
    <section style={{ marginTop: firstSection ? 0 : 88 }}>
      {heroImage ? (
        <RailHero tag={tag} heading={heading} src={heroImage} />
      ) : (
        <RailHeader tag={tag} heading={heading} />
      )}
      {groups.map((g, i) => (
        <div key={g.topic ?? `g-${i}`} style={{ marginTop: i > 0 ? 44 : 0 }}>
          {g.topic && <TopicHeader topic={g.topic} />}
          <SwipeRow posts={g.posts} settings={settings} />
        </div>
      ))}
    </section>
  );
}

/* ─── Substack-list rail (Investing / Perspective / Mars and Moon) ── */

function RailSection({
  tag,
  heading,
  groups,
  firstSection = false,
}: {
  tag: string;
  heading: string;
  groups: { topic: string | null; posts: Post[] }[];
  firstSection?: boolean;
}) {
  return (
    <section style={{ marginTop: firstSection ? 0 : 88 }}>
      <RailHeader tag={tag} heading={heading} />
      {groups.map((g, i) => (
        <div key={g.topic ?? `g-${i}`} style={{ marginTop: i > 0 ? 44 : 0 }}>
          {g.topic && <TopicHeader topic={g.topic} />}
          <div className="substack-list">
            {g.posts.map((post) => (
              <Link key={`${post.href}-${post.date}`} href={post.href}>
                <p className="sl-date">{post.date}</p>
                <h3 className="sl-title">{post.title}</h3>
                <p className="sl-body">{post.body}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
