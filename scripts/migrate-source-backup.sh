#!/usr/bin/env bash
# Copy git source (not the 300MB zip) to Cloudflare R2 via rclone.
# R2 rejects S3 CreateBucket — always pass --s3-no-check-bucket.
# Does not change DNS, Vercel, or delete aileena-new_rename.zip.
# tencent_cos is skipped: that remote is Tencent COS (needs bucket-appid), not this R2 bucket.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
SHA=$(git -C "$ROOT" rev-parse --short HEAD)
FILE="aileena-new-${SHA}.tar.gz"
TAR="/tmp/$FILE"
BUCKET="${AILEENA_R2_BUCKET:-aileena09062026}"
REMOTE="${AILEENA_R2_REMOTE:-cloudflare_r2}"

git -C "$ROOT" archive --format=tar.gz --prefix=aileena-new/ -o "$TAR" HEAD:aileena-new
echo "packed $TAR"
ls -lh "$TAR"

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone missing. On the Mac:"
  echo "  rclone copyto $TAR ${REMOTE}:${BUCKET}/backups/$FILE --s3-no-check-bucket"
  echo "live site stays https://www.aileena.xyz (Vercel)"
  exit 0
fi

echo "remotes:"
rclone listremotes

put() {
  local dest="$1"
  echo "rclone copyto -> $dest"
  rclone copyto "$TAR" "$dest" --s3-no-check-bucket
  rclone lsl "$(dirname "$dest")"
}

R2_OK=0
if put "${REMOTE}:${BUCKET}/backups/${FILE}"; then
  R2_OK=1
elif put "${REMOTE}:${BUCKET}/${FILE}"; then
  echo "uploaded at bucket root (backups/ prefix blocked)"
  R2_OK=1
fi

if [ "$R2_OK" -eq 0 ]; then
  echo "R2 upload failed. Token can list the zip but CreateBucket is denied."
  echo "retry: rclone copyto $TAR ${REMOTE}:${BUCKET}/backups/$FILE --s3-no-check-bucket"
  exit 1
fi

echo "ok. did not delete aileena-new_rename.zip"
echo "live site still Vercel https://www.aileena.xyz"
