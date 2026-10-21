import { ImageResponse } from 'next/og';

export const alt = 'AILEENA MACHINA · Aileen Choo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default share card: paper background, ink type, teal accent (Dispatch palette). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#f6f5f2',
          color: '#1b1713',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#008f84' }}>AILEENA.XYZ</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>AILEENA MACHINA</div>
          <div style={{ display: 'flex', fontSize: 36, marginTop: 20, color: 'rgba(27, 23, 19, 0.7)' }}>
            Aileen Choo · research, tools, essays, sound
          </div>
        </div>
        <div style={{ display: 'flex', height: 6, width: 160, background: '#008f84' }} />
      </div>
    ),
    size,
  );
}
