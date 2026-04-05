'use client';

import { useState, useRef } from 'react';

type Format = 'VINYL' | 'CD';

// Replace `cover` with your real image paths under /public/albums/
const ALBUMS = [
  { id: 0, title: 'R-CNVX2',    artist: 'Convextion',                         cover: '/albums/01-convextion.jpg', color: '#b8724a' },
  { id: 1, title: 'Monaco EP',  artist: 'Turquoise Colored French Tourists',  cover: '/albums/02-monaco.jpg',     color: '#cc2211' },
  { id: 2, title: 'Album 03',   artist: 'Artist',                             cover: '',                          color: '#4a6a8a' },
  { id: 3, title: 'Album 04',   artist: 'Artist',                             cover: '',                          color: '#7a4a8a' },
  { id: 4, title: 'Album 05',   artist: 'Artist',                             cover: '',                          color: '#4a6a3a' },
];

export default function VinylSelector() {
  const [format, setFormat] = useState<Format>('CD');
  const [active, setActive] = useState(2);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startActive = useRef(2);

  const N = ALBUMS.length;

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    startX.current = e.clientX;
    startActive.current = active;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const step = Math.round(-dx / 80);
    const next = Math.max(0, Math.min(N - 1, startActive.current + step));
    setActive(next);
  }

  function onPointerUp() {
    setDragging(false);
  }

  // card geometry
  function cardStyle(i: number): React.CSSProperties {
    const offset = i - active;
    const absOff = Math.abs(offset);
    const isActive = offset === 0;

    if (format === 'CD') {
      // Fan spread: each card rotates and translates
      const rotateY = offset * -22;
      const translateX = offset * 68;
      const translateZ = -absOff * 60;
      const scale = isActive ? 1 : 0.82 - absOff * 0.05;
      const opacity = absOff > 3 ? 0 : 1 - absOff * 0.18;
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 180,
        height: 180,
        marginLeft: -90,
        marginTop: -90,
        borderRadius: '50%',
        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        zIndex: N - absOff,
        transition: dragging ? 'none' : 'all 0.45s cubic-bezier(0.25,1,0.5,1)',
        cursor: isActive ? 'default' : 'pointer',
      };
    } else {
      // Vinyl: flat fan like flipping through records
      const rotate = offset * 12;
      const translateX = offset * 40;
      const scale = isActive ? 1 : 0.88 - absOff * 0.04;
      const opacity = absOff > 3 ? 0 : 1 - absOff * 0.2;
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 200,
        height: 200,
        marginLeft: -100,
        marginTop: -100,
        borderRadius: '50%',
        transform: `translateX(${translateX}px) rotate(${rotate}deg) scale(${scale})`,
        opacity,
        zIndex: N - absOff,
        transition: dragging ? 'none' : 'all 0.45s cubic-bezier(0.25,1,0.5,1)',
        cursor: isActive ? 'default' : 'pointer',
      };
    }
  }

  const current = ALBUMS[active];

  return (
    <div>
      {/* Format toggle */}
      <div className="flex gap-0 mb-14">
        {(['VINYL', 'CD'] as Format[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-6 py-2 text-[0.6rem] uppercase tracking-[0.45em] border-b-[1.5px] transition-all ${
              format === f
                ? 'text-[#00ffea] border-[#00ffea]'
                : 'text-white/25 border-white/8 hover:text-white/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Stage */}
      <div className="flex flex-col items-center gap-12">
        <div
          className="relative"
          style={{ width: 480, height: 220, perspective: 900, touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {ALBUMS.map((album, i) => (
            <div
              key={album.id}
              style={cardStyle(i)}
              onClick={() => { if (i !== active) setActive(i); }}
            >
              {format === 'CD' ? (
                <CDDisc album={album} isActive={i === active} />
              ) : (
                <VinylDisc album={album} isActive={i === active} />
              )}
            </div>
          ))}
        </div>

        {/* Dots nav */}
        <div className="flex gap-3">
          {ALBUMS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="w-1 h-1 rounded-full transition-all"
              style={{
                background: i === active ? '#00ffea' : 'rgba(255,255,255,0.2)',
                transform: i === active ? 'scale(1.8)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Active label */}
        <div className="text-center" style={{ minHeight: 40 }}>
          <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/80">{current.title}</p>
          <p className="mt-1 text-[0.58rem] uppercase tracking-[0.3em] text-white/30">{current.artist}</p>
        </div>
      </div>
    </div>
  );
}

function CDDisc({ album, isActive }: { album: typeof ALBUMS[0]; isActive: boolean }) {
  return (
    <div className="w-full h-full rounded-full relative overflow-hidden" style={{
      background: album.cover ? undefined : `radial-gradient(circle at 35% 35%, ${album.color} 0%, #1a1a1a 60%, #0a0a0a 100%)`,
      boxShadow: isActive
        ? '0 0 0 1.5px rgba(0,255,234,0.5), 0 0 40px rgba(0,255,234,0.25), 0 20px 60px rgba(0,0,0,0.8)'
        : '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      {album.cover && (
        <img src={album.cover} alt={album.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* Iridescent sheen */}
      <div className="absolute inset-0 rounded-full" style={{
        background: 'conic-gradient(from 120deg, rgba(255,255,255,0.12), transparent 30%, rgba(0,255,234,0.08), transparent 60%, rgba(255,100,200,0.06), transparent 90%, rgba(255,255,255,0.12))',
      }} />
      {/* Inner rings */}
      {[30, 45, 60, 75].map(r => (
        <div key={r} className="absolute rounded-full" style={{
          inset: `${r}%`, border: '1px solid rgba(255,255,255,0.06)',
        }} />
      ))}
      {/* Center hole */}
      <div className="absolute rounded-full bg-black" style={{
        width: '14%', height: '14%', top: '43%', left: '43%',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.12)',
      }} />
    </div>
  );
}

function VinylDisc({ album, isActive }: { album: typeof ALBUMS[0]; isActive: boolean }) {
  return (
    <div className="w-full h-full rounded-full relative" style={{
      background: 'radial-gradient(circle, #1c1c1c 0%, #0a0a0a 100%)',
      boxShadow: isActive
        ? '0 0 0 1.5px rgba(0,255,234,0.4), 0 20px 60px rgba(0,0,0,0.9)'
        : '0 8px 32px rgba(0,0,0,0.8)',
    }}>
      {/* Groove lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          inset: `${8 + i * 6}%`,
          border: '1px solid rgba(255,255,255,0.04)',
        }} />
      ))}
      {/* Center label */}
      <div className="absolute rounded-full flex items-center justify-center" style={{
        inset: '28%',
        background: `radial-gradient(circle, ${album.color}30 0%, #111 100%)`,
        border: `1px solid ${album.color}40`,
      }}>
        {album.cover && (
          <img src={album.cover} alt={album.title} className="w-full h-full rounded-full object-cover opacity-70" />
        )}
        <div className="absolute w-2 h-2 rounded-full bg-black border border-white/20" />
      </div>
    </div>
  );
}
