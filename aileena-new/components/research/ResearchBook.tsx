'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import ScrollUnlock from '../../app/blog/ScrollUnlock';
import type {
  ImpactDirection,
  MagazineCard,
  MagazineColumn,
  MagazineIssue,
  Verdict,
} from '../../lib/research/types';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/* ── Book-style chapter reader ───────────────────────────────────────
 *
 * Aileen's clarification (the latest one): "一张书一个故事，慢慢打开
 * 其他的章节" — not a magazine rack with all columns visible at once;
 * a book where chapters open one at a time.
 *
 * Layout: every chapter takes the full viewport. A page-turn animation
 * carries you between chapters. The progress bar at the bottom lets
 * you jump back if you've already opened a chapter, but the default
 * gesture is forward — open the next.
 *
 * Chapter sequence:
 *   0  Cover           (scene + title + core question + editorial line)
 *   1  Cover Story     (the thesis)
 *   2  Data            (the receipts)
 *   3  On the Ground   (concrete situations)
 *   4  People          (voices)
 *   5  Counter         (the bear case)
 *   6  Archive         (sources)
 *   7  Editor's Verdict (the closing card)
 */

type Chapter =
  | { kind: 'cover' }
  | { kind: 'column'; column: MagazineColumn }
  | { kind: 'verdict' };

