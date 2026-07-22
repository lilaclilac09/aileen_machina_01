'use client';

import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { TOOL_DEFINITIONS, type ToolDefinition } from '../../lib/tools/registry';
import ArcadeLayout, { mono } from './ArcadeLayout';

function ToolTile({
  tool,
  copy,
  openLabel,
  tbcLabel,
}: {
  tool: ToolDefinition;
  copy?: { tag: string; title: string; body: string };
  openLabel: string;
  tbcLabel: string;
}) {
  const isTbc = tool.status === 'tbc';
  const title = copy?.title ?? tool.title;
  const tag = copy?.tag ?? tool.tag;
  const body = isTbc ? tbcLabel : (copy?.body ?? tool.body);

  const inner = (
    <article className="arcade-cabinet" style={isTbc ? { opacity: 0.55 } : undefined}>
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
          {tag}
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 600, color: '#14110c' }}>
          {title}
        </h2>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            color: 'rgba(20,17,12,0.58)',
            minHeight: 40,
            fontFamily: isTbc ? mono : undefined,
            letterSpacing: isTbc ? '0.08em' : undefined,
            textTransform: isTbc ? 'uppercase' : undefined,
          }}
        >
          {body}
        </p>
        <span
          style={{
            display: 'inline-block',
            fontFamily: mono,
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isTbc ? 'rgba(20,17,12,0.35)' : '#008f86',
          }}
        >
          {isTbc ? tbcLabel : `${openLabel} →`}
        </span>
      </div>
    </article>
  );

  if (isTbc) {
    return (
      <div key={tool.slug} aria-disabled="true">
        {inner}
      </div>
    );
  }

  const external = /^https?:\/\//i.test(tool.href);
  if (external) {
    return (
      <a
        key={tool.slug}
        href={tool.href}
        className="arcade-cabinet-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link key={tool.slug} href={tool.href} className="arcade-cabinet-link">
      {inner}
    </Link>
  );
}

export default function ToolsArcadePage() {
  const { language } = useLanguage();
  const tx = t[language].tools;
  const liveCount = TOOL_DEFINITIONS.filter((t) => t.status === 'live').length;

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
          {liveCount} {tx.toolCount}
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
            <ToolTile
              key={tool.slug}
              tool={tool}
              copy={copy}
              openLabel={tx.openTool}
              tbcLabel={tx.tbc}
            />
          );
        })}
      </div>
    </ArcadeLayout>
  );
}
