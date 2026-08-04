# Cafe Cursor Shanghai — auto recap edit

Event: **Cafe Cursor Shanghai 20260719**  
Narrative source: `EVENT.md` (YAPS) + this README.

## Drop your media here

```text
scripts/video-edit/
  takes/     ← mp4 / mov / m4v (talking heads, B-roll, phone video)
  photos/    ← jpg / png / heic / webp (crowd, venue, demos, logos on wall)
  brand/     ← cursor-logo.svg already here; add aileena logo if you have one
```

Then from `aileena-new/`:

```bash
pnpm exec tsx scripts/video-edit/inventory.ts
pnpm exec tsx scripts/video-edit/render-recap.ts
open scripts/video-edit/edit-room.html
```

Output: `out/cafe-cursor-shanghai-recap.mp4` (1080p).

## Recap logic (活动总结剪辑逻辑)

Not random montage — a **story spine**:

| Beat | Duration target | What to show | Why |
|------|-----------------|--------------|-----|
| 1 · Logo sting | 2.5s | Cursor logo + title card | Brand first |
| 2 · Arrival / vibe | 8–12s | Venue / rain / queue photos | Set place |
| 3 · Guest-led energy | 12–20s | Demos, suitcase, laptop screens | Guest-led showcase (YAPS §7) |
| 4 · Product moment | 8–12s | Redeem / QR / phones claiming | Soft — credits, no “swap” talk |
| 5 · Community | 8–12s | Group / international / volunteers | Aftercare + next-event demand |
| 6 · Close | 4s | Logo + `#CafeCursorShanghai` | Brand last |

Rules baked into `inventory.ts`:

- Prefer **landscape** video for B-roll; portrait gets letterbox
- Photos become **3.2s** Ken-Burns clips (slow zoom)
- Videos: take middle **4–8s** unless silence gaps suggest a cleaner window
- Never invent “credit swap” copy — public soft only
- Always bookend with **logo**

## Files

| File | Role |
|------|------|
| `EVENT.md` | Ops / soft copy / Ben wrap-up skeleton |
| `script.md` | Spoken/on-screen recap script |
| `inventory.ts` | Scan media → `work/final-edit.json` |
| `render-recap.ts` | ffmpeg execute EDL → mp4 |
| `edit-room.html` | Thariq-style control room (read EDL, copy prompt) |
