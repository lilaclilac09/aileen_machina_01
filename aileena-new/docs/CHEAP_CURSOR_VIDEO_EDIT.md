# First cut: editing with AI tools I built myself

*Cheap Cursor Video Edit — Cafe Cursor Shanghai, and the loop we reuse next time.*

---

## Scope

This article explains **one local video stack** in the Machina repo: how it was built, what it deliberately is not, how it differs from ordinary NLE cutting, how to tune a recap, and how we talk about quality, story, and faces without lying.

**In scope**

- The reusable engine under `aileena-new/lib/video-edit/`
- The event project under `aileena-new/scripts/video-edit/`
- Operator knobs in `project.json`
- Honest limits (slideshow failure mode, no face CV yet)

**Out of scope**

- Cloud upload of event media
- Remotion as a hard dependency
- Paid “AI editor” APIs
- Claiming v1 looked like a finished trailer

**Line we earned the hard way**

> First time editing videos with AI tools I built myself.  
> And they gave me a slide — in chronological order.  
> Amazing.

The rest of this piece is how that machine works, who we cite for the pattern, and how the next event avoids Keynote energy.

---

## The idea (and who we cite)

Ordinary editors live on a timeline. You scrub, mark in/out, grade by eye, export.

A different pattern showed up in agentic coding: **write the edit as data, then let ffmpeg execute it.** Transcribe or score takes, pick windows, dump a JSON edit decision list, cut segments, concat, verify like a build. That shape is what we mean when the repo says *Thariq-style local loop* — after **Thariq Shihipar (Anthropic)** and the public walkthrough of how Fable’s launch video was cut with Claude Code → Whisper → JSON → ffmpeg (see References).

Our Cafe Cursor Shanghai cut is a **cheaper cousin** of that idea:

- Heuristic planner instead of a full agent rewrite every night  
- Folder tags instead of deep vision  
- Remotion optional later; rough cut is ffmpeg only  
- Media never leaves the Mac  

Loop:

```text
drop media → stage → catalog → (optional Whisper) → plan (JSON EDL) → ffmpeg → verify → human watch
```

Source of truth for a cut: `work/final-edit.json`, not a Premiere project.

---

## How we built it in this repo

Two layers:

| Layer | Where | Job |
|-------|--------|-----|
| Engine | `lib/video-edit/` | Probe, tag, plan, render, Zod QC |
| Project | `scripts/video-edit/` | One event’s `project.json`, takes, photos, out |

**Folders are labels.** Put the finale in `takes/timelapse/` (or name it `延时` / `timelapse`). Put people stills in `photos/smiles/`, `photos/girls/`, `photos/guys/`. Staging (`stage-media.sh`) bins Downloads; catalog writes `work/catalog.json`; the planner fills beats under time budgets; render writes `cuts/seg-*.mp4` and concatenates to `out/*.mp4`; verify writes `verify-report.json`.

Reuse for the next IRL night: keep the engine, edit `project.json` (id, title, date, hashtag, beats, grade), replace media, stage, `pnpm video:recap`.

---

## What is different from “normal” editing

| Manual NLE | This stack |
|------------|------------|
| Taste on every frame | Scores + path/filename tags |
| Continuous timeline | Discrete clips + beat quotas |
| Opaque project file | Diffable JSON EDL |
| Faces by eye | **No face model** — bins and names only |
| Story by the editor | Fixed skeleton: open → vibe → demos → product → community → **timelapse** → outro |
| “Does it feel right?” | Machine checks duration / streams / 1080p; look is still human |

**Collage.** In Premiere, collage is continuous. Here it is Lego. Quotas fill beats. If `community` absorbs too many leftovers, you get the meme: a chronological stills deck with Ken Burns. That is not “AI narrative.” That is a budget bug. Fix quotas (`photoQuota`, `photoDuration_s`, `leftoverMaxExtra_s`), do not wait for vibes.

