'use client';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import SubstackShell from '../_substack/SubstackShell';

export default function RobotsArticle() {
  const { language } = useLanguage();
  const isDE = language === 'DE';

  return (
    <SubstackShell
      isDE={isDE}
      category="Video"
      date="2025.03.18"
      tags="Physical AI · Robotics · Simulation"
      title={isDE ? 'Wie Roboter lernen, Roboter zu sein' : 'How Robots Learn to Be Robots'}
      dek={isDE
        ? 'Alles, was sich bewegt, wird autonom sein. Der kontinuierliche Kreislauf aus Simulation, Training, Test und realem Einsatz — angetrieben von NVIDIA Omniverse und Cosmos.'
        : 'Everything that moves will be autonomous. The continuous loop of simulation, training, testing, and real-world deployment — powered by NVIDIA Omniverse and Cosmos.'}
    >
      {/* ── Video ── */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%', overflow: 'hidden', borderRadius: 4 }}>
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
      </section>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>{isDE ? 'Synthetische Daten in großem Maßstab' : 'Synthetic Data at Scale'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Mit NVIDIA Omniverse und Cosmos kannst du riesige synthetische Datensätze erzeugen — fotorealistisch, physikalisch korrekt, beliebig variierbar. Was früher Jahre gedauert hat, dauert heute Stunden. Der Engpass ist nicht mehr, Daten zu sammeln. Der Engpass ist, die richtige Verteilung zu entwerfen.'
            : 'With NVIDIA Omniverse and Cosmos, you can generate huge synthetic datasets — photorealistic, physically accurate, endlessly variable. What used to take years now takes hours. The bottleneck is no longer collecting the data. The bottleneck is designing the right distribution.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Simulation ist kein Kompromiss mehr. Sie ist der wichtigste Weg, verkörperte Intelligenz zu trainieren — also Intelligenz, die in einem physischen Körper steckt. Wenn du eine Million Stunden echter Robotererfahrung brauchst, baust du sie dir einfach — du wartest nicht darauf.'
            : 'Simulation is no longer a compromise. It is the main way you train embodied intelligence — intelligence that lives in a physical body. If you need a million hours of real robot experience, you just build it — you don\'t sit around waiting for it.'}
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

        <SectionLabel>{isDE ? 'Der Trainingskreislauf' : 'The Training Loop'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Simulation → Training → Test → realer Einsatz → Datenerfassung → Simulation. Der Kreislauf verstärkt sich selbst. Jeder echte Einsatz wirft Kantenfälle auf — also die seltenen, kniffligen Situationen — und die fließen wieder in die Simulation zurück. Und jede bessere Simulation macht das Training schneller.'
            : 'Simulation → training → testing → real-world deployment → data capture → simulation. The loop feeds itself. Every real deployment throws up edge cases — the rare, tricky situations — and those flow back into the simulation. And every improvement to the simulation makes the next round of training faster.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Was sich geändert hat: Roboter-Policies — also die Steuerungslogik, die einen Roboter handeln lässt — werden nicht mehr für eine einzelne Aufgabe in einer einzelnen Umgebung gebaut. Sie generalisieren über verschiedene Roboterkörper hinweg. Derselbe Kern-Policy-Stack läuft im Lager, in der Küche und im Krankenhaus.'
            : 'Here is what has changed: robot policies — the control logic that decides how a robot acts — are no longer built for one task in one environment. They generalize across different robot bodies. The same core policy stack runs in a warehouse, a kitchen, and a hospital.'}
        </p>

        <SectionLabel>{isDE ? 'Was das bedeutet' : 'What This Means'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Physische KI ist keine Nische mehr. Sie ist die nächste Schicht über dem Internet — eine Infrastruktur, die die physische Welt genauso verarbeitet, wie das Netz die Welt der Informationen verarbeitet hat. Bald trägt jedes Gerät, das sich bewegt, seinen eigenen Intelligenz-Stack.'
            : 'Physical AI is no longer a niche. It is the next layer sitting on top of the internet — infrastructure that handles the physical world the same way the web handled the world of information. Pretty soon, every device that moves will carry its own intelligence stack.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Der Wettbewerb wird nicht am einzelnen Roboter entschieden. Er wird beim Daten-Schwungrad entschieden — dem sich selbst verstärkenden Kreislauf, in dem mehr Einsätze mehr Daten und damit bessere Roboter erzeugen — sowie bei der Qualität der Simulation und der Generalisierung der Policies. Wer den besten Kreislauf baut, gewinnt.'
            : 'The competition is not decided at the level of the individual robot. It is decided by the data flywheel — the self-reinforcing loop where more deployments produce more data, which produces better robots — along with the quality of the simulation and how well the policies generalize. Whoever builds the best loop wins.'}
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
    </SubstackShell>
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
