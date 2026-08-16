# DeepSeek Client

A small Node CLI for the official DeepSeek HTTP API. You use the API key you bought on [platform.deepseek.com](https://platform.deepseek.com). Requests go to `https://api.deepseek.com`. DeepSeek bills that key.

API docs: [api-docs.deepseek.com](https://api-docs.deepseek.com)

```bash
cd deepseek-client
node src/cli.mjs how
```

## How to use

### 1. Get a key

1. Sign in at [https://platform.deepseek.com](https://platform.deepseek.com).
2. Open API keys and create a key.
3. Top up the wallet if the balance is empty.
4. Copy the key. It looks like `sk-...`.

Need Node 22 or newer. No `npm install`.

### 2. Put the key in this folder

```bash
cd deepseek-client
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

Success:

```json
{
  "ok": true,
  "baseURL": "https://api.deepseek.com",
  "model": "deepseek-v4-flash",
  "apiKey": "set(…xxxx)"
}
```

`xxxx` is the last four characters of your key. If `ok` is false, the command prints How to use and exits `2`.

### 4. Send one message

```bash
node src/cli.mjs chat "Hello from my DeepSeek key"
```

The reply prints, then the process exits. DeepSeek bills the call.

### 5. Talk in a loop

```bash
node src/cli.mjs chat
```

```text
DeepSeek deepseek-v4-flash @ https://api.deepseek.com  key=set(…xxxx)
Using your purchased DeepSeek key. Type /exit to quit.
you> Hello
deepseek> ...
you> /exit
```

### 6. Stream tokens

```bash
node src/cli.mjs chat --stream "Write a haiku about tea"
```

### 7. Check wallet and models

```bash
node src/cli.mjs balance
node src/cli.mjs models
```

### 8. Pick a model

Default: `deepseek-v4-flash`.

```bash
node src/cli.mjs chat --model deepseek-v4-pro "Explain caches in one paragraph"
node src/cli.mjs chat --thinking --model deepseek-v4-pro "Why do CPUs have L1/L2/L3?"
```

Or in `.env`:

```bash
DEEPSEEK_MODEL=deepseek-v4-pro
DEEPSEEK_THINKING=enabled
```

### 9. npm shortcuts

```bash
npm run how
npm run check
npm run chat
npm run models
npm run balance
npm test
```

`npm test` uses a mock server. It does not need your key.

## Commands

| Command | What it does |
| --- | --- |
| `node src/cli.mjs how` | Print How to use |
| `node src/cli.mjs check` | Read `.env`, print model + masked key |
| `node src/cli.mjs models` | `GET /models` |
| `node src/cli.mjs balance` | `GET /user/balance` |
| `node src/cli.mjs chat "…"` | One-shot completion |
| `node src/cli.mjs chat --stream "…"` | Stream tokens |
| `node src/cli.mjs chat --thinking --model deepseek-v4-pro "…"` | Pro model + thinking |
| `node src/cli.mjs chat` | Interactive. `/exit` to quit |
| `npm test` | Local tests (no live key) |

## Models

| Model | Use |
| --- | --- |
| `deepseek-v4-flash` | Default. Fast and cheaper. |
| `deepseek-v4-pro` | Higher quality. Costs more. |

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
| `ok: false` on `check` | Follow the How to use block under the JSON |
| `401` / Authentication Fails | Wrong, revoked, or extra spaces in the key |
| billing / balance / quota from DeepSeek | Top up at [platform.deepseek.com](https://platform.deepseek.com) |
| `DEEPSEEK_MODEL must be one of` | Use `deepseek-v4-flash` or `deepseek-v4-pro` |

## Billing

DeepSeek bills the account that issued the key. An empty balance or a DeepSeek rate limit returns an API error. This client does not add its own daily cap.
