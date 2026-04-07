'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { useLanguage } from '../../../components/LanguageProvider';

export default function MisreadArticle() {
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
            ESSAY
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.03.15
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            5 MIN READ
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
            <>Sie wurde missverstanden,<br />aber sie kann<br /><span style={{ color: '#00ffea' }}>alles werden</span></>
          ) : (
            <>She Was Misread —<br />But She Can<br /><span style={{ color: '#00ffea' }}>Become Anyone</span></>
          )}
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20,
          marginBottom: 0,
        }}>
          {isDE
            ? 'Sie kann Ingenieurin werden. Sie kann Wissenschaftlerin, Künstlerin, Architektin, Programmiererin sein — alles. Das ist kein Manifest. Kein Slogan. Nur eine Tatsache, die noch nicht genug Menschen akzeptiert haben.'
            : 'She can be an engineer. She can be a scientist, an artist, an architect, a programmer — anyone. This is not a manifesto. Not a slogan. Just a fact that not enough people have accepted yet.'}
        </p>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto 0', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — {isDE ? 'Woher das Missverständnis kommt' : 'Where Misreading Comes From'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Missverständnisse kommen selten aus Böswilligkeit. Meistens ist es kognitive Trägheit — eine Standardannahme darüber, "wie Frauen sein sollten", so oft verstärkt, dass sie zur Luft wird. Unsichtbar. Überall.'
            : 'Misreading rarely comes from malice. Most of the time it is cognitive inertia — a default assumption about "what women are supposed to be," reinforced until it becomes like air. Invisible. Everywhere.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Wenn ein Mädchen sagt, sie möchte Code schreiben, lächelt jemand und fragt: "Bist du sicher?" Wenn eine Frau befördert wird, spekulieren manche hinter ihrem Rücken. Wenn sie schweigt, heißt es schwach; wenn sie spricht, heißt es aggressiv. Das Missverständnis ist eine doppelte Bindung — was auch immer du tust, es wird falsch gelesen.'
            : 'When a girl says she wants to write code, someone smiles and asks: "Are you sure?" When a woman gets a promotion, people wonder what\'s behind it. When she\'s quiet, she\'s called weak. When she speaks, she\'s called aggressive. Misreading is a double bind — whatever you do, it gets read wrong.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Aber die Existenz von Missverständnissen macht sie nicht wahr. Sie bedeutet nur eines: Viele Menschen haben noch nicht genug Möglichkeiten gesehen.'
            : 'But the existence of misreading does not make it true. It only means one thing: many people haven\'t encountered enough possibility yet.'}
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
            ? '"Sie versucht nichts zu beweisen. Sie wird nur das, was sie immer hätte sein können."'
            : '"She is not trying to prove anything. She is only becoming what she always could have been."'}
        </blockquote>

        <SectionLabel>02 — {isDE ? 'Nicht Opposition, nicht Slogans' : 'Not Opposition, Not Slogans'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Lange lebte der Diskurs über Feminismus in der Sprache des Krieges: Patriarchat widerstehen, Systeme demontieren, Regeln brechen. Das hat historische Logik. Aber wenn "Opposition" die einzige Grammatik wird, wird Feminismus erschöpfend — man muss immer wütend, immer wachsam, immer Linien ziehend sein.'
            : 'For a long time, discourse on feminism has lived in the language of war: resist patriarchy, dismantle systems, break the rules. There is historical logic to that. But when "opposition" becomes the only grammar, feminism becomes exhausting — you must always be angry, always on guard, always drawing lines.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Es geht nicht darum, jemanden zu bekehren, zu überzeugen, mit Gewalt Raum zu beanspruchen, oder Linien gegen Frauen zu ziehen, die andere Entscheidungen getroffen haben. Jene auszuschließen, die Mutterschaft annehmen, jeden auf einem anderen Weg als Feind zu definieren — das ist keine Befreiung. Es sind nur andere Mauern.'
            : 'It is not about converting anyone. Not about persuading anyone. Not about using force to claim space, or drawing battle lines against women who\'ve made different choices. Excluding those who embrace motherhood, defining anyone on a different path as an enemy — that is not liberation. It is just a different set of walls.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Konformität war nie die Antwort. In keiner Richtung.'
            : 'Conformity has never been the answer. In any direction.'}
        </p>

        <SectionLabel>03 — {isDE ? 'Es geht um Ausdruck' : "It's About Expression"}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Was wirklich wichtig ist, ist Ausdruck.'
            : 'What actually matters is expression.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Keine Vorführung. Kein für andere inszenierter Selbstbeweis. Nur der ehrliche Akt zu sagen — "Das ist meine Fähigkeit, das ist mein Urteil, das ist meine Arbeit" — und es existieren zu lassen, aufgezeichnet zu werden, bewertet zu werden.'
            : 'Not performance. Not self-proof staged for an audience. Just the honest act of saying — "this is my skill, this is my judgment, this is my work" — and letting it exist, be recorded, be valued.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ausdruck ist Infrastruktur. Wenn mehr Frauen sprechen, wenn ihre Arbeit in der Welt bleibt, wenn ihre Namen in Projektgutschriften erscheinen, wenn ihre Bezahlung der von Kollegen gleicher Fähigkeiten entspricht — dann sieht man die Struktur sich verändern.'
            : 'Expression is infrastructure. When more women speak, when their work remains in the world, when their names appear on project credits, when their pay matches colleagues of equal ability — that is when you can see the structure shifting.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Feministische Praxis ist oft so einfach: Tue deine Arbeit. Fordere, was du verdienst. Lass deinen Namen präsent sein.'
            : 'Feminist practice is often this simple: do your work. Ask for what you\'re owed. Let your name be present.'}
        </p>

        <SectionLabel>04 — {isDE ? 'Wirtschaftliche Anerkennung ist die Sprache des Respekts' : 'Economic Recognition Is the Language of Respect'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Gesehen zu werden ist nur der erste Schritt. Fair vergütet zu werden ist die systemische Anerkennung.'
            : 'Being seen is only the first step. Being fairly compensated is the systemic acknowledgment.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das Lohngefälle ist nicht nur ein Zahlenproblem. Es sendet ein Signal — an den Markt, an Organisationen, an jede junge Frau, die in ein Feld eintritt — das ihr sagt, wie viel ihre Zeit wert ist, wie viel ihr Urteil wert ist, wie viel ihre Existenz wert ist.'
            : 'The pay gap is not just a numbers problem. It sends a signal — to the market, to organizations, to every young woman entering a field — telling her how much her time is worth, how much her judgment is worth, how much her existence is worth.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Für faire wirtschaftliche Rückgaben zu kämpfen ist nicht "Konkurrenz mit Männern". Es geht darum, einen anderen Maßstab zu setzen — einen, wo die Fähigkeit selbst die Einheit ist, nicht die Fähigkeit nach einem Geschlechterrabatt.'
            : 'Fighting for fair economic return is not "competing with men." It is establishing a different baseline — one where ability itself is the unit of measure, not ability after a gender discount is applied.'}
        </p>

        <SectionLabel>05 — {isDE ? 'Positiv. Optimistisch. Gegenseitig.' : 'Positive. Optimistic. Mutual.'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Zuletzt, und am wichtigsten: Das muss nicht in Trauer und Wut geschehen.'
            : "Last, and most important: this doesn't need to happen in grief and anger."}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Gegenseitige Unterstützung ist keine Strategie. Es ist ein Instinkt. Wenn du weißt, dass ein Weg funktioniert, kannst du es sagen. Wenn du Ressourcen und Position hast, lass die Tür ein bisschen offener. Wenn du eine andere Frau siehst, die das tut, was sie gut kann, sag einfach: Sie ist ausgezeichnet.'
            : "Mutual support is not strategy. It is instinct. When you know a path works, you can say it. When you have resources and position, leave the door a little more open. When you see another woman doing what she's good at, just say: she's excellent."}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Kein Aufbau auf geteiltem Leid nötig, kein Preis für die Werte anderer. Nur aktiv leben, ernsthaft arbeiten, ehrlich ausdrücken — und wo du kannst, jemanden mitziehen.'
            : "No need to build it on shared suffering, or at the cost of someone else's values. Just live actively, work seriously, express honestly — and where you can, pull someone else forward."}
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
              ? 'Sie wurde missverstanden, weil Menschen noch nicht an alle ihre Möglichkeiten gewöhnt sind.'
              : "She was misread because people aren't used to all her possibilities."}<br />
            <span style={{ color: '#00ffea' }}>
              {isDE
                ? 'Aber sie kann Ingenieurin werden.\nSie kann alles werden.'
                : 'But she can be an engineer.\nShe can be everything.'}
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
