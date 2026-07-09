import Link from 'next/link';
import type { CSSProperties } from 'react';

const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/**
 * Option A — centered full-bleed kiln wall.
 * 1–2 large edge-to-edge images, Allura pink captions overlaid, no Polaroid mats.
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
  // Prefer the two strongest process shots: clay + packed glass.
  const preferred = items.filter((item) =>
    /pate-clay|pate-glass/.test(item.src),
  );
  const featured = (preferred.length >= 2 ? preferred : items).slice(0, 2);
  const dual = featured.length > 1;

  return (
    <section id="glass-bench" className="glass-bench" style={glassSectionStyle} aria-label="Glass work">
      <style>{`
        .glass-bench {
          height: 100%;
          min-height: 100%;
        }
        .glass-bench-stage {
          grid-template-columns: 1fr;
          flex: 1 1 auto;
          min-height: 0;
        }
        .glass-bench-shot {
          position: relative;
          display: block;
          overflow: hidden;
          min-height: 0;
          height: 100%;
          color: inherit;
          text-decoration: none;
          background: #1a1610;
        }
        .glass-bench-shot img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        @media (min-width: 860px) {
          .glass-bench-stage {
            grid-template-columns: ${dual ? '1.08fr 0.92fr' : '1fr'};
            height: min(58dvh, calc(100% - 210px));
          }
          .glass-bench-shot--b { align-self: stretch; }
        }
        @media (max-width: 859px) {
          .glass-bench-stage {
            height: auto;
            max-height: none;
          }
          .glass-bench-shot {
            height: clamp(28dvh, 32dvh, 280px);
          }
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

      <div className="glass-bench-stage" style={glassStageStyle}>
        {featured.map((item, index) => (
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
    </section>
  );
}

const glassSectionStyle: CSSProperties = {
  boxSizing: 'border-box',
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
};

const glassHeaderStyle: CSSProperties = {
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
  alignItems: 'stretch',
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
