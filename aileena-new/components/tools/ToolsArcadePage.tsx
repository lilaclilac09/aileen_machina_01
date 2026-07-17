'use client';

import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { TOOL_DEFINITIONS } from '../../lib/tools/registry';
import ArcadeLayout, { mono } from './ArcadeLayout';

export default function ToolsArcadePage() {
  const { language } = useLanguage();
  const tx = t[language].tools;

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 22,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', color: 'rgba(255,253,248,0.45)' }}>
          {tx.creditsLabel}{' '}
          <span className="arcade-coin" style={{ color: '#c9872f' }}>
            ●●●
          </span>{' '}
          {tx.creditsHint}
        </p>
        <span style={{ fontFamily: mono, fontSize: '0.68rem', color: 'rgba(255,253,248,0.35)' }}>
          {TOOL_DEFINITIONS.length} {tx.gameCount}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}
      >
        {TOOL_DEFINITIONS.map((tool) => {
          const copy = tx.items[tool.slug as keyof typeof tx.items];
          return (
            <Link key={tool.slug} href={tool.href} className="arcade-cabinet-link">
              <article className="arcade-cabinet">
                <div
                  className="arcade-screen"
                  style={{ background: tool.arcade.screenGradient, minHeight: 148 }}
                >
                  <span className="arcade-screen-glyph" aria-hidden>
                    {tool.arcade.glyph}
                  </span>
                </div>
                <div className="arcade-panel">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 10,
                      fontFamily: mono,
                      fontSize: '0.62rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,253,248,0.42)',
                    }}
                  >
                    <span>{copy?.tag ?? tool.tag}</span>
                    <span style={{ color: '#00a99f' }}>{tool.arcade.players}</span>
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.12rem', color: '#fffdf8' }}>
                    {copy?.title ?? tool.title}
                  </h2>
                  <p
                    style={{
                      margin: '0 0 14px',
                      fontSize: '0.86rem',
                      lineHeight: 1.55,
                      color: 'rgba(255,253,248,0.58)',
                      minHeight: 66,
                    }}
                  >
                    {copy?.body ?? tool.body}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: mono,
                      fontSize: '0.72rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#00a99f',
                      padding: '8px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,169,159,0.35)',
                      background: 'rgba(0,169,159,0.08)',
                    }}
                  >
                    {tx.pressStart} →
                  </span>
                </div>
              </article>
            </Link>
          );
        })}

        <article
          className="arcade-cabinet"
          style={{
            opacity: 0.55,
            borderStyle: 'dashed',
          }}
          aria-hidden
        >
          <div
            className="arcade-screen"
            style={{
              background: 'linear-gradient(180deg, #1a1a22, #0d0d12)',
              minHeight: 148,
            }}
          >
            <span className="arcade-screen-glyph">?</span>
          </div>
          <div className="arcade-panel">
            <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: 'rgba(255,253,248,0.5)' }}>
              {tx.comingSoonTitle}
            </h2>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'rgba(255,253,248,0.38)' }}>
              {tx.comingSoonBody}
            </p>
          </div>
        </article>
      </div>
    </ArcadeLayout>
  );
}
