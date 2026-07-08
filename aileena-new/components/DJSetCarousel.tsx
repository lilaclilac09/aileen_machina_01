'use client';

import { useState } from 'react';
import { DJ_SET_GENRE, DJ_SET_TRACKS, type DjSetTrack } from '../lib/djSetlist';
import styles from './DJSetCarousel.module.css';

function fmtTime(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '—:—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function TrackMeta({ track }: { track: DjSetTrack }) {
  return (
    <div className={styles.meta}>
      {track.bpm != null && (
        <span>
          BPM <b>{track.bpm}</b>
        </span>
      )}
      {track.key && (
        <span>
          KEY <b>{track.key}</b>
        </span>
      )}
      <span>
        TIME <b>{fmtTime(track.durationSec)}</b>
      </span>
    </div>
  );
}

export default function DJSetCarousel() {
  const [view, setView] = useState<'carousel' | 'list'>('carousel');
  const [focused, setFocused] = useState(0);
  const track = DJ_SET_TRACKS[focused];

  return (
    <section className={styles.root} aria-label="DJ set carousel">
      <div className={styles.wash} aria-hidden="true" />
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>DJ Set</p>
          <p className={styles.genre}>{DJ_SET_GENRE}</p>
        </div>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={view === 'carousel' ? styles.active : undefined}
            onClick={() => setView('carousel')}
          >
            Carousel
          </button>
          <button
            type="button"
            className={view === 'list' ? styles.active : undefined}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </header>

      {view === 'carousel' ? (
        <div className={styles.carousel}>
          {DJ_SET_TRACKS.map((t, i) => (
            <article
              key={t.id}
              className={`${styles.card} ${i === focused ? styles.focused : ''}`}
              onClick={() => setFocused(i)}
              onKeyDown={(e) => e.key === 'Enter' && setFocused(i)}
              tabIndex={0}
            >
              <div className={styles.trackId}>TRACK {t.id}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.cover} src={t.cover} alt="" loading="lazy" />
              <h3 className={styles.title}>{t.title}</h3>
              <p className={styles.artist}>{t.artist}</p>
              <TrackMeta track={t} />
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {DJ_SET_TRACKS.map((t, i) => (
            <div
              key={t.id}
              className={`${styles.listRow} ${i === focused ? styles.focused : ''}`}
              onClick={() => setFocused(i)}
              onKeyDown={(e) => e.key === 'Enter' && setFocused(i)}
              role="button"
              tabIndex={0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt="" />
              <div>
                <div className={styles.lid}>TRACK {t.id}</div>
                <strong>{t.title}</strong>
                <br />
                <span className={styles.artistInline}>{t.artist}</span>
              </div>
              <TrackMeta track={t} />
            </div>
          ))}
        </div>
      )}

      {track && (
        <div className={styles.detail}>
          <p className={styles.lid}>TRACK {track.id}</p>
          <h4 className={styles.detailTitle}>{track.title}</h4>
          <p className={styles.sub}>
            {track.artist}
            {track.album ? ` · ${track.album}` : ''}
          </p>
          <TrackMeta track={track} />
          {track.note && <p className={styles.note}>{track.note}</p>}
        </div>
      )}
    </section>
  );
}
