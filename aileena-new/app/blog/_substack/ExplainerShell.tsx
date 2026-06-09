'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import './explainer.css';

export interface ExplainerShellProps {
  metaScript: string;
  title: React.ReactNode;
  dek: React.ReactNode;
  tldr?: React.ReactNode;
  children: React.ReactNode;
  denseHref?: string;
  prevHref?: string;
  prevLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  footerMeta?: string;
  isDE?: boolean;
}

export default function ExplainerShell({
  metaScript,
  title,
  dek,
  tldr,
  children,
  denseHref,
  prevHref,
  prevLabel,
  nextHref,
  nextLabel,
  footerMeta,
  isDE = false,
}: ExplainerShellProps) {
  return (
    <div className="explainer-article">
      <ScrollUnlock />

      <header className="explainer-nav">
        <div className="explainer-nav-inner">
          <Link href="/#blog" className="explainer-back">
            ← {isDE ? 'archiv' : 'archive'}
          </Link>
          {denseHref ? (
            <div className="explainer-mode-toggle">
              <Link href={denseHref}>● dense</Link>
              <span className="sep">/</span>
              <span className="active">○ explainer</span>
            </div>
          ) : null}
          <span className="explainer-brand">
            aileena<span className="v">·</span>machina
          </span>
        </div>
      </header>

      <section className="explainer-hero">
        <span className="explainer-meta">{metaScript}</span>
        <h1 className="explainer-title">{title}</h1>
        <p className="explainer-dek">{dek}</p>
      </section>

      {tldr ? (
        <div className="explainer-tldr">
          <div className="explainer-tldr-card">{tldr}</div>
        </div>
      ) : null}

      <article className="explainer-body">{children}</article>

      <footer className="explainer-footer">
        {prevHref ? (
          <Link href={prevHref}>← {prevLabel ?? 'previous'}</Link>
        ) : (
          <span />
        )}
        <span>{footerMeta ?? ''}</span>
        {nextHref ? (
          <Link href={nextHref}>{nextLabel ?? 'next'} →</Link>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
}
