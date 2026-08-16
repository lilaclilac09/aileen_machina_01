/** DJ set + full deck library for /sound#dj-set carousel. */

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
  artists?: string[];
  album?: string;
  bpm: number;
  key: string;
  dur: number;
  thumb: string;
  /** User-added Spotify search card — reference/preview, not mixable. */
  source?: 'spotify';
  previewUrl?: string | null;
  externalUrl?: string;
};

/** Curated handoff five — also mirrored in public/dj-set/setlist.json */
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

/**
 * Full Machina deck library that lived in DJStation before the handoff-only cut.
 * Spotify id is the track `id` (22-char). Keep these in the carousel with the handoff five.
 */
export const DECK_LIBRARY_TRACKS: DeckTrack[] = [
  // Dua Lipa — lyric "Need someone to hold me close" = Training Season
  // Covers vendored under /dj-set/assets/covers/dua-*.jpg (Spotify oEmbed art)
  {
    id: '0aYmkfcuxiLuCx906gze9I',
    title: 'Training Season',
    artist: 'Dua Lipa',
    bpm: 123,
    key: '8B',
    dur: 209,
    thumb: '/dj-set/assets/covers/dua-training-season.jpg',
  },
  {
    id: '1Qvo9ZyBWoedUiOc0zTCbm',
    title: 'Illusion',
    artist: 'Dua Lipa',
    bpm: 127,
    key: '4A',
    dur: 188,
    thumb: '/dj-set/assets/covers/dua-illusion.jpg',
  },
  {
    id: '6D8y7Bck8h11byRY88Pt2z',
    title: 'Houdini',
    artist: 'Dua Lipa',
    bpm: 117,
    key: '8A',
    dur: 185,
    thumb: '/dj-set/assets/covers/dua-houdini.jpg',
  },
  {
    id: '5XQRwVt27kpMePz10dfA5K',
    title: "Don't Start Now",
    artist: 'Dua Lipa',
    bpm: 124,
    key: '11A',
    dur: 183,
    thumb: '/dj-set/assets/covers/dua-dont-start-now.jpg',
  },
  {
    id: '1yaWyorMQLpRUNmKZlnACf',
    title: 'Physical',
    artist: 'Dua Lipa',
    bpm: 147,
    key: '7B',
    dur: 193,
    thumb: '/dj-set/assets/covers/dua-physical.jpg',
  },
  {
    id: '5nujrmhLynf4yMoMtj8AQF',
    title: 'Levitating (feat. DaBaby)',
    artist: 'Dua Lipa',
    bpm: 103,
    key: '6B',
    dur: 203,
    thumb: '/dj-set/assets/covers/dua-levitating.jpg',
  },
  {
    id: '1vYXt7VSjH9JIM5oRRo7vA',
    title: 'Dance The Night',
    artist: 'Dua Lipa',
    bpm: 110,
    key: '9B',
    dur: 176,
    thumb: '/dj-set/assets/covers/dua-dance-the-night.jpg',
  },
  {
    id: '5Q2HcjmL9kkHZ4IplboNGw',
    title: 'New Rules',
    artist: 'Dua Lipa',
    bpm: 116,
    key: '4A',
    dur: 209,
    thumb: '/dj-set/assets/covers/dua-new-rules.jpg',
  },
  // Remote Spotify/iTunes CDN thumbs + public-root jpgs → vendored locally (oEmbed art)
  {
    id: '189lkmwebOMpyLoyx1zkCS',
    title: 'Intro',
    artist: 'Yerin Baek',
    bpm: 112,
    key: '4A',
    dur: 102,
    thumb: '/dj-set/assets/covers/intro.jpg',
  },
  {
    id: '7Gi8h4mk92A5akMQBGnDXj',
    title: 'Berlin',
    artist: 'Yerin Baek',
    bpm: 125,
    key: '6A',
    dur: 200,
    thumb: '/dj-set/assets/covers/berlin.jpg',
  },
  {
    id: '4DBeUcBD2zVZzhf2oX1PLc',
    title: "I Can't Quit",
    artist: 'The Vaccines',
    bpm: 124,
    key: '2A',
    dur: 195,
    thumb: '/dj-set/assets/covers/i-cant-quit.jpg',
  },
  {
    id: '56NkIxSZZiMpFP5ZNSxtnT',
    title: 'Someday',
    artist: 'The Strokes',
    bpm: 120,
    key: '4A',
    dur: 212,
    thumb: '/dj-set/assets/covers/someday.jpg',
  },
  {
    id: '3CYFxT3dBwOd9Ap0zKXHk7',
    title: 'GALA',
    artist: 'XG',
    bpm: 128,
    key: '6B',
    dur: 178,
    thumb: '/dj-set/assets/covers/gala.jpg',
  },
  {
    id: '2pIUpMhHL6L9Z5lnKxJJr9',
    title: 'Attention',
    artist: 'NewJeans',
    bpm: 122,
    key: '8A',
    dur: 200,
    thumb: '/dj-set/assets/covers/attention.jpg',
  },
  {
    id: '1qbEfJ6F5Ryn1RYfJheZem',
    title: 'Late Night Job',
    artist: 'Turquoise Colored French Tourists',
    bpm: 118,
    key: '3A',
    dur: 225,
    thumb: '/dj-set/assets/covers/late-night-job.jpg',
  },
  {
    id: '3rw4HfYW3XJMSm11Z5Qn4c',
    title: 'Roses + Thorns',
    artist: 'Sepehr',
    bpm: 116,
    key: '9B',
    dur: 198,
    thumb: '/dj-set/assets/covers/roses-thorns.jpg',
  },
  {
    id: '7i1qsbXNf6C8Zdo3COMzJY',
    title: 'WISE',
    artist: 'voquote · reina · salasa',
    bpm: 129,
    key: '5A',
    dur: 204,
    thumb: '/dj-set/assets/covers/wise.jpg',
  },
  {
    id: '62PSNt68BxMaxl9U50PIdW',
    title: 'Crush On You',
    artist: 'Masiwei · Higher Brothers',
    bpm: 120,
    key: '4B',
    dur: 180,
    thumb: '/dj-set/assets/covers/crush-on-you.jpg',
  },
  {
    id: '3WwFjc24162Ab0WEN57y8t',
    title: 'Recall',
    artist: 'Jay Park',
    bpm: 122,
    key: '6A',
    dur: 195,
    thumb: '/dj-set/assets/covers/recall.jpg',
  },
  {
    id: '0DO0NtFn6hB4Brt44Z8Tkz',
    title: '扉をあけて',
    artist: 'ANZA',
    bpm: 118,
    key: '3B',
    dur: 240,
    thumb: '/dj-set/assets/covers/tobira.jpg',
  },
  {
    id: '6Yj8kVuVR3UPxx9r5eFEoV',
    title: 'Miniskirt',
    artist: 'AOA',
    bpm: 128,
    key: '7B',
    dur: 210,
    thumb: '/dj-set/assets/covers/miniskirt.jpg',
  },
  {
    id: '4UBt00S6TNsKwgfxMcfNal',
    title: 'Let Me Be With You',
    artist: 'ROUND TABLE featuring Nino',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/let-me-be-with-you.jpg',
  },
  {
    id: '4XRaGryj589Fee9HqIDwup',
    title: 'Count What You Have Now',
    artist: 'Vantage',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/count-what-you-have-now.jpg',
  },
  {
    id: '4rrlf0gsr4dFJe6534PhZG',
    title: 'Mujin no Shima',
    artist: 'Miho Karasawa',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/mujin-no-shima.jpg',
  },
  {
    id: '69xZrRwScYMhlCMcxrF958',
    title: 'Luxurious',
    artist: 'Gwen Stefani',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/luxurious.jpg',
  },
  {
    id: '1mBzeQjQPxdT693fIlmA4k',
    title: 'Small City',
    artist: 'Future Girlfriend Music',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/small-city.jpg',
  },
  {
    id: '5RUJ1B8Yrh7w4PT0W8KVPk',
    title: 'Ba-Da-Ba',
    artist: '2 Mello',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/ba-da-ba.jpg',
  },
  // Was PLACEHOLDER — covers vendored under /dj-set/assets/covers/*.jpg (Spotify oEmbed)
  {
    id: '03Y3K0S8WLjyvV7Z2qSdlh',
    title: 'Surface',
    artist: 'Substance · Vainqueur',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/surface.jpg',
  },
  {
    id: '3X9betUxSQLTAltImJZ3So',
    title: 'Double Scoop',
    artist: 'Shed',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/double-scoop.jpg',
  },
  {
    id: '4zDmVNxz1t4zwHqasJt8LT',
    title: 'Jazz Is the Teacher',
    artist: '3MB · Magic Juan Atkins',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/jazz-is-the-teacher.jpg',
  },
  {
    id: '1qEmFfgcLObUfQm0j1W2CK',
    title: 'Late Night Talking',
    artist: 'Harry Styles',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/late-night-talking.jpg',
  },
  {
    id: '2IOFZdYYkFxEHVz1w34PoL',
    title: 'Cherry',
    artist: 'Harry Styles',
    bpm: 120,
    key: '4A',
    dur: 200,
    thumb: '/dj-set/assets/covers/cherry.jpg',
  },
];

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

/** Everything shown in the /sound deck carousel: handoff five + full library. */
export function allDeckTracks(): DeckTrack[] {
  return [...djSetToDeckTracks(), ...DECK_LIBRARY_TRACKS];
}
