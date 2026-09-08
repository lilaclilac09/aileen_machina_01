#!/usr/bin/env bash
# Archive a home unzip of aileena-new that is not this git repo, add a zsh alias,
# and pack a source tarball for rclone. Does not delete Downloads zip or R2 objects.
set -euo pipefail

DRY=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    -h|--help)
      echo "usage: bash scripts/pin-local-dev.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "unknown arg: $arg"
      exit 1
      ;;
  esac
done

ROOT=$(git rev-parse --show-toplevel)
SITE="$ROOT/aileena-new"
SHA=$(git -C "$ROOT" rev-parse --short HEAD)
ZIP="${AILEENA_ZIP_DIR:-$HOME/aileena-new}"
ZSHRC="${AILEENA_ZSHRC:-$HOME/.zshrc}"
STAMP=$(date +%Y%m%d)
ARCHIVE="${AILEENA_ARCHIVE_DIR:-$HOME/aileena-new-OLD-ZIP-$STAMP}"

echo "pin local aileena-new"
echo "  repo=$ROOT"
echo "  site=$SITE"
echo "  sha=$SHA"
echo "  zip_candidate=$ZIP"

if [ ! -d "$SITE" ]; then
  echo "missing $SITE"
  exit 1
fi

if [ ! -e "$ZIP" ]; then
  echo "no unzip at $ZIP (ok)"
elif [ "$(cd "$ZIP" && pwd -P)" = "$(cd "$SITE" && pwd -P)" ]; then
  echo "skip move: $ZIP is this git site"
elif git -C "$ZIP" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "skip move: $ZIP is git ($(git -C "$ZIP" rev-parse --show-toplevel))"
else
  if [ -e "$ARCHIVE" ]; then
    ARCHIVE="${ARCHIVE}-$$"
  fi
  echo "archive unzip -> $ARCHIVE"
  if [ "$DRY" -eq 1 ]; then
    echo "dry-run: mv $ZIP $ARCHIVE"
  else
    mv "$ZIP" "$ARCHIVE"
    echo "moved"
  fi
fi

LINE="alias aileena-dev='cd \"$SITE\" && pnpm dev'"
echo "alias: $LINE"
if [ "$DRY" -eq 1 ]; then
  echo "dry-run: append to $ZSHRC"
elif [ -f "$ZSHRC" ] && grep -F "alias aileena-dev=" "$ZSHRC" >/dev/null 2>&1; then
  echo "alias already in $ZSHRC"
else
  printf '\n%s\n' "$LINE" >> "$ZSHRC"
  echo "wrote $ZSHRC"
fi

TAR="${AILEENA_TAR:-/tmp/aileena-new-${SHA}.tar.gz}"
if [ "$DRY" -eq 1 ]; then
  echo "dry-run: git archive -> $TAR"
else
  git -C "$ROOT" archive --format=tar.gz --prefix=aileena-new/ -o "$TAR" HEAD:aileena-new
  echo "source pack $TAR"
  ls -lh "$TAR"
fi
echo "rclone copyto (leave aileena-new_rename.zip in place):"
echo "  rclone copyto $TAR cloudflare_r2:aileena09062026/backups/$(basename "$TAR")"
echo "  rclone copyto $TAR tencent_cos:aileena09062026/backups/$(basename "$TAR")"
echo "next: source ~/.zshrc"
echo "then: aileena-dev"
echo "keep ~/Downloads/aileena-new.zip"
