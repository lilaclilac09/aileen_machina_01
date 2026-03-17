# Vercel 一键部署指南（AILEENA 全栈项目）

## 1. 前提准备
- 注册并登录 [Vercel](https://vercel.com/)
- GitHub 账号已绑定 Vercel
- 项目已 push 到 GitHub 仓库

## 2. 新建 Vercel 项目
1. 打开 Vercel 控制台，点击 **Add New Project**
2. 选择你的 aileen_machina_01 仓库，点击 **Import**
3. 选择 `chat/` 作为前端目录，`backend/` 作为后端（API）目录

## 3. 配置环境变量
在 Vercel 项目设置中，添加以下环境变量：

### chat/ 前端
- `NEXT_PUBLIC_SUPABASE_URL`：你的 Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase 匿名 Key

### backend/ 后端
- `SUPABASE_URL`：你的 Supabase 项目 URL
- `SUPABASE_KEY`：服务端 Key（service_role）
- `FINNHUB_KEY`：Finnhub API Key
- `ALPHA_VANTAGE_KEY`：Alpha Vantage API Key

## 4. 部署
- 点击 **Deploy**，等待自动构建和部署完成
- 成功后，Vercel 会分配预览域名，可自定义为 `finance.aileena.xyz`、`api.aileena.xyz` 等

## 5. 路由说明
- 前端站点：`/`、`/chat`、`/finance` 等
- 后端 API：`/api/data`、`/api/stocks/my`、`/api/stocks/add`、`/api/stocks/remove/:symbol`

## 6. 常见问题
- 环境变量漏填会导致 500 错误，请务必检查
- Supabase 权限建议仅开放当前用户可读写自己的数据

---

> ![vercel-deploy-screenshot](https://assets.vercel.com/image/upload/v1669991234/front/vercel-dashboard.png)

如需详细截图或遇到问题，随时微信联系！
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
