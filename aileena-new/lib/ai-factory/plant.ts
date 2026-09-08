import type { EvidenceLevel, RackVariant } from './rack-facts';
import { POWER_PATH_FACTS } from './rack-facts';

export type PowerPath = keyof typeof POWER_PATH_FACTS;
export type GapKey = 'coolingAc' | 'gridDelay' | 'schedulerTail' | 'modularClaims';

export type PlantConstants = {
  computeTrays: number;
  switchTrays: number;
  computeTrayKwMax: number;
  switchTrayKwMax: number;
  residualKw: number;
  busVoltage: number;
  publishedBusbarA: number;
  physicsNote: string;
  publishedBusbarLevel: EvidenceLevel;
  shelfCount: number;
  shelfKw: number;
  liquidShare: number;
  airShare: number;
  referenceFlowLpm: number;
  returnCeilingC: number;
  racksPerCdu: number;
  cduKw: number;
};

export const PLANT: Record<RackVariant, PlantConstants> = {
  'GB200 NVL72': {
    computeTrays: 18,
    switchTrays: 9,
    // ~120-124 kW rack / 18 trays after switch share. Semi GB200 architecture + NVIDIA NVL72 ERA.
    computeTrayKwMax: 6.3,
    switchTrayKwMax: 1.15,
    residualKw: 0.8, // OOB / sensors / leftover conversion. assumption.
    busVoltage: 50,
    publishedBusbarA: 2900,
    physicsNote: 'SemiAnalysis rates Grace Blackwell busbar about 2900A. Required A still follows P/V.',
    publishedBusbarLevel: 'source-backed',
    shelfCount: 8,
    shelfKw: 33,
    liquidShare: 0.85,
    airShare: 0.15,
    referenceFlowLpm: 165, // derived from ~85% of ~124 kW at ~10C ΔT, water.
    returnCeilingC: 65,
    racksPerCdu: 10, // Semi public belief, not a measured plant.
    cduKw: 2000,
  },
  'GB300 NVL72': {
    computeTrays: 18,
    switchTrays: 9,
    // Lenovo LP2357 + Semi public GB300 notes: ~135-142 kW class.
    computeTrayKwMax: 6.7,
    switchTrayKwMax: 1.4,
    residualKw: 0.9,
    busVoltage: 50,
    publishedBusbarA: 1400,
    physicsNote:
      'Lenovo lists one 1400A / 50V busbar. 135-142 kW at 50V needs ~2700-2840A. The published amp rating and the published TDP cannot both be complete.',
    publishedBusbarLevel: 'source-backed',
    shelfCount: 8,
    shelfKw: 33,
    liquidShare: 0.9,
    airShare: 0.1,
    referenceFlowLpm: 174,
    returnCeilingC: 65,
    racksPerCdu: 10,
    cduKw: 2000,
  },
  'VR NVL72': {
    computeTrays: 18,
    switchTrays: 9,
    // Semi Vera Rubin public: 180-220 kW, 4x 110 kW shelves, 5000A+ liquid busbar.
    computeTrayKwMax: 9.6,
    switchTrayKwMax: 2.2,
    residualKw: 1.1,
    busVoltage: 50,
    publishedBusbarA: 5000,
    physicsNote: 'VR busbar is 5000A+ and liquid-cooled. Trays still ingest 50V even if a sidecar feeds 800V.',
    publishedBusbarLevel: 'source-backed',
    shelfCount: 4,
    shelfKw: 110,
    liquidShare: 1,
    airShare: 0,
    referenceFlowLpm: 380,
    returnCeilingC: 65,
    racksPerCdu: 10,
    cduKw: 3500,
  },
};
