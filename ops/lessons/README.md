# Lessons — failure memory

Self-improvement is **not** the agent rewriting the product at night.  
It is: **failure → lesson → (maybe) test → (maybe) rule, after owner approval**.

```txt
task → implement → review → qa → failure/success report
     → extract lesson → update tests / propose rule
     → next task inherits
```

One-off mistakes stay here. Repeated mistakes may be **proposed** for `AGENTS.md` / `QA.md` / `PROJECT_RULES.md`. Agents do not silently promote.

Short verified one-liners still go in [`docs/KNOWN_FAILURES.md`](../docs/KNOWN_FAILURES.md). This folder is the long form (trigger, root cause, future instruction).

## Record a lesson

1. Copy [`TEMPLATE.md`](TEMPLATE.md)
2. Name it `YYYY-MM-DD-short-slug.md` (example: `2026-08-16-mobile-overflow.md`)
3. Fill every heading. Evidence required (command, PR, screenshot). Chat memory does not count.
4. If a test already exists, point at it. If not, write `test proposed:` and add a queue item.
5. Do **not** edit `AGENTS.md` / `QA.md` / `PROJECT_RULES.md` from the lesson. Open [`../improvement-queue.md`](../improvement-queue.md) instead.

## Rule promotion

| Kind | Where it lives | Who writes |
|------|----------------|------------|
| One-off | this folder | agent or human |
| Repeated, still informal | this folder + queue `pending` | agent proposes |
| Hard rule | `AGENTS.md` / `QA.md` / `PROJECT_RULES.md` | **owner approves**, then a human/agent applies that one patch |

Promotion map (do not invent new constitutions):

- claimed done without evidence → `AGENTS.md`
- mobile layout / overflow → `QA.md`
- Visual crop → `PROJECT_RULES.md`
- council leak / private mix-in → council prompt + `QA.md` (or `SECURITY.md` if it exists)

## What agents must not do

- Rewrite core rules “to be helpful”
- Autonomously refactor the site because a lesson exists
- Treat a `pending` queue row as already law
- Duplicate a lesson that is already a one-liner in `KNOWN_FAILURES.md` without adding new evidence

## After a blocked merge

Run from `aileena-new/`:

```bash
pnpm report:merge -- --blocked "ci failed: missing screenshots"
```

That **appends a proposal** to `ops/improvement-queue.md`. It never writes `AGENTS.md`.
