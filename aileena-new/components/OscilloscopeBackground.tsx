'use client';
import { useEffect, useRef } from 'react';

/*
 * OscilloscopeBackground
 * ──────────────────────
 * Renders a soft, low-amplitude audio-waveform trace as a full-bleed canvas background.
 *
 * Design intent:
 *   - Musical, not medical — smooth undulation, no sharp spikes
 *   - Sum of 4 sine components with irrational frequency ratios (√2, √5, φ, etc.)
 *     → they never phase-align perfectly, so the wave stays organic and alive
 *   - Very low vertical amplitude (~3.5% of screen height)
 *   - Three overlapping traces: main + two ghost offsets for depth
 *   - Colour: site cyan #00ffea at ≤ 8% opacity so content stays fully readable
 */

// [spatialFreq (cycles/width), temporalFreq (Hz), amplitude, phaseOffset]
// Spatial freqs chosen near √2, √5, φ, 1/φ  → irrational, never resonant
const COMPS: [number, number, number, number][] = [
  [1.414, 0.23, 1.00, 0.00],   // dominant — √2 cycles visible
  [2.236, 0.37, 0.52, 1.87],   // √5
  [3.618, 0.61, 0.28, 3.14],   // φ + 2
  [0.764, 0.15, 0.40, 2.40],   // 1/φ — slow envelope swell
];

const TAU       = Math.PI * 2;
const TOTAL_AMP = COMPS.reduce((s, c) => s + c[2], 0); // ~2.20

// Three trace layers: [y-offset as fraction of H, opacity, lineWidth]
const TRACES: [number, number, number][] = [
  [0,      0.075, 1.4],   // main
  [ 0.013, 0.028, 0.9],   // ghost below
  [-0.013, 0.028, 0.9],   // ghost above
];

export default function OscilloscopeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;

    function setSize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    const t0 = performance.now();

    function draw(now: number) {
      if (!canvas || !ctx) return;
      const W   = canvas.width;
      const H   = canvas.height;
      const t   = (now - t0) * 0.001;          // seconds
      const amp = H * 0.035;                   // 3.5% of height
      const N   = Math.ceil(W / 2);            // one vertex per 2px

      ctx.clearRect(0, 0, W, H);

      for (const [dyFrac, alpha, lw] of TRACES) {
        const dy = dyFrac * H;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 234, ${alpha})`;
        ctx.lineWidth   = lw;
        ctx.lineJoin    = 'round';

        for (let i = 0; i <= N; i++) {
          const xn  = i / N;
          const x   = xn * W;
          let   y   = 0;

          for (const [sf, tf, a, ph] of COMPS) {
            y += a * Math.sin(TAU * sf * xn - TAU * tf * t + ph);
          }
          y = (y / TOTAL_AMP) * amp;

          const yPos = H * 0.5 + dy + y;
          i === 0 ? ctx.moveTo(x, yPos) : ctx.lineTo(x, yPos);
        }

        // Subtle glow on main trace only
        if (dyFrac === 0) {
          ctx.shadowColor = 'rgba(0, 255, 234, 0.18)';
          ctx.shadowBlur  = 6;
        } else {
          ctx.shadowBlur  = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width:  '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
