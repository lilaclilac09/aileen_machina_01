'use client';

import Link from 'next/link';
import ScrollUnlock from '../blog/ScrollUnlock';
import { ALL_ISSUES } from '../../lib/research/issues';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/**
 * /research — the cover wall.
 *
 * Per Aileen's spec: "几张大封面，代表不同投研主题" — a newsstand of
 * issues, each a large cover that tells you (1) what scene the issue
 * opens on, (2) what core question it answers, and (3) which way the
 * editor has called it. The wall is the entry point to the interactive
 * magazine-rack format; opening a cover navigates into /research/<slug>.
 *
 * Three racks per Aileen's frame:
 *   1. Display rack — this page
 *   2. Category rack — /research/<slug> column nav
 *   3. Judgment rack — /research/<slug> verdict column
 */
export default function ResearchCoverWall() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070707',
        color: '#fff',
        fontFamily: nunito,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      {/* Sticky top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 24px',
          background: 'rgba(7,7,7,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
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
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
            }}
          >
            ← Home
          </Link>
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              color: '#ffa726',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Aileena Research · Cover wall
          </span>
          <Link
            href="/dispatch"
            style={{
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Long-form archive ↗
          </Link>
        </div>
      </header>

      {/* Newsstand header */}
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '88px 24px 40px',
        }}
      >
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.62rem',
            letterSpacing: '0.4em',
            color: '#ffa726',
            textTransform: 'uppercase',
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          The newsstand
        </p>
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.04,
            marginBottom: 24,
            maxWidth: 920,
          }}
        >
          An interactive judgment rack, one issue at a time
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 720,
          }}
        >
          Each issue opens on a scene and a single core question, runs through seven editorial
          columns, and resolves into one editor&rsquo;s verdict with stance, confidence, reasons,
          biggest counter, and what to watch next. Long-form essays live in the{' '}
          <Link href="/dispatch" style={{ color: '#00ffea', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,234,0.4)' }}>
            archive
          </Link>
          .
        </p>
      </section>

      {/* Cover grid */}
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '24px 24px 120px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 28,
        }}
      >
        {ALL_ISSUES.map((issue) => {
          const stancePalette: Record<typeof issue.verdict.stance, { fg: string; label: string; bg: string; border: string }> = {
            bullish: { bg: 'rgba(61,240,166,0.10)', border: 'rgba(61,240,166,0.4)', fg: '#3df0a6', label: 'Bullish' },
            bearish: { bg: 'rgba(255,108,108,0.10)', border: 'rgba(255,108,108,0.4)', fg: '#ff6c6c', label: 'Bearish' },
            wait: { bg: 'rgba(255,167,38,0.10)', border: 'rgba(255,167,38,0.4)', fg: '#ffa726', label: 'Wait & watch' },
          };
          const sp = stancePalette[issue.verdict.stance];
          return (
            <Link
              key={issue.slug}
              href={`/research/${issue.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: '#fff',
                background:
                  "linear-gradient(180deg, rgba(7,7,7,0.4) 0%, rgba(7,7,7,0.85) 65%, #070707 100%), url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80') center/cover no-repeat",
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                overflow: 'hidden',
                aspectRatio: '3 / 4',
                position: 'relative',
                transition: 'border-color 0.18s ease, transform 0.18s ease',
              }}
              className="research-cover-tile"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: '24px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top — issue number + stance badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: '0.58rem',
                      letterSpacing: '0.32em',
                      color: '#ffa726',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {issue.issueNumber}
                  </span>
                  <span
                    style={{
                      background: sp.bg,
                      border: `1px solid ${sp.border}`,
                      color: sp.fg,
                      fontFamily: mono,
                      fontSize: '0.55rem',
                      letterSpacing: '0.22em',
                      padding: '3px 9px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {sp.label}
                  </span>
                </div>

                {/* Middle — title + core question */}
                <div>
                  <h2
                    style={{
                      fontSize: 'clamp(1.7rem, 3vw, 2.2rem)',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.05,
                      marginBottom: 14,
                    }}
                  >
                    {issue.coverTitle}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                      color: 'rgba(255,255,255,0.78)',
                      borderLeft: '2px solid #ffa726',
                      paddingLeft: 12,
                      fontWeight: 500,
                    }}
                  >
                    {issue.coverQuestion}
                  </p>
                </div>

                {/* Bottom — open CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: '0.55rem',
                      letterSpacing: '0.22em',
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {issue.columns.length} columns · {issue.columns.reduce((n, c) => n + c.cards.length, 0)} cards
                  </span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: '0.62rem',
                      letterSpacing: '0.18em',
                      color: '#ffa726',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Open issue →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Placeholder for future issues — keeps the wall feeling like a real newsstand */}
        <div
          style={{
            border: '1px dashed rgba(255,255,255,0.12)',
            borderRadius: 6,
            aspectRatio: '3 / 4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: mono,
            fontSize: '0.65rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            padding: 24,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Next issue
          <br />
          on the press
        </div>
      </section>
    </div>
  );
}
