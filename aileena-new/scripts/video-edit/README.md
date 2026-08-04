# Cafe Cursor Shanghai — 本机自动剪辑 / local auto-recap

**不要上传到云端。** 素材太大 → 全部留在你 Mac 上跑。  
**Do not upload.** Media stays local; render on your laptop.

Event: **Cafe Cursor Shanghai 20260719** · narrative: `EVENT.md`

---

## 本机步骤 / Mac steps（素材在 Downloads）

### 0. 拉代码 + 依赖（一次）

```bash
cd /path/to/aileen_machina_01   # 你的本地 clone
git fetch origin
git checkout cursor/cafe-recap-edit-8f58
cd aileena-new
pnpm install
# 需要 ffmpeg：brew install ffmpeg
```

### 1. 从 Downloads 自动分拣（推荐）

脚本会扫 `~/Downloads`，视频 → `takes/`，照片 → `photos/`。

```bash
cd aileena-new

# 先预览（不拷贝）——看会选中哪些文件
bash scripts/video-edit/from-downloads.sh

# 确认后真正拷贝
bash scripts/video-edit/from-downloads.sh --go

# 拷贝并直接剪成片
bash scripts/video-edit/from-downloads.sh --go --render
```

常用选项：

```bash
# 只拿文件名含 cafe / Cursor / 日期的
bash scripts/video-edit/from-downloads.sh --filter cafe --go

# Downloads 里某个子文件夹
bash scripts/video-edit/from-downloads.sh --src ~/Downloads/CafeCursor --go --render

# 磁盘紧：用 --move 搬走（不是复制）
bash scripts/video-edit/from-downloads.sh --go --move --render
```

### 1b. 手动拖 / 手动 cp

| 文件类型 | 放到这里 |
|----------|----------|
| 视频 `.mp4` `.mov` `.m4v` | `aileena-new/scripts/video-edit/takes/` |
| 照片 `.jpg` `.png` `.heic` `.webp` | `aileena-new/scripts/video-edit/photos/` |

```bash
# 手动示例
cp ~/Downloads/*.mp4  scripts/video-edit/takes/
cp ~/Downloads/*.MOV  scripts/video-edit/takes/
cp ~/Downloads/*.jpg  scripts/video-edit/photos/
cp ~/Downloads/*.HEIC scripts/video-edit/photos/
```

Finder：打开两个窗口，把文件拖进上面两个文件夹即可。

```text
scripts/video-edit/
  takes/     ← 视频
  photos/    ← 照片
  brand/     ← logo 已有
  out/       ← 成片输出（自动生成）
```

`takes/` / `photos/` / `out/` / `work/` 已 gitignore，**不会进 git**。

### 2. 剪辑（若第 1 步没用 --render）

```bash
cd aileena-new
pnpm video:recap
# 或: bash scripts/video-edit/run-local.sh

open scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4
open scripts/video-edit/edit-room.html
```

成片：`scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4`（1080p）。

---

## Recap spine（活动总结逻辑）

| Beat | Target | Show | Why |
|------|--------|------|-----|
| 1 · Logo | 2.5s | Cursor logo + title | Brand first |
| 2 · Vibe | 8–12s | Venue / rain / queue | Place |
| 3 · Guests | 12–20s | Demos / screens | Guest-led |
| 4 · Product | 8–12s | Redeem / phones | Soft credits only |
| 5 · Community | 8–12s | Group / volunteers | Aftercare |
| 6 · Outro | 4s | Logo + `#CafeCursorShanghai` | Brand last |

- Photos → ~3.2s Ken-Burns  
- Videos → mid-window 4–8s cut  
- No “credit swap” public copy  

---

## Files

| File | Role |
|------|------|
| `EVENT.md` | Soft copy / Ben wrap-up |
| `script.md` | On-screen beats |
| `inventory.ts` | Scan → `work/final-edit.json` |
| `render-recap.ts` | ffmpeg EDL → mp4 |
| `edit-room.html` | Control room UI |
| `from-downloads.sh` | Scan Downloads → takes/photos |
| `run-local.sh` | One-shot inventory + render |

---

## 若 disk / brew 挂了

以前 brew 因磁盘失败时：不必装 yt-dlp。这个流水线**只要 ffmpeg + node/pnpm**。  
可用 [evermeet.cx/ffmpeg](https://evermeet.cx/ffmpeg/) 静态包，把 `ffmpeg` 放进 `PATH` 后再跑 `pnpm video:recap`。
