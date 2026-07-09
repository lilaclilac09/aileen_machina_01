/** DJ set + full deck library for /sound#dj-set carousel. */

const PLACEHOLDER_THUMB =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='300'%20height='300'%3E%3Crect%20width='300'%20height='300'%20fill='%230b0d10'/%3E%3Ccircle%20cx='150'%20cy='150'%20r='118'%20fill='none'%20stroke='%2300ffea'%20stroke-opacity='0.22'/%3E%3Ccircle%20cx='150'%20cy='150'%20r='78'%20fill='none'%20stroke='%2300ffea'%20stroke-opacity='0.15'/%3E%3Ctext%20x='150'%20y='172'%20font-family='monospace'%20font-size='44'%20fill='%2300ffea'%20fill-opacity='0.4'%20text-anchor='middle'%3E%E2%99%AA%3C/text%3E%3C/svg%3E";

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
  { id: '189lkmwebOMpyLoyx1zkCS', title: 'Intro', bpm: 112, key: '4A', dur: 102, thumb: 'https://i.scdn.co/image/ab67616d0000b273fca7f5aebfb6010c6da60e00' },
  { id: '7Gi8h4mk92A5akMQBGnDXj', title: 'Berlin', bpm: 125, key: '6A', dur: 200, thumb: '/berlin.jpg' },
  { id: "4DBeUcBD2zVZzhf2oX1PLc", title: "I Can't Quit", bpm: 124, key: '2A', dur: 195, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028508f29ab91bfcce74f86ef5' },
  { id: '56NkIxSZZiMpFP5ZNSxtnT', title: 'Someday', bpm: 120, key: '4A', dur: 212, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0213f2466b83507515291acce4' },
  { id: '3CYFxT3dBwOd9Ap0zKXHk7', title: 'GALA', bpm: 128, key: '6B', dur: 178, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c1456e351abb6d5b1a8ffbef' },
  { id: '2pIUpMhHL6L9Z5lnKxJJr9', title: 'Attention', bpm: 122, key: '8A', dur: 200, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029d28fd01859073a3ae6ea209' },
  { id: '1qbEfJ6F5Ryn1RYfJheZem', title: 'Late Night Job', bpm: 118, key: '3A', dur: 225, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e023108f7d165756b51d81ea3ba' },
  { id: '7b1uaIR2va05jHG5fnVbMu', title: 'Lab Rat 3', bpm: 130, key: '5B', dur: 185, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02fad7ae8dfc681c2f9f8333ef' },
  { id: '2lFp0xJL7yGD7CtiQPqpwb', title: '700358bc5', bpm: 126, key: '7A', dur: 210, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0214e8b7396634f604692c67ff' },
  { id: '3rw4HfYW3XJMSm11Z5Qn4c', title: 'Roses + Thorns', bpm: 116, key: '9B', dur: 198, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0225de4144381ec14d111c5380' },
  { id: '7i1qsbXNf6C8Zdo3COMzJY', title: 'WISE', bpm: 129, key: '5A', dur: 204, thumb: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/b3/73/e9/b373e9b8-9ead-e9a7-0825-f8d8a30dabd6/3617221727448_cover.png/600x600bb.jpg' },
  { id: '62PSNt68BxMaxl9U50PIdW', title: 'Crush On You', bpm: 120, key: '4B', dur: 180, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02f3d67ea5769af25963f86120' },
  { id: '3WwFjc24162Ab0WEN57y8t', title: 'Recall', bpm: 122, key: '6A', dur: 195, thumb: '/recall.jpg' },
  { id: '0DO0NtFn6hB4Brt44Z8Tkz', title: '扉をあけて', bpm: 118, key: '3B', dur: 240, thumb: '/tobira.jpg' },
  { id: '6Yj8kVuVR3UPxx9r5eFEoV', title: 'Miniskirt', bpm: 128, key: '7B', dur: 210, thumb: '/miniskirt.jpg' },
  { id: '4UBt00S6TNsKwgfxMcfNal', title: 'Let Me Be With You', bpm: 120, key: '4A', dur: 200, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e026ccb362e8e30b8a214b65be7' },
  { id: '4XRaGryj589Fee9HqIDwup', title: 'Count What You Have Now', bpm: 120, key: '4A', dur: 200, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0259075304010757bf60fb7f61' },
  { id: '4rrlf0gsr4dFJe6534PhZG', title: 'Mujin no Shima', bpm: 120, key: '4A', dur: 200, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0225177555cad370de26a2e96b' },
  { id: '69xZrRwScYMhlCMcxrF958', title: 'Luxurious', bpm: 120, key: '4A', dur: 200, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e027c7136a182372ccdffb3d3c4' },
  { id: '1mBzeQjQPxdT693fIlmA4k', title: 'Small City', bpm: 120, key: '4A', dur: 200, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02722d5a45a1f8246fd620cb22' },
  { id: '5RUJ1B8Yrh7w4PT0W8KVPk', title: 'Ba-Da-Ba', bpm: 120, key: '4A', dur: 200, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0252f54296b90eee374de846e3' },
  { id: '5ANaCqoIl0gQyphoYTaQAj', title: 'Ha Jam', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
  { id: '03Y3K0S8WLjyvV7Z2qSdlh', title: 'Surface', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
  { id: '5i18ZFR4g3xC4uHlNFHkGH', title: 'Ottagone 013', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
  { id: '3X9betUxSQLTAltImJZ3So', title: 'Double Scoop', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
  { id: '4zDmVNxz1t4zwHqasJt8LT', title: 'Jazz Is the Teacher', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
  { id: '1qEmFfgcLObUfQm0j1W2CK', title: 'Late Night Talking', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
  { id: '2IOFZdYYkFxEHVz1w34PoL', title: 'Cherry', bpm: 120, key: '4A', dur: 200, thumb: PLACEHOLDER_THUMB },
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
