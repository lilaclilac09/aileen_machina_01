'use client';
/*
 * Shared design tokens for the light "Substack essay" blog style.
 * House style for NEW posts — see CLAUDE.md → "Blog Post Style (Substack essay)".
 * Reference page: app/blog/instant-inference/page.tsx
 */
import React from 'react';

/* ── Colors ── */
export const c = {
  ink: '#1a1815',
  body: '#2b2926',
  muted: '#6b6660',
  faint: '#9a948c',
  accent: '#0a7d76',
  rule: '#e7e2d8',
};

const serif = "'Iowan Old Style', 'Charter', Georgia, Cambria, 'Times New Roman', serif";
const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";

/* ── Style objects ── */
export const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#fdfcf9',
    color: c.body,
    fontFamily: serif,
    overflowY: 'auto',
    WebkitFontSmoothing: 'antialiased',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    maxWidth: 720,
    margin: '0 auto',
  },
  topLink: {
    fontFamily: sans,
    fontSize: '0.8rem',
    letterSpacing: '0.04em',
    color: c.muted,
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  siteName: {
    fontFamily: sans,
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    color: c.faint,
    textTransform: 'uppercase',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '32px 24px 120px',
  },
  kicker: {
    fontFamily: sans,
    fontSize: '0.72rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: c.muted,
    margin: '24px 0 18px',
  },
  h1: {
    fontFamily: serif,
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
    lineHeight: 1.12,
    letterSpacing: '-0.01em',
    color: c.ink,
    margin: '0 0 20px',
  },
  dek: {
    fontFamily: serif,
    fontSize: 'clamp(1.15rem, 2.6vw, 1.4rem)',
    fontStyle: 'italic',
    lineHeight: 1.5,
    color: c.muted,
    margin: '0 0 8px',
  },
  rule: {
    border: 'none',
    borderTop: `1px solid ${c.rule}`,
    margin: '32px 0',
  },
  lead: {
    fontFamily: serif,
    fontSize: 'clamp(1.18rem, 2.4vw, 1.36rem)',
    lineHeight: 1.7,
    color: c.ink,
    margin: '0 0 24px',
  },
  body: {
    fontFamily: serif,
    fontSize: 'clamp(1.08rem, 2.2vw, 1.26rem)',
    lineHeight: 1.78,
    color: c.body,
    margin: '0 0 24px',
  },
  h2: {
    fontFamily: serif,
    fontSize: 'clamp(1.45rem, 3.2vw, 1.85rem)',
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    color: c.ink,
    margin: '2.2em 0 0.55em',
  },
  strong: {
    color: c.ink,
    fontWeight: 700,
  },
  link: {
    color: c.accent,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    textDecorationColor: 'rgba(10,125,118,0.35)',
  },
  code: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: '0.86em',
    background: '#f1eee6',
    padding: '1px 6px',
    borderRadius: 3,
    color: '#3a352e',
  },
  list: {
    margin: '0 0 24px',
    paddingLeft: 26,
  },
  li: {
    fontFamily: serif,
    fontSize: 'clamp(1.08rem, 2.2vw, 1.26rem)',
    lineHeight: 1.7,
    color: c.body,
    marginBottom: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: sans,
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    borderBottom: `2px solid ${c.rule}`,
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: c.muted,
    fontWeight: 600,
  },
  td: {
    padding: '11px 14px',
    borderBottom: '1px solid #efeae0',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    color: c.body,
    verticalAlign: 'top',
  },
  tdLabel: {
    padding: '11px 14px',
    borderBottom: '1px solid #efeae0',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    color: c.ink,
    fontWeight: 600,
    verticalAlign: 'top',
  },
  blockquote: {
    margin: '1.6em 0',
    padding: '4px 0 4px 26px',
    borderLeft: `3px solid ${c.accent}`,
    fontFamily: serif,
    fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
    fontStyle: 'italic',
    fontWeight: 500,
    lineHeight: 1.4,
    color: c.ink,
  },
  aside: {
    margin: '2em 0',
    padding: '20px 24px',
    background: '#f5f2ea',
    borderLeft: `3px solid ${c.accent}`,
    borderRadius: 2,
  },
  asideLabel: {
    fontFamily: sans,
    fontSize: '0.68rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: c.muted,
    fontWeight: 600,
    margin: '0 0 12px',
  },
  refList: {
    margin: '8px 0 0',
    paddingLeft: 22,
  },
  refItem: {
    fontFamily: sans,
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: c.muted,
    marginBottom: 7,
  },
  refLink: {
    color: c.muted,
    textDecoration: 'none',
    transition: 'color 0.2s',
    borderBottom: `1px solid ${c.rule}`,
  },
  note: {
    fontFamily: sans,
    fontSize: '0.85rem',
    lineHeight: 1.65,
    color: c.faint,
    fontStyle: 'italic',
    margin: '28px 0 0',
  },
};

/* ── Centered serif pull-quote with optional attribution ── */
export function PullQuote({ children, attribution }: { children: React.ReactNode; attribution?: string }) {
  return (
    <figure style={{ margin: '2em 0', padding: 0 }}>
      <blockquote style={{
        margin: 0,
        padding: 0,
        fontFamily: serif,
        fontSize: 'clamp(1.4rem, 3.2vw, 1.95rem)',
        fontWeight: 500,
        lineHeight: 1.35,
        letterSpacing: '-0.01em',
        color: c.ink,
        textAlign: 'center',
      }}>
        &ldquo;{children}&rdquo;
      </blockquote>
      {attribution && (
        <figcaption style={{
          fontFamily: sans,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: c.muted,
          textAlign: 'center',
          marginTop: 16,
        }}>
          — {attribution}
        </figcaption>
      )}
    </figure>
  );
}

/* ── Light aside box for caveats / non-obvious notes ── */
export function Aside({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <aside style={s.aside}>
      <p style={s.asideLabel}>{label}</p>
      <div style={{ ...s.body, margin: 0 }}>{children}</div>
    </aside>
  );
}

/* ── Sources list ── */
export function Sources({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ol style={s.refList}>
      {items.map((ref, i) => (
        <li key={i} style={s.refItem}>
          <a
            href={ref.href}
            target={ref.href.startsWith('http') ? '_blank' : undefined}
            rel={ref.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            style={s.refLink}
            onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = c.muted)}
          >
            {ref.label}
          </a>
        </li>
      ))}
    </ol>
  );
}
