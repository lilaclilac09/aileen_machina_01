# aileena.xyz design operating system

Permanent product / visual spec. Not a one-off prompt.

```txt
follow /docs/aileena-design-os.md. no screenshots = not done. no owner approval = no merge.
```

Engineering constitution remains [`AGENTS.md`](../AGENTS.md). This file is how the site should **think, look, behave, evolve, and be verified**. Do not argue it away in a one-off patch.

| Layer | File |
|-------|------|
| Engineering loop, ship 红线 | [`AGENTS.md`](../AGENTS.md) |
| Product facts (orb, Visual, contact, env) | [`PROJECT_RULES.md`](../PROJECT_RULES.md) |
| **Design OS (this file)** | `docs/aileena-design-os.md` |
| QA commands | [`QA.md`](../QA.md) |
| Cursor index | [`CURSOR_RULES.md`](../CURSOR_RULES.md) |
| Home production lock | [`.cursor/rules/landing-experiment-gate.mdc`](../.cursor/rules/landing-experiment-gate.mdc) |

## Current production locks

Do not “implement the whole OS” by restoring rejected surfaces.

- **Home `/`:** cinematic opening + compact `new →` marquee only. Do **not** restore ascii desk, vellum studio, moodboard pins, object-card doors, serials shelf, terminal index, or zine object until the owner chooses a direction from screenshots. Gate: `landing-experiment-gate.mdc`.
- **Visual:** `object-fit: contain`. Never cover-crop content images.
- **Sound Lab:** Spotify is reference / preview only. Real mix is Web Audio. Knobs must affect audio or be disabled.
- **Proof queue:** `/proof` preferred when present; `/evolution` is an alias. No auto-merge. No auto-deploy.
- **Daily:** public title is **two lines**, not “daily board”.

Landing experiments, shelves, and material passes go through proof queue → screenshots → owner yes. Default: **do not merge**.

---

# 0. what this site is

aileena.xyz is not a normal portfolio.
It is a personal machine:

- notes
- tools
- shelves
- sound
- doors
- proof
- small signals
- owner-editable fragments
- public-readable traces

The site should feel alive, tactile, editable, and proof-driven.

---

# 1. core principles

## visual first

The site should communicate through objects, images, layout, texture, and hierarchy before text.

Use:

- screenshots
- photos
- book covers
- object cards
- shelves
- notes
- zines
- paper fragments
- moodboard pieces
- diagrams
- tiny status lights

Avoid:

- long paragraphs
- generic portfolio sections
- SaaS hero copy
- icon-heavy design
- text blocks pretending to be design

If a page feels text-heavy, fold it, hide it, or turn it into an object.

## less text

Aileena hates too much text.

Rules:

- no paragraphs unless explicitly needed
- collapsed view: one line max
- helper text: one short line max
- error text: 2–4 words max
- section labels: short
- buttons: verbs
- no explanatory admin copy in public UI

Good:

- two lines
- leave a small bubble
- ⚡ Saved.
- ⚡ Nope.
- view issue →

Bad:

- Visitors cannot use this room.
- Please enter your owner key to access editing functionality.
- This section contains curated media recommendations.

## real interaction

If it looks interactive, it must work.

No fake buttons, knobs, drag/drop, uploads, exports, comments, owner edit, search, carousel loading, links, or status lights.

If not implemented: disable it, hide it, or mark v2 quietly.

Never leave fake UI pretending to work.

## proof over claims

Do not say done without runtime proof.

Required for visual / product work:

- screenshots
- mobile screenshots
- route tested
- links tested
- build / checks run
- blockers listed

```txt
no screenshots = not done.
no screenshots = no ready-for-review.
no owner approval = no merge.
```

## owner control

Aileena owns the site.

Owner editing should be quiet, powerful, not ugly, not public, not admin-looking.

Use owner mode:

- site agent riddle / passphrase
- server-side session (`OWNER_RIDDLE` or `OWNER_KEY` → httpOnly cookie)
- tiny corner fallback only if needed

Never put big owner key forms in main content.
Never show “OWNER KEY” in public page flow.
Never expose secrets client-side.

## public softness

Visitors should feel invited, not managed.

Use: anonymous bubbles, small comments, quiet inputs, short empty states.

Avoid: hostile copy, login-looking blocks, admin warnings, big forms, “Visitors cannot…” language.

---

# 2. visual language

## material

The site should feel physical.

Preferred: scanned paper, vellum / tracing paper, ink bleed, risograph offset, crayon / wax pencil marks, book covers, zine issues, shelves, receipts, terminal slips, small windows, paper shadows, contact shadows.

Avoid: glassmorphism SaaS, clean gradient hero, generic cards, icon grids, sterile dashboard UI, cheap fake 3D.

## color

Base: warm paper, soft black ink, muted gray.

Accent experiments: cyan crayon, coral red, graphite pencil, acid green, violet, cobalt.

