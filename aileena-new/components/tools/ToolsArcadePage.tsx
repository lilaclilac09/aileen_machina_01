'use client';

import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import {
  CAFE_CURSOR_URL,
  TOOL_DEFINITIONS,
  type ToolDefinition,
} from '../../lib/tools/registry';
import ArcadeLayout from './ArcadeLayout';

function hostLabel(href: string): string | null {
  try {
    if (!/^https?:\/\//i.test(href)) return null;
    return new URL(href).host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function ToolTile({
  tool,
  copy,
  openLabel,
  tbcLabel,
  liveLabel,
  featured,
}: {
  tool: ToolDefinition;
  copy?: { tag: string; title: string; body: string };
  openLabel: string;
  tbcLabel: string;
  liveLabel: string;
  featured?: boolean;
}) {
  const isTbc = tool.status === 'tbc';
  const title = copy?.title ?? tool.title;
  const tag = copy?.tag ?? tool.tag;
  const body = isTbc ? tbcLabel : (copy?.body ?? tool.body);
  const external = /^https?:\/\//i.test(tool.href);
  const host = hostLabel(tool.href);
  const isCafe = tool.slug === 'cafe-cursor';

  const inner = (
    <article
      className={`arcade-cabinet tools-tile${featured ? ' tools-tile--featured' : ''}${
        isTbc ? ' tools-tile--tbc' : ''
      }`}
    >
      <div
        className="arcade-screen tools-tile-screen"
        style={{ background: tool.arcade.screenGradient }}
      >
        <span className="arcade-screen-glyph" aria-hidden>
          {tool.arcade.glyph}
        </span>
        {!isTbc ? (
          <span className={`tools-live-badge${featured ? ' tools-live-badge--hot' : ''}`}>
            {liveLabel}
          </span>
        ) : null}
      </div>
      <div className="arcade-panel tools-tile-panel">
        <p className="tools-tile-tag">{tag}</p>
        <h2 className="tools-tile-title">{title}</h2>
        <p className="tools-tile-body">{body}</p>
        {!isTbc && isCafe && host ? (
          <p className="tools-tile-host">{host}</p>
        ) : null}
        <span className={`tools-tile-cta${isTbc ? ' tools-tile-cta--muted' : ''}`}>
          {isTbc ? tbcLabel : external ? `${openLabel} ↗` : `${openLabel} →`}
        </span>
      </div>
    </article>
  );

  if (isTbc) {
    return (
      <div key={tool.slug} className="tools-tile-wrap" aria-disabled="true">
        {inner}
      </div>
    );
  }

  if (external) {
    return (
      <a
        key={tool.slug}
        href={tool.href}
        className="arcade-cabinet-link tools-tile-wrap"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} — opens ${host ?? tool.href}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link key={tool.slug} href={tool.href} className="arcade-cabinet-link tools-tile-wrap">
      {inner}
    </Link>
  );
}

export default function ToolsArcadePage() {
  const { language } = useLanguage();
  const tx = t[language].tools;
  const live = TOOL_DEFINITIONS.filter((tool) => tool.status === 'live');
  const soon = TOOL_DEFINITIONS.filter((tool) => tool.status !== 'live');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div className="tools-hub">
        <div className="tools-hub-meta">
          <p className="tools-hub-count">
            {live.length} {tx.toolCount}
          </p>
          <p className="tools-hub-cafe-hint">
            Cafe Cursor →{' '}
            <a href={CAFE_CURSOR_URL} target="_blank" rel="noopener noreferrer">
              cursor-cafe.aileena.xyz
            </a>
          </p>
        </div>

        <section className="tools-hub-section" aria-labelledby="tools-live-heading">
          <h2 id="tools-live-heading" className="tools-hub-section-title">
            Live
          </h2>
          <div className="tools-hub-grid tools-hub-grid--live">
            {live.map((tool) => {
              const copy = tx.items[tool.slug as keyof typeof tx.items];
              return (
                <ToolTile
                  key={tool.slug}
                  tool={tool}
                  copy={copy}
                  openLabel={tx.openTool}
                  tbcLabel={tx.tbc}
                  liveLabel={tx.liveBadge}
                  featured={tool.slug === 'cafe-cursor' || tool.slug === 'inkling-clips'}
                />
              );
            })}
          </div>
        </section>

        {soon.length > 0 ? (
          <section className="tools-hub-section" aria-labelledby="tools-soon-heading">
            <h2 id="tools-soon-heading" className="tools-hub-section-title">
              {tx.tbc}
            </h2>
            <div className="tools-hub-grid tools-hub-grid--soon">
              {soon.map((tool) => {
                const copy = tx.items[tool.slug as keyof typeof tx.items];
                return (
                  <ToolTile
                    key={tool.slug}
                    tool={tool}
                    copy={copy}
                    openLabel={tx.openTool}
                    tbcLabel={tx.tbc}
                    liveLabel={tx.liveBadge}
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </ArcadeLayout>
  );
}
