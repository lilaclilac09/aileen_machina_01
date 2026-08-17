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

function LabCard({
  tool,
  copy,
  labels,
  openLabel,
  featured,
}: {
  tool: ToolDefinition;
  copy?: ItemCopy;
  labels: { what: string; why: string; verdict: string };
  openLabel: string;
  featured?: boolean;
}) {
  const paused = tool.status === 'paused';
  const title = copy?.title ?? tool.title;
  const tag = copy?.tag ?? tool.tag;
  const body = copy?.body ?? tool.body;
  const why = copy?.why ?? tool.why;
  const verdict = copy?.verdict ?? tool.verdict;
  const statusLabel = copy?.statusLabel ?? tool.status;
  const external = /^https?:\/\//i.test(tool.href);
  const host = hostLabel(tool.href);

  if (paused) {
    return (
      <li id={tool.slug} className="tools-lab-paused-item">
        <p className="tools-lab-paused-title">{title}</p>
        <p className="tools-lab-paused-verdict">{verdict}</p>
      </li>
    );
  }

  const inner = (
    <article
      id={tool.slug}
      className={`tools-lab-card${featured ? ' tools-lab-card--featured' : ''}${
        tool.tier === 'experiment' ? ' tools-lab-card--experiment' : ''
      }`}
    >
      <header className="tools-lab-card-head">
        <p className="tools-lab-card-tag">{tag}</p>
        <p className={`tools-lab-status tools-lab-status--${tool.status}`}>{statusLabel}</p>
      </header>
      <h2 className="tools-lab-card-title">{title}</h2>
      <dl className="tools-lab-fields">
        <div>
          <dt>{labels.what}</dt>
          <dd>{body}</dd>
        </div>
        <div>
          <dt>{labels.why}</dt>
          <dd>{why}</dd>
        </div>
        <div>
          <dt>{labels.verdict}</dt>
          <dd>{verdict}</dd>
        </div>
      </dl>
      {host ? <p className="tools-lab-host">{host}</p> : null}
      <span className="tools-lab-cta">{external ? `${openLabel} ↗` : `${openLabel} →`}</span>
    </article>
  );

  if (external) {
    return (
      <a
        href={tool.href}
        className="arcade-cabinet-link tools-lab-wrap"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} — opens ${host ?? tool.href}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={tool.href} className="arcade-cabinet-link tools-lab-wrap">
      {inner}
    </Link>
  );
}

export default function ToolsArcadePage() {
  const { language } = useLanguage();
  const tx = t[language].tools;
  const featured = TOOL_DEFINITIONS.filter((tool) => tool.tier === 'featured');
  const useful = TOOL_DEFINITIONS.filter((tool) => tool.tier === 'utility');
  const experiments = TOOL_DEFINITIONS.filter((tool) => tool.tier === 'experiment');
  const paused = TOOL_DEFINITIONS.filter((tool) => tool.tier === 'paused');
  const fieldLabels = {
    what: tx.whatLabel,
    why: tx.whyLabel,
    verdict: tx.verdictLabel,
  };

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div className="tools-lab">
        <p className="tools-lab-cafe-hint">
          Cafe Cursor →{' '}
          <a href={CAFE_CURSOR_URL} target="_blank" rel="noopener noreferrer">
            cursor-cafe.aileena.xyz
          </a>
        </p>

        <section
          id="tools-featured"
          className="tools-lab-section"
          aria-labelledby="tools-featured-heading"
        >
          <h2 id="tools-featured-heading" className="tools-lab-section-title">
            {tx.featuredLabel}
          </h2>
          <div className="tools-lab-featured">
            {featured.map((tool) => (
              <LabCard
                key={tool.slug}
                tool={tool}
                copy={tx.items[tool.slug as keyof typeof tx.items]}
                labels={fieldLabels}
                openLabel={tx.openTool}
                featured
              />
            ))}
          </div>
        </section>

        <div className="tools-lab-pair-wrap">
          <section
            id="tools-useful"
            className="tools-lab-section"
            aria-labelledby="tools-useful-heading"
          >
            <h2 id="tools-useful-heading" className="tools-lab-section-title">
              {tx.usefulLabel}
            </h2>
            <div className="tools-lab-pair">
              {useful.map((tool) => (
                <LabCard
                  key={tool.slug}
                  tool={tool}
                  copy={tx.items[tool.slug as keyof typeof tx.items]}
                  labels={fieldLabels}
                  openLabel={tx.openTool}
                />
              ))}
            </div>
          </section>

          <section
            id="tools-experiment"
            className="tools-lab-section"
            aria-labelledby="tools-experiment-heading"
          >
            <h2 id="tools-experiment-heading" className="tools-lab-section-title">
              {tx.experimentLabel}
            </h2>
            <div className="tools-lab-pair">
              {experiments.map((tool) => (
                <LabCard
                  key={tool.slug}
                  tool={tool}
                  copy={tx.items[tool.slug as keyof typeof tx.items]}
                  labels={fieldLabels}
                  openLabel={tx.openTool}
                />
              ))}
            </div>
          </section>
        </div>

        {paused.length > 0 ? (
          <section
            id="tools-paused"
            className="tools-lab-section"
            aria-labelledby="tools-paused-heading"
          >
            <h2 id="tools-paused-heading" className="tools-lab-section-title">
              {tx.pausedLabel}
            </h2>
            <ul className="tools-lab-paused">
              {paused.map((tool) => (
                <LabCard
                  key={tool.slug}
                  tool={tool}
                  copy={tx.items[tool.slug as keyof typeof tx.items]}
                  labels={fieldLabels}
                  openLabel={tx.openTool}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <p className="tools-lab-note">{tx.labNote}</p>
      </div>
    </ArcadeLayout>
  );
}
