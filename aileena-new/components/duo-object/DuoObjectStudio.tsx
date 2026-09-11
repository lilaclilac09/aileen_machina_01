'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  lightHue,
  lightPeriod,
  skinById,
  trackById,
  type DuoLight,
  type DuoMode,
  type DuoSkin,
} from '../../lib/duoObject';
import DeskScene from './DeskScene';
import DeviceShell from './DeviceShell';
import ModeController from './ModeController';
import ScreenA from './ScreenA';
import ScreenB from './ScreenB';
import VariantPicker from './VariantPicker';
import './duo-object.css';

const BEDSIDE_CLOCK = '07:04';

export default function DuoObjectStudio() {
  const [mode, setMode] = useState<DuoMode>('tent');
  const [skin, setSkin] = useState<DuoSkin>('heat');
  const [light, setLight] = useState<DuoLight>('music');
  const [trackId, setTrackId] = useState('heat');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.18);

  const spec = skinById(skin);
  const track = trackById(trackId);
  const hue = useMemo(() => lightHue(light, track, spec), [light, track, spec]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 0.96 ? 0.04 : p + 0.012));
    }, 400);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setMode('tent');
      if (e.key === '2') setMode('hold');
      if (e.key === '3') setMode('rest');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="duo-root"
      data-duo-mode={mode}
      data-duo-skin={skin}
      data-duo-light={light}
      data-duo-track={track.id}
      style={{
        ['--duo-hue' as string]: hue,
        ['--duo-period' as string]: lightPeriod(light),
        ['--duo-room' as string]: spec.room,
        ['--duo-window' as string]: spec.window,
        ['--duo-desk' as string]: spec.desk,
        ['--duo-mist' as string]: spec.mist,
      }}
    >
      <div className="duo-grain" />
      <div className="duo-vignette" />
      <p className="duo-hint">object · not a phone</p>

      <DeskScene onDesk={() => setMode('tent')}>
        <DeviceShell
          mode={mode}
          onPickUp={() => setMode((m) => (m === 'hold' ? 'tent' : 'hold'))}
          onRest={() => setMode('rest')}
          childrenA={
            <ScreenA
              mode={mode}
              track={track}
              clock={BEDSIDE_CLOCK}
              playing={playing}
              progress={progress}
              onTogglePlay={() => {
                setPlaying((v) => !v);
                setLight('music');
                if (mode !== 'hold') setMode('hold');
              }}
            />
          }
          childrenB={<ScreenB />}
        />
      </DeskScene>

      <footer className="duo-dock">
        <div>
          <ModeController mode={mode} onMode={setMode} />
          <VariantPicker
            skin={skin}
            light={light}
            trackId={track.id}
            onSkin={setSkin}
            onLight={setLight}
            onTrack={(id) => {
              setTrackId(id);
              setLight('music');
              setProgress(0.12);
            }}
          />
        </div>
        <Link className="duo-back" href="/sound">
          ← decks
        </Link>
      </footer>
    </div>
  );
}
