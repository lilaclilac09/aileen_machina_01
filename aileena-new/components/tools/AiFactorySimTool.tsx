'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ArcadeLayout from './ArcadeLayout';

type RackVariant = 'GB200 NVL72' | 'GB300 NVL72';
type Scenario = 'balanced' | 'overpack' | 'cooldown';

type Preset = {
  label: string;
  scenario: Scenario;
  variant: RackVariant;
  rackCount: number;
  aiLoad: number;
  cooling: number;
  ambient: number;
};

const PRESETS: Preset[] = [
  { label: 'balanced', scenario: 'balanced', variant: 'GB200 NVL72', rackCount: 34, aiLoad: 68, cooling: 72, ambient: 28 },
  { label: 'overpack', scenario: 'overpack', variant: 'GB300 NVL72', rackCount: 48, aiLoad: 92, cooling: 54, ambient: 34 },
  { label: 'cooldown', scenario: 'cooldown', variant: 'GB300 NVL72', rackCount: 42, aiLoad: 58, cooling: 88, ambient: 24 },
];

const RACKS = Array.from({ length: 48 }, (_, i) => i);

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function heatTone(score: number) {
  if (score > 78) return '#e36f45';
  if (score > 58) return '#d4a24a';
  if (score > 36) return '#9fc776';
  return '#64c7bd';
}

