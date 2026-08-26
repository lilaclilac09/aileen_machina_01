# Improvement queue

Agents **propose**. Owner **approves**. Nobody silently rewrites `AGENTS.md` / `QA.md` / `PROJECT_RULES.md` / `docs/aileena-design-os.md`.

Status: `pending` | `approved` | `rejected` | `applied`

When a merge gate blocks a PR, append a `pending` row (`pnpm report:merge -- --blocked "…"`). Do not promote it.

---

## #1 — mobile screenshots required for layout PRs

```txt
proposed rule:
mobile screenshots + scrollWidth check required for any layout PR.

reason:
#429: desktop absolute / coverflow geometry broke iPhone. Agents have claimed
mobile fixed without 390×844 evidence more than once.

suggested file:
QA.md (Visual / collage + Before merge)

risk:
adds a command (`pnpm qa:mobile`) before merge. Prevents invisible iOS breakage.

status:
pending owner approval
```

---

## How to add a row

Copy the block. Next id = last `#n` + 1. Keep `status: pending owner approval` until Aileen marks it.

```txt
proposed rule:
<one sentence>

reason:
<evidence: PR, lesson, repeated “not verified”>

suggested file:
AGENTS.md | QA.md | PROJECT_RULES.md | docs/aileena-design-os.md

risk:
<overhead vs. the failure it stops>

status:
pending owner approval
```
