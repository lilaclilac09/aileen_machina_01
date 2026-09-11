'use client';

import type { DuoMode, DuoTrack } from '../../lib/duoObject';

type Props = {
  mode: DuoMode;
  track: DuoTrack;
  clock: string;
  playing: boolean;
  progress: number;
  onTogglePlay: () => void;
};

/** Front face. Tent = album object. Hold = usable. Rest = clock lamp. */
export default function ScreenA({ mode, track, clock, playing, progress, onTogglePlay }: Props) {
  if (mode === 'rest') {
    return (
      <div className="duo-screen" data-face="clock">
        <div className="duo-hold" style={{ justifyContent: 'center', paddingTop: 36 }}>
          <span className="duo-clock">{clock}</span>
          <span className="duo-clock-sub">bedside</span>
        </div>
      </div>
    );
  }

  if (mode === 'hold') {
    return (
      <div className="duo-screen" data-face="hold">
        <div className="duo-hold">
          <div className="duo-hold-row">
            <img className="duo-hold-art" src={track.cover} alt="" />
            <div className="duo-hold-copy">
              <strong>{track.title}</strong>
              <em>{track.artist}</em>
            </div>
          </div>
          <div className="duo-progress" aria-hidden>
            <i style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <button
            type="button"
            className="duo-play"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
          >
            {playing ? 'hold' : 'play'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="duo-screen" data-face="album">
      <img className="duo-cover" src={track.cover} alt="" />
      <div className="duo-meta">
        <strong>{track.title}</strong>
        <em>{track.artist}</em>
      </div>
    </div>
  );
}
