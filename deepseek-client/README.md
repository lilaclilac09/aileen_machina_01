# DeepSeek BYOK client

Standalone Node client for the **official DeepSeek HTTP API**, using **your own** `DEEPSEEK_API_KEY`.

This is **not a Cursor IDE patch**. It does not modify Cursor, hide usage banners, or change Cursor account limits. It only sends OpenAI-compatible requests to `https://api.deepseek.com`.

## What “no app quota” means

This client does **not** add a daily message cap. You can call the API as often as your DeepSeek account allows.

DeepSeek still bills and rate-limits the key. If the platform balance is empty or the account is rate-limited, requests fail. That is expected.

Get a key: [https://platform.deepseek.com](https://platform.deepseek.com)  
API docs: [https://api-docs.deepseek.com](https://api-docs.deepseek.com)

## Setup

```bash
cd deepseek-client
cp .env.example .env
# paste DEEPSEEK_API_KEY=sk-...
node src/cli.mjs check
```

Requires Node 22+. No npm packages.

## Commands

```bash
node src/cli.mjs check                         # validate env, no network
node src/cli.mjs models                        # GET /models
node src/cli.mjs balance                       # GET /user/balance
node src/cli.mjs chat "Hello"                  # one-shot
node src/cli.mjs chat --stream "Hello"         # SSE stream
node src/cli.mjs chat --thinking --model deepseek-v4-pro "Hello"
node src/cli.mjs chat                          # interactive, /exit to quit
npm test                                       # mock + config tests (no live key)
```

## Models

| `DEEPSEEK_MODEL` | Notes |
| --- | --- |
| `deepseek-v4-flash` | default |
| `deepseek-v4-pro` | higher quality, higher price |

Optional thinking mode: `DEEPSEEK_THINKING=enabled` or `--thinking`.

## Own repo later

This folder is self-contained. Copy `deepseek-client/` into a new git repo if you want it separate from aileena.xyz. Do not commit `.env`.
