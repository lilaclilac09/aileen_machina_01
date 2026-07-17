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
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.45)' }}>
          {TOOL_DEFINITIONS.length} {tx.toolCount}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 28,
        }}
      >
        {TOOL_DEFINITIONS.map((tool) => {
          const copy = tx.items[tool.slug as keyof typeof tx.items];
          return (
            <Link key={tool.slug} href={tool.href} className="arcade-cabinet-link">
              <article className="arcade-cabinet">
                <div
                  className="arcade-screen"
                  style={{ background: tool.arcade.screenGradient, minHeight: 132 }}
                >
                  <span className="arcade-screen-glyph" aria-hidden>
                    {tool.arcade.glyph}
                  </span>
                </div>
                <div className="arcade-panel">
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontFamily: mono,
                      fontSize: '0.62rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(20,17,12,0.42)',
                    }}
                  >
                    {copy?.tag ?? tool.tag}
                  </p>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 600, color: '#14110c' }}>
                    {copy?.title ?? tool.title}
                  </h2>
                  <p
                    style={{
                      margin: '0 0 16px',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      color: 'rgba(20,17,12,0.58)',
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
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#008f86',
                    }}
                  >
                    {tx.openTool} →
                  </span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </ArcadeLayout>
  );
}
