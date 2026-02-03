# 🚀 Deployment Guide

## Option 1: Netlify (Easiest - Drag & Drop) ⭐ RECOMMENDED

1. **Go to**: https://app.netlify.com/drop
2. **Drag and drop** your entire `aileen_machina` folder
3. **Done!** Your site will be live in seconds with a URL like: `https://random-name-123.netlify.app`
4. **Custom Domain**: You can add your own domain in Netlify settings

## Option 2: Vercel (Also Easy)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd /Users/aileen/aileen_machina
   vercel
   ```

3. **Follow the prompts** - it will give you a live URL instantly!

## Option 3: GitHub Pages

1. **Initialize Git** (if not done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository** at https://github.com/new

3. **Push to GitHub**:
   ```bash
   git remote add origin YOUR_REPO_URL
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Select `main` branch and `/ (root)` folder
   - Your site will be at: `https://YOUR_USERNAME.github.io/REPO_NAME`

## Option 4: Surge.sh (Simple CLI)

```bash
npm install -g surge
cd /Users/aileen/aileen_machina
surge
# Follow prompts - you'll get a URL like: your-site-name.surge.sh
```

---

## 📸 **Before Deploying - Add Your Images!**

Make sure you have these 3 images in your folder:
- `mechanical-side.jpg`
- `mechanical-back.jpg`
- `mechanical-detail.jpg`

---

## ✅ **Quick Deploy Commands**

### Netlify (via CLI):
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Vercel:
```bash
vercel --prod
```

---

**Recommendation**: Use **Netlify** (Option 1) - it's the fastest and easiest! 🎉
