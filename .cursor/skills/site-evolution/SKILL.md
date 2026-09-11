---
name: site-evolution
description: Run the aileena site-agent skill ratchet. Use when the site agent hallucinates contact/pay, when adding SKILL.md, or when evolving lessons without rewriting AGENTS.md.
---

# Site-agent self-evolution

```bash
cd aileena-new
pnpm evolve:status    # exit 1 if held-out or train is dirty
pnpm evolve:effect    # naive vs skilled visitor sheet
pnpm evolve:live      # drain chat Redis inbox, then ratchet
pnpm verify:evolve
pnpm evolve           # until stable
```

Rules:

1. New visitor questions: public chat enqueues uncovered asks to Redis. `pnpm evolve:live` (or the 3h GitHub Action) ingests held-out + verifier, then ratchets. Or `pnpm evolve -- --from-question "…"`. Does **not** rewrite `AGENTS.md` / `QA.md` / `PROJECT_RULES.md`. Council never enqueues.
2. Solver / chat bundle never reads `bank/verifiers.json`. Chat may import `liveInbox` (Redis only) — not `evolution/engine`.
3. Promote only if held-out improves (or stay-clean upgrades). Rollback with `--rollback`.
4. Do not write `AGENTS.md` / `QA.md` / `PROJECT_RULES.md` from this loop.

Details: `ops/evolution/README.md`.
