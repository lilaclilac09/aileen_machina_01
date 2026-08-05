# GitHub profile README sync

**Target:** [`lilaclilac09/lilaclilac09`](https://github.com/lilaclilac09/lilaclilac09) → `README.md`  
**Draft:** [`github-profile-README.md`](./github-profile-README.md)

## Daily automation

| Piece | Path |
|-------|------|
| Cron | `.github/workflows/github-profile-readme-sync.yml` — `0 10 * * *` UTC |
| Script | `node scripts/sync-github-profile-readme.mjs` |
| Markers | `<!-- profile:recently-updated:* -->` / `<!-- profile:recently-added:* -->` |

Manual run:

```bash
node scripts/sync-github-profile-readme.mjs --dry-run
node scripts/sync-github-profile-readme.mjs
gh workflow run github-profile-readme-sync.yml
```

## Push live profile (optional)

Cloud Agent / `GITHUB_TOKEN` cannot write `lilaclilac09/lilaclilac09` (403).

1. Create a fine-grained PAT with **Contents: Read and write** on `lilaclilac09/lilaclilac09`
2. Add repo secret **`PROFILE_README_TOKEN`** on `aileen_machina_01`
3. Next daily run (or `workflow_dispatch`) also updates the live profile README

Without the secret, the workflow still refreshes `docs/github-profile-README.md` on this repo.

## Append-only policy

Keep Featured Dispatch / Research & Builds / Process & Precision unless explicitly asked.
Only the marked Recently* blocks are auto-rewritten.
