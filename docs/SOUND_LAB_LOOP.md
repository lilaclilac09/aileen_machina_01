# Sound Lab verify loop

Portable playbook for **Cursor, Devin, Claude Code, or any agent**. Not Cursor-only.

Live URL: `https://www.aileena.xyz/sound`  
App: `aileena-new/` (`pnpm`). Canonical constitution: [`AGENTS.md`](../AGENTS.md). Slice checklist: [`QA.md`](../QA.md) **DJ**.

```txt
inspect → plan → patch → verify locally → prove on production
localhost is a lab. production is the exam.
```

---

## 1. What this loop is for

Any change to `/sound`, DJ decks, carousel, Spotify iframe, knobs, phone taps, or “load a CD onto a plate”.

Do **not** stop after a green localhost test. Do **not** treat Preview Ready as Production Ready.

---

## 2. Prompt stack (constitution — not rewritten this week)

These are the standing prompts. Paste / read them at session start. Devin: attach this file + `AGENTS.md`.

| File | What it forces |
|------|----------------|
| [`AGENTS.md`](../AGENTS.md) | inspect → plan → patch → verify. 施工队安全条例. fail-closed blockers. **no merge without owner.** |
| [`.cursor/prompts.md`](../.cursor/prompts.md) | Session opener + 防乱改一句 + 编排表 |
| [`aileena-new/docs/工作准册.md`](../aileena-new/docs/工作准册.md) §5 | Copy-paste templates 0–10 (总控 / 澄清 / 定位 / 小 diff / UI / 交互 / 验收) |
| [`.cursor/rules/senior-engineer-loop.mdc`](../.cursor/rules/senior-engineer-loop.mdc) | Evidence closer |
| [`.cursor/rules/verification.mdc`](../.cursor/rules/verification.mdc) | Never done from code inspection |
| [`.cursor/rules/debug-repro-loop.mdc`](../.cursor/rules/debug-repro-loop.mdc) | Repro → hypotheses → evidence → root cause |
| [`.cursor/rules/ui-step-screenshot.mdc`](../.cursor/rules/ui-step-screenshot.mdc) | UI: screenshots **and** interaction |
| [`QA.md`](../QA.md) | Slice checklists + commands |
| [`docs/AGENT_TOOL_MAP.md`](AGENT_TOOL_MAP.md) | Task → required tool |
| [`docs/KNOWN_FAILURES.md`](KNOWN_FAILURES.md) | Verified pits |
| [`.github/pull_request_template.md`](../.github/pull_request_template.md) | Every PR fills this |

**Session opener (any agent):**

```txt
follow AGENTS.md, QA.md, docs/aileena-design-os.md, and docs/SOUND_LAB_LOOP.md.
no screenshots = not done. no owner approval = no merge.
localhost is not production proof.
```

**防乱改:**

```txt
先不要写代码，先读相关文件并给我最小修改计划。
```

**Bug lock:**

```txt
first inspect and report root cause. then propose the smallest diff.
wait for confirmation before editing if the change touches multiple systems.
```

---

## 3. Acceptance logic that changed (2026-09-11)

Old DJ checklist (through the 30-day restore) was only: add song, carousel, drag to A, play/pause, deck B, mixer audio, no Visual on `/sound`.

`pnpm verify:sound` still only checks **layout** (route, covers, no `#glass-bench` on `/sound`, carousel titles). It does **not** prove drag, double-click, knobs, or iframe.

These **QA.md DJ** lines were added with the product slices:

| When | New acceptance | Executable gate |
|------|----------------|-----------------|
| #505 drag | drag CD onto Deck A (and B) loads that track | `pnpm test:e2e:dnd` |
| #507 knobs / phone | click a knob tick jumps scale; phone mixer/loop/FX taps large enough | `pnpm test:e2e:dnd` + `pnpm verify:dj-mixer` |
| #506 double-click | first cover double-click → Deck A, next → Deck B, then A again | `pnpm test:e2e:dnd` |
| #512 iframe | if the track has a Spotify id, the embed iframe must match the plate; if it does not, **no leftover previous-track iframe** | `pnpm test:e2e:dnd` |

CI job `playwright-dnd` runs `e2e/dj-drag-deck-a.spec.ts` on PRs. That file is the contract.

### Product facts the tests encode

- Decks / mixer **above**, `#dj-set` carousel **below**. Drag is **upward**. Use a tall viewport (e2e uses 1440×1600).
- Desktop (`pointer: fine`): cards are HTML5 `draggable`. Touch: swipe only.
- Native `dblclick` is swallowed by `draggable`. Load on second press / `click.detail === 2`. `Date.now()` stays in **event handlers** (not in a helper defined during render) so `react-hooks/purity` passes.
- Default plates: A = `DAYDRM` (Daydreaming, has Spotify id `69w5X6uTrOaWM32IetSzvO`). B = `INTOUCH` (In Touch, **no** Spotify id).
- Handoff without Spotify: `RAINFR`, `HIGHTD`, `INTOUCH`, `RNDVZ` (Bandcamp / Tectonic / Kynant). Loading them must **not** leave Daydreaming in the iframe. Overlay: track title + `NO SPOTIFY`.
- Library tracks whose `id` is a 22-char Spotify id (e.g. Intro `189lkmwebOMpyLoyx1zkCS`) **must** switch the iframe `src` to that id.
- `→ A` / `→ B` buttons stay explicit. Drag uses the drop target. Double-click alternates A then B.
- Visual / `#glass-bench` is **not** on `/sound`.
- Do not merge unless the owner says merge / 全部 merge. Merge with a **merge commit**, not squash, not force-merge.

### Handbook drift (do not “fix” by deleting the library)

