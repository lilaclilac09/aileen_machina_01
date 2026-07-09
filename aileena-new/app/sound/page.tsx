'use client';

import Link from 'next/link';
import DJStation from '../../components/DJStation';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

export default function SoundPage() {
  const { language } = useLanguage();
  const tx = t[language];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: 'rgba(255,253,248,0.86)',
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
          borderBottom: '1px solid rgba(255,253,248,0.08)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              fontFamily: nunito,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'rgba(255,253,248,0.62)',
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
              color: 'rgba(255,253,248,0.38)',
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
              color: '#fffdf8',
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
              color: 'rgba(255,253,248,0.62)',
              fontWeight: 400,
            }}
          >
            {tx.sound.body}
          </p>
        </div>

        <DJStation />
      </main>
    </div>
  );
}
