#!/usr/bin/env bash
# Stage media from ~/Downloads/cursor_shanghai_07192026 into the RIGHT folders.
#
#   takes/timelapse/   ← 最后那条延时（必须）
#   photos/girls/      ← 女孩子照片（尽量多）
#   takes/             ← 其它视频
#   photos/            ← 其它照片
#
# Usage (from aileena-new/):
#   bash scripts/video-edit/stage-media.sh                 # dry-run
#   bash scripts/video-edit/stage-media.sh --go            # copy
#   bash scripts/video-edit/stage-media.sh --go --render   # copy + cut
#   bash scripts/video-edit/stage-media.sh --src ~/Downloads/cursor_shanghai_07192026 --go
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VE="$ROOT/scripts/video-edit"
EVENT="cursor_shanghai_07192026"

SRC=""
DO_COPY=0
DO_RENDER=0
DO_MOVE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --go) DO_COPY=1; shift ;;
    --render) DO_RENDER=1; shift ;;
    --move) DO_MOVE=1; shift ;;
    --src) SRC="$2"; shift 2 ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

case "${SRC}" in "~"*) SRC="${HOME}${SRC:1}" ;; esac

if [[ -z "$SRC" ]]; then
  for c in \
    "${HOME}/Downloads/${EVENT}" \
    "${HOME}/Desktop/${EVENT}" \
    "${HOME}/Documents/${EVENT}" \
    "${HOME}/${EVENT}"
  do
    [[ -d "$c" ]] && SRC="$c" && break
  done
fi

if [[ -z "${SRC:-}" || ! -d "$SRC" ]]; then
  echo "找不到素材夹。请确认："
  echo "  ~/Downloads/${EVENT}"
  echo "或: --src /完整路径/${EVENT}"
  exit 1
fi

mkdir -p "$VE/takes/timelapse" "$VE/photos/girls" "$VE/takes" "$VE/photos"

TMP="${TMPDIR:-/tmp}/stage-cafe-$$"
mkdir -p "$TMP"
: >"$TMP/all.txt"
find "$SRC" -type f \( \
  -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' -o \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.heif' -o \
  -iname '*.webp' -o -iname '*.tif' -o -iname '*.tiff' \
\) 2>/dev/null | sort -u >"$TMP/all.txt" || true

TOTAL=$(grep -c . "$TMP/all.txt" 2>/dev/null | head -1 | tr -d ' ')
TOTAL=${TOTAL:-0}

echo "=== Stage Cafe Cursor media ==="
echo "src:  $SRC"
echo "dest: $VE"
echo "files found: $TOTAL"
echo "mode: $([[ $DO_COPY -eq 1 ]] && echo COPY || echo DRY-RUN)"
echo ""
echo "规则："
echo "  1) 文件名含 延时/timelapse/最后延时 → takes/timelapse/  （成片结尾必用）"
echo "  2) 文件名含 女/女孩/girl 或你手动归类 → photos/girls/"
echo "  3) 其它视频 → takes/   其它照片 → photos/"
echo ""

classify() {
  local f="$1" base low dest
  base="$(basename "$f")"
  low="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"

  # video?
  if printf '%s' "$low" | grep -Eq '\.(mp4|mov|m4v|webm|mkv)$'; then
    if printf '%s' "$base$low" | grep -Eiq '延时|延時|timelapse|time[-_ ]?lapse|hyperlapse|最后.*延|延.*最后|final.*lapse|lapse.*final'; then
      dest="$VE/takes/timelapse/$base"
      echo "TIMELAPSE  $base"
    else
      dest="$VE/takes/$base"
      echo "video      $base"
    fi
  else
    # photo — user should put girls in photos/girls; auto-tag by name
    if printf '%s' "$base$low" | grep -Eiq '女|女孩|女生|姑娘|小姐姐|姐妹|girl|women|woman|lady|ladies|female'; then
      dest="$VE/photos/girls/$base"
      echo "GIRLS      $base"
    else
      dest="$VE/photos/$base"
      echo "photo      $base"
    fi
  fi

  if [[ $DO_COPY -eq 0 ]]; then
    echo "         → $dest"
    return
  fi

  if [[ -e "$dest" ]]; then
    local stem ext
    stem="${base%.*}"
    ext="${base##*.}"
    dest="$(dirname "$dest")/${stem}-$(date +%s).${ext}"
  fi
  if [[ $DO_MOVE -eq 1 ]]; then
    mv "$f" "$dest"
  else
    cp "$f" "$dest"
  fi
}

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  classify "$f"
done <"$TMP/all.txt"

rm -rf "$TMP"

TL=$(find "$VE/takes/timelapse" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
GG=$(find "$VE/photos/girls" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "timelapse folder: $TL file(s)   girls folder: $GG file(s)"

if [[ "$TL" -eq 0 ]]; then
  echo ""
  echo "⚠️  还没有延时文件！请把「最后那条延时」放进："
  echo "   $VE/takes/timelapse/"
  echo "   或文件名带：延时 / 最后延时 / timelapse"
fi

if [[ $DO_COPY -eq 0 ]]; then
  echo ""
  echo "确认后执行："
  echo "  bash scripts/video-edit/stage-media.sh --go --render"
  exit 0
fi

# Manual reminder: girls photos without keyword still need hand-drop
echo ""
echo "女孩子照片如果文件名没有「女/girl」——请手动拖进："
echo "  $VE/photos/girls/"
echo ""

if [[ $DO_RENDER -eq 1 ]]; then
  cd "$ROOT"
  pnpm video:recap
  open "$VE/out/cafe-cursor-shanghai-recap.mp4" 2>/dev/null || true
fi
