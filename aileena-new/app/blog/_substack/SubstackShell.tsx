'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import './substack.css';

export interface SubstackShellProps {
  date: string;
  category?: string;
  tags?: string;
  title: React.ReactNode;
  dek: React.ReactNode;
  children: React.ReactNode;
  isDE?: boolean;
}

export default function SubstackShell({
  date,
  category,
  tags,
  title,
  dek,
  children,
  isDE = false,
}: SubstackShellProps) {
  return (
    <div className="substack-article">
      <ScrollUnlock />

      <header className="substack-nav">
        <div className="substack-nav-inner">
          <Link href="/#blog" className="substack-back">
            ← {isDE ? 'Archiv' : 'Archive'}
          </Link>
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

      {children}
    </div>
  );
}
