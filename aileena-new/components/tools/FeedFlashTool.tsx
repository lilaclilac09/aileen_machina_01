'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

type FeedItem = {
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
};

type Source = { id: string; name: string; meta: string; siteUrl: string };

type Phase = 'idle' | 'playing' | 'won' | 'lost' | 'error';

export default function FeedFlashTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.feedFlash;
  const tool = getToolBySlug('feed-flash');

  const [sources, setSources] = useState<Source[]>([]);
  const [pool, setPool] = useState<FeedItem[]>([]);
  const [current, setCurrent] = useState<FeedItem | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tools/feeds');
        const json = (await res.json()) as {
          ok: boolean;
          data?: { sources: Source[]; items: FeedItem[] };
          error?: { message: string };
        };
        if (!json.ok || !json.data?.items?.length) {
          if (!cancelled) {
            setError(json.error?.message ?? tx.errors.load);
            setPhase('error');
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setSources(json.data.sources);
          setPool(json.data.items);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(tx.errors.network);
          setPhase('error');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tx.errors.load, tx.errors.network]);

  const deal = useCallback(
    (items: FeedItem[]) => {
      if (items.length === 0) {
        setPhase('error');
        setError(tx.errors.empty);
        return;
      }
      const next = items[Math.floor(Math.random() * items.length)];
      setCurrent(next);
      setPick(null);
      setPhase('playing');
    },
    [tx.errors.empty],
  );

  function onStart() {
    deal(pool);
  }

  function onGuess(sourceId: string) {
    if (phase !== 'playing' || !current || pick) return;
    setPick(sourceId);
    const ok = sourceId === current.sourceId;
    if (ok) {
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => Math.max(b, n));
        return n;
      });
      setScore((s) => s + 100);
      setPhase('won');
    } else {
      setStreak(0);
      setPhase('lost');
    }
  }

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      marquee={tx.marquee}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
          fontFamily: mono,
          fontSize: '0.72rem',
          color: 'rgba(20,17,12,0.45)',
        }}
      >
        <span>
          {tx.streak}: <span style={{ color: '#c9872f' }}>{streak}</span>
        </span>
        <span>
          {tx.best}: <span style={{ color: '#00a99f' }}>{best}</span>
        </span>
        <span>
          {tx.scoreLabel}: <span style={{ color: '#14110c' }}>{score}</span>
        </span>
      </div>

      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '☰'}
        screenGradient={
          tool?.arcade.screenGradient ?? 'linear-gradient(160deg,#f3efe6,#fffdf7)'
        }
      >
        {loading ? (
          <p style={{ fontFamily: mono, fontSize: '0.8rem', color: 'rgba(20,17,12,0.5)' }}>
            {tx.loading}
          </p>
        ) : null}

        {error && phase === 'error' ? (
          <p role="alert" style={{ margin: 0, fontFamily: mono, fontSize: '0.82rem', color: '#8a2a2a' }}>
            {error}
          </p>
        ) : null}

        {!loading && phase === 'idle' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.62)' }}>
              {tx.howto}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(20,17,12,0.55)', fontSize: '0.86rem' }}>
              {sources.map((s) => (
                <li key={s.id}>
                  <strong style={{ color: '#14110c' }}>{s.name}</strong> — {s.meta}
                </li>
              ))}
            </ul>
            <button type="button" className="arcade-start-btn" onClick={onStart} disabled={pool.length === 0}>
              {tx.submit}
            </button>
          </div>
        ) : null}

        {current && (phase === 'playing' || phase === 'won' || phase === 'lost') ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <p
              style={{
                margin: 0,
                fontFamily: mono,
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                color: 'rgba(20,17,12,0.4)',
              }}
            >
              {tx.headlineLabel}
            </p>
            <h3 style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.35, color: '#14110c' }}>
              {current.title}
            </h3>
            {current.summary ? (
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.58)' }}>
                {current.summary}
              </p>
            ) : null}

            <div style={{ display: 'grid', gap: 8 }}>
              {sources.map((s) => {
                const isCorrect = s.id === current.sourceId;
                const isPick = pick === s.id;
                let bg = '#f3f0e8';
                let color = '#14110c';
                if (phase !== 'playing') {
                  if (isCorrect) {
                    bg = '#d8eeeb';
                    color = '#008f86';
                  } else if (isPick) {
                    bg = '#f3e0e0';
                    color = '#8a2a2a';
                  }
                }
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={phase !== 'playing'}
                    onClick={() => onGuess(s.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 0,
                      border: 'none',
                      background: bg,
                      color,
                      cursor: phase === 'playing' ? 'pointer' : 'default',
                      fontFamily: mono,
                      fontSize: '0.82rem',
                    }}
                  >
                    {s.name}
                    <span style={{ display: 'block', marginTop: 4, fontSize: '0.68rem', opacity: 0.55 }}>
                      {s.meta}
                    </span>
                  </button>
                );
              })}
            </div>

            {phase === 'won' || phase === 'lost' ? (
              <div className="arcade-score-card" style={{ display: 'grid', gap: 10 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: mono,
                    fontSize: '0.78rem',
                    color: phase === 'won' ? '#00a99f' : '#8a2a2a',
                  }}
                >
                  {phase === 'won' ? tx.win : `${tx.lose} — ${current.sourceName}`}
                </p>
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: mono,
                    fontSize: '0.72rem',
                    color: '#008f86',
                    textDecoration: 'none',
                  }}
                >
                  {tx.readSource} →
                </a>
                <button type="button" className="arcade-start-btn" onClick={() => deal(pool)}>
                  {tx.nextRound}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </ArcadeCabinetFrame>

      <p
        style={{
          marginTop: 16,
          maxWidth: 720,
          fontFamily: mono,
          fontSize: '0.68rem',
          color: 'rgba(20,17,12,0.38)',
          lineHeight: 1.5,
        }}
      >
        {tx.disclaimer}
      </p>
    </ArcadeLayout>
  );
}
