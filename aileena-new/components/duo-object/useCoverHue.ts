'use client';

import { useEffect, useState } from 'react';
import { rgbToHslTriplet } from '../../lib/duoObject';

/** Sample the cover. Light, reflection, and rim follow this hue. */
export function useCoverHue(src: string, fallback: string): string {
  const [sample, setSample] = useState<{ src: string; hue: string } | null>(null);

  useEffect(() => {
    let dead = false;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 20) continue;
        if (data[i] + data[i + 1] + data[i + 2] < 36) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      if (!n || dead) return;
      setSample({ src, hue: rgbToHslTriplet(r / n, g / n, b / n) });
    };
    return () => {
      dead = true;
    };
  }, [src]);

  return sample?.src === src ? sample.hue : fallback;
}
