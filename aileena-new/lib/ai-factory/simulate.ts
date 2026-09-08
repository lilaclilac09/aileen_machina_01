import { POWER_PATH_FACTS } from './rack-facts';
import { PLANT, type GapKey, type PowerPath } from './plant';
import type { EvidenceLevel, RackVariant } from './rack-facts';

export type SimInput = {
  variant: RackVariant;
  powerPath: PowerPath;
  rackCount: number;
  aiLoad: number;
  cooling: number;
  ambient: number;
  gaps: Record<GapKey, boolean>;
  focusRack: number;
};

export type CellTelemetry = {
  id: string;
  label: string;
  kw: number;
  heat: number;
  tone: 'ok' | 'watch' | 'hot';
  note?: string;
};

export type HallRack = {
  id: number;
  active: boolean;
  thermal: number;
  busbarUtil: number;
  focused: boolean;
  aisle: 'hot' | 'cold';
  edge: boolean;
};

export type LiveMetric = {
  label: string;
  value: string;
  level: EvidenceLevel;
};

export type FocusMeta = {
  id: number;
  row: number;
  col: number;
  aisle: 'hot' | 'cold';
  edge: boolean;
};

export type PlantSim = {
  loadFactor: number;
  itKwPerRack: number;
  residualKw: number;
  conversionKwPerRack: number;
  facilityMw: number;
  gapTaxMw: number;
  powerHeadroom: number;
  thermalIndex: number;
  flowMargin: number;
  status: 'stable' | 'watch' | 'hot' | 'power';
  statusTone: string;
  busVoltage: number;
  requiredA: number;
  publishedA: number;
  busbarUtil: number;
  busbarTension: string;
  publishedBusbarLevel: EvidenceLevel;
  shelfUtil: number;
  liquidKw: number;
  airKw: number;
  inletC: number;
  deltaTC: number;
  returnC: number;
  flowLpm: number;
  cduCount: number;
  cduLoad: number;
  computeCells: CellTelemetry[];
  switchCells: CellTelemetry[];
  shelfCells: CellTelemetry[];
  hall: HallRack[];
  live: LiveMetric[];
  coolingLive: LiveMetric[];
  focus: FocusMeta;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function cellTone(heat: number): CellTelemetry['tone'] {
  if (heat > 78) return 'hot';
  if (heat > 58) return 'watch';
  return 'ok';
}

function hallGeometry(id: number) {
  const row = Math.floor(id / 8);
  const col = id % 8;
  const aisle: FocusMeta['aisle'] = col === 3 || col === 4 ? 'hot' : 'cold';
  const edge = row === 0 || row === 5;
  return { row, col, aisle, edge };
}

export function simulatePlant(input: SimInput): PlantSim {
  const plant = PLANT[input.variant];
  const path = POWER_PATH_FACTS[input.powerPath];
  const focusId = Math.max(0, Math.min(47, input.focusRack));
  const focus = { id: focusId, ...hallGeometry(focusId) };
  const hallBoost = (focus.aisle === 'hot' ? 1.045 : 1) * (focus.edge ? 1.02 : 1);

  const loadFactor = 0.38 + (input.aiLoad / 100) * 0.72;
  const schedulerPin = input.gaps.schedulerTail ? 0.07 : 0;
  const computeKw = plant.computeTrayKwMax * (loadFactor + schedulerPin);
  const switchKw = plant.switchTrayKwMax * (0.72 + loadFactor * 0.28);
  const residualKw = plant.residualKw * (0.86 + loadFactor * 0.14);
  const itKwPerRack = computeKw * plant.computeTrays + switchKw * plant.switchTrays + residualKw;
  const conversionKwPerRack = itKwPerRack * path.lossRate;
  const hallItMw = (itKwPerRack * input.rackCount) / 1000;
  const gapTaxMw =
    (input.gaps.coolingAc ? hallItMw * 0.025 : 0) +
    (input.gaps.gridDelay ? 0.35 : 0) +
    (input.gaps.schedulerTail ? hallItMw * 0.018 : 0) +
    (input.gaps.modularClaims ? 0.18 : 0);
  const facilityMw = hallItMw * (1 + path.lossRate) + gapTaxMw;
  const designMw = (input.rackCount * (itKwPerRack + conversionKwPerRack) * path.envelopeMultiplier) / 1000;
  const powerHeadroom = clamp(((designMw - facilityMw) / Math.max(designMw, 0.01)) * 100, -40, 100);

  const requiredA = (itKwPerRack * 1000) / plant.busVoltage;
  const busbarUtil = requiredA / plant.publishedBusbarA;
  const installedShelfKw = plant.shelfCount * plant.shelfKw;
  const shelfUtil = (itKwPerRack + conversionKwPerRack) / installedShelfKw;

  const liquidKw = itKwPerRack * plant.liquidShare;
  const airKw = itKwPerRack * plant.airShare + (input.gaps.coolingAc ? itKwPerRack * 0.04 : 0);
  const flowLpm = plant.referenceFlowLpm * (0.55 + (input.cooling / 100) * 0.9) * (input.gaps.modularClaims ? 0.92 : 1);
  const inletC = clamp(input.ambient * 0.42 + (100 - input.cooling) * 0.12 + (input.gaps.coolingAc ? 4 : 0), 18, 46);
  const kgPerS = flowLpm / 60;
  const deltaTC = liquidKw / Math.max(kgPerS * 4.18, 0.35);
  const returnC = inletC + deltaTC;

  const thermalIndex = clamp(
    input.aiLoad * 0.34 +
      busbarUtil * 22 +
      returnC * 0.85 +
      airKw * 0.35 +
      path.lossRate * 80 +
      (input.gaps.coolingAc ? 8 : 0) +
      (input.gaps.schedulerTail ? 4 : 0) +
      (input.gaps.modularClaims ? 5 : 0) +
      (focus.aisle === 'hot' ? 5 : 0) +
      (focus.edge ? 3 : 0) -
      input.cooling * 0.18,
  );
  const flowMargin = clamp(
    100 - (deltaTC / 14) * 70 - (returnC > plant.returnCeilingC ? 28 : 0) - (input.gaps.coolingAc ? 10 : 0),
    -20,
    100,
  );

  const status: PlantSim['status'] =
    powerHeadroom < 0 || (input.gaps.gridDelay && facilityMw > designMw * 0.98)
      ? 'power'
      : thermalIndex > 78 || returnC > plant.returnCeilingC || busbarUtil > 1.05
        ? 'hot'
        : flowMargin < 22 || busbarUtil > 0.82
          ? 'watch'
          : 'stable';
  const statusTone = status === 'power' || status === 'hot' ? '#e36f45' : status === 'watch' ? '#d4a24a' : '#00a99f';

  const cduCount = Math.max(1, Math.ceil(input.rackCount / plant.racksPerCdu));
  const cduLoad = (liquidKw * input.rackCount) / (cduCount * plant.cduKw);

  const computeCells = Array.from({ length: plant.computeTrays }, (_, index) => {
    const pin = input.gaps.schedulerTail && index % 5 === 0 ? 1.16 : 1;
    const trayAisle = index % 6 === 2 || index % 6 === 3 ? 1.05 : 1;
    const kw = computeKw * pin * trayAisle * hallBoost;
    const heat = clamp(thermalIndex + (pin - 1) * 40 + (trayAisle - 1) * 20 + (index % 3) * 3);
    return {
      id: `c${index + 1}`,
      label: `C${String(index + 1).padStart(2, '0')}`,
      kw,
      heat,
      tone: cellTone(heat),
      note: pin > 1 ? 'KV pin' : trayAisle > 1 ? 'mid-stack' : undefined,
    };
  });

  const switchCells = Array.from({ length: plant.switchTrays }, (_, index) => {
    const fabric = index === 4 ? 1.08 : 1;
    const kw = switchKw * fabric * hallBoost;
    const heat = clamp(thermalIndex * 0.72 + fabric * 12 + (index % 2) * 4);
    return {
      id: `s${index + 1}`,
      label: `NV${String(index + 1).padStart(2, '0')}`,
      kw,
      heat,
      tone: cellTone(heat),
      note: fabric > 1 ? 'domain close' : undefined,
    };
  });

  const shelfCells = Array.from({ length: plant.shelfCount }, (_, index) => {
    const share = 1 + (index === plant.shelfCount - 1 && plant.shelfCount > 4 ? -0.18 : 0.02 * (index % 3));
    const kw = ((itKwPerRack + conversionKwPerRack) / plant.shelfCount) * share;
    const heat = clamp(shelfUtil * 70 + share * 8);
    return {
      id: `p${index + 1}`,
      label: `PSU ${index + 1}`,
      kw,
      heat,
      tone: cellTone(heat),
      note: index === plant.shelfCount - 1 && plant.shelfCount > 4 ? 'N+1 spare' : undefined,
    };
  });

  const hall = Array.from({ length: 48 }, (_, id) => {
    const active = id < input.rackCount;
    const geo = hallGeometry(id);
    const aislePenalty = geo.aisle === 'hot' ? 9 : 0;
    const edgePenalty = geo.edge ? 7 : 0;
    const thermal = active ? clamp(thermalIndex + aislePenalty + edgePenalty + (id % 3) * 3 - input.cooling * 0.08) : 0;
    return {
      id,
      active,
      thermal,
      busbarUtil,
      focused: id === focusId,
      aisle: geo.aisle,
      edge: geo.edge,
    };
  });

  const live: LiveMetric[] = [
    { label: 'load factor', value: `${Math.round(loadFactor * 100)}%`, level: 'derived' },
    { label: 'IT / rack', value: `${itKwPerRack.toFixed(1)} kW`, level: 'derived' },
    { label: 'busbar', value: `${Math.round(requiredA)} A / ${plant.publishedBusbarA} A`, level: 'derived' },
    { label: 'return', value: `${returnC.toFixed(1)} C`, level: 'derived' },
    { label: 'liquid / air', value: `${liquidKw.toFixed(1)} / ${airKw.toFixed(1)} kW`, level: 'derived' },
    { label: 'CDU load', value: `${Math.round(cduLoad * 100)}% × ${cduCount}`, level: 'assumption' },
  ];

  const coolingLive: LiveMetric[] = [
    { label: 'inlet', value: `${inletC.toFixed(1)} C`, level: 'derived' },
    { label: 'ΔT', value: `${deltaTC.toFixed(1)} C`, level: 'derived' },
    { label: 'return', value: `${returnC.toFixed(1)} C`, level: 'derived' },
    { label: 'flow', value: `${Math.round(flowLpm)} L/min`, level: 'derived' },
    { label: 'liquid', value: `${liquidKw.toFixed(1)} kW`, level: 'derived' },
    { label: 'air leftover', value: `${airKw.toFixed(1)} kW`, level: 'derived' },
    { label: '65C ceiling', value: returnC > plant.returnCeilingC ? 'alarm' : 'inside', level: 'source-backed' },
    { label: 'CDUs', value: `${cduCount} @ ${Math.round(cduLoad * 100)}%`, level: 'assumption' },
  ];

  return {
    loadFactor,
    itKwPerRack,
    residualKw,
    conversionKwPerRack,
    facilityMw,
    gapTaxMw,
    powerHeadroom,
    thermalIndex,
    flowMargin,
    status,
    statusTone,
    busVoltage: plant.busVoltage,
    requiredA,
    publishedA: plant.publishedBusbarA,
    busbarUtil,
    busbarTension: plant.physicsNote,
    publishedBusbarLevel: plant.publishedBusbarLevel,
    shelfUtil,
    liquidKw,
    airKw,
    inletC,
    deltaTC,
    returnC,
    flowLpm,
    cduCount,
    cduLoad,
    computeCells,
    switchCells,
    shelfCells,
    hall,
    live,
    coolingLive,
    focus,
  };
}
