# aileena-computer

Owner-only small computer. Official package: [`@cloudflare/computer`](https://github.com/cloudflare/computer) **worker-shell** (just-bash). Not the Linux container. Not inside `aileena-new/`.

Spec: [`aileena-new/docs/CLOUDFLARE_COMPUTER.md`](../../aileena-new/docs/CLOUDFLARE_COMPUTER.md)

This folder is **inside the git repo**, not in your home directory.

```txt
aileen@192 ~ %                          ← home. workers/ and aileena-new/ are not here
~/aileen_machina_01/                    ← git repo root
~/aileen_machina_01/aileena-new/        ← Next site (pnpm dev → :3000)
~/aileen_machina_01/workers/aileena-computer/  ← the small computer (pnpm dev → :8787)
```

Until [PR #487](https://github.com/lilaclilac09/aileen_machina_01/pull/487) is merged, this folder **does not exist on `main`**. Checkout the PR branch first.

---

## From Mac home (`~`) — one-time

Needs: git, Node 20+, pnpm.

```sh
# 1. Find an existing clone, or clone once.
ls ~/aileen_machina_01
# if that fails:
cd ~
git clone https://github.com/lilaclilac09/aileen_machina_01.git
cd ~/aileen_machina_01

# 2. This computer is not on main yet.
git fetch origin
git checkout cursor/cloudflare-computer-spec-7f4a
git pull origin cursor/cloudflare-computer-spec-7f4a

# 3. Confirm both folders exist.
ls workers/aileena-computer
ls aileena-new
```

If `ls workers/aileena-computer` still fails, you are on `main` (or a different clone). Stay on `cursor/cloudflare-computer-spec-7f4a`.

If git says **local changes would be overwritten** (checkout/merge abort): you still have uncommitted edits on the old branch. Stash them, then checkout. Do **not** `cd workers/...` yet. Do **not** `pnpm install` at the repo root.

```sh
# stop a wrong pnpm install with Ctrl+C first
cd ~/aileen_machina_01
git stash push -m "local edits before computer branch"
git checkout cursor/cloudflare-computer-spec-7f4a
git pull origin cursor/cloudflare-computer-spec-7f4a
ls workers/aileena-computer
```

Those stashed files are not the computer. Get them back later with `git stash pop` after you are done testing, on the branch you want those edits on.

If you already ran `pnpm install` / `pnpm dev` at `~/aileen_machina_01` (repo root) and saw `Command "dev" not found`: that was the wrong folder. Ignore Solana / titan / recharts warnings. Do not run `pnpm dev` again until `ls workers/aileena-computer` works. Root `node_modules` is junk for this task; do not commit a root `package.json`.

---

## Every time you want the computer on

**Two terminals.** Keep both running.

### Terminal A — the small computer (`:8787`)

```sh
cd ~/aileen_machina_01/workers/aileena-computer
cp -n .dev.vars.example .dev.vars
pnpm install
pnpm dev
```

Wait until wrangler says Ready on `http://127.0.0.1:8787`. Leave it open.

Optional smoke in a third shell:

```sh
cd ~/aileen_machina_01/workers/aileena-computer
COMPUTER_WORKER_SECRET=dev-aileena-computer-local pnpm smoke
```

### Terminal B — the site (`:3000`)

```sh
cd ~/aileen_machina_01/aileena-new
```

If `aileena-new/.env.local` does not exist, create it (do **not** commit):

```txt
COMPUTER_PROTOTYPE=1
COMPUTER_WORKER_URL=http://127.0.0.1:8787
COMPUTER_WORKER_SECRET=dev-aileena-computer-local
AUTH_SECRET=local-dev-auth-secret-change-me
ALLOW_EXPERIMENT_UNLOCK=1
```

`AUTH_SECRET` can be any long random string on localhost. Then:

```sh
pnpm install
pnpm dev
```

Wait for `http://localhost:3000`. Leave it open.

### Browser

1. Open `http://localhost:3000/proof` (not production `aileena.xyz`).
2. Click **enter local experiment** (localhost owner cookie; no typed secret).
3. Open the site-agent Console (same dialog visitors already talk to).
4. Dock under the transcript should say `computer · worker-shell` (not `local shim`).
5. Use **scratch**, then files tab **workspace**. File lives in the Durable Object, not only `.data/`.

If the dock says `local shim`, Terminal A is down or `.env.local` is missing `COMPUTER_WORKER_URL` / `COMPUTER_WORKER_SECRET`. Restart Terminal B after editing `.env.local`.

---

## What this computer can and cannot do (v1)

Can: persist files under `/workspace/scratch|reports|artifacts/`, `echo cat ls wc head tail grep mkdir`, owner dock scratch + workspace files, site-repo git inspect on the local checkout.

Cannot: full Linux, `pnpm build` inside the DO, browser, email send, merge, production `aileena.xyz`, cloning this monorepo into the Worker.

Do not set `COMPUTER_PROTOTYPE` / `COMPUTER_WORKER_*` on Vercel Production.

## Auth

Every `/c/*` route needs `Authorization: Bearer <COMPUTER_WORKER_SECRET>`.
The only workspace name is `owner`.
