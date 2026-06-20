'use client';

import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

type Post = { date: string; href: string; title: string; body: string };

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
  dispatch: ['On-chain infrastructure', 'MEV & markets', 'Agents & robotics', 'Privacy'],
  investing: ['AI hardware', 'Capital flywheels', 'Sales & channels'],
  perspective: [],   // 3 essays — themes would be theatre
  marsAndMoon: [],   // free-form personal entries
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
  // "Other" — articles not yet mapped to a topic. Always at the end.
  const otherItems = byTopic.get('Other');
  if (otherItems && otherItems.length > 0) out.push({ topic: 'Other', posts: otherItems });
  return out;
}

/**
 * /dispatch — four sequential rails on one scrollable page.
 *
 *   1. Research Dispatch  (subdivided by topic)
 *   2. Investing          (subdivided by topic)
 *   3. Perspective        (flat — three essays)
 *   4. Mars and Moon Magic (flat — placeholder, edit translations.ts)
 *
 * No tabs, no save state, no checkboxes — just lists stacked vertically.
 * Topic subheaders are small uppercase tracked labels separating groups,
 * same typography as the rail tag.
 */
export default function DispatchArchive() {
  const { language } = useLanguage();
  const tx = t[language];

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
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 120px' }}>
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
          groups={groupByTopic([...tx.blog.womanInTech.posts].reverse(), 'perspective')}
        />
        <RailSection
          tag={tx.blog.marsAndMoon.tag}
          heading={tx.blog.marsAndMoon.heading}
          groups={groupByTopic([...tx.blog.marsAndMoon.posts].reverse(), 'marsAndMoon')}
        />
      </main>
    </div>
  );
}

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
      {groups.map((g, i) => (
        <div key={g.topic ?? `g-${i}`} style={{ marginTop: i > 0 ? 44 : 0 }}>
          {g.topic && (
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
              {g.topic}
            </p>
          )}
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
