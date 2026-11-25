# Cafe Cursor Shanghai — Recap A/B Report

**Date:** 13 November 2026
**Event:** Cafe Cursor Shanghai, Sunday 19 July 2026, Yanqing Road, Shanghai
**Deliverables:** two rough-cut recaps (about 2 minutes each) of the same morning footage

## What we had

The Drive folder held **59 video clips and 300 photos, 6.0 GB in total**, all from the morning, 09:16 to 12:21. The clips are short DJI takes, 4 to 19 seconds each, about 11 minutes of footage altogether. The photos are 296 Canon shots plus 4 DJI stills.

This matters because the footage is **morning-only**. The afternoon and evening moments in the brief — the guitar, the piano, the piece written for a girlfriend, the sudden plum-rain downpour, the group photo — are not in this batch. If they exist, they are not in this folder. Both cuts below are therefore morning recaps, not full-day recaps.

## Version A — Muse picks

**File:** `recap-rough.mp4` — 123 seconds, 17 segments, 146 MB, 2688×1512 H.264.

**Method.** I read the combined transcript and looked at the keyframes myself, then chose moments against the master prompt (arrival, setup, talks, demos, questions, laughter). The transcripts were mostly hallucinated crowd noise, so the picks were made from the pictures, not the words.

**Picks (17):**

| # | Clip | Time | Title |
|---|------|------|-------|
| 1 | 0025 | 0.0–5.4 | Arriving — sunny Yanqing Road |
| 2 | 0042 | 0.0–7.0 | Cursor Cafe — the banner |
| 3 | 0001 | 0.0–6.8 | Setting up the screen |
| 4 | 0002 | 0.0–6.6 | Coffee brewing |
| 5 | 0007 | 2.0–10.0 | First talk — the room fills |
| 6 | 0020 | 1.0–9.0 | Live code on the big screen |
| 7 | 0022 | 0.0–7.4 | The host rallies the room |
| 8 | 0026 | 0.0–7.7 | Cursor Cafe — the door |
| 9 | 0029 | 2.0–10.0 | Q&A — leaning in |
| 10 | 0031 | 2.0–10.0 | Demo on screen |
| 11 | 0034 | 4.0–12.0 | Spilling onto the street |
| 12 | 0040 | 0.0–7.5 | A phone demo |
| 13 | 0046 | 2.0–10.0 | Swipe left, swipe right |
| 14 | 0051 | 4.0–14.0 | Pairoa — the room laughs |
| 15 | 0059 | 0.0–9.5 | Your agents work |
| 16 | 0079 | 0.0–3.6 | Noon — the banner |
| 17 | 0080 | 0.0–3.8 | By the banner, still talking |

## Version B — Inkling 2 Small picks

**File:** `recap-inkling.mp4` — 109 seconds, 16 segments.

**Method.** Inkling 2 Small read the same master prompt, the same transcripts and all 66 keyframes, then returned its own picks as structured data. The full method is in the companion report, `how-inkling-2-small-cut-this-video.md` (ripple repo).

**Picks (16):**

| # | Clip | Time | Title |
|---|------|------|-------|
| 1 | 0026 | 0:00–0:07 | Doors open at the Cursor Cafe |
| 2 | 0032 | 0:00–0:07 | Hosts by the Cursor Cafe banner |
| 3 | 0002 | 0:00–0:05 | Drinks at the bar counter |
| 4 | 0003 | 0:00–0:07 | People settling in with laptops |
| 5 | 0007 | 0:00–0:06 | Host opens to a packed room |
| 6 | 0021 | 0:00–0:07 | Dashboard talk |
| 7 | 0031 | 0:00–0:06 | Live screen-setting demo |
| 8 | 0036 | 0:00–0:05 | Shim by feel, shipping demo |
| 9 | 0048 | 0:00–0:07 | AI Mi app launch page |
| 10 | 0050 | 0:03–0:10 | Pairoa, question from the floor |
| 11 | 0051 | 0:08–0:16 | The room laughing at the demo |
| 12 | 0059 | 0:00–0:09 | Your agents work, you sleep |
| 13 | 0062 | 0:03–0:09 | Pointing at the ARIAVA slide |
| 14 | 0070 | 0:02–0:10 | This is the era of imitation |
| 15 | 0063 | 0:00–0:08 | Volunteers behind the bar |
| 16 | 0074 | 0:00–0:06 | Check-in at the doorway |

## Side by side

**Agreement.** Both cuts picked the same 6 clips: 0002 (coffee), 0007 (first talk), 0026 (door), 0031 (demo), 0051 (laughter), 0059 (agents). Those are the anchors of the morning. Where both picked the same clip, the chosen moments usually overlap.

