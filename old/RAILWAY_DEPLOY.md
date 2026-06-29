# Railway Deployment - 3 Steps

Railway CLI is installed. Complete these 3 quick steps:

---

## Step 1: Login to Railway (30 seconds)

```bash
cd /Users/aileen/aileen_machina
railway login
```

This opens your browser → login with GitHub → authorize Railway → done.

---

## Step 2: Create & Link Project (1 minute)

```bash
# Initialize new Railway project
railway init

# Link to GitHub repo (auto-deploys on push)
railway link
```

When prompted:
- **Project name**: `aileena` (or whatever you prefer)
- **Link to GitHub**: Yes
- **Select repo**: `lilaclilac09/aileen_machina_01`

---

## Step 3: Deploy Now (30 seconds)

```bash
# Deploy the aileena static site
railway up
```

Railway will:
- Build from `aileena/` directory
- Serve via Python HTTP server on port 8080
- Give you a live URL like: `https://aileena-production-xxxx.up.railway.app`
- Auto-redeploy on every `git push origin main`

---

## What Happens After Deploy

✅ **Live URL**: Railway generates a public URL  
✅ **Auto-deploy**: Every git push triggers rebuild  
✅ **GitHub Actions**: Daily data updates → auto-commit → Railway auto-redeploys  
✅ **Cost**: Free tier (500 hours/month, $5 credit)  

---

## Alternative: Deploy from GitHub (No CLI)

If you prefer web UI:

1. Go to: https://railway.app/new
2. **"Deploy from GitHub repo"**
3. Select: `lilaclilac09/aileen_machina_01`
4. **Root directory**: `.` (leave as root)
5. **Start command**: `python3 -m http.server 8080 --directory aileena`
6. Click **"Deploy"**

Railway auto-detects the static site and serves it.

---

## Files Created

✅ `railway.json` - Railway config (start command, build settings)  
✅ `.env.railway` - Environment variables for Railway

---

## After First Deploy

### View Your Site
```bash
railway open
```

Opens your live URL in browser.

### Set Custom Domain (Optional)
```bash
railway domain
```

Add your own domain like `aileena.xyz`.

### View Logs
```bash
railway logs
```

Real-time deployment and server logs.

### Redeploy Manually
```bash
railway up
```

Forces immediate redeploy (useful for testing).

---

## GitHub Actions Integration

Your existing workflow (`.github/workflows/daily-update.yml`) already works:
1. Runs daily at 9 AM UTC
2. Updates markdown files
3. Auto-commits to GitHub
4. Railway detects push → auto-redeploys
5. Site is live with new data in seconds

**No webhook setup needed** - Railway watches your GitHub repo automatically.

---

## Quick Commands Summary

```bash
# One-time setup
railway login
railway init
railway link

# First deploy
railway up

# Check status
railway status

# View live site
railway open

# View logs
railway logs
```

---

## Next: Run These 3 Commands

```bash
cd /Users/aileen/aileen_machina
railway login    # Opens browser, authorize
railway init     # Create project
railway up       # Deploy now
```

**Time**: ~2 minutes total  
**Result**: aileena.xyz live on Railway with auto-deploy enabled ✅
