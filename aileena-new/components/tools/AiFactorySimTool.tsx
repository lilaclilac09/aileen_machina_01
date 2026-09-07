'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ArcadeLayout from './ArcadeLayout';
import { POWER_PATH_FACTS, RACK_FACTS, type EvidenceLevel, type RackFactSheet, type RackVariant } from '../../lib/ai-factory/rack-facts';
import {
  DEFAULT_INSPECT,
  RACK_INSPECTORS,
  REAR_INSPECT_BY_LABEL,
  type InspectId,
  type InspectorSheet,
  type RackFace,
} from '../../lib/ai-factory/rack-inspectors';
import { simulatePlant, type CellTelemetry, type PlantSim } from '../../lib/ai-factory/simulate';
import type { PowerPath as PlantPowerPath } from '../../lib/ai-factory/plant';

const PlantViewport = dynamic(() => import('./PlantViewport'), { ssr: false });

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

const POWER_PATHS: PowerPath[] = ['legacy-ac', '800v-sidecar', 'facility-hvdc'];
const GAP_KEYS: GapKey[] = ['coolingAc', 'gridDelay', 'schedulerTail', 'modularClaims'];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
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
  const [face, setFace] = useState<RackFace>('front');
  const [inspectId, setInspectId] = useState<InspectId>(DEFAULT_INSPECT);
  const [focusRack, setFocusRack] = useState(0);
  const [cameraMode, setCameraMode] = useState<'hall' | 'rack'>('hall');
  const rackFact = RACK_FACTS[variant];
  const powerPathFact = POWER_PATH_FACTS[powerPath];
  const inspector = RACK_INSPECTORS[variant][inspectId];

  const model = useMemo(
    () =>
      simulatePlant({
        variant,
        powerPath: powerPath as PlantPowerPath,
        rackCount,
        aiLoad,
        cooling,
        ambient,
        gaps,
        focusRack,
      }),
    [aiLoad, ambient, cooling, focusRack, gaps, powerPath, rackCount, variant],
  );
  const statusLabel = tx.status[model.status];

  function applyPreset(preset: Preset) {
    setScenario(preset.scenario);
    setVariant(preset.variant);
    setPowerPath(preset.powerPath);
    setRackCount(preset.rackCount);
    setAiLoad(preset.aiLoad);
    setCooling(preset.cooling);
    setAmbient(preset.ambient);
    setGaps(preset.gaps);
    setInspectId(DEFAULT_INSPECT);
    setFace('front');
    setFocusRack(0);
    setCameraMode('hall');
  }

  function selectVariant(nextVariant: RackVariant) {
    setVariant(nextVariant);
    setInspectId(DEFAULT_INSPECT);
    setFace('front');
    setFocusRack(0);
    setCameraMode('hall');
  }

  const focusFromHall = useCallback((id: number) => {
    setFocusRack(id);
    setCameraMode('rack');
  }, []);

  const inspectFromScene = useCallback((id: InspectId, nextFace?: RackFace) => {
    setInspectId(id);
    if (nextFace) setFace(nextFace);
    setCameraMode('rack');
  }, []);

  function selectInspect(nextId: InspectId, nextFace?: RackFace) {
    setInspectId(nextId);
    if (nextFace) setFace(nextFace);
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

          <div className="ai-factory-stage" data-scenario={scenario} data-camera={cameraMode}>
            <PlantViewport
              model={model}
              fact={rackFact}
              face={face}
              inspectId={inspectId}
              powerPath={powerPath}
              cameraMode={cameraMode}
              onFocusRack={focusFromHall}
              onInspect={inspectFromScene}
            />
            <div className="ai-factory-hall-a11y">
              {model.hall.map((rack) => (
                <button
                  key={rack.id}
                  type="button"
                  disabled={!rack.active}
                  onClick={() => focusFromHall(rack.id)}
                  aria-pressed={rack.focused}
                  aria-label={`${tx.hallHint} ${rack.id + 1}`}
                  data-testid={`ai-factory-hall-${rack.id}`}
                />
              ))}
            </div>
            <div className="ai-factory-camera" role="group" aria-label="camera">
              <button
                type="button"
                className={cameraMode === 'hall' ? 'ai-factory-chip ai-factory-chip--active' : 'ai-factory-chip'}
                onClick={() => setCameraMode('hall')}
                aria-pressed={cameraMode === 'hall'}
                data-testid="ai-factory-camera-hall"
              >
                {tx.viewHall}
              </button>
              <button
                type="button"
                className={cameraMode === 'rack' ? 'ai-factory-chip ai-factory-chip--active' : 'ai-factory-chip'}
                onClick={() => setCameraMode('rack')}
                aria-pressed={cameraMode === 'rack'}
                data-testid="ai-factory-camera-rack"
              >
                {tx.viewRack}
              </button>
            </div>
            <div className="ai-factory-status">
              <span className="ai-factory-led" style={{ background: model.statusTone }} />
              <strong>{statusLabel}</strong>
              <small>
                R{model.focus.id + 1} · {model.focus.aisle} aisle
                {model.focus.edge ? ' · edge' : ''}
              </small>
            </div>
          </div>

          <RackTwin
            fact={rackFact}
            inspector={inspector}
            face={face}
            inspectId={inspectId}
            model={model}
            powerPathLabel={powerPathFact.label}
            powerPathLevel={powerPathFact.level}
            copy={{
              inspectLabel: tx.inspectLabel,
              frontView: tx.frontView,
              rearView: tx.rearView,
              inspectHint: tx.inspectHint,
              liveLabel: tx.liveLabel,
              cellsLabel: tx.cellsLabel,
            }}
            onFaceChange={setFace}
            onInspect={selectInspect}
          />

          <div className="ai-factory-readouts" aria-live="polite">
            <Readout label={tx.readouts.power} value={`${model.facilityMw.toFixed(1)} MW`} />
            <Readout label={tx.readouts.thermal} value={`${Math.round(model.thermalIndex)}/100`} />
            <Readout label={tx.readouts.flow} value={`${Math.round(model.flowMargin)}%`} />
            <Readout label={tx.readouts.headroom} value={`${Math.round(model.powerHeadroom)}%`} />
            <Readout label={tx.readouts.gapTax} value={`${Math.round(model.gapTaxMw * 1000)} kW`} />
            <Readout
              label={tx.readouts.busbar}
              value={`${Math.round(model.requiredA)}A / ${model.publishedA}A`}
            />
            <Readout label={tx.readouts.return} value={`${model.returnC.toFixed(1)}C`} />
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
                onClick={() => selectVariant(nextVariant)}
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

          <p className="ai-factory-note">{tx.photorealNote}</p>
          <p className="ai-factory-note">{tx.note}</p>
          <Link href="/blog/dell-nvidia-flywheel" className="ai-factory-link">
            {tx.related}
          </Link>
        </div>
      </section>
    </ArcadeLayout>
  );
}

