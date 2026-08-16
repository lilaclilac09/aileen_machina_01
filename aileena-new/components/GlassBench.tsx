import Link from 'next/link';
import type { CSSProperties } from 'react';
import TactileGallery, { type TactileImage } from './TactileGallery';

const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

type GlassItem = TactileImage;

/**
 * Visual / kiln archive — centered copy + tactile adaptive image wall.
 * Photos keep natural aspect (never cover-crop). Wall / focus toggle.
 * Snap-section height/overflow for #visual lives in globals.css.
 */
export default function GlassBench({
  tag,
  title,
  body,
  linkLabel,
  items,
  modeWall = 'wall',
  modeFocus = 'focus',
}: {
  tag: string;
  title: string;
  body: string;
  linkLabel: string;
  items: GlassItem[];
  modeWall?: string;
  modeFocus?: string;
}) {
  return (
    <section id="glass-bench" className="glass-bench" style={glassSectionStyle} aria-label="Glass work">
      <style>{`
        .glass-bench {
          position: relative;
          height: auto;
          min-height: 0;
          width: 100%;
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

      <TactileGallery
        images={items}
        defaultMode="wall"
        labels={{ wall: modeWall, focus: modeFocus, prev: '←', next: '→' }}
        galleryTestId="glass-bench-gallery"
      />
    </section>
  );
}

const glassSectionStyle: CSSProperties = {
  boxSizing: 'border-box',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: 'clamp(18px, 3vh, 28px)',
  width: '100%',
  maxWidth: '100%',
  padding:
    'max(64px, calc(env(safe-area-inset-top, 0px) + 56px)) clamp(0px, 1.2vw, 12px) max(28px, calc(env(safe-area-inset-bottom, 0px) + 28px))',
  background:
    'radial-gradient(120% 80% at 50% 18%, #fffdf8 0%, #f7f1e6 48%, #efe6d6 100%)',
  color: '#14110c',
  overflow: 'visible',
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
