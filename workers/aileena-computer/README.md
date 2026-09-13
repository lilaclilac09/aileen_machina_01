# aileena-computer

Owner-only small computer. Official package: [`@cloudflare/computer`](https://github.com/cloudflare/computer) **worker-shell** (just-bash) plus **CloudflareContainerBackend** (computerd Linux) on the same Durable Object. Not inside `aileena-new/`.

Spec: [`aileena-new/docs/CLOUDFLARE_COMPUTER.md`](../../aileena-new/docs/CLOUDFLARE_COMPUTER.md)

This folder is **inside the git repo**, not in your home directory.

```txt
aileen@192 ~ %                          ← home. workers/ and aileena-new/ are not here
~/aileen_machina_01/                    ← git repo root
~/aileen_machina_01/aileena-new/        ← Next site (pnpm dev → :3000)
~/aileen_machina_01/workers/aileena-computer/  ← the small computer (pnpm dev → :8787)
```

`workers/aileena-computer` is on `main` (worker-shell). **Linux / computerd** is on `cursor/computer-cli-term-7f4a`. Deploy Linux from that branch, not from `~` and not from an old checkout of `main`.

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

# 2. Linux container lives on this branch.
git fetch origin
git checkout cursor/computer-cli-term-7f4a
git pull origin cursor/computer-cli-term-7f4a

# 3. Confirm both folders exist.
ls workers/aileena-computer
ls aileena-new
```

If `ls workers/aileena-computer` still fails, you are still in `~` or a different clone. The folder is never `~/workers`.

If git says **local changes would be overwritten** (checkout/merge abort): you still have uncommitted edits on the old branch. Stash them, then checkout. Do **not** `cd workers/...` yet. Do **not** `pnpm install` at the repo root.

```sh
# stop a wrong pnpm install with Ctrl+C first
cd ~/aileen_machina_01
git stash push -m "local edits before computer branch"
git checkout cursor/computer-cli-term-7f4a
git pull origin cursor/computer-cli-term-7f4a
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

Can: persist files under `/workspace/scratch|reports|artifacts/`, official worker-shell core (`echo cat ls grep mkdir sed awk find tree …`), owner opt-in groups `curl` `jq` `html-to-markdown` `file` `xan`, owner `>` shell in the Console, site-repo git inspect on a checkout that has `.git`.

Machina calling other apps is a **different product** (`aileena-new/lib/mcp` + `/api/agent/mcp`). It is not this Worker. Do not install `@cloudflare/computer` in Next.

Visitor scratch pads reset monthly: a `.born` stamp is checked lazily on the next task after 30 days, then that visitor's `/workspace/scratch` is wiped (owner workspace never resets). Visitors cannot `curl` / `file` / `xan` / site git.

Cannot: Python in worker-shell (just-bash python needs `node:worker_threads`), yq (`node:process` missing in workerd), sqlite helper worker, `pnpm` inside the isolate, browser, email send, merge, cloning this monorepo into the Worker. Owner Linux (`uname`, `node`, `npm`, `git`) runs through the bound computerd container. Visitors never get that backend. Health reports `container: true` when the image is bound.

`wrangler dev` containers need Docker + buildx. `pnpm dev` starts the NAT REDIRECT sidecar (`aileena-redirect-proxy:local`) so computerd can dial `computer.internal` without kernel TPROXY. Visitors stay 403. Production Workers Containers do not use that sidecar.

## Auth

Every `/c/*` route needs `Authorization: Bearer <COMPUTER_WORKER_SECRET>`.
Workspace names: `owner` or `v-[a-z0-9]{8,32}` (visitor cookie). Bearer secret stays on the Next server.

## Production

`wrangler.jsonc` must **not** include the `experimental` compatibility flag. Production Cloudflare returns **10021** if it is present. Keep `nodejs_compat` + `worker_loaders`. Official `@cloudflare/computer` example still lists `experimental`; do not copy that line.

`wrangler secret list` showing `COMPUTER_WORKER_SECRET` is not enough. If `POST /c/*/exec` returns `503 worker secret not configured`, the isolate value is empty — even after a rollback to an older version. `wrangler.jsonc` now marks that secret as required so later deploys inherit it. To write a real value:

```sh
# from the Worker directory — never commit this file
npx wrangler deploy --secrets-file /tmp/aileena-computer.secrets --message "bind COMPUTER_WORKER_SECRET"
```

The file is one line: `COMPUTER_WORKER_SECRET=<value>`. Then set the **same** value on Vercel Production. Do not put the local `dev-aileena-computer-local` value unless Vercel already uses it.

From `aileen@192 ~` this fails: `cd workers/aileena-computer` — that path is not under home. The Cloud Agent can deploy after `wrangler login`; you do not need to run that `cd` from `~`. If you still deploy from the Mac, paste this:

```sh
ls ~/aileen_machina_01/workers/aileena-computer
# if that fails, the clone is elsewhere:
ls ~/aileen_machina_01 ~/code/aileen_machina_01 ~/src/aileen_machina_01

cd ~/aileen_machina_01
git fetch origin
git checkout cursor/computer-cli-term-7f4a
git pull origin cursor/computer-cli-term-7f4a
cd ~/aileen_machina_01/workers/aileena-computer
npx wrangler deploy --secrets-file /tmp/aileena-computer.secrets
npx wrangler deployments list
```

Do not `curl "$(npx wrangler deployments list)"` — that command is not a URL. After a successful **Upload** (not only Secret Change), copy the workers.dev hostname from the deploy output.

If a secret was printed in chat, generate a new one after deploy succeeds. Do not reuse a leaked value in Vercel.

Then on the Vercel project that serves `https://www.aileena.xyz`, set Production:

```txt
COMPUTER_PROTOTYPE=1
COMPUTER_WORKER_URL=https://<worker>.<account>.workers.dev
COMPUTER_WORKER_SECRET=<same value>
```

Redeploy Production. Shim-only Production stays off.

After Worker code changes: `npx wrangler deploy` again. A Vercel Redeploy does not update the Worker.
