# Cafe Cursor Shanghai — Cheap Cursor Edit

**不要上传。** Media stays on your Mac in `cursor_shanghai_07192026`.  
Architecture: see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Thariq loop: **catalog → (optional Whisper) → JSON EDL → ffmpeg → verify → edit-room**.

---

## Mac runbook

### 0. Pull + deps

```bash
cd /path/to/aileen_machina_01
git fetch && git checkout cursor/cafe-recap-edit-8f58
cd aileena-new && pnpm install
# need ffmpeg + ffprobe on PATH
```

### 1. Import from `cursor_shanghai_07192026`

```bash
# preview
bash scripts/video-edit/from-downloads.sh

# copy into takes/ + photos/, then cut
bash scripts/video-edit/from-downloads.sh --go --render
```

Or explicit:

```bash
bash scripts/video-edit/from-downloads.sh \
  --src ~/Downloads/cursor_shanghai_07192026 \
  --go --render
```

### 2. Or step-by-step

```bash
pnpm video:catalog    # work/catalog.json
pnpm video:plan       # work/final-edit.json
pnpm video:render     # out/cafe-cursor-shanghai-recap.mp4
pnpm video:verify     # work/verify-report.json

# all-in-one
pnpm video:recap
```

### 3. Edit room

```bash
open scripts/video-edit/edit-room.html
# Load work/final-edit.json + attach out/*.mp4
# Tweak sliders → Copy feedback prompt → paste back into Cursor
```

---

## Where files go

| What | Path |
|------|------|
| Videos | `scripts/video-edit/takes/` |
| Photos | `scripts/video-edit/photos/` |
| EDL | `scripts/video-edit/work/final-edit.json` |
| Catalog | `scripts/video-edit/work/catalog.json` |
| QC | `scripts/video-edit/work/verify-report.json` |
| Final | `scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4` |
| Config | `scripts/video-edit/project.json` |

Engine lives in `aileena-new/lib/video-edit/` (reusable).

---

## Recap spine

| Beat | Role | Notes |
|------|------|-------|
| 1 | Brand open | Title card |
| 2 | Place / vibe | Photos + B-roll |
| 3 | Guest demos | Scored video takes |
| 4 | Soft product | Credits soft copy only |
| 5 | Community | Budgeted leftovers |
| 6 | Brand close | `#CafeCursorShanghai` |

---

## Optional Whisper

If you install `openai-whisper` CLI, re-run without `--skip-whisper`:

```bash
pnpm exec tsx scripts/video-edit/cli.ts recap
```

Without Whisper, heuristic_v2 still plans (orientation / duration / audio).

---

## Smoke (dev)

```bash
pnpm video:smoke
```
