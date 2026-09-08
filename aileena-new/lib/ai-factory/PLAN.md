# AI Factory — parked plan

Owner: write it, keep it parked. **Do not merge this slice until asked.**

WebGL stays a camera on `simulatePlant`. Grammar from other repos/films is allowed. Meshes, USD, and paywalled charts are not.

## This slice (draft)

`wafer` camera between campus and hall.

- Cleanroom aisle: LOAD → SORT → METRO → PACK
- Overhead FOUPs on an AMHS rail
- One 300mm wafer on a chuck + cassette
- PACK bay and HALL airlock cut into the plant hall
- Evidence: `assumption`
- Film: campus → wafer dollies; wafer → hall **cuts** (no FogExp2 black frame)

Not in this slice: lithography physics, Omniverse stream, CAD→USD, TPU rack variant.

## Camera ladder (shipped + this draft)

`satellite → campus → wafer → hall → cabinet → rack → open`

Hall / cabinet / rack / open stay on the GB200 / GB300 / VR kernel already on `main`.

## Grammar sources

| Source | Use | Do not use |
| --- | --- | --- |
| [SINRG-Lab/SiliconXR](https://github.com/SINRG-Lab/SiliconXR) / XRFab paper | cleanroom scale, spatial labels | empty Unity package as a scene |
| [srigan-s/microalchemy-demo](https://github.com/srigan-s/microalchemy-demo) | FOUP / carrier aisle in the browser | copy their mesh or call it a real fab |
| [NVIDIA-Omniverse-blueprints/omniverse-dsx-blueprint-for-ai-factories](https://github.com/NVIDIA-Omniverse-blueprints/omniverse-dsx-blueprint-for-ai-factories) | waypoint film grammar (already on `main`) | stream Omniverse / NGC USD |
| Foxconn FODT / TSMC FabTwin | movie camera grammar only | no GitHub, no clone |
| [coder7676mit/vFab-Digital-twin-of-Semiconductor-fabrication-Photolithography-process](https://github.com/coder7676mit/vFab-Digital-twin-of-Semiconductor-fabrication-Photolithography-process) | — | lithography PDE / process DT |

## Parked — later, not this PR

### CAD → SimReady USD

[NVIDIA-Omniverse/aif-pipeline-samples](https://github.com/NVIDIA-Omniverse/aif-pipeline-samples)

Off-site pipeline only. Do not import CAD, do not stream USD, do not claim SimReady in the browser.

### TPU InferenceX (cited in the UI; not in the kernel)

Article: [TPU Inference Externalization Full Steam Ahead - InferenceX](https://newsletter.semianalysis.com/p/tpu-inferencex-full-steam) — Alec Ibarra, Cam Quilici, Bryan Shan et al., **Sep 07, 2026**. **Paid.**

Public preview is now on `/tools/ai-factory-sim` as `source-backed` notes + rack source links. Did **not** put numbers into `simulatePlant`. Paid charts / BOM / Accelerator Model stay out.

Cited:

- InferenceX Official Preview: TPUv7 Ironwood vs B200 / B300
- Bring-up model: Qwen3.5 397B FP8
- At 20 tok/s/user: Ironwood 9,364 tok/s/chip vs B200 8,903 / B300 8,925 (~50.4% tokens/$ vs B200)
- At 100 tok/s/user: $0.181 / M tokens vs B200 $0.222 vs B300 $0.276
- External TPU stack is still aggregated; GB300 NVL72 disagg still leads the middle of the Pareto
- TorchTPU private beta; OSS around mid-October

Still out: TPU rack variant, TPU TCO mixed into GB300 live kW, paywalled charts, Anthropic shipment tables.

### Hall geometry (TASK Phase C)

Sidecar as a second cabinet, CDU row, busway tap-off, whip count. Legacy AC / 800V / HVDC already look different at the rack; hall furniture is still thin.

### Dynamics (TASK Phase B)

Time tick, scheduler-tail pins, leak rope, grid delay. Kernel already has the gap toggles; the 3D world does not animate them yet.

## Never

- Parallel twins
- Numbers without a level
- Restore rejected home experiments (ascii / moodboard / serials / zine)
- Call localhost production proof
- Merge this wafer / plan slice until the owner says merge
