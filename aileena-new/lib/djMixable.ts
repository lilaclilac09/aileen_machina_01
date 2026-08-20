/**
 * Mixable = local upload, bundled demo, or CORS-safe audio URL.
 * Spotify (including Premium / preview_url) is reference only — never a mix source.
 */

const MIX_EXTS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm']);

export const MIX_FILE_ACCEPT =
  '.mp3,.wav,.m4a,.aac,.ogg,.webm,audio/mpeg,audio/wav,audio/x-wav,audio/wave,audio/mp4,audio/aac,audio/ogg,audio/webm';

export type MixableTrackShape = {
  mixable?: boolean;
  source?: string;
  audioUrl?: string | null;
};

export function isMixableTrack(track: MixableTrackShape): boolean {
  if (track.mixable === false) return false;
  if (track.source === 'spotify') return false;
  return typeof track.audioUrl === 'string' && track.audioUrl.length > 0;
}

export function isSpotifyAudioUrl(url: string): boolean {
  return /scdn\.co|spotify\.com|spotify:track/i.test(url);
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function isSupportedMixFile(file: { name: string; type: string }): boolean {
  const ext = fileExtension(file.name);
  if (ext && MIX_EXTS.has(ext)) return true;
  if (/flac|aiff|aif|wma|midi|mid/.test(ext)) return false;
  if (file.type.startsWith('audio/') && !/flac|midi/.test(file.type)) return true;
  return false;
}

export function isLikelyUnsupportedAudio(file: { name: string; type: string }): boolean {
  if (isSupportedMixFile(file)) return false;
  const ext = fileExtension(file.name);
  if (file.type.startsWith('audio/')) return true;
  return /^(flac|aiff|aif|wma|mid|midi)$/.test(ext);
}
