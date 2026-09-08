import type { EvidenceLevel, RackVariant } from './rack-facts';

export type ChipId = 'gpu' | 'cpu' | 'hbm' | 'dpu' | 'osfp' | 'nvswitch' | 'coldplate' | 'pdb';
export type TrayKind = 'compute' | 'switch';

export type ChipPart = {
  id: ChipId;
  label: string;
  count: number;
  shareOfTrayKw: number;
  level: EvidenceLevel;
  summary: string;
  detail: string;
};

export type TrayKit = {
  kind: TrayKind;
  title: string;
  summary: string;
  parts: ChipPart[];
};

export const TRAY_KITS: Record<RackVariant, Record<TrayKind, TrayKit>> = {
  'GB200 NVL72': {
    compute: {
      kind: 'compute',
      title: 'Bianca compute tray',
      summary: 'Two Bianca boards in 1U: each board is 1 Grace + 2 Blackwell on one PCB.',
      parts: [
        {
          id: 'gpu',
          label: 'Blackwell GPU',
          count: 4,
          shareOfTrayKw: 0.69,
          level: 'source-backed',
          summary: 'Four GPUs, two per Bianca board.',
          detail: 'SemiAnalysis public GB200 notes: each Bianca carries two Blackwell GPUs next to one Grace, cutting the PCIe switch hop.',
        },
        {
          id: 'cpu',
          label: 'Grace CPU',
          count: 2,
          shareOfTrayKw: 0.12,
          level: 'source-backed',
          summary: 'One Grace per Bianca board.',
          detail: 'CPU and GPU share the board so NVLink-C2C stays on-package instead of crossing a tray cable.',
        },
        {
          id: 'hbm',
          label: 'HBM stack',
          count: 8,
          shareOfTrayKw: 0.08,
          level: 'derived',
          summary: 'HBM sits on the GPU package and rides the same liquid loop.',
          detail: 'Public notes do not split HBM watts from GPU TDP. Share is a modeling split so the open tray can show both.',
        },
        {
          id: 'osfp',
          label: 'OSFP / NIC',
          count: 2,
          shareOfTrayKw: 0.05,
          level: 'source-backed',
          summary: 'Front scale-out cages stay on air.',
          detail: 'Front I/O is the air remainder: OSFP, NIC mezz and fans, not the GPU die.',
        },
        {
          id: 'pdb',
          label: 'tray PDB',
          count: 1,
          shareOfTrayKw: 0.06,
          level: 'source-backed',
          summary: 'Busbar clip to PDB to 12V RapidLock.',
          detail: 'Board power arrives as 4 RapidLock 12V + 4 GND after the tray steps rack DC down.',
        },
        {
          id: 'coldplate',
          label: 'cold plate',
          count: 4,
          shareOfTrayKw: 0,
          level: 'source-backed',
          summary: 'Direct-to-chip plates on Grace and Blackwell.',
          detail: 'Liquid takes the silicon; plates are geometry, not a watt source.',
        },
      ],
    },
    switch: {
      kind: 'switch',
      title: 'NVSwitch tray',
      summary: 'Nine trays close the 72-GPU NVLink domain.',
      parts: [
        {
          id: 'nvswitch',
          label: 'NVSwitch5',
          count: 2,
          shareOfTrayKw: 0.82,
          level: 'source-backed',
          summary: 'Two NVSwitch5 per tray.',
          detail: 'NVL72 keeps scale-up on the rear backplane; NVL36x2 is the SKU that puts OSFP on the front.',
        },
        {
          id: 'coldplate',
          label: 'switch cold plate',
          count: 2,
          shareOfTrayKw: 0,
          level: 'derived',
          summary: 'Switch silicon is on the same liquid domain as compute.',
          detail: 'Public notes confirm liquid on NVSwitch; plate count is inferred from two ASICs.',
        },
        {
          id: 'pdb',
          label: 'switch PDB',
          count: 1,
          shareOfTrayKw: 0.18,
          level: 'assumption',
          summary: 'Tray conversion leftover.',
          detail: 'Switch-tray conversion is not published as a standalone number.',
        },
      ],
    },
  },
  'GB300 NVL72': {
    compute: {
      kind: 'compute',
      title: 'GB300 compute tray',
      summary: '1U hybrid: 2 Grace + 4 B300, liquid on silicon, air on front I/O.',
      parts: [
        {
          id: 'gpu',
          label: 'B300 GPU',
          count: 4,
          shareOfTrayKw: 0.63,
          level: 'source-backed',
          summary: 'Four B300 in one tray.',
          detail: 'Lenovo LP2357 / NVIDIA NVL72 ERA: the compute tray is the 4-GPU unit that fills 18 slots to 72 GPUs.',
        },
        {
          id: 'cpu',
          label: 'Grace CPU',
          count: 2,
          shareOfTrayKw: 0.11,
          level: 'source-backed',
          summary: 'Two Grace host the four GPUs.',
          detail: 'Same 1+2 pairing as GB200, now on Blackwell Ultra silicon.',
        },
        {
          id: 'hbm',
          label: 'HBM on B300',
          count: 8,
          shareOfTrayKw: 0.09,
          level: 'derived',
          summary: 'HBM heat goes to water with the GPU.',
          detail: 'Lenovo cooling split lists CPU/GPU/HBM on liquid. Watts are not broken out, so this share is derived.',
        },
        {
          id: 'dpu',
          label: 'BlueField-3',
          count: 1,
          shareOfTrayKw: 0.04,
          level: 'source-backed',
          summary: 'B3240 on the operator face.',
          detail: 'Front of the tray exposes BMC, BlueField-3, OSFP and E1.S — the surface a tech actually looks at.',
        },
        {
          id: 'osfp',
          label: 'OSFP 800G',
          count: 2,
          shareOfTrayKw: 0.06,
          level: 'source-backed',
          summary: 'Two 800G OSFP cards, air-cooled.',
          detail: 'Scale-out leaves through these cages. Fans track OSFP/BF/PDB temp, not GPU die.',
        },
        {
          id: 'pdb',
          label: 'tray PDB',
          count: 1,
          shareOfTrayKw: 0.07,
          level: 'source-backed',
          summary: 'Rear mid: cartridge + 50V busbar clip.',
          detail: 'Power still arrives as rack DC. 800V sidecar, if present, has already stepped down.',
        },
        {
          id: 'coldplate',
          label: 'cold plate',
          count: 6,
          shareOfTrayKw: 0,
          level: 'source-backed',
          summary: 'Plates on both Grace and all four B300.',
          detail: 'Rear left/right are coolant return/supply into tray quick disconnects.',
        },
      ],
    },
    switch: {
      kind: 'switch',
      title: 'NVLink switch tray',
      summary: 'Nine 1U liquid trays, no front OSFP on the NVL72 SKU.',
      parts: [
        {
          id: 'nvswitch',
          label: 'NVLink switch ASIC',
          count: 2,
          shareOfTrayKw: 0.84,
          level: 'source-backed',
          summary: 'Closes 130 TB/s rack NVLink.',
          detail: 'All 72 GPUs stay non-blocking inside the rack. Blind-mate cartridges take the rear.',
        },
        {
          id: 'coldplate',
          label: 'direct water',
          count: 2,
          shareOfTrayKw: 0,
          level: 'source-backed',
          summary: 'Hoses, not front cages.',
          detail: 'Lenovo lists direct water on the switch tray and only status LEDs on the front.',
        },
        {
          id: 'pdb',
          label: 'switch PDB',
          count: 1,
          shareOfTrayKw: 0.16,
          level: 'assumption',
          summary: 'Conversion crumbs on the tray.',
          detail: 'Not a published shelf-style number.',
        },
      ],
    },
  },
  'VR NVL72': {
    compute: {
      kind: 'compute',
      title: 'Vera Rubin compute tray',
      summary: 'Cableless, fanless: 2 Strata + 4 Orchid + midplane + PDB + BF4.',
      parts: [
        {
          id: 'gpu',
          label: 'Rubin GPU',
          count: 4,
          shareOfTrayKw: 0.66,
          level: 'source-backed',
          summary: 'Four Rubin GPUs in the liquid tray.',
          detail: 'Semi Vera Rubin public architecture: compute density moves the bottleneck to power delivery, not chip supply.',
        },
        {
          id: 'cpu',
          label: 'Vera CPU',
          count: 2,
          shareOfTrayKw: 0.12,
          level: 'source-backed',
          summary: 'Vera hosts the four Rubin GPUs.',
          detail: 'Extreme co-design: CPU/GPU share is a scheduler problem as much as a board problem.',
        },
        {
          id: 'hbm',
          label: 'HBM',
          count: 8,
          shareOfTrayKw: 0.08,
          level: 'derived',
          summary: 'Memory on the GPU package, 100% liquid.',
          detail: 'Fans are gone. Cold plates reach front modules. HBM watts are not separately published.',
        },
        {
          id: 'dpu',
          label: 'BlueField-4',
          count: 1,
          shareOfTrayKw: 0.05,
          level: 'source-backed',
          summary: 'BF4 sits with the front modules.',
          detail: 'Strata at the back; Orchid, BlueField-4, power and management at the front.',
        },
        {
          id: 'pdb',
          label: 'PDB / midplane',
          count: 1,
          shareOfTrayKw: 0.09,
          level: 'source-backed',
          summary: 'Cableless board-to-board path.',
          detail: 'Paladin HD2 + PCB midplane replace flyover cables. Assembly yield becomes architecture.',
        },
        {
          id: 'coldplate',
          label: 'full-tray plates',
          count: 6,
          shareOfTrayKw: 0,
          level: 'source-backed',
          summary: '100% liquid compute tray.',
          detail: 'QDs shrink inside the tray. No tray fans to hide a leak.',
        },
      ],
    },
    switch: {
      kind: 'switch',
      title: 'NVLink 6 tray',
      summary: 'Nine liquid NVLink 6 trays, cableless midplane.',
      parts: [
        {
          id: 'nvswitch',
          label: 'NVLink 6',
          count: 2,
          shareOfTrayKw: 0.86,
          level: 'source-backed',
          summary: 'Next NVLink generation inside the rack.',
          detail: 'Public VR notes keep nine switch trays. ASIC count follows the GB200/300 pattern.',
        },
        {
          id: 'coldplate',
          label: 'liquid switch',
          count: 2,
          shareOfTrayKw: 0,
          level: 'derived',
          summary: 'No air on the switch tray either.',
          detail: 'VR compute is 100% liquid; switch follows the same thermal shift.',
        },
        {
          id: 'pdb',
          label: 'switch PDB',
          count: 1,
          shareOfTrayKw: 0.14,
          level: 'assumption',
          summary: 'Midplane power tap.',
          detail: 'Not a published standalone wattage.',
        },
      ],
    },
  },
};

export function chipLiveKw(trayKw: number, part: ChipPart) {
  return trayKw * part.shareOfTrayKw;
}

export function trayKit(variant: RackVariant, kind: TrayKind) {
  return TRAY_KITS[variant][kind];
}

export function defaultChip(kind: TrayKind): ChipId {
  return kind === 'switch' ? 'nvswitch' : 'gpu';
}

export function powerShareSum(kit: TrayKit) {
  return kit.parts.reduce((sum, part) => sum + part.shareOfTrayKw, 0);
}
