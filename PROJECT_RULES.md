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

Do **not** vendor DeepSeek Harness / dsh onto the public site. Shanghai accent = DeepSeek the model via `lib/modelRouter`. harness-cli / council stay local/owner tools.
