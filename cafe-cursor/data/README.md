# Bundled Luma guest list for Cafe Cursor Shanghai

`luma-guests.csv` — Luma Guests export (bootstrap only when DB allowlist is empty).

## Guest sync rule (door day)

**Every sync MUST clear unclaimed guests first, then import.**

1. **Clear** — delete all EligibleUsers with `hasClaimed=false` (the allowlist cache)
2. **Sync** — import only rows with `checked_in_at` from a fresh Luma CSV

Admin button: **Clear + Sync Checked-in** (runs both steps).

- Already-claimed users are kept (audit / re-show credit).
- **Import Luma CSV** alone is additive (does NOT clear) — avoid on door day.
- **Clear list** only runs step 1.

Do not commit newer exports with extra PII unless needed for a re-sync.
