export type RackVariant = 'GB200 NVL72' | 'GB300 NVL72' | 'VR NVL72';

export type EvidenceLevel = 'source-backed' | 'derived' | 'assumption';

export type RackFact = {
  label: string;
  value: string;
  level: EvidenceLevel;
  detail: string;
};

export type RackStackSegment = {
  label: string;
  units: number;
  kind: 'management' | 'power' | 'compute' | 'switch' | 'cooling' | 'blank';
  level: EvidenceLevel;
};

export type RackSource = {
  label: string;
  href: string;
};

export type RackFactSheet = {
  variant: RackVariant;
  generation: string;
  rackPowerKw: number;
  rackPowerLabel: string;
  coolingLiquidShare: number;
  coolingAirShare: number;
  powerLossRate: number;
  headline: string;
  visualCaveat: string;
  frontStack: RackStackSegment[];
  rearSystems: RackFact[];
  facts: RackFact[];
  sources: RackSource[];
};

export const RACK_FACTS: Record<RackVariant, RackFactSheet> = {
  'GB200 NVL72': {
    variant: 'GB200 NVL72',
    generation: 'Grace Blackwell Oberon',
    rackPowerKw: 124,
    rackPowerLabel: '~120-124 kW / rack',
    coolingLiquidShare: 0.85,
    coolingAirShare: 0.15,
    powerLossRate: 0.08,
    headline: 'First mass rack-scale Oberon: dense enough that liquid cooling becomes the constraint.',
    visualCaveat: 'Inventory-backed rack sketch; not an exact vendor U-position drawing.',
    frontStack: [
      { label: 'OOB mgmt', units: 2, kind: 'management', level: 'assumption' },
      { label: 'power shelf bank', units: 8, kind: 'power', level: 'source-backed' },
      { label: '18 compute trays', units: 18, kind: 'compute', level: 'source-backed' },
      { label: '9 NVSwitch trays', units: 9, kind: 'switch', level: 'source-backed' },
      { label: 'blank / service', units: 11, kind: 'blank', level: 'assumption' },
    ],
    rearSystems: [
      {
        label: 'busbar spine',
        value: '48-54V class',
        level: 'source-backed',
        detail: 'Compute tray power arrives from rack-level DC busbar before board-level conversion.',
      },
      {
        label: 'NVLink backplane',
        value: 'rear scale-up fabric',
        level: 'source-backed',
        detail: 'NVL72 keeps the 72 GPUs inside one rack-scale NVLink domain.',
      },
      {
        label: 'coolant path',
        value: 'direct-to-chip liquid',
        level: 'source-backed',
        detail: 'Liquid cooling is required once rack density moves far beyond air-cooled H100-class racks.',
      },
    ],
    facts: [
      {
        label: 'rack inventory',
        value: '18x 1U compute + 9x NVSwitch',
        level: 'source-backed',
        detail: 'Each compute tray contains two Bianca boards; each Bianca board carries one Grace CPU and two Blackwell GPUs.',
      },
      {
        label: 'power budget',
        value: '123.6 kW total estimate',
        level: 'source-backed',
        detail: 'SemiAnalysis estimates total NVL72 draw including AC-to-DC conversion inefficiency.',
      },
      {
        label: 'board power',
        value: 'RapidLock 12V + GND',
        level: 'source-backed',
        detail: 'Bianca receives board power through RapidLock connectors after the tray PDB steps rack DC down.',
      },
    ],
    sources: [
      {
        label: 'SemiAnalysis GB200 Hardware Architecture',
        href: 'https://newsletter.semianalysis.com/p/gb200-hardware-architecture-and-component',
      },
      {
        label: 'SemiAnalysis Datacenter Anatomy: Electrical',
        href: 'https://newsletter.semianalysis.com/p/datacenter-anatomy-part-1-electrical',
      },
    ],
  },
  'GB300 NVL72': {
    variant: 'GB300 NVL72',
    generation: 'Blackwell Ultra MGX',
    rackPowerKw: 153,
    rackPowerLabel: '135 kW TDP / up to 155 kW peak',
    coolingLiquidShare: 0.9,
    coolingAirShare: 0.1,
    powerLossRate: 0.065,
    headline: 'Publicly inspectable rack: the best visual baseline for the browser twin.',
    visualCaveat: 'Front/rear details follow Lenovo public guides and 3D tour; U positions are compressed for screen.',
    frontStack: [
      { label: '2 management switches', units: 2, kind: 'management', level: 'source-backed' },
      { label: '6-8 power shelves', units: 8, kind: 'power', level: 'source-backed' },
      { label: '18 compute trays', units: 18, kind: 'compute', level: 'source-backed' },
      { label: '9 NVLink trays', units: 9, kind: 'switch', level: 'source-backed' },
      { label: 'leak pan / blanks', units: 11, kind: 'blank', level: 'source-backed' },
    ],
    rearSystems: [
      {
        label: 'single rear busbar',
        value: '50V / 1400A',
        level: 'source-backed',
        detail: 'Lenovo lists one busbar in the middle rear supporting the MGX rack.',
      },
      {
        label: 'cable cartridges',
        value: '4 rear cartridges',
        level: 'source-backed',
        detail: 'Protected high-speed NVLink channels connect compute trays to every NVSwitch tray.',
      },
      {
        label: 'rear manifolds',
        value: 'left/right inlet + outlet',
        level: 'source-backed',
        detail: 'Top-feed and bottom-feed manifold options route coolant through tray quick disconnects.',
      },
    ],
    facts: [
      {
        label: 'rack inventory',
        value: '48U, 18 compute, 9 switch, 6-8 shelves',
        level: 'source-backed',
        detail: 'The rack also includes two management switches, CDU options, cable cartridges, manifolds and leak hardware.',
      },
      {
        label: 'cooling split',
        value: '~90% liquid / ~10% air',
        level: 'source-backed',
        detail: 'CPU, GPU, HBM and NVSwitch heat goes to water; OSFP, drives, PDB and ancillaries still drive fans.',
      },
      {
        label: 'operator surface',
        value: 'front LEDs + BMC + OSFP + DPU',
        level: 'source-backed',
        detail: 'The front face exposes E1.S bays, BMC management, BlueField-3, OSFP cards, power/ID/fault indicators and debug ports.',
      },
    ],
    sources: [
      {
        label: 'Lenovo GB300 NVL72 Product Guide',
        href: 'https://lenovopress.lenovo.com/lp2357-lenovo-nvidia-gb300-nvl72-rack-scale-ai',
      },
      {
        label: 'Lenovo GB300 NVL72 3D Tour',
        href: 'https://lenovopress.lenovo.com/lp2381-3d-tour-lenovocsp-gb300nvl72',
      },
      {
        label: 'NVIDIA NVL72 AI Factory Components',
        href: 'https://docs.nvidia.com/enterprise-reference-architectures/nvl72-ai-factory/latest/components.html',
      },
    ],
  },
  'VR NVL72': {
    variant: 'VR NVL72',
    generation: 'Vera Rubin Oberon',
    rackPowerKw: 220,
    rackPowerLabel: '180-220 kW / rack',
    coolingLiquidShare: 1,
    coolingAirShare: 0,
    powerLossRate: 0.045,
    headline: 'Cableless, fanless compute tray generation: assembly yield becomes part of the architecture.',
    visualCaveat: 'Built from SemiAnalysis public architecture notes; exact module photos remain source-limited.',
    frontStack: [
      { label: 'control modules', units: 2, kind: 'management', level: 'assumption' },
      { label: '4x 3U 110kW shelves', units: 12, kind: 'power', level: 'source-backed' },
      { label: '18 liquid compute trays', units: 18, kind: 'compute', level: 'source-backed' },
      { label: '9 NVLink 6 trays', units: 9, kind: 'switch', level: 'source-backed' },
      { label: 'manifold / service', units: 7, kind: 'cooling', level: 'derived' },
    ],
    rearSystems: [
      {
        label: 'liquid-cooled busbar',
        value: '50V / 5000A+',
        level: 'source-backed',
        detail: 'SemiAnalysis notes the busbar current exceeds Grace Blackwell and needs liquid cooling because fans are removed.',
      },
      {
        label: 'internal manifold',
        value: 'middle chassis',
        level: 'source-backed',
        detail: 'Coolant enters from the rear, distributes through an internal manifold, then returns from the opposite side.',
      },
      {
        label: 'board-to-board path',
        value: 'Paladin HD2 + PCB midplane',
        level: 'source-backed',
        detail: 'Cableless tray design moves signals through high-end PCB materials instead of vulnerable flyover cables.',
      },
    ],
    facts: [
      {
        label: 'compute tray modules',
        value: '2 Strata, 4 Orchid, midplane, PDB, BF4, mgmt',
        level: 'source-backed',
        detail: 'The Strata modules sit at the back; front modules include Orchid, BlueField-4, power delivery and system management.',
      },
      {
        label: 'thermal shift',
        value: '100% liquid compute tray',
        level: 'source-backed',
        detail: 'Fans are removed from the compute tray; cold plates extend to the front modules and QDs shrink inside the tray.',
      },
      {
        label: 'rack power',
        value: '4x 110kW shelves, N+1',
        level: 'source-backed',
        detail: 'Each 3U shelf contains six 18.3kW PSUs and receives 415-480VAC before stepping down to 50VDC.',
      },
    ],
    sources: [
      {
        label: 'SemiAnalysis Vera Rubin Deep Dive',
        href: 'https://newsletter.semianalysis.com/p/vera-rubin-extreme-co-design-an-evolution',
      },
      {
        label: 'SemiAnalysis 800VDC Revolution',
        href: 'https://newsletter.semianalysis.com/p/inside-the-800vdc-revolution-part',
      },
    ],
  },
};

export const POWER_PATH_FACTS = {
  'legacy-ac': {
    lossRate: 0.08,
    envelopeMultiplier: 1.04,
    label: 'AC busway -> rack power shelves -> 50V rack busbar',
    level: 'source-backed' as EvidenceLevel,
  },
  '800v-sidecar': {
    lossRate: 0.03,
    envelopeMultiplier: 1.12,
    label: 'AC white space -> sidecar rectifies to ~800VDC -> rack step-down',
    level: 'source-backed' as EvidenceLevel,
  },
  'facility-hvdc': {
    lossRate: 0.02,
    envelopeMultiplier: 1.18,
    label: 'facility HVDC shifts conversion upstream and reduces row conversion loss',
    level: 'derived' as EvidenceLevel,
  },
};
