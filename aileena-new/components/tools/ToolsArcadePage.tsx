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

type ItemCopy = {
  tag: string;
  title: string;
  body: string;
  why: string;
  verdict: string;
  statusLabel: string;
};

function hostLabel(href: string): string | null {
  try {
    if (!/^https?:\/\//i.test(href)) return null;
    return new URL(href).host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function WaveBars() {
  return (
    <div className="tools-lab-wave" aria-hidden>
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

function ToolCover({
  tool,
  featured,
}: {
  tool: ToolDefinition;
  featured?: boolean;
}) {
  const media = tool.tag === 'AUDIO' || tool.tag === 'VIDEO';
  return (
    <div
      className={`tools-lab-cover tools-lab-cover--${tool.slug}`}
      data-testid={`tools-cover-${tool.slug}`}
      style={
        tool.screenshot
          ? { backgroundImage: `url(${tool.screenshot})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {tool.screenshot ? null : (
        <div className="tools-lab-cover-css" aria-hidden>
          {tool.slug === 'cafe-cursor' ? (
            <div className="tools-lab-receipt">
              <span className="tools-lab-receipt-mark">◎</span>
              <span className="tools-lab-receipt-line" />
              <span className="tools-lab-receipt-line tools-lab-receipt-line--short" />
              <span className="tools-lab-receipt-line" />
              <span className="tools-lab-receipt-dots" />
            </div>
          ) : null}
          {tool.slug === 'inkling-clips' ? <WaveBars /> : null}
          {tool.slug === 'cafe-recap' ? (
            <div className="tools-lab-film">
              <span />
              <span />
              <span />
              <div className="tools-lab-timeline" />
            </div>
          ) : null}
          {tool.slug === 'computer' ? (
            <div className="tools-lab-terminal">
              <span>owner@machina:~$</span>
              <span>inspect /daily</span>
              <span className="tools-lab-terminal-cursor">█</span>
            </div>
          ) : null}
          {tool.slug === 'feed-flash' ? (
            <div className="tools-lab-headlines">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {tool.slug === 'chip-guess' ? <div className="tools-lab-die" /> : null}
          {tool.slug === 'pricing-slot' ? (
            <div className="tools-lab-sku">
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : null}
        </div>
      )}
      {media ? (
        <span className="tools-lab-play" aria-hidden>
          ▶
        </span>
      ) : null}
      {featured ? <span className="tools-lab-featured-pill">featured</span> : null}
    </div>
  );
}

function LabCard({
  tool,
  copy,
  openLabel,
  featured,
}: {
  tool: ToolDefinition;
  copy?: ItemCopy;
  openLabel: string;
  featured?: boolean;
}) {
  const paused = tool.status === 'paused';
  const title = copy?.title ?? tool.title;
  const tag = (copy?.tag ?? tool.tag).toLowerCase();
  const body = copy?.body ?? tool.body;
  const why = copy?.why ?? tool.why;
  const verdict = copy?.verdict ?? tool.verdict;
  const statusLabel = copy?.statusLabel ?? tool.status;
  const external = /^https?:\/\//i.test(tool.href);
  const host = hostLabel(tool.href);

  const inner = (
    <article
      id={tool.slug}
      className={`tools-lab-card${featured ? ' tools-lab-card--featured' : ''}${
        tool.tier === 'experiment' ? ' tools-lab-card--experiment' : ''
      }${paused ? ' tools-lab-card--paused' : ''}`}
    >
      <ToolCover tool={tool} featured={featured} />
      <div className="tools-lab-card-meta">
        <h2 className="tools-lab-card-title">{title}</h2>
        <p className="tools-lab-card-line">{body}</p>
        <p className="tools-lab-card-kicker">
          {statusLabel} · {tag}
        </p>
        {paused ? null : (
          <span className="tools-lab-cta">{external ? `${openLabel} ↗` : `${openLabel} →`}</span>
        )}
      </div>
      <p className="tools-lab-card-detail">
        {why} {verdict}
      </p>
    </article>
  );

  if (paused) {
    return (
      <div className="tools-lab-wrap tools-lab-wrap--paused" data-testid={`tools-card-${tool.slug}`}>
        {inner}
      </div>
    );
  }

  if (external) {
    return (
      <a
        href={tool.href}
        className={`arcade-cabinet-link tools-lab-wrap${featured ? ' tools-lab-wrap--featured' : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} — opens ${host ?? tool.href}`}
        data-testid={`tools-card-${tool.slug}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={tool.href}
      className={`arcade-cabinet-link tools-lab-wrap${featured ? ' tools-lab-wrap--featured' : ''}`}
      data-testid={`tools-card-${tool.slug}`}
    >
      {inner}
    </Link>
  );
}

export default function ToolsArcadePage() {
  const { language } = useLanguage();
  const tx = t[language].tools;
  const live = TOOL_DEFINITIONS.filter((tool) => tool.tier !== 'paused');
  const paused = TOOL_DEFINITIONS.filter((tool) => tool.tier === 'paused');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee} align="center">
      <div className="tools-lab" data-testid="tools-shelf">
        <p className="tools-lab-cafe-hint">
          Cafe Cursor{' '}
          <a href={CAFE_CURSOR_URL} target="_blank" rel="noopener noreferrer">
            cursor-cafe.aileena.xyz
          </a>
        </p>

        <div className="tools-lab-shelf">
          {live.map((tool) => (
            <LabCard
              key={tool.slug}
              tool={tool}
              copy={tx.items[tool.slug as keyof typeof tx.items]}
              openLabel={tx.openTool}
              featured={tool.tier === 'featured'}
            />
          ))}
          {paused.map((tool) => (
            <LabCard
              key={tool.slug}
              tool={tool}
              copy={tx.items[tool.slug as keyof typeof tx.items]}
              openLabel={tx.openTool}
            />
          ))}
        </div>
      </div>
    </ArcadeLayout>
  );
}
