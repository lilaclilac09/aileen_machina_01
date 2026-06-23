'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';
import SwipeRow, { type Post, getCover } from '../../components/SwipeRow';
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
const VIEW_STORAGE_KEY = 'aileena-dispatch-view';

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
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === 'image' || saved === 'text') setView(saved);
    } catch {
      /* localStorage blocked — keep default */
    }
  }, []);
  const updateView = useCallback((next: DispatchView) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* localStorage blocked — choice stays in-memory only */
    }
  }, []);

  const isImage = view === 'image';
  const coverflow = useCoverflowSettings();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: nunito,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '18px 24px',
          background: 'var(--bg-primary)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
          opacity: 0.96,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: nunito,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              opacity: 0.6,
              textDecoration: 'none',
            }}
          >
            ← Home
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <ViewToggle view={view} setView={updateView} />
            <span
              style={{
                fontFamily: nunito,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                color: 'var(--text-primary)',
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
        {/* Two rendering modes per rail: SwipeRail (cover-card carousel,
            default) and RailSection (substack list). The toggle in the
            sticky header switches all four rails at once. */}
        {isImage ? (
          <>
            <SwipeRail
              tag={tx.blog.researchDispatch.tag}
              heading={tx.blog.researchDispatch.heading}
              groups={groupByTopic([...tx.blog.researchDispatch.posts].reverse(), 'dispatch')}
              firstSection
              settings={coverflow.settings}
            />
            <SwipeRail
              tag={tx.blog.investing.tag}
              heading={tx.blog.investing.heading}
              groups={groupByTopic([...tx.blog.investing.posts].reverse(), 'investing')}
              heroImage="/dispatch-covers/investing-hero.jpg"
              settings={coverflow.settings}
            />
            <SwipeRail
              tag={tx.blog.womanInTech.tag}
              heading={tx.blog.womanInTech.heading}
              // Authored order, NOT reverse-chrono — Aileen wants the #MeToo
              // piece first, regardless of date. translations.ts already
              // lists the essays in the intended display order.
              groups={groupByTopic([...tx.blog.womanInTech.posts], 'perspective')}
              settings={coverflow.settings}
            />
            <SwipeRail
              tag={tx.blog.marsAndMoon.tag}
              heading={tx.blog.marsAndMoon.heading}
              groups={groupByTopic([...tx.blog.marsAndMoon.posts].reverse(), 'marsAndMoon')}
              settings={coverflow.settings}
            />
          </>
        ) : (
          <>
            <RailSection
              tag={tx.blog.researchDispatch.tag}
              heading={tx.blog.researchDispatch.heading}
              groups={groupByTopic([...tx.blog.researchDispatch.posts].reverse(), 'dispatch')}
              firstSection
            />
            <RailSection
              tag={tx.blog.investing.tag}
              heading={tx.blog.investing.heading}
              groups={groupByTopic([...tx.blog.investing.posts].reverse(), 'investing')}
            />
            <RailSection
              tag={tx.blog.womanInTech.tag}
              heading={tx.blog.womanInTech.heading}
              groups={groupByTopic([...tx.blog.womanInTech.posts], 'perspective')}
            />
            <RailSection
              tag={tx.blog.marsAndMoon.tag}
              heading={tx.blog.marsAndMoon.heading}
              groups={groupByTopic([...tx.blog.marsAndMoon.posts].reverse(), 'marsAndMoon')}
            />
          </>
        )}
      </main>
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
    </div>
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
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.04)',
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
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
              background: active ? '#7df9ff' : 'transparent',
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
          color: 'var(--text-primary)',
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
          color: 'var(--text-primary)',
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
        color: 'var(--text-primary)',
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
