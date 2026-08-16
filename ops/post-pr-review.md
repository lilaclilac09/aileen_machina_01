# Post-PR review

Fill this after merge (or when a merge gate blocks).  
Goal: turn “not verified” into a lesson or a queue row — not a second rewrite of the site.

```txt
pr:
sha:
what changed:
what broke:
what was verified:
what was not verified:
what failed:
what rule/test should be added:
lesson written: ops/lessons/YYYY-MM-DD-slug.md | none
queue row: #n | none
```

## Rules

- If **what was not verified** repeats across two PRs, open a queue proposal. Do not edit hard rules.
- If a merge gate blocked the PR, run `cd aileena-new && pnpm report:merge -- --blocked "<gate>"`.
- Production ship still follows `AGENTS.md` 施工队安全条例. This form does not replace the凭证表.

## Scorecard (ops, not mood)

Log in [`scorecard.md`](scorecard.md) when useful. Not an automated rank.

```txt
- claimed done without evidence: -3
- modified files while read-only: -5
- found real blocker: +3
- added useful test: +4
- caused regression: -5
- produced screenshot evidence: +2
```