Cyan crayon is a strong candidate: hand-marked, proof-sheet feeling, less harsh than red.

Use red / coral carefully: registration marks, warnings, tiny marquee — not everywhere.

Shipped public chrome still uses cream / teal until an owner-chosen experiment replaces it. Do not restyle the whole site in one PR.

## texture

Subtle but visible: paper fibers, low-opacity noise, scanlines, ink feathering, offset print marks, hand-drawn rough edges.

Do not use: dirty grunge, loud noise, random external texture images, fake plastic shine.

## vellum

Vellum is not opacity.

A real vellum effect needs: warm milky fill, backdrop blur, grain, edge thickness, inner highlight, soft shadow, uneven opacity, visible content underneath.

Test vellum over image, dark block, ink marks, diagram. Do not test only over cream background.

## crayon marks

Crayon / wax pencil marks should feel rough, uneven, waxy, hand-applied, proof / annotation-like.

Reusable marks: bracket, underline, circle, arrow, frame, x/dot, scribble highlight.

Do not make them childish. Do not make them clean vector icons.

## objects, not cards

Prefer: issue cover, book spine, note sheet, cassette, terminal slip, receipt, shelf label, moodboard fragment.

Avoid generic cards. If something looks like a card, ask: can this become a physical object?

---

# 3. information architecture

## doors

Doors are entry points, not menu cards. They should feel like rooms, volumes, issues, shelves, tools. Short labels only.

Suggested entries: two lines · sound lab · book room · watch / listen · tools · updates · proof.

## serials / volumes

Use serials to make the site feel ongoing. Each volume: number, title, one-line note, route, optional fragments. No long descriptions.

Suggested:

- vol. 01 — two lines
- vol. 02 — watch / listen
- vol. 03 — tools lab
- vol. 04 — sound lab
- vol. 05 — book room
- vol. 06 — updates

Do not ship a serials shelf on `/` while the landing experiment gate is locked.

## left index / right accordion

For text-heavy pages: left index + right expandable content.

Apply to: `/updates`, `/blog/watch-listening-shelf`, book shelf pages, long logs.

Desktop: sticky left index, accordion right.  
Mobile: top chips, accordion below.

Collapsed: title, date/type, one-line note max. Details hidden until expanded.

---

# 4. page-specific rules

## /daily — two lines

This page is sacred.

Apple Notes + quiet iMessage. Private-write, public-read, anonymous bubbles, one or two lines a day.

Must have:

- title: two lines
- subtitle: one or two lines a day.
- latest note
- blinking cursor
- older notes quieter
- anonymous bubble comments
- owner inline editor
- owner theme swatches

Must not have: daily board title, OWNER KEY text, big login form, “Visitors cannot use this room”, admin-looking UI, placeholder text shown as content.

Owner unlock: site agent riddle preferred; tiny corner fallback only; server-side validation; no client secret.

Visitor empty state: `nothing today yet.`  
Comment placeholder: `leave a small bubble`  
Status: `⚡ Saved.` · `⚡ Bubble sent.` · `⚡ Nope.`

## /sound — sound lab

Sound Lab must be a real product, not a visual demo.

Minimum loop: upload → play → mix → record → download.

Rules:

- local upload first
- carousel selection must load into deck
- drag/drop must work or be removed
- Spotify is reference only
- SoundCloud is export-ready only unless OAuth/API exists
- all knobs/faders must affect real audio or be disabled
- no fake export
- no fake “uploaded”

Required: Load A / Load B, deck A/B play, crossfader / gain / EQ / filter / master affect audio, VU meters reflect audio, record master, download file.

If no audio source: `⚡ Load audio first.`  
If reference-only: `⚡ Not mixable.`

## /updates

Not a long flat log. Left index, grouped months/years, expandable entries, latest open, older collapsed. No paragraph dump.

## /blog/watch-listening-shelf

A shelf, not a blog list. Left index, right accordion, real covers if they exist, one-line notes, details only on click.

## landing page `/`

Landing is an experiment surface **for owner-chosen trials**. Production currently keeps cinematic opening + tiny marquee.

Should include (when unlocked): tiny marquee, strong visual object, moodboard or serials, doors/volumes, minimal intro.

Avoid: generic portfolio hero, long bio, fake 3D, clean SaaS grid.

Potential directions: cyan crayon proof sheet, coral zine, graphite archive, acid green annotation, embodied printed image, serial volumes.

Do not merge landing experiments without screenshots and owner choice.

## /proof

Proof queue is the self-evolution system.

Track issues, proposals, screenshots, checks, and owner approval.

No auto-merge. No auto-deploy. No fake done.

---

# 5. owner mode

## unlock

Preferred: site agent command / riddle.

Flow: owner tells site agent the passphrase → server validates `OWNER_RIDDLE` or `OWNER_KEY` → owner session set → editable UI appears.

