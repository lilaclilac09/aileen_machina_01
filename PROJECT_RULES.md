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

## Doors

Back-link chrome is `lib/doorsNav.ts`. Verify with `pnpm verify:doors-nav` in `aileena-new/`. Do not invent a second nav tree.
