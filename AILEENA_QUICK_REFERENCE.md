# aileena.xyz Quick Reference

## File Overview

### Data Sources
- `aileena/scripts/config.json` — Ticker list, data source URLs, company tiers
- `aileena/scripts/update_equities.py` — Scrape RCL, MU, LLY, MAR, HLT
- `aileena/scripts/update_cislunar.py` — Tier 1-3 company data
- `aileena/scripts/requirements.txt` — Python dependencies

### Markdown Content (Auto-Generated Daily)
- `aileena/content/equities/{rcl,mu,lly,mar,hlt}.md` — Equity data
- `aileena/content/cislunar/tier1/{spacex,lockheed-martin}.md` — Tier 1
- `aileena/content/cislunar/tier2/{intuitive-machines,firefly-aerospace,astrobotic}.md` — Tier 2
- `aileena/content/cislunar/tier3/{axiom-space,ispace,relativity-space}.md` — Tier 3

### Site
- `aileena/index.html` — Homepage (cards, links to content)
- `aileena/README.md` — Project docs

### Automation
- `.github/workflows/daily-update.yml` — GitHub Actions (cron + manual trigger)

### Docs
- `AILEENA_IMPLEMENTATION.md` — Full build summary
- `AILEENA_DEPLOYMENT.md` — Step-by-step deployment guide
- `aileena/README.md` — Project overview

---

## Quick Commands

### Run Scrapers Locally
```bash
cd /Users/aileen/aileen_machina
python3 aileena/scripts/update_equities.py
python3 aileena/scripts/update_cislunar.py
```

### View Generated Files
```bash
ls -la aileena/content/equities/
ls -la aileena/content/cislunar/tier*/
```

### Commit to GitHub
```bash
git add aileena/ .github/workflows/
git commit -m "feat: aileena data pipeline ready"
git push origin main
```

### Add GitHub Secret
```
Repo Settings → Secrets & Variables → Actions → New Secret
Name: DATA_UPDATE_TOKEN
Value: [paste token from GitHub Settings → Tokens]
```

### Trigger Workflow Manually
Go to: https://github.com/lilaclilac09/aileen_machina/actions
→ "Daily Data Update" → "Run workflow" → "Run workflow"

### Deploy to Netlify
1. https://app.netlify.com → "Add new site"
2. Connect GitHub repo
3. Base dir: `aileena`
4. Publish dir: `aileena`
5. Deploy!

---

## What Gets Updated

| Item | Source | Frequency | Auto-Update? |
|------|--------|-----------|--------------|
| RCL Price | Yahoo Finance | Daily | ✅ Fallback to "N/A" |
| RCL EPS/Revenue | Press releases | Manual entry | ❌ Manual edit |
| MU, LLY, MAR, HLT | Yahoo + PR | Daily | ✅ Fallback to "N/A" |
| SpaceX/Lockheed | Hardcoded | Manual | ❌ Manual edit |
| Intuitive Machines | Hardcoded | Manual | ❌ Manual edit |
| Firefly, Astrobotic | Hardcoded | Manual | ❌ Manual edit |
| All investment thesis | Manual | —— | ❌ Never auto-update |

---

## Cron Schedule

**Current**: `0 9 * * *` (9 AM UTC daily)

**Change to**:
- `0 6 * * *` = 6 AM UTC
- `30 14 * * 1-5` = 2:30 PM UTC, Monday-Friday only
- `0 0 * * *` = Midnight UTC
- `0 0 * * 0` = Sundays only at midnight

Edit: `.github/workflows/daily-update.yml` line 4

---

## Modify Data

### Update an Equity's Financial Data
1. Open `aileena/content/equities/rcl.md`
2. Edit the "Latest Financial Results" section
3. Save & commit
4. Netlify auto-redeploys

### Add a New Equity
1. Edit `aileena/scripts/config.json` → add ticker
2. Edit `aileena/scripts/update_equities.py` → add `fetch_XXX_data()` function
3. Add to `main()` function call list
4. Test: `python3 aileena/scripts/update_equities.py`
5. Commit & push

### Update a Cis-Lunar Company
1. Edit corresponding file in `aileena/content/cislunar/tier{1,2,3}/`
2. Update "Mission Target" or "Current Focus" section
3. Save & commit
4. Netlify auto-redeploys

Or edit the scraper: `aileena/scripts/update_cislunar.py` → `get_*_data()` functions

---

## Troubleshoot

| Symptom | Check |
|---------|-------|
| Workflow won't run | Is `DATA_UPDATE_TOKEN` secret set? Does it have `repo` scope? |
| Workflow fails at commit | Is token expired? Try regenerating it. |
| Netlify won't build | Base dir = `aileena`? Publish dir = `aileena`? |
| Stock prices "N/A" | Yahoo HTML may have changed; fallback active; next update will retry |
| Old data persists | Clear browser cache? Check if Netlify actually built? |
| Links 404 | Ensure file names match in index.html (lowercase filenames) |

---

## Support

**Problem**: GitHub Actions error
→ Check workflow logs at: https://github.com/lilaclilac09/aileen_machina/actions

**Problem**: Netlify won't deploy
→ Check deploy logs at: Netlify Dashboard → Deploys → click failed deploy

**Problem**: Data looks wrong
→ Run scraper locally, check output, inspect script source

**Problem**: Need to add custom logic
→ Edit Python scripts directly; AI-friendly code structure

---

## Timeline

- **Phase 1 ✅**: Folder structure + config
- **Phase 2 ✅**: Equity scraper (RCL, MU, LLY, MAR, HLT)
- **Phase 3 ✅**: Cis-Lunar scraper (7 companies across 3 tiers)
- **Phase 4 ✅**: GitHub Actions workflow (cron + manual)
- **Phase 5 ✅**: Seed markdown files (13 files generated)
- **Phase 6 🔄**: Static site (basic HTML done, 11ty optional)
- **Phase 7 ⏳**: AI management API (not done; optional)

---

## Next Steps

1. **Deploy** (see AILEENA_DEPLOYMENT.md)
2. **Test workflow** (manually trigger via Actions tab)
3. **Monitor** (check commits, Netlify builds, site view)
4. **Customize** (edit markdown, add equities, adjust cron)
5. **Expand** (Phase 7 API, alerts, advanced features)

---

**Status**: Ready for production deployment 🚀
**Time to Deploy**: ~5–10 minutes
**Effort Level**: Low (follow AILEENA_DEPLOYMENT.md step-by-step)
