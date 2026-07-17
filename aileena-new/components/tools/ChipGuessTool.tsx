'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import {
  pickRound,
  scoreForAttempt,
  type ChipClue,
  type ChipClueSource,
} from '../../lib/tools/chipGuess';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

type Round = {
  correct: ChipClueSource;
  clues: ChipClue[];
  choices: string[];
};

type Phase = 'idle' | 'playing' | 'won' | 'lost' | 'error';

export default function ChipGuessTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.chipGuess;
  const tool = getToolBySlug('chip-guess');

  const [pool, setPool] = useState<ChipClueSource[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const startRound = useCallback(
    (chips: ChipClueSource[]) => {
      const next = pickRound(chips);
      if (!next) {
        setPhase('error');
        setLoadError(tx.errors.empty);
        return;
      }
      setRound(next);
      setAttempt(0);
      setSelected(null);
      setPhase('playing');
      setLastScore(0);
    },
    [tx.errors.empty],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/chips?limit=100');
        const json = (await res.json()) as {
          ok: boolean;
          data?: { items: ChipClueSource[] };
          error?: { message: string };
        };
        if (!json.ok || !json.data?.items?.length) {
          if (!cancelled) {
            setLoadError(json.error?.message ?? tx.errors.load);
            setPhase('error');
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setPool(json.data.items);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError(tx.errors.network);
          setPhase('error');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tx.errors.load, tx.errors.network]);

  function onPressStart() {
    if (pool.length === 0) return;
    startRound(pool);
  }

  function onPick(choice: string) {
    if (phase !== 'playing' || !round || selected) return;
    setSelected(choice);
    const correct = choice === round.correct.sku;
    if (correct) {
      const pts = scoreForAttempt(true, attempt);
      setLastScore(pts);
      setTotalScore((s) => s + pts);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setPhase('won');
      return;
    }
    const nextAttempt = attempt + 1;
    if (nextAttempt >= 3) {
      setStreak(0);
      setPhase('lost');
      return;
    }
    setAttempt(nextAttempt);
    setSelected(null);
  }

  function onNext() {
    startRound(pool);
  }

  const livesLeft = 3 - attempt;

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      backHref="/tools"
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
          {tx.best}: <span style={{ color: '#00a99f' }}>{bestStreak}</span>
        </span>
        <span>
          {tx.scoreLabel}: <span style={{ color: '#14110c' }}>{totalScore}</span>
        </span>
      </div>

      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '◈'}
        screenGradient={
          tool?.arcade.screenGradient ?? 'linear-gradient(160deg,#eef1f8,#f4f1ea)'
        }
      >
        {loading ? (
          <p style={{ fontFamily: mono, fontSize: '0.8rem', color: 'rgba(20,17,12,0.5)' }}>
            {tx.loading}
          </p>
        ) : null}

        {loadError && phase === 'error' ? (
          <p
            role="alert"
            style={{
              fontFamily: mono,
              fontSize: '0.82rem',
              color: '#8a2a2a',
              margin: 0,
            }}
          >
            {loadError}
          </p>
        ) : null}

        {!loading && phase === 'idle' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.62)' }}>
              {tx.howto}
            </p>
            <button type="button" className="arcade-start-btn" onClick={onPressStart}>
              {tx.submit}
            </button>
          </div>
        ) : null}

        {round && (phase === 'playing' || phase === 'won' || phase === 'lost') ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: mono,
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                color: 'rgba(20,17,12,0.45)',
              }}
            >
              <span>{tx.cluesTitle}</span>
              <span style={{ color: livesLeft > 1 ? '#00a99f' : '#c9872f' }}>
                {tx.lives}: {'●'.repeat(livesLeft)}
                {'○'.repeat(3 - livesLeft)}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 8,
              }}
            >
              {round.clues.map((c) => (
                <div
                  key={c.label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(20,17,12,0.1)',
                    background: '#fffdf7',
                  }}
                >
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: '0.58rem',
                      letterSpacing: '0.12em',
                      color: 'rgba(20,17,12,0.38)',
                      marginBottom: 4,
                    }}
                  >
                    {c.label}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#14110c' }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {round.choices.map((choice) => {
                const isCorrect = choice === round.correct.sku;
                const isPick = selected === choice;
                let border = '1px solid rgba(20,17,12,0.12)';
                let bg = '#fffdf7';
                let color = '#14110c';
                if (phase === 'won' || phase === 'lost') {
                  if (isCorrect) {
                    border = '2px solid rgba(0,169,159,0.55)';
                    bg = 'rgba(0,169,159,0.14)';
                    color = '#008f86';
                  } else if (isPick) {
                    border = '2px solid rgba(180,40,40,0.45)';
                    bg = 'rgba(180,40,40,0.1)';
                    color = '#8a2a2a';
                  }
                } else if (isPick) {
                  border = '2px solid rgba(0,169,159,0.4)';
                  bg = 'rgba(0,169,159,0.1)';
                }
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={phase !== 'playing'}
                    onClick={() => onPick(choice)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border,
                      background: bg,
                      color,
                      cursor: phase === 'playing' ? 'pointer' : 'default',
                      fontFamily: mono,
                      fontSize: '0.82rem',
                    }}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {phase === 'won' ? (
              <div className="arcade-score-card" style={{ display: 'grid', gap: 10 }}>
                <p style={{ margin: 0, fontFamily: mono, fontSize: '0.78rem', color: '#00a99f' }}>
                  {tx.win} · +{lastScore} {tx.scoreLabel}
                </p>
                <button type="button" className="arcade-start-btn" onClick={onNext}>
                  {tx.nextRound}
                </button>
              </div>
            ) : null}

            {phase === 'lost' ? (
              <div className="arcade-score-card" style={{ display: 'grid', gap: 10 }}>
                <p style={{ margin: 0, fontFamily: mono, fontSize: '0.78rem', color: '#8a2a2a' }}>
                  {tx.lose} — {round.correct.sku}
                </p>
                <button type="button" className="arcade-start-btn" onClick={onNext}>
                  {tx.tryAgain}
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
