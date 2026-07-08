'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import DJStation from '../../components/DJStation';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function SoundPage() {
  const { language } = useLanguage();
  const tx = t[language];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: 'rgba(255,255,255,0.86)',
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
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              fontFamily: nunito,
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {tx.sound.tag}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
              fontWeight: 500,
              letterSpacing: '-0.005em',
              color: '#fff',
              marginBottom: 14,
              lineHeight: 1.15,
            }}
          >
            {tx.sound.heading}
          </h1>
          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 400,
            }}
          >
            {tx.sound.body}
          </p>
          <Link
            href="/dj-set/"
            style={{
              display: 'inline-block',
              marginTop: 18,
              fontFamily: mono,
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(99,243,216,0.75)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(99,243,216,0.35)',
              paddingBottom: 2,
            }}
          >
            Curated set carousel →
          </Link>
        </div>

        <DJStation />

        <GlassBench
          tag={tx.visual.kilnTag}
          title={tx.visual.heading}
          body={tx.visual.kilnNote}
          linkLabel={tx.visual.readGlass}
          items={tx.visual.items}
        />
      </main>
    </div>
  );
}

function GlassBench({
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
    <section id="glass-bench" style={glassSectionStyle} aria-label="Glass work">
      <div style={glassCopyStyle}>
        <p style={glassKickerStyle}>{tag}</p>
        <h2 style={glassTitleStyle}>{title}</h2>
        <p style={glassBodyStyle}>{body}</p>
        <Link href="/blog/pate-de-verre" style={glassLinkStyle}>
          {linkLabel}
        </Link>
      </div>

      <div style={glassGridStyle}>
        {items.map((item, index) => (
          <Link
            key={item.src}
            href={item.href ?? '/blog/pate-de-verre'}
            style={{
              ...glassPhotoLinkStyle,
              transform: `rotate(${[-3.5, 1.5, -1.5, 3][index % 4]}deg)`,
            }}
            aria-label={item.caption}
          >
            <figure style={glassFigureStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.alt} style={glassImageStyle} />
              <figcaption style={glassCaptionStyle}>{item.caption}</figcaption>
            </figure>
          </Link>
        ))}
      </div>
    </section>
  );
}

const glassSectionStyle: CSSProperties = {
  marginTop: 76,
  padding: '52px clamp(18px, 4vw, 44px) 58px',
  background: '#fbfaf6',
  color: '#14110c',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  gap: 'clamp(28px, 5vw, 72px)',
  alignItems: 'end',
  boxShadow: '0 -1px 0 rgba(255,255,255,0.08), 0 34px 90px -70px rgba(0,0,0,0.8)',
};

const glassCopyStyle: CSSProperties = {
  maxWidth: 420,
};

const glassKickerStyle: CSSProperties = {
  margin: '0 0 12px',
  color: '#00a99f',
  fontFamily: mono,
  fontSize: '0.58rem',
  fontWeight: 850,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
};

const glassTitleStyle: CSSProperties = {
  margin: '0 0 18px',
  color: '#14110c',
  fontSize: 'clamp(2rem, 5vw, 4.2rem)',
  fontWeight: 650,
  letterSpacing: '-0.035em',
  lineHeight: 0.94,
};

const glassBodyStyle: CSSProperties = {
  margin: '0 0 20px',
  color: 'rgba(20,17,12,0.68)',
  fontFamily: 'Georgia, serif',
  fontSize: '1.02rem',
  lineHeight: 1.55,
};

const glassLinkStyle: CSSProperties = {
  color: '#14110c',
  fontFamily: mono,
  fontSize: '0.62rem',
  fontWeight: 850,
  letterSpacing: '0.18em',
  textDecoration: 'none',
  textTransform: 'uppercase',
};

const glassGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))',
  gap: 'clamp(12px, 2vw, 22px)',
  alignItems: 'end',
};

const glassPhotoLinkStyle: CSSProperties = {
  display: 'block',
  color: 'inherit',
  textDecoration: 'none',
  transition: 'transform 0.18s ease',
};

const glassFigureStyle: CSSProperties = {
  margin: 0,
  padding: '8px 8px 18px',
  background: '#fff',
  boxShadow: '0 26px 70px -46px rgba(20,17,12,0.8)',
};

const glassImageStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  aspectRatio: '1',
  objectFit: 'cover',
};

const glassCaptionStyle: CSSProperties = {
  display: 'block',
  marginTop: 10,
  color: '#e9829d',
  fontFamily: "'Allura', cursive",
  fontSize: '1.24rem',
  lineHeight: 0.9,
  textAlign: 'center',
};
