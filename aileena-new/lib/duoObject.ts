/** iPhone Duo as a bedside object — skins, light, tracks. Layout only. */

export type DuoMode = 'tent' | 'hold' | 'rest';
export type DuoSkin = 'heat' | 'kiln' | 'ember' | 'aurora' | 'signal';
export type DuoLight = 'music' | 'clock' | 'notify' | 'charge';

export type DuoTrack = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  /** `H S% L%` for hsl() */
  hue: string;
};

export type DuoSkinSpec = {
  id: DuoSkin;
  label: string;
  intent: string;
  room: string;
  window: string;
  desk: string;
  mist: string;
  fallbackHue: string;
};

export const DUO_TRACKS: DuoTrack[] = [
  {
    id: 'heat',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    cover: '/dj-set/assets/covers/heatwv.svg',
    hue: '328 78% 58%',
  },
  {
    id: 'day',
    title: 'Daydreaming',
    artist: 'Harry Styles',
    cover: '/dj-set/assets/covers/daydrm.svg',
    hue: '168 62% 48%',
  },
  {
    id: 'touch',
    title: 'In Touch',
    artist: 'Beatrice M.',
    cover: '/dj-set/assets/covers/intouch.svg',
    hue: '210 54% 58%',
  },
  {
    id: 'rain',
    title: 'Rainforest',
    artist: 'John Beltran',
    cover: '/dj-set/assets/covers/rainfr.svg',
    hue: '152 40% 42%',
  },
];

export const DUO_SKINS: DuoSkinSpec[] = [
  {
    id: 'heat',
    label: 'heat',
    intent: 'Bedroom object, magenta leak, Heat Waves as default.',
    room: '#07040c',
    window: '#1a1840',
    desk: '#141018',
    mist: 'rgba(40, 16, 48, 0.55)',
    fallbackHue: '328 78% 58%',
  },
  {
    id: 'kiln',
    label: 'kiln',
    intent: 'Aileena cream/teal, glass still warm from the kiln.',
    room: '#070a09',
    window: '#14322e',
    desk: '#121614',
    mist: 'rgba(16, 40, 36, 0.5)',
    fallbackHue: '168 55% 42%',
  },
  {
    id: 'ember',
    label: 'ember',
    intent: 'Nightlight first. Warm red, clock-adjacent even when music plays.',
    room: '#0a0604',
    window: '#2a1410',
    desk: '#18110c',
    mist: 'rgba(48, 18, 10, 0.55)',
    fallbackHue: '12 82% 50%',
  },
  {
    id: 'aurora',
    label: 'aurora',
    intent: 'Cold window, short-focus product shot, ice rim.',
    room: '#040814',
    window: '#1a3a55',
    desk: '#0e141c',
    mist: 'rgba(12, 28, 48, 0.55)',
    fallbackHue: '204 72% 58%',
  },
  {
    id: 'signal',
    label: 'signal',
    intent: 'Quiet cyan pulse. Notification as light, not a banner.',
    room: '#06080c',
    window: '#0e2230',
    desk: '#101418',
    mist: 'rgba(10, 28, 36, 0.5)',
    fallbackHue: '188 78% 54%',
  },
];

export const DUO_LIGHTS: { id: DuoLight; label: string; intent: string }[] = [
  { id: 'music', label: 'music', intent: 'Hue follows the cover. Music as purple-red unless the track is cooler.' },
  { id: 'clock', label: 'clock', intent: 'Warm red / amber. Time is the third screen.' },
  { id: 'notify', label: 'notify', intent: 'Short pulse. No copy, no badge.' },
  { id: 'charge', label: 'charge', intent: 'Slow breath. Object is plugged in, not sleeping.' },
];

export const DUO_MODES: { id: DuoMode; label: string; intent: string }[] = [
  { id: 'tent', label: 'tent', intent: 'Stand on the desk. Album faces you. Light leaks the hinge and back.' },
  { id: 'hold', label: 'hold', intent: 'Lifted. Density and brightness rise together. Playback, not a new page.' },
  { id: 'rest', label: 'rest', intent: 'Almost closed. Clock + low light. Night lamp, not a locked phone.' },
];

export function skinById(id: DuoSkin): DuoSkinSpec {
  return DUO_SKINS.find((s) => s.id === id) ?? DUO_SKINS[0];
}

export function trackById(id: string): DuoTrack {
  return DUO_TRACKS.find((t) => t.id === id) ?? DUO_TRACKS[0];
}

export function lightHue(light: DuoLight, track: DuoTrack, skin: DuoSkinSpec): string {
  if (light === 'clock') return '12 82% 50%';
  if (light === 'notify') return '188 78% 62%';
  if (light === 'charge') return '32 90% 54%';
  return track.hue || skin.fallbackHue;
}

export function lightPeriod(light: DuoLight): string {
  if (light === 'notify') return '1.6s';
  if (light === 'charge') return '4.8s';
  return '3.4s';
}
