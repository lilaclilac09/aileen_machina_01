# AILEENA.XYZ — Handoff

Exported from feature branch `cursor/dj-set-scaffold-70c6`. **Does not include KeyShield `src/web` changes.**

KeyShield PRs to close on GitHub: #42, #41, #40.

---

## Repo layout (this project)

| Path | Purpose |
|------|---------|
| `public/dj-set/` | Standalone carousel UI — `setlist.json`, `index.html`, `assets/covers/` |
| `aileena_second_brain/` | Memory filesystem + agent prompts (Markdown truth source) |
| `lib/aileenaSecondBrain.ts` | Compiled prompts for optional Machina agent mode |
| `app/sound/` | Integrated two-deck player (`DJStation.tsx`) |

Preview carousel locally:

```bash
cd aileena-new/public/dj-set && python3 -m http.server 8088
# open http://localhost:8088
```

Production: `https://aileena.xyz/dj-set/`

---

## Agent prompts

See `aileena_second_brain/prompts/` — paste into agent system prompt or import via `lib/aileenaSecondBrain.ts`.

The on-site **portfolio agent** (`lib/agentContext.ts`) stays third-person / article RAG. The **Machina second-brain** persona is separate (first-person Aileen taste + memory).

---

## Curated set (`setlist.json`)

1. **DAYDRM** — Daydreaming / Harry Styles (120 BPM, 7B)
2. **RAINFR** — Rainforest / John Beltran · Open House (Now & Then)
3. **HIGHTD** — High Tide / John Beltran · Open House (Now & Then)
4. **INTOUCH** — In Touch / Beatrice M. (Sinking Plate 3, 140 BPM, 9A)
5. **RNDVZ** — Rendezvous / lovegold

Curation rules: user links as-is; search via Bleep / Beatport / Bandcamp; cover art must match release.

---

## Memory tiers

- **L1** hot — context session
- **L2** fast — index cache
- **L3** cold — `memories/**` Markdown files
- **L4** optional — O-Mem persona extraction → `persona-auto.md`

Directories: `personal/`, `semantic/`, `episodic/`, `procedural/skills/`, `archived/`.

---

## KeyShield — do not merge

These belong on **aileena.xyz** only:

- `aileena_second_brain/`
- `dj-set/` (here: `public/dj-set/`)