**Divergence.** Version A is the only one with 11 clips (0001, 0020, 0022, 0025, 0029, 0034, 0040, 0042, 0046, 0079, 0080). Version B is the only one with 10 clips (0003, 0021, 0032, 0036, 0048, 0050, 0062, 0063, 0070, 0074). So about a third of each cut is shared and two thirds is distinct.

**What each side leaned towards.**

- Version A leans atmospheric and structural: the street arrival, three banner shots, the setup, the room spilling onto the street, the noon banner. It builds the place first and the demos second.
- Version B leans product-specific: it names the demos on screen (Shim by feel, AI Mi, Pairoa, ARIAVA, "the era of imitation"). It read the screens and picked the sharpest product moment in each. It also picked more front-of-house beats (hosts by the banner, volunteers behind the bar, check-in at the doorway).

**Cutting habits.** Version A trims into the middle of clips (for example 0029 at 2–10s, 0034 at 4–12s, 0051 at 4–14s). Version B mostly takes clips from 0:00 (12 of 16 start at 0:00), with only a few trimmed starts (0050 at 0:03, 0051 at 0:08, 0062 at 0:03, 0070 at 0:02). Inkling trusts the clip start; I cut to the beat inside.

**Length.** Version A runs 123 seconds, version B 109 seconds. Both are roughly two minutes. Version B is shorter mainly because Inkling's output was cut short (see below), not because it chose less.

## Method differences

### The 2 MB limit

Inkling rejects any single attached asset over 2,097,152 bytes (2 MB). A raw 4K clip is 20 to 140 MB, so video can never be attached directly. Both sides worked around this the same way: never send video, send text (transcript) and still images (keyframes) only, and cut locally with ffmpeg from the returned timestamps.

The difference is in how the frames were prepared. I worked from full-resolution frames on local disk. Inkling received 66 keyframes downscaled to 1280 px wide (about 30 to 116 KB each), which keeps every image well under the limit. That is the whole trick: shrink the pictures, keep the words, and let the model pick from stills.

### What Inkling actually received

One API call to the Tinker Anthropic endpoint, model `thinkingmachines/Inkling-2-Small:peft:262144` (the 256K-context variant, because 66 images plus the transcript do not fit in 64K). The request carried the master prompt, the transcripts, and all 66 keyframes as base64 images — a 9.8 MB request body. It returned 16 complete picks. Cost: about $0.03 (53,527 input tokens, 10,000 output tokens).

### Where Inkling was wrong

Two things, both worth knowing and both fixed before cutting.

1. **One filename slip.** Inkling wrote `DJI_20260719095456_0026_D.mp4` for its first pick. No such file exists. The real file is `DJI_20260719095441_0026_D.MP4` — same clip number (0026), different timestamp digits. It mixed the timestamp of the neighbouring clip (0027, which starts at 09:54:56) with the number of clip 0026. I corrected it by matching the clip number to the file on disk. 15 of 16 filenames were exactly right.

2. **Output cut short.** The call hit the 10,000-token output limit (`stop_reason: max_tokens`). The model was mid-way through a 17th pick (clip 0025, the street arrival) when the budget ran out. Version B therefore uses the 16 complete picks. The missing 17th pick would have added about 5 to 7 seconds and given version B the same cold open version A has. A re-run with a higher token budget would recover it.

### The transcript problem

Both sides faced the same bad input. Whisper hallucinated most of the transcripts (repeated phrases, wrong languages, crowd noise rendered as speech). I ignored the transcripts and picked from pictures. Inkling was told the transcripts were unreliable and did the same, and it marked the one transcript quote it used as "wording uncertain". The lesson is that for this kind of footage the pictures are the signal and the transcript is decoration. A cheap fix for the next round is to feed per-segment audio energy (silence detection) alongside the frames, so the model can tell speech from noise.

## What is next

- **The 17th pick.** Re-run the Inkling call with a higher output budget to recover clip 0025, then re-cut version B.
- **The afternoon batch.** When the rest of the footage arrives, the guitar, piano, rain and group photo should appear. Both cuts will need a second pass.
- **Photos.** The 300 photos are downloaded and set aside, not yet classified. The next step is to group them by person and scene and pick the node-end photos (arrival, rain, evening warmth, group photo).
- **Fine-tuning.** The approved picks from both versions become training data for a LoRA fine-tune of Inkling 2 Small on Tinker, so the next video (a vlog) starts from a model that already knows this taste.
- **Music.** Neither cut has music yet. The track is KOYO, "Timing". It needs an audio file to mix in (Spotify cannot supply one), and it is a commercial OST, so publishing on social platforms needs clearance or a licensed swap.
