'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ScrollUnlock from '../../app/blog/ScrollUnlock';
import './arcade.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

type ArcadeLayoutProps = {
  tag: string;
  title: string;
  subtitle?: string;
  backLabel?: string;
  backHref?: string;
  marquee?: string;
  children: ReactNode;
};

export default function ArcadeLayout({
  tag,
  title,
  subtitle,
  backLabel,
  backHref = '/tools',
  marquee,
  children,
}: ArcadeLayoutProps) {
  const marqueeText =
    marquee ?? 'TOOLS · AUDIO CLIPPING · MORE TBC';

  return (
    <div className="arcade-root" style={{ fontFamily: nunito }}>
      <ScrollUnlock />
      <div className="arcade-content">
        <header
          className="site-top-nav"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            padding: '16px 24px',
            background: 'rgba(251,250,246,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              maxWidth: 980,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {backLabel ? (
              <Link
                href={backHref}
                style={{
                  fontFamily: mono,
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(20,17,12,0.48)',
                  textDecoration: 'none',
                }}
              >
                {backLabel}
              </Link>
            ) : (
              <span />
            )}
            <span
              style={{
                fontFamily: mono,
                fontSize: '0.68rem',
                letterSpacing: '0.16em',
                color: 'rgba(20,17,12,0.36)',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </span>
          </div>
        </header>

        <div className="arcade-marquee-wrap">
          <div className="arcade-marquee-track" aria-hidden>
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
          </div>
        </div>

        <main style={{ maxWidth: 980, margin: '0 auto', padding: '36px 24px 96px' }}>
          <div style={{ maxWidth: 720, marginBottom: 28 }}>
            <p
              style={{
                fontFamily: mono,
                fontSize: '0.68rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#00a99f',
                marginBottom: 10,
              }}
            >
              {tag}
            </p>
            <h1
              style={{
                fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: '#14110c',
                marginBottom: 10,
                lineHeight: 1.08,
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: 'rgba(20,17,12,0.58)',
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Flat geometric frame around a tool surface (no border chrome). */
export function ArcadeCabinetFrame({
  glyph,
  screenGradient,
  children,
}: {
  glyph: string;
  screenGradient: string;
  children: ReactNode;
}) {
  return (
    <div className="arcade-cabinet" style={{ maxWidth: 720 }}>
      <div className="arcade-screen" style={{ background: screenGradient, minHeight: 96 }}>
        <span className="arcade-screen-glyph" aria-hidden>
          {glyph}
        </span>
      </div>
      <div className="arcade-panel">{children}</div>
    </div>
  );
}

export { mono, nunito };
