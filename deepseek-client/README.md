# DeepSeek Client

Node CLI for the official DeepSeek HTTP API.

You buy a key on [platform.deepseek.com](https://platform.deepseek.com). This client sends chat requests to `https://api.deepseek.com`. DeepSeek bills that key.

**Usage:** [USAGE.md](USAGE.md) — or run `node src/cli.mjs how`

## Quick start

```bash
cp .env.example .env
# set DEEPSEEK_API_KEY=sk-the-key-you-bought
node src/cli.mjs check
node src/cli.mjs chat "Hello from my DeepSeek key"
node src/cli.mjs chat
```

Need Node 22+. No `npm install`.

| Command | What it does |
| --- | --- |
| `node src/cli.mjs how` | Print usage |
| `node src/cli.mjs check` | Confirm the key loaded |
| `node src/cli.mjs chat "…"` | One message |
| `node src/cli.mjs chat` | Interactive (`/exit` to quit) |
| `node src/cli.mjs chat --stream "…"` | Stream tokens |
| `node src/cli.mjs balance` | DeepSeek wallet |
| `node src/cli.mjs models` | List models |
| `npm test` | Local tests (no live key) |

Default model: `deepseek-v4-flash`. Optional: `--model deepseek-v4-pro`, `--thinking`.

API docs: [api-docs.deepseek.com](https://api-docs.deepseek.com)
