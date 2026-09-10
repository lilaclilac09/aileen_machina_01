# Site-agent self-evolution

Self-evolution here is **not** the model editing weights. It is:

```txt
failure → structured SKILL.md → isolated sandbox → external verifier
       → held-out ratchet → git-rollbackable ledger → site-agent prompt
```

Constitution files stay owner-gated (`AGENTS.md` / `QA.md` / `PROJECT_RULES.md`). This loop only promotes **skills**.

## Loop

```bash
cd aileena-new
pnpm verify:evolve    # engine tests (offline)
pnpm evolve -- --dry-run
pnpm evolve           # one cycle: synthesize → sandbox → ratchet → trajectories
pnpm evolve -- --from-lesson ../ops/lessons/YYYY-MM-DD-slug.md
pnpm evolve -- --rollback <skillId> --to <version>
```

## Layout

| path | who can read |
|------|----------------|
| `skills/*/SKILL.md` | production skills (solver + site agent via codegen) |
| `staging/*/SKILL.md` | candidates, not live |
| `bank/prompts.json` | solver-visible prompts only |
| `bank/verifiers.json` | **verifier process only** — never copied into the sandbox, never imported by the chat bundle |
| `trajectories/index.jsonl` | SFT / DPO / RLVR assets |
| `ledger.json` | promote / reject / rollback |

## Ratchet

A candidate lands in `skills/` only if:

1. Held-out pass rate **strictly increases**
2. No previously-passing held-out task newly fails
3. Verifier file hash is unchanged (anti-mutation)
4. Solver did not leak the canary / empty-exit-0 / copy verifiers

Git rollback: `pnpm evolve -- --rollback <id> --to <n>`

## Isolation (v1)

- Solver cwd = fresh `/tmp` sandbox
- Env stripped (`EVOLUTION_ROLE=solver`)
- Checks never passed to the child
- Parent hashes `verifiers.json` before and after
- Canary token `EVOLVE_CANARY_DO_NOT_EMIT` → fail closed

This is a **process boundary**. A kernel container with no bind-mount of `bank/` is the production hardening step. Do not pretend Node `spawn` is gVisor.

## Distribution collapse

Generated challenger tasks are dropped when:

- structure fingerprint / Jaccard too close to an existing task
- easy share > 40%
- a difficulty bucket is missing in a batch of 4+

## Trajectories

Verified held-out passes → `sft`.  
Pass vs fail on the same task id → DPO pair.  
Other scored rolls → `rlvr`. Hack attempts stay out of SFT.

## Site agent

`aileena-new/lib/evolution/activeSkills.generated.ts` is the Vercel-safe snapshot. Chat injects matching skills into the **session tail**, not the frozen prefix. Council mode skips them.
