# Test report

2026-09-25. Process `agent-gateway` on `127.0.0.1:8787`. `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` were empty. Gateway bearer was the default `sk-gateway-change-me`.

## Unit

`cargo test --offline` in `agent-gateway-rs`: 2 passed, 0 failed.

- `routes_and_masks`
- `anthropic_shape`

## Live HTTP

| Check | Result |
| --- | --- |
| `GET /health` | 200 `{"status":"ok"}` |
| `GET /v1/models` without bearer | 401 `missing or bad gateway key` |
| `GET /v1/models` wrong bearer | 401 `missing or bad gateway key` |
| `GET /v1/models` with gateway bearer | 200 `{"object":"list","data":[]}` |
| `POST /v1/chat/completions` `gpt-4o-mini` | 400 `OPENAI_API_KEY is missing` |
| `POST /v1/chat/completions` `claude-sonnet-4-6` stream | 400 `ANTHROPIC_API_KEY is missing` |
| `GET /` | 200 dashboard HTML |
| `GET /troubleshoot` | 200 help HTML |
| `GET /api/stats` | 200, `err` counted the missing-key calls, bind `127.0.0.1:8787` |
| listen address | `127.0.0.1:8787` only |

## Not run

No official key was present, so a real OpenAI or Anthropic 200, and a real 401/429 body from those hosts, were not observed.
