#!/usr/bin/env bash
# Push Machina Dreaming output. Generated reports are not rebased.
#
# Cognition Agent Memory Repo (https://cognition.com/agent-memory-repo):
# when two writers hit the same generated file, git rejects the second push.
# That writer reads both sides, then writes one. For consolidate-report-*
# and latest-content.md that means: abort rebase, reset to origin/main,
# regenerate, commit, retry. Do not rebase generated files.
set -euo pipefail

REASON="${MEMORY_REASON:-manual}"
REMOTE="${MEMORY_REMOTE:-origin}"
BRANCH="${MEMORY_BRANCH:-main}"
REGENERATE_CMD="${MEMORY_REGENERATE_CMD:-cd aileena-new && pnpm sync:content-memory && pnpm dreaming && pnpm build:memory-index}"
MAX_ATTEMPTS="${MEMORY_PUSH_ATTEMPTS:-4}"

stage_memory() {
  local paths=(
    aileena-new/public/dj-set/setlist.json
    aileena-new/public/dj-set/assets/covers
    aileena-new/aileena_second_brain/memories/semantic
    aileena-new/aileena_second_brain/memories/episodic
    aileena-new/aileena_second_brain/memories/archived
    aileena-new/aileena_second_brain/prompts/music-taste.md
  )
  local p
  for p in "${paths[@]}"; do
    if [ -e "$p" ]; then
      git add -- "$p"
    fi
  done
}

commit_if_dirty() {
  if git diff --cached --quiet; then
    echo "No new dreaming report to commit"
    return 1
  fi
  git commit -m "chore(memory): sync latest content + Dreaming report [$(date -u +%Y-%m-%d)] (${REASON})"
  return 0
}

abort_rebase() {
  git rebase --abort >/dev/null 2>&1 || true
  git merge --abort >/dev/null 2>&1 || true
}

refresh_and_regenerate() {
  abort_rebase
  git fetch "$REMOTE" "$BRANCH"
  git reset --hard "${REMOTE}/${BRANCH}"
  echo "Regenerating Dreaming on latest ${REMOTE}/${BRANCH} (write one — do not rebase generated reports)"
  bash -c "${REGENERATE_CMD}"
}

git fetch "$REMOTE" "$BRANCH"
if [ "$(git rev-parse HEAD)" != "$(git rev-parse "${REMOTE}/${BRANCH}")" ]; then
  echo "${REMOTE}/${BRANCH} moved while Dreaming ran — regenerate on latest"
  refresh_and_regenerate
fi

stage_memory
if ! commit_if_dirty; then
  exit 0
fi

attempt=1
while [ "${attempt}" -le "${MAX_ATTEMPTS}" ]; do
  if git push "${REMOTE}" "HEAD:${BRANCH}"; then
    echo "Dreaming report pushed (attempt ${attempt})"
    exit 0
  fi
  echo "Push rejected (attempt ${attempt}) — abort rebase, read latest ${BRANCH}, write one regenerated report"
  if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
    break
  fi
  refresh_and_regenerate
  stage_memory
  if ! commit_if_dirty; then
    echo "Latest ${BRANCH} already has current Dreaming output"
    exit 0
  fi
  sleep $((attempt * 2))
  attempt=$((attempt + 1))
done

echo "::error::Failed to push Dreaming report after retries"
exit 1
