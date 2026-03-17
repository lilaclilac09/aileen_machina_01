# aileena.xyz Deployment Guide

## Quick Start (5 Minutes)

This guide walks you through deploying the aileena.xyz data pipeline with daily automatic updates.

### Prerequisites

- GitHub repository access (lilaclilac09/aileen_machina)
- Netlify account (free: https://app.netlify.com)
- ~5 minutes of setup time

---

## Step 1: Create GitHub Personal Access Token

This token allows GitHub Actions to auto-commit data updates.

1. **Go to GitHub Settings**:
   - https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**

2. **Create Token**:
   - **Token name**: `AILEENA_DATA_UPDATE`
   - **Expiration**: 90 days (or longer)
   - **Scopes to select**:
     - ✅ `repo` (full control of private repositories)
     - ✅ `workflow` (update GitHub Action workflows)
   - Click **"Generate token"**

3. **Copy & Save Token**:
   - ⚠️ Copy the token immediately (you won't see it again)
   - Save to clipboard or password manager

---

## Step 2: Add Secret to GitHub Repository

1. **Go to Your Repo**:
   - https://github.com/lilaclilac09/aileen_machina
   - Click **Settings** → **Secrets and variables** → **Actions**

2. **Create New Repository Secret**:
   - Click **"New repository secret"**
   - **Name**: `DATA_UPDATE_TOKEN`
   - **Secret**: Paste your token from Step 1
   - Click **"Add secret"**

---

## Step 3: Commit & Push Code to GitHub

Push the aileena folder and workflow to your remote repository:

```bash
cd /Users/aileen/aileen_machina

# Add all aileena files
git add aileena/
git add .github/workflows/daily-update.yml

# Commit
git commit -m "feat: add aileena data pipeline with GitHub Actions automation"

# Push to GitHub
git push origin main
```

**What this does:**
- Uploads `/aileena` folder (scripts, content, index.html)
- Uploads `.github/workflows/daily-update.yml` (automation)
- Makes code available to GitHub Actions runner

---

## Step 4: Test GitHub Actions Workflow

1. **Go to Actions Tab**:
   - Navigate to: https://github.com/lilaclilac09/aileen_machina/actions

2. **Find "Daily Data Update"**:
   - Click on **"Daily Data Update"** workflow (should appear in the list)

3. **Run Workflow Manually** (test):
   - Click **"Run workflow"** button (top right)
   - Select branch: **main**
   - Click **"Run workflow"**

4. **Monitor Execution**:
   - Watch the workflow run in real-time
   - Should complete in ~1–2 minutes
   - Check logs for ✅ success or ❌ errors

5. **Check Auto-Commit**:
   - Go to **Commits** tab
   - Should see new commit: `chore: auto-update equity & cislunar data [2026-03-07]`
   - Markdown files in `aileena/content/` will have latest data & timestamps

---

## Step 5: Deploy to Netlify

### Option A: Connect GitHub (Recommended - Auto-Deploy)

1. **Go to Netlify**:
   - https://app.netlify.com/
   - Click **"Add new site"** → **"Import an existing project"**

2. **Connect GitHub**:
   - Select **"GitHub"** as your Git provider
   - Authorize Netlify to access your repos
   - Select **"lilaclilac09/aileen_machina"**

3. **Configure Build**:
   - **Base directory**: `aileena`
   - **Build command**: (leave blank or `echo "Static site"`)
   - **Publish directory**: `aileena`
   - Click **"Deploy site"**

4. **Verify Deployment**:
   - Netlify gives you a random URL (e.g., `https://random-hash-123.netlify.app`)
   - Open it to view aileena.xyz homepage
   - Check that it loads with the equity cards + cis-lunar sections

5. **Auto-Deploy on Push**:
   - Netlify automatically redeploys whenever you push to `main`
   - When GitHub Actions commits new data → Netlify rebuilds → site updates automatically

### Option B: Manual Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd aileena
netlify deploy --prod --dir=.

# Opens link to your live site
```

---

## Step 6: Verify Everything Works

### Checklist:

- [ ] **GitHub secret is set**: Repo → Settings → Secrets → `DATA_UPDATE_TOKEN` exists
- [ ] **Workflow file exists**: `.github/workflows/daily-update.yml` in repo
- [ ] **Manual workflow run succeeded**: Actions tab shows green ✅ checkmark
- [ ] **Auto-commit appeared**: Latest commit is from "Data Bot" with date
- [ ] **Markdown files updated**: `aileena/content/equities/*.md` have current timestamps
- [ ] **Netlify site deployed**: Can open URL and see homepage
- [ ] **Links work**: Click on a card → loads markdown file (or see in raw GitHub)

### Test the Full Pipeline:

1. **Manually trigger workflow** (Actions tab → Run workflow)
2. **Wait 1–2 minutes** for completion
3. **Check aileena folder** for new commits
4. **Open Netlify URL** → observe updated data

---

## Step 7: Customize (Optional)

### Change Update Time

Edit `.github/workflows/daily-update.yml`:

```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # Change "9" to your desired hour (UTC)
```

Examples:
- `0 6 * * *` = 6 AM UTC
- `0 20 * * *` = 8 PM UTC
- `0 0 * * *` = Midnight UTC

### Add More Equities

Edit `aileena/scripts/config.json` and add to `tickers` list, then add fetch function in `update_equities.py`.

### Change Broker Targets or Revenue Figures

Edit `aileena/scripts/update_equities.py` → find the `fetch_*` functions → update hardcoded values (for now; later can auto-scrape).

---

## Troubleshooting

### GitHub Actions Fails with Permission Error

**Issue**: Workflow runs but fails at "Commit & Push"

**Solution**: 
1. Check that `DATA_UPDATE_TOKEN` secret is set correctly
2. Verify token has `repo` scope
3. Try regenerating token (Settings → Tokens → Regenerate)

### Netlify Fails to Deploy

**Issue**: Netlify shows build failure

**Solution**:
1. Check **Netlify Deploy Logs** (Site → Deploys → click on failed deploy)
2. Verify **Base directory** is set to `aileena`
3. Verify **Publish directory** is set to `aileena`
4. If needed, set **Build command** to `echo "Static site ready"`

### No Auto-Commit After Running Workflow

**Issue**: Workflow runs successfully, but no new commit appears

**Solution**:
1. Check that token is valid (hasn't expired)
2. Look at workflow logs for git push error
3. Verify `DATA_UPDATE_TOKEN` is spelled correctly in workflow YAML
4. Re-run workflow manually from Actions tab

### Stock Prices Show "N/A"

**Issue**: Yahoo Finance scraper returns `N/A` for prices

**Solution**:
1. Yahoo's HTML structure may have changed
2. Temporarily ignore (displays fallback value)
3. Future: Add additional data sources (SEC, Alpha Vantage API)

---

## Next Steps (Future)

- [ ] **Phase 6**: Convert to 11ty static site generator (faster builds, better SEO)
- [ ] **Phase 7**: AI management endpoint (`/api/regenerate?ticker=RCL`)
- [ ] **Phase 8**: Real-time price alerts via webhook
- [ ] **Phase 9**: Vector search for semantic lookups

---

## Support

For issues:
1. Check GitHub Actions logs (Actions tab → workflow run → expand job)
2. Check Netlify deploy logs (Site → Deploys)
3. Review script output (run locally: `python3 aileena/scripts/update_equities.py`)
4. Ask Claude/Cursor: "Debug this GitHub Actions error: [paste error]"

---

## What Happens After Deploy

✅ **Daily 9 AM UTC**:
1. GitHub Actions runner starts
2. Clones repo, installs dependencies
3. Runs `update_equities.py` & `update_cislunar.py`
4. Generates fresh markdown files
5. Auto-commits if data changed
6. Pushes to GitHub
7. Netlify automatically rebuilds
8. aileena.xyz reflects latest data

✅ **Manual Trigger** (anytime):
- Go to Actions → "Daily Data Update" → "Run workflow"
- Does the same as above, on-demand

---

**🎉 You're live! Your aileena.xyz data pipeline is now automated.**

💡 **Pro Tip**: Bookmark the Actions tab for quick monitoring. Green checkmarks = success!
