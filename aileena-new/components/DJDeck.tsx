'use client';

import { useState } from 'react';

const GROOVES = 16;

export default function DJDeck() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Ambient glow */}
      <div className="relative" style={{ width: 320, height: 320 }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '50%',
            background: playing
              ? 'radial-gradient(circle, rgba(0,255,234,0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,255,234,0.08) 0%, transparent 70%)',
            transform: 'scale(1.6)',
            filter: 'blur(28px)',
            transition: 'background 1.5s ease',
          }}
        />

        {/* Platter */}
        <div
          onClick={() => setPlaying(p => !p)}
          className="absolute inset-0 cursor-pointer"
          style={{
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 48% 42%, rgba(0,255,234,0.07) 0%, rgba(0,255,234,0.02) 28%, #090909 54%, #040404 100%)',
            boxShadow: playing
              ? '0 0 0 1px rgba(0,255,234,0.2), 0 0 70px rgba(0,255,234,0.28), inset 0 0 50px rgba(0,0,0,0.9)'
              : '0 0 0 1px rgba(0,255,234,0.08), 0 0 30px rgba(0,255,234,0.08), inset 0 0 40px rgba(0,0,0,0.8)',
            transition: 'box-shadow 1.2s ease',
            animation: playing ? 'turntableSpin 3.2s linear infinite' : 'none',
          }}
        >
          {/* Groove rings */}
          {Array.from({ length: GROOVES }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: `${14 + i * 7}px`,
                border: '1px solid rgba(255,255,255,0.035)',
              }}
            />
          ))}

          {/* Center label */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              inset: '36%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #181818 0%, #0c0c0c 100%)',
              border: '1px solid rgba(0,255,234,0.22)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white/15" />
          </div>
        </div>

        {/* Tonearm — SVG overlay, doesn't rotate with platter */}
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox="0 0 320 320"
          style={{ overflow: 'visible' }}
        >
          {/* Pivot */}
          <circle cx="282" cy="52" r="6" fill="rgba(255,255,255,0.25)" />
          <circle cx="282" cy="52" r="3" fill="rgba(0,255,234,0.4)" />
          {/* Arm */}
          <line
            x1="282" y1="52"
            x2={playing ? '196' : '226'}
            y2={playing ? '166' : '136'}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transition: 'all 1.4s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Headshell */}
          <rect
            x={playing ? '190' : '220'}
            y={playing ? '162' : '132'}
            width="8" height="11" rx="1"
            fill="rgba(255,255,255,0.22)"
            transform={`rotate(${playing ? -38 : -48} ${playing ? 194 : 224} ${playing ? 167 : 137})`}
            style={{ transition: 'all 1.4s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
      </div>

      {/* Play / pause */}
      <button
        onClick={() => setPlaying(p => !p)}
        className="mt-6 text-[0.58rem] uppercase tracking-[0.55em] text-[#00ffea] hover:opacity-50 transition-opacity"
      >
        {playing ? '⏸ PAUSE' : '▶ PLAY'}
      </button>
    </div>
  );
}
