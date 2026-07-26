# AGENTS.md

This repository is a **monorepo of independently deployable projects** (no root `package.json`
or workspace orchestrator). Each subdirectory has its own package manager, run commands, and
docs. Read the per-project README / `CLAUDE.md` for product detail before changing code.

| Project | Path | Stack | Dev command | Default port |
|---------|------|-------|-------------|--------------|
| AILEENA MACHINA (main portfolio + AI agent) | `aileena-new/` | Next.js 16, React 19, pnpm | `pnpm dev` | 3000 |
| Gather · 共影 (shared photo album) | `album/` | Next.js 14, Prisma + SQLite, npm | `npm run dev` | 3010 |
| Cafe Cursor Shanghai (credit redeem) | `cafe-cursor/` | Next.js 14, Prisma + Postgres, npm | `npm run dev` | 3000 |
| hx / agent harness (CLI) | `harness-cli/` | Node ≥22, zero deps | `npm test` | n/a |
| Legacy archive | `old/` | static site + old Next/Hono apps | — | — |

Standard lint/test/build commands live in each project's `package.json` `scripts` and README;
this file only records the **non-obvious** cloud-setup caveats.

## Cursor Cloud specific instructions

The startup **update script** already runs the dependency installs (`pnpm install` in
`aileena-new`, `npm install` in `album` and `cafe-cursor`; `npm install` also runs `prisma generate`
via each project's `postinstall`). `harness-cli` has no dependencies. The notes below cover
everything the update script intentionally does **not** do (services, databases, build-time data).

### Ports
`aileena-new` and `cafe-cursor` both default to port **3000**. Run only one on 3000 at a time, or
start `cafe-cursor` on another port: `npm run dev -- -p 3002` (then set
`NEXT_PUBLIC_SITE_URL=http://localhost:3002` in `cafe-cursor/.env`). `album` uses 3010.

### aileena-new — build-time indexes required before the agent API works
The `/api/chat` and `/api/v1/*` routes import generated JSON indexes
(`lib/agentArticleIndex.json`, `lib/memoryIndex.json`, `lib/dataDocIndex.json`, `data/*.json`, …)
that are **gitignored and NOT committed**. On a fresh checkout `pnpm dev` starts, but these routes
return **HTTP 500 (`Module not found: Can't resolve './agentArticleIndex.json'`)** until the indexes
are generated. Generate them once (they are the first steps of `pnpm build`, and are fast — ~2s):

```bash
cd aileena-new
pnpm build:index          # article index
pnpm build:data-index     # data + doc index
pnpm build:memory-index   # memory index
pnpm sync:carousel-evolve # (optional) DJ/setlist → memory
```

The running dev server hot-reloads and picks up the new files automatically. The static
portfolio pages (`/`, `/dispatch`, `/blog/*`) render without this step.

### aileena-new — the AI chat needs an LLM key (optional)
Static browsing and the local knowledge API (`/api/v1/search/*`, `/api/v1/health`) work with **no
keys**. The live "MACHINA / ask the agent" chat (`/api/chat`) calls DeepSeek and needs
`DEEPSEEK_API_KEY` (or `AGENT_API_KEY` + `AGENT_FALLBACK_*`) in `aileena-new/.env.local`. Email
(`RESEND_API_KEY`), visitor memory (`UPSTASH_REDIS_*`), TTS and donations are all optional and
degrade gracefully.

### album — SQLite + local storage, self-contained
Copy env and create the local DB once (already done in the current VM):

```bash
cd album
cp .env.example .env        # DATABASE_URL=file:./dev.db, STORAGE_DRIVER=local
npx prisma db push          # creates dev.db (also gitignored)
```

With `STORAGE_DRIVER=local`, uploads are written to disk — no cloud storage/keys needed.

### cafe-cursor — needs a running PostgreSQL (not in the update script)
`cafe-cursor` is Postgres-only (Prisma provider `postgresql`); there is no SQLite fallback. Postgres
is a **system dependency**, so it is installed/started manually, not by the update script. It also
does **not** auto-start on boot — start it each session before running the app.

```bash
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib   # once
sudo pg_ctlcluster 16 main start                                               # every session
# create role/db once:
sudo -u postgres psql -c "CREATE ROLE cafe LOGIN PASSWORD 'cafe';"
sudo -u postgres psql -c "CREATE DATABASE cafe_cursor OWNER cafe;"
```

Then create `cafe-cursor/.env` (gitignored) with a local Postgres URL and required admin/session
vars, and push + seed the schema:

```bash
# cafe-cursor/.env
#   DATABASE_URL="postgresql://cafe:cafe@localhost:5432/cafe_cursor?schema=public"
#   ADMIN_USERNAME="admin"
#   ADMIN_PASSWORD="admin1234"
#   SESSION_SECRET="dev-local-session-secret-at-least-32-characters-long"
#   REDEEM_MODE="allowlist"
#   NEXT_PUBLIC_SITE_URL="http://localhost:3002"
cd cafe-cursor
npx prisma db push
npm run db:seed             # seeds eligible users (john/jane/bob@example.com) + credits
```

In `REDEEM_MODE=allowlist`, only seeded/imported emails can redeem. Seeded demo attendees:
`john@example.com`, `jane@example.com`, `bob@example.com` (each claims once). `RESEND_API_KEY` is
optional — redeem still works and just skips the email (`emailSent: false`).

### Lint status
`aileena-new`'s `pnpm lint` runs correctly but currently reports pre-existing errors/warnings in the
committed code — a non-zero exit there reflects existing lint debt, not a broken toolchain.
