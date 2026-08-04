#!/usr/bin/env bash
# Smart stage: Downloads/cursor_shanghai_07192026 → takes/ + photos/
#
# DJI-aware rules:
#   - unzip any *.zip (photos often inside DJI00.zip)
#   - filename 延时/timelapse → takes/timelapse/
#   - else latest DJI_YYYYMMDDHHMMSS_*.MP4 → takes/timelapse/  (「最后延时」)
#   - all stills → photos/girls/  (本场默认多放女孩子；场地图可再挪回 photos/)
#   - other videos → takes/
#
# From aileena-new/:
#   bash scripts/video-edit/stage-media.sh
#   bash scripts/video-edit/stage-media.sh --go
#   bash scripts/video-edit/stage-media.sh --go --render
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
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
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
  echo "找不到素材夹: ~/Downloads/${EVENT}"
  exit 1
fi

mkdir -p "$VE/takes/timelapse" "$VE/photos/girls" "$VE/takes" "$VE/photos"

TMP="${TMPDIR:-/tmp}/stage-cafe-$$"
EXTRACT="$TMP/extract"
mkdir -p "$TMP" "$EXTRACT"
: >"$TMP/all.txt"

# Unzip archives so we pick up stills inside DJI00.zip etc.
while IFS= read -r z; do
  [[ -z "$z" ]] && continue
  echo "unzip: $(basename "$z")"
  unzip -o -q "$z" -d "$EXTRACT" 2>/dev/null || true
done < <(find "$SRC" -maxdepth 2 -type f \( -iname '*.zip' -o -iname '*.ZIP' \) 2>/dev/null | sort)

find "$SRC" "$EXTRACT" -type f \( \
  -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' -o \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.heif' -o \
  -iname '*.webp' -o -iname '*.tif' -o -iname '*.tiff' -o -iname '*.dng' \
\) 2>/dev/null | sort -u >"$TMP/all.txt" || true

TOTAL=$(grep -c . "$TMP/all.txt" 2>/dev/null | head -1 | tr -d ' ')
TOTAL=${TOTAL:-0}

# Pick latest DJI timestamp as final timelapse (unless a named 延时 exists)
LATEST_DJI=""
LATEST_TS=0
NAMED_TL=""
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  base="$(basename "$f")"
  low="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
  if ! printf '%s' "$low" | grep -Eq '\.(mp4|mov|m4v|webm|mkv)$'; then
    continue
  fi
  if printf '%s' "$base$low" | grep -Eiq '延时|延時|timelapse|time[-_ ]?lapse|hyperlapse'; then
    NAMED_TL="$f"
  fi
  # DJI_20260719100954_0034_D.MP4
  if [[ "$base" =~ DJI_([0-9]{14})_ ]]; then
    ts="${BASH_REMATCH[1]}"
    if [[ "$ts" -gt "$LATEST_TS" ]]; then
      LATEST_TS="$ts"
      LATEST_DJI="$f"
    fi
  fi
done <"$TMP/all.txt"

TIMELAPSE_SRC="${NAMED_TL:-$LATEST_DJI}"

echo "=== Stage Cafe Cursor media (smart DJI) ==="
echo "src:  $SRC"
echo "dest: $VE"
echo "files found: $TOTAL"
echo "mode: $([[ $DO_COPY -eq 1 ]] && echo COPY || echo DRY-RUN)"
echo ""
if [[ -n "$TIMELAPSE_SRC" ]]; then
  echo "最后延时 → $(basename "$TIMELAPSE_SRC")"
  if [[ -n "$NAMED_TL" ]]; then
    echo "  (文件名含延时/timelapse)"
  else
    echo "  (智能：DJI 时间戳最新的一条)"
  fi
else
  echo "⚠️  没找到延时候选"
fi
echo "照片默认进 photos/girls/（本场多放女孩子）"
echo ""

place() {
  local file="$1"
  local dest="$2"
  local base
  base="$(basename "$file")"
  if [[ -e "$dest/$base" ]]; then
    local stem ext
    stem="${base%.*}"
    ext="${base##*.}"
    dest_file="$dest/${stem}-$(date +%s).${ext}"
  else
    dest_file="$dest/$base"
  fi
  if [[ $DO_COPY -eq 0 ]]; then
    echo "  [dry] $base"
    echo "     → $dest_file"
    return
  fi
  if [[ $DO_MOVE -eq 1 && "$file" == "$SRC"* ]]; then
    mv "$file" "$dest_file"
    echo "  moved  $base"
  else
    cp "$file" "$dest_file"
    echo "  copied $base"
  fi
}

echo "-- videos --"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  base="$(basename "$f")"
  low="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
  if ! printf '%s' "$low" | grep -Eq '\.(mp4|mov|m4v|webm|mkv)$'; then
    continue
  fi
  if [[ -n "$TIMELAPSE_SRC" && "$f" == "$TIMELAPSE_SRC" ]]; then
    echo "TIMELAPSE  $base"
    place "$f" "$VE/takes/timelapse"
  else
    echo "video      $base"
    place "$f" "$VE/takes"
  fi
done <"$TMP/all.txt"

echo "-- photos (→ girls) --"
PHOTO_N=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  base="$(basename "$f")"
  low="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
  if ! printf '%s' "$low" | grep -Eq '\.(jpg|jpeg|png|heic|heif|webp|tif|tiff|dng)$'; then
    continue
  fi
  echo "GIRLS      $base"
  place "$f" "$VE/photos/girls"
  PHOTO_N=$((PHOTO_N + 1))
done <"$TMP/all.txt"

rm -rf "$TMP"

TL=$(find "$VE/takes/timelapse" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
GG=$(find "$VE/photos/girls" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
VV=$(find "$VE/takes" -maxdepth 1 -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "结果: timelapse=$TL  other_videos=$VV  girls_photos=$GG"

if [[ "$TL" -eq 0 ]]; then
  echo "⚠️  延时仍为空 —— 请手动把最后延时拖进:"
  echo "   $VE/takes/timelapse/"
fi

if [[ $DO_COPY -eq 0 ]]; then
  echo ""
  echo "下一步只跑:"
  echo "  bash scripts/video-edit/stage-media.sh --go"
  exit 0
fi

echo ""
echo "原 Downloads 先别删，等成片出来再删。"
echo "场地图若不该进 girls，可挪到: $VE/photos/"

if [[ $DO_RENDER -eq 1 ]]; then
  cd "$ROOT"
  pnpm video:recap
  open "$VE/out/cafe-cursor-shanghai-recap.mp4" 2>/dev/null || true
fi
