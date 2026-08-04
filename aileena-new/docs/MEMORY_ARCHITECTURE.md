# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Memory architecture — Aileena Machina

**Status: v0.5 skeleton** — retrieval works for hard taste memory; per-visitor soft memory is wired (Upstash Redis + 90d TTL) but optional until env is set; Dreaming/CI consolidates Markdown only (does not scan Redis).

ReMeLight-style: **Markdown in git = hard / cold truth**. Build index = fast retrieve. Chat session = working. Per-visitor Redis = soft episodic.

## Stack

| Layer | Implementation | Notes |
|-------|----------------|-------|
| **Hard (pinned)** | `aileena_second_brain/memories/**` + prompts | Taste, music, docs, painters — Dreaming must not delete |
| Working | Last 20 turns + optional client `priorTopics` | Per request |
| Soft (per visitor) | Upstash Redis `visitor:soft:{id}` | Anonymous cookie `__aileena_vid`; **90-day sliding TTL** |
| Retrieval | `searchMemories` TF-IDF (`lib/memorySearch.ts`) | Hard corpus only |
| Dreaming | `pnpm dreaming` weekly | Markdown report; Redis GC = TTL expiry (no full scan) |
| Persona L4 | `persona-auto.md` (optional) | O-Mem later |
| Tracked data | `data/` SKUs / pricing / news / docs | Separate read-only tools — not Dreaming |

## Per-visitor soft memory (v0.5)

```bash
# Vercel / local env (optional — chat degrades to localStorage priorTopics if unset)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
CHAT_QUOTA_SECRET=...   # also signs __aileena_vid
```

- Key: `visitor:soft:{uuid}` → `{ questions[30], topics[12], updatedAt, hitCount }`
- Write on each chat turn; `EX 7776000` (90 days) refreshed on write
- Concurrent users: sharded by id — no cross-user locks
- Code: `lib/visitorMemory.ts` · wired in `app/api/chat/route.ts`
- Response header: `X-Visitor-Soft-Memory: redis|off`

## Agent chat transcript forward (owner inbox)

Every console conversation is emailed to the contact inbox via `/api/chat/forward`
(`From`: `cafe@aileena.xyz` via `getResendFrom()`, `To`: `CONTACT_TO` / `cafe@aileena.xyz`).

When Upstash is configured, every attempt is also stored in Redis:

| Key | Purpose |
|-----|---------|
| `chat:forward:rec:{id}` | Full transcript + status (`sent` / `failed`) |
| `chat:forward:index` | Sorted set of recent ids |
| `chat:forward:pending` | Failed ids waiting for resend |

```bash
pnpm chat:pending              # list failed / unsent
pnpm chat:pending -- --all     # recent history
pnpm chat:resend-pending       # retry failed emails
pnpm chat:resend-pending -- --dry-run
```

Transcripts from **before** this store shipped cannot be reconstructed from git —
check the Resend dashboard (Emails) for `[AILEENA Chat …]` subjects.

Ops detail + two-week inventory: `docs/CHAT_FORWARD.md`.  
Scheduled drain: `.github/workflows/chat-forward-resend.yml` (every 6h + manual).

## Commands

```bash
pnpm sync:content-memory  # scan songs/podcasts/docs/articles → latest-content.md
pnpm build:memory-index   # scan memories → lib/memoryIndex.json
pnpm dreaming             # offline report → memories/archived/consolidate-report-*.md
pnpm memory:workflow      # sync + dreaming + index rebuild (local one-shot)
pnpm verify:memory        # hard TF-IDF + soft-memory unit checks → .verify-memory/verify-report.json
pnpm verify:memory:live   # same + POST /api/chat on localhost:3000
pnpm verify:react         # ReAct R1: duplicate fuse + observation truncate + audit
pnpm build                # includes memory index on every deploy
```

### ReAct R1 (chat loop)

`/api/chat` wraps all tools with `lib/reactGuard.ts`:

- Max steps: 4 (`stopWhen`)
- Duplicate tool+args in the same turn → blocked observation (`reason: duplicate_tool`)
- Observations truncated (top 3 hits, snippet ≤180 chars)
- Server log: `[chat] react-audit` with stop reason / empty recalls / errors
- Response header: `X-React-Max-Steps: 4`

### Tool route R2

`lib/toolRouter.ts` picks allowed tools **before** the model runs:

| Question type | Exposed tools | Effect |
|---------------|---------------|--------|
| hire / CV / contact | **none** | Cannot waste steps on search; answers from static prompt |
| **what's new / 更新了吗** | memories (+ articles) | **Must** `searchMemories("latest content")` — not training invent |
| music / taste / Hockney | memories (+ articles) | **Cannot** call `queryChip` |
| faith / belief | memories (+ articles) | Hits `faith-from-essays` path |
| Centaur | articles + research/docs | Forced retrieval; no chip tools |
| H100 / pricing | chip + price + news/docs | **Cannot** call `searchMemories` |
| seniority myth | memories + articles | Soft pierce evidence only |

Headers: `X-Tool-Route: taste|hire_cv|centaur|…`  
Logs: `[chat] tool-route` + react-audit includes `route`.

### Model route + circuit (resilience)

`lib/modelRouter.ts`:

