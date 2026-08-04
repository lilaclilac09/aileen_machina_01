# Cafe Cursor Shanghai — Cheap Cursor Edit

**不要上传。** 在 Mac 本地跑。素材夹：`cursor_shanghai_07192026`

剪辑也许粗糙，但规则已写死：
1. **必须用最后那条延时**（`takes/timelapse/`）
2. **尽量多放女孩子**（`photos/girls/`）
3. **色调**：默认去黄、提亮（可在 `project.json` → `output.grade` 调）

---

## 你现在该复制的（从零 / 已 clone）

```bash
# 进仓库（不是 ~ 家目录！）
cd ~/aileen_machina_01          # 若还没有：git clone https://github.com/lilaclilac09/aileen_machina_01.git
git fetch && git checkout cursor/cafe-recap-edit-8f58
cd aileena-new
pnpm install

# ① 先分拣到正确位置（预览）
bash scripts/video-edit/stage-media.sh

# ② 确认后：拷贝 + 剪
bash scripts/video-edit/stage-media.sh --go --render

open scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4
```

若自动没认出「女孩子」照片（文件名不含女/girl），**手动拖**：

```text
Finder 打开：
  ~/aileen_machina_01/aileena-new/scripts/video-edit/photos/girls/
把女孩子照片拖进去（越多越好）

延时一定要在：
  ~/aileen_machina_01/aileena-new/scripts/video-edit/takes/timelapse/
```

然后再：

```bash
cd ~/aileen_machina_01/aileena-new
pnpm video:recap
```

---

## 文件夹约定（放对位置）

| 放什么 | 路径 |
|--------|------|
| **最后延时（必须）** | `scripts/video-edit/takes/timelapse/` |
| **女孩子照片（尽量多）** | `scripts/video-edit/photos/girls/` |
| 其它视频 | `scripts/video-edit/takes/` |
| 其它照片 | `scripts/video-edit/photos/` |
| 成片 | `scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4` |

文件名带 `延时` / `timelapse` / `最后延时` 也会被自动分进 timelapse。

---

## 色调（去黄偏暗）

默认 grade（`project.json`）：

- 提亮 + 抬 gamma（不那么暗）
- shadows/midtones **减红/减黄**，加一点蓝

想再亮一点：把 `output.grade.brightness` 改成 `0.10`，`gamma` 改成 `1.15`，然后：

```bash
pnpm video:render && pnpm video:verify
```

---

## 成片结构

title → vibe → demos → product → **community(girls)** → **final timelapse** → outro

---

## 架构

见 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。引擎：`aileena-new/lib/video-edit/`。
