'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ArcadeLayout from './ArcadeLayout';
import { POWER_PATH_FACTS, RACK_FACTS, type EvidenceLevel, type RackFactSheet, type RackVariant } from '../../lib/ai-factory/rack-facts';

type PowerPath = 'legacy-ac' | '800v-sidecar' | 'facility-hvdc';
type Scenario = 'balanced' | 'overpack' | 'cooldown';
type GapKey = 'coolingAc' | 'gridDelay' | 'schedulerTail' | 'modularClaims';

type Preset = {
  label: string;
  scenario: Scenario;
  variant: RackVariant;
  powerPath: PowerPath;
  rackCount: number;
  aiLoad: number;
  cooling: number;
  ambient: number;
  gaps: Record<GapKey, boolean>;
};

const PRESETS: Preset[] = [
  {
    label: 'balanced',
    scenario: 'balanced',
    variant: 'GB300 NVL72',
    powerPath: 'legacy-ac',
    rackCount: 34,
    aiLoad: 68,
    cooling: 72,
    ambient: 28,
    gaps: { coolingAc: true, gridDelay: false, schedulerTail: false, modularClaims: false },
  },
  {
    label: 'overpack',
    scenario: 'overpack',
    variant: 'VR NVL72',
    powerPath: '800v-sidecar',
    rackCount: 44,
    aiLoad: 90,
    cooling: 54,
    ambient: 34,
    gaps: { coolingAc: true, gridDelay: true, schedulerTail: true, modularClaims: true },
  },
  {
    label: 'cooldown',
    scenario: 'cooldown',
    variant: 'GB300 NVL72',
    powerPath: 'facility-hvdc',
    rackCount: 38,
    aiLoad: 58,
    cooling: 88,
    ambient: 24,
    gaps: { coolingAc: false, gridDelay: false, schedulerTail: false, modularClaims: false },
  },
];

const RACKS = Array.from({ length: 48 }, (_, i) => i);
const POWER_PATHS: PowerPath[] = ['legacy-ac', '800v-sidecar', 'facility-hvdc'];
const GAP_KEYS: GapKey[] = ['coolingAc', 'gridDelay', 'schedulerTail', 'modularClaims'];

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
  const [powerPath, setPowerPath] = useState<PowerPath>('legacy-ac');
  const [rackCount, setRackCount] = useState(40);
  const [aiLoad, setAiLoad] = useState(76);
  const [cooling, setCooling] = useState(66);
  const [ambient, setAmbient] = useState(30);
  const [scenario, setScenario] = useState<Scenario>('balanced');
  const [gaps, setGaps] = useState<Record<GapKey, boolean>>({
    coolingAc: true,
    gridDelay: false,
    schedulerTail: false,
    modularClaims: false,
  });
  const rackFact = RACK_FACTS[variant];
  const powerPathFact = POWER_PATH_FACTS[powerPath];

  const model = useMemo(() => {
    const rackKw = rackFact.rackPowerKw;
    const powerLossRate = powerPathFact.lossRate;
    const designMw = (rackCount * rackKw * powerPathFact.envelopeMultiplier) / 1000;
    const itPowerMw = (rackCount * rackKw * (0.42 + aiLoad / 170)) / 1000;
    const gapTaxMw =
      (gaps.coolingAc ? itPowerMw * 0.025 : 0) +
      (gaps.gridDelay ? 0.35 : 0) +
      (gaps.schedulerTail ? itPowerMw * 0.018 : 0) +
      (gaps.modularClaims ? 0.18 : 0);
    const facilityMw = itPowerMw * (1 + powerLossRate) + gapTaxMw;
    const powerHeadroom = clamp(((designMw - facilityMw) / designMw) * 100, -40, 100);
    const liquidCredit = rackFact.coolingLiquidShare * 12;
    const airRemainderPenalty = rackFact.coolingAirShare * 12;
    const thermalIndex = clamp(
      aiLoad * 0.56 +
        rackCount * 0.54 +
        ambient * 1.05 -
        cooling * 0.76 +
        powerLossRate * 120 +
        airRemainderPenalty -
        liquidCredit +
        (gaps.coolingAc ? 9 : 0) +
        (gaps.schedulerTail ? 4 : 0) +
        (gaps.modularClaims ? 5 : 0),
    );
    const flowMargin = clamp(
      cooling -
        aiLoad * 0.36 -
        ambient * 0.42 +
        (variant === 'GB200 NVL72' ? 8 : 0) -
        (variant === 'VR NVL72' ? 9 : 0) -
        rackFact.coolingAirShare * 10 +
        rackFact.coolingLiquidShare * 8 -
        (gaps.coolingAc ? 8 : 0) -
        (gaps.modularClaims ? 5 : 0),
      -20,
      100,
    );
    const status =
      powerHeadroom < 0
        ? tx.status.power
        : thermalIndex > 78 || powerHeadroom < 8
        ? tx.status.hot
        : flowMargin < 22
          ? tx.status.watch
          : tx.status.stable;
    const statusTone =
      status === tx.status.power || status === tx.status.hot
        ? '#e36f45'
        : status === tx.status.watch
          ? '#d4a24a'
          : '#00a99f';

    return {
      facilityMw,
      gapTaxMw,
      itPowerMw,
      powerHeadroom,
      thermalIndex,
      flowMargin,
      status,
      statusTone,
    };
  }, [
    ambient,
    aiLoad,
    cooling,
    gaps.coolingAc,
    gaps.gridDelay,
    gaps.modularClaims,
    gaps.schedulerTail,
    powerPathFact.envelopeMultiplier,
    powerPathFact.lossRate,
    rackFact.coolingAirShare,
    rackFact.coolingLiquidShare,
    rackFact.rackPowerKw,
    rackCount,
    tx.status.hot,
    tx.status.power,
    tx.status.stable,
    tx.status.watch,
    variant,
  ]);

  function applyPreset(preset: Preset) {
    setScenario(preset.scenario);
    setVariant(preset.variant);
    setPowerPath(preset.powerPath);
    setRackCount(preset.rackCount);
    setAiLoad(preset.aiLoad);
    setCooling(preset.cooling);
    setAmbient(preset.ambient);
    setGaps(preset.gaps);
  }

  function toggleGap(key: GapKey) {
    setGaps((current) => ({ ...current, [key]: !current[key] }));
    setScenario('balanced');
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

          <RackTwin fact={rackFact} powerPathLabel={powerPathFact.label} powerPathLevel={powerPathFact.level} />

          <div className="ai-factory-readouts" aria-live="polite">
            <Readout label={tx.readouts.power} value={`${model.facilityMw.toFixed(1)} MW`} />
            <Readout label={tx.readouts.thermal} value={`${Math.round(model.thermalIndex)}/100`} />
            <Readout label={tx.readouts.flow} value={`${Math.round(model.flowMargin)}%`} />
            <Readout label={tx.readouts.headroom} value={`${Math.round(model.powerHeadroom)}%`} />
            <Readout label={tx.readouts.gapTax} value={`${Math.round(model.gapTaxMw * 1000)} kW`} />
          </div>

          <div className="ai-factory-source-notes">
            {tx.sourceNotes.map((note) => (
              <article key={note.title}>
                <span>{note.kicker}</span>
                <strong>{note.title}</strong>
                <p>{note.body}</p>
              </article>
            ))}
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
            {(['GB200 NVL72', 'GB300 NVL72', 'VR NVL72'] as const).map((nextVariant) => (
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

          <fieldset className="ai-factory-variant">
            <legend>{tx.powerPathLabel}</legend>
            {POWER_PATHS.map((nextPath) => (
              <button
                key={nextPath}
                type="button"
                className={powerPath === nextPath ? 'ai-factory-chip ai-factory-chip--active' : 'ai-factory-chip'}
                onClick={() => setPowerPath(nextPath)}
                aria-pressed={powerPath === nextPath}
                data-testid={`ai-factory-power-${nextPath}`}
              >
                {tx.powerPaths[nextPath]}
              </button>
            ))}
          </fieldset>

          <Control label={tx.controls.racks} value={rackCount} min={18} max={48} suffix="" onChange={setRackCount} testId="rack-count" />
          <Control label={tx.controls.load} value={aiLoad} min={20} max={100} suffix="%" onChange={setAiLoad} testId="ai-load" />
          <Control label={tx.controls.cooling} value={cooling} min={30} max={100} suffix="%" onChange={setCooling} testId="cooling" />
          <Control label={tx.controls.ambient} value={ambient} min={18} max={40} suffix="C" onChange={setAmbient} testId="ambient" />

          <div className="ai-factory-gap-bank">
            <p className="ai-factory-kicker">{tx.gapLabel}</p>
            {GAP_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={gaps[key] ? 'ai-factory-gap ai-factory-gap--active' : 'ai-factory-gap'}
                onClick={() => toggleGap(key)}
                aria-pressed={gaps[key]}
                data-testid={`ai-factory-gap-${key}`}
              >
                <span>{tx.gaps[key].label}</span>
                <small>{tx.gaps[key].body}</small>
              </button>
            ))}
          </div>

          <p className="ai-factory-note">{tx.note}</p>
          <Link href="/blog/dell-nvidia-flywheel" className="ai-factory-link">
            {tx.related}
          </Link>
        </div>
      </section>
    </ArcadeLayout>
  );
}

