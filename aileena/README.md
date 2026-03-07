# aileena.xyz Data Pipeline

**Automated daily equity & space economy data updates for aileena.xyz**

This project automatically fetches and updates financial data for 5 key equities (RCL, MU, LLY, MAR, HLT) and tracks NASA Cis-Lunar space economy progress (Tier 1-3 companies) via GitHub Actions.

## Overview

- **Equities**: Real-time price, broker targets, financial results, 2026 guidance
- **Cis-Lunar**: NASA CLPS missions, company tiers, strategic developments
- **Automation**: Daily updates at 9 AM UTC via GitHub Actions
- **Deployment**: Markdown files stored in Git, deployed via Netlify
- **AI-Friendly**: All content editable directly in Markdown for use with Cursor/Claude

## Directory Structure

```
aileena/
├── content/
│   ├── equities/          # Auto-generated equity data files
│   │   ├── rcl.md
│   │   ├── mu.md
│   │   ├── lly.md
│   │   ├── mar.md
│   │   └── hlt.md
│   └── cislunar/          # Auto-generated space economy data
│       ├── tier1/         # Strategic providers (SpaceX, Lockheed Martin)
│       ├── tier2/         # CLPS providers (Intuitive, Firefly, Astrobotic)
│       └── tier3/         # Early-stage (Axiom, iSpace, Relativity)
├── scripts/
│   ├── update_equities.py       # Equity data scraper
│   ├── update_cislunar.py       # NASA CLPS & space economy scraper
│   ├── config.json              # Configuration: tickers, data sources
│   └── requirements.txt          # Python dependencies
└── .github/workflows/
    └── daily-update.yml         # GitHub Actions automation
```

## How It Works

### 1. Data Fetching

**Equities** (`update_equities.py`):
- Fetches from investor relations press releases
- Scrapes Yahoo Finance for current prices & broker targets
- Extracts: revenue, net income, EPS, guidance, developments

**Cis-Lunar** (`update_cislunar.py`):
- Tier 1: Strategic providers (static data, company focus)
- Tier 2: CLPS providers (NASA contract tiers, mission timelines)
- Tier 3: Early-stage companies (innovation focus)

### 2. Markdown Generation

Each ticker/company gets a `.md` file with:
- **Frontmatter**: ticker, price, broker target, last updated timestamp
- **Auto-updated sections**: Financial results, developments, mission targets
- **Manual sections**: Investment thesis, strategic analysis (preserved across updates)

Example:
```markdown
---
ticker: RCL
name: Royal Caribbean Group
last_updated: 2026-03-07 15:13 UTC
---

## Royal Caribbean Group (RCL)

### Stock Price & Target
- Current Price: $304.33
- Broker Target: $335.00

### Latest Financial Results
- Revenue (Latest): Q4 2025: $4.3B; Full 2025: $17.9B
- EPS: 15.64

### 2026 Guidance
EPS $17.70–$18.10

### Investment Thesis
*[Your manual analysis - not auto-updated]*
```

### 3. Automation & Deployment

**GitHub Actions** (`.github/workflows/daily-update.yml`):
1. Triggers every day at 9 AM UTC (configurable)
2. Installs Python dependencies
3. Runs both scrapers
4. Auto-commits changes to Git if data changed
5. Pushes to `main` branch
6. Netlify automatically redeploys on push

## Manual Local Testing

### Install Dependencies
```bash
cd aileena/scripts
pip install -r requirements.txt
```

### Run Equity Scraper
```bash
cd aileena
python3 scripts/update_equities.py
```

### Run Cis-Lunar Scraper
```bash
cd aileena
python3 scripts/update_cislunar.py
```

### Check Generated Files
```bash
ls -la aileena/content/equities/
ls -la aileena/content/cislunar/tier*/
```

## Configuration

Edit `aileena/scripts/config.json` to:
- Add/remove tickers
- Change data source URLs
- Adjust cache TTL (time-to-live)
- Update company tiers

## AI Management & Editing

Since all data is Markdown-based and stored in Git, you can:

1. **Edit manually**: Open any `.md` file in your editor and update the Investment Thesis section
2. **Regenerate data**: Run the scripts anytime via GitHub Actions (manual trigger) or terminal
3. **Customize**: Modify templates in Python scripts to adjust what data is captured

### Manual Update via GitHub Actions

Go to your repo:
1. **Actions** tab → "Daily Data Update"
2. Click **"Run workflow"** → **"Run workflow"** confirm
3. Wait 1-2 minutes for completion
4. Check the auto-committed changes

## Roadmap (Future Phases)

- [ ] **Phase 6**: Add 11ty or Next.js static site generator
- [ ] **Phase 7**: AI management API endpoint (`/api/regenerate`)
- [ ] **Phase 8**: Real-time price alerts via email/webhook
- [ ] **Phase 9**: Vector search for semantic company/equity lookups

## Troubleshooting

### Scraper Fails Silently
- Check GitHub Actions logs: **Actions tab** → workflow run
- Most common: Website HTML changed → update scraper selectors
- Fallback: Uses cached data from last successful run

### No Commits Being Made
- Ensure `DATA_UPDATE_TOKEN` GitHub secret is set (see Setup section)
- Check workflow logs for permission errors
- Verify Git config in workflow is correct

### Stock Prices Not Updating
- Yahoo Finance HTML structure may have changed
- Fallback displays `N/A` but keeps previous values
- Manual fix: Update selectors in `fetch_yahoo_finance_price()`

## Setup (First Time)

1. **Create GitHub Personal Access Token**:
   - GitHub Settings → Tokens → New Token
   - Scopes: `repo` (full), `workflow`
   - Save token

2. **Add as Repository Secret**:
   - Repo Settings → Secrets → New repository secret
   - Name: `DATA_UPDATE_TOKEN`
   - Value: Your token from step 1

3. **Push to GitHub**:
   ```bash
   git add aileena/
   git commit -m "feat: add aileena data pipeline"
   git push origin main
   ```

4. **Verify Workflow**:
   - Go to Actions tab
   - Check "Daily Data Update" appears in workflow list
   - (Optional) Click "Run workflow" for immediate test

5. **Set Up Netlify Redeploy** (if needed):
   - Netlify auto-redeploys on every push (already configured)
   - Check Netlify deploy logs after first auto-commit

## License

MIT - Free to modify and deploy

## Support

For issues or questions, open a GitHub issue or edit the `scripts/` directly (AI-friendly!)
