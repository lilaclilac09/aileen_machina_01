# Gather（共影）— Shared Event Album

**Domain:** `album.aileena.xyz`  
**Owner brand:** aileena.xyz  
**Reference:** pic-tomo.com (no-registration shared albums)

---

## 1. Product one-liner / 一句话

创建一个 **免注册、链接即入、人人可传** 的活动共享相册：约 **500 张 / 30 天**，支持点赞、评论、置顶、多选删除；挂在 `album.aileena.xyz`，国内外都能打开且访问要快。

Create a **no-signup, link-join, anyone-uploads** event album: **~500 photos / 30 days**, with likes, comments, pin, multi-delete — hosted at `album.aileena.xyz` with fast access in CN and abroad.

---

## 2. Who it’s for / 场景

| Scene | Why Gather |
|-------|------------|
| Wedding / party / trip | Guests scan QR, dump phone photos |
| Cafe Cursor / IRL events | Same-day collective memory |
| Family reunion | Elders don’t need App Store |

**Anti-goals (MVP):** permanent cloud library, social network, AI face grouping, native apps.

---

## 3. Core loop / 核心闭环

```mermaid
flowchart LR
  create[CreateAlbum] --> share[ShareURL_QR]
  share --> upload[AnyoneUploads]
  upload --> view[GridPlusLightbox]
  view --> react[LikeComment]
  view --> admin[AdminPinDelete]
  admin --> expire[ExpireAt30Days]
```

1. Host enters album title → gets **public URL + QR + admin secret** (shown once).
2. Guests open link (no account) → nickname optional → upload photos.
3. Live masonry/grid; pinned photos float to the **front**.
4. Anyone can like / comment; **admin** can pin, multi-select delete, close uploads.
5. After **30 days** album is soft-expired (read-only then purge job).

---

## 4. Feature map / 功能图

### MVP (this repo)

| Feature | Spec |
|---------|------|
| Create album | Title; no signup |
| Capacity | **500 photos / album** |
| TTL | **30 days from the last upload**, then auto-delete |
| Share | Short URL `/a/[slug]` + QR |
| Upload | Multi-file; HEIC→JPEG best-effort |
| Gallery | Masonry + **center pin hero** + front pins |
| Lightbox | Swipe / keyboard; like + comment |
| Like / Comment | visitor cookie + nickname |
| Pin | Cycle none → front → center |
| Multi-delete | Admin select mode |
| Dual CDN | `STORAGE_DRIVER=dual` → R2 + 阿里云 OSS |
| Expire | Uploads rejected after TTL |

### Phase 2 (still out)

- Paid extend (photos / days)
- ZIP bulk download / print sheet
- Album password
- Real-time websocket refresh
- Share-reward capacity boost
- Host multi-album dashboard
- China ICP / dedicated CN edge for HTML (optional)  

---

## 5. Trust & roles / 权限

| Role | How | Can |
|------|-----|-----|
| Guest | Link only | Upload, like, comment, view |
| Admin | `adminSecret` cookie | Pin, multi-delete, toggle upload lock, rename |

No global accounts in MVP. Admin secret is **not** recoverable if lost (shown once + copy).

---

## 6. Architecture / 架构

```mermaid
flowchart TB
  subgraph clients [Clients]
    userCN[User_CN]
    userINTL[User_INTL]
  end
  subgraph app [Vercel_album_aileena_xyz]
    next[Nextjs_AppRouter]
    api[API_Routes]
    geo[GeoCDN_Picker]
  end
  subgraph data [Data]
    db[(Postgres_or_SQLite)]
    r2[Cloudflare_R2_intl]
    oss[Aliyun_OSS_CN]
  end
  userCN --> next
  userINTL --> next
  next --> api
  api --> db
  api -->|"STORAGE_DRIVER=dual"| r2
  api -->|"STORAGE_DRIVER=dual"| oss
  api --> geo
  geo -->|"CN edge URLs"| userCN
  geo -->|"intl edge URLs"| userINTL
```

| Layer | Choice | Notes |
|-------|--------|-------|
| App | Next.js 14 App Router in `album/` | Sibling to cafe-cursor |
| Host | Vercel → `album.aileena.xyz` | DNSPod CNAME |
| DB | Prisma SQLite local / Postgres prod | |
| Files | `local` \| `blob` \| `r2` \| **`dual`** | dual = R2 + 阿里云 OSS |
| CDN pick | `x-vercel-ip-country` / `cf-ipcountry` / `Accept-Language` / `x-gather-region` | CN → OSS URLs, else R2 |

