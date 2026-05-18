#!/usr/bin/env bash
# dev.sh — run all local projects concurrently
# Usage: ./dev.sh [portfolio|all|pamm|tamagochi]
set -euo pipefail

PORTFOLIO_DIR="$(cd "$(dirname "$0")" && pwd)"
PAMM_DIR="/Users/aileen/pamm-a/pinocchio-prop-amm/bot"
TAMAGOCHI_DIR="/Users/aileen/tamagochi"

_kill_children() {
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap _kill_children EXIT INT TERM

MODE="${1:-all}"

_header() { echo -e "\033[0;36m[dev.sh] $*\033[0m"; }

start_portfolio() {
  _header "portfolio → http://localhost:3000"
  cd "$PORTFOLIO_DIR"
  NEXT_TURBOPACK=0 npm run dev 2>&1 | sed 's/^/\033[0;36m[portfolio]\033[0m /' &
}

start_pamm_dashboard() {
  _header "prop-amm dashboard → http://localhost:8080"
  # Serve the static PMM Bot dashboard on port 8080
  cd "$PAMM_DIR"
  python3 -m http.server 8080 2>&1 | sed 's/^/\033[0;33m[pamm-dash]\033[0m /' &
}

start_tamagochi() {
  _header "tamagochi → electron desktop app"
  cd "$TAMAGOCHI_DIR"
  npm start 2>&1 | sed 's/^/\033[0;35m[tamagochi]\033[0m /' &
}

case "$MODE" in
  portfolio)
    start_portfolio
    ;;
  pamm)
    start_pamm_dashboard
    ;;
  tamagochi)
    start_tamagochi
    ;;
  all|*)
    start_portfolio
    start_pamm_dashboard
    # tamagochi is desktop-only — start separately with: ./dev.sh tamagochi
    _header "tamagochi skipped (desktop Electron — run: ./dev.sh tamagochi)"
    ;;
esac

_header "all services started. ctrl-c to stop."
wait
