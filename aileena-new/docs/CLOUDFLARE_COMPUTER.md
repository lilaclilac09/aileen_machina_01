# Cloudflare Computer — make the small computer usable

Status: **slice A+B coded. Local wrangler + site env still needed for end-to-end.**  
Date: 2026-09-05  
Source repo: [github.com/cloudflare/computer](https://github.com/cloudflare/computer)  
npm: `@cloudflare/computer@0.2.1` (preview; APIs can move)

This is the missing half of the Console computer. The dock, KeyShield door, and task API already live on `main`. The Durable Object workspace does not. Last time we built a local shim instead of lying that Vercel can run `@cloudflare/computer`.

```txt
do not install @cloudflare/computer inside aileena-new.
do not enable on Vercel Production.
do not merge from the computer.
do not import DeepSeek Harness.
```

---

## 1 · What last time actually proved

[PR #467](https://github.com/lilaclilac09/aileen_machina_01/pull/467) + [PR #475](https://github.com/lilaclilac09/aileen_machina_01/pull/475) (restored by [#477](https://github.com/lilaclilac09/aileen_machina_01/pull/477)) shipped:

- Owner dock in the site-agent Console (`ComputerConsoleDock`)
- KeyShield door on `/proof`
- `POST /api/agent/computer/tasks` + chat fast path (`⚡ queued.`)
- Local workspace under `.data/computer-prototype/`
- `backend: 'local-shim'` · `cloudflareComputer: false`
- Production hard-off: `VERCEL_ENV === 'production'` → APIs 404

The prototype agent ([bc-c52a6d1e](https://cursor.com/agents/bc-c52a6d1e-e0e5-5b25-bf40-373cab1e9342)) researched [github.com/cloudflare/computer](https://github.com/cloudflare/computer) and correctly refused to install the package in Next.js.

Why it cannot run on Vercel:

| Need | Vercel Next (aileena.xyz) | Cloudflare Computer |
|------|---------------------------|---------------------|
| Runtime | Edge chat + Node `after()` | Worker + Durable Object |
| Files | ephemeral disk / `.data/` | DO SQLite VFS (~10 GB) |
| Exec | `spawn` on the Node isolate | `workspace.runtime.exec` |
| Persist across boots | lost / single instance | survives DO restarts |

Installing the npm package in `aileena-new/` would fake a computer that cannot run. Peer-dep warning: the package wants `zod ^4.4.3`; the site has `zod ^3.23.8`. That is another reason the package stays out of the Next app.

---

## 2 · Which “small computer”

Official backends ([packages/computer/README.md](https://github.com/cloudflare/computer/blob/main/packages/computer/README.md)):

| Backend | What it is | v1? |
|---------|------------|-----|
| **Worker shell** (`@cloudflare/computer/backends/worker-shell`) | just-bash in a Dynamic Worker. No Docker. Fast. `cat` `ls` `grep` `awk` `sed` `jq`. Optional groups: `curl` `sqlite` `python` … | **yes — this is the 小电脑** |
| Worker JavaScript | isolated ESM module | later |
| Container + `computerd` | full Linux, FUSE, real `npm`/`node` | **no** |

Copy the official HTTP shape from [`examples/worker-shell`](https://github.com/cloudflare/computer/tree/main/examples/worker-shell). Do not invent a second protocol.

```
PUT  /c/<name>/file/workspace/<path>   write
GET  /c/<name>/file/workspace/<path>   read
POST /c/<name>/exec                    { command | argv, cwd? } → { exitCode, stdout, stderr }
```

v1 name is always `owner` (`idFromName("owner")`). One Durable Object. One workspace.

---

## 3 · Architecture (one vertical slice)

```
owner Console  →  POST /api/agent/computer/tasks   (owner cookie, Vercel Node)
               →  after() runComputerTask
               →  lib/computer/cfClient.ts         (only if URL + secret set)
               →  Worker  Authorization: Bearer
               →  Durable Object Workspace (SQLite)
               →  WorkerShellBackend (just-bash)
```

Chat stays Edge. The runner stays Node. The package lives only in the Worker.

```txt
aileena.xyz (Vercel)     = mouth + dock + owner gate + task queue
workers/aileena-computer = the actual small computer
```

If `COMPUTER_WORKER_URL` is missing, keep today's local shim. Do not add a third backend. Two states only:

- `local-shim` — current prototype
- `cloudflare-worker-shell` — Worker answered and the task used it

---

## 4 · Done when (v1 usable)

Owner, localhost / preview only. Production stays off.

1. `wrangler dev` in `workers/aileena-computer`
2. `PUT` `/workspace/scratch/hello.txt` → `GET` same path returns the bytes
3. `POST /exec` `{ "command": "cat scratch/hello.txt" }` prints them
4. Restart wrangler. File is still there (DO SQLite)
5. Site owner dock → scratch plugin writes that file on the Worker, not only `.data/`
6. Files tab lists `/workspace` from the Worker
7. Visitor still sees no dock
8. Merge plugin stays grey
9. `VERCEL_ENV=production` still 404s the prototype APIs
10. Unauthenticated `curl` to the Worker is `401`

If step 4 or 5 fails, it is not usable. Localhost disk only is the old shim.

---

## 5 · Map existing task types

Two different “gits”. Do not mix them.

| Task | v1 backend | Why |
|------|------------|-----|
| `write_scratch_file` | **Worker** `ws.fs.writeFile('/workspace/scratch/…')` | first proof the DO is real |
| `files_tree` / `files_search` / `files_open` | **Worker** `readdir` / `grep` / `readFile` under `/workspace` | files tab becomes the small computer |
| `git_status` `git_log` `git_show` `git_find_commit` | **local site checkout** | those inspect `aileena_machina_01`, not the agent VFS |
| `inspect_route_files` `draft_daily_fix_plan` `draft_patch` `generate_implementation_prompt` | local site tree (read-only) | plans about the site repo |
| `run_build_check` | Worker `echo ok` via just-bash **or** stay local `echo-ok` | just-bash is not `pnpm` |
| `collect_screenshot_checklist` | stay blocked / checklist only | no browser on worker-shell |
| `email_draft` | local draft | no send |
| `email_send` | blocked | no provider |
| `browser_screenshot` | blocked | no Playwright on the Worker |
| merge | blocked | `canMerge: false` forever |

Do not clone this monorepo into the Durable Object. Official limit is ~10 GB and “agent-scale workspaces, not full monorepos.” Site inspect stays on the machine that already has the git tree.

---

## 6 · Worker contract

New folder: `workers/aileena-computer/` (sibling of `aileena-new/`, not inside it).

Template: official `examples/worker-shell` (`src/index.ts` + `wrangler.jsonc`).

Changes from the example (smallest):

1. **Auth.** Every `/c/*` route requires `Authorization: Bearer <COMPUTER_WORKER_SECRET>`. Missing / wrong → 401. `/` health can stay public and must not leak files.
2. **Name lock.** Only `name === "owner"`. Anything else → 404.
3. **No public exec.** Reject body keys that are not `command` / `argv` / `cwd` / `encoding`. Cap command length (1k). Cap stdout/stderr returned to the site (already `COMPUTER_LIMITS.maxArtifactPreviewChars`).
4. **Exec allowlist for v1.** Core just-bash only: `echo` `cat` `ls` `wc` `head` `tail` `grep` `mkdir` `rm` (scratch/reports only). No `curl` group until a later slice. No `python`. No network.
5. **Write allowlist.** `/workspace/scratch/`, `/workspace/reports/`, `/workspace/artifacts/`. Other writes → 400.
6. **Dispose stubs.** `using ws = await getWorkspace(...)` and `using run = await ws.runtime.exec(...)` per official lifecycle. Do not leak RPC stubs.
7. **No R2 in v1.** Drop the example bucket mount. Add later if we need a read-only seed.
8. **Do not** expose a visitor HTML app. This Worker is an owner API.

`wrangler.jsonc` (shape, not a secret):

```jsonc
{
  "name": "aileena-computer",
  "main": "src/index.ts",
  "compatibility_date": "2026-05-26",
  "compatibility_flags": ["nodejs_compat", "experimental"],
  "worker_loaders": [{ "binding": "LOADER" }],
  "durable_objects": {
    "bindings": [{ "name": "OwnerComputer", "class_name": "OwnerComputer" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["OwnerComputer"] }]
}
```

`COMPUTER_WORKER_SECRET` is a Wrangler secret. Never commit it. Never put it in `environment.json`.

---

## 7 · Site client (after the Worker exists)

New file only: `aileena-new/lib/computer/cfClient.ts`.

- Reads `COMPUTER_WORKER_URL` + `COMPUTER_WORKER_SECRET`
- `isCloudflareComputerReady()` is true only when both are non-empty **and** `isComputerPrototypeEnabled()` is true
- Methods: `putFile` `getFile` `exec` `health`
- Timeouts. Redact secrets in logs (reuse `lib/computer/redact.ts`)
- Never send owner cookies to Cloudflare. Bearer secret only.

`runner.ts` changes (one slice): `write_scratch_file` + files_* call `cfClient` when ready; otherwise keep the shim. Set `task.backend` to `'cloudflare-worker-shell'` or `'local-shim'`.

`types.ts`: extend `backend` from `'local-shim'` to `'local-shim' | 'cloudflare-worker-shell'`.

Do **not** import `@cloudflare/computer` in `aileena-new/package.json`. The verify script that asserts the package is absent stays.

GET `/api/agent/computer/tasks` already returns `cloudflareComputer: false`. Flip that boolean from `isCloudflareComputerReady()`, not from a hard-coded true.

---

## 8 · Env

Worker (Cloudflare dashboard / `wrangler secret`):

```txt
COMPUTER_WORKER_SECRET
```

Next (local + Vercel **Preview** only):

```txt
COMPUTER_PROTOTYPE=1
COMPUTER_WORKER_URL=https://<worker>.<account>.workers.dev
COMPUTER_WORKER_SECRET=<same value>
```

Production:

```txt
# do not set COMPUTER_PROTOTYPE
# do not set COMPUTER_WORKER_URL
# VERCEL_ENV=production already hard-offs the APIs
```

---

## 9 · Implementation slices (after this spec is approved)

Do one slice per PR. Do not bundle the Worker and a UI redesign.

| # | Slice | Proof |
|---|--------|--------|
| **A** | Scaffold `workers/aileena-computer` from official worker-shell. Auth + name lock + write allowlist. No site change. | `wrangler dev` curl PUT/GET/exec + restart persistence |
| **B** | `cfClient` + scratch + files_* in `runner.ts`. Dock copy can say `cloudflare-worker-shell` when ready. | Owner scratch in Console lands in the DO |
| **C** | Optional later: opt-in `curl` / `jq` groups, R2 mount, Worker JS backend | new spec |

Out of scope until a later owner ask: container/`computerd`, cloning `aileen_machina_01` into the DO, production, merge, browser, email send, `@cloudflare/computer/tools` as the chat loop.

---

## 10 · Verify

Worker (slice A):

```sh
cd workers/aileena-computer
pnpm install
pnpm exec wrangler dev
# then the official smoke, plus 401 without bearer
```

Site (slice B), existing scripts still pass:

```sh
cd aileena-new
pnpm verify:computer-prototype
# add: when COMPUTER_WORKER_URL is set, scratch artifact path is /workspace/scratch/…
```

Manual QA (390×844, owner):

- `/proof` → KeyShield or local experiment enter
- Console dock → scratch → files tab shows the file
- Visitor Console: no dock
- Production: no dock

`no screenshots = no merge recommendation` for slice B (UI). Slice A is Worker-only; curl logs are enough.

---

## 11 · Risks

- Package is **PREVIEW**. Pin the version. Read the official README again before coding; do not memorize APIs.
- `experimental` + `worker_loaders` required for worker-shell.
- just-bash is not Linux. `pnpm build` will never run here.
- Stub leaks if we skip `using`.
- Preview Worker URL on the public internet: bearer secret is the only door. Rotate if leaked.
- Cloudflare account, Workers paid features (DO + loader), and `wrangler login` are **human** steps. Agent cannot invent a bypass.

---

## 12 · Manual steps (owner)

Copy-paste from home (`~`): [`workers/aileena-computer/README.md`](../../workers/aileena-computer/README.md).

Those folders live in the git repo, not in `~`. Until this PR is on `main`, checkout `cursor/cloudflare-computer-spec-7f4a`.

```txt
manual steps:
- cd into the clone (not ~): git clone …/aileen_machina_01.git then checkout this branch
- Terminal A: workers/aileena-computer → pnpm dev (:8787)
- Terminal B: aileena-new/.env.local + pnpm dev (:3000)
- Browser: http://localhost:3000/proof → enter local experiment → Console dock worker-shell
- Cloudflare account + wrangler login only if deploying the Worker to Preview
- wrangler secret put COMPUTER_WORKER_SECRET (preview Worker only)
- add COMPUTER_WORKER_URL + COMPUTER_WORKER_SECRET to local .env and Vercel Preview only
- do not add those to Vercel Production
```

---

## 13 · Recommendation

Keep the Console dock. Add a tiny Worker beside the site. That is how the GitHub repo is meant to be used.

**safe to implement after owner says yes to slice A.**  
**safe to merge this spec:** yes (docs only).  
**safe to enable on production:** no.
