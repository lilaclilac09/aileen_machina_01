'use client';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import SubstackShell from '../_substack/SubstackShell';

export default function ThirdCulturePowerArticle() {
  const { language } = useLanguage();
  const isDE = language === 'DE';

  return (
    <SubstackShell
      isDE={isDE}
      category="Essay"
      date="2026.07.09"
      tags={isDE ? 'Frauen in Tech · Identität' : 'Women in Tech · Identity'}
      title={isDE
        ? 'Third-Culture-Kid ohne Bewusstsein'
        : 'Third Culture Kid Without Consciousness'}
      dek={isDE
        ? 'Kein Handbuch. Kein eingebautes Zuhause. In Räumen, die für Männer gebaut sind, wirst du nicht als anders gelesen — du wirst als unvollständig gelesen. Das ist kein Missverständnis. Das ist der Maßstab.'
        : 'No manual. No built-in home. In rooms built for men, you are not read as different — you are read as incomplete. This is not a misunderstanding. It is the measure.'}
    >
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={{ ...bodyStyle, fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Niemand gibt dir das Handbuch. Du handelst danach, lange bevor du es merkst.'
            : 'Nobody hands you the manual. You live by it long before you notice.'}
        </p>

        <SectionLabel>{isDE ? 'Ohne Bewusstsein' : 'Without Consciousness'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Ein Third-Culture-Kid wächst zwischen Sprachen auf. Nicht „zweisprachig“ als Hobby. Ohne eine Kultur, die die Regeln stillschweigend erklärt.'
            : 'A third-culture kid grows up between languages. Not "bilingual" as a hobby. Without a culture that quietly explains the rules.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Der Raum hat ein Skript. Niemand liest es dir vor. Du beobachtest. Du imitierst. Du passt dich an. Lange ohne Bewusstsein. Nicht weil du dumm bist. Weil Überleben keine Pause für Theorie macht.'
            : 'The room has a script. Nobody reads it to you. You watch. You imitate. You adapt. For a long time without consciousness. Not because you are stupid. Because survival does not pause for theory.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist kein romantisches Exil. Es ist praktische Desorientierung. Du weißt, wie man höflich ist — nicht, welche Höflichkeit hier zählt. Du weißt, wie man arbeitet — nicht, welche Signale „ernsthaft“ bedeuten und welche „niedlich“.'
            : 'This is not romantic exile. It is practical disorientation. You know how to be polite — not which politeness counts here. You know how to work — not which signals mean "serious" and which mean "cute."'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Du wirst gut darin, mehrere Versionen von dir gleichzeitig zu halten. Nicht weil du performst. Weil Überleben so funktioniert.'
            : 'You get good at holding several versions of yourself at once. Not because you are performing. Because survival works that way.'}
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Du warst nie natürlich zu Hause. Du warst fließend in den Defaults anderer Leute.'
            : 'You were never naturally at home. You were fluent in other people\'s defaults.'}
        </p>

        <SectionLabel>{isDE ? 'Die europäischste Feministin im patriarchalen Raum' : 'The Most European Feminist in a Patriarchal Room'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Ich meine damit nicht „am meisten wie eine Europäerin aussehen“. Ich meine eine Haltung. Arbeit ist ernst. Körper sind keine Dekoration. Macht ist nicht automatisch männlich. Fairness ist kein Luxus. Klarheit ist keine Kälte.'
            : 'I do not mean "looking the most European." I mean a posture. Work is serious. Bodies are not decoration. Power is not automatically male. Fairness is not a luxury. Clarity is not coldness.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'In Tech- und Crypto-Räumen — oft amerikanisch laut, oft asiatisch schnell, fast überall männlich codiert — wirkt diese Haltung wie Sturheit. Manchmal wie Kälte. Manchmal wie Arroganz, wenn du nicht lächelst. Wenn du nicht dankbar genug bist für einen Platz am Rand.'
            : 'In tech and crypto rooms — often American-loud, often Asian-fast, almost everywhere male-coded — that posture reads as stubbornness. Sometimes as coldness. Sometimes as arrogance when you do not smile. When you are not grateful enough for a seat at the edge.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Patriarchat ist nicht „Männer sind schlecht“. Es ist ein Standardmaß. Wer spricht zuerst. Wer unterbricht. Wessen Name auf dem Deckblatt landet. Wessen Fehler als Lernkurve gelesen werden — und wessen als nicht geeignet.'
            : 'Patriarchy is not "men are bad." It is a default measure. Who speaks first. Who interrupts. Whose name lands on the cover slide. Whose mistakes read as a learning curve — and whose as not a fit.'}
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Wenn du nicht wie ein Mann bist — nicht dieselbe Lautstärke, nicht dieselbe Selbstsicherheit, nicht dieselbe Bequemlichkeit mit Risiko — wirst du nicht als anders gelesen. Du wirst als unvollständig gelesen.'
            : 'When you are not like a man — not the same volume, not the same certainty, not the same comfort with risk — you are not read as different. You are read as incomplete.'}
        </p>

        <SectionLabel>{isDE ? 'Ein Raum, in dem ich unvollständig war' : 'A Room Where I Was Incomplete'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Crypto. Ein Side-Event in Singapur. Der Raum war voll — Founder, Operator, Leute mit Titeln, die in diesem Ökosystem Gewicht tragen. Ich war da, um zu arbeiten. Zuhören. Verbindungen knüpfen. Den Raum lesen. Nicht um zu dekorieren.'
            : 'Crypto. A side event in Singapore. The room was full — founders, operators, people with titles that carry weight in that ecosystem. I was there to work. Listen. Connect. Read the room. Not to decorate it.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ein Mann am Tisch — Senior genug, dass andere ihm Raum gaben — stellte eine Frage zur Infrastruktur. Ich antwortete. Konkret. Mit Zahlen. Mit dem Mechanismus. Er nickte, ohne mich anzusehen. Zwei Minuten später wiederholte er denselben Punkt als seinen eigenen.'
            : 'A man at the table — senior enough that others made space for him — asked a question about infrastructure. I answered. Concrete. With numbers. With the mechanism. He nodded without looking at me. Two minutes later he restated the same point as his own.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Niemand korrigierte ihn. Niemand sagte: Sie hat das gerade gesagt. Der Raum behandelte meine Antwort als Rohmaterial. Seine Wiederholung als Urteil.'
            : 'Nobody corrected him. Nobody said: she just said that. The room treated my answer as raw material. His repetition as judgment.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Später, am Rand desselben Abends, sagte jemand — freundlich, als wäre es Hilfe — ich solle „etwas zugänglicher“ sein. Weniger scharf. Mehr lächeln. Die Arbeit war nicht das Problem. Die Form war das Problem.'
            : 'Later, at the edge of the same night, someone said — kindly, as if it were help — that I should be "a bit more approachable." Less sharp. Smile more. The work was not the problem. The form was the problem.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Zu präzise für eine Frau, die man gerne im Raum hat. Nicht laut genug für einen Mann, den man ernst nimmt.'
            : 'Too precise for a woman people like having in the room. Not loud enough for a man people take seriously.'}
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Das ist kein Missverständnis. Das ist, wie „unvollständig“ sich anfühlt: Du bist da. Du hast geliefert. Der Raum liest dich trotzdem als Entwurf einer Person, die noch nicht fertig ist.'
            : 'This is not a misunderstanding. That is what "incomplete" feels like: you are present. You delivered. The room still reads you as a draft of a person who is not finished yet.'}
        </p>

        <blockquote style={blockquoteStyle}>
          {isDE
            ? 'Überleben hieß nicht, männlicher zu werden. Es hieß, den Raum zu lesen, ohne mich selbst zu verlieren.'
            : 'Surviving did not mean becoming more like a man. It meant reading the room without losing myself.'}
        </blockquote>

        <SectionLabel>{isDE ? 'Nicht dieselbe sein' : 'Not Being the Same'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Früher habe ich versucht, die Lücke zu schließen. Schneller sprechen. Härter argumentieren. Weniger zeigen, dass etwas wehgetan hat. Eine akzeptablere Form werden.'
            : 'Early on I tried to close the gap. Speak faster. Argue harder. Show less when something hurt. Become a more acceptable shape.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das funktioniert kurz. Bis du merkst: Du hast nicht gewonnen. Du trägst nur eine männlichere Maske. Die passt auch nicht.'
            : 'That works for a while. Until you notice: you did not win. You only wore a more masculine mask. That did not fit either.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Was blieb, war etwas Europäischeres und Feministeres zugleich. Präzision statt Lautstärke. Dokumentation statt Drama. Arbeit, die bleibt, statt Performance, die verpufft. Räume verlassen, die nur eine Art von Person belohnen. Allein bauen, wenn die Tür nur für Jungs offensteht.'
            : 'What remained was something both more European and more feminist at once. Precision over volume. Documentation over drama. Work that stays, over performance that evaporates. Leaving rooms that only reward one kind of person. Building alone when the door only opens for boys.'}
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Nicht weil Frauen leiser sein sollten. Weil Macht, die nur in männlicher Grammatik erkannt wird, keine Macht ist. Es ist Erlaubnis.'
            : 'Not because women should be quieter. Because power that is only recognized in male grammar is not power. It is permission.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Schweigen im Raum — wenn Senior-Leute zusehen und nichts sagen — ist kein Zufall. Das habe ich an anderer Stelle geschrieben. Weil es wahr ist. Und wahr bleiben muss.'
            : 'Silence in a room — when senior people watch and say nothing — is not an accident. I wrote about that elsewhere. Because it is true. And must stay true.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/harassment" style={linkStyle}>
            {isDE ? 'Jede Frau in Tech hat eine #MeToo-Geschichte →' : 'Every Woman in Tech Has a #MeToo Story →'}
          </Link>
        </p>

        <SectionLabel>{isDE ? 'Macht wieder ergreifen' : 'Grasping Power Again'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Macht zurückholen heißt nicht, auf einen Thron zu klettern. Es heißt, die Dinge zu besitzen, die Patriarchate gerne weichzeichnen. Namen auf Commits. Verträge. Zahlen, die du selbst geprüft hast. Texte, die nicht verschwinden, wenn jemand unangenehm wird. Ein öffentliches Archiv, das nicht von der Gnade eines Raumes abhängt.'
            : 'Grasping power again does not mean climbing onto a throne. It means owning the things patriarchal systems like to blur. Names on commits. Contracts. Numbers you checked yourself. Text that does not disappear when someone gets uncomfortable. A public archive that does not depend on the grace of a room.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist feministische Praxis in Infrastruktur-Sprache. Ausdruck, der bleibt. Wirtschaftliche Anerkennung, die nicht verhandelbar ist. Türen, die du für die nächste Frau etwas weiter offenlässt. Nicht aus Wut allein. Aus Klarheit.'
            : 'That is feminist practice in infrastructure language. Expression that remains. Economic recognition that is not optional. Doors you leave slightly more open for the next woman. Not from anger alone. From clarity.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/misread" style={linkStyle}>
            {isDE ? 'Missverstanden — aber sie kann alles werden →' : 'Misread — But She Can Become Anyone →'}
          </Link>
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ein Third-Culture-Kid ohne das alte Bewusstsein — ohne das eingebaute Gefühl, hier sei man natürlich zu Hause — kann trotzdem Macht bauen. Nicht indem sie so tut, als hätte sie das Handbuch bekommen. Indem sie ihr eigenes schreibt. Zeile für Zeile. Commit für Commit. Essay für Essay. Bis der Raum gezwungen ist, sie als vollständig zu lesen.'
            : 'A third-culture kid without the old consciousness — without the built-in feeling of being naturally at home — can still build power. Not by pretending she received the manual. By writing her own. Line by line. Commit by commit. Essay by essay. Until the room is forced to read her as complete.'}
        </p>

        <div style={closingBoxStyle}>
          <p style={closingTextStyle}>
            {isDE
              ? 'Sie war nicht dieselbe wie ein Mann.'
              : 'She was not the same as a man.'}
            <br />
            <span style={{ color: '#00ffea' }}>
              {isDE
                ? 'Sie musste es auch nicht sein,\num Macht wieder zu ergreifen.'
                : 'She did not need to be,\nto grasp power again.'}
            </span>
          </p>
          <p style={signatureStyle}>— AILEENA MACHINA / 2026</p>
        </div>

        <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dispatch#woman-in-tech" style={backLinkStyle}>
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

