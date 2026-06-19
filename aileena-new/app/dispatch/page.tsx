'use client';

import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

type Post = { date: string; href: string; title: string; body: string };

/**
 * /dispatch — three sequential rails on one scrollable page.
 *
 *   1. Research Dispatch  (technical / on-chain)
 *   2. Investing          (market thesis)
 *   3. Perspective        (Woman-in-Tech essays)
 *
 * No tabs, no save state, no checkboxes — just three substack-style
 * lists stacked vertically, the way the homepage rails render but
 * full-archive instead of top-3. Page scrolls naturally; each section
 * is a clear block the visitor scrolls through.
 */
export default function DispatchArchive() {
  const { language } = useLanguage();
  const tx = t[language];

  const dispatch = [...tx.blog.researchDispatch.posts].reverse();
  const investing = [...tx.blog.investing.posts].reverse();
  const perspective = [...tx.blog.womanInTech.posts].reverse();

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
          posts={dispatch}
        />
        <RailSection
          tag={tx.blog.investing.tag}
          heading={tx.blog.investing.heading}
          posts={investing}
          firstSection={false}
        />
        <RailSection
          tag={tx.blog.womanInTech.tag}
          heading={tx.blog.womanInTech.heading}
          posts={perspective}
          firstSection={false}
        />
      </main>
    </div>
  );
}

function RailSection({
  tag,
  heading,
  posts,
  firstSection = true,
}: {
  tag: string;
  heading: string;
  posts: readonly Post[];
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
      <div className="substack-list">
        {posts.map((post) => (
          <Link key={post.href} href={post.href}>
            <p className="sl-date">{post.date}</p>
            <h3 className="sl-title">{post.title}</h3>
            <p className="sl-body">{post.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
