'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ScrollUnlock from '../../blog/ScrollUnlock';
import {
  HUAWEI_HBM,
  type ImpactDirection,
  type MagazineCard,
  type MagazineColumn,
} from '../../../lib/research/huawei-hbm';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/* ── Magazine rack — interactive investment-research pilot ────────────
 *
 * Three racks per Aileen's spec:
 *   1. Display rack (cover) — scene + question
 *   2. Category rack (left-nav columns + center cards)
 *   3. Judgment rack (verdict column at the end)
 *
 * Each card carries an "impact on the verdict" tag (reinforces / weakens
 * / uncertain) — cards aren't isolated, they vote toward the editor's
 * stance.
 *
 * Layout:
 *   Top:    cover scene + core question (full-bleed)
 *   Left:   column navigation (sticky)
 *   Center: cards for the active column
 *   Right:  evidence drawer (per-card sources / quotes / math)
 *   Bottom: judgment progress strip
 */
export default function HuaweiHbmMagazinePilot() {
  const issue = HUAWEI_HBM;
  const allColumns: (MagazineColumn | { id: 'verdict'; label: string; tagline: string; cards: [] })[] =
    [...issue.columns, { id: 'verdict', label: "Editor's Verdict", tagline: 'This issue, in one card', cards: [] }];

  const [activeColumnId, setActiveColumnId] = useState<string>(issue.columns[0]!.id);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const activeColumn = useMemo(
    () => allColumns.find((c) => c.id === activeColumnId),
    [activeColumnId, allColumns],
  );

  const openCard: MagazineCard | undefined = useMemo(() => {
    if (!openCardId) return undefined;
    for (const c of issue.columns) {
      const found = c.cards.find((card) => card.id === openCardId);
      if (found) return found;
    }
    return undefined;
  }, [openCardId, issue]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070707',
        color: '#fff',
        fontFamily: nunito,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      {/* ── Sticky top bar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 24px',
          background: 'rgba(7,7,7,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: nunito,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
            }}
          >
            ← Home
          </Link>
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              color: '#ffa726',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Aileena Research · {issue.issueNumber}
          </span>
          <Link
            href="/blog/huawei-hbm"
            style={{
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Long-form ↗
          </Link>
        </div>
      </header>

      {/* ── 1. COVER — scene + title + core question ── */}
      <section
        style={{
          position: 'relative',
          minHeight: '78vh',
          padding: '88px 24px 64px',
          display: 'flex',
          alignItems: 'center',
          background:
            "linear-gradient(180deg, rgba(7,7,7,0.6) 0%, rgba(7,7,7,0.85) 60%, #070707 100%), url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1800&q=80') center/cover no-repeat",
        }}
      >
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.66rem',
              letterSpacing: '0.4em',
              color: '#ffa726',
              textTransform: 'uppercase',
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            Cover · The scene
          </p>
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.78)',
              marginBottom: 40,
              maxWidth: 760,
              letterSpacing: '0.012em',
              fontWeight: 400,
            }}
          >
            {issue.coverScene}
          </p>
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.4rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.02,
              marginBottom: 32,
              color: '#fff',
            }}
          >
            {issue.coverTitle}
          </h1>
          <div
            style={{
              borderLeft: '3px solid #ffa726',
              paddingLeft: 24,
              maxWidth: 720,
            }}
          >
            <p
              style={{
                fontFamily: mono,
                fontSize: '0.6rem',
                letterSpacing: '0.32em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              The core question
            </p>
            <p
              style={{
                fontSize: 'clamp(1.2rem, 2.8vw, 1.7rem)',
                lineHeight: 1.4,
                color: '#fff',
                fontWeight: 500,
                letterSpacing: '-0.005em',
              }}
            >
              {issue.coverQuestion}
            </p>
          </div>
          <p
            style={{
              marginTop: 56,
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.32em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            ↓ Flip through the magazine
          </p>
        </div>
      </section>

      {/* ── 2. RACK — left column nav + center cards + right drawer ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '64px 24px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 220px) 1fr',
          gap: 40,
          alignItems: 'flex-start',
        }}
      >
        {/* Left — column nav */}
        <nav
          style={{
            position: 'sticky',
            top: 80,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          aria-label="Magazine columns"
        >
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.32em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            Columns
          </p>
          {allColumns.map((c, idx) => {
            const isActive = c.id === activeColumnId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveColumnId(c.id);
                  setOpenCardId(null);
                }}
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  padding: '10px 0 10px 14px',
                  borderLeft: isActive ? '2px solid #ffa726' : '2px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  transition: 'color 0.18s ease, border-color 0.18s ease',
                  fontFamily: nunito,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    color: isActive ? '#ffa726' : 'rgba(255,255,255,0.32)',
                    fontWeight: 600,
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.25 }}>{c.label}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.32)',
                    lineHeight: 1.4,
                  }}
                >
                  {c.tagline}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Center — active column content */}
        <div style={{ minWidth: 0 }}>
          {activeColumn && activeColumn.id !== 'verdict' && (
            <ColumnView
              column={activeColumn as MagazineColumn}
              openCardId={openCardId}
              onOpenCard={setOpenCardId}
            />
          )}
          {activeColumn?.id === 'verdict' && <VerdictView verdict={issue.verdict} />}
        </div>
      </section>

      {/* ── 3. Evidence drawer (overlay-ish, when a card is open) ── */}
      {openCard && (
        <aside
          aria-label={`Evidence for ${openCard.title}`}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(420px, 100vw)',
            background: 'rgba(10,10,10,0.97)',
            borderLeft: '1px solid rgba(255,167,38,0.22)',
            backdropFilter: 'blur(14px)',
            boxShadow: '-20px 0 60px -20px rgba(0,0,0,0.7)',
            zIndex: 70,
            padding: '24px 28px',
            overflowY: 'auto',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: '0.55rem',
                letterSpacing: '0.32em',
                color: '#ffa726',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Evidence drawer
            </span>
            <button
              type="button"
              onClick={() => setOpenCardId(null)}
              style={{
                appearance: 'none',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: mono,
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 999,
                cursor: 'pointer',
              }}
              aria-label="Close evidence drawer"
            >
              Close
            </button>
          </div>

          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              lineHeight: 1.3,
              marginBottom: 12,
              color: '#fff',
            }}
          >
            {openCard.title}
          </h2>
          <p
            style={{
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 22,
            }}
          >
            {openCard.judgment}
          </p>

          {openCard.drawer?.math && (
            <div style={{ marginBottom: 22 }}>
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '0.55rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                The arithmetic
              </p>
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '0.82rem',
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,167,38,0.06)',
                  border: '1px solid rgba(255,167,38,0.15)',
                  padding: '12px 14px',
                  borderRadius: 4,
                }}
              >
                {openCard.drawer.math}
              </p>
            </div>
          )}

          {openCard.drawer?.quotes && openCard.drawer.quotes.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '0.55rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                Quotes
              </p>
              {openCard.drawer.quotes.map((q, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: '2px solid rgba(255,167,38,0.4)',
                    paddingLeft: 12,
                    marginBottom: 12,
                  }}
                >
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.85)' }}>
                    “{q.text}”
                  </p>
                  <p
                    style={{
                      fontFamily: mono,
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 4,
                      letterSpacing: '0.05em',
                    }}
                  >
                    — {q.who}
                  </p>
                </div>
              ))}
            </div>
          )}

          {openCard.drawer?.sources && openCard.drawer.sources.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '0.55rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                Sources
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {openCard.drawer.sources.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.82rem',
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: 1.55,
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!openCard.drawer && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.45)',
                fontStyle: 'italic',
              }}
            >
              No additional drawer material on this card — the judgment + three points stand on their own.
            </p>
          )}
        </aside>
      )}

      {/* ── 4. Bottom progress / verdict strip ── */}
      <ProgressStrip
        columns={allColumns.map((c) => ({ id: c.id, label: c.label }))}
        activeId={activeColumnId}
        onJump={(id) => {
          setActiveColumnId(id);
          setOpenCardId(null);
        }}
      />
    </div>
  );
}

