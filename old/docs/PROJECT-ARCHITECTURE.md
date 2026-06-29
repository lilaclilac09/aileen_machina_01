# AILEENA_MACHINA_01 项目整体架构文档
**版本**：v2026.03.11（手机友好版）  
**作者**：你 + Grok 共同维护  
**仓库**：https://github.com/lilaclilac09/aileen_machina_01  
**目的**：让你在手机上随时打开这个文件就能知道「项目全貌、上次卡在哪、下一步干什么」。

### 1. 项目总览（Monorepo，前后端完全分离）
```
aileen_machina_01/                  ← 根目录（GitHub 主仓库）
├── frontend/                       ← 所有前端（静态 + 轻量 JS）
│   ├── main-site/                  ← aileena.xyz（艺术/机械美学主页）
│   ├── finance/                    ← finance.aileena.xyz（金融数据站）
│   ├── blog/                       ← blog.aileena.xyz（文章系统）
│   ├── music/                      ← music.aileena.xyz（音乐/音轨站）
│   └── chat/                       ← 已有 chat 子项目（Netlify）
├── backend/                        ← 独立后端（Hono + Drizzle）
│   └── src/                        ← 所有业务逻辑（见下文）
├── docs/                           ← 你手机上最常改的地方
│   ├── PROJECT-ARCHITECTURE.md     ← 本文件（随时改）
│   ├── DEVELOPMENT-LOG.md          ← 开发进度日志（必填！）
│   ├── SITE-REQUIREMENTS.md        ← 每个站点需求清单（手机改）
│   └── CONTENT-TEMPLATES/          ← blog/音乐文章模板
├── .github/workflows/              ← CI/CD（自动部署）
└── README.md
```

**核心原则（永远记住）**
- **前后端彻底分离**：前端 = 纯静态（HTML + GSAP + Tailwind），不连数据库。所有动态数据走后端 API（https://api.aileena.xyz 或 finance.aileena.xyz）。
- **手机修改友好**：所有内容（blog 文章、音乐列表、站点需求）都用 Markdown 文件，改完 push → 自动部署。
- **快速部署**：前端用 Netlify/Vercel（拖拽或 GitHub 自动），后端用 Railway/Vercel（API）。

### 2. 数据库 & 部署现状（实时记录）
- **数据库**：Supabase PostgreSQL（已配置 Drizzle ORM）
  - 表：`user_stocks`、`valuation_assumptions`、`blog_posts`（未来）
  - 连接方式：backend/src/db/supabase.ts（已存在）
  - 为什么选 Supabase：免费、Realtime、手机上也能看仪表盘
- **Vercel 状态**：**尚未链接**
  - 前端建议：main-site + blog + music 用 Vercel（自动预览）
  - 后端建议：backend/ 链接到 Vercel（免费 serverless API）
  - 当前部署：Netlify（chat）、Railway（后端测试）
- **API 域名规划**：
  - api.aileena.xyz → backend（Hono）
  - finance.aileena.xyz → 前端金融站（调用 api.aileena.xyz）

### 3. 各个站点需求清单（手机上直接改这个文件即可）
（建议把下面内容复制到 `docs/SITE-REQUIREMENTS.md`）

- **主站 aileena.xyz**  
  机械美学 + 艺术摄影 + 音乐展示 + 导航到其他子站。纯静态，GSAP 动画。

- **finance.aileena.xyz**  
  实时美股 + 太空经济 + 估值模型。调用 backend /api/data。手机加股票。

- **blog.aileena.xyz**  
  Markdown 驱动文章系统。手机改 docs/blog/ 里的 .md 文件 → 自动生成页面。

- **music.aileena.xyz**  
  音轨列表 + 播放器 + vinyl 风格。手机改 music-playlist.md → 自动部署。


### 4. 完整开发计划（分 4 个阶段，手机随时看进度）

**阶段 0（已完成）**  
- Hono 项目创建 + Drizzle + Supabase 配置 + keyshiled 中间件

**阶段 1（本周目标：后端金融核心）**  
- 实现 `/api/data` 万能路由（Finnhub + Alpha Vantage）
- 完成 services/stock.service.ts + valuation.service.ts
- 测试手机加股票功能
- 部署 backend 到 Railway/Vercel

**阶段 2（下周：前端集成 + 内容系统）**  
- finance 前端调用新 API
- 创建 blog 和 music 的 Markdown 驱动系统
- 手机修改 docs/CONTENT-TEMPLATES/ → 自动部署

**阶段 3（两周后：估值模型）**  
- 实现简单 DCF 估值路由
- Supabase 存用户自选股票

**阶段 4（未来）**  
-- 加 WebSocket 实时推送（股票）
- Claude 集成自动生成分析报告
- 多语言 / PWA 支持

### 5. 开发日志文件（每次停下必填！）
请立即在仓库创建 `docs/DEVELOPMENT-LOG.md`，格式如下（复制粘贴用）：

```markdown
# DEVELOPMENT-LOG.md
最后更新：2026-03-11 14:00 HKT

## 本次记录
日期：2026-03-11
进度：写完整体架构文档 + 开发日志模板
卡点：Vercel 还未链接 backend
数据库状态：Supabase 已连，表未创建
部署状态：Railway 测试 OK，Vercel 未链接
下一步：写 services/stock.service.ts
耗时：30 分钟
心情/备注：手机上改文档超爽！

## 历史记录（倒序）
2026-03-08：上次卡在 Alpha Vantage 整合
...
```

**使用方法**：
1. 每次停下前打开手机 GitHub App → 编辑 DEVELOPMENT-LOG.md → Commit
2. 这样下次你打开仓库就知道上次卡在哪、数据库连没连、Vercel 状态

---

**立即行动（3 分钟搞定）**：
1. 把上面整个内容复制，保存为 `docs/PROJECT-ARCHITECTURE.md`
2. 再创建一个 `docs/DEVELOPMENT-LOG.md`，把日志模板粘进去并填上今天的内容
3. Push 到 GitHub（手机就能操作）
4. 回复我：“架构文档已 push，下一步写 `/api/data` 路由” 或 “先帮我写 blog Markdown 系统”

这样以后无论隔多久，你手机上打开这两个 MD 文件就能瞬间接上进度，前后端永远不混在一起，部署也永远 1 分钟。

我们现在正式进入「文档驱动开发」模式，冲！🚀
