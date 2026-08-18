/** Shared Sound Lab load rules — carousel, drop, and upload all use these. */

export type MixSource = {
  audioSrc?: string | null;
  source?: 'spotify' | string;
  mixable?: boolean;
  previewUrl?: string | null;
  spotifyId?: string | null;
};

export function isReferenceTrack(t: MixSource | null | undefined): boolean {
  if (!t) return false;
  if (t.mixable === true && t.audioSrc) return false;
  if (t.source === 'spotify' || t.mixable === false) return true;
  if (!t.audioSrc && (t.previewUrl || t.spotifyId)) return true;
  return false;
}

/** Local/static audio that can enter the mix graph. Spotify preview_url is not this. */
export function isMixableTrack(t: MixSource | null | undefined): boolean {
  if (!t) return false;
  return Boolean(t.audioSrc) && !isReferenceTrack(t);
}
