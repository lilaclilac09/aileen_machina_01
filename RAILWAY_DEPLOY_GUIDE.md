# Railway 部署说明（Next.js 项目）

## 1. 新建 Railway 项目
- 登录 https://railway.app
- 点击 New Project → Deploy from GitHub Repo，选择 aileen_machina_01 仓库
- 选择 chat 目录作为部署根目录

## 2. 构建与启动命令
- Build Command: `npm run build`
- Start Command: `npm start`

## 3. 配置环境变量
- 打开 chat/.env.example，把所有变量（如 NEXT_PUBLIC_SUPABASE_URL、UPSTASH_REDIS_REST_URL 等）在 Railway 的 Variables 页面一一填写
- 建议本地复制 chat/.env.example 为 chat/.env.local，填写真实值后再同步到 Railway

## 4. 绑定自定义域名
- Railway 项目 → Settings → Domains → Add Domain，输入 finance.aileena.xyz
- 按提示在 DNSPod 添加 CNAME 记录，主机 finance，值为 Railway 提供的 xxx.up.railway.app

## 5. 部署与访问
- Railway 会自动构建并部署，完成后可用临时域名或自定义域名访问
- 检查页面和 API 是否正常

## 6. 常见问题
- 环境变量未配置或拼写错误会导致构建/运行失败
- 域名绑定后需等待 DNS 生效（通常几分钟到数小时）
- 如遇 404/500 报错，检查环境变量和构建日志

---

如需自动化脚本或遇到部署报错，请联系维护者或在本仓库提 issue。
