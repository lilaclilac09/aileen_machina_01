#!/usr/bin/env bash
# From ~/Downloads → video-edit takes/ + photos/ (local Mac only, no upload)
#
# Usage:
#   bash scripts/video-edit/from-downloads.sh                 # dry-run
#   bash scripts/video-edit/from-downloads.sh --go            # copy for real
#   bash scripts/video-edit/from-downloads.sh --go --render   # copy + cut
#   bash scripts/video-edit/from-downloads.sh --go --filter cafe
#   bash scripts/video-edit/from-downloads.sh --src ~/Downloads/CafeCursor --go
#   bash scripts/video-edit/from-downloads.sh --go --move     # move (saves disk)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VE="$ROOT/scripts/video-edit"
TAKES="$VE/takes"
PHOTOS="$VE/photos"

SRC="${HOME}/Downloads"
FILTER=""
DO_COPY=0
DO_RENDER=0
DO_MOVE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --go) DO_COPY=1; shift ;;
    --render) DO_RENDER=1; shift ;;
    --move) DO_MOVE=1; shift ;;
    --src) SRC="$2"; shift 2 ;;
    --filter) FILTER="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      exit 1
      ;;
  esac
done

# expand ~
case "$SRC" in
  "~"*) SRC="${HOME}${SRC:1}" ;;
esac

if [[ ! -d "$SRC" ]]; then
  echo "Source folder not found: $SRC"
  exit 1
fi

mkdir -p "$TAKES" "$PHOTOS"

TMPDIR_LIST="${TMPDIR:-/tmp}/cafe-media-$$"
mkdir -p "$TMPDIR_LIST"
VID_LIST="$TMPDIR_LIST/videos.txt"
IMG_LIST="$TMPDIR_LIST/photos.txt"
: >"$VID_LIST"
: >"$IMG_LIST"

# Collect (macOS bash 3.2 friendly — no mapfile)
if [[ -n "$FILTER" ]]; then
  find "$SRC" -type f \( \
    -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' \
  \) -iname "*${FILTER}*" 2>/dev/null | sort -u >"$VID_LIST" || true
  find "$SRC" -type f \( \
    -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o \
    -iname '*.heif' -o -iname '*.webp' -o -iname '*.tif' -o -iname '*.tiff' \
  \) -iname "*${FILTER}*" 2>/dev/null | sort -u >"$IMG_LIST" || true
else
  find "$SRC" -type f \( \
    -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' \
  \) 2>/dev/null | sort -u >"$VID_LIST" || true
  find "$SRC" -type f \( \
    -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o \
    -iname '*.heif' -o -iname '*.webp' -o -iname '*.tif' -o -iname '*.tiff' \
  \) 2>/dev/null | sort -u >"$IMG_LIST" || true
fi

VC=$(grep -c . "$VID_LIST" 2>/dev/null || echo 0)
IC=$(grep -c . "$IMG_LIST" 2>/dev/null || echo 0)
# grep -c on empty can print 0\n0 on some systems — normalize
VC=$(echo "$VC" | head -1 | tr -d ' ')
IC=$(echo "$IC" | head -1 | tr -d ' ')

MODE="DRY-RUN"
if [[ $DO_COPY -eq 1 ]]; then
  if [[ $DO_MOVE -eq 1 ]]; then MODE="MOVE"; else MODE="COPY"; fi
fi

echo "=== Cafe Cursor media import ==="
echo "src:     $SRC"
echo "filter:  ${FILTER:-"(all media)"}"
echo "videos → $TAKES  ($VC found)"
echo "photos → $PHOTOS ($IC found)"
echo "mode:    $MODE"
echo ""

if [[ "$VC" -eq 0 && "$IC" -eq 0 ]]; then
  rm -rf "$TMPDIR_LIST"
  echo "No matching files under $SRC"
  echo ""
  echo "Tips:"
  echo "  1) Confirm files are in Downloads (or a subfolder)"
  echo "  2) --src ~/Downloads/某个子文件夹 --go"
  echo "  3) Narrow: --filter cafe  / --filter 20260719 / --filter Cursor"
  exit 2
fi

stage() {
  local file="$1"
  local dest_dir="$2"
  local base dest stem ext
  base="$(basename "$file")"
  dest="$dest_dir/$base"
  if [[ -e "$dest" ]]; then
    stem="${base%.*}"
    ext="${base##*.}"
    dest="$dest_dir/${stem}-$(date +%s).${ext}"
  fi
  if [[ $DO_COPY -eq 0 ]]; then
    echo "  [dry] $file"
    echo "     → $dest"
  else
    if [[ $DO_MOVE -eq 1 ]]; then
      mv "$file" "$dest"
      echo "  moved  $base"
    else
      cp "$file" "$dest"
      echo "  copied $base"
    fi
  fi
}

echo "-- videos --"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  stage "$f" "$TAKES"
done <"$VID_LIST"

echo "-- photos --"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  stage "$f" "$PHOTOS"
done <"$IMG_LIST"

rm -rf "$TMPDIR_LIST"

if [[ $DO_COPY -eq 0 ]]; then
  echo ""
  echo "Looks good? Copy for real:"
  echo "  bash scripts/video-edit/from-downloads.sh --go${FILTER:+ --filter \"$FILTER\"}"
  echo "Copy + render:"
  echo "  bash scripts/video-edit/from-downloads.sh --go --render"
  exit 0
fi

TC=$(find "$TAKES" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
PC=$(find "$PHOTOS" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "Done. takes=$TC  photos=$PC"

if [[ $DO_RENDER -eq 1 ]]; then
  echo ""
  echo "→ rendering…"
  bash "$VE/run-local.sh"
fi
