# Usage

Work from this directory (the project root). You need Node 22+ and a DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com).

## 1. Create a key

1. Open https://platform.deepseek.com and sign in.
2. Go to **API keys** → **Create new API key**.
3. Copy the key (`sk-...`).
4. If the wallet is empty, add balance. DeepSeek bills this key.

## 2. Save the key

```bash
cp .env.example .env
```

Open `.env` and set:

```bash
DEEPSEEK_API_KEY=sk-the-key-you-bought
```

Do not commit `.env`.

## 3. Check the key loaded

```bash
node src/cli.mjs check
```

or:

```bash
npm run check
```

You want `"ok": true` and `apiKey` like `set(…xxxx)`.

If `ok` is false, the command prints these steps again.

## 4. Chat

One message:

```bash
node src/cli.mjs chat "Hello from my DeepSeek key"
```

Interactive (type `/exit` to quit):

```bash
node src/cli.mjs chat
```

Stream:

```bash
node src/cli.mjs chat --stream "Write a haiku about tea"
```

## 5. Wallet and models

```bash
node src/cli.mjs balance
node src/cli.mjs models
```

## 6. Optional flags

```bash
node src/cli.mjs chat --model deepseek-v4-pro "Explain caches"
node src/cli.mjs chat --thinking --model deepseek-v4-pro "Why do CPUs have L1 cache?"
```

| Flag | Meaning |
| --- | --- |
| `--stream` | Print tokens as they arrive |
| `--thinking` | Enable thinking mode |
| `--model deepseek-v4-flash` | Default model |
| `--model deepseek-v4-pro` | Higher quality, costs more |

Same options in `.env`: `DEEPSEEK_MODEL`, `DEEPSEEK_THINKING`.

## 7. Print this guide in the terminal

```bash
node src/cli.mjs how
npm start
```

## 8. Tests (no key, no network to DeepSeek)

```bash
npm test
```

## Common errors

| Message | Fix |
| --- | --- |
| `DEEPSEEK_API_KEY is missing` | `cp .env.example .env` and paste your key |
| `401` / Authentication Fails | Key is wrong, revoked, or has extra spaces |
| billing / balance / quota | Add balance at https://platform.deepseek.com |
| `DEEPSEEK_MODEL must be one of` | Use `deepseek-v4-flash` or `deepseek-v4-pro` |
