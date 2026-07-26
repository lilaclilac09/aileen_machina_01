import Link from 'next/link';
import type { CSSProperties } from 'react';

/**
 * Visual / photo wall — Cereal archive theory:
 * soft paper field, left-aligned narrow column, one image per beat,
 * large vertical blank, caption below (not overlay), no mats / dual fill.
 */
export default function GlassBench({
  tag,
  title,
  body,
  linkLabel,
  items,
}: {
  tag: string;
  title: string;
  body: string;
  linkLabel: string;
  items: Array<{ src: string; alt: string; caption: string; href?: string }>;
}) {
  return (
    <section
      id="glass-bench"
      className="glass-bench"
      style={sectionStyle}
      aria-label="Glass work"
    >
      <style>{`
        .glass-bench-col {
          width: min(100%, 420px);
        }
        .glass-bench-shot {
          display: block;
          color: inherit;
          text-decoration: none;
        }
        .glass-bench-shot img {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          object-position: center;
          background: #e8e2d8;
        }
        @media (min-width: 900px) {
          .glass-bench-col {
            width: min(38vw, 460px);
          }
        }
      `}</style>

      <div className="glass-bench-col" style={colStyle}>
        <header style={headerStyle}>
          <p style={kickerStyle}>{tag}</p>
          <h2 style={titleStyle}>{title}</h2>
          <p style={bodyStyle}>{body}</p>
          <Link href="/blog/pate-de-verre" style={linkStyle}>
            {linkLabel}
          </Link>
        </header>

        <div style={wallStyle}>
          {items.map((item, index) => {
            const n = String(index + 1).padStart(2, '0');
            return (
              <Link
                key={item.src}
                href={item.href ?? '/blog/pate-de-verre'}
                className="glass-bench-shot"
                aria-label={item.caption}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.alt} />
                <span style={captionStyle}>
                  <span style={idStyle}>({n})</span> {item.caption}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const sectionStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  padding:
    'clamp(88px, 12vh, 120px) clamp(20px, 4vw, 48px) clamp(72px, 10vh, 120px)',
  background: '#faf7f2',
  color: '#1a1814',
};

const colStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const headerStyle: CSSProperties = {
  margin: '0 0 72px',
  textAlign: 'left',
  maxWidth: '28rem',
};

const kickerStyle: CSSProperties = {
  margin: '0 0 18px',
  color: 'rgba(26,24,20,0.42)',
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.58rem',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  margin: '0 0 18px',
  color: '#1a1814',
  fontFamily: 'Georgia, Times New Roman, serif',
  fontSize: 'clamp(2rem, 5vw, 3.2rem)',
  fontWeight: 500,
  fontStyle: 'italic',
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
};

const bodyStyle: CSSProperties = {
  margin: '0 0 22px',
  color: 'rgba(26,24,20,0.58)',
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.98rem',
  fontWeight: 500,
  lineHeight: 1.65,
};

const linkStyle: CSSProperties = {
  color: '#1a1814',
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.58rem',
  fontWeight: 800,
  letterSpacing: '0.16em',
  textDecoration: 'underline',
  textUnderlineOffset: '0.28em',
  textTransform: 'uppercase',
};

const wallStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(64px, 10vh, 104px)',
};

const captionStyle: CSSProperties = {
  display: 'block',
  marginTop: 14,
  color: 'rgba(26,24,20,0.55)',
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.72rem',
  fontWeight: 500,
  letterSpacing: '0.02em',
  lineHeight: 1.4,
};

const idStyle: CSSProperties = {
  color: 'rgba(26,24,20,0.38)',
  fontWeight: 600,
  letterSpacing: '0.04em',
};
