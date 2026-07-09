/** Curated DJ set — handoff tracks in DJ Station carousel (/sound#dj-set). */

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
  /** Spotify track id — deck playback when set */
  spotifyId?: string;
};

/** Deck / TrackLibraryBrowser shape */
export type DeckTrack = {
  id: string;
  spotifyId?: string;
  title: string;
  artist?: string;
  bpm: number;
  key: string;
  dur: number;
  thumb: string;
};

export function djSetToDeckTracks(): DeckTrack[] {
  return DJ_SET_TRACKS.map((t) => ({
    id: t.id,
    spotifyId: t.spotifyId,
    title: t.title,
    artist: t.artist,
    bpm: t.bpm ?? 120,
    key: t.key ?? '—',
    dur: t.durationSec ?? 200,
    thumb: t.cover,
  }));
}

export const DJ_SET_TRACKS: DjSetTrack[] = [
  {
    id: 'DAYDRM',
    title: 'Daydreaming',
    artist: 'Harry Styles',
    bpm: 120,
    key: '7B',
    cover: '/dj-set/assets/covers/daydrm.jpg',
    note: 'Atmosphere entry',
    spotifyId: '69w5X6uTrOaWM32IetSzvO',
  },
  {
    id: 'RAINFR',
    title: 'Rainforest',
    artist: 'John Beltran · Open House',
    album: 'Now & Then',
    cover: '/dj-set/assets/covers/rainfr.jpg',
  },
  {
    id: 'HIGHTD',
    title: 'High Tide',
    artist: 'John Beltran · Open House',
    album: 'Now & Then',
    cover: '/dj-set/assets/covers/hightd.jpg',
  },
  {
    id: 'INTOUCH',
    title: 'In Touch',
    artist: 'Beatrice M.',
    album: 'Sinking Plate 3',
    bpm: 140,
    key: '9A',
    cover: '/dj-set/assets/covers/intouch.jpg',
  },
  {
    id: 'RNDVZ',
    title: 'Rendezvous',
    artist: 'lovegold',
    cover: '/dj-set/assets/covers/rndvz.jpg',
  },
];
