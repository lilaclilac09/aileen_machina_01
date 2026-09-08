import type { EvidenceLevel, RackFact, RackVariant } from './rack-facts';

export type RackFace = 'front' | 'rear';
export type InspectId = 'compute' | 'power' | 'switch' | 'management' | 'cooling' | 'blank' | 'busbar' | 'cartridge' | 'manifold';

export type InspectorPort = {
  label: string;
  value: string;
  level: EvidenceLevel;
};

export type InspectorSheet = {
  id: InspectId;
  title: string;
  face: RackFace;
  summary: string;
  ports: InspectorPort[];
  internals: RackFact[];
};

export const DEFAULT_INSPECT: InspectId = 'compute';

export const RACK_INSPECTORS: Record<RackVariant, Record<InspectId, InspectorSheet>> = {
  'GB200 NVL72': {
    compute: {
      id: 'compute',
      title: 'compute tray',
      face: 'front',
      summary: '1U tray, two Bianca boards: 1 Grace + 2 Blackwell per board.',
      ports: [
        { label: 'front I/O', value: 'OSFP + NIC mezz + fans', level: 'source-backed' },
        { label: 'rear power', value: 'busbar clip -> PDB -> 12V', level: 'source-backed' },
        { label: 'board connect', value: '4 RapidLock 12V + 4 GND', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'Bianca',
          value: '2 boards / tray',
          level: 'source-backed',
          detail: 'Each Bianca carries one Grace CPU and two Blackwell GPUs on one PCB, cutting the PCIe switch hop.',
        },
        {
          label: 'tray TDP',
          value: '~6.3 kW estimate',
          level: 'source-backed',
          detail: 'Most draw is the two Bianca boards plus eight tray fans.',
        },
      ],
    },
    power: {
      id: 'power',
      title: 'power shelves',
      face: 'front',
      summary: 'Centralized shelves convert AC to rack DC so trays do not carry their own rectifiers.',
      ports: [
        { label: 'input', value: 'AC whip into shelf', level: 'source-backed' },
        { label: 'output', value: '48-54V class busbar', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'why shelves exist',
          value: 'OCP-style rack DC',
          level: 'source-backed',
          detail: 'Power shelves take AC-to-DC once, then feed servers from a shared busbar.',
        },
      ],
    },
    switch: {
      id: 'switch',
      title: 'NVSwitch trays',
      face: 'front',
      summary: 'Nine trays close the 72-GPU NVLink domain inside one rack.',
      ports: [
        { label: 'scale-up', value: 'rear NVLink backplane', level: 'source-backed' },
        { label: 'NVL36 contrast', value: 'front OSFP only on NVL36x2', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'switch silicon',
          value: 'two NVSwitch5 / tray',
          level: 'source-backed',
          detail: 'NVL72 does not need the cross-rack OSFP set used by NVL36x2.',
        },
      ],
    },
    management: {
      id: 'management',
      title: 'OOB management',
      face: 'front',
      summary: 'Out-of-band switches sit above the compute stack in typical MGX layouts.',
      ports: [{ label: 'role', value: 'rack OOB / BMC path', level: 'assumption' }],
      internals: [
        {
          label: 'placement',
          value: 'not a published U map',
          level: 'assumption',
          detail: 'GB200 public notes confirm OOB exists; exact U position is inferred from later MGX guides.',
        },
      ],
    },
    cooling: {
      id: 'cooling',
      title: 'direct-to-chip loop',
      face: 'rear',
      summary: 'Liquid becomes mandatory once density leaves air-cooled H100-class racks.',
      ports: [{ label: 'path', value: 'CDU -> manifold -> cold plates', level: 'source-backed' }],
      internals: [
        {
          label: 'air remainder',
          value: 'still ~15%',
          level: 'derived',
          detail: 'GB200 trays are hybrid: silicon on liquid, front I/O and fans still on air.',
        },
      ],
    },
    blank: {
      id: 'blank',
      title: 'service / blanks',
      face: 'front',
      summary: 'Unused U is filled so airflow and service access stay honest.',
      ports: [{ label: 'status', value: 'layout assumption', level: 'assumption' }],
      internals: [
        {
          label: 'why shown',
          value: 'compressed 48U sketch',
          level: 'assumption',
          detail: 'This is not a vendor elevation. Blanks mark leftover height after known inventory.',
        },
      ],
    },
    busbar: {
      id: 'busbar',
      title: 'rack busbar',
      face: 'rear',
      summary: 'Vertical DC spine feeds every tray before board-level conversion.',
      ports: [{ label: 'class', value: '48-54V DC', level: 'source-backed' }],
      internals: [
        {
          label: 'next hop',
          value: 'PDB then RapidLock 12V',
          level: 'source-backed',
          detail: 'The tray PDB steps rack DC to 12V for Bianca VRMs.',
        },
      ],
    },
    cartridge: {
      id: 'cartridge',
      title: 'NVLink backplane',
      face: 'rear',
      summary: 'Rear fabric keeps all 72 GPUs inside one scale-up domain.',
      ports: [{ label: 'domain', value: 'NVL72, one rack', level: 'source-backed' }],
      internals: [
        {
          label: 'failure lesson',
          value: 'copper backplane ramp risk',
          level: 'source-backed',
          detail: 'Later SemiAnalysis notes treat Blackwell copper-backplane yield as a real ramp constraint.',
        },
      ],
    },
    manifold: {
      id: 'manifold',
      title: 'coolant path',
      face: 'rear',
      summary: 'Facility water only works if the rack can take liquid at the tray.',
      ports: [{ label: 'interface', value: 'direct-to-chip liquid', level: 'source-backed' }],
      internals: [
        {
          label: 'constraint',
          value: 'cooling, not just chips',
          level: 'source-backed',
          detail: 'Sites that cannot deliver liquid density miss the NVL72 TCO case.',
        },
      ],
    },
  },
  'GB300 NVL72': {
    compute: {
      id: 'compute',
      title: 'GB300 compute tray',
      face: 'front',
      summary: '1U hybrid tray: 2 Grace + 4 B300, liquid on silicon, air on front I/O.',
      ports: [
        { label: 'drives', value: 'E1.S bays 0-7', level: 'source-backed' },
        { label: 'mgmt', value: 'BMC RJ-45, USB, mini DP', level: 'source-backed' },
        { label: 'DPU', value: 'BlueField-3 B3240', level: 'source-backed' },
        { label: 'network', value: '2x OSFP cards, 800G', level: 'source-backed' },
        { label: 'rear left/right', value: 'coolant return / supply', level: 'source-backed' },
        { label: 'rear mid', value: 'cartridge + busbar clip', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'cooling split',
          value: 'CPU/GPU/HBM liquid, PDB/OSFP air',
          level: 'source-backed',
          detail: 'Eight dual-rotor fans track OSFP, BlueField, PDB, BMC and drive temperatures, not GPU die temp.',
        },
        {
          label: 'LEDs',
          value: 'power, ID, NVLink, fault',
          level: 'source-backed',
          detail: 'Operator face is a real status surface: locate, link, fault, drive activity.',
        },
      ],
    },
    power: {
      id: 'power',
      title: '50V power shelf',
      face: 'front',
      summary: '1U MGX shelf: six 5.5 kW PSUs, 33 kW, 6 or 8 shelves per rack.',
      ports: [
        { label: 'front', value: 'PMC + 6 PSU modules', level: 'source-backed' },
        { label: 'rear whip', value: '60A IEC60309', level: 'source-backed' },
        { label: 'rear DC', value: 'busbar connector', level: 'source-backed' },
        { label: 'share', value: 'RJ-45 daisy chain', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'redundancy',
          value: '6 non-red / 8 redundant',
          level: 'source-backed',
          detail: 'Eight 33 kW shelves install 264 kW against ~142 kW draw so the bus can ride transients.',
        },
        {
          label: 'busbar',
          value: 'single 1400A, 50V',
          level: 'source-backed',
          detail: 'Lenovo lists one middle-rear busbar for the MGX rack.',
        },
      ],
    },
    switch: {
      id: 'switch',
      title: 'NVLink switch tray',
      face: 'front',
      summary: 'Nine 1U liquid trays, no front OSFP in the NVL72 SKU.',
      ports: [
        { label: 'front', value: 'status / ID / power LEDs', level: 'source-backed' },
        { label: 'rear', value: 'blind-mate cartridges', level: 'source-backed' },
        { label: 'coolant', value: 'direct water hoses', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'fabric',
          value: '130 TB/s rack NVLink',
          level: 'source-backed',
          detail: 'All 72 GPUs stay non-blocking inside the rack; scale-out leaves through compute-tray OSFPs.',
        },
      ],
    },
    management: {
      id: 'management',
      title: 'SN2201 OOB pair',
      face: 'front',
      summary: 'Two Spectrum management switches, DC-powered from the rack busbar.',
      ports: [
        { label: 'role', value: 'tray + shelf OOB', level: 'source-backed' },
        { label: 'power', value: 'DC from busbar', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'leak path',
          value: 'OOB + drip pan + ropes',
          level: 'source-backed',
          detail: 'NVIDIA documents tray-level and rack-level leak detection into the management plane.',
        },
      ],
    },
    cooling: {
      id: 'cooling',
      title: 'manifolds + leak pan',
      face: 'rear',
      summary: 'Left/right manifolds, top or bottom feed, stainless, rear service.',
      ports: [
        { label: 'QD', value: 'UQDB04 / UQD04 bleed', level: 'source-backed' },
        { label: 'material', value: '304L or 316L', level: 'source-backed' },
        { label: 'floor', value: 'leakage drip pan', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'heat split',
          value: '~90% liquid / ~10% air',
          level: 'source-backed',
          detail: 'Warm inlet water up to 45C is in the public guide; most operators still design colder.',
        },
      ],
    },
    blank: {
      id: 'blank',
      title: 'drip pan / blanks',
      face: 'front',
      summary: 'Dummy panels fill unused slots; the drip pan is a real leak surface.',
      ports: [
        { label: 'pan', value: 'source-backed', level: 'source-backed' },
        { label: 'blank U', value: 'compressed remainder', level: 'derived' },
      ],
      internals: [
        {
          label: 'do not invent U',
          value: 'inventory, not elevation',
          level: 'assumption',
          detail: 'Known pieces are 2+6/8+18+9. Leftover height is sketched, not claimed as a Lenovo drawing.',
        },
      ],
    },
    busbar: {
      id: 'busbar',
      title: '50V / 1400A busbar',
      face: 'rear',
      summary: 'Single-zone rear spine. 800VDC is not inside this generation.',
      ports: [
        { label: 'rating', value: '1400A MGX', level: 'source-backed' },
        { label: 'voltage', value: '47.5-51.5V, 50V nom', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'limit',
          value: 'current, not voltage',
          level: 'source-backed',
          detail: 'SemiAnalysis: VR still steps 800V sidecar down to 50V before the tray. Kyber is the later shift.',
        },
      ],
    },
    cartridge: {
      id: 'cartridge',
      title: 'cable cartridges',
      face: 'rear',
      summary: 'Four NVIDIA cartridges protect the NVLink copper between compute and switch trays.',
      ports: [
        { label: 'count', value: '4 rear cartridges', level: 'source-backed' },
        { label: 'mate', value: 'blind-mate from trays', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'why cased',
          value: 'connector + wire protection',
          level: 'source-backed',
          detail: 'The cartridge is a chassis around the high-speed channels, not loose DAC spaghetti.',
        },
      ],
    },
    manifold: {
      id: 'manifold',
      title: 'rear manifolds',
      face: 'rear',
      summary: 'Inlet and outlet on left and right; CA40 top feed or C5RN bottom feed.',
      ports: [
        { label: 'hose', value: 'tri-clamp to CDU', level: 'source-backed' },
        { label: 'static', value: '30 psi at QD', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'service',
          value: 'rear of rack only',
          level: 'source-backed',
          detail: 'Short hoses stay on the cabinet; intermediate hoses change with tray placement.',
        },
      ],
    },
  },
  'VR NVL72': {
    compute: {
      id: 'compute',
      title: 'VR compute tray',
      face: 'front',
      summary: 'Cableless, fanless, 100% liquid. Six modules on a PCB midplane.',
      ports: [
        { label: 'front left/right', value: 'Orchid x4, stacked', level: 'source-backed' },
        { label: 'front center', value: 'BF4 + PDB + mgmt', level: 'source-backed' },
        { label: 'rear', value: '2 Strata + NVLink HD2', level: 'source-backed' },
        { label: 'coolant', value: 'UQD in left, out right', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'Strata',
          value: 'Vera + 2 Rubin + SOCAMM',
          level: 'source-backed',
          detail: 'Takes 50V directly, IBC to 12V, VRM to ~1V. About 4800W per module vs Bianca at ~3000W.',
        },
        {
          label: 'assembly',
          value: '2 hours -> 5 minutes',
          level: 'source-backed',
          detail: 'Jensen/CES: board-to-board Paladin HD2 replaces flyover cables that failed on GB200/300.',
        },
      ],
    },
    power: {
      id: 'power',
      title: '4x 110kW shelves',
      face: 'front',
      summary: 'Each shelf is 3U, six 18.3 kW PSUs, N+1 for a 220 kW Max-P rack.',
      ports: [
        { label: 'AC', value: '2x 100A 415-480V whips', level: 'source-backed' },
        { label: 'DC', value: 'step down to 50V busbar', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'sidecar case',
          value: 'still needs DC-DC shelves',
          level: 'source-backed',
          detail: 'Even with an 800V power rack, VR trays only accept 50V. Conversion stays in the IT rack.',
        },
      ],
    },
    switch: {
      id: 'switch',
      title: 'NVLink 6 trays',
      face: 'front',
      summary: '36 switch ASICs, four chips per tray, same 28.8T per chip at double rate.',
      ports: [{ label: 'backplane', value: 'Paladin HD2 to Strata', level: 'source-backed' }],
      internals: [
        {
          label: 'count',
          value: '9 trays / 36 ASICs',
          level: 'source-backed',
          detail: 'Switch count doubles versus GB200 even though per-chip bandwidth stays 28.8T.',
        },
      ],
    },
    management: {
      id: 'management',
      title: 'SMM / DC-SCM',
      face: 'front',
      summary: 'Slim management stack beside BlueField-4. Hyperscalers swap this module.',
      ports: [{ label: 'custom', value: 'form-factor locked', level: 'source-backed' }],
      internals: [
        {
          label: 'Nvidia lock',
          value: 'only mgmt + PDB + BF4',
          level: 'source-backed',
          detail: 'SemiAnalysis: those three front modules are the only compute-tray parts Nvidia still lets customers redesign.',
        },
      ],
    },
    cooling: {
      id: 'cooling',
      title: 'internal manifold',
      face: 'rear',
      summary: 'Middle-chassis manifold plus MQDs to every module cold plate.',
      ports: [
        { label: 'in', value: 'rear-left UQD', level: 'source-backed' },
        { label: 'out', value: 'rear-right UQD', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'cold plates',
          value: 'MCCP 100 micron + gold',
          level: 'source-backed',
          detail: 'Strata gets one plate over GPUs, Vera, SOCAMM and VRMs. Gold is there for liquid-metal TIM2.',
        },
        {
          label: 'flow',
          value: '~2.0-2.5x Blackwell',
          level: 'derived',
          detail: 'Same pressure envelope, more flow, 45C inlet marketing, 65C return belief. Not a measured plant number.',
        },
      ],
    },
    blank: {
      id: 'blank',
      title: 'manifold / service U',
      face: 'front',
      summary: 'Service height around the liquid plant is derived, not photographed.',
      ports: [{ label: 'confidence', value: 'derived + assumption', level: 'derived' }],
      internals: [
        {
          label: 'gap',
          value: 'no public VR elevation',
          level: 'assumption',
          detail: 'Power shelf height is sourced (4x 3U). Remaining blanks are a screen compression, not a BOM line.',
        },
      ],
    },
    busbar: {
      id: 'busbar',
      title: 'liquid-cooled 5000A+ busbar',
      face: 'rear',
      summary: 'Current, not voltage, is the rack-level limiter. No fans left to cool copper.',
      ports: [
        { label: 'GB200/300', value: '2900A class notes', level: 'source-backed' },
        { label: 'VR', value: '5000A+', level: 'source-backed' },
      ],
      internals: [
        {
          label: 'physics',
          value: 'I^2R + no fans',
          level: 'source-backed',
          detail: 'SemiAnalysis: the busbar itself must be liquid cooled once VR removes tray fans.',
        },
      ],
    },
    cartridge: {
      id: 'cartridge',
      title: 'board-to-board fabric',
      face: 'rear',
      summary: 'Paladin HD2 + midplane replace the flyover cables that failed in Blackwell assembly.',
      ports: [{ label: 'signal move', value: 'CX-9 to front Orchid', level: 'source-backed' }],
      internals: [
        {
          label: 'why PCB now',
          value: 'PCIe6 long, 200G short',
          level: 'source-backed',
          detail: 'NIC sits near the OSFP so the long run is PCIe Gen6 over upgraded CCL, not 200G Ethernet over cable.',
        },
      ],
    },
    manifold: {
      id: 'manifold',
      title: 'tray + rack manifolds',
      face: 'rear',
      summary: 'Internal tray manifold plus rack UQDs. Larger QDs expected for the flow jump.',
      ports: [{ label: 'in-tray QD', value: 'MQD compact spec', level: 'source-backed' }],
      internals: [
        {
          label: 'CDU ratio',
          value: 'keep ~10 racks / CDU',
          level: 'derived',
          detail: 'If rack heat doubles, CDU capacity must rise or the 10:1 habit breaks.',
        },
      ],
    },
  },
};

export const REAR_INSPECT_BY_LABEL: Record<string, InspectId> = {
  'busbar spine': 'busbar',
  'single rear busbar': 'busbar',
  'liquid-cooled busbar': 'busbar',
  'NVLink backplane': 'cartridge',
  'cable cartridges': 'cartridge',
  'board-to-board path': 'cartridge',
  'coolant path': 'manifold',
  'rear manifolds': 'manifold',
  'internal manifold': 'manifold',
};
