'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ScrollUnlock from '../../app/blog/ScrollUnlock';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

type ToolShellProps = {
  tag: string;
  title: string;
  subtitle?: string;
  backLabel: string;
  backHref?: string;
  children: ReactNode;
};

export default function ToolShell({
  tag,
  title,
  subtitle,
  backLabel,
  backHref = '/tools',
  children,
}: ToolShellProps) {
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
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href={backHref}
            style={{
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,253,248,0.5)',
              textDecoration: 'none',
            }}
          >
            {backLabel}
          </Link>
          <span
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: 'rgba(255,253,248,0.38)',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {tag}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 96px' }}>
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 'clamp(1.7rem, 4vw, 2.6rem)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: '#fffdf8',
              marginBottom: 12,
              lineHeight: 1.12,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                fontSize: '1.02rem',
                lineHeight: 1.65,
                color: 'rgba(255,253,248,0.62)',
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
  );
}
