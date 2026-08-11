'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../../app/blog/ScrollUnlock';
import './arcade.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function shellQuote(s: string): string {
  if (!/[^\w./:=+-]/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export default function AudioClippingProductPage() {
  const { language } = useLanguage();
  const tx = t[language].tools.audioClippingProduct;
  const [copied, setCopied] = useState(false);

  const cli = useMemo(
    () =>
      `pnpm inkling:clips -- ${shellQuote('https://www.youtube.com/watch?v=VIDEO_ID')} --local --best 3`,
    [],
  );

  async function copyCli() {
    try {
      await navigator.clipboard.writeText(cli);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const ctaPrimary: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 22px',
    background: '#00a99f',
    color: '#fffdf8',
    fontFamily: mono,
    fontSize: '0.78rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
  };

  const ctaGhost: CSSProperties = {
    ...ctaPrimary,
    background: '#14110c',
  };

  return (
    <div className="arcade-root ac-product" style={{ fontFamily: nunito }}>
      <ScrollUnlock />
      <div className="arcade-content">
        <header
          className="site-top-nav"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            padding: '16px 24px',
            background: 'rgba(251,250,246,0.92)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              maxWidth: 1040,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: '0.68rem',
                letterSpacing: '0.16em',
                color: 'rgba(20,17,12,0.36)',
                textTransform: 'uppercase',
              }}
            >
              {tx.navTag}
            </span>
          </div>
        </header>

        {/* Hero — one composition */}
        <section className="ac-hero" aria-label={tx.brand}>
          <div className="ac-hero-wave" aria-hidden>
            <svg viewBox="0 0 1200 320" preserveAspectRatio="none" className="ac-hero-svg">
              <path
                className="ac-wave-a"
                d="M0,180 C80,120 120,240 200,180 C280,120 320,240 400,170 C480,100 520,250 600,180 C680,110 720,240 800,175 C880,110 920,240 1000,170 C1080,100 1120,230 1200,180 L1200,320 L0,320 Z"
              />
              <path
                className="ac-wave-b"
                d="M0,200 C90,150 140,260 220,200 C300,140 340,250 420,195 C500,140 540,260 620,200 C700,140 740,250 820,190 C900,130 940,250 1020,195 C1100,140 1140,240 1200,200 L1200,320 L0,320 Z"
              />
            </svg>
            <div className="ac-hero-bars">
              {Array.from({ length: 48 }, (_, i) => (
                <span key={i} style={{ animationDelay: `${(i % 12) * 0.08}s`, height: `${28 + ((i * 17) % 72)}%` }} />
              ))}
            </div>
          </div>

          <div className="ac-hero-copy">
            <p className="ac-brand">{tx.brand}</p>
            <h1 className="ac-headline">{tx.headline}</h1>
            <p className="ac-dek">{tx.dek}</p>
            <div className="ac-cta-row">
              <Link href="/tools/inkling-clips" style={ctaPrimary}>
                {tx.ctaOpen}
              </Link>
              <button type="button" onClick={() => void copyCli()} style={ctaGhost}>
                {copied ? tx.copied : tx.ctaCopy}
              </button>
            </div>
          </div>
        </section>

        <div className="arcade-marquee-wrap">
          <div className="arcade-marquee-track" aria-hidden>
            <span>{tx.marquee}</span>
            <span>{tx.marquee}</span>
          </div>
        </div>

        {/* One job: how free mode works */}
        <section className="ac-section">
          <p className="ac-eyebrow">{tx.howEyebrow}</p>
          <h2 className="ac-section-title">{tx.howTitle}</h2>
          <p className="ac-section-body">{tx.howBody}</p>
          <ol className="ac-steps">
            <li>{tx.step1}</li>
            <li>{tx.step2}</li>
            <li>{tx.step3}</li>
          </ol>
        </section>

        {/* One job: optional Inkling */}
        <section className="ac-section ac-section-muted">
          <p className="ac-eyebrow">{tx.optionalEyebrow}</p>
          <h2 className="ac-section-title">{tx.optionalTitle}</h2>
          <p className="ac-section-body">{tx.optionalBody}</p>
        </section>

        {/* One job: where to run */}
        <section className="ac-section">
          <p className="ac-eyebrow">{tx.runEyebrow}</p>
          <h2 className="ac-section-title">{tx.runTitle}</h2>
          <p className="ac-section-body">{tx.runBody}</p>
          <pre className="ac-cli">{cli}</pre>
          <div className="ac-cta-row" style={{ marginTop: 18 }}>
            <Link href="/tools/inkling-clips" style={ctaPrimary}>
              {tx.ctaOpen}
            </Link>
            <Link
              href="/tools"
              style={{
                ...ctaGhost,
                background: 'transparent',
                color: 'rgba(20,17,12,0.55)',
                padding: '14px 8px',
              }}
            >
              {tx.backToTools}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
