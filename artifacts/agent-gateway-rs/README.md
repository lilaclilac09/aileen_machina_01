# agent gateway (Rust)

Loopback proxy. Listens on `127.0.0.1` only.

Upstream credentials are official API keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`. Leave a key empty when you do not have it. Clients send `Authorization: Bearer $GATEWAY_API_KEY`.

`claude*` is translated to `https://api.anthropic.com/v1/messages` and returned in the OpenAI chat shape, including SSE. Every other model is forwarded to `https://api.openai.com/v1/chat/completions`. Upstream 401, 429, and quota bodies are passed through.

Dashboard: `http://127.0.0.1:8787/`

```bash
cd artifacts/agent-gateway-rs
cp .env.example .env
# GATEWAY_API_KEY + OPENAI_API_KEY and/or ANTHROPIC_API_KEY
cargo run --release
```

Point clients at the gateway:

```text
OPENAI_BASE_URL=http://127.0.0.1:8787/v1
OPENAI_API_KEY=<GATEWAY_API_KEY>
```
