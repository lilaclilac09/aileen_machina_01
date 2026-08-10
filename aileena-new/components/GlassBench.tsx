import Link from 'next/link';
import type { CSSProperties } from 'react';

const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/** Strongest kiln shot — placed as a small floating canvas object (not a gallery tile). */
const CANVAS_IMAGE = '/pate-glass.jpg';

type GlassItem = { src: string; alt: string; caption: string; href?: string };

/**
 * Visual / kiln wall — multi-image gallery from translations `visual.items`.
 * First row keeps the two-column base; remaining images extend below.
 * Content images keep natural aspect (no object-fit: cover crop).
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
  const rows: GlassItem[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <section id="glass-bench" className="glass-bench" style={glassSectionStyle} aria-label="Glass work">
      <style>{`
        .glass-bench {
          position: relative;
          height: 100%;
          min-height: 100%;
        }
        .glass-bench-canvas-float {
          position: absolute;
          z-index: 0;
          pointer-events: none;
          user-select: none;
          width: min(32vw, 200px);
          max-width: 220px;
          top: clamp(72px, 14vh, 120px);
          right: clamp(4px, 3vw, 28px);
          opacity: 0.92;
          transform: rotate(3.5deg);
          filter: drop-shadow(0 14px 28px rgba(20, 17, 12, 0.22));
        }
        .glass-bench-canvas-float img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
        }
        @media (max-width: 859px) {
          .glass-bench-canvas-float {
            width: min(28vw, 120px);
            top: clamp(56px, 10vh, 88px);
            right: clamp(2px, 2vw, 12px);
            opacity: 0.78;
          }
        }
        .glass-bench-gallery {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.2vw, 14px);
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
        }
        .glass-bench-stage {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(8px, 1.2vw, 14px);
          width: 100%;
          margin: 0 auto;
          align-items: start;
        }
        .glass-bench-shot {
          position: relative;
          display: block;
          overflow: visible;
          min-height: 0;
          height: auto;
          color: inherit;
          text-decoration: none;
          background: transparent;
        }
        .glass-bench-shot img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
          object-position: center;
        }
        @media (min-width: 860px) {
          .glass-bench-stage--dual {
            grid-template-columns: 1.08fr 0.92fr;
          }
          .glass-bench-stage--single {
            grid-template-columns: 1fr;
            max-width: 720px;
          }
        }
      `}</style>

      {/* Canvas / background placed object — not a gallery tile, no drag label */}
      <div className="glass-bench-canvas-float" aria-hidden="true" data-visual-canvas-image>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CANVAS_IMAGE} alt="" />
      </div>

      <header style={glassHeaderStyle}>
        <p style={glassKickerStyle}>{tag}</p>
        <h2 style={glassTitleStyle}>{title}</h2>
        <p style={glassBodyStyle}>{body}</p>
        <Link href="/blog/pate-de-verre" style={glassLinkStyle}>
          {linkLabel}
        </Link>
      </header>

      <div className="glass-bench-gallery">
        {rows.map((row, rowIndex) => {
          const dual = row.length > 1;
          return (
            <div
              key={`row-${rowIndex}`}
              className={`glass-bench-stage ${dual ? 'glass-bench-stage--dual' : 'glass-bench-stage--single'}`}
              style={glassStageStyle}
            >
              {row.map((item, index) => (
                <Link
                  key={item.src}
                  href={item.href ?? '/blog/pate-de-verre'}
                  className={`glass-bench-shot ${index === 0 ? 'glass-bench-shot--a' : 'glass-bench-shot--b'}`}
                  aria-label={item.caption}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={item.alt} />
                  <span
                    style={{
                      ...glassCaptionStyle,
                      ...(index === 1 ? glassCaptionAltStyle : null),
                    }}
                  >
                    {item.caption}
                  </span>
                </Link>
              ))}
            </div>
          );
        })}
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
  gap: 'clamp(12px, 2.2vh, 22px)',
  width: '100%',
  padding:
    'clamp(64px, 9vh, 84px) clamp(0px, 1.2vw, 12px) clamp(18px, 3vh, 28px)',
  background:
    'radial-gradient(120% 80% at 50% 18%, #fffdf8 0%, #f7f1e6 48%, #efe6d6 100%)',
  color: '#14110c',
  overflow: 'hidden',
};

const glassHeaderStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  margin: '0 auto',
  maxWidth: 760,
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
  fontSize: 'clamp(3.2rem, 8.5vw, 6.8rem)',
  fontWeight: 650,
  letterSpacing: '-0.045em',
  lineHeight: 0.88,
};

const glassBodyStyle: CSSProperties = {
  margin: '0 auto 12px',
  maxWidth: 460,
  color: 'rgba(20,17,12,0.68)',
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(1.02rem, 1.5vw, 1.18rem)',
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

const glassStageStyle: CSSProperties = {
  display: 'grid',
  gap: 'clamp(8px, 1.2vw, 14px)',
  width: '100%',
  margin: '0 auto',
  alignItems: 'start',
};

const glassCaptionStyle: CSSProperties = {
  position: 'absolute',
  left: 'clamp(14px, 2vw, 26px)',
  bottom: 'clamp(12px, 2vh, 22px)',
  zIndex: 2,
  color: '#e9829d',
  fontFamily: "'Allura', cursive",
  fontSize: 'clamp(1.85rem, 3.6vw, 3rem)',
  lineHeight: 0.92,
  textShadow:
    '0 1px 0 rgba(255,255,255,0.55), 0 0 18px rgba(255,253,248,0.55), 0 10px 28px rgba(20,17,12,0.4)',
  transform: 'rotate(-2deg)',
  pointerEvents: 'none',
};

const glassCaptionAltStyle: CSSProperties = {
  left: 'auto',
  right: 'clamp(14px, 2vw, 26px)',
  transform: 'rotate(1.5deg)',
  textAlign: 'right',
};
