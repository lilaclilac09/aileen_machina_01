'use client';

import { useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

const SCENARIOS = ['customer', 'meeting', 'ticket'] as const;

type Answer = {
  type?: string;
  choice?: string;
  score?: number;
  noul?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  legend?: Record<string, string>;
};

const LOW_CONFIDENCE = 0.5;
const TOSS_UP = 0.1;

export default function IntentAggregatorTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.intentAggregator;
  const tool = getToolBySlug('intent');
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]>('customer');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggested, setSuggested] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer> | null>(null);

  async function onAnalyze() {
    setBusy(true);
    setError('');
    setSuggested('');
    setAnswers(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, text }),
      });
      const body = (await res.json()) as {
        error?: string;
        suggested_action?: string;
        answers?: Record<string, Answer>;
      };
      if (!res.ok) {
        setError(body.error || tx.failed);
        return;
      }
      setSuggested(body.suggested_action || '');
      setAnswers(body.answers || {});
    } catch {
      setError(tx.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} backLabel={tx.back} marquee={tx.marquee}>
      <div style={{ display: 'grid', gap: 28, maxWidth: 720, margin: '0 auto' }} data-testid="intent-aggregator">
        <ArcadeCabinetFrame glyph={tool?.arcade.glyph ?? '∴'} screenGradient={tool?.arcade.screenGradient ?? '#e7e4f0'}>
          <form
            style={{ display: 'grid', gap: 14 }}
            onSubmit={(event) => {
              event.preventDefault();
              void onAnalyze();
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={labelStyle}>{tx.scenarioLabel}</span>
              <select
                value={scenario}
                onChange={(event) => setScenario(event.target.value as (typeof SCENARIOS)[number])}
                style={fieldStyle}
                data-testid="intent-scenario"
              >
                {SCENARIOS.map((id) => (
                  <option key={id} value={id}>
                    {tx.scenarios[id]}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={labelStyle}>{tx.textLabel}</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={tx.textPlaceholder}
                rows={7}
                style={{ ...fieldStyle, resize: 'vertical', minHeight: 140 }}
                data-testid="intent-text"
              />
            </label>
            <button type="submit" className="arcade-start-btn" disabled={busy} data-testid="intent-analyze">
              {busy ? tx.analyzing : tx.analyze}
            </button>
          </form>
        </ArcadeCabinetFrame>

        {error ? (
          <p role="alert" style={{ margin: 0, color: '#8a3b2a' }} data-testid="intent-error">
            {error}
          </p>
        ) : null}

        {suggested ? (
          <section style={{ display: 'grid', gap: 8 }} data-testid="intent-result">
            <h2 style={labelStyle}>{tx.suggested}</h2>
            <p style={{ margin: 0, fontFamily: mono, fontSize: '1.05rem', color: '#14110c' }}>{suggested}</p>
          </section>
        ) : null}

        {answers
          ? Object.entries(answers).map(([id, answer]) => <AnswerCard key={id} id={id} answer={answer} copy={tx} />)
          : null}
      </div>
    </ArcadeLayout>
  );
}

function AnswerCard({
  id,
  answer,
  copy,
}: {
  id: string;
  answer: Answer;
  copy: { referenceOnly: string; tossUp: string; confidence: string };
}) {
  const low = typeof answer.confidence === 'number' && answer.confidence < LOW_CONFIDENCE;
  const toss = answer.type === 'noul' && typeof answer.noul === 'number' && Math.abs(answer.noul - 0.5) < TOSS_UP;
  const primary =
    answer.type === 'choice'
      ? answer.choice
      : answer.type === 'score'
        ? String(answer.score ?? '')
        : answer.type === 'noul'
          ? String(answer.noul ?? '')
          : '';

  return (
    <article
      style={{
        display: 'grid',
        gap: 8,
        opacity: low ? 0.55 : 1,
      }}
      data-testid={`intent-answer-${id}`}
    >
      <h3 style={{ ...labelStyle, margin: 0 }}>{id}</h3>
      <p style={{ margin: 0, color: '#14110c' }}>
        {primary}
        {typeof answer.confidence === 'number' ? (
          <span style={{ marginLeft: 10, fontFamily: mono, fontSize: '0.75rem', color: 'rgba(20,17,12,0.55)' }}>
            {copy.confidence} {answer.confidence.toFixed(2)}
          </span>
        ) : null}
      </p>
      {low ? (
        <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em' }}>{copy.referenceOnly}</p>
      ) : null}
      {toss ? (
        <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem' }}>{copy.tossUp}</p>
      ) : null}
      {answer.probabilities ? <Bars probabilities={answer.probabilities} legend={answer.legend} /> : null}
    </article>
  );
}

function Bars({
  probabilities,
  legend,
}: {
  probabilities: Record<string, number>;
  legend?: Record<string, string>;
}) {
  const rows = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {rows.map(([key, value]) => {
        const width = Math.max(0, Math.min(100, Math.round(value * 100)));
        const name = legend?.[key] ?? key;
        return (
          <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 42px', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.62)' }}>{name}</span>
            <span style={{ display: 'block', height: 8, background: 'rgba(20,17,12,0.08)' }}>
              <span style={{ display: 'block', height: '100%', width: `${width}%`, background: '#1f6f68' }} />
            </span>
            <span style={{ fontFamily: mono, fontSize: '0.72rem' }}>{width}%</span>
          </div>
        );
      })}
    </div>
  );
}

const labelStyle = {
  fontFamily: mono,
  fontSize: '0.72rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'rgba(20,17,12,0.48)',
};

const fieldStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 0,
  background: '#f7f4ee',
  color: '#14110c',
  padding: '12px 14px',
  fontFamily: mono,
  fontSize: '0.85rem',
};
