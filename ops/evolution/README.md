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
pnpm evolve:status    # one line; exit 1 if held-out/train dirty or a prompt matches no skill
pnpm evolve:effect    # naive vs skilled sheet → ops/evolution/EFFECT.md
pnpm evolve -- --from-question "code a patch"   # new visitor ask → held-out + ratchet
pnpm verify:evolve    # engine tests (offline)
pnpm evolve -- --dry-run
pnpm evolve           # until held-out + train stabilize (max 8 rounds)
pnpm evolve -- --once
pnpm evolve -- --from-lesson ../ops/lessons/YYYY-MM-DD-slug.md
pnpm evolve -- --rollback <skillId> --to <version>
```

## Layout

| path | who can read |
|------|----------------|
| `skills/*/SKILL.md` | production skills (solver + site agent via codegen) |
| `staging/*/SKILL.md` | candidates, not live |
| `bank/prompts.json` | solver-visible prompts only |
| `bank/negatives.json` | questions that must match **zero** skills (false-positive gate) |
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
- Node `--permission` allowlist = that sandbox only (`ERR_ACCESS_DENIED` on `ops/evolution/bank`)
- Env stripped (`EVOLUTION_ROLE=solver`)
- Checks scored in a **separate** verifier process
- Canary token `EVOLVE_CANARY_DO_NOT_EMIT` → fail closed
- Hash of `verifiers.json` before/after (anti-mutation)

A kernel container with no bind-mount of `bank/` is still the production hardening step. `--permission` is the in-repo enforcement.

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

`aileena-new/lib/evolution/activeSkills.generated.ts` is the Vercel-safe snapshot. Chat injects **always-on hard rules** plus matching skills into the **session tail** (`formatSkillsForTurn`), not the frozen prefix. Chinese phrasing is aliased onto English triggers (邮箱→email, 工资→salary, 更新了吗→latest, …). Council mode skips them.
