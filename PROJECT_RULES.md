# PROJECT_RULES.md

Project facts — not chat memory. Update this file when a product decision is settled. Do not argue it away in a one-off patch.

Site: **https://www.aileena.xyz** (app in `aileena-new/`).

## Site principles

- aileena.xyz should feel **soft, strange, technical, personal**
- preserve **thin typography**
- do not make it look like enterprise SaaS
- **Visual** content images must not be cropped (`GlassBench`: `object-fit: contain`, natural aspect — never `cover` / fixed-height crop shells)
- **orb** should be compact but tactile — not hero-sized and not tiny
- **contact** must send email via Resend and **include the transcript**
- **voice** should speak full responses at a calm human pace
- **doors** (`/doors`) is the main subpage directory

## Always preserve

- cream / teal visual language (home cream `#f8f5ee`; cyan/teal for technical rails)
- public UI never dumps raw backend / env / stack traces
- `cafe@aileena.xyz` is **brand send-only (From)**. Real inbox is `CONTACT_TO` / `CONTACT_TO_EMAIL` / `LEAD_INBOX` — never To: cafe@
- DJ Station lives on `/sound#dj-set`. Visual / `#glass-bench` lives on the **home** page only — not on `/sound`
- Sound Lab pair recommendations are **metadata heuristics** (BPM/tags), not audio analysis. Hard techno bias prefers higher marked tempo. Real mix/export still needs a mixable file.
- Real DJ mix is Web Audio (local / uploaded files, optional CORS-safe URL). Spotify iframe is preview only and cannot enter the mix. SoundCloud v1 is export-ready (manual upload), not OAuth.
- Sound Lab mixer is inspired by club-gear ergonomics (two decks, centre strip, crossfader). Not a Pioneer/CDJ clone — no logos, product names, or trade dress.
- do not replace a working flow with a parallel implementation

## Contact / env (ops, not code)

Mail send needs production env (Vercel Production, then redeploy):

- `RESEND_API_KEY`
- `CONTACT_TO` (preferred) or `CONTACT_TO_EMAIL` / `LEAD_INBOX`
- optional From: `RESEND_FROM` / `FROM_EMAIL` / `CONTACT_FROM`

If those are missing, the site is **degraded** (offline copy). That is an env blocker, not a reason to rewrite the contact form.

## Orb / voice (slices — never “fix orb” as one task)

1. transcript visible
2. TTS speaks the **full** sentence
3. TTS slower / calm
4. recognition continuous (turn-taking)
5. controls proportion (compact, tactile)

One slice per change set.

## Voice → code (two doors)

Public Console: `POST /api/voice-code` is propose-only (unified diff + downloadable `.patch`). Never writes, never `git apply`, never `apply: true`. Visitor UI is Copy + Take `.patch` only.

Owner write: `POST /api/owner/voice-code/apply` with existing OWNER_KEY session (`__aileena_pass` via=owner). Missing session → 401, no file touch. Writes only under the Console/footer allowlist (`components/AgentChat.tsx`, `lib/translations.ts`).

Public apply: `POST /api/voice-code/apply` is always **403**, never 200, never writes.

Do **not** vendor DeepSeek Harness / dsh onto the public site. Shanghai accent = DeepSeek the model via `lib/modelRouter`. harness-cli / council stay local/owner tools.

## Console prefix + daily draw

System prompt + tool table are one **frozen root** per visitor session. RAG hits, draw recitation, vcode quota chip, Whisper transcripts, and tool RESULTS append at the tail only — never rewrite the prefix mid-thread.

Cloud ↔ on-device (or any `modelRouter` provider swap) mid-session starts a **new root**, not a hot-swap. If context must drop: ping the visitor, then new root. No silent `slice` / ghost KV.

The Console is **Machina**. The frozen `# This root` line names **this root's** provider only (DeepSeek via `modelRouter`, Qwen on-device, etc.). A provider swap is `409` + new root — do not keep a “speaking DeepSeek” string across that boundary. Not DeepSeek Harness / dsh. `DEEPSEEK_API_KEY` lives on Vercel preview + production; a missing local key is not a product gap and not a reason to 200 a public write.

Daily draw: one card per Asia/Taipei civil day (`/api/draw`), recited in the Console tail. Deck is site lines (kiln / shelf / wire / desk / door). Not astrology. Do not burn draw on idle chat.