const blockquoteStyle: React.CSSProperties = {
  margin: '48px 0',
  padding: '28px 32px',
  background: 'rgba(0,255,234,0.04)',
  borderLeft: '3px solid #00ffea',
  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
  fontWeight: 600,
  letterSpacing: '0.05em',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.9)',
};

const linkStyle: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'none',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const closingBoxStyle: React.CSSProperties = {
  marginTop: 64,
  padding: '40px 32px',
  background: 'rgba(255,255,255,0.025)',
  borderTop: '1px solid rgba(255,255,255,0.07)',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
};

const closingTextStyle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
  fontWeight: 600,
  letterSpacing: '0.06em',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.88)',
  margin: 0,
  whiteSpace: 'pre-line',
};

const signatureStyle: React.CSSProperties = {
  marginTop: 20,
  fontFamily: 'monospace',
  fontSize: '0.6rem',
  letterSpacing: '0.3em',
  color: 'rgba(255,255,255,0.28)',
  textTransform: 'uppercase',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'monospace',
  fontSize: '0.6rem',
  letterSpacing: '0.35em',
  color: 'rgba(255,255,255,0.35)',
  textDecoration: 'none',
  textTransform: 'uppercase',
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
      marginTop: 48,
    }}>
      {children}
    </p>
  );
}
