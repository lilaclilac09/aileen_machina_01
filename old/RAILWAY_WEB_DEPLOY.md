# Deploy aileena.xyz to Railway (Web UI - 2 Minutes)

## Quick Deploy - No CLI Needed

**Open this link**: https://railway.app/new

---

## Step 1: Deploy from GitHub (30 seconds)

1. Click **"Deploy from GitHub repo"**
2. Authorize Railway to access your repos (if first time)
3. Select: **`lilaclilac09/aileen_machina_01`**
4. Railway will detect the repo automatically

---

## Step 2: Configure Service (1 minute)

Railway auto-detects most settings, but verify these:

### Build Settings
- **Root Directory**: `.` (leave as default)
- **Build Command**: (leave empty - it's a static site)

### Deploy Settings
- **Start Command**: 
  ```
  python3 -m http.server 8080 --directory aileena
  ```

### Environment Variables
- **None needed** for now

### Networking
- Railway auto-assigns a public URL
- Click **"Generate Domain"** if it doesn't auto-create one

---

## Step 3: Deploy (30 seconds)

1. Click **"Deploy"** button
2. Watch the build logs (real-time)
3. Wait for: ✅ **"Deployment successful"**
4. Click the generated URL (e.g., `https://aileena-production-xxxx.up.railway.app`)

---

## What You'll See

Railway dashboard shows:
- **Deployments** tab - build history
- **Logs** - real-time server output
- **Settings** - domain, env vars, etc.
- **Metrics** - usage stats

Your site URL will be something like:
```
https://aileena-production-a1b2.up.railway.app
```

---

## Auto-Deploy on Git Push

Railway is already watching your GitHub repo:
- Every `git push origin main` → auto-rebuild
- GitHub Actions daily updates → auto-commit → Railway redeploys
- Zero manual intervention needed

---

## Optional: Add Custom Domain

In Railway dashboard:
1. Go to **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Enter: `aileena.xyz`
4. Add DNS record from your domain provider:
   ```
   CNAME  aileena  cname.railway.app
   ```

---

## Verify Everything Works

After deploy:
1. ✅ Visit Railway URL → see aileena homepage
2. ✅ Click equity cards → markdown links work
3. ✅ Check GitHub Actions → workflow visible
4. ✅ Push a test commit → Railway auto-redeploys

---

## Alternative: One-Click Deploy Button

Or just click this:

**[Deploy on Railway](https://railway.app/template/deploy?referralCode=github)**

Then select your `aileen_machina_01` repo.

---

## Summary

✅ **2 minutes** to deploy  
✅ **$0/month** on free tier (500 hrs/month)  
✅ **Auto-deploy** on git push  
✅ **No CLI** needed  
✅ **Custom domain** ready  

Your aileena.xyz data pipeline is production-ready! 🚀
