# AGENT-GATEWAY

Official keys stay on your box. Agents and teammates only get a gateway key.

```bash
git clone <repo> && cd agent-gateway-rs
cp .env.example .env
docker compose up -d
```

`cp .env.example .env` is optional. The first boot writes `GATEWAY_BOOTSTRAP_KEY` and `DASHBOARD_TOKEN` into `.env` and prints them once:

```text
dashboard: http://127.0.0.1:8787/?token=...
agent:
  OPENAI_BASE_URL=http://127.0.0.1:8787/v1
  OPENAI_API_KEY=sk-gw-...
```

Give a teammate only those two `OPENAI_*` lines. Mint more keys at `/keys`. Revoke turns that bearer off immediately. Official `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` never leave the server.

Without Docker: `./install.sh`. Full steps, Tailscale, and egress: [INSTALL.md](INSTALL.md).

This is not a subscription forwarder. No OAuth, no account pool, no billing.
