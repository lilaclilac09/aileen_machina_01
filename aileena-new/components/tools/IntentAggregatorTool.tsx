'use client';

import { useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame } from './ArcadeLayout';

const SCENARIOS = ['customer', 'meeting', 'ticket'] as const;
type Scenario = (typeof SCENARIOS)[number];

type Answer = {
  type: 'choice' | 'score' | 'noul';
  choice?: string;
  score?: number;
  noul?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  legend?: Record<string, string>;
};

type MockResult = {
  suggested_action: string;
  answers: Record<string, Answer>;
};

const EXAMPLES: Record<Scenario, string> = {
  customer:
    'The order is five days late and still not here. I want a full refund today, or I will post a public complaint.',
  meeting:
    'Weekly meeting: the boss interrupted twice about rising CAC. They want ROI by channel and postponed the decision.',
  ticket: 'My invoice shows a double charge this month. Please fix it ASAP.',
};

// Same mock as intent-aggregator/static/index.html. The button does not call /api/analyze.
const MOCK: Record<Scenario, MockResult> = {
  customer: {
    suggested_action: 'Hand off',
    answers: {
      intent: {
        type: 'choice',
        choice: 'Refund',
        confidence: 0.78,
        probabilities: { Order: 0.01, Ask: 0.02, Complaint: 0.13, Refund: 0.82, Compare: 0, Chat: 0, Unclear: 0.02 },
      },
      urgency: {
        type: 'score',
        score: 2.4,
        confidence: 0.81,
        legend: { '0': 'Not urgent', '1': 'Normal', '2': 'Urgent', '3': 'Critical' },
      },
      needs_human: { type: 'noul', noul: 0.91 },
      next_action: {
        type: 'choice',
        choice: 'Hand off',
        confidence: 0.42,
        probabilities: { 'Auto-reply': 0.18, 'Open a ticket': 0.27, 'Hand off': 0.42, 'Follow up': 0.13 },
      },
    },
  },
  meeting: {
    suggested_action: 'Prepare a revision',
    answers: {
      stance: {
        type: 'choice',
        choice: 'Unsure',
        confidence: 0.74,
        probabilities: { Support: 0.16, Unsure: 0.61, Oppose: 0.14, Unclear: 0.09 },
      },
      resistance: {
        type: 'score',
        score: 1.8,
        confidence: 0.7,
        legend: { '0': 'None', '1': 'Slight doubt', '2': 'Pushback', '3': 'Strong no' },
      },
      wants_revision: { type: 'noul', noul: 0.88 },
      next_action: {
        type: 'choice',
        choice: 'Send back',
        confidence: 0.76,
        probabilities: { Approve: 0.08, 'Send back': 0.71, Shelve: 0.16, Escalate: 0.05 },
      },
    },
  },
  ticket: {
    suggested_action: 'Rush billing',
    answers: {
      department: {
        type: 'choice',
        choice: 'Billing',
        confidence: 0.86,
        probabilities: { Billing: 0.84, Technical: 0.09, Sales: 0.07 },
      },
      is_urgent: { type: 'noul', noul: 0.93 },
    },
  },
};

const LABELS: Record<string, string> = {
  intent: 'Intent',
  urgency: 'Urgency',
  needs_human: 'Needs a person',
  next_action: 'Next step',
  stance: 'Stance',
  resistance: 'Pushback',
  wants_revision: 'Wants a real edit',
  department: 'Department',
  is_urgent: 'Urgent',
};

const SCENARIO_LABEL: Record<Scenario, string> = {
  customer: 'Customer intent',
  meeting: 'Meeting read',
  ticket: 'Ticket routing',
};

