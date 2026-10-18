#!/usr/bin/env bash
# Print a deterministic Action-Id for an automation commit: <kind>-<24 hex>
# from the staged tree (same resulting content → same id; never from time or
# run id). Used as the `Action-Id:` commit trailer. See
# aileena-new/lib/agentRuntime/actions.ts for the runtime side.
set -euo pipefail
echo "${1:-auto}-$(git write-tree | cut -c1-24)"
