'use client';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import SubstackShell from '../_substack/SubstackShell';

export default function SuffocatingBiasArticle() {
  const { language } = useLanguage();
  const isDE = language === 'DE';

  return (
    <SubstackShell
      isDE={isDE}
      category="Essay"
      date="2026.08.12"
      tags={isDE ? 'Frauen in Tech · Kultur · Zuversicht' : 'Women in Tech · Culture · Confidence'}
      title={isDE
        ? 'Die erstickende Voreingenommenheit'
        : 'The Suffocating Bias'}
      dek={isDE
        ? 'Warum du sie aushalten solltest — und mit 100% Zuversicht ändern. Was englische und europäische Kultur mich darüber gelehrt hat, worum es in Amerika geht.'
        : 'Why you should bear with it — and change it with 100% confidence. What English and European culture taught me about what America is about.'}
    >
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={{ ...bodyStyle, fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Bias erstickt nicht laut. Es senkt die Decke, bis du dich bückst, ohne zu merken, dass du dich bückst.'
            : 'Bias does not suffocate loudly. It lowers the ceiling until you duck without noticing you ducked.'}
        </p>

        <SectionLabel>{isDE ? 'Die Luft im Raum' : 'The Air in the Room'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Es beginnt selten mit einer Beleidigung. Meistens mit einer Korrektur, die wie Hilfe klingt. Ein Lächeln, das sagt: beeindruckend — für jemanden wie dich. Eine Pause, bevor dein Name wiederholt wird. Ein „interessant“, das deine Antwort in Rohstoff verwandelt, bis jemand mit dem richtigen Geschlecht, der richtigen Lautstärke, dem richtigen Pass sie als Urteil wiederholen kann.'
            : 'It rarely begins with an insult. Most often with a correction that sounds like help. A smile that says: impressive — for someone like you. A pause before your name is repeated. An "interesting" that turns your answer into raw material until someone with the right gender, the right volume, the right passport can restate it as judgment.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist die erstickende Voreingenommenheit: kein einzelner Schlag. Eine Atmosphäre. Du atmest sie ein, bis deine eigene Stimme dir zu scharf vorkommt. Bis du dich selbst editierst, bevor der Raum es tut.'
            : 'That is the suffocating bias: not a single blow. An atmosphere. You breathe it until your own voice starts to sound too sharp to you. Until you edit yourself before the room does.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ich habe darüber geschrieben, wie man in Räumen, die für Männer gebaut sind, als unvollständig gelesen wird. Das hier ist die nächste Schicht: was du tust, während die Luft dünn ist — und warum Aushalten nicht dasselbe ist wie Aufgeben.'
            : 'I have written about being read as incomplete in rooms built for men. This is the next layer: what you do while the air is thin — and why bearing with it is not the same as giving up.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/third-culture-power" style={linkStyle}>
            {isDE ? 'Third-Culture-Kid ohne Bewusstsein →' : 'Third Culture Kid Without Consciousness →'}
          </Link>
        </p>

        <SectionLabel>{isDE ? 'Was England mich gelehrt hat' : 'What England Taught Me'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Englische Kultur — zumindest die, die ich gelesen und geatmet habe — belohnt Untertreibung nicht als Feigheit. Als Kontrolle. Du sagst weniger, als du weißt. Du lässt die Arbeit sprechen. Du hältst die Linie, ohne Theater.'
            : 'English culture — at least the strain I read and breathed — rewards understatement not as cowardice. As control. You say less than you know. You let the work speak. You hold the line without theatre.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Didion: ein Satz, der hält, während die Welt sich weigert. Das ist keine amerikanische Show. Das ist kalibrierte Zeugenschaft. Du beobachtest. Du benennst. Du bleibst bei der Präzision, auch wenn der Raum Emotion als Wahrheit verkauft.'
            : 'Didion: a sentence that holds while the world refuses to. That is not American show. That is calibrated witness. You observe. You name. You stay with precision even when the room sells emotion as truth.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Aushalten, auf Englisch, heißt nicht: schlucke und lächle. Es heißt: verschwende keine Kraft an jede Mikroaggression als Finale. Speichere. Dokumentiere. Bleib handlungsfähig. Der „stiff upper lip“ ist nützlich, wenn er Selbstbeherrschung ist — giftig, wenn er Schweigen über Gewalt wird.'
            : 'Bearing with it, in English, does not mean: swallow and smile. It means: do not waste your whole battery treating every microaggression as the final boss. Record. Timestamp. Stay operational. The "stiff upper lip" is useful when it is self-command — toxic when it becomes silence over violence.'}
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'England hat mich gelehrt: Würde ist keine Performance. Sie ist die Weigerung, deine Form für jede Laune des Raumes umzuschreiben.'
            : 'England taught me: dignity is not a performance. It is the refusal to rewrite your shape for every mood of the room.'}
        </p>

        <SectionLabel>{isDE ? 'Was Europa mich gelehrt hat' : 'What Europe Taught Me'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Europäische Haltung — die, die ich meine, wenn ich „europäischste Feministin“ sage — ist keine Flagge. Es ist ein Maßstab. Arbeit ist ernst. Körper sind keine Dekoration. Fairness ist kein Luxus. Klarheit ist keine Kälte.'
            : 'European posture — the one I mean when I say "most European feminist" — is not a flag. It is a measure. Work is serious. Bodies are not decoration. Fairness is not a luxury. Clarity is not coldness.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'In Tech- und Crypto-Räumen wirkt das oft falsch: zu präzise, zu wenig dankbar für den Randplatz, zu wenig bereit, Lautstärke mit Kompetenz zu verwechseln. Europa hat mich gelehrt, diesen Irrtum nicht zu internalisieren.'
            : 'In tech and crypto rooms that often reads wrong: too precise, not grateful enough for the edge seat, not willing enough to confuse volume with competence. Europe taught me not to internalize that error.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Langsamkeit als Geduld, nicht als Schwäche. Ein Museum, ein Saal — nicht das ganze Gebäude in einer Stunde. Dieselbe Disziplin gilt für Bias: du musst nicht jeden Raum in einer Nacht reformieren. Du musst die Struktur sehen und eine Linie halten.'
            : 'Slowness as patience, not weakness. One gallery, one room — not the whole museum in an hour. The same discipline applies to bias: you do not have to reform every room in one night. You have to see the structure and hold a line.'}
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {isDE
            ? 'Europa hat mich gelehrt: Macht, die nur in männlicher Grammatik erkannt wird, ist keine Macht. Es ist Erlaubnis.'
            : 'Europe taught me: power that is only recognized in male grammar is not power. It is permission.'}
        </p>

        <SectionLabel>{isDE ? 'Was das über Amerika sagt' : 'What That Taught Me America Is About'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Durch diese beiden Linsen habe ich Amerika nicht als Feind gelesen. Als Betriebssystem.'
            : 'Through those two lenses I did not read America as an enemy. As an operating system.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Amerika belohnt die Behauptung. Du darfst den Raum nehmen, bevor er dich eingeladen hat. Du darfst 100% Zuversicht aussprechen, während du noch baust. Du darfst scheitern laut und wiederkommen lauter. Der Mythos ist: Wer glaubt, darf sprechen. Der Markt entscheidet später.'
            : 'America rewards the claim. You may take the room before it invites you. You may speak 100% confidence while you are still building. You may fail loudly and return louder. The myth is: whoever believes may speak. The market decides later.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist das Geschenk — und die Falle. Das Geschenk: Du musst nicht warten, bis jemand dich für vollständig erklärt. Du kannst Infrastruktur bauen, die den Raum zwingt, dich zu lesen. Die Falle: dieselbe Kultur verkauft Zuversicht als Lautstärke, Optimismus als Pflicht, und Bias als „Kultur-Fit“, wenn du die Show nicht mitspielst.'
            : 'That is the gift — and the trap. The gift: you do not have to wait until someone declares you complete. You can build infrastructure that forces the room to read you. The trap: the same culture sells confidence as volume, optimism as obligation, and bias as "culture fit" when you will not join the show.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Was englische und europäische Kultur mich über Amerika gelehrt hat, ist also nicht „Amerika ist falsch“. Es ist: Amerika ist ein Verstärker. Was du hineinlegst — Präzision oder Theater, Archiv oder Pose — kommt lauter wieder. Wenn du den Verstärker ohne eigenen Maßstab betrittst, erstickt dich der Bias schneller, weil er als Energie verkleidet ist.'
            : 'So what English and European culture taught me about America is not "America is wrong." It is: America is an amplifier. What you put in — precision or theatre, archive or pose — comes back louder. If you enter the amplifier without your own measure, bias suffocates you faster, because it is dressed as energy.'}
        </p>

        <blockquote style={blockquoteStyle}>
          {isDE
            ? 'Amerika sagt: beanspruche den Raum. England sagt: halte die Form. Europa sagt: Fairness ist der Maßstab. Zusammen: beanspruche den Raum, ohne deine Form zu verkaufen.'
            : 'America says: claim the room. England says: hold the form. Europe says: fairness is the measure. Together: claim the room without selling your form.'}
        </blockquote>

        <SectionLabel>{isDE ? 'Aushalten ist Strategie, nicht Unterwerfung' : 'Bearing With It Is Strategy, Not Surrender'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? '„Bear with it“ klingt nach Duldsamkeit. Ich meine etwas Schärferes.'
            : '"Bear with it" sounds like patience as obedience. I mean something sharper.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Aushalten heißt: du lässt Bias nicht entscheiden, ob du heute noch arbeitsfähig bist. Du erkennst das Muster. Du benennst es intern. Du lässt es nicht deine Commits, Verträge, Zahlen und Texte stehlen. Du gehst nicht bei jeder Beleidigung in den Vollbrand — weil Vollbrand der Raum will, wenn er dich als dramatisch und damit als unvollständig lesen will.'
            : 'Bearing with it means: you do not let bias decide whether you are still operational today. You recognize the pattern. You name it internally. You do not let it steal your commits, contracts, numbers, and text. You do not go full blaze at every slight — because full blaze is what the room wants when it wants to read you as dramatic and therefore incomplete.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Aushalten heißt nicht: Seniorität wird dich retten. Das ist eine tröstliche Lüge. Ich habe das anderswo geschrieben. Bias endet nicht, weil dein Titel wächst. Bias endet, wenn Evidenz, Zeugen und Archive schwerer wiegen als die Laune des Raumes.'
            : 'Bearing with it does not mean: seniority will save you. That is a comforting lie. I have written that elsewhere. Bias does not end because your title grew. Bias ends when evidence, witnesses, and archives weigh more than the mood of the room.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/harassment" style={linkStyle}>
            {isDE ? 'Jede Frau in Tech hat eine #MeToo-Geschichte →' : 'Every Woman in Tech Has a #MeToo Story →'}
          </Link>
        </p>

        <SectionLabel>{isDE ? 'Ändern — mit 100% Zuversicht' : 'Change It — With 100% Confidence'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Hier trifft die amerikanische Grammatik auf den europäischen Maßstab.'
            : 'Here the American grammar meets the European measure.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? '100% Zuversicht heißt nicht: du bist allwissend. Es heißt: du weigerst dich, deine Existenz mit einem Rabatt zu bepreisen. Du wartest nicht auf Erlaubnis, präzise zu sein. Du wartest nicht auf ein Lächeln, um deinen Namen auf dem Deckblatt zu lassen. Du baust das, was Patriarchate gerne weichzeichnen — und du tust es, als wäre die Frage bereits entschieden.'
            : '100% confidence does not mean: you are omniscient. It means: you refuse to price your existence at a discount. You do not wait for permission to be precise. You do not wait for a smile to leave your name on the cover slide. You build what patriarchal systems like to blur — and you do it as if the question were already settled.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Ändern heißt Infrastruktur. Namen auf Commits. Öffentliche Texte. Faire wirtschaftliche Rückgabe. Türen etwas weiter offen für die nächste Frau. Nicht Slogans als Ersatz für Arbeit. Ausdruck, der bleibt — bis Missverstehen teurer wird als Lesen.'
            : 'Change means infrastructure. Names on commits. Public text. Fair economic return. Doors left slightly more open for the next woman. Not slogans as a substitute for work. Expression that remains — until misreading costs more than reading.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/misread" style={linkStyle}>
            {isDE ? 'Missverstanden — aber sie kann alles werden →' : 'Misread — But She Can Become Anyone →'}
          </Link>
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Die Zuversicht ist amerikanisch in der Geste. Der Maßstab ist europäisch in der Ethik. Das Aushalten ist englisch in der Disziplin. Zusammen sind sie keine Identitätskosmetik. Sie sind ein Betriebshandbuch für Räume, die dich ersticken wollen, während sie Energie spielen.'
            : 'The confidence is American in gesture. The measure is European in ethics. The bearing is English in discipline. Together they are not identity cosmetics. They are an operating manual for rooms that want to suffocate you while playing energy.'}
        </p>

        <SectionLabel>{isDE ? 'Nicht dieselbe Luft atmen' : 'Do Not Breathe the Same Air Forever'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Du wirst einsam sein, wenn du die Decke nicht mehr senkst. Du wirst nicht allein sein, wenn du ein Archiv hast.'
            : 'You will be lonely when you stop ducking under the ceiling. You will not be alone when you have an archive.'}
        </p>
        <p style={bodyStyle}>
          <Link href="/blog/lion" style={linkStyle}>
            {isDE ? 'Sei kein Schaf — sei ein Löwe →' : "Don't Be a Sheep — Be a Lion →"}
          </Link>
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Die erstickende Voreingenommenheit bleibt Luft, solange niemand sie benennt. Aushalten hält dich handlungsfähig. 100% Zuversicht ändert die Grammatik. Englische und europäische Kultur haben mir gezeigt, worum es in Amerika geht: Verstärkung. Also verstärke das Richtige — Präzision, Fairness, Namen, die bleiben — bis der Raum die Decke heben muss.'
            : 'The suffocating bias stays air until someone names it. Bearing with it keeps you operational. 100% confidence changes the grammar. English and European culture showed me what America is about: amplification. So amplify the right things — precision, fairness, names that remain — until the room has to raise the ceiling.'}
        </p>

        <div style={closingBoxStyle}>
          <p style={closingTextStyle}>
            {isDE
              ? 'Halt die Form.'
              : 'Hold the form.'}
            <br />
            <span style={{ color: '#00ffea' }}>
              {isDE
                ? 'Beanspruche den Raum.\nÄndere die Luft — mit 100% Zuversicht.'
                : 'Claim the room.\nChange the air — with 100% confidence.'}
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
