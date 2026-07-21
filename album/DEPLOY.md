# Gather 上线配置清单 / Deploy checklist

目标域名：**https://album.aileena.xyz**

本仓库已写好：应用代码、双 CDN 适配、Postgres 自动切换脚本、主站 footer 入口。  
下面步骤需要在你账号里点几下（当前 Cloud Agent **没有** Vercel / DNSPod / Blob / R2 / OSS token）。

---

## 1. 数据库（Neon 免费即可，约 2 分钟）

1. 打开 https://console.neon.tech → New Project → 复制 **Connection string**（`postgresql://...`）
2. 记下为 `DATABASE_URL`

Vercel 构建时会跑 `scripts/ensure-prisma-provider.mjs`：检测到 postgres URL 就自动把 Prisma 切到 `postgresql` 并 `db push`。

---

## 2. Vercel 新建项目（Root = `album`）

1. https://vercel.com/new → Import `lilaclilac09/aileen_machina_01`
2. **Root Directory** 设为 `album`（重要：不要用仓库根）
3. Framework: Next.js（自动）
4. Environment Variables（Production + Preview）：

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string |
| `ADMIN_COOKIE_SECRET` | 长随机串，例如 `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://album.aileena.xyz` |
| `STORAGE_DRIVER` | 先用 `blob`（最快上线）；有双 CDN 再改 `dual` |

### 存储方案 A — 最快上线（推荐先做）

1. Vercel 项目 → Storage → **Blob** → Create
2. 把生成的 `BLOB_READ_WRITE_TOKEN` 加进 Env
3. `STORAGE_DRIVER=blob`

### 存储方案 B — 国内外双 CDN

| Name | Value |
|------|--------|
| `STORAGE_DRIVER` | `dual` |
| `R2_ACCOUNT_ID` | Cloudflare |
| `R2_ACCESS_KEY_ID` | |
| `R2_SECRET_ACCESS_KEY` | |
| `R2_BUCKET` | |
| `R2_PUBLIC_BASE_URL` | 如 `https://media-intl.yourcdn.com` |
| `OSS_REGION` | 如 `oss-cn-hangzhou` |
| `OSS_ACCESS_KEY_ID` | |
| `OSS_ACCESS_KEY_SECRET` | |
| `OSS_BUCKET` | |
| `OSS_PUBLIC_BASE_URL` | 如 `https://album-cn.aileena.xyz`（绑 OSS CDN） |

5. Deploy → 得到 `*.vercel.app` 预览 URL，先自测创建相册/上传。

---

## 3. 绑定域名 album.aileena.xyz

### Vercel

Project → Settings → Domains → Add `album.aileena.xyz`

### 腾讯云 DNSPod（与 cursor-cafe 相同）

1. https://console.cloud.tencent.com/cns → `aileena.xyz`
2. 添加记录：
   - 主机记录：`album`
   - 类型：`CNAME`
   - 值：`cname.vercel-dns.com`
   - TTL：600
3. 等 DNS 生效（通常几分钟）→ Vercel Domains 显示 Valid

---

## 4. 验收

```text
https://album.aileena.xyz/
→ 创建相册 → 复制链接 → 手机上传 → 点赞评论 → 管理密钥置顶/多选删除
```

主站 footer PROJECTS 已加 **Gather · 共影** → `https://album.aileena.xyz`（随 PR 进 main 后生效）。

---

## 5. 可选：把 Vercel Token 发给 Agent 代部署

若希望下次 Agent 直接 CLI 部署：

1. https://vercel.com/account/tokens → Create
2. 在 Cursor Cloud / 对话里提供 `VERCEL_TOKEN`（以及 Neon URL）
3. Agent 可执行：

```bash
cd album
npx vercel link --yes --project gather-album
npx vercel env add ...
npx vercel --prod
```

DNS 仍须你在 DNSPod 加 CNAME（Agent 没有腾讯云登录）。
