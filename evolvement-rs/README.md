# evolvement-rs

Proof of change for Aileena Machina. Hard taste stays in git. A visitor's questions stay in Redis. Dreaming writes a proposal. It does not delete pins.

This crate does not replace the Next.js site agent. `/api/chat` keeps its own loop. Call this process when you want the evolvement card or a separate turn that already knows the lanes.

## Lanes

| Lane | Where | Who writes |
| --- | --- | --- |
| Hard | `aileena_second_brain/memories/**` | Humans, or `promote` into `memories/archived/` only |
| Soft | Redis `visitor:soft:{id}` 90-day sliding TTL | This process, per visitor |
| Catalogue | `catalogue/repos-digest.md` | `harvest` |
| Dream | `proposals/dream-YYYY-MM-DD.md` | `dream` |

Chip and research PDFs are not Dreaming taste. X ingest accepts watchlist authors (`semianalysis`, `mach33`) only.

## Run

From the repo root or from this directory:

```bash
cd evolvement-rs
cargo test
cargo run -- harvest
cargo run -- dream
EVOLVEMENT_PROMOTE=allow cargo run -- promote proposals/dream-2026-09-25.md
cargo run -- serve
```

`serve` binds `0.0.0.0:8787` (`PORT` overrides). `agent-gateway-rs` uses the same port on loopback. Run one of them, or set `PORT`.

`harvest` writes the digest and does not star. `harvest --star` stars only when the score is above 70 and the repo is not marked `!` in `watchlist.toml`.

`promote proposals/dream-YYYY-MM-DD.md weekly-note.md` copies into `memories/archived/`. It refuses if that file already exists.

Next forwards with `POST /api/evolvement` when `EVOLVEMENT_URL` is set. `/api/chat` stays the site agent.

Env: `GITHUB_TOKEN` (live repo stats), `REDIS_URL` (soft memory), `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (optional, unused by the rule router), `WATCHLIST` (`owner/repo` comma list), `EVOLVEMENT_BRAIN` (default `aileena-new/aileena_second_brain`).

No token: harvest still writes the digest from the watchlist weights. It does not invent 30-day star velocity and it does not star anything.

With `GITHUB_TOKEN`, a repo is starred and watched only when `should_star` is true: score above 70, not already starred, and `star_ok`. `qdrant/qdrant` is on the digest as a catalogue contrast. It is not starred and it does not replace the TF-IDF index. Harvest also writes `catalogue/memory-index.json`.

Redis down: `POST /v1/turn` stays 200 and returns `soft_patch`. The console keeps `priorTopics`.

## HTTP

`POST /v1/turn`

```json
{ "visitor_id": "vis_…", "message": "…", "prior_topics": [], "agent_mode": "public" }
```

Reply JSON: `reply`, `route`, `tools_used`, `soft_patch`.

Routes: `taste | latest | hire | soft_recall | evolvement | repo`.

- `hire` uses no tools.
- `更新了什么吗` forces the English query `latest content`.
- At most 4 tool steps. The same tool and args twice in one turn is `duplicate_tool`.
- `agent_mode: "machina"` may use first person on an evolvement pitch. Public replies stay third person. Dream files under `proposals/` are first person.

`GET /v1/visitor/:id`

`GET /v1/evolvement` — last dream date and last harvest count. No soft memory in that card.

`GET /healthz`

## How `/api/chat` can call this

Do not merge the two memory writes.

1. Leave `app/api/chat/route.ts` as the site agent. It already has hard TF-IDF and its own Redis soft key.
2. For an evolvement aside, `POST http://127.0.0.1:8787/v1/turn` with the same `visitor_id` you already minted and the client's `priorTopics`.
3. If the body has `soft_patch`, keep those topics on the client. Do not copy them into `memories/`.
4. Do not point Dreaming at Redis. Do not let harvest write `memories/semantic/*taste*`.
5. Show `GET /v1/evolvement` as the public proof card: dream date, harvest count, top repos. One offer in the pitch, not three.

No fine-tune is claimed. The proof is the commit, the dream report, and the digest.
