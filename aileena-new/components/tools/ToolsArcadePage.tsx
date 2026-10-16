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
      {tool.demoVideo ? (
        <video
          className="tools-lab-cover-video"
          src={tool.demoVideo}
          poster={tool.demoPoster}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          aria-label={`${tool.title} demo video`}
        />
      ) : tool.screenshot ? null : (
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
          {tool.slug === 'ai-factory-sim' ? (
            <div className="tools-lab-factory">
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          ) : null}
          {tool.slug === 'intent' ? (
            <div className="tools-lab-intent">
              <span>TEXT</span>
              <span>INTENT</span>
              <span>NEXT</span>
            </div>
          ) : null}
          {tool.slug === 'machina-college' ? (
            <div className="tools-lab-college">
              <span>ONE BOOK</span>
              <span>NOT A DX</span>
            </div>
          ) : null}
          {tool.slug === 'agent-gateway' ? (
            <div className="tools-lab-gateway">
              <span>REQ 3</span>
              <span>TOK 12/40</span>
              <span>owner 0/60</span>
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
          {tool.slug === 'tamper-check' ? (
            <div className="tools-lab-scale">
              <span>REF 31.40 g</span>
              <span>UNIT 31.71 g</span>
              <span className="tools-lab-scale-delta">Δ +310 mg</span>
            </div>
          ) : null}
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

type ToolContext = {
  repo: string;
  watchDemo: string;
  tryIt?: string;
  whyHeading: string;
  why: readonly string[];
  howHeading: string;
  how: readonly string[];
  sources: readonly { label: string; href: string }[];
};

function LabCard({
  tool,
  copy,
  openLabel,
  featured,
  context,
}: {
  tool: ToolDefinition;
  copy?: ItemCopy;
  openLabel: string;
  featured?: boolean;
  context?: ToolContext;
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
  const openHref = tool.liveUrl && !external ? tool.href : tool.href;
  const primaryLabel = external
    ? tool.href.includes('github.com')
      ? (context?.repo ?? 'Repo')
      : openLabel
    : openLabel;
  const primarySuffix = external || (tool.liveUrl?.startsWith('http') ?? false) ? '↗' : '→';

  const ctaRow = tool.demoVideo ? (
    <span className="tools-lab-cta-row">
      <a
        href={openHref}
        className="tools-lab-cta"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        data-testid={`tools-open-${tool.slug}`}
      >
        {primaryLabel} {primarySuffix}
      </a>
      <span aria-hidden> · </span>
      <a
        href={tool.demoVideo}
        className="tools-lab-cta"
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`tools-demo-${tool.slug}`}
      >
        {context?.watchDemo ?? 'Watch demo'} ▶
      </a>
      {tool.liveUrl && tool.liveUrl !== tool.href ? (
        <>
          <span aria-hidden> · </span>
          <a
            href={tool.liveUrl}
            className="tools-lab-cta"
            {...(tool.liveUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            data-testid={`tools-live-${tool.slug}`}
          >
            {context?.tryIt ?? 'Try it'} ↗
          </a>
        </>
      ) : null}
    </span>
  ) : paused ? null : (
    <span className="tools-lab-cta">{external ? `${openLabel} ↗` : `${openLabel} →`}</span>
  );

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
        {ctaRow}
      </div>
      <p className="tools-lab-card-detail">
        {why} {verdict}
      </p>
    </article>
  );

  const contextBlock =
    context && context.why.length > 0 ? (
      <div className="tools-lab-context" data-testid={`tools-context-${tool.slug}`}>
        <h3>{context.whyHeading}</h3>
        <ul>
          {context.why.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h3>{context.howHeading}</h3>
        <ol>
          {context.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="tools-lab-context-sources">
          {context.sources.map((src, i) => (
            <span key={src.href}>
              {i ? ' · ' : ''}
              <a href={src.href} target="_blank" rel="noopener noreferrer">
                {src.label}
              </a>
            </span>
          ))}
        </p>
      </div>
    ) : null;

  // Demo CTAs need their own anchors — do not wrap the whole card.
  if (tool.demoVideo) {
    return (
      <div
        className={`tools-lab-wrap${featured ? ' tools-lab-wrap--featured' : ''}${
          paused ? ' tools-lab-wrap--paused' : ''
        }`}
        data-testid={`tools-card-${tool.slug}`}
      >
        {inner}
        {contextBlock}
      </div>
    );
  }

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
              context={
                tool.slug === 'tamper-check'
                  ? tx.tamperCheckContext
                  : {
                      repo: tx.repo,
                      watchDemo: tx.watchDemo,
                      tryIt: tx.tryIt,
                      whyHeading: '',
                      why: [],
                      howHeading: '',
                      how: [],
                      sources: [],
                    }
              }
            />
          ))}
          {paused.map((tool) => (
            <LabCard
              key={tool.slug}
              tool={tool}
              copy={tx.items[tool.slug as keyof typeof tx.items]}
              openLabel={tx.openTool}
              context={{
                repo: tx.repo,
                watchDemo: tx.watchDemo,
                tryIt: tx.tryIt,
                whyHeading: '',
                why: [],
                howHeading: '',
                how: [],
                sources: [],
              }}
            />
          ))}
        </div>
      </div>
    </ArcadeLayout>
  );
}
