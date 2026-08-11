import Link from 'next/link';
import type { CSSProperties } from 'react';

const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

type GlassItem = { src: string; alt: string; caption: string; href?: string };

/**
 * Visual / kiln wall — one quiet composition: centered copy + 2×2 kiln mosaic.
 * Natural aspect (contain), no duplicate float, no crop cover.
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
  items: GlassItem[];
}) {
  return (
    <section id="glass-bench" className="glass-bench" style={glassSectionStyle} aria-label="Glass work">
      <style>{`
        .glass-bench {
          position: relative;
          height: 100%;
          min-height: 100%;
        }
        .glass-bench-gallery {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(10px, 1.6vw, 16px);
          width: min(100%, 920px);
          margin: 0 auto;
          padding: 0 clamp(14px, 2.5vw, 24px);
        }
        @media (min-width: 640px) {
          .glass-bench-gallery {
            grid-template-columns: 1fr 1fr;
            gap: clamp(12px, 1.8vw, 18px);
          }
        }
        .glass-bench-shot {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          color: inherit;
          text-decoration: none;
          background: transparent;
        }
        .glass-bench-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 5 / 4;
          overflow: hidden;
          background: transparent;
        }
        .glass-bench-frame img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .glass-bench-caption {
          margin: 0;
          padding: 0 1px;
          color: rgba(20, 17, 12, 0.58);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(0.78rem, 1.1vw, 0.9rem);
          font-style: italic;
          letter-spacing: 0.01em;
          line-height: 1.25;
        }
      `}</style>

      <header style={glassHeaderStyle}>
        <p style={glassKickerStyle}>{tag}</p>
        <h2 style={glassTitleStyle}>{title}</h2>
        <p style={glassBodyStyle}>{body}</p>
        <Link href="/blog/pate-de-verre" style={glassLinkStyle}>
          {linkLabel}
        </Link>
      </header>

      <div className="glass-bench-gallery" data-visual-gallery>
        {items.map((item) => (
          <Link
            key={item.src}
            href={item.href ?? '/blog/pate-de-verre'}
            className="glass-bench-shot"
            aria-label={item.caption}
          >
            <div className="glass-bench-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.alt} />
            </div>
            <p className="glass-bench-caption">{item.caption}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

const glassSectionStyle: CSSProperties = {
  boxSizing: 'border-box',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 'clamp(18px, 3vh, 28px)',
  width: '100%',
  padding:
    'clamp(64px, 9vh, 84px) clamp(0px, 1.2vw, 12px) clamp(24px, 4vh, 40px)',
  background:
    'radial-gradient(120% 80% at 50% 18%, #fffdf8 0%, #f7f1e6 48%, #efe6d6 100%)',
  color: '#14110c',
  overflow: 'hidden',
};

const glassHeaderStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  margin: '0 auto',
  maxWidth: 560,
  padding: '0 clamp(16px, 3vw, 28px)',
  textAlign: 'center',
  flex: '0 0 auto',
};

const glassKickerStyle: CSSProperties = {
  margin: '0 0 8px',
  color: '#00a99f',
  fontFamily: mono,
  fontSize: '0.62rem',
  fontWeight: 850,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
};

const glassTitleStyle: CSSProperties = {
  margin: '0 0 10px',
  color: '#14110c',
  fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
  fontWeight: 650,
  letterSpacing: '-0.04em',
  lineHeight: 0.92,
};

const glassBodyStyle: CSSProperties = {
  margin: '0 auto 12px',
  maxWidth: 420,
  color: 'rgba(20,17,12,0.68)',
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(0.98rem, 1.35vw, 1.12rem)',
  lineHeight: 1.45,
};

const glassLinkStyle: CSSProperties = {
  color: '#14110c',
  fontFamily: mono,
  fontSize: '0.64rem',
  fontWeight: 850,
  letterSpacing: '0.18em',
  textDecoration: 'none',
  textTransform: 'uppercase',
};