/* ── Column view — shelf of cards ─────────────────────────────────── */
function ColumnView({
  column,
  openCardId,
  onOpenCard,
}: {
  column: MagazineColumn;
  openCardId: string | null;
  onOpenCard: (id: string | null) => void;
}) {
  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.62rem',
            letterSpacing: '0.32em',
            color: '#ffa726',
            textTransform: 'uppercase',
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          {column.label}
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '-0.015em',
            lineHeight: 1.15,
          }}
        >
          {column.tagline}
        </h2>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {column.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isOpen={card.id === openCardId}
            onToggle={() => onOpenCard(card.id === openCardId ? null : card.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Card — one judgment, three points, impact tag, drawer button ─── */
function CardItem({
  card,
  isOpen,
  onToggle,
}: {
  card: MagazineCard;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: isOpen ? '1px solid rgba(255,167,38,0.4)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '22px 24px',
        transition: 'border-color 0.18s ease, background 0.18s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 14,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Scene
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.5,
            }}
          >
            {card.scene}
          </p>
        </div>
        <ImpactBadge direction={card.impact} note={card.impactNote} />
      </div>

      <h3
        style={{
          fontSize: 'clamp(1.1rem, 2.4vw, 1.4rem)',
          fontWeight: 600,
          lineHeight: 1.25,
          color: '#fff',
          marginBottom: 14,
          letterSpacing: '-0.005em',
        }}
      >
        {card.title}
      </h3>

      <p
        style={{
          fontSize: '0.98rem',
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: 18,
          paddingLeft: 14,
          borderLeft: '2px solid rgba(255,167,38,0.5)',
        }}
      >
        {card.judgment}
      </p>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {card.points.map((p, i) => (
          <li
            key={i}
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.7)',
              paddingLeft: 18,
              position: 'relative',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: 9,
                width: 6,
                height: 1,
                background: '#ffa726',
              }}
            />
            {p}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onToggle}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.75)',
          fontFamily: mono,
          fontSize: '0.58rem',
          letterSpacing: '0.24em',
          padding: '6px 12px',
          borderRadius: 999,
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'border-color 0.18s ease, color 0.18s ease',
        }}
      >
        {isOpen ? 'Close drawer' : 'Open evidence →'}
      </button>
    </article>
  );
}

