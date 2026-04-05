'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1400);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(circle at 50% 30%, #2a1a00 0%, #0a0500 80%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 1.2s ease',
      opacity: fading ? 0 : 1,
      pointerEvents: fading ? 'none' : 'all',
      color: '#ffcc99',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Orb — breath and rotate are separate layers to avoid transform conflict */}
      <div className="loading-orb-wrap">
        <div className="loading-orb" />
        <div className="loading-orb-rotate" />
      </div>

      <div style={{
        marginTop: 42,
        fontFamily: "'Space Grotesk', 'Orbitron', sans-serif",
        fontSize: '2.1rem', fontWeight: 600,
        letterSpacing: 6,
        textShadow: '0 0 25px #ff8800',
        color: '#ffcc99',
      }}>
        AILEEN
      </div>

      <div style={{
        marginTop: 18,
        fontSize: '1.05rem',
        opacity: 0.75,
        letterSpacing: 3,
        animation: 'orbStatusPulse 3s infinite alternate',
      }}>
        MACHINA 01 • 唤醒中…
      </div>
    </div>
  );
}