export default function AiFactorySimTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.aiFactorySim;
  const [variant, setVariant] = useState<RackVariant>('GB300 NVL72');
  const [rackCount, setRackCount] = useState(40);
  const [aiLoad, setAiLoad] = useState(76);
  const [cooling, setCooling] = useState(66);
  const [ambient, setAmbient] = useState(30);
  const [scenario, setScenario] = useState<Scenario>('balanced');

  const model = useMemo(() => {
    const rackKw = variant === 'GB300 NVL72' ? 145 : 120;
    const powerMw = (rackCount * rackKw * (0.42 + aiLoad / 170)) / 1000;
    const designMw = 7.2;
    const powerHeadroom = clamp(((designMw - powerMw) / designMw) * 100, -40, 100);
    const thermalIndex = clamp(aiLoad * 0.62 + rackCount * 0.82 + ambient * 1.05 - cooling * 0.78);
    const flowMargin = clamp(cooling - aiLoad * 0.38 - ambient * 0.42 + (variant === 'GB200 NVL72' ? 8 : 0), -20, 100);
    const status =
      thermalIndex > 78 || powerHeadroom < 8
        ? tx.status.hot
        : flowMargin < 22
          ? tx.status.watch
          : tx.status.stable;
    const statusTone = status === tx.status.hot ? '#e36f45' : status === tx.status.watch ? '#d4a24a' : '#00a99f';

    return {
      powerMw,
      powerHeadroom,
      thermalIndex,
      flowMargin,
      status,
      statusTone,
    };
  }, [ambient, aiLoad, cooling, rackCount, tx.status.hot, tx.status.stable, tx.status.watch, variant]);

  function applyPreset(preset: Preset) {
    setScenario(preset.scenario);
    setVariant(preset.variant);
    setRackCount(preset.rackCount);
    setAiLoad(preset.aiLoad);
    setCooling(preset.cooling);
    setAmbient(preset.ambient);
  }

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <section className="ai-factory-sim" data-testid="ai-factory-sim">
        <div className="ai-factory-panel ai-factory-panel--wide">
          <div className="ai-factory-topline">
            <span>{tx.sourceLabel}</span>
            <a
              href="https://github.com/NVIDIA-Omniverse-blueprints/omniverse-dsx-blueprint-for-ai-factories"
              target="_blank"
              rel="noopener noreferrer"
            >
              DSX blueprint ↗
            </a>
          </div>

          <div className="ai-factory-stage" data-scenario={scenario}>
            <div className="ai-factory-stage-grid" aria-hidden>
              {RACKS.map((rack) => {
                const active = rack < rackCount;
                const row = Math.floor(rack / 8);
                const column = rack % 8;
                const aislePenalty = column === 3 || column === 4 ? 9 : 0;
                const edgePenalty = row === 0 || row === 5 ? 7 : 0;
                const heat = active
                  ? clamp(model.thermalIndex + aislePenalty + edgePenalty + (rack % 3) * 3 - cooling * 0.12)
                  : 0;
                return (
                  <span
                    key={rack}
                    className={active ? 'ai-factory-rack ai-factory-rack--active' : 'ai-factory-rack'}
                    style={{
                      background: active ? heatTone(heat) : 'rgba(20,17,12,0.08)',
                      opacity: active ? 0.62 + heat / 280 : 0.24,
                    }}
                    aria-hidden
                  />
                );
              })}
            </div>
            <div className="ai-factory-air" style={{ ['--air-speed' as string]: `${Math.max(4, 13 - cooling / 10)}s` }} aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div className="ai-factory-status">
              <span className="ai-factory-led" style={{ background: model.statusTone }} />
              <strong>{model.status}</strong>
            </div>
          </div>

          <div className="ai-factory-readouts" aria-live="polite">
            <Readout label={tx.readouts.power} value={`${model.powerMw.toFixed(1)} MW`} />
            <Readout label={tx.readouts.thermal} value={`${Math.round(model.thermalIndex)}/100`} />
            <Readout label={tx.readouts.flow} value={`${Math.round(model.flowMargin)}%`} />
            <Readout label={tx.readouts.headroom} value={`${Math.round(model.powerHeadroom)}%`} />
          </div>
        </div>

        <div className="ai-factory-panel">
          <p className="ai-factory-kicker">{tx.presetLabel}</p>
          <div className="ai-factory-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.scenario}
                type="button"
                className={scenario === preset.scenario ? 'ai-factory-preset ai-factory-preset--active' : 'ai-factory-preset'}
                onClick={() => applyPreset(preset)}
                data-testid={`ai-factory-preset-${preset.scenario}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <fieldset className="ai-factory-variant">
            <legend>{tx.variantLabel}</legend>
            {(['GB200 NVL72', 'GB300 NVL72'] as const).map((nextVariant) => (
              <button
                key={nextVariant}
                type="button"
                className={variant === nextVariant ? 'ai-factory-chip ai-factory-chip--active' : 'ai-factory-chip'}
                onClick={() => setVariant(nextVariant)}
                aria-pressed={variant === nextVariant}
              >
                {nextVariant}
              </button>
            ))}
          </fieldset>

          <Control label={tx.controls.racks} value={rackCount} min={18} max={48} suffix="" onChange={setRackCount} testId="rack-count" />
          <Control label={tx.controls.load} value={aiLoad} min={20} max={100} suffix="%" onChange={setAiLoad} testId="ai-load" />
          <Control label={tx.controls.cooling} value={cooling} min={30} max={100} suffix="%" onChange={setCooling} testId="cooling" />
          <Control label={tx.controls.ambient} value={ambient} min={18} max={40} suffix="C" onChange={setAmbient} testId="ambient" />

          <p className="ai-factory-note">{tx.note}</p>
          <Link href="/blog/dell-nvidia-flywheel" className="ai-factory-link">
            {tx.related}
          </Link>
        </div>
      </section>
    </ArcadeLayout>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="ai-factory-readout">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Control({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
  testId: string;
}) {
  return (
    <label className="ai-factory-control">
      <span>
        {label}
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        data-testid={`ai-factory-${testId}`}
      />
      <div className="ai-factory-nudges" aria-label={`${label} nudges`}>
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1, min, max))}
          aria-label={`Lower ${label}`}
          data-testid={`ai-factory-${testId}-down`}
        >
          -
        </button>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1, min, max))}
          aria-label={`Raise ${label}`}
          data-testid={`ai-factory-${testId}-up`}
        >
          +
        </button>
      </div>
    </label>
  );
}
