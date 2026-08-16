'use client';

import ProphecyHall from '../../components/ProphecyHall';
import ScrollUnlock from '../blog/ScrollUnlock';

const display = "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif";
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export default function ProphecyPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(0,168,157,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 80%, rgba(80,40,20,0.35), transparent 50%), #0a0908',
        color: 'rgba(255,253,248,0.88)',
        fontFamily: display,
        overflowY: 'auto',
      }}
    >
      <ScrollUnlock />

      <header
        className="site-top-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '18px 24px',
          background: 'rgba(10,9,8,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,253,248,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.68rem',
              letterSpacing: '0.28em',
              color: 'rgba(255,253,248,0.4)',
              textTransform: 'uppercase',
            }}
          >
            Prophecy Hall
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#fffdf8',
            marginBottom: 12,
            lineHeight: 1.1,
          }}
        >
          Prophecy Hall
        </h1>
        <p
          style={{
            fontFamily: mono,
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            color: 'rgba(0,168,157,0.85)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Glass records · speak in Console
        </p>
        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.65,
            color: 'rgba(255,253,248,0.62)',
            maxWidth: 540,
            fontWeight: 400,
          }}
        >
          A shelf of misted spheres. Warm one that is yours — the words stream into the Console, not the ball.
        </p>

        <ProphecyHall />
      </main>
    </div>
  );
}
