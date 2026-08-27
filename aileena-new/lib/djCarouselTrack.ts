/** Carousel + plate playback model. Mixable only when a real audioSrc exists. */

export type CarouselSource = 'catalog' | 'local' | 'ref' | 'demo';

export type CarouselTrack = {
  id: string;
  title: string;
  artist?: string;
  source: CarouselSource;
  audioSrc?: string;
  coverSrc?: string;
  href?: string;
  bpm?: number;
  duration?: number;
  mixable: boolean;
  referenceOnly: boolean;
  /** Compat with existing deck/carousel UI */
  thumb: string;
  key: string;
  dur: number;
  spotifyId?: string;
};

const AUDIO_FILE = /\.(mp3|wav|ogg|oga|m4a|aac|flac|webm)(\?|#|$)/i;
const PAGE_HOSTS = /(^|\.)(spotify\.com|youtube\.com|youtu\.be|soundcloud\.com|open\.spotify\.com)$/i;

export function hasPlayableAudioSrc(src?: string | null): boolean {
  if (!src) return false;
  if (src.startsWith('blob:') || src.startsWith('data:audio')) return true;
  try {
    if (src.startsWith('/')) return AUDIO_FILE.test(src);
    const u = new URL(src);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (PAGE_HOSTS.test(u.hostname)) return false;
    return AUDIO_FILE.test(u.pathname);
  } catch {
    return false;
  }
}

export function markMixable(track: Omit<CarouselTrack, 'mixable' | 'referenceOnly'> & {
  mixable?: boolean;
  referenceOnly?: boolean;
}): CarouselTrack {
  const mixable = Boolean(track.audioSrc && hasPlayableAudioSrc(track.audioSrc));
  return {
    ...track,
    mixable,
    referenceOnly: !mixable,
    thumb: track.coverSrc || track.thumb || '',
    coverSrc: track.coverSrc || track.thumb,
    dur: track.duration ?? track.dur ?? 0,
    key: track.key || '—',
    bpm: track.bpm ?? 0,
    source: track.source,
  };
}

export function asCatalogRef(t: {
  id: string;
  title: string;
  artist?: string;
  bpm?: number | null;
  key?: string | null;
  dur?: number | null;
  thumb?: string;
  cover?: string;
  spotifyId?: string;
}): CarouselTrack {
  const cover = t.thumb || t.cover || '';
  const href = t.spotifyId
    ? `https://open.spotify.com/track/${t.spotifyId}`
    : /^[a-zA-Z0-9]{22}$/.test(t.id)
      ? `https://open.spotify.com/track/${t.id}`
      : undefined;
  return markMixable({
    id: t.id,
    title: t.title,
    artist: t.artist,
    source: 'catalog',
    coverSrc: cover,
    thumb: cover,
    href,
    bpm: t.bpm ?? 0,
    duration: t.dur ?? 0,
    dur: t.dur ?? 0,
    key: t.key ?? '—',
    spotifyId: t.spotifyId,
  });
}

export function textCoverDataUri(title: string, badge: string): string {
  const t = xml(title.slice(0, 28) || 'audio');
  const b = xml(badge.slice(0, 10) || 'local');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#0b0d10"/>
    <circle cx="150" cy="150" r="92" fill="none" stroke="#00a89d" stroke-opacity="0.35" stroke-width="2"/>
    <text x="24" y="42" font-family="ui-monospace,monospace" font-size="16" fill="#00a89d" letter-spacing="3">${b}</text>
    <text x="24" y="168" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" fill="#fffdf8">${t}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function xml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sourceBadge(track: CarouselTrack): 'local' | 'demo' | 'ref' | 'no audio' {
  if (!track.mixable) return track.referenceOnly ? 'ref' : 'no audio';
  if (track.source === 'local' || track.audioSrc?.startsWith('blob:')) return 'local';
  return 'demo';
}
