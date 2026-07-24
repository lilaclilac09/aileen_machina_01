# Gather（共影）项目报告 / Status Report

**日期 Date:** 2026-07-22  
**PR:** https://github.com/lilaclilac09/aileen_machina_01/pull/261  
**分支 Branch:** `cursor/gather-album-app-813a`  
**目标域名 Target:** `https://album.aileena.xyz`  
**状态 Status:** 代码完成并已验证（含主站入口、过期清理 cron、移动端/HEIC 打磨）；**生产部署仍待你配置凭证**（Neon / Vercel / DNSPod）

---

## 1. 结论 Verdict

已交付一个可运行的 **免注册共享相册 Web 应用**（产品名 **Gather / 共影**），形态参考 pic-tomo：链接/二维码入场、人人可传、点赞评论、置顶、多选删除；容量约 **500 张 / 30 天**。

代码在 monorepo 的独立应用目录 [`album/`](../)，计划挂在子域名 `album.aileena.xyz`。  
**生产环境尚未上线**：当前 Cloud Agent 环境没有 Vercel / Neon / DNSPod 凭证，部署步骤已写好，等你下次提供或自己按清单点完。

---

## 2. 产品是什么 What we built

| 项 | 说明 |
|----|------|
| 定位 | 活动/聚会临时共享相册，不是永久网盘 |
| 对标 | pic-tomo.com（免注册、QR 分享） |
| 容量 | 500 张 / 相册 |
| 有效期 | 创建起 30 天，过期拒绝上传 |
| 角色 | Guest：上传/点赞/评论；Admin：置顶/多删/锁上传 |
| 品牌 | Gather · 共影，挂 aileena.xyz 体系 |

核心闭环：

1. 主持人输入标题 → 得到 URL + QR + **一次性 admin secret**  
2. 客人扫码/打开链接 → 可直接上传（无需注册）  
3. 瀑布流浏览 + lightbox；可点赞、评论  
4. 管理员置顶（开头 / 中心大图）、多选删除、锁定上传  
5. 30 天后相册过期  

完整产品说明见 [`PRODUCT.md`](./PRODUCT.md)。

---

## 3. 已实现功能 Feature checklist

| 功能 | 状态 | 备注 |
|------|------|------|
| 创建相册（免注册） | Done | `/` |
| 分享链接 + QR | Done | `/api/qr` |
| 多人上传 | Done | ≤20/次，单张 ≤15MB，相册 ≤500 |
| 瀑布流 + Lightbox | Done | `/a/[slug]` |
| 点赞 | Done | visitor cookie |
| 评论 | Done | 昵称 + 正文 |
| 置顶开头 | Done | pinMode=`front` |
| 置顶中心大图 | Done | pinMode=`center`，顶部 hero |
| 多选删除 | Done | admin only |
| 锁定上传 | Done | admin PATCH |
| Admin secret 解锁 | Done | 创建后 cookie / 事后输入 |
| 本地存储 | Done | `STORAGE_DRIVER=local` |
| Vercel Blob | Done | `STORAGE_DRIVER=blob` |
| Cloudflare R2 | Done | `STORAGE_DRIVER=r2` |
| 双写 R2 + 阿里云 OSS | Done | `STORAGE_DRIVER=dual` + 按地区选 URL |
| 过期清理 cron | Done | `/api/cron/purge` + vercel.json，需 `CRON_SECRET` |
| 主站入口 gather | Done | aileena.xyz dock 社交链 + footer |
| HEIC / 上传跳过原因 | Done | API `skipped[]` + UploadPanel |
| 移动端滑动 / 触控置顶 | Done | Lightbox swipe + pin 常显 |
| 生产部署上线 | **Pending** | 见第 6 节 — **只剩你账号操作** |

**明确不做（Phase 2）：** 付费延期、ZIP 打包下载、相册密码、WebSocket 实时刷新、ICP 备案专用国内整站边缘。

---

## 4. 技术架构 Architecture

```
用户(CN/INTL)
    → Vercel (Next.js 14 App Router, Root=album)
        → Prisma (SQLite 本地 / Postgres 生产，构建时自动切换)
        → Storage:
            local | blob | r2 | dual(R2+OSS)
        → CDN 选择:
            x-vercel-ip-country / cf-ipcountry / Accept-Language / x-gather-region
```