**Tools in the loop:** ffmpeg/ffprobe (only renderer), Node + tsx + Zod, optional local Whisper, bash staging. Premiere stays available *after* the rough cut.

---

## How to adjust without reopening Premiere

| Goal | Move |
|------|------|
| Less slideshow | Cut photo quotas and leftover seconds; re-plan |
| More smiles / people | Put files in the right photo bins; check planner bonuses |
| Real finale | Real `延时` file in `takes/timelapse/`; `forceFinalTimelapse` |
| Color (too blue / too yellow) | `output.grade` — pull `*Blue` down if skin goes cyan |
| Audio | `keepAudio` + fades; timelapse often silent |
| Rules only | `pnpm video:plan` |
| Grade / pixels only | `pnpm video:render` |
| Everything | `pnpm video:recap` |

---

## Quality: machine vs human

**Machine already does:** Zod on the EDL, missing-source checks, duration drift, presence of video/audio, resolution, smoke without a full drop.

**Machine does not do:** beauty, emotion, “is this the right smile,” “does this feel like Cafe.”

**Before you share, a human still checks:**

1. Title and outro show **text**, not a blank brand bar (brew ffmpeg often cannot rasterize SVG cards).  
2. Finale is the **real** timelapse, not a random DJI clip that sorted first.  
3. Middle section is not Keynote.  
4. Grade is not crushed cyan or muddy yellow.  
5. Soft public copy only.

---

## Story coherence (the honest version)

Coherence here means a **fixed beat spine**, not an LLM screenwriter:

`brand open → place → guest energy → soft product → community → timelapse finale → close`

Inside a beat: quotas, `max_s` trim, smile-first then mixed people, forced finale before outro. Optional Whisper can help score talky takes; it does not write voiceover.

We do **not** have shot-to-shot semantic matching, emotion curves, or person tracking across cameras.

---

## Faces — what we pretend vs what we have

We do not run face detection. “Smile” and “girls/guys” are **path and filename tags** (see `planning/tags.ts`). The quality lever is boring and real: put the right stills in the right folders.

Later, if AI Lab grows this stack: catalog scores (`faceScore` / `smileScore`), local-only detectors (no upload), QC gates like “at least N face-bearing stills.” Not built yet.

---

## Formats worth remembering

`project.json` → `catalog.json` → **`final-edit.json` (EDL)** → `cards/*.svg` → `cuts/seg-*.mp4` → `concat.txt` → `verify-report.json` → **`out/*.mp4`**.

---

## References

1. **Thariq Shihipar (Anthropic).** *How Fable Edited Its Own Video* — agent loop: Whisper → JSON edit list → ffmpeg → verify. Deck: [thariqs.github.io/cc-video-editing-deck](https://thariqs.github.io/cc-video-editing-deck/). Our architecture notes name this a Thariq-style loop; Cafe recap is a heuristic, Remotion-optional cousin for IRL media, not a port of Fable’s launch edit.  
2. **FFmpeg** — [ffmpeg.org](https://ffmpeg.org/) — cut, `eq` / `colorbalance`, `zoompan`, concat.  
3. **OpenAI Whisper** (optional local CLI) — transcript anchors for take scoring.  
4. **Zod** — EDL / catalog / QC schemas in `lib/video-edit/domain/schemas.ts`.

---

## Next event, minimum path

1. Edit `project.json` for the new night.  
2. Replace `takes/` and `photos/`.  
3. Stage; confirm timelapse + smile bins.  
4. `pnpm video:recap`.  
5. Run the human checklist.  
6. If it still looks like chronological slides — cut photo budget first, then re-plan.

**On Machina later:** this write-up belongs in a new **AI Lab** section (`/ai-lab`), separate from the `/tools` arcade — experiments and “how we built it,” not only utilities.

---

*Operator steps in Chinese live in [`scripts/video-edit/README.md`](../scripts/video-edit/README.md). Layout detail: [`ARCHITECTURE.md`](../scripts/video-edit/ARCHITECTURE.md).*
