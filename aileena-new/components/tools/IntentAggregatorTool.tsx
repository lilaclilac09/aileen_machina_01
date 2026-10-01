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
  customer: '订单已经晚了五天还没送到。我今天就要全额退款，不然我就发到社交平台公开投诉你们。',
  meeting: '周会摘录：老板两次打断，说获客成本还在涨。他要看每个渠道的投入产出，这个方案先不拍板，决定推迟。',
  ticket: '我的发票显示这个月被扣了两次款，请尽快改掉。',
};

// Same mock as intent-aggregator/static/index.html. The button does not call /api/analyze.
const MOCK: Record<Scenario, MockResult> = {
  customer: {
    suggested_action: '转人工',
    answers: {
      intent: {
        type: 'choice',
        choice: '退款',
        confidence: 0.78,
        probabilities: { 下单: 0.01, 咨询: 0.02, 投诉: 0.13, 退款: 0.82, 比价: 0, 闲聊: 0, 无法判断: 0.02 },
      },
      urgency: {
        type: 'score',
        score: 2.4,
        confidence: 0.81,
        legend: { '0': '不急', '1': '一般', '2': '急', '3': '非常急' },
      },
      needs_human: { type: 'noul', noul: 0.91 },
      next_action: {
        type: 'choice',
        choice: '转人工',
        confidence: 0.42,
        probabilities: { 自动回复: 0.18, 建工单: 0.27, 转人工: 0.42, 跟进回访: 0.13 },
      },
    },
  },
  meeting: {
    suggested_action: '准备修改版',
    answers: {
      stance: {
        type: 'choice',
        choice: '存疑',
        confidence: 0.74,
        probabilities: { 支持: 0.16, 存疑: 0.61, 反对: 0.14, 无法判断: 0.09 },
      },
      resistance: {
        type: 'score',
        score: 1.8,
        confidence: 0.7,
        legend: { '0': '无抵触', '1': '轻微疑虑', '2': '明显抵触', '3': '强烈反对' },
      },
      wants_revision: { type: 'noul', noul: 0.88 },
      next_action: {
        type: 'choice',
        choice: '打回修改',
        confidence: 0.76,
        probabilities: { 通过: 0.08, 打回修改: 0.71, 搁置: 0.16, 上报: 0.05 },
      },
    },
  },
  ticket: {
    suggested_action: '账单组加急',
    answers: {
      department: {
        type: 'choice',
        choice: '账单',
        confidence: 0.86,
        probabilities: { 账单: 0.84, 技术: 0.09, 销售: 0.07 },
      },
      is_urgent: { type: 'noul', noul: 0.93 },
    },
  },
};

const LABELS: Record<string, string> = {
  intent: '意图',
  urgency: '紧急程度',
  needs_human: '是否转人工',
  next_action: '下一步',
  stance: '立场',
  resistance: '抵触程度',
  wants_revision: '是否要求实质性修改',
  department: '部门',
  is_urgent: '是否紧急',
};

const SCENARIO_LABEL: Record<Scenario, string> = {
  customer: '客户意图',
  meeting: '会议判断',
  ticket: '工单路由',
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
      title="意图聚合器 Demo"
      subtitle="贴一段文字。下面是演示结果：想做什么、有多确定、下一步做什么。"
      backLabel={tx.back}
      marquee="意图聚合器 · 演示数据 · 未调用真实 API"
    >
      <div className="intent-demo" data-testid="intent-aggregator">
        <span className="intent-demo-badge">演示数据，未调用真实 API</span>
        <ArcadeCabinetFrame glyph={tool?.arcade.glyph ?? '∴'} screenGradient={tool?.arcade.screenGradient ?? '#e7e4f0'}>
          <form
            style={{ display: 'grid', gap: 14 }}
            onSubmit={(event) => {
              event.preventDefault();
              onAnalyze();
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={labelStyle}>场景</span>
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
              <span style={labelStyle}>原文</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="贴一段客户消息、会议记录或工单。"
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
                填入示例
              </button>
              <button type="submit" className="arcade-start-btn" data-testid="intent-analyze">
                分析意图
              </button>
            </div>
          </form>
        </ArcadeCabinetFrame>

        {suggested ? (
          <article className="intent-demo-card" data-testid="intent-result">
            <h2>建议动作</h2>
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
        {low ? <span className="intent-demo-tag">仅供参考</span> : null}
      </div>
      <div className="intent-demo-value">{winning(answer)}</div>
      <div className="intent-demo-meta">置信度 {confidence.toFixed(2)}</div>
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
  return Number(answer.noul) >= 0.5 ? '是' : '否';
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
        <span>否</span>
        <span>是 {Math.round(noul * 100)}%</span>
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
