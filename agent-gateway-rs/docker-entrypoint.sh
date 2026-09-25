#!/bin/sh
set -eu
cd /app
if [ ! -f .env ]; then
  cp /app/.env.example .env 2>/dev/null || true
fi
if ! grep -q '^GATEWAY_BOOTSTRAP_KEY=' .env; then
  old=$(grep '^GATEWAY_API_KEY=' .env | head -1 | cut -d= -f2- || true)
  printf 'GATEWAY_BOOTSTRAP_KEY=%s\n' "$old" >> .env
fi
current=$(grep '^GATEWAY_BOOTSTRAP_KEY=' .env | head -1 | cut -d= -f2- || true)
fresh=0
if [ -z "$current" ] || [ "$current" = "sk-gateway-change-me" ]; then
  key="sk-gw-$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
  sed -i "s/^GATEWAY_BOOTSTRAP_KEY=.*/GATEWAY_BOOTSTRAP_KEY=${key}/" .env
  fresh=1
else
  key=$current
fi
token=$(grep '^DASHBOARD_TOKEN=' .env | head -1 | cut -d= -f2- || true)
if [ -z "$token" ]; then
  token="dash-$(od -An -N8 -tx1 /dev/urandom | tr -d ' \n')"
  if grep -q '^DASHBOARD_TOKEN=' .env; then
    sed -i "s/^DASHBOARD_TOKEN=.*/DASHBOARD_TOKEN=${token}/" .env
  else
    printf 'DASHBOARD_TOKEN=%s\n' "$token" >> .env
  fi
  fresh=1
fi
if [ "$fresh" = 1 ]; then
  echo "dashboard: http://127.0.0.1:${PORT:-8787}/?token=${token}"
  echo "agent:"
  echo "  OPENAI_BASE_URL=http://127.0.0.1:${PORT:-8787}/v1"
  echo "  OPENAI_API_KEY=${key}"
fi
set -a
. ./.env
set +a
echo "health: curl -s http://127.0.0.1:${PORT:-8787}/health"
exec agent-gateway
