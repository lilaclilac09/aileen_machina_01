# Cheap Cursor Video Edit — playbook

**Scope of this doc.** How we built a *local*, rule-based event-recap editor in this repo; how it differs from Premiere-style cutting; how to tune it; what “quality” and “story coherence” mean here; and what we do *not* have yet (real face detection). It is written so the next Cafe / IRL event can reuse the same engine without rediscovering the loop.

**Not in scope.** Cloud upload, Remotion-required motion graphics, paid edit APIs, or a claim that v1 looks like a finished trailer.

**One-line meme (honest).** First time editing videos with AI tools I built myself — and they gave me a slide deck, in chronological order. Amazing. This playbook is how that stack works, and how to make the next cut less Keynote.

---

## 1. What this is

A Mac-local pipeline inspired by the **agent-writes-JSON-EDL → ffmpeg executes** pattern popularized for Claude Code video work (see [References](#9-references)):

```text
drop media → catalog → (optional Whisper) → plan (JSON EDL) → ffmpeg → verify → human watch
```

| Piece | Path |
|-------|------|
| Reusable engine | [`aileena-new/lib/video-edit/`](../lib/video-edit/) |
| Event project + CLI | [`aileena-new/scripts/video-edit/`](../scripts/video-edit/) |
| Beat / grade / brand knobs | [`scripts/video-edit/project.json`](../scripts/video-edit/project.json) |
| Architecture notes | [`scripts/video-edit/ARCHITECTURE.md`](../scripts/video-edit/ARCHITECTURE.md) |
| Operator README (中文 steps) | [`scripts/video-edit/README.md`](../scripts/video-edit/README.md) |

**Source of truth for a cut:** `work/final-edit.json` (schema v1 EDL), not a Premiere project file.

**Constraint:** media stays on the machine. No upload step in the happy path.

---

## 2. How the repo piece was made (reuse for the next event)

1. **Keep the engine** — `lib/video-edit/` (ingest, tags, heuristic planner, ffmpeg render, Zod QC).
2. **Fork the project folder** — copy or edit `scripts/video-edit/project.json`: `id`, `title`, `date`, `hashtag`, `url`, `mediaDropFolder`, `beats[]`, `output.grade`, `brand`.
3. **Folders = labels** — put priority media where tags are cheap:
   - Final timelapse → `takes/timelapse/` (or filename with `延时` / `timelapse`)
   - Smiles / people stills → `photos/smiles/`, `photos/girls/`, `photos/guys/`
   - Other video / photo → `takes/`, `photos/`
4. **Stage** — `bash scripts/video-edit/stage-media.sh` then `--go` (DJI-aware; skips `._*`).
5. **Run** — `pnpm video:recap` (or `catalog` → `plan` → `render` → `verify`).
6. **Watch** — `out/<filename>.mp4` + optional `edit-room.html` for feedback, not as an NLE.

```mermaid
flowchart LR
  Drop[Media drop] --> Stage[stage-media.sh]
  Stage --> Catalog[catalog.json]
  Catalog --> Plan[final-edit.json]
  Plan --> Cuts[cuts/seg-NNN.mp4]
  Cuts --> Out[out/*.mp4]
  Out --> QC[verify-report.json]
```

---

## 3. vs ordinary editing

| Ordinary NLE | This stack |
|--------------|------------|
| Human watches every take | Heuristic scores + path/filename tags |
| Continuous timeline drag | Discrete clips + beat budgets |
| Binary / proprietary project | Diffable JSON EDL |
| Face / smile by eye | **No face model today** — folder + filename tags only |
| Story by editor judgment | Fixed beat skeleton (title → … → timelapse → outro) |
| Quality = “does it feel right?” | Machine QC = duration / streams / resolution; look = human |

**Collage model.** Manual edit is a continuum. Here collage is Lego: quotas fill beats; leftovers can flood `community` into a chronological stills slideshow (the “amazing slides” failure mode). Fix with quotas, not with hoping the model “gets taste.”

**Tools.**

| Tool | Role |
|------|------|
| ffmpeg / ffprobe | Probe, Ken Burns, grade, cut, concat — **only renderer** |
| Node + tsx + Zod | Orchestration + EDL validation |
| whisper CLI (optional) | Local transcripts to boost take scores |
| bash `stage-media` | Binning instead of manual bins |
| Premiere / FCP / Resolve | Optional *after* rough cut |

Remotion is intentionally **not** required for the rough cut (same EDL could feed a Composer later).

---

## 4. How to adjust

| Want | Knob |
|------|------|
| Shorter / less “PPT” | Lower `beats[].photoQuota`, `planner.photoDuration_s`, `leftoverMaxExtra_s`; set `absorbLeftovers` carefully |
| More people energy | Put stills in `photos/smiles/` (and girls/guys); check planner bonuses in `project.json` |
| Force real finale | File in `takes/timelapse/` or name with `延时` / `timelapse`; `forceFinalTimelapse: true` |
| Color (less blue / less yellow) | `output.grade` — `eq` + `colorbalance`; reduce `*Blue` if skin goes cyan |
| Audio | `keepAudio`, fades; timelapse often silent by design |
| Re-plan only | `pnpm video:plan` |
| Re-grade / re-render only | `pnpm video:render && pnpm video:verify` |
| Full loop | `pnpm video:recap` |

---

## 5. Quality — what we guarantee vs what we don’t

**Machine (already in repo)**

- Zod on EDL before render
- Sources exist on disk
- `verify-report.json`: expected vs actual duration, has video/audio, 1920×1080
- `pnpm video:smoke` without a full media drop

**Human checklist (required before sharing)**

- [ ] Title / outro show real text (not a blank brand-color bar — brew ffmpeg may fail SVG raster)
- [ ] Finale is the real timelapse, not a random DJI take
- [ ] Community does not feel like Keynote
- [ ] Skin / room color not crushed cyan or muddy yellow
- [ ] Soft public copy only (no credit-swap talk)

QC does **not** score beauty, smiles, or narrative emotion.

---

## 6. Story coherence — how far it goes

**Coherence here = a fixed narrative skeleton**, not an LLM screenwriter:

`brand_open → place → guest_demos → soft_product → community → timelapse_finale → brand_close`

Within beats: quotas, `max_s` trimming, smile-first then girls/guys mix, forced timelapse before outro.

**Not implemented:** shot-to-shot semantic matching, emotion curves, multi-camera person tracking, automatic “best smile” CV.

Optional Whisper improves *take* scoring when speech density helps; it does not write VO.

---

## 7. Faces / smiles — current vs later

**Current.** No OpenCV / Vision / landmark model. Tags in [`lib/video-edit/planning/tags.ts`](../lib/video-edit/planning/tags.ts) from path + filename (`smile`, `girls`, `guys`, `timelapse`, …). Quality lever: **put the right stills in the right folders.**

**Later (interface only — not built).** Catalog fields like `faceScore` / `smileScore` → planner bonuses; local-only detectors to keep the no-upload rule; QC check “≥ N face-bearing stills.”

---

## 8. Formats

| Artifact | Format |
|----------|--------|
| Event config | `project.json` |
| Media inventory | `work/catalog.json` |
| Edit decision list | `work/final-edit.json` (schema v1) |
| Title / outro cards | `work/cards/*.svg` |
| Segments | `work/cuts/seg-*.mp4` |
| Concat list | `work/concat.txt` |
| QC | `work/verify-report.json` |
| Delivery | `out/*.mp4` (H.264 + AAC, default 1080p) |

---

## 9. References

1. **Thariq Shihipar (Anthropic)** — *How Fable Edited Its Own Video* (Claude Code / agent loop: Whisper → JSON edit list → ffmpeg → verify). Deck: [thariqs.github.io/cc-video-editing-deck](https://thariqs.github.io/cc-video-editing-deck/). This repo’s `lib/video-edit` comments and [`ARCHITECTURE.md`](../scripts/video-edit/ARCHITECTURE.md) call the same shape a “Thariq-style local loop”; our Cafe cut is a **cheaper, heuristic, Remotion-optional** cousin for IRL recap media, not a reimplementation of Fable’s launch edit.
2. **FFmpeg** — [ffmpeg.org](https://ffmpeg.org/) — cut, grade (`eq` / `colorbalance`), `zoompan`, concat.
3. **OpenAI Whisper** (optional local CLI) — transcript anchors for take scoring when installed.
4. **Zod** — runtime EDL / catalog / QC schemas in `lib/video-edit/domain/schemas.ts`.

---

## 10. Minimum checklist for the next event

1. Copy / edit `project.json` metadata and beats.  
2. Clear or replace `takes/` + `photos/`.  
3. Stage from Downloads → confirm timelapse + smile bins.  
4. `pnpm video:recap`.  
5. Run the human checklist in §5.  
6. If it still looks like chronological slides: cut photo quotas first, then re-plan.

**Planned home on Machina:** a future **AI Lab** section (`/ai-lab`) for this write-up and sibling experiments — separate from the `/tools` arcade.
