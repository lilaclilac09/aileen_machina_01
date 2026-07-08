/** Curated DJ set — handoff tracks only (carousel on /sound#dj-set). */

export const DJ_SET_GENRE =
  'Techno (personal): harder driving techno — DVS1, Blawan, Rødhåd';

export type DjSetTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  bpm?: number | null;
  key?: string | null;
  durationSec?: number | null;
  cover: string;
  note?: string;
};

export const DJ_SET_TRACKS: DjSetTrack[] = [
  {
    id: 'DAYDRM',
    title: 'Daydreaming',
    artist: 'Harry Styles',
    bpm: 120,
    key: '7B',
    cover: '/dj-set/assets/covers/daydrm.svg',
    note: 'Atmosphere entry',
  },
  {
    id: 'RAINFR',
    title: 'Rainforest',
    artist: 'John Beltran · Open House',
    album: 'Now & Then',
    cover: '/dj-set/assets/covers/rainfr.svg',
  },
  {
    id: 'HIGHTD',
    title: 'High Tide',
    artist: 'John Beltran · Open House',
    album: 'Now & Then',
    cover: '/dj-set/assets/covers/hightd.svg',
  },
  {
    id: 'INTOUCH',
    title: 'In Touch',
    artist: 'Beatrice M.',
    album: 'Sinking Plate 3',
    bpm: 140,
    key: '9A',
    cover: '/dj-set/assets/covers/intouch.svg',
  },
  {
    id: 'RNDVZ',
    title: 'Rendezvous',
    artist: 'lovegold',
    cover: '/dj-set/assets/covers/rndvz.svg',
  },
];