export default function IntentAggregatorTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.intentAggregator;
  const tool = getToolBySlug('intent');
  const [scenario, setScenario] = useState<Scenario>('customer');
  const [text, setText] = useState('');
  const [suggested, setSuggested] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer> | null>(null);

  function onAnalyze() {
    const data = MOCK[scenario];
    setSuggested(data.suggested_action);
    setAnswers(data.answers);
  }

  return (
    <ArcadeLayout
      tag="DEMO"
      title="Intent Aggregator Demo"
      subtitle="Paste a note. The result below is demo data: what they want, how sure we are, and what to do next."
      backLabel={tx.back}
      marquee="INTENT · DEMO DATA · REAL API NOT CALLED"
      demoVideo="/demos/intent-aggregator.mp4"
    >
      <div className="intent-demo" data-testid="intent-aggregator">
        <span className="intent-demo-badge">Demo data. Real API not called.</span>
        <ArcadeCabinetFrame glyph={tool?.arcade.glyph ?? '∴'} screenGradient={tool?.arcade.screenGradient ?? '#e7e4f0'}>
          <form
            style={{ display: 'grid', gap: 14 }}
            onSubmit={(event) => {
              event.preventDefault();
              onAnalyze();
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={labelStyle}>Scenario</span>
              <select
                value={scenario}
                onChange={(event) => setScenario(event.target.value as Scenario)}
                style={fieldStyle}
                data-testid="intent-scenario"
              >
                {SCENARIOS.map((id) => (
                  <option key={id} value={id}>
                    {SCENARIO_LABEL[id]}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={labelStyle}>Text</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste a customer message, meeting note, or ticket."
                rows={7}
                style={{ ...fieldStyle, resize: 'vertical', minHeight: 140, fontFamily: 'inherit' }}
                data-testid="intent-text"
              />
            </label>
            <div className="intent-demo-actions">
              <button
                type="button"
                className="intent-demo-sample"
                data-testid="intent-sample"
                onClick={() => setText(EXAMPLES[scenario])}
              >
                Fill example
              </button>
              <button type="submit" className="arcade-start-btn" data-testid="intent-analyze">
                Analyze
              </button>
            </div>
          </form>
        </ArcadeCabinetFrame>

        {suggested ? (
          <article className="intent-demo-card" data-testid="intent-result">
            <h2>Suggested action</h2>
            <div className="intent-demo-value">{suggested}</div>
          </article>
        ) : null}

        {answers
          ? Object.entries(answers).map(([id, answer]) => <AnswerCard key={id} id={id} answer={answer} />)
          : null}
      </div>
    </ArcadeLayout>
  );
}

function AnswerCard({ id, answer }: { id: string; answer: Answer }) {
  const confidence = displayConfidence(answer);
  const low = confidence < 0.5;
  return (
    <article className={low ? 'intent-demo-card is-low' : 'intent-demo-card'} data-testid={`intent-answer-${id}`}>
      <div className="intent-demo-head">
        <h3>{LABELS[id] || id}</h3>
        {low ? <span className="intent-demo-tag">For reference only</span> : null}
      </div>
      <div className="intent-demo-value">{winning(answer)}</div>
      <div className="intent-demo-meta">Confidence {confidence.toFixed(2)}</div>
      {answer.type === 'choice' && answer.probabilities ? <Bars probabilities={answer.probabilities} /> : null}
      {answer.type === 'score' ? <ScoreScale answer={answer} /> : null}
      {answer.type === 'noul' && typeof answer.noul === 'number' ? <Gauge noul={answer.noul} /> : null}
    </article>
  );
}

// displayConfidence is for the demo UI only.
// A real noul answer is { noul } and has no confidence field.
function displayConfidence(answer: Answer): number {
  if (typeof answer.confidence === 'number') return answer.confidence;
  const noul = Number(answer.noul);
  return Math.min(0.95, 0.55 + Math.abs(noul - 0.5));
}

function winning(answer: Answer): string {
  if (answer.type === 'choice') return answer.choice || '';
  if (answer.type === 'score') {
    const score = Number(answer.score);
    const nearest = String(Math.max(0, Math.min(3, Math.round(score))));
    const label = answer.legend?.[nearest];
    return `${score.toFixed(1)}${label ? ` · ${label}` : ''}`;
  }
  return Number(answer.noul) >= 0.5 ? 'Yes' : 'No';
}

function Bars({ probabilities }: { probabilities: Record<string, number> }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {Object.entries(probabilities).map(([key, value]) => {
        const width = Math.max(0, Math.min(100, Math.round(value * 100)));
        return (
          <div key={key} className="intent-demo-bar">
            <span>{key}</span>
            <span className="intent-demo-track">
              <span className="intent-demo-fill" style={{ width: `${width}%` }} />
            </span>
            <span>{width}%</span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreScale({ answer }: { answer: Answer }) {
  const ratio = Math.max(0, Math.min(1, Number(answer.score) / 3));
  return (
    <div>
      <div className="intent-demo-rail">
        <i className="intent-demo-pin" style={{ left: `${ratio * 100}%` }} />
      </div>
      <div className="intent-demo-ticks">
        {[0, 1, 2, 3].map((level) => (
          <span key={level}>
            {level} {answer.legend?.[String(level)] || ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Gauge({ noul }: { noul: number }) {
  return (
    <div>
      <div className="intent-demo-gauge-labels">
        <span>No</span>
        <span>Yes {Math.round(noul * 100)}%</span>
      </div>
      <div className="intent-demo-gauge">
        <i className="intent-demo-mark" style={{ left: `${Math.max(0, Math.min(100, noul * 100))}%` }} />
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: '0.82rem',
  color: 'rgba(20,17,12,0.55)',
};

const fieldStyle = {
  width: '100%',
  border: '1px solid #e6ebf1',
  borderRadius: 12,
  background: '#fbfcfd',
  color: '#14110c',
  padding: '12px 14px',
  fontSize: '0.95rem',
};
