'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { useLanguage } from '../../../components/LanguageProvider';

export default function LionArticle() {
  const { language } = useLanguage();
  const isDE = language === 'DE';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: "'Barlow Condensed', system-ui, sans-serif",
      overflowY: 'auto',
      WebkitFontSmoothing: 'antialiased',
      position: 'relative',
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
        }}>
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
      <section style={{ padding: '80px 32px 64px', maxWidth: 800, margin: '0 auto' }}>
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
            {isDE ? 'ESSAY' : 'ESSAY'}
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.02.15
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            6 MIN READ
          </span>
        </div>

        <p style={{
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.5em',
          color: 'rgba(255,255,255,0.28)',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          {isDE ? 'SEI KEIN SCHAF —' : "DON'T BE A SHEEP —"}
        </p>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.08,
          marginBottom: 12,
          color: '#fff',
        }}>
          <span style={{ color: '#00ffea' }}>
            {isDE ? 'Sei ein Löwe.' : 'Be a Lion.'}
          </span>
        </h1>

        <p style={{
          fontFamily: 'monospace',
          fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 40,
          textTransform: 'uppercase',
        }}>
          {isDE
            ? 'Du wirst einsam sein — aber du wirst niemals allein sein.'
            : 'You will be lonely — but you will never be alone.'}
        </p>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20,
        }}>
          {isDE
            ? 'Wenn der Zweifel sich auflöst, folgt Klarheit. Nicht Härte — nur das Ende des Kampfes gegen eine Antwort, die du bereits kanntest.'
            : 'When doubt dissolves, clarity follows. Not becoming harder — just finally stopping the waste of fighting an answer you already knew.'}
        </p>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — {isDE ? 'Entschlossenheit ist nicht das, was du denkst' : 'Decisive Power Is Not What You Think'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Das Wort trägt von sich aus ein schlechtes Image. Menschen hören es und denken an Kälte, Berechnung, jemanden der über andere hinweggeht. Aber das ist eine Fehllesung.'
            : 'The word carries its own bad reputation. People hear it and picture coldness, calculation, someone who climbs over others. That is a misreading.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Entschlossenheit ist in ihrem Kern radikale Selbstdisziplin — die Fähigkeit, Emotionen im entscheidenden Moment vom Urteil zu trennen. Nicht das Fehlen von Gefühlen. Nur die Weigerung, Gefühle die Entscheidung treffen zu lassen. Nicht Taubheit. Präzision.'
            : 'Decisive clarity, at its core, is radical self-discipline — the ability to separate emotion from judgment at the moment that matters. Not the absence of feeling. Just the refusal to let feeling make the decision for you. Not numbness. Precision.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Emotionalen Überschwang abschneiden, impulsives Handeln verweigern, den Instinkt entwickeln, sauber zu handeln ohne innere Reibung — das ist die fortgeschrittene Form des Mutes. Die meisten Menschen entwickeln ihn nie, weil er zuerst die Bereitschaft erfordert, allein zu sein.'
            : 'Cutting out emotional overflow, refusing impulsive noise, building the instinct to act cleanly without internal friction — this is the advanced form of courage. Most people never develop it, because it requires a willingness to be alone first.'}
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
            ? '"Ergebnisse klar abzuwägen ist nicht kalt. Es ist ehrlich — zu dir selbst und zu allen anderen."'
            : '"Weighing outcomes clearly is not cold. It is being honest — with yourself, and with everyone else."'}
        </blockquote>

        <SectionLabel>02 — {isDE ? 'Komfort war niemals neutral' : 'Comfort Has Never Been Neutral'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Hier ist etwas, das die meisten Menschen nicht erkennen: Komfort ist keine Ruhe. Er ist ein kontinuierlicher Konditionierungsmechanismus.'
            : 'Here is something most people don\'t realize: comfort is not rest. It is a continuous conditioning mechanism.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Wenn du dich in vertraute Umgebungen, feste Rhythmen und "sichere" Entscheidungen versinkst — schrumpft deine Schwelle. Deine Widerstandsfähigkeit sinkt. Deine Emotionen werden empfindlicher. Kleine Probleme fühlen sich enorm an, nicht weil sie gewachsen sind, sondern weil dein System gelernt hat, Reibung im Voraus abzulehnen.'
            : 'When you sink into familiar environments, fixed rhythms, "safe" choices — your threshold shrinks. Your resilience drops. Your emotions grow more sensitive. Small problems start to feel enormous, not because they grew, but because your system has learned to resist friction in advance.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'So verwurzelt sich Angst. Sie muss dich nicht überwältigen. Sie braucht nur, dass du Komfort liebst — und das Unbekannte beginnt automatisch, Bedrohung zu tragen. Dein Nervensystem erledigt den Rest.'
            : 'That is how fear takes root. It doesn\'t need to overpower you. It just needs you to love comfort — and the unfamiliar starts to carry threat automatically. Your nervous system completes the rest.'}
        </p>

        <div style={{
          margin: '48px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
        }}>
          {(isDE ? [
            ['Leichtigkeit suchen', 'Wachstum aufgeben'],
            ['Sicherheit festhalten', 'Durchbruch verweigern'],
            ['Exposition fürchten', 'Härtung meiden'],
            ['Oberflächliche Logik', 'Tiefe Abhängigkeit'],
          ] : [
            ['Seeking ease', 'Abandoning growth'],
            ['Holding on to safety', 'Refusing breakthrough'],
            ['Fearing exposure', 'Avoiding hardening'],
            ['Surface logic', 'Deep dependency'],
          ]).map(([left, right], i) => (
            <div key={i} style={{
              padding: '20px 24px',
              background: '#000',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.58rem',
                letterSpacing: '0.35em',
                color: 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>{left}</p>
              <p style={{
                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.04em',
              }}>{right}</p>
            </div>
          ))}
        </div>

        <SectionLabel>03 — {isDE ? 'Die meisten Menschen driften hinein' : 'Most People Drift Into It'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Niemand wählt aktiv, ein Schaf zu werden. Es ist ein gradueller Prozess — jeder Schritt sieht vernünftig aus, jeder Kompromiss trägt genug Rechtfertigung.'
            : 'Nobody chooses to become a sheep. It is a gradual process — each step looking reasonable, each compromise carrying enough justification.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Leichtigkeit über Wachstum, Sicherheit über Durchbruch, Vermeidung über Härtung — jede Entscheidung sieht vernünftig aus. Zusammen bauen sie eine tiefe Abhängigkeit. Wenn echtes Unbehagen kommt, reagieren Körper und Geist mit Abwehr und Panik.'
            : 'Seeking ease over growth, safety over breakthrough, avoidance over hardening — each choice looks sensible. Together, they build a deep dependency. When real discomfort arrives, the body and mind recoil in fear.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Aber das ist nicht die Wahrheit. Es ist nur konditionierter Reflex. Du wurdest nicht zerbrechlich geboren. Du wurdest in einem Gewächshaus trainiert, bis du vergaßt, was du immer in der Lage warst zu überstehen.'
            : 'But that is not the truth. It is only conditioned reflex. You were not born fragile. You were trained in a greenhouse until you forgot what you were always capable of surviving.'}
        </p>

        <SectionLabel>04 — {isDE ? 'Überwinde die Angst. Dann erlaube dir zu brechen.' : 'Overcome Fear. Then Allow Yourself To Break.'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Hier ist ein Paradoxon, und es ist real: Die Menschen, die am fähigsten sind, Einsamkeit zu ertragen und klare Entscheidungen zu treffen, sind oft auch die, die sich am ehesten erlauben können zu brechen.'
            : 'There is a paradox here, and it is real: the people most capable of bearing solitude and making clear decisions are often also the most capable of allowing themselves to break.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Weil Verletzlichkeit Mut erfordert. In einer Welt, in der es als normal gilt, sich zu wappnen, braucht es, "Ich kämpfe gerade", "Ich brauche Zeit", "Das hat mich verletzt" zu sagen — genauso viel Kraft wie jede schwere Entscheidung.'
            : 'Because vulnerability requires courage. In a world where armoring yourself is treated as normal, saying "I\'m struggling right now," "I need time," "this hurt me" — that takes as much strength as any hard decision.'}
        </p>
        <p style={bodyStyle}>
          Being vulnerable is not weakness.<br />
          It is the evidence that you are strong enough to be honest.
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ein Löwe muss keine Stärke vorführen. Er existiert einfach. Er weiß, was er ist, also muss er niemandem etwas beweisen. Das ist die Textur dieser Einsamkeit — nicht die Einsamkeit des Verlassenwerdens, sondern die Einsamkeit der Klarheit. Die Art, die weitergehen kann, ohne verstanden werden zu müssen.'
            : "A lion doesn't perform strength. It simply exists. It knows what it is, so it has nothing to prove. That is the texture of this solitude — not the solitude of abandonment, but the solitude of clarity. The kind that can keep walking without needing to be understood."}
        </p>

        <div style={{
          marginTop: 64,
          padding: '40px 32px',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.88)',
            margin: 0,
          }}>
            {isDE ? "Sei kein Schaf." : "Don't be a sheep."}<br />
            <span style={{ color: '#00ffea' }}>
              {isDE
                ? 'Sei ein Löwe — auch wenn du einsam bist,\ndu wirst niemals wirklich allein sein.'
                : "Be a lion — even if you're lonely,\nyou will never truly be alone."}
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
            — AILEENA MACHINA / 2026
          </p>
        </div>

        <div style={{ marginTop: 48 }}>
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
