'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { t } from '../lib/translations';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const palette = {
  ink: '#14110c',
  cyan: '#00a99f',
};

/**
 * Shared Doors directory — homepage #watch-hub + /doors.
 * Data: t.watchHub (labels, body, door list). No redesign.
 */
export default function DoorsDirectory({
  minFullHeight = true,
  headingLevel = 'h2',
}: {
  /** Homepage snap section fills viewport; standalone /doors can scroll naturally. */
  minFullHeight?: boolean;
  headingLevel?: 'h1' | 'h2';
}) {
  const { language } = useLanguage();
  const hub = t[language].watchHub;
  const doors = hub.doors;
  const Heading = headingLevel;

  return (
    <section
      className={minFullHeight ? 'min-h-full overflow-y-auto px-5 sm:px-9 lg:px-14' : 'min-h-screen overflow-y-auto px-5 sm:px-9 lg:px-14'}
      style={{
        background: '#ffffff',
        color: palette.ink,
        fontFamily: nunito,
        WebkitOverflowScrolling: 'touch',
      }}
      aria-label="Doors directory"
      data-doors-directory
    >
      <div
        className="mx-auto flex max-w-[880px] flex-col"
        style={{
          gap: 'clamp(28px, 5vh, 48px)',
          paddingTop: 'max(72px, calc(env(safe-area-inset-top, 0px) + 64px))',
          paddingBottom: 'max(48px, calc(env(safe-area-inset-bottom, 0px) + 40px))',
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <p
            style={{
              color: palette.cyan,
              fontFamily: mono,
              fontSize: '0.58rem',
              fontWeight: 850,
              letterSpacing: '0.22em',
              marginBottom: 14,
              textTransform: 'uppercase',
            }}
          >
            {hub.kicker}
          </p>
          <Heading
            style={{
              color: palette.ink,
              fontFamily: nunito,
              fontSize: 'clamp(1.85rem, 6.2vw, 2.75rem)',
              fontWeight: 700,
              fontStyle: 'normal',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            {hub.heading}
          </Heading>
          <p
            style={{
              color: 'rgba(10,10,10,0.58)',
              fontFamily: nunito,
              fontSize: 'clamp(0.92rem, 2.8vw, 1.02rem)',
              fontWeight: 500,
              lineHeight: 1.55,
              maxWidth: 440,
            }}
          >
            {hub.body}
          </p>
        </div>

        <nav
          aria-label={hub.kicker}
          style={{
            display: 'grid',
            gap: 0,
            borderTop: '1px solid rgba(20,17,12,0.12)',
            paddingBottom: 8,
          }}
        >
          {doors.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              id={'id' in door && door.id ? door.id : undefined}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: 12,
                alignItems: 'center',
                minHeight: 52,
                padding: '14px 0',
                borderBottom: '1px dashed rgba(20,17,12,0.14)',
                textDecoration: 'none',
                color: palette.ink,
              }}
            >
              <span
                style={{
                  fontFamily: nunito,
                  fontSize: 'clamp(1.05rem, 3.6vw, 1.28rem)',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2,
                }}
              >
                {door.label}
                <span style={{ marginLeft: 8, color: palette.cyan, fontWeight: 500 }} aria-hidden>
                  →
                </span>
              </span>
              <span
                style={{
                  color: 'rgba(20,17,12,0.48)',
                  fontFamily: mono,
                  fontSize: 'clamp(0.55rem, 1.8vw, 0.62rem)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textAlign: 'right',
                  lineHeight: 1.35,
                  maxWidth: '42vw',
                }}
              >
                {door.hint}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
