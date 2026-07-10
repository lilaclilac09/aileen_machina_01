'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import ArticleNarration from '../../../components/ArticleNarration';
import ArticleModeMemory, { setArticleMode } from './ArticleModeMemory';
import './substack.css';

export interface SubstackShellProps {
  date: string;
  category?: string;
  tags?: string;
  title: React.ReactNode;
  dek: React.ReactNode;
  children: React.ReactNode;
  isDE?: boolean;
  explainerHref?: string;
  showNarration?: boolean;
}

export default function SubstackShell({
  date,
  category,
  tags,
  title,
  dek,
  children,
  isDE = false,
  explainerHref,
  showNarration = true,
}: SubstackShellProps) {
  return (
    <div className="substack-article">
      <ScrollUnlock />
      {explainerHref ? (
        <ArticleModeMemory currentMode="dense" altHref={explainerHref} />
      ) : null}

      <header className="substack-nav">
        <div className="substack-nav-inner">
          {/* ← Home lives in SiteLeftChrome (fixed left). Keep brand / mode right. */}
          {explainerHref ? (
            <div className="substack-mode-toggle">
              <span className="active">● dense</span>
              <span className="sep">/</span>
              <Link
                href={explainerHref}
                onClick={() => setArticleMode('explainer')}
              >
                ○ explainer
              </Link>
            </div>
          ) : (
            <span aria-hidden />
          )}
          <span className="substack-brand">AILEENA MACHINA</span>
        </div>
      </header>

      <section className="substack-hero">
        <p className="substack-meta">
          {category ? `${category} · ${date}` : date}
        </p>
        <h1 className="substack-title">{title}</h1>
        <p className="substack-dek">{dek}</p>
        {tags ? <p className="substack-tags">{tags}</p> : null}
      </section>

      <div className="substack-rule">
        <div />
      </div>

      {showNarration ? (
        <div style={{ padding: '0 24px' }}>
          <ArticleNarration title={title} date={date} category={category} />
        </div>
      ) : null}

      {children}
    </div>
  );
}