[`aileena-new/docs/工作准册.md`](../aileena-new/docs/工作准册.md) §4 still describes the curated **handoff five**. Live carousel is handoff five **plus** `DECK_LIBRARY_TRACKS` in `lib/djSetlist.ts`. Layout verify still walks the full `allDeckTracks()` list. Do not cut the library to “only five” unless the owner asks.

---

## 4. The loop (run this every Sound Lab task)

Copy this block into Cursor **or** Devin. Fill `[task]`.

```txt
You are the senior engineer on aileena.xyz Sound Lab.

Read first:
- AGENTS.md
- QA.md (DJ section)
- docs/SOUND_LAB_LOOP.md
- docs/KNOWN_FAILURES.md
- aileena-new/components/DJStation.tsx
- aileena-new/components/TrackLibraryBrowser.tsx
- aileena-new/lib/djSetlist.ts
- aileena-new/e2e/dj-drag-deck-a.spec.ts

Task: [task]

Loop (do not skip a step):
1. INSPECT — repro on https://www.aileena.xyz/sound if this is a “不对” / iframe / drag / load bug. Name 1–3 hypotheses. Do not patch from code reading alone.
2. PLAN — one vertical slice. No parallel mixer graph. No second carousel.
3. PATCH — smallest diff in the live path (DJStation + TrackLibraryBrowser + djSetlist). Match existing tests in e2e/dj-drag-deck-a.spec.ts.
4. VERIFY LOCAL
   cd aileena-new
   pnpm exec eslint -- <files you touched>
   pnpm verify:dj-mixer          # if knobs/math changed
   pnpm test:e2e:dnd             # drag A/B, knobs, dblclick A then B, iframe follow
   pnpm verify:sound:local       # optional layout; not a substitute for dnd
5. SHIP only if the owner said merge / 全部 merge.
   - PR from cursor/* (or whatever prefix this harness uses)
   - wait ci + playwright-dnd green
   - merge commit (not squash)
   - confirm merge SHA is ancestor of origin/main
   - wait Vercel Production success on a SHA that contains the merge
     (later memory-sync commits can cancel the merge SHA’s deploy — that is OK if the new tip still contains the merge)
6. PROVE PRODUCTION on https://www.aileena.xyz/sound
   - drag a CD onto Deck A and Deck B (plate data-track-id matches source)
   - double-click next cover → A, next → B
   - if the loaded track has a Spotify id: iframe src contains that id
   - if it does not (Rainforest / High Tide / In Touch): overlay NO SPOTIFY, iframe src must not still be Daydreaming 69w5X6uTrOaWM32IetSzvO
   - knob HI tick 50 → 0 → 100 if that surface changed
   - screenshots of the real production URL
7. STOP and report a blocker table row if you cannot merge or cannot prove production. Do not say done.

End every reply with:
root cause:
files changed:
checks run:
manual QA:
verification:
remaining risks:
manual steps:
safe to merge:
```

---

## 5. Commands (lab vs exam)

```bash
cd aileena-new

# lab
pnpm exec eslint -- components/DJStation.tsx components/TrackLibraryBrowser.tsx e2e/dj-drag-deck-a.spec.ts
pnpm verify:dj-mixer
pnpm test:e2e:dnd
# needs Next on http://127.0.0.1:3000 (playwright.config.ts BASE_URL)

# layout only — does not prove drag / dblclick / iframe
pnpm verify:sound              # default https://www.aileena.xyz
pnpm verify:sound:local        # localhost:3011
```

Production interaction: Playwright against `BASE_URL=https://www.aileena.xyz` using the same helpers as `e2e/dj-drag-deck-a.spec.ts`, or a real browser. Testids:

| id | meaning |
|----|---------|
| `dj-carousel-card` + `data-track-id` / `data-track-title` | CD |
| `dj-carousel-next` / `dj-carousel-prev` | advance (DOM `.click()` is more reliable than mouse on ›) |
| `dj-carousel-active-id` | current cover |
| `dj-deck-a-drop` / `dj-deck-b-drop` | plate drop |
| `dj-deck-a-title` / `dj-deck-b-title` | plate title + `data-track-id` |
| `dj-deck-a-embed` / `dj-deck-b-embed` | `data-spotify-id` + inner `iframe[src]` |
| `dj-deck-a-nospotify` / `dj-deck-b-nospotify` | no Spotify overlay |
| `dj-knob-hi` / `dj-knob-hi-tick-0\|50\|100` | HI knob |

---

## 6. Pass / fail (production)

| Check | Pass |
|-------|------|
| Drag CD → A | `dj-deck-a-title[data-track-id]` equals source card |
| Drag CD → B | same for B. Drop target decides side (not the A/B double-click alternator) |
| Double-click 1 | next cover (not already on A) loads A; B unchanged |
| Double-click 2 | following cover loads B; A still the first |
| Spotify track (22-char id or `spotifyId`) | embed `data-spotify-id` and `iframe[src]` contain that id |
| No-Spotify track | overlay visible with the **new** title; iframe src does **not** contain `69w5X6uTrOaWM32IetSzvO` |
| Knob tick | `dj-knob-hi[data-value]` matches the tick |
| Visual | `#glass-bench` count on `/sound` is 0 |

Fail-closed: GitHub MERGED but merge SHA not on `origin/main` → **not done**. Preview URL ≠ production.

---

## 7. One-shot Devin / Cursor command

```txt
Run the Sound Lab verify loop in docs/SOUND_LAB_LOOP.md.

follow AGENTS.md, QA.md, docs/aileena-design-os.md.
no screenshots = not done. no owner approval = no merge.

Task: [paste the Sound Lab bug or slice]

Prove it on https://www.aileena.xyz/sound before you say done.
If you cannot merge or cannot prove production, stop and fill the AGENTS.md blocker table.
```