/* ── Impact badge — reinforces / weakens / uncertain ──────────────── */
function ImpactBadge({ direction, note }: { direction: ImpactDirection; note: string }) {
  const palette: Record<ImpactDirection, { bg: string; border: string; fg: string; label: string; arrow: string }> = {
    reinforces: {
      bg: 'rgba(61,240,166,0.10)',
      border: 'rgba(61,240,166,0.45)',
      fg: '#3df0a6',
      label: 'Reinforces',
      arrow: '↑',
    },
    weakens: {
      bg: 'rgba(255,108,108,0.10)',
      border: 'rgba(255,108,108,0.45)',
      fg: '#ff6c6c',
      label: 'Weakens',
      arrow: '↓',
    },
    uncertain: {
      bg: 'rgba(255,167,38,0.10)',
      border: 'rgba(255,167,38,0.45)',
      fg: '#ffa726',
      label: 'Uncertain',
      arrow: '~',
    },
  };
  const p = palette[direction];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          background: p.bg,
          border: `1px solid ${p.border}`,
          color: p.fg,
          fontFamily: mono,
          fontSize: '0.55rem',
          letterSpacing: '0.22em',
          padding: '4px 10px',
          borderRadius: 999,
          textTransform: 'uppercase',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
        title={`Impact on the final verdict: ${p.label}`}
      >
        {p.arrow} {p.label}
      </span>
      <span
        style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.45)',
          textAlign: 'right',
          maxWidth: 220,
          lineHeight: 1.35,
        }}
      >
        {note}
      </span>
    </div>
  );
}

