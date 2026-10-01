# Use

Two roles. Official keys stay on the operator's box. Callers only get a gateway key.

## Caller, 90 seconds

```text
OPENAI_BASE_URL=http://127.0.0.1:8787/v1
OPENAI_API_KEY=sk-gw-...
```

Ask for the host if you are not on that machine. Send one chat request. Stop.

## Cursor

Point the editor at the gateway. Paste the gateway key, not the console key. Same two lines as above.

## curl

```bash
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/v1/models \
  -H "Authorization: Bearer sk-gw-..."
curl -s http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer sk-gw-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"ping"}]}'
```

## When it fails

| Result | Meaning |
| --- | --- |
| 200 | Upstream accepted the official key |
| 401 upstream | Official key rejected. Body is passed through |
| 429 | Upstream quota, or this key's RPM / daily cap. Gateway cap sets Retry-After |
| 20s+ or 502 | Egress. See /troubleshoot on the gateway |
| 400 key missing | OPENAI_API_KEY or ANTHROPIC_API_KEY is empty on the server |
| 401 bad gateway key | Bearer missing, unknown, or revoked |

## Operator, first hour

1. `docker compose up -d` or `./install.sh`. Read the one-time dashboard token and bootstrap key.
2. Put official console keys in `.env`. Leave them off every laptop.
3. Open `/keys?token=…` and mint one teammate key. The secret is shown once.
4. Send only the two env lines. Confirm `/health` and `/v1/models`.
5. Revoke that test id. The same bearer must return 401.

## Teach-back

Before a caller gets a key, they answer:

- Where do the official keys live?
- Which two lines do you set?
- What happens when your key is revoked?
- What is this not?

On the server `.env`. `BASE_URL` plus `sk-gw-`. That bearer dies; console keys stay. Not Plus, not OAuth, not a public proxy.
