'use client';

import Link from 'next/link';
import ScrollUnlock from '../blog/ScrollUnlock';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import { TOOL_DEFINITIONS } from '../../lib/tools/registry';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

export default function ToolsPage() {
  const { language } = useLanguage();
  const tx = t[language].tools;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: 'rgba(255,253,248,0.88)',
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
          background: 'rgba(8,8,8,0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,253,248,0.08)',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: 'rgba(255,253,248,0.38)',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {tx.tag}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 96px' }}>
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
            {tx.heading}
          </h1>
          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.65,
              color: 'rgba(255,253,248,0.62)',
              fontWeight: 400,
            }}
          >
            {tx.body}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 18,
          }}
        >
          {TOOL_DEFINITIONS.map((tool) => {
            const copy = tx.items[tool.slug as keyof typeof tx.items];
            return (
              <Link
                key={tool.slug}
                href={tool.href}
                style={{
                  display: 'block',
                  padding: '22px 22px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,253,248,0.1)',
                  background: 'rgba(255,253,248,0.03)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,253,248,0.42)',
                    }}
                  >
                    {copy?.tag ?? tool.tag}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#00a99f',
                    }}
                  >
                    {tool.status}
                  </span>
                </div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#fffdf8' }}>
                  {copy?.title ?? tool.title}
                </h2>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, color: 'rgba(255,253,248,0.58)' }}>
                  {copy?.body ?? tool.body}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 16,
                    fontSize: '0.82rem',
                    color: '#00a99f',
                  }}
                >
                  {tx.openTool} →
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
