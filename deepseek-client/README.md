# DeepSeek Client

Chat with DeepSeek using the API key you buy on [platform.deepseek.com](https://platform.deepseek.com).

This is a Node.js CLI. It sends OpenAI-compatible requests to the official DeepSeek HTTP API at `https://api.deepseek.com`. DeepSeek bills your key.

Requires Node 22+. No `npm install`.

API reference: [api-docs.deepseek.com](https://api-docs.deepseek.com)

Print these steps in a terminal: `node src/cli.mjs how`

## How to use

### 1. Get an API key

1. Sign in at https://platform.deepseek.com
2. Open **API keys** and create a key
3. Copy it (`sk-...`)
4. Add wallet balance if it is empty

### 2. Save the key

In this directory:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DEEPSEEK_API_KEY=sk-the-key-you-bought
```

Do not commit `.env`.

### 3. Confirm the key loaded

```bash
node src/cli.mjs check
```

Success looks like `"ok": true` and `apiKey": "set(…xxxx)"`.

If check fails, it prints this How to use section and exits with code `2`.

### 4. Chat

One message:

```bash
node src/cli.mjs chat "Hello from my DeepSeek key"
```

Interactive (type `/exit` to quit):

```bash
node src/cli.mjs chat
```

Stream tokens:

```bash
node src/cli.mjs chat --stream "Write a haiku about tea"
```

### 5. Wallet and models

```bash
node src/cli.mjs balance
node src/cli.mjs models
```

### 6. Model flags

Default model is `deepseek-v4-flash`.

```bash
node src/cli.mjs chat --model deepseek-v4-pro "Explain caches"
node src/cli.mjs chat --thinking --model deepseek-v4-pro "Why do CPUs have L1 cache?"
```

| Flag | Meaning |
| --- | --- |
| `--stream` | Print tokens as they arrive |
| `--thinking` | Enable thinking mode |
| `--model deepseek-v4-flash` | Default, faster, cheaper |
| `--model deepseek-v4-pro` | Higher quality, costs more |

Same options in `.env`: `DEEPSEEK_MODEL`, `DEEPSEEK_THINKING`.

### 7. npm scripts

```bash
npm start          # print How to use
npm run check
npm run chat
npm run models
npm run balance
npm test           # mock tests, no live key
```

## Commands

| Command | What it does |
| --- | --- |
| `node src/cli.mjs how` | Print How to use |
| `node src/cli.mjs check` | Read `.env`, print masked key |
| `node src/cli.mjs chat "…"` | One completion |
| `node src/cli.mjs chat` | Interactive loop |
| `node src/cli.mjs chat --stream "…"` | Stream tokens |
| `node src/cli.mjs balance` | `GET /user/balance` |
| `node src/cli.mjs models` | `GET /models` |

## Environment

| Variable | Required | Default |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | yes | — |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | no | `deepseek-v4-flash` |
| `DEEPSEEK_THINKING` | no | `disabled` |

## If something fails

| What you see | What to do |
| --- | --- |
| `DEEPSEEK_API_KEY is missing` | `cp .env.example .env` and paste your key |
| `401` / Authentication Fails | Key is wrong, revoked, or has extra spaces |
| billing / balance / quota | Add balance at https://platform.deepseek.com |
| `DEEPSEEK_MODEL must be one of` | Use `deepseek-v4-flash` or `deepseek-v4-pro` |

DeepSeek bills the account that issued the key. This client does not add its own daily cap.