function RackTwin({
  fact,
  powerPathLabel,
  powerPathLevel,
}: {
  fact: RackFactSheet;
  powerPathLabel: string;
  powerPathLevel: EvidenceLevel;
}) {
  return (
    <div className="ai-factory-rack-twin">
      <div className="ai-factory-rack-visual" aria-label={`${fact.variant} source-backed rack cutaway`}>
        <div className="ai-factory-rack-title">
          <span>{fact.generation}</span>
          <strong>{fact.variant}</strong>
          <small>{fact.rackPowerLabel}</small>
        </div>
        <div className="ai-factory-rack-shell">
          <div
            className="ai-factory-rack-face"
            style={{ gridTemplateRows: fact.frontStack.map((segment) => `${segment.units}fr`).join(' ') }}
          >
            {fact.frontStack.map((segment) => (
              <span
                key={`${segment.label}-${segment.kind}`}
                className={`ai-factory-rack-segment ai-factory-rack-segment--${segment.kind}`}
              >
                <small>{segment.units}U</small>
                {segment.label}
                <EvidenceBadge level={segment.level} />
              </span>
            ))}
          </div>
          <div className="ai-factory-rack-rear" aria-label="rear systems">
            {fact.rearSystems.map((system) => (
              <span key={system.label}>
                <small>{system.label}</small>
                {system.value}
              </span>
            ))}
          </div>
        </div>
        <p>{fact.visualCaveat}</p>
      </div>

      <div className="ai-factory-ledger">
        <article className="ai-factory-path-card">
          <span>power path</span>
          <strong>{powerPathLabel}</strong>
          <EvidenceBadge level={powerPathLevel} />
        </article>
        {fact.facts.map((item) => (
          <article key={item.label} className="ai-factory-fact-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
            <EvidenceBadge level={item.level} />
          </article>
        ))}
        <div className="ai-factory-source-list">
          {fact.sources.map((source) => (
            <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer">
              {source.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return <em className={`ai-factory-evidence ai-factory-evidence--${level}`}>{level}</em>;
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
