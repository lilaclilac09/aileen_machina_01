# Cheap Cursor Edit — Architecture

Thariq-style local loop for Cafe Cursor Shanghai (and future events):

**catalog → optional Whisper → plan (JSON EDL) → ffmpeg render → verify → edit-room feedback**

No paid APIs required. Media never leaves your Mac.

## Layout

```text
aileena-new/
├── lib/video-edit/                 ← reusable engine
│   ├── domain/
│   │   ├── types.ts                types
│   │   ├── schemas.ts              Zod EDL / catalog / QC
│   │   └── paths.ts                project root + portable rel paths
│   ├── ingest/
│   │   ├── probe.ts                ffprobe via argv (no shell injection)
│   │   ├── scanner.ts              recursive takes/ + photos/
│   │   └── catalog.ts              work/catalog.json
│   ├── transcription/
│   │   └── whisper-local.ts        optional `whisper` CLI; skip if missing
│   ├── planning/
│   │   ├── cards.ts                title/outro SVG from project.json
│   │   └── heuristic-planner.ts    scored takes + beat budgets → EDL
│   ├── render/
│   │   ├── ffmpeg-runner.ts        spawnSync argv runner
│   │   └── segment-renderer.ts     segments + audio fades + concat
│   ├── verify/
│   │   └── media-qc.ts             verify-report.json
│   ├── pipeline.ts                 orchestrator
│   └── index.ts
└── scripts/video-edit/             ← project + CLI + room
    ├── project.json                event config (beats, output, brand)
    ├── script.md / EVENT.md
    ├── takes/ photos/ brand/
    ├── work/                       catalog, EDL, cuts, transcripts, QC
    ├── out/                        final mp4
    ├── cli.ts
    ├── inventory.ts / render-recap.ts   thin back-compat wrappers
    ├── from-downloads.sh           import cursor_shanghai_07192026
    ├── run-local.sh
    └── edit-room.html              control room (sliders → prompt)
```

## Pipeline phases

| Phase | Command | Artifact |
|-------|---------|----------|
| Catalog | `pnpm video:catalog` | `work/catalog.json` |
| Plan | `pnpm video:plan` | `work/final-edit.json` (schema v1) |
| Render | `pnpm video:render` | `out/cafe-cursor-shanghai-recap.mp4` |
| Verify | `pnpm video:verify` | `work/verify-report.json` |
| All | `pnpm video:recap` | everything |

## EDL contract (schemaVersion 1)

- Portable **relative** `source` paths
- Per-beat `target_s` / `max_s` budgets (leftovers capped)
- Clip `enabled`, `rationale`, optional `candidates[]` + transcript anchors
- `output` + `audio` policy (keepAudio, fades)
- `publicCopyRules` + `provenance`

Validated with Zod before render.

## Engines

1. **heuristic_v2** (default) — orientation, duration, audio presence, optional transcript density; mid-window cut with early alt candidate.
2. **whisper** (optional) — if `whisper` CLI exists, word-ish segments boost scores; otherwise planner continues.

Remotion is intentionally **not** required for the rough cut. Title/outro are SVG cards. Remotion can plug in later as a `Composer` behind the same EDL.

## Mac path (media in Downloads)

```bash
cd aileena-new
bash scripts/video-edit/from-downloads.sh --go   # → takes/ + photos/
pnpm video:recap
open scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4
open scripts/video-edit/edit-room.html
```

Default drop folder: `~/Downloads/cursor_shanghai_07192026`.

## Design rules

- Argv ffmpeg/ffprobe only (no path shell interpolation)
- Preserve audio on video takes when present; silent AAC on cards/photos for concat stability
- Soft public copy only (no credit-swap)
- Brand bookends required
- Diffable EDL JSON is the source of truth for re-cuts