function liveCells(inspectId: InspectId, model: PlantSim): CellTelemetry[] | null {
  if (inspectId === 'compute') return model.computeCells;
  if (inspectId === 'switch') return model.switchCells;
  if (inspectId === 'power') return model.shelfCells;
  return null;
}

function RackTwin({
  fact,
  inspector,
  face,
  inspectId,
  model,
  powerPathLabel,
  powerPathLevel,
  copy,
  onFaceChange,
  onInspect,
}: {
  fact: RackFactSheet;
  inspector: InspectorSheet;
  face: RackFace;
  inspectId: InspectId;
  model: PlantSim;
  powerPathLabel: string;
  powerPathLevel: EvidenceLevel;
  copy: {
    inspectLabel: string;
    frontView: string;
    rearView: string;
    inspectHint: string;
    liveLabel: string;
    cellsLabel: string;
  };
  onFaceChange: (face: RackFace) => void;
  onInspect: (id: InspectId, face?: RackFace) => void;
}) {
  const stackEvidence = Array.from(new Set(fact.frontStack.map((segment) => segment.level)));

  return (
    <div className="ai-factory-rack-twin">
      <div className="ai-factory-rack-visual" aria-label={`${fact.variant} source-backed rack cutaway`}>
        <div className="ai-factory-rack-title">
          <span>{fact.generation}</span>
          <strong>{fact.variant}</strong>
          <small>{fact.rackPowerLabel}</small>
        </div>
        <div className="ai-factory-face-toggle" role="group" aria-label={copy.inspectLabel}>
          <button
            type="button"
            className={face === 'front' ? 'ai-factory-chip ai-factory-chip--active' : 'ai-factory-chip'}
            onClick={() => onFaceChange('front')}
            aria-pressed={face === 'front'}
            data-testid="ai-factory-face-front"
          >
            {copy.frontView}
          </button>
          <button
            type="button"
            className={face === 'rear' ? 'ai-factory-chip ai-factory-chip--active' : 'ai-factory-chip'}
            onClick={() => onFaceChange('rear')}
            aria-pressed={face === 'rear'}
            data-testid="ai-factory-face-rear"
          >
            {copy.rearView}
          </button>
        </div>
        <div className={`ai-factory-rack-shell ai-factory-rack-shell--${face}`}>
          {face === 'front' ? (
            <div
              className="ai-factory-rack-face"
              style={{ gridTemplateRows: fact.frontStack.map((segment) => `${segment.units}fr`).join(' ') }}
            >
              {fact.frontStack.map((segment) => (
                <button
                  key={`${segment.label}-${segment.kind}`}
                  type="button"
                  className={`ai-factory-rack-segment ai-factory-rack-segment--${segment.kind}${
                    inspectId === segment.kind ? ' ai-factory-rack-segment--active' : ''
                  }`}
                  onClick={() => onInspect(segment.kind, 'front')}
                  aria-pressed={inspectId === segment.kind}
                  data-testid={`ai-factory-inspect-${segment.kind}`}
                >
                  <small>{segment.units}U</small>
                  {segment.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="ai-factory-rack-rear" aria-label="rear systems">
              {fact.rearSystems.map((system) => {
                const rearId = REAR_INSPECT_BY_LABEL[system.label] ?? 'busbar';
                return (
                  <button
                    key={system.label}
                    type="button"
                    className={`ai-factory-rear-item${inspectId === rearId ? ' ai-factory-rear-item--active' : ''}`}
                    onClick={() => onInspect(rearId, 'rear')}
                    aria-pressed={inspectId === rearId}
                    data-testid={`ai-factory-inspect-${rearId}`}
                  >
                    <small>{system.label}</small>
                    {system.value}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p>{copy.inspectHint}. {fact.visualCaveat}</p>
        <div className="ai-factory-stack-evidence" aria-label="rack stack evidence">
          {stackEvidence.map((level) => (
            <EvidenceBadge key={level} level={level} />
          ))}
        </div>
      </div>

      <div className="ai-factory-ledger">
        <article className="ai-factory-path-card" data-testid="ai-factory-inspector">
          <span>{copy.inspectLabel}</span>
          <strong>{inspector.title}</strong>
          <p>{inspector.summary}</p>
          <EvidenceBadge level={inspector.ports[0]?.level ?? 'assumption'} />
          <div className="ai-factory-port-list">
            {inspector.ports.map((port) => (
              <span key={`${port.label}-${port.value}`} className="ai-factory-port">
                <small>{port.label}</small>
                {port.value}
                <EvidenceBadge level={port.level} />
              </span>
            ))}
          </div>
          <LivePlant inspectId={inspectId} model={model} copy={copy} />
        </article>
        {inspector.internals.map((item) => (
          <article key={item.label} className="ai-factory-fact-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
            <EvidenceBadge level={item.level} />
          </article>
        ))}
        <article className="ai-factory-fact-card">
          <span>power path</span>
          <strong>{powerPathLabel}</strong>
          <p>
            conversion {model.conversionKwPerRack.toFixed(1)} kW / rack · residual {model.residualKw.toFixed(1)} kW
          </p>
          <EvidenceBadge level={powerPathLevel} />
        </article>
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

function LivePlant({
  inspectId,
  model,
  copy,
}: {
  inspectId: InspectId;
  model: PlantSim;
  copy: { liveLabel: string; cellsLabel: string };
}) {
  const cells = liveCells(inspectId, model);
  const cooling = inspectId === 'cooling' || inspectId === 'manifold';
  const busbar = inspectId === 'busbar';

  return (
    <div className="ai-factory-live" data-testid="ai-factory-live">
      <p className="ai-factory-live-kicker">{copy.liveLabel}</p>
      <div className="ai-factory-live-grid">
        {(busbar
          ? [
              { label: 'required', value: `${Math.round(model.requiredA)} A`, level: 'derived' as const },
              { label: 'published', value: `${model.publishedA} A`, level: model.publishedBusbarLevel },
              { label: 'util', value: `${Math.round(model.busbarUtil * 100)}%`, level: 'derived' as const },
              { label: 'voltage', value: `${model.busVoltage} V`, level: 'source-backed' as const },
            ]
          : cooling
            ? model.coolingLive
            : model.live
        ).map((metric) => (
          <span key={`${metric.label}-${metric.value}`} className="ai-factory-live-item">
            <small>{metric.label}</small>
            {metric.value}
            <EvidenceBadge level={metric.level} />
          </span>
        ))}
      </div>
      {busbar ? (
        <p className="ai-factory-tension" data-testid="ai-factory-busbar-tension">
          {model.busbarTension}
        </p>
      ) : null}
      {cells ? (
        <div className="ai-factory-cells" aria-label={copy.cellsLabel}>
          {cells.map((cell) => (
            <span
              key={cell.id}
              className={`ai-factory-cell ai-factory-cell--${cell.tone}`}
              data-testid={`ai-factory-cell-${cell.id}`}
              title={cell.note}
            >
              <small>{cell.label}</small>
              {cell.kw.toFixed(1)}
            </span>
          ))}
        </div>
      ) : null}
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
