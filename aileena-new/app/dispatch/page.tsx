'use client';

import Link from 'next/link';
import { useLanguage } from '../../components/LanguageProvider';
import { t } from '../../lib/translations';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";

export default function DispatchArchive() {
  const { language } = useLanguage();
  const tx = t[language];
  const posts = [...tx.blog.researchDispatch.posts].reverse();

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
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            {tx.blog.researchDispatch.tag}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 120px' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 500,
            letterSpacing: '-0.005em',
            color: '#fff',
            marginBottom: 40,
            lineHeight: 1.15,
          }}
        >
          {tx.blog.researchDispatch.heading}
        </h1>

        <div className="substack-list">
          {posts.map((post) => (
            <Link key={post.title} href={post.href}>
              <p className="sl-date">{post.date}</p>
              <h2 className="sl-title">{post.title}</h2>
              <p className="sl-body">{post.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
