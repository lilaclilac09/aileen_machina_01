# Local AI gateway

一个本机入口，给多个 agent 共用。只监听 `127.0.0.1`。

上游只用官方 API key：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`。没配的供应商不会被调用。没有登录、OAuth、cookie、订阅账号或账号池。

`claude*` 和 `anthropic*` 转到 Anthropic Messages API，再改回 OpenAI chat 形状（含 SSE）。其他模型原样转到 OpenAI `/v1/chat/completions`。上游的 401、429 和配额错误原样返回。

## Run

```bash
cd artifacts/agent-gateway
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# GATEWAY_API_KEY，再加上 OPENAI_API_KEY 和/或 ANTHROPIC_API_KEY
.venv/bin/python app.py
```

## Agent config

```text
OPENAI_BASE_URL=http://127.0.0.1:8787/v1
OPENAI_API_KEY=<GATEWAY_API_KEY>
```

## curl

```bash
curl http://127.0.0.1:8787/health \
  -H "Authorization: Bearer sk-gateway-change-me"

curl http://127.0.0.1:8787/v1/models \
  -H "Authorization: Bearer sk-gateway-change-me"

curl http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer sk-gateway-change-me" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"ping"}]}'

curl -N http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer sk-gateway-change-me" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-5","stream":true,"messages":[{"role":"user","content":"ping"}]}'
```

面板：<http://127.0.0.1:8787/> ，每 2 秒拉 `/api/stats`。设了 `DASHBOARD_TOKEN` 时用 `/?token=<DASHBOARD_TOKEN>`。
