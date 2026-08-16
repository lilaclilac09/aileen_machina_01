# DeepSeek Client

Use the DeepSeek API key you bought on [platform.deepseek.com](https://platform.deepseek.com).

This repo is a small Node CLI. It sends OpenAI-compatible chat requests to the official DeepSeek HTTP API at `https://api.deepseek.com`. You pay DeepSeek. This client does not add its own daily message cap.

Docs: [api-docs.deepseek.com](https://api-docs.deepseek.com)

## Quick start

1. Buy or top up a key at [platform.deepseek.com](https://platform.deepseek.com).
2. Requires Node 22+. No `npm install`.

```bash
cd deepseek-client
cp .env.example .env
```

3. Put your purchased key in `.env`:

```bash
DEEPSEEK_API_KEY=sk-the-key-you-bought
```

4. Confirm the key loaded (no network):

```bash
node src/cli.mjs check
```

5. Chat:

```bash
node src/cli.mjs chat "Hello from my DeepSeek key"
node src/cli.mjs chat --stream "Write a haiku about tea"
node src/cli.mjs chat
```

Type `/exit` to leave the interactive session.

## Commands

| Command | What it does |
| --- | --- |
| `node src/cli.mjs check` | Read `.env`, print model + masked key |
| `node src/cli.mjs models` | `GET /models` |
| `node src/cli.mjs balance` | `GET /user/balance` (your DeepSeek wallet) |
| `node src/cli.mjs chat "…"` | One-shot completion |
| `node src/cli.mjs chat --stream "…"` | Stream tokens |
| `node src/cli.mjs chat --thinking --model deepseek-v4-pro "…"` | Pro model + thinking |
| `npm test` | Local tests (mock server, no live key) |

Same commands via npm: `npm run check`, `npm run chat`, `npm run models`, `npm run balance`.

## Models

Set `DEEPSEEK_MODEL` in `.env` or pass `--model`.

| Model | Use |
| --- | --- |
| `deepseek-v4-flash` | Default. Fast and cheaper. |
| `deepseek-v4-pro` | Higher quality. Costs more on your DeepSeek bill. |

Thinking mode: `DEEPSEEK_THINKING=enabled` or `--thinking`.

## Environment

| Variable | Required | Default |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | yes | — |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | no | `deepseek-v4-flash` |
| `DEEPSEEK_THINKING` | no | `disabled` |

Never commit `.env`. The example file is `.env.example`.

## Billing

Usage is billed to the DeepSeek account that issued the key. If balance is empty or DeepSeek rate-limits the key, the API returns an error. That is DeepSeek’s meter, not a limit in this repo.

## Extract later

`deepseek-client/` is self-contained. Copy the folder into its own git repo if you want it separate from aileena.xyz.
