'use client';

import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

export default function WorksPage() {
  const { language } = useLanguage();
  const tx = t[language];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070707',
        color: 'rgba(255,255,255,0.86)',
        fontFamily: nunito,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      <header
        className="site-top-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '18px 24px',
          background: 'rgba(7,7,7,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            AILEENA MACHINA
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '64px 24px 120px' }}>
        <p
          style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 16,
            fontWeight: 500,
          }}
        >
          {tx.pow.tag}
        </p>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 500,
            letterSpacing: '-0.005em',
            color: '#fff',
            marginBottom: 48,
            lineHeight: 1.15,
          }}
        >
          {tx.pow.heading}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tx.pow.items.map((item) => (
            <article
              key={item.name}
              style={{
                padding: '32px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.25rem, 2.6vw, 1.7rem)',
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 12,
                  letterSpacing: '-0.005em',
                }}
              >
                {item.name}
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.65)',
                  marginBottom: 18,
                  fontWeight: 400,
                  maxWidth: 640,
                }}
              >
                {item.description}
              </p>
              <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Source
                </a>
                {'liveHref' in item && item.liveHref ? (
                  <a
                    href={item.liveHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8rem',
                      color: 'rgba(0,255,234,0.7)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Live
                  </a>
                ) : null}
                {'pdfHref' in item && item.pdfHref ? (
                  <a
                    href={item.pdfHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.4)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    PDF
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