### CN + intl speed (implemented)

1. Upload with `STORAGE_DRIVER=dual` writes **full + thumb** to R2 and OSS in parallel.
2. Album GET rewrites `url` / `thumbUrl` to the nearer edge.
3. Override for debug: header `x-gather-region: cn|intl`.

### Pin modes (implemented)

Cycle: **none → front（开头）→ center（中心大图）→ none**.
Center pins render in a featured hero band above the masonry grid.

---

## 7. Data model / 数据模型

- `Album`: id, slug, title, adminSecretHash, expiresAt, uploadLocked, photoCount, createdAt  
- `Photo`: id, albumId, key, thumbKey, width, height, uploaderName, pinned, pinnedAt, likeCount, createdAt  
- `Like`: id, photoId, visitorKey (unique pair)  
- `Comment`: id, photoId, authorName, body, createdAt  

Soft-delete photos; hard-delete storage on purge.

---

## 8. URL map / 路由

| Path | Purpose |
|------|---------|
| `/` | Create landing (brand hero) |
| `/a/[slug]` | Album wall |
| `/a/[slug]/admin` | Unlock admin |
| `/api/...` | REST for albums/photos/likes/comments |

---

## 9. Upload pipeline / 上传链路

Vercel Functions reject request bodies over **4.5 MB**, so raw phone photos
(3–8 MB each, several at a time) cannot be posted to the server directly.

```mermaid
flowchart LR
  pick[PickPhotos] --> decode[BrowserDecode]
  decode --> scale[CanvasDownscale]
  scale --> pair[FullPlusThumbJPEG]
  pair --> one[OneRequestPerPhoto]
  one --> store[StorageDriver]
  store --> db[(PhotoRow)]
```

1. The browser decodes each file — this also converts iPhone **HEIC**, which
   server-side sharp cannot read without libheif.
2. Canvas downscales to a **2400px** full and **1200px** thumb, re-encoding at
   lower quality until each fits the **3 MB** budget.
3. Each photo uploads in **its own request**, so every body stays well under
   the 4.5 MB limit regardless of how many photos were selected.
4. The server stores the prepared pair as-is; no re-encode, minimal function CPU.

If the browser cannot decode a file, the server falls back to sharp, but only
for originals small enough to fit one request.

## 10. Limits & abuse / 限额

- **20 files / batch** (uploaded one per request), **500 / album**
- Originals up to 40 MB are accepted because the browser downscales first
- Comment rate: soft limit per nickname per photo
- Expired albums: uploads 410; purge 7 days after expiry

### Lifetime / 生命周期

Every upload rolls `expiresAt` forward to 30 days out, so an event people are
still adding to never dies mid-use. An album only expires once nobody has
uploaded for a full 30 days; 7 days later the daily cron deletes its photos
from storage and drops the row.

```mermaid
flowchart LR
  upload[NewUpload] --> renew["expiresAt = now + 30d"]
  renew --> quiet[NoUploads30d]
  quiet --> expired[ReadOnly]
  expired --> grace[Plus7Days]
  grace --> purge[PhotosDeleted]
```

`/api/cron/purge` runs daily at 04:00 UTC. It accepts the Vercel scheduler
directly, so auto-deletion works even before `CRON_SECRET` is configured;
anonymous public calls are still rejected.

---

## 11. Brand / UI notes

- Product name **Gather** with Chinese **共影** as secondary mark  
- First viewport: brand + one line + one CTA (create) — not a dashboard  
- Atmosphere: soft paper gradient + real photo collage plane (not flat white)  
- Fonts: expressive display + clean body (not Inter/Roboto/system-only)  
- Motions: hero fade/rise, grid stagger, pin spring  

---

## 12. Deploy checklist

1. New Vercel project, Root Directory = `album`  
2. Env: `DATABASE_URL`, `ADMIN_COOKIE_SECRET`, optional `BLOB_READ_WRITE_TOKEN` / R2 keys  
3. DNSPod CNAME `album` → `cname.vercel-dns.com`  
4. Link from aileena.xyz footer / works when ready  

---

## 13. Success metrics (soft)

- Time-to-first-upload &lt; 60s after create  
- Guest upload success rate on mobile Safari / WeChat in-app browser  
- p95 thumb load &lt; 1.5s on decent CN/intl mobile networks (Phase 2 CDN)  
