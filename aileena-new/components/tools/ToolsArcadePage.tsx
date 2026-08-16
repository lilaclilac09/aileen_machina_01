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
import ArchiveIndex from '../../app/_archive/ArchiveIndex';

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

function ToolPreview({ slug }: { slug: string }) {
  if (slug === 'cafe-cursor') {
    return (
      <div className="tools-preview tools-preview--ticket" aria-hidden>
        <span className="tools-preview-punch" />
        <span className="tools-preview-punch" />
        <p className="tools-preview-kicker">Cafe Cursor Shanghai</p>
        <p className="tools-preview-hero">credits</p>
        <p className="tools-preview-line">guest · checked in</p>
      </div>
    );
  }

  if (slug === 'inkling-clips') {
    return (
      <div className="tools-preview tools-preview--wave" aria-hidden>
        <p className="tools-preview-url">youtube.com/watch?v=</p>
        <div className="tools-wave">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} style={{ height: `${28 + ((i * 17) % 52)}%` }} />
          ))}
        </div>
        <p className="tools-preview-line">clip 01 · clip 02 · clip 03</p>
      </div>
    );
  }

  return (
    <div className="tools-preview tools-preview--terminal" aria-hidden>
      <p className="tools-preview-code">{'{ "cut": 12 }'}</p>
      <p className="tools-preview-code">ffmpeg → recap.mp4</p>
      <p className="tools-preview-line">≠ CapCut</p>
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
  const tag = copy?.tag ?? tool.tag;
  const note = copy?.verdict ?? tool.verdict;
  const statusLabel = copy?.statusLabel ?? tool.status;
  const external = /^https?:\/\//i.test(tool.href);
  const host = hostLabel(tool.href);

  if (paused) {
    return (
      <li id={tool.slug} className="tools-lab-paused-item">
        <p className="tools-lab-paused-title">{title}</p>
        <p className="tools-lab-paused-verdict">{note}</p>
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
      <ToolPreview slug={tool.slug} />
      <header className="tools-lab-card-head">
        <p className="tools-lab-card-tag">{tag}</p>
        <p className={`tools-lab-status tools-lab-status--${tool.status}`}>{statusLabel}</p>
      </header>
      <h2 className="tools-lab-card-title">{title}</h2>
      <p className="tools-lab-note-line">{note}</p>
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
  const bench = TOOL_DEFINITIONS.filter(
    (tool) => tool.tier === 'utility' || tool.tier === 'experiment',
  );
  const paused = TOOL_DEFINITIONS.filter((tool) => tool.tier === 'paused');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div className="tools-lab">
        <p className="tools-lab-cafe-hint">
          Cafe Cursor →{' '}
          <a href={CAFE_CURSOR_URL} target="_blank" rel="noopener noreferrer">
            cursor-cafe.aileena.xyz
          </a>
        </p>

        <div className="arc-stage">
          <ArchiveIndex
            label="tools index"
            groups={[
              {
                id: 'tools-featured',
                label: tx.featuredLabel,
                items: featured.map((tool) => ({
                  href: `#${tool.slug}`,
                  label: tx.items[tool.slug as keyof typeof tx.items]?.title ?? tool.title,
                })),
              },
              {
                id: 'tools-bench',
                label: tx.benchLabel,
                items: bench.map((tool) => ({
                  href: `#${tool.slug}`,
                  label: tx.items[tool.slug as keyof typeof tx.items]?.title ?? tool.title,
                })),
              },
              ...(paused.length > 0
                ? [
                    {
                      id: 'tools-paused',
                      label: tx.pausedLabel,
                      items: paused.map((tool) => ({
                        href: `#${tool.slug}`,
                        label: tx.items[tool.slug as keyof typeof tx.items]?.title ?? tool.title,
                      })),
                    },
                  ]
                : []),
            ]}
          />

          <div className="arc-stage-main">
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
                    openLabel={tx.openTool}
                    featured
                  />
                ))}
              </div>
            </section>

            <section
              id="tools-bench"
              className="tools-lab-section"
              aria-labelledby="tools-bench-heading"
            >
              <h2 id="tools-bench-heading" className="tools-lab-section-title">
                {tx.benchLabel}
              </h2>
              <div className="tools-lab-pair">
                {bench.map((tool) => (
                  <LabCard
                    key={tool.slug}
                    tool={tool}
                    copy={tx.items[tool.slug as keyof typeof tx.items]}
                    openLabel={tx.openTool}
                  />
                ))}
              </div>
            </section>

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
                      openLabel={tx.openTool}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="tools-lab-note">{tx.labNote}</p>
          </div>
        </div>
      </div>
    </ArcadeLayout>
  );
}
