# DeepSeek Client

Use the DeepSeek API key you bought on [platform.deepseek.com](https://platform.deepseek.com).

This repo is a small Node CLI. It sends OpenAI-compatible chat requests to the official DeepSeek HTTP API at `https://api.deepseek.com`. You pay DeepSeek. This client does not add its own daily message cap.

Docs: [api-docs.deepseek.com](https://api-docs.deepseek.com)

Print the same steps in the terminal:

```bash
cd deepseek-client
node src/cli.mjs how
```

## How to use

### 1. Get a key

1. Open [https://platform.deepseek.com](https://platform.deepseek.com) and sign in.
2. Open API keys and create a key.
3. Top up the wallet if the balance is empty. DeepSeek bills this key.
4. Copy the key. It looks like `sk-...`. You will not see the full key again.

Need: Node 22 or newer. No `npm install`.

### 2. Put the key in this folder

```bash
cd deepseek-client
cp .env.example .env
```

Edit `.env` and replace the placeholder with the key you bought:

```bash
DEEPSEEK_API_KEY=sk-the-key-you-bought
```

Do not commit `.env`. Do not paste the key into chat or git.

### 3. Confirm the key loaded

```bash
node src/cli.mjs check
```

Success looks like:

```json
{
  "ok": true,
  "baseURL": "https://api.deepseek.com",
  "model": "deepseek-v4-flash",
  "apiKey": "set(…xxxx)"
}
```

`xxxx` is the last four characters of your key. If `ok` is false, the command prints these How to use steps and exits `2`.

### 4. Send one message

```bash
node src/cli.mjs chat "Hello from my DeepSeek key"
```

The model reply prints, then the process exits. That call is billed to your DeepSeek account.

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

`balance` is your DeepSeek wallet, not a limit in this repo.

### 8. Pick a model

Default is `deepseek-v4-flash` (faster, cheaper).

```bash
node src/cli.mjs chat --model deepseek-v4-pro "Explain caches in one paragraph"
node src/cli.mjs chat --thinking --model deepseek-v4-pro "Why do CPUs have L1/L2/L3?"
```

Or set them in `.env`:

```bash
DEEPSEEK_MODEL=deepseek-v4-pro
DEEPSEEK_THINKING=enabled
```

### 9. npm shortcuts

From `deepseek-client/`:

```bash
npm run check
npm run chat
npm run models
npm run balance
npm test
```

`npm test` uses a mock server. It does not need your key and does not call DeepSeek.

## Commands

| Command | What it does |
| --- | --- |
| `node src/cli.mjs how` | Print How to use |
| `node src/cli.mjs check` | Read `.env`, print model + masked key |
| `node src/cli.mjs models` | `GET /models` |
| `node src/cli.mjs balance` | `GET /user/balance` (your DeepSeek wallet) |
| `node src/cli.mjs chat "…"` | One-shot completion |
| `node src/cli.mjs chat --stream "…"` | Stream tokens |
| `node src/cli.mjs chat --thinking --model deepseek-v4-pro "…"` | Pro model + thinking |
| `node src/cli.mjs chat` | Interactive. `/exit` to quit |
| `npm test` | Local tests (mock server, no live key) |

## Models

| Model | Use |
| --- | --- |
| `deepseek-v4-flash` | Default. Fast and cheaper. |
| `deepseek-v4-pro` | Higher quality. Costs more on your DeepSeek bill. |

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
| `DEEPSEEK_API_KEY is missing` | `cp .env.example .env` and paste the key you bought |
| `ok: false` on `check` | Read the How to use block printed under the JSON |
| `401` / Authentication Fails | Key is wrong, revoked, or has extra spaces/quotes |
| billing / balance / quota from DeepSeek | Top up at [platform.deepseek.com](https://platform.deepseek.com) |
| `DEEPSEEK_MODEL must be one of` | Use `deepseek-v4-flash` or `deepseek-v4-pro` |

## Billing

Usage is billed to the DeepSeek account that issued the key. If balance is empty or DeepSeek rate-limits the key, the API returns an error. That is DeepSeek’s meter, not a limit in this repo.

## Extract later

`deepseek-client/` is self-contained. Copy the folder into its own git repo if you want it separate from aileena.xyz.
