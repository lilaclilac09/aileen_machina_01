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

2. **Gather metadata.**
   - If the user supplied fields after `|`, use them (title / bpm / key / seconds).
   - Otherwise, try to fetch title + duration from Spotify oEmbed:
     `curl -s "https://open.spotify.com/oembed?url=<track-url>"` → the `title` field.
     **Note:** the sandbox network policy usually blocks `open.spotify.com` ("Host not in
     allowlist"). If the fetch fails, that's expected — ask the user for the title (one line),
     and use the defaults below for the rest. Never block on the cover art.
   - Defaults when a field is unknown: `bpm: 120`, `key: '4A'`, `dur: 200`.
   - **Cover art:** always use `PLACEHOLDER_THUMB` (imported in `DJStation.tsx`). The deck's
     Spotify iframe shows the real album art at playback time; the carousel thumb is cosmetic
     and the placeholder is on-brand. Only use a real `https://...spotifycdn.com/...` thumb URL
     if the user explicitly pastes one.

3. **Append the entry** to the `TRACKS` array in `aileena-new/components/DJStation.tsx`, right
   before the closing `];`. Match the existing formatting exactly:

   ```ts
   { id: '<ID>', title: '<TITLE>', bpm: <BPM>, key: '<KEY>', dur: <SECONDS>, thumb: PLACEHOLDER_THUMB },
   ```

   - Confirm `PLACEHOLDER_THUMB` is already imported at the top of `DJStation.tsx`
     (`import TrackLibraryBrowser, { PLACEHOLDER_THUMB } from './TrackLibraryBrowser';`).
     If not, add it.
   - Don't duplicate a track that's already in the array (check the id first).

4. **Build to verify:** `cd aileena-new && npm run build` (expect it to pass).

5. **Ship it** on a feature branch, per the repo's git workflow:
   ```bash
   git checkout -b chore/dj-add-<short-title-slug>
   git add aileena-new/components/DJStation.tsx
   git commit -m "chore(dj): add <title> to the carousel"
   git push -u origin chore/dj-add-<short-title-slug>
   ```
   Then open a PR to `main` and squash-merge it via the GitHub MCP tools (this is a web session;
   there is no `gh` CLI). Report the PR URL back.

## Notes

- The carousel and the two-deck player both read from the same `TRACKS` array — adding one entry
  surfaces it everywhere.
- If the user pastes several links at once, add them all in one commit.
- Keep the array visually aligned the way it already is; it's hand-formatted.
