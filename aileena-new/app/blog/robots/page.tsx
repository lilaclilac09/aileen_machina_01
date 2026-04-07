'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { useLanguage } from '../../../components/LanguageProvider';

export default function RobotsArticle() {
  const { language } = useLanguage();
  const isDE = language === 'DE';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
      color: '#fff',
      fontFamily: "'Barlow Condensed', system-ui, sans-serif",
      overflowY: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <ScrollUnlock />

      {/* ── Nav bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/#blog" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
          {isDE ? 'Archiv' : 'Archive'}
        </Link>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
        }}>
          AILEENA MACHINA
        </span>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 32px 64px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.45em',
            color: '#00ffea',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '1px solid rgba(0,255,234,0.3)',
          }}>
            VIDEO
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2025.03.18
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            Physical AI · Robotics · Simulation
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.08,
          marginBottom: 32,
          color: '#fff',
        }}>
          {isDE ? (
            <>Wie Roboter lernen,<br /><span style={{ color: '#00ffea' }}>Roboter zu sein</span></>
          ) : (
            <>How Robots Learn<br /><span style={{ color: '#00ffea' }}>to Be Robots</span></>
          )}
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20,
          marginBottom: 0,
        }}>
          {isDE
            ? 'Alles, was sich bewegt, wird autonom sein. Der kontinuierliche Kreislauf aus Simulation, Training, Test und realem Einsatz — angetrieben von NVIDIA Omniverse und Cosmos.'
            : 'Everything that moves will be autonomous. The continuous loop of simulation, training, testing, and real-world deployment — powered by NVIDIA Omniverse and Cosmos.'}
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Video ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 0' }}>
        {/* Scanline frame */}
        <div style={{
          position: 'relative',
          background: 'rgba(0,255,234,0.03)',
          border: '1px solid rgba(0,255,234,0.15)',
          padding: 2,
        }}>
          {/* Corner accents */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '2px solid #00ffea', borderLeft: '2px solid #00ffea' }} />
          <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '2px solid #00ffea', borderRight: '2px solid #00ffea' }} />
          <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '2px solid #00ffea', borderLeft: '2px solid #00ffea' }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '2px solid #00ffea', borderRight: '2px solid #00ffea' }} />

          <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%' }}>
            <iframe
              src="https://www.youtube.com/embed/S4tvirlG8sQ?rel=0&modestbranding=1&color=white"
              title="How Robots Learn to Be Robots"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Status bar below video */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '1px solid rgba(0,255,234,0.15)',
          borderRight: '1px solid rgba(0,255,234,0.15)',
          borderBottom: '1px solid rgba(0,255,234,0.15)',
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.4em',
            color: '#00ffea',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}>
            SIGNAL ACTIVE — STREAM ONLINE
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
          }}>
            NVIDIA / OMNIVERSE / COSMOS
          </span>
        </div>
      </section>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — {isDE ? 'Synthetische Daten in großem Maßstab' : 'Synthetic Data at Scale'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'NVIDIA Omniverse und Cosmos ermöglichen die Generierung massiver synthetischer Datensätze — fotorealistisch, physikalisch korrekt, unendlich variierbar. Was früher Jahre dauerte, dauert heute Stunden. Der Engpass ist nicht mehr das Sammeln von Daten. Er ist das Entwerfen der richtigen Verteilung.'
            : 'NVIDIA Omniverse and Cosmos enable the generation of massive synthetic datasets — photorealistic, physically accurate, infinitely variable. What used to take years now takes hours. The bottleneck is no longer data collection. It is designing the right distribution.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Simulation ist nicht mehr ein Kompromiss. Sie ist der primäre Trainingsvektor für verkörperte Intelligenz. Wenn du eine Million Stunden echter Robotererfahrung brauchst, baust du sie — du wartest nicht darauf.'
            : 'Simulation is no longer a compromise. It is the primary training vector for embodied intelligence. If you need a million hours of real robot experience, you build it — you don\'t wait for it.'}
        </p>

        <blockquote style={{
          margin: '48px 0',
          padding: '28px 32px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '3px solid #00ffea',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.9)',
        }}>
          {isDE
            ? '"Alles, was sich bewegt, wird autonom sein. Die Frage ist nicht ob — es ist wann und wie schnell."'
            : '"Everything that moves will be autonomous. The question is not if — it is when and how fast."'}
        </blockquote>

        <SectionLabel>02 — {isDE ? 'Der Trainingskreislauf' : 'The Training Loop'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Simulation → Training → Test → realer Einsatz → Datenerfassung → Simulation. Der Kreislauf ist selbstverstärkend. Jeder reale Einsatz erzeugt Kantenfälle, die in die Simulation zurückfließen. Jede Verbesserung der Simulation beschleunigt das Training.'
            : 'Simulation → training → testing → real-world deployment → data capture → simulation. The loop is self-reinforcing. Every real deployment generates edge cases that feed back into simulation. Every simulation improvement accelerates training.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Was sich verändert hat: Roboter-Policies werden nicht mehr für einzelne Aufgaben in einzelnen Umgebungen gebaut. Sie werden über Verkörperungsarchitekturen hinweg generalisiert — derselbe Kern-Policy-Stack, der in einem Lager, einer Küche, einem Krankenhaus läuft.'
            : 'What has changed: robot policies are no longer built for single tasks in single environments. They are generalized across embodied intelligence architectures — the same core policy stack running in a warehouse, a kitchen, a hospital.'}
        </p>

        <SectionLabel>03 — {isDE ? 'Was das bedeutet' : 'What This Means'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Physische KI ist keine Nische mehr. Sie ist die nächste Schicht über dem Internet — eine Infrastruktur, die die physische Welt so verarbeitet wie das Netz die Informationswelt verarbeitet hat. Jedes Gerät, das sich bewegt, trägt bald einen Intelligenz-Stack.'
            : 'Physical AI is no longer niche. It is the next layer above the internet — infrastructure that processes the physical world the way the web processed the information world. Every device that moves will soon carry an intelligence stack.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Der Wettbewerb findet nicht auf der Ebene des einzelnen Roboters statt. Er findet auf der Ebene des Daten-Schwungrads, der Simulations-Qualität, der Policy-Generalisierung statt. Wer den besten Kreislauf baut, gewinnt.'
            : 'The competition is not at the level of the individual robot. It is at the level of the data flywheel, the simulation quality, the policy generalization. Whoever builds the best loop wins.'}
        </p>

        <div style={{
          marginTop: 64,
          padding: '40px 32px',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.88)',
            margin: 0,
          }}>
            {isDE
              ? 'Alles, was sich bewegt, wird autonom sein.'
              : 'Everything that moves will be autonomous.'}<br />
            <span style={{ color: '#00ffea' }}>
              {isDE ? 'Die Frage ist nur noch: wann.' : 'The only question left is: when.'}
            </span>
          </p>
          <p style={{
            marginTop: 20,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
          }}>
            — AILEENA MACHINA / 2025
          </p>
        </div>

        <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← {isDE ? 'Zurück zum Archiv' : 'Back to Archive'}
          </Link>
        </div>

      </article>
    </div>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace',
      fontSize: '0.6rem',
      letterSpacing: '0.45em',
      color: '#00ffea',
      textTransform: 'uppercase',
      marginBottom: 20,
      marginTop: 56,
      opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