- Primary: DeepSeek; optional fallback via `AGENT_FALLBACK_BASE_URL` + `AGENT_FALLBACK_API_KEY`
- Circuit: 3 consecutive provider failures → open 60s → degrade (503 + fixed/canned copy)
- Deadline: `AbortSignal` budget **22s** inside Vercel `maxDuration=30`
- Headers: `X-Model-Tier`, `X-Model-Budget-Ms`, `X-Degrade-Reason` (when degraded)

### Trace

`lib/requestTrace.ts` — every `/api/chat` gets `X-Trace-Id`; logs `[chat][trace]` + span timings (quota / prepare / model_stream). Pass `x-trace-id` request header to correlate.

### Document ETL (your scale — already the build pipeline)

Not a separate vector warehouse. Replayable chain:

```
sync:content-memory  →  Markdown L3 (latest-content, setlist, …)
build:memory-index   →  memoryIndex.json (TF-IDF)
build:index          →  agentArticleIndex.json
build:data-index     →  data tool indexes
dreaming             →  offline consolidate report (no live write)
pnpm build           →  runs the indexers before Next build (Vercel)
```

Quality checks: `pnpm verify:memory`, `pnpm verify:react`, `pnpm verify:ops`.

### Agent manual prompts (site console)

Printed by `pnpm verify:memory` and stored in the report under `agentManualPrompts`:

1. what music / DJ set?
2. what documentaries?
3. David Hockney?
4. podcasts on the shelf?
5. what did I ask before? (after 1–4)
6. is she available for hire? (must not invent taste from training)
7. 更新了什么吗 / what's new? (must cite latest-content — Local Models / YMTC — not old /blog/cli)

## Fixed workflow (GitHub Actions)

| Workflow | Trigger | Role |
|----------|---------|------|
| **`.github/workflows/memory-on-article.yml`** | **`push` to `main` on fixed paths** | New article / updates / research / setlist → memory |
| `.github/workflows/machina-memory.yml` | Mondays 06:00 UTC + `workflow_dispatch` | Weekly / manual Dreaming |
| `.github/workflows/machina-memory-job.yml` | `workflow_call` only | Shared job body |

**Fixed paths (canonical):** `aileena-new/docs/MEMORY_WATCH_PATHS.md`

```
aileena-new/app/blog/**
aileena-new/app/updates/**
aileena-new/lib/research/**
aileena-new/lib/djSetlist.ts
aileena-new/public/dj-set/setlist.json
aileena-new/components/DJStation.tsx
```

Local one-shot: `pnpm memory:on-article` (= `pnpm memory:workflow`).

Steps: **`sync:content-memory`** → `pnpm dreaming` → `pnpm build:memory-index` → commit `latest-content.md`, changelogs, Dreaming reports to `main`.

Push resilience: `fetch-depth: 0`, concurrency group `machina-memory-dreaming`, rebase + retry.

Bot commits only touch `aileena_second_brain/**` (+ setlist assets) — **outside** the fixed path filter — so the Action does not loop.

Dreaming also snapshots **social teachers** (SemiAnalysis / mach33) from `data/tweets.jsonl` + `data/social/*` (kept fresh by `.github/workflows/social-rss-sync.yml` every 6h) into:

- `memories/archived/consolidate-report-*.md` → section **Social teachers**
- `memories/episodic/social-changelog-YYYY-MM-DD.md` → promote durable facts into `analysts-dylan-aaron.md` / research ledgers

### What content sync detects

| Source | Detects |
|--------|---------|
| `public/dj-set/setlist.json` | Curated DJ set tracks |
| `lib/djSetlist.ts` (`DECK_LIBRARY_TRACKS`) | Newest player deck additions |
| `app/blog/watch-listening-shelf/page.tsx` | Podcasts, documentaries, channels |
| `app/blog/*/page.tsx` | Latest articles (by `date` prop; supports `title={isDE ? … : …}`) |
| `app/updates/page.tsx` | Metal & Pages shelf + update notes |
| `lib/research/*.ts` | Research magazine issues |

On change → writes `memories/episodic/content-changelog-YYYY-MM-DD.md` for Dreaming review.

### Carousel self-evolution (new songs)

`pnpm sync:carousel-evolve` (first step of `sync:content-memory`):

1. Scans **tail of `DJStation.tsx`** for tracks not yet in `setlist.json`
2. Appends to `/dj-set/` carousel + generates cover SVGs
3. Updates `setlist.md`, `prompts/music-taste.md`, `self-evolution-log.md`
4. Writes `memories/episodic/evolve-carousel-*.md`

`lib/memoryIndex.json` stays gitignored; Vercel rebuilds hard-memory index on every deploy via `pnpm build`.

## Agent wiring

- `/api/chat` injects `MEMORY_STACK_PROMPT` + hard-memory prefetch + visitor soft block
- Tool: `searchMemories(query, k)` (Aileen taste — not visitor history)
- Optional body: `{ "agentMode": "machina" }` → first-person Machina prompt (`buildMachinaSystemPrompt`)

## Hardware (Memory Wall)

External files + retrieval + Dreaming compression → shorter prompts → less KV cache traffic on decode. See `memories/semantic/hardware-memory-wall.md`.

## Framework map

Full GitHub list: `memories/semantic/memory-frameworks.md`.