| 层 | 选型 |
|----|------|
| 应用 | Next.js 14 + React 18 + Tailwind 3 + TypeScript |
| 路径 | monorepo `/workspace/album`（与 `cafe-cursor` 同级） |
| DB | Prisma；本地 SQLite；生产 Neon/Postgres |
| 文件 | `@vercel/blob` / `@aws-sdk/client-s3`(R2) / `ali-oss` |
| 鉴权 | 每相册 admin secret → httpOnly cookie；无全局账号 |
| 主站入口 | `aileena-new` footer PROJECTS → Gather · 共影 |

关键文件：

| 路径 | 作用 |
|------|------|
| `album/docs/PRODUCT.md` | 产品与架构设计 |
| `album/DEPLOY.md` | 上线点击清单 |
| `album/README.md` | 开发说明 |
| `album/app/page.tsx` | 创建页 |
| `album/app/a/[slug]/page.tsx` | 相册墙 |
| `album/lib/storage.ts` | 存储驱动 |
| `album/lib/cdn.ts` | 国内外 URL 选择 |
| `album/lib/pin.ts` | 置顶状态机 |
| `album/scripts/ensure-prisma-provider.mjs` | Postgres 自动切换 |
| `album/vercel.json` | Vercel 构建命令 |

---

## 5. 验证证据 Verification

本地已跑通（2026-07-21）：

```bash
cd album && npm i && npx prisma db push && npm run build   # exit 0
npm run start   # :3010
```

API smoke：

| 步骤 | 结果 |
|------|------|
| POST `/api/albums` | 200，返回 slug + adminSecret + 30 天 expiresAt |
| POST `.../photos` | uploaded:1 |
| POST `.../like` | liked:true |
| POST `.../comments` | 评论创建 |
| POST `.../pin` ×3 | `front` → `center` → `none` |
| GET + `x-gather-region: cn\|intl` | album.cdn 切换正确 |
| POST `.../photos/delete` | deleted:1 |

产物记录：`/opt/cursor/artifacts/gather-verify-report.md`

---

## 6. 下次上线你要做什么 Next deploy（你来配）

详细点击路径见 [`../DEPLOY.md`](../DEPLOY.md)。摘要：

1. **Neon** https://console.neon.tech → 复制 `DATABASE_URL`  
2. **Vercel** https://vercel.com/new → Import 本仓库 → **Root Directory = `album`**  
3. Env：`DATABASE_URL`、`ADMIN_COOKIE_SECRET`、`NEXT_PUBLIC_APP_URL=https://album.aileena.xyz`、`STORAGE_DRIVER=blob`、`BLOB_READ_WRITE_TOKEN`  
4. **DNSPod** https://console.cloud.tencent.com/cns → `album` CNAME → `cname.vercel-dns.com`  
5. Vercel Domains 添加 `album.aileena.xyz`  

可选：把 `VERCEL_TOKEN` + Neon URL 发给 Agent，可 CLI 代部署（DNS 仍须你在 DNSPod 加）。

**最快上线策略：** 先用 Blob，不要一上来配 dual CDN；国内外双写等有真实流量再开。

---

## 7. 风险与待决 Risks / open

| 风险 | 说明 |
|------|------|
| 国内访问 HTML | 页面仍走 Vercel；图片可用 dual OSS 加速，整站国内极速需后续边缘/备案 |
| Admin secret 丢失 | MVP 不可找回，创建时必须保存 |
| HEIC | sharp 尽力转 JPEG，部分机型可能失败 |
| 费用 | Blob/Neon 免费档够小活动；大量原图需盯用量 |
| PR 未合 main | footer 链接合入后才在 aileena.xyz 生产可见 |

---

## 8. Git 提交 Commits（本分支）

1. `1d194a6` — Add Gather shared album MVP app  
2. `b780f0d` — Dual CDN (R2+OSS) + pin front/center  
3. `bb178d0` — Deploy wiring + aileena.xyz footer link  

---

## 9. 一句话给未来的你

> 代码和验收都好了；下次打开 `album/DEPLOY.md`，按 Neon → Vercel(Root=album) → Blob → DNSPod 四步上线即可。
