/**
 * Where Browser Run talks for Audio Clipping.
 *
 * - Empty / unset → same origin (Fly host, or local Docker)
 * - On Vercel marketing site, set NEXT_PUBLIC_CLIPS_API_BASE to the Fly app
 *   origin, e.g. https://aileena-clips.fly.dev
 *
 * Product/tools UI stays on aileena.xyz; yt-dlp/ffmpeg Run executes on Fly.
 */
export function clipsApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_CLIPS_API_BASE ?? '').trim().replace(/\/$/, '');
  return raw;
}

export function clipsApiUrl(path: string): string {
  const base = clipsApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

/** Turn a relative clip download path into an absolute URL when API is remote. */
export function clipsAssetUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return clipsApiUrl(pathOrUrl);
}
