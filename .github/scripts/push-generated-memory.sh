#!/usr/bin/env bash
# Push Machina Dreaming output. Generated reports are not rebased.
#
# Agent Memory Repo — https://github.com/AgentMemoryRepo/agentmemoryrepo
# README swarm rule: when two writers hit the same line, git rejects the
# second push, and that writer reads both versions before writing one.
# For consolidate-report-* / latest-content.md: abort rebase, keep ours,
# reset to origin/main (theirs), regenerate one report, commit, retry.
set -euo pipefail

REASON="${MEMORY_REASON:-manual}"
REMOTE="${MEMORY_REMOTE:-origin}"
BRANCH="${MEMORY_BRANCH:-main}"
REGENERATE_CMD="${MEMORY_REGENERATE_CMD:-cd aileena-new && pnpm sync:content-memory && pnpm dreaming && pnpm build:memory-index}"
MAX_ATTEMPTS="${MEMORY_PUSH_ATTEMPTS:-4}"

GENERATED_SIDES=(
  aileena-new/aileena_second_brain/memories/archived
  aileena-new/aileena_second_brain/memories/semantic/latest-content.md
  aileena-new/aileena_second_brain/memories/semantic/setlist.md
  aileena-new/aileena_second_brain/memories/episodic
)

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
  git commit -m "chore(memory): sync latest content + Dreaming report [$(date -u +%Y-%m-%d)] (${REASON})" -m "Action-Id: $(bash .github/scripts/action-id.sh memory)"
  return 0
}

abort_rebase() {
  git rebase --abort >/dev/null 2>&1 || true
  git merge --abort >/dev/null 2>&1 || true
}

save_side() {
  local dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest"
  local rel
  for rel in "${GENERATED_SIDES[@]}"; do
    if [ -e "$rel" ]; then
      mkdir -p "$dest/$(dirname "$rel")"
      cp -a "$rel" "$dest/$rel"
    fi
  done
}

# Spec: read both versions, then write one (do not rebase generated files).
read_both_then_write_one() {
  abort_rebase
  local sides="${MEMORY_SIDES:-$(mktemp -d)}"
  save_side "${sides}/ours"
  git fetch "$REMOTE" "$BRANCH"
  git reset --hard "${REMOTE}/${BRANCH}"
  save_side "${sides}/theirs"
  local ours_n theirs_n
  ours_n="$(find "${sides}/ours" -type f 2>/dev/null | wc -l | tr -d ' ')"
  theirs_n="$(find "${sides}/theirs" -type f 2>/dev/null | wc -l | tr -d ' ')"
  echo "Agent Memory Repo: read both versions (ours=${ours_n} files, theirs=${theirs_n} files) → write one"
  echo "Regenerating Dreaming on latest ${REMOTE}/${BRANCH} (write one — do not rebase generated reports)"
  bash -c "${REGENERATE_CMD}"
}

git fetch "$REMOTE" "$BRANCH"
if [ "$(git rev-parse HEAD)" != "$(git rev-parse "${REMOTE}/${BRANCH}")" ]; then
  echo "${REMOTE}/${BRANCH} moved while Dreaming ran — read both versions then write one"
  read_both_then_write_one
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
  echo "Push rejected (attempt ${attempt}) — Agent Memory Repo: read both versions then write one"
  if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
    break
  fi
  read_both_then_write_one
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
