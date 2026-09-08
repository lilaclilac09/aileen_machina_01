# AI Factory Sim — construction task

Not an MVP. Not a moodboard. A source-backed plant twin that can be argued with.

Every visible number is one of:

- `source-backed` — SemiAnalysis public text, NVIDIA ERA, Lenovo GB300 guide/3D tour
- `derived` — computed from sourced constants (P = V·I, Q = ṁ·cp·ΔT, inventory sums)
- `assumption` — screen compression, U leftovers, or a stated modeling choice

If a public source contradicts physics, **show the tension**. Do not smooth it away.

Paid SemiAnalysis BOM photos/models stay out unless the owner supplies lawful access.

## Source inventory (public only)

| Claim | Level | Where |
| --- | --- | --- |
| GB200 ~120-124 kW, 18 compute + 9 NVSwitch | source-backed | Semi GB200 hardware architecture, NVIDIA NVL72 ERA |
| GB300 ~135-142 kW, 18+9, 8×33 kW shelves | source-backed | Lenovo LP2357 / LP2381, Semi public GB300 notes |
| GB300 busbar 1400A @ 50V | source-backed | Lenovo Press — **physics tension kept** |
| VR 180-220 kW, 4×110 kW, 5000A+ liquid busbar | source-backed | Semi Vera Rubin extreme co-design |
| 800V sidecar vs rack 50V step-down | source-backed | Semi 800VDC revolution |
| ~10 racks / CDU | assumption | Semi public belief, not a measured plant |
| Return ceiling 65C | source-backed | published liquid envelope |
| Residual / OOB kW | assumption | leftover BMC, sensors, conversion crumbs |
| Hall aisle / edge heat | assumption | row geometry, not CFD |
| Scheduler-tail pin every 5th tray | assumption | AgentX-style KV hold, not a trace |

## Done

- Rack fact sheets for GB200 / GB300 / VR NVL72
- Front/rear inspect with ports + internals + evidence badges
- Flaw toggles and power-path labels
- Tools nav bleed fix
- Plant kernel (`plant.ts` + `simulate.ts`)
- Hall tiles click to focus a rack

## Phase A — plant kernel in the UI (this slice)

The page is a plant, not a slider toy.

Must compute, per focused rack and for the hall:

1. Load factor from AI load
2. Compute-tray kW × 18, switch-tray kW × 9, residual (mgmt / leftover)
3. IT kW, conversion kW, gap-tax kW, facility MW
4. Busbar: V, required A = P/V, published A, utilization
5. GB300 tension: published 1400A @ 50V cannot carry ~135–142 kW (needs ~2700–2840A). Keep both numbers.
6. Shelf bank: count × kW, installed vs draw, N+1 spare on last GB shelf
7. Liquid kW / air kW from sourced split
8. Inlet / ΔT / return from flow slider + cp; alarm if return > 65C ceiling
9. CDU count at ~10 racks/CDU and load
10. Hall tiles: per-rack thermal + hot-aisle/edge, click to focus
11. Inspect compute → 18 live trays; switch → 9 live NV trays; power → live shelves; busbar → live amps + tension; cooling → inlet/ΔT/return/CDU

Acceptance:

- Changing load / cooling / variant / path / gaps / focused hall rack changes tray kW, amps, return C
- Inspector shows live telemetry next to sourced ports
- 390 has no horizontal overflow
- No fake CFD, no fake MTBF
- PBR camera is allowed only as a view on this kernel; no vendor-scan / Omniverse claim

## Phase B — dynamics

Do not start until Phase A is in the UI and checked.

- Time tick: load slosh between Vera/Rubin-style CPU/GPU share
- Scheduler-tail pins a subset of trays (KV), utilization lies
- Leak rope / drip pan event on cooling AC + high flow
- Grid delay caps hall MW independently of GPU demand

## Phase C — hall geometry

- Sidecar power rack as a second cabinet, not a label
- CDU row, busway tap-off, whip count
- Legacy AC vs 800V sidecar vs facility HVDC look different

## Phase D — spatial 3D (started)

WebGL is a camera on the same kernel. Owner asked for photoreal look now.

- PBR hall + focused rack from sourced inventory (48U stack, 18+9 trays, copper busbar, manifolds, CDU count, sidecar vs busway vs whips)
- Open tray camera: pull one compute/switch tray; clickable GPU / CPU / HBM / DPU / OSFP / NVSwitch / PDB / coldplate
- Scale ladder: satellite globe → campus aerial → hall → closed cabinet → labeled rack → open tray
- Stylized globe/aerial only — **not** live satellite tiles
- Ledger chip intro + live kW share from the same `simulatePlant` kernel
- Live C01–C18 / NV01–NV09 cells open that tray
- Rack camera: 3/4 close-up, fascia C01–C18 / NV01–NV09, side 50V copper spine + teeth, liquid/power cables, drifting heat fog, closed-cabinet nameplate/hinges/LEDs
- Procedural meshes and canvas materials — **not** a Lenovo/NVIDIA scan
- No second model
- No Omniverse stream
- No Unreal photoreal without sourced meshes

## Phase E — wafer line (this branch, do not merge yet)

Owner: keep the wafer. Park CAD→USD. Do not merge this slice until asked.

Grammar only (not a second twin):

| Source | Use | Do not use |
| --- | --- | --- |
| [SINRG-Lab/SiliconXR](https://github.com/SINRG-Lab/SiliconXR) / XRFab paper | cleanroom scale, spatial labels | empty Unity package as a scene |
| [srigan-s/microalchemy-demo](https://github.com/srigan-s/microalchemy-demo) | FOUP / carrier aisle in the browser | copy their mesh or call it a real fab |
| [coder7676mit/vFab-…](https://github.com/coder7676mit/vFab-Digital-twin-of-Semiconductor-fabrication-Photolithography-process) | — | lithography PDE / process DT |
| [NVIDIA-Omniverse/aif-pipeline-samples](https://github.com/NVIDIA-Omniverse/aif-pipeline-samples) | **parked** | CAD→SimReady USD in this browser |
| Foxconn FODT / TSMC FabTwin | movie reference only | no GitHub, no clone |

This slice: `wafer` camera between campus and hall. Procedural 300mm wafer + overhead FOUPs. Evidence `assumption`. Same `simulatePlant` kernel. Film cuts wafer→hall.

Later (not this PR): CAD→SimReady USD stays off-site. Do not stream Omniverse.

## Never

- Parallel twins
- Numbers without a level
- Restore rejected home experiments
- Call localhost production proof
