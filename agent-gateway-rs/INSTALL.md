# Install

AGENT-GATEWAY keeps OpenAI and Anthropic console keys on the operator's machine. Teammates receive `OPENAI_BASE_URL` and one `sk-gw-` key.

## Docker

```bash
git clone <repo> && cd agent-gateway-rs
cp .env.example .env
docker compose up -d
docker compose logs
```

The host port is `127.0.0.1:8787`. Inside the container the process listens on `0.0.0.0` so Docker can forward that port, and only after a gateway key exists (`ALLOW_LAN=1`). The published port stays on loopback.

```bash
curl -s http://127.0.0.1:8787/health
```

## install.sh

```bash
chmod +x install.sh
./install.sh
```

Rust release binary. Same first-boot print. Bind stays `127.0.0.1:8787`.

## Teammate

```text
OPENAI_BASE_URL=http://127.0.0.1:8787/v1
OPENAI_API_KEY=sk-gw-...
```

On a tailnet, set `HOST` to that IP or `0.0.0.0`, set `ALLOW_LAN=1`, and set `ALLOWLIST` to `100.64.0.0/10` or your `fd7a:115c:a1e0::/48`. An empty allowlist rejects every non-loopback address. There is no public register page.

## Egress

`claude*` and `anthropic*` go to Anthropic. Everything else goes to OpenAI. The process honors `HTTPS_PROXY`. `CONNECT_TIMEOUT` is 8 seconds. `READ_TIMEOUT` is 60 seconds.

Option A, gateway on a VPS, agent at home:

```bash
ssh -N -L 8787:127.0.0.1:8787 user@vps
```

Option B, gateway on this machine, proxy for upstream:

```bash
HTTPS_PROXY=http://127.0.0.1:7890
```

| Result | Meaning |
| --- | --- |
| 200 | Upstream accepted the official key |
| 401 from upstream | Official key rejected. Body is passed through |
| 429 | Upstream quota, or this gateway key's RPM / daily cap. `Retry-After` is set for the gateway cap |
| 20s+ or 502 | Egress. See `/troubleshoot` |
| 400 KEY not set | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is empty on the server |
| 401 bad gateway key | Bearer is missing, unknown, or revoked |

Probe:

```bash
curl -m 20 -sS -o /dev/null -w '%{http_code}\n' https://api.anthropic.com/v1/messages
```

## Revoke

Open `http://127.0.0.1:8787/keys?token=<DASHBOARD_TOKEN>` and press `REVOKE`. The hash stays in `keys.json` with `"revoked": true`. The next Bearer call is 401. The bootstrap key in `.env` is not revoked from the page. Change `GATEWAY_BOOTSTRAP_KEY` to rotate it.

## Checks

```bash
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/v1/models
curl -s http://127.0.0.1:8787/v1/models -H "Authorization: Bearer $GATEWAY_BOOTSTRAP_KEY"
```

The first models call is 401. The second is 200, or an empty list when no official key is set.
