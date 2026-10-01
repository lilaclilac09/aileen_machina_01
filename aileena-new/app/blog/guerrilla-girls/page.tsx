'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function GuerrillaGirlsArticle() {
  return (
    <SubstackShell
      category="Exhibition"
      date="2026.09.21"
      tags="Art · Feminism · Tate London · Getty"
      title="How to Be a Guerrilla Girl"
      dek="Found this at Tate London. It means freedom to girls more than ever — just the young people make you less hypocritical."
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={{ ...bodyStyle, fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.8)' }}>
          Found this at Tate London.
        </p>

        <p style={bodyStyle}>
          <em>How to Be a Guerrilla Girl</em> — an exhibition at the Getty Research Institute (Nov 18, 2025–Apr 12, 2026) — presents the inner workings of the anonymous feminist art collective alongside a new commission. Drawing on the Guerrilla Girls' archive, the exhibition explores the steps the group took to create their eye-catching and humorous public interventions.
        </p>

        <p style={bodyStyle}>
          Coinciding with the Guerrilla Girls' 40th anniversary, the exhibition tells the story of their collaborative process and longstanding commitment to call for equity for women and artists of color in the art world.
        </p>

        <blockquote style={{
          margin: '48px 0',
          padding: '28px 32px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '3px solid #00ffea',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.9)',
        }}>
          "It means freedom to girls more than ever — just the young people make you less hypocritical."
        </blockquote>

        <p style={bodyStyle}>
          The exhibition places the Guerrilla Girls' well-known posters in the broader context of their data research, protest actions, culture jamming, and distribution methods.
        </p>

        <div style={{
          marginTop: 64,
          padding: '40px 32px',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
        }}>
          <p style={{ ...bodyStyle, marginBottom: 16, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Exhibition
          </p>
          <Link
            href="https://www.getty.edu/exhibitions/how-to-be-a-guerrilla-girl/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'rgba(0,255,234,0.1)',
              color: '#00ffea',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.95rem',
              fontWeight: 500,
              border: '1px solid rgba(0,255,234,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            Getty Exhibition →
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

const bodyStyle = {
  fontSize: 'clamp(1rem, 2vw, 1.15rem)',
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.7)',
  marginBottom: '28px',
  fontWeight: 400,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'clamp(1.1rem, 2.3vw, 1.3rem)',
      fontWeight: 600,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: '24px',
      marginTop: '48px',
      letterSpacing: '0.03em',
    }}>
      {children}
    </h2>
  );
}
