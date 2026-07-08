---
description: Add a Spotify track to the DJ-set carousel
argument-hint: <spotify-track-url> [| title | bpm | key | seconds]
---

Add the Spotify track at **$ARGUMENTS** to the DJ-set carousel.

The argument is a Spotify track URL, optionally followed by extra fields separated by `|`
(title, bpm, musical key, duration-in-seconds). Examples the user might type:

- `/addmusic https://open.spotify.com/track/3X9betUxSQLTAltImJZ3So`
- `/addmusic https://open.spotify.com/track/3X9betUxSQLTAltImJZ3So | 痛 | 128 | 6A | 214`

## Steps

1. **Extract the track ID.** It's the path segment after `/track/`, before any `?`.
   From `https://open.spotify.com/track/3X9betUxSQLTAltImJZ3So?si=...` the id is
   `3X9betUxSQLTAltImJZ3So`. If the input isn't a Spotify track URL, stop and ask for one.

2. **Search for the real song + cover art.** Resolve the track ID to its real title, artist,
   and album-cover URL — try these in order and stop at the first that returns data:
   - **Odesli / song.link** (one call returns title, artist, and artwork):
     `curl -s "https://api.song.link/v1-alpha.1/links?url=<track-url>"` → read
     `entitiesByUniqueId[*].title`, `.artistName`, `.thumbnailUrl`.
   - **Spotify oEmbed** (title + cover):
     `curl -s "https://open.spotify.com/oembed?url=<track-url>"` → `.title`, `.thumbnail_url`.
   - If `curl` is blocked, retry the same two URLs with the **WebFetch** tool.

   Use the fetched artwork URL as the real `thumb`, and the fetched title (strip a leading
   "Artist - " prefix if oEmbed includes one). Anything the user supplied after `|` overrides
   the fetched values. Defaults when a field is genuinely unknown: `bpm: 120`, `key: '4A'`,
   `dur: 200`.

   - **If every lookup is blocked:** `open.spotify.com` and `api.song.link` are often *not* in
     the web-session network allowlist (`curl` → "Host not in allowlist", `WebFetch` → 403). When
     that happens, fall back to `PLACEHOLDER_THUMB`, ask the user for the title, and tell them they
     can add those two hosts to the environment's network policy (or paste a cover URL) so the real
     art can be fetched. Either way the deck's Spotify iframe still renders the real album art at
     playback time, so the carousel thumb is never a blocker.

3. **Append the entry** to the `TRACKS` array in `aileena-new/components/DJStation.tsx`, right
   before the closing `];`. Match the existing formatting exactly:

   ```ts
   { id: '<ID>', title: '<TITLE>', bpm: <BPM>, key: '<KEY>', dur: <SECONDS>, thumb: '<COVER_URL>' },
   ```

   - Use the real `'<COVER_URL>'` you fetched in step 2 (a quoted string). Only substitute the
     bare `PLACEHOLDER_THUMB` token (no quotes) when no cover could be fetched.
   - If you use `PLACEHOLDER_THUMB`, confirm it's imported at the top of `DJStation.tsx`
     (`import TrackLibraryBrowser, { PLACEHOLDER_THUMB } from './TrackLibraryBrowser';`).
     If not, add it.
   - Don't duplicate a track that's already in the array (check the id first). If the id is
     already present but you now have a real cover, **update that entry's `thumb` in place**
     instead of appending a duplicate.

4. **Self-evolve carousel + memory:** `cd aileena-new && pnpm sync:carousel-evolve`
   - Appends the new track to `public/dj-set/setlist.json` (visible at `/dj-set/`)
   - Updates `aileena_second_brain/memories/semantic/setlist.md` and `prompts/music-taste.md`

5. **Build to verify:** `cd aileena-new && npm run build` (expect it to pass).

6. **Ship it** on a feature branch, per the repo's git workflow:
   ```bash
   git checkout -b chore/dj-add-<short-title-slug>
   git add aileena-new/components/DJStation.tsx aileena-new/public/dj-set/
   git add aileena-new/aileena_second_brain/memories/ aileena-new/aileena_second_brain/prompts/music-taste.md
   git commit -m "chore(dj): add <title> to deck + carousel memory"
   git push -u origin chore/dj-add-<short-title-slug>
   ```
   Then open a PR to `main` and squash-merge it via the GitHub MCP tools (this is a web session;
   there is no `gh` CLI). Report the PR URL back.

## Notes

- **Player** reads `DJStation.tsx` `TRACKS`; **carousel** (`/dj-set/`) reads `setlist.json` — kept in sync by `pnpm sync:carousel-evolve` (also runs on `pnpm build`).
- If the user pastes several links at once, add them all in one commit.
- Keep the array visually aligned the way it already is; it's hand-formatted.
