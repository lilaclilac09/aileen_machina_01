---
name: site-evolution
description: Run the aileena site-agent skill ratchet. Use when adding SKILL.md patches, evolving the site agent, recording trajectories, or promoting lessons without rewriting AGENTS.md.
---

# Site-agent self-evolution

Do **not** fine-tune weights. Do **not** rewrite `AGENTS.md`.

```bash
cd aileena-new
pnpm evolve:status
pnpm verify:evolve
pnpm evolve -- --dry-run
pnpm evolve
```

Rules:

1. New behavior is a `SKILL.md` with frontmatter (`id`, `version`, `triggers`, `reply_guidance`, `root_cause`).
2. Solver never sees `ops/evolution/bank/verifiers.json`.
3. Promote only if held-out pass rate strictly increases and no held-out regression.
4. Rollback with `pnpm evolve -- --rollback <id> --to <n>`.
5. Lessons → staging via `pnpm evolve -- --from-lesson <file>`, then ratchet. Queue rows still need owner approval for constitution files.

See `ops/evolution/README.md`.