/* ── Verdict view — the editor's take ─────────────────────────────── */
function VerdictView({ verdict }: { verdict: typeof HUAWEI_HBM.verdict }) {
  const stancePalette: Record<typeof verdict.stance, { bg: string; border: string; fg: string; label: string }> = {
    bullish: { bg: 'rgba(61,240,166,0.10)', border: 'rgba(61,240,166,0.4)', fg: '#3df0a6', label: 'Bullish' },
    bearish: { bg: 'rgba(255,108,108,0.10)', border: 'rgba(255,108,108,0.4)', fg: '#ff6c6c', label: 'Bearish' },
    wait: { bg: 'rgba(255,167,38,0.10)', border: 'rgba(255,167,38,0.4)', fg: '#ffa726', label: 'Wait & watch' },
  };
  const sp = stancePalette[verdict.stance];

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.62rem',
            letterSpacing: '0.32em',
            color: '#ffa726',
            textTransform: 'uppercase',
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Editor's Verdict
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '-0.015em',
            lineHeight: 1.15,
          }}
        >
          This issue, in one card
        </h2>
      </header>

      <article
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,167,38,0.3)',
          borderRadius: 6,
          padding: '28px 30px',
        }}
      >
        {/* Stance + confidence */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <span
            style={{
              background: sp.bg,
              border: `1px solid ${sp.border}`,
              color: sp.fg,
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              padding: '6px 14px',
              borderRadius: 999,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Stance · {sp.label}
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              padding: '6px 14px',
              borderRadius: 999,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Confidence · {verdict.confidence}
          </span>
        </div>

        <p
          style={{
            fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
            lineHeight: 1.6,
            color: '#fff',
            marginBottom: 14,
            paddingLeft: 16,
            borderLeft: '3px solid #ffa726',
            fontWeight: 500,
          }}
        >
          {verdict.stanceText}
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 30,
            fontStyle: 'italic',
            paddingLeft: 16,
          }}
        >
          {verdict.confidenceNote}
        </p>

        <VerdictBlock label="Core reasons" items={verdict.reasons} accent="#3df0a6" />
        <VerdictBlock label="Biggest counter" items={[verdict.biggestCounter]} accent="#ff6c6c" />
        <VerdictBlock label="What to watch" items={verdict.indicators} accent="#ffa726" />

        <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Time window
          </p>
          <p style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>{verdict.timeWindow}</p>
        </div>
      </article>
    </div>
  );
}

function VerdictBlock({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          fontFamily: mono,
          fontSize: '0.55rem',
          letterSpacing: '0.3em',
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.85)',
              paddingLeft: 24,
              position: 'relative',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                fontFamily: mono,
                fontSize: '0.62rem',
                color: accent,
                fontWeight: 700,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            {it}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Progress strip — bottom dock showing path through the magazine ──── */
function ProgressStrip({
  columns,
  activeId,
  onJump,
}: {
  columns: { id: string; label: string }[];
  activeId: string;
  onJump: (id: string) => void;
}) {
  const activeIndex = columns.findIndex((c) => c.id === activeId);
  const pct = ((activeIndex + 1) / columns.length) * 100;
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 40,
        background: 'rgba(7,7,7,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 24px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            From question → verdict
          </span>
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              color: '#ffa726',
              fontWeight: 600,
            }}
          >
            {activeIndex + 1} / {columns.length}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            height: 4,
            borderRadius: 2,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          {columns.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onJump(c.id)}
              aria-label={`Jump to ${c.label}`}
              style={{
                flex: 1,
                background: i <= activeIndex ? '#ffa726' : 'rgba(255,255,255,0.10)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.18s ease',
              }}
            />
          ))}
        </div>
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.62rem',
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            marginTop: 2,
          }}
          aria-hidden
        >
          {pct.toFixed(0)}% of the path
        </p>
      </div>
    </div>
  );
}