Fallback: tiny corner dot, no label in the rest state.

```txt
owner?
[input]
enter
```

Success: `⚡ Unlocked.`  
Failure: `⚡ Nope.`

Reuse the existing owner session. Do not create a second auth system.

## security

- server-side validation only
- no secret in client bundle
- no localStorage secret
- non-owner writes return 403
- public cannot approve proof items
- public cannot edit content

## editable areas

Owner mode can edit: two lines, book shelf, watch/listen shelf, updates, serial fragments, moodboard entries, tool descriptions.

Keep editing low-fi: inline edit, save, cancel. No giant CMS.

---

# 6. self-evolution / proof queue

## concept

The site evolves through proof, not vibes.

```txt
observe → propose → approve → implement → verify → review → merge manually
```

No owner approval = no merge.  
No screenshots = not ready.

## statuses

observed · proposed · approved · in_progress · needs_screenshots · ready_for_review · rejected · shipped

## proof item fields

id, title, route, problem, proposedChange, source, status, risk, acceptanceCriteria, screenshots, filesChanged, checksRun, createdAt, updatedAt

## owner commands

Site agent should support:

- `log issue: …`
- `propose fix for /route: …`
- `show proof queue`
- `approve proposal <id>`
- `reject proposal <id>`
- `prepare PR for <id>`

Public visitors may submit feedback only as **observed**. They cannot approve.

## proof gate

`ready_for_review` requires: screenshots, files changed, checks run, affected route tested, mobile tested if visual, blockers listed.

No screenshots = `needs_screenshots`.

---

# 7. interaction rules

## status / errors

Compact bolt language: `⚡ Saved.` `⚡ Nope.` `⚡ Bubble sent.` `⚡ Load failed.` `⚡ Not mixable.` `⚡ Need screenshots.` `⚡ Build failed.` `⚡ Owner only.` `⚡ Ready.`

Avoid long error paragraphs, backend config dumps, stack traces, giant toasts.

## indicators

Prefer small LEDs, dots, status lights.

- teal / cyan = active / saved
- amber = warning
- red = error
- gray = idle

## forms

Writing surfaces, not admin panels. Inline inputs, tiny buttons, quiet labels. No giant bordered boxes unless intentional.

---

# 8. mobile rules

Mobile is not optional.

Every visual task must check: 390px, 430px if possible, no horizontal overflow, usable tap targets, readable text, fixed chrome does not cover content, editor not hidden by keyboard, accordions usable, hero not awkwardly cropped.

Screenshots required for visual work.

---

# 9. accessibility basics

Do not overbuild. Do not break basics.

Buttons are buttons. Links are links. Focus visible. Accordions keyboard-accessible if reasonable. Aria labels for icon-only controls. Reduced motion respected. Contrast acceptable.

Knobs / sliders: `role="slider"`, aria-valuemin/max/now, keyboard arrows.

---

# 10. implementation discipline

## before building

Check existing components and patterns. Do not create parallel systems.

Reuse: owner / session, storage, routes, styling tokens.

## no duplicate logic

Avoid a second carousel state, deck state, auth system, comment system, or theme system.

## if blocked

Say: what is blocked, why, which file / env / asset is missing, the minimal next step.

Do not fake it.

---

# 11. screenshots and QA

Every meaningful task must report:

- **files changed** — exact files and purpose
- **runtime proof** — route | expected | observed | screenshot
- **screenshots** — desktop and mobile
- **interaction QA** — control | action | result | pass/fail
- **checks run** — command | result | notes
- **blockers** — hard blockers before merge
- **non-blocking polish**
- **merge status** — review only, not merged / open PR / merge after small fixes / do not merge / split PR

Never recommend merge without screenshots, build/check result, mobile check, and owner approval.

---

# 12. copy style

Short, dry, smart.

Good: small machines, some useful. · receipts from the machine. · write less, leave a trace. · all knobs must have consequences. · spotify is a shelf, not a pipe. · export or it didn’t happen.

Bad: Welcome to my curated collection… · This page allows visitors to… · Please configure your authentication key…

Tone: quiet, sharp, not cute-corporate, not over-explaining, not fake poetic everywhere.

---

# 13. merge policy

Default: **do not merge**.

For all tasks from aileena: implement on a branch, capture screenshots, run checks, produce a review report, wait for owner approval.

If the prompt says no merge: absolutely no merge.  
If screenshots fail: do not recommend merge.  
If build fails: do not recommend merge unless the failure is clearly unrelated and documented.

---

# 14. final checklist before saying done

- does it work at runtime?
- did you capture screenshots?
- did you test mobile?
- did you run build/checks?
- did you remove fake UI?
- did you avoid text bloat?
- did you preserve owner control?
- did you avoid exposing secrets?
- did you avoid merge?
- did you list blockers?

If no:

```txt
not ready, blockers:
…
```

Do not say done.
