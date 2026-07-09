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
        ? 'Ohne Handbuch — Macht wieder ergreifen'
        : 'No Manual for This — Grasping Power Again'}
      dek={isDE
        ? 'Third-Culture-Kid, europäisch geprägt, feministisch — und in Räumen, die noch immer nach Männern gebaut sind. Wie man überlebt, ohne dieselbe zu sein. Und wie man Macht nicht als Pose, sondern als Infrastruktur zurückholt.'
        : 'Third-culture kid, European in sensibility, feminist in practice — moving through rooms still built for men. How to survive without being the same. And how to take power back as infrastructure, not performance.'}
    >
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>{isDE ? 'Kein Handbuch' : 'No Manual'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Ein Third-Culture-Kid wächst zwischen Sprachen auf. Nicht „zweisprachig“ als Hobby — sondern ohne eine einzige Kultur, die stillschweigend die Regeln erklärt. Du lernst früh: Der Raum hat Erwartungen. Niemand gibt dir das Handbuch. Du beobachtest, imitierst, passt dich an — und merkst später, dass du die ganze Zeit ohne Bewusstsein für das Original-Skript operiert hast.'
            : 'A third-culture kid grows up between languages. Not "bilingual" as a hobby — but without any single culture that quietly explains the rules. You learn early: the room has expectations. Nobody hands you the manual. You watch, imitate, adapt — and only later realize you have been operating without consciousness of the original script.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist kein romantisches Exil. Es ist praktische Desorientierung. Du weißt, wie man in einem Raum höflich ist, aber nicht, welche Version von Höflichkeit hier zählt. Du weißt, wie man arbeitet, aber nicht, welche Signale „ernsthaft“ bedeuten und welche „niedlich“. Du wirst gut darin, mehrere Versionen von dir gleichzeitig zu halten — nicht weil du performst, sondern weil Überleben so funktioniert.'
            : 'This is not romantic exile. It is practical disorientation. You know how to be polite in a room, but not which version of politeness counts here. You know how to work, but not which signals mean "serious" and which mean "cute." You get good at holding several versions of yourself at once — not because you are performing, but because survival works that way.'}
        </p>

        <SectionLabel>{isDE ? 'Die europäischste Feministin im patriarchalen Raum' : 'The Most European Feminist in a Patriarchal Room'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Ich meine damit nicht „am meisten wie eine Europäerin aussehen“. Ich meine eine Haltung: dass Arbeit ernst ist, dass Körper nicht Dekoration sind, dass Macht nicht automatisch männlich ist, dass Fairness kein Luxus ist. In Tech- und Crypto-Räumen — oft amerikanisch laut, oft asiatisch schnell, fast überall männlich codiert — wirkt diese Haltung manchmal wie Sturheit. Manchmal wie Kälte. Manchmal wie Arroganz, wenn du nicht lächelst, wenn du nicht dankbar genug bist für einen Platz am Rand.'
            : 'I do not mean "looking the most European." I mean a posture: that work is serious, that bodies are not decoration, that power is not automatically male, that fairness is not a luxury. In tech and crypto rooms — often American-loud, often Asian-fast, almost everywhere male-coded — that posture can read as stubbornness. Sometimes as coldness. Sometimes as arrogance when you do not smile, when you are not grateful enough for a seat at the edge.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Patriarchat ist nicht nur „Männer sind schlecht“. Es ist ein Standardmaß: Wer spricht zuerst. Wer unterbricht. Wessen Name auf dem Deckblatt landet. Wessen Fehler als „Lernkurve“ und wessen als „nicht geeignet“ gelesen werden. Wenn du nicht wie ein Mann bist — nicht dieselbe Lautstärke, nicht dieselbe Selbstsicherheit, nicht dieselbe Bequemlichkeit mit Risiko — wirst du nicht als anders gelesen. Du wirst als unvollständig gelesen.'
            : 'Patriarchy is not only "men are bad." It is a default measure: who speaks first. Who interrupts. Whose name lands on the cover slide. Whose mistakes read as "learning curve" and whose as "not a fit." When you are not like a man — not the same volume, not the same certainty, not the same comfort with risk — you are not read as different. You are read as incomplete.'}
        </p>

        <blockquote style={blockquoteStyle}>
          {isDE
            ? '„Überleben hieß nicht, männlicher zu werden. Es hieß, den Raum zu lesen, ohne mich selbst zu verlieren.“'
            : '"Surviving did not mean becoming more like a man. It meant reading the room without losing myself."'}
        </blockquote>

        <SectionLabel>{isDE ? 'Nicht dieselbe sein' : 'Not Being the Same'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Früher habe ich versucht, die Lücke zu schließen. Schneller sprechen. Härter argumentieren. Weniger zeigen, dass etwas wehgetan hat. Das funktioniert kurz — bis du merkst, dass du nicht gewonnen hast, sondern nur eine männlichere Maske trägst, die am Ende auch nicht passt.'
            : 'Early on I tried to close the gap. Speak faster. Argue harder. Show less when something hurt. That works for a while — until you notice you did not win, you only wore a more masculine mask that did not fit either.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Was blieb, war etwas Europäischeres und Feministeres zugleich: Präzision statt Lautstärke. Dokumentation statt Drama. Arbeit, die bleibt, statt Performance, die verpufft. Nicht weil Frauen leiser sein sollten — sondern weil Macht, die nur in männlicher Grammatik erkannt wird, keine echte Macht ist, sondern Erlaubnis.'
            : 'What remained was something both more European and more feminist at once: precision over volume. Documentation over drama. Work that stays, over performance that evaporates. Not because women should be quieter — but because power that is only recognized in male grammar is not real power. It is permission.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ich habe gelernt, Räume zu verlassen, die nur eine Art von Person belohnen. Ich habe gelernt, allein zu arbeiten, wenn die Tür nur für Jungs offensteht. Ich habe gelernt, dass Schweigen im Raum — wenn Senior-Leute zusehen und nichts sagen — kein Zufall ist. Das habe ich an anderer Stelle geschrieben, weil es wahr ist und bleiben muss.'
            : 'I learned to leave rooms that only reward one kind of person. I learned to build alone when the door only opens for boys. I learned that silence in a room — when senior people watch and say nothing — is not an accident. I wrote about that elsewhere because it is true and must stay true.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/harassment" style={linkStyle}>
            {isDE ? 'Jede Frau in Tech hat eine #MeToo-Geschichte →' : 'Every Woman in Tech Has a #MeToo Story →'}
          </Link>
        </p>

        <SectionLabel>{isDE ? 'Macht wieder ergreifen' : 'Grasping Power Again'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Macht zurückholen heißt für mich nicht, auf einen Thron zu klettern. Es heißt, die Dinge zu besitzen, die Patriarchate gerne weichzeichnen: Namen auf Commits. Verträge. Zahlen, die du selbst geprüft hast. Texte, die nicht verschwinden, wenn jemand unangenehm wird. Ein öffentliches Archiv, das nicht von der Gnade eines Raumes abhängt.'
            : 'Grasping power again, for me, does not mean climbing onto a throne. It means owning the things patriarchal systems like to blur: names on commits. Contracts. Numbers you checked yourself. Text that does not disappear when someone gets uncomfortable. A public archive that does not depend on the grace of a room.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist feministische Praxis in Infrastruktur-Sprache: Ausdruck, der bleibt. Wirtschaftliche Anerkennung, die nicht verhandelbar ist. Türen, die du für die nächste Frau etwas weiter offenlässt. Nicht aus Wut allein — aus Klarheit.'
            : 'That is feminist practice in infrastructure language: expression that remains. Economic recognition that is not optional. Doors you leave slightly more open for the next woman. Not from anger alone — from clarity.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/misread" style={linkStyle}>
            {isDE ? 'Missverstanden — aber sie kann alles werden →' : 'Misread — But She Can Become Anyone →'}
          </Link>
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ein Third-Culture-Kid ohne das alte Bewusstsein — ohne das eingebaute Gefühl, hier sei man „natürlich“ zu Hause — kann trotzdem Macht bauen. Nicht indem sie so tut, als hätte sie das Handbuch bekommen. Sondern indem sie ihr eigenes schreibt: Zeile für Zeile, Commit für Commit, Essay für Essay, bis der Raum gezwungen ist, sie als vollständig zu lesen.'
            : 'A third-culture kid without the old consciousness — without the built-in feeling of being "naturally" at home — can still build power. Not by pretending she received the manual. By writing her own: line by line, commit by commit, essay by essay, until the room is forced to read her as complete.'}
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
