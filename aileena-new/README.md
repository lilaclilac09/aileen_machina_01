# AILEENA MACHINA

Personal portfolio + CV site for Aileen Zhou. Lives at [aileena.xyz](https://aileena.xyz).

Includes a small AI agent (Vercel AI SDK + Claude) you can chat with on the site to ask about her work, writing, stack, and availability.

## License

This repository is licensed under the **GNU Affero General Public License v3.0 or later** (AGPL-3.0-or-later). See [`../LICENSE`](../LICENSE) for the full text.

If you run a modified version of this code on a network-accessible server, AGPL requires you to make the modified source available to users of that server.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Vercel AI SDK + `@ai-sdk/anthropic` (site agent)
- Resend (contact form)
- Vercel (deployment)

## Project layout

```
app/
  page.tsx              # Main landing — hero, open-to-work, work, blog, DJ, contact
  layout.tsx            # Mounts AgentChat globally
  blog/                 # Article pages
  api/
    chat/               # Streaming chat endpoint for the site agent
    send/               # Contact-form email endpoint
components/
  AgentChat.tsx         # Chat overlay UI
  DJStation.tsx         # Two-deck audio player
  SnapScroll.tsx        # Snap container + section
  ...
lib/
  agentContext.ts       # System prompt + CV context for the site agent
  translations.ts       # EN / DE site copy
public/
  bg_pic/ projects/     # Static assets
```

## Run locally

```bash
pnpm install
pnpm dev          # starts at http://localhost:3000
```

Environment variables required at runtime:

- `ANTHROPIC_API_KEY` — for the site agent (`/api/chat`)
- `RESEND_API_KEY` — for the contact form (`/api/send`)

## Deploy

Auto-deploys to Vercel on push to `main`. Set the env vars above in the Vercel project's Production + Preview environments.

## Contributing

PRs welcome. Workflow:

```bash
git checkout -b feat/whatever
# make changes
git commit -m "feat: description"
git push -u origin feat/whatever
# open PR against main, squash-merge
```
