/**
 * Mixable = playable audioSrc (demo / local / CORS URL).
 * Spotify covers and catalogue art are reference only.
 */

export type MixSource = 'local' | 'demo' | 'spotify' | 'external';

export type MixableTrackShape = {
  mixable?: boolean;
  source?: MixSource | string;
  audioSrc?: string | null;
};

export function isMixableTrack(track: MixableTrackShape): boolean {
  if (track.mixable === false) return false;
  if (track.source === 'spotify') return false;
  return typeof track.audioSrc === 'string' && track.audioSrc.length > 0;
}