export default function ResearchBook({ issue }: { issue: MagazineIssue }) {
  const chapters: Chapter[] = [
    { kind: 'cover' },
    ...issue.columns.map((c) => ({ kind: 'column' as const, column: c })),
    { kind: 'verdict' },
  ];

  const [chapterIndex, setChapterIndex] = useState(0);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goTo = (i: number) => {
    if (i === chapterIndex) return;
    setDirection(i > chapterIndex ? 1 : -1);
    setChapterIndex(Math.max(0, Math.min(chapters.length - 1, i)));
    setOpenCardId(null);
  };

  const next = () => goTo(chapterIndex + 1);
  const prev = () => goTo(chapterIndex - 1);

  const current = chapters[chapterIndex]!;
  const openCard: MagazineCard | undefined = (() => {
    if (!openCardId) return undefined;
    for (const c of issue.columns) {
      const found = c.cards.find((x) => x.id === openCardId);
      if (found) return found;
    }
    return undefined;
  })();

  // chapter labels for the progress strip / next-chapter teaser
  const chapterLabel = (i: number): string => {
    const c = chapters[i];
    if (!c) return '';
    if (c.kind === 'cover') return 'Cover';
    if (c.kind === 'verdict') return "Editor's Verdict";
    return c.column.label;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070707',
        color: '#fff',
        fontFamily: nunito,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ScrollUnlock />

      {/* Sticky top bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '14px 24px',
          background: 'rgba(7,7,7,0.78)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href="/research"
            style={{
              fontFamily: nunito,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
            }}
          >
            ← Bookshelf
          </Link>
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.28em',
              color: '#ffa726',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {issue.issueNumber} · {chapterLabel(chapterIndex)}
          </span>
          <Link
            href="/blog/huawei-hbm"
            style={{
              fontFamily: mono,
              fontSize: '0.58rem',
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

      {/* Chapter slot — one chapter at a time, animated */}
      <div
        style={{
          minHeight: '100vh',
          paddingTop: 60,
          paddingBottom: 100,
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={chapterIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction === 1 ? 80 : -80, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: direction === 1 ? -80 : 80, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%' }}
          >
            {current.kind === 'cover' && (
              <CoverPage
                issue={issue}
                onOpen={() => goTo(1)}
              />
            )}
            {current.kind === 'column' && (
              <ColumnPage
                column={current.column}
                index={chapterIndex}
                total={chapters.length}
                openCardId={openCardId}
                onOpenCard={(id) => setOpenCardId(id)}
              />
            )}
            {current.kind === 'verdict' && (
              <VerdictPage verdict={issue.verdict} nextIssueTracks={issue.nextIssueTracks} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Evidence drawer */}
      <AnimatePresence>
        {openCard && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
            <EvidenceDrawerContent card={openCard} onClose={() => setOpenCardId(null)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom — page-turn bar */}
      <PageTurnBar
        chapterIndex={chapterIndex}
        total={chapters.length}
        chapterLabel={chapterLabel}
        onPrev={prev}
        onNext={next}
        onJump={goTo}
      />
    </div>
  );
}

/* ── Chapter 0 — the cover ────────────────────────────────────────── */
function CoverPage({ issue, onOpen }: { issue: MagazineIssue; onOpen: () => void }) {
  return (
    <section
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: '64px 24px 24px',
        display: 'flex',
        alignItems: 'center',
        background:
          "linear-gradient(180deg, rgba(7,7,7,0.6) 0%, rgba(7,7,7,0.88) 60%, #070707 100%), url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1800&q=80') center/cover no-repeat",
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
        <div style={{ borderLeft: '3px solid #ffa726', paddingLeft: 24, maxWidth: 720, marginBottom: 44 }}>
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

        <div
          style={{
            background: 'rgba(255,167,38,0.05)',
            border: '1px solid rgba(255,167,38,0.18)',
            borderRadius: 6,
            padding: '20px 24px',
            marginBottom: 40,
            maxWidth: 720,
          }}
        >
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.32em',
              color: '#ffa726',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Editorial line · Why this issue
          </p>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.78)' }}>
            {issue.whyThisIssue}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          style={{
            appearance: 'none',
            background: '#ffa726',
            color: '#070707',
            border: 'none',
            borderRadius: 999,
            padding: '14px 28px',
            fontFamily: mono,
            fontSize: '0.7rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 12px 36px -10px rgba(255,167,38,0.55)',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          }}
        >
          Open the book →
        </button>
      </div>
    </section>
  );
}

/* ── Chapters 1..N — one column at a time ─────────────────────────── */
function ColumnPage({
  column,
  index,
  total,
  openCardId,
  onOpenCard,
}: {
  column: MagazineColumn;
  index: number;
  total: number;
  openCardId: string | null;
  onOpenCard: (id: string) => void;
}) {
  return (
    <section
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: '64px 24px 64px',
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <header style={{ marginBottom: 40 }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.32em',
              color: '#ffa726',
              textTransform: 'uppercase',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Chapter {String(index).padStart(2, '0')} of {String(total - 1).padStart(2, '0')} · {column.label}
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.015em',
              lineHeight: 1.12,
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
              onOpen={() => onOpenCard(card.id === openCardId ? '' : card.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final chapter — the verdict ──────────────────────────────────── */
function VerdictPage({ verdict, nextIssueTracks }: { verdict: Verdict; nextIssueTracks: string }) {
  const stancePalette: Record<Verdict['stance'], { bg: string; border: string; fg: string; label: string }> = {
    bullish: { bg: 'rgba(61,240,166,0.10)', border: 'rgba(61,240,166,0.4)', fg: '#3df0a6', label: 'Bullish' },
    bearish: { bg: 'rgba(255,108,108,0.10)', border: 'rgba(255,108,108,0.4)', fg: '#ff6c6c', label: 'Bearish' },
    wait: { bg: 'rgba(255,167,38,0.10)', border: 'rgba(255,167,38,0.4)', fg: '#ffa726', label: 'Wait & watch' },
  };
  const sp = stancePalette[verdict.stance];

  return (
    <section style={{ minHeight: 'calc(100vh - 60px)', padding: '64px 24px 64px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <header style={{ marginBottom: 32 }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.6rem',
              letterSpacing: '0.32em',
              color: '#ffa726',
              textTransform: 'uppercase',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Final chapter · Editor&rsquo;s Verdict
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.015em',
              lineHeight: 1.12,
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

        <div
          style={{
            marginTop: 28,
            background: 'rgba(255,167,38,0.04)',
            border: '1px dashed rgba(255,167,38,0.25)',
            borderRadius: 6,
            padding: '20px 24px',
          }}
        >
          <p
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.32em',
              color: '#ffa726',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Editorial line · The next issue tracks
          </p>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
            {nextIssueTracks}
          </p>
        </div>

        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <Link
            href="/research"
            style={{
              display: 'inline-block',
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              padding: '10px 20px',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 999,
            }}
          >
            ← Close the book
          </Link>
        </div>
      </div>
    </section>
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
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
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

/* ── Card — one judgment, three points, impact tag, drawer button ─── */
function CardItem({
  card,
  isOpen,
  onOpen,
}: {
  card: MagazineCard;
  isOpen: boolean;
  onOpen: () => void;
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
        onClick={onOpen}
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
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

/* ── Evidence drawer content ──────────────────────────────────────── */
function EvidenceDrawerContent({ card, onClose }: { card: MagazineCard; onClose: () => void }) {
  return (
    <>
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
          onClick={onClose}
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

      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.3, marginBottom: 12, color: '#fff' }}>
        {card.title}
      </h2>
      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', marginBottom: 22 }}>
        {card.judgment}
      </p>

      {card.drawer?.math && (
        <div style={{ marginBottom: 22 }}>
          <DrawerLabel>The arithmetic</DrawerLabel>
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
            {card.drawer.math}
          </p>
        </div>
      )}

      {card.drawer?.quotes && card.drawer.quotes.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <DrawerLabel>Quotes</DrawerLabel>
          {card.drawer.quotes.map((q, i) => (
            <div key={i} style={{ borderLeft: '2px solid rgba(255,167,38,0.4)', paddingLeft: 12, marginBottom: 12 }}>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.85)' }}>“{q.text}”</p>
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

      {card.drawer?.sources && card.drawer.sources.length > 0 && (
        <div>
          <DrawerLabel>Sources</DrawerLabel>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {card.drawer.sources.map((s, i) => (
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

      {!card.drawer && (
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
          No additional drawer material on this card — the judgment + three points stand on their own.
        </p>
      )}
    </>
  );
}

function DrawerLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  );
}

/* ── Bottom page-turn bar ─────────────────────────────────────────── */
function PageTurnBar({
  chapterIndex,
  total,
  chapterLabel,
  onPrev,
  onNext,
  onJump,
}: {
  chapterIndex: number;
  total: number;
  chapterLabel: (i: number) => string;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
}) {
  const isFirst = chapterIndex === 0;
  const isLast = chapterIndex === total - 1;
  const nextLabel = isLast ? '—' : chapterLabel(chapterIndex + 1);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(7,7,7,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(14px)',
        padding: '12px 20px env(safe-area-inset-bottom, 12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* dot row — clickable chapter index */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            paddingBottom: 4,
          }}
          aria-label="Chapter navigation"
        >
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === chapterIndex;
            const isPast = i < chapterIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Jump to chapter ${i}`}
                aria-current={isCurrent ? 'true' : undefined}
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: isCurrent ? 26 : 7,
                    height: 7,
                    borderRadius: 999,
                    background: isCurrent || isPast ? '#ffa726' : 'rgba(255,255,255,0.18)',
                    transition: 'width 0.22s ease, background 0.22s ease',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* prev / next */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            style={{
              appearance: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'transparent',
              color: isFirst ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
              fontFamily: mono,
              fontSize: '0.58rem',
              letterSpacing: '0.22em',
              padding: '8px 14px',
              borderRadius: 999,
              textTransform: 'uppercase',
              cursor: isFirst ? 'default' : 'pointer',
              opacity: isFirst ? 0.4 : 1,
            }}
          >
            ← Previous
          </button>

          <span
            style={{
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {chapterIndex + 1} of {total}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            style={{
              appearance: 'none',
              border: '1px solid rgba(255,167,38,0.5)',
              background: isLast ? 'transparent' : 'rgba(255,167,38,0.12)',
              color: isLast ? 'rgba(255,167,38,0.4)' : '#ffa726',
              fontFamily: mono,
              fontSize: '0.58rem',
              letterSpacing: '0.22em',
              padding: '8px 14px',
              borderRadius: 999,
              textTransform: 'uppercase',
              cursor: isLast ? 'default' : 'pointer',
              fontWeight: 700,
              opacity: isLast ? 0.4 : 1,
              maxWidth: 'min(220px, 50vw)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isLast ? 'End of book' : `Next · ${nextLabel} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
