# aileena-computer

Owner-only small computer. Official package: [`@cloudflare/computer`](https://github.com/cloudflare/computer) **worker-shell** (just-bash). Not the Linux container. Not inside `aileena-new/`.

Spec: [`aileena-new/docs/CLOUDFLARE_COMPUTER.md`](../../aileena-new/docs/CLOUDFLARE_COMPUTER.md)

## Run local

```sh
cp .dev.vars.example .dev.vars
pnpm install
pnpm dev
# then from another shell:
COMPUTER_WORKER_SECRET=dev-aileena-computer-local pnpm smoke
```

Site (preview / localhost only):

```txt
COMPUTER_PROTOTYPE=1
COMPUTER_WORKER_URL=http://127.0.0.1:8787
COMPUTER_WORKER_SECRET=dev-aileena-computer-local
```

Do not set those on Vercel Production.

## Auth

Every `/c/*` route needs `Authorization: Bearer <COMPUTER_WORKER_SECRET>`.
The only workspace name is `owner`.
