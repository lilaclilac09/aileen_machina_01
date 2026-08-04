# Cafe Cursor Shanghai — 本机自动剪辑 / local auto-recap

**不要上传到云端。** 素材太大 → 全部留在你 Mac 上跑。  
**Do not upload.** Media stays local; render on your laptop.

Event: **Cafe Cursor Shanghai 20260719** · narrative: `EVENT.md`

---

## 本机 3 步 / Mac in 3 steps

### 0. 一次依赖

```bash
# ffmpeg（若 brew 磁盘不够，用 conda 或直接下 static build）
brew install ffmpeg
# 或: curl -L https://evermeet.cx/ffmpeg/getrelease/zip -o /tmp/ffmpeg.zip && unzip ...

cd /path/to/aileen_machina_01
git fetch origin
git checkout cursor/cafe-recap-edit-8f58
cd aileena-new
pnpm install
```

### 1. 把素材拷进来（本地路径，不上传）

```bash
# 视频 → takes/
cp ~/Movies/cafe-cursor/*.mp4 scripts/video-edit/takes/
cp ~/DCIM/*.MOV scripts/video-edit/takes/

# 照片 → photos/
cp ~/Pictures/cafe-cursor/*.jpg scripts/video-edit/photos/
cp ~/Pictures/cafe-cursor/*.HEIC scripts/video-edit/photos/
```

目录约定：

```text
scripts/video-edit/
  takes/     ← mp4 / mov / m4v
  photos/    ← jpg / png / heic / webp
  brand/     ← cursor-logo.svg 已有
```

`takes/`、`photos/`、`out/`、`work/` 已 gitignore，**不会进 git / 不会进 PR**。

### 2. 一键剪

```bash
cd aileena-new
pnpm video:recap
# 等价于: pnpm video:inventory && pnpm video:render

open scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4
open scripts/video-edit/edit-room.html   # 看 EDL / 复制调参 prompt
```

或：

```bash
bash scripts/video-edit/run-local.sh
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
| `run-local.sh` | One-shot Mac runner |

---

## 若 disk / brew 挂了

以前 brew 因磁盘失败时：不必装 yt-dlp。这个流水线**只要 ffmpeg + node/pnpm**。  
可用 [evermeet.cx/ffmpeg](https://evermeet.cx/ffmpeg/) 静态包，把 `ffmpeg` 放进 `PATH` 后再跑 `pnpm video:recap`。
