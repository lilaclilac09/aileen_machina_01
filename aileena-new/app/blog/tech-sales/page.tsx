'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function TechSalesArticle() {
  return (
    <SubstackShell
      category="Perspective"
      date="2026.06.02"
      tags="Sales · Career · Tech · Communication"
      title="People Love to Buy. They Don't Love to Be Sold."
      dek="The best tech salespeople don't sell. They listen, they translate, they make the buyer feel right. You don't have to change your character to be one of them — you have to change your sales. Plus where 'thick skin' actually comes from and why most objections aren't objections."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          People love to buy. They don&rsquo;t love to be sold.
        </p>
        <p style={bodyStyle}>
          That sentence sits at the top of most things ever written about sales, and most of the
          time it&rsquo;s used to make a point that disappears in the next paragraph. Let me make a
          different point with it.
        </p>
        <p style={bodyStyle}>
          The reason it matters isn&rsquo;t that buyers are squeamish. Buyers will spend serious
          money on things they want. The reason it matters is that <em>selling</em> &mdash; in the
          way the word is usually used &mdash; is a sign you&rsquo;ve already lost. Hard sell.
          Manufactured urgency. Fake scarcity. The &ldquo;let me talk to my manager&rdquo; theatre.
          None of these would be necessary if the underlying exchange were obvious. They&rsquo;re
          the noise you make when the signal isn&rsquo;t there.
        </p>
        <p style={bodyStyle}>
          In tech in particular, the buyer on the other side of the line is sophisticated. They
          have access to the same papers, the same docs, the same competitor pages you do. They
          can spot a script, a closer, a manufactured anchor at fifty metres. The half-life of a
          hard-sell technique in tech is months. The half-life of someone who clearly understands
          what they&rsquo;re selling and what the buyer actually needs is careers.
        </p>
        <p style={bodyStyle}>
          So the real question isn&rsquo;t &ldquo;should you sell harder.&rdquo; It&rsquo;s what the
          best version of the soft path actually looks like.
        </p>

        <SectionLabel>A sale is two parties moving value across a line</SectionLabel>
        <p style={bodyStyle}>
          The most useful frame: every sale is two parties, each with something the other wants,
          agreeing on how to move it across a line. The seller has the product, the time, the
          expertise, the access. The buyer has money, approval authority, a problem. Both sides
          can see the line.
        </p>
        <p style={bodyStyle}>
          If both sides see the exchange clearly, the sale is easy &mdash; it might not even feel
          like a sale; it&rsquo;ll feel like a logistical conversation. If either side doesn&rsquo;t
          see it clearly, no amount of pressure will fix it. <strong style={strong}>Pressure is
          what happens when one side is trying to compensate for an exchange the other side
          doesn&rsquo;t believe in.</strong>
        </p>
        <p style={bodyStyle}>
          That reframes the whole job. Your job isn&rsquo;t to push. Your job is to be the side of
          the conversation that sees the exchange most clearly &mdash; and then to help the other
          side see it the same way.
        </p>

        <SectionLabel>Two kinds of buyer — read which one is across the line</SectionLabel>
        <p style={bodyStyle}>
          Inside &ldquo;see the exchange clearly&rdquo; sits a deeper move: every buyer is some mix
          of two types, and you have to read the mix before you say anything.
        </p>
        <p style={bodyStyle}>
          The <strong style={strong}>logical buyer</strong> wants numbers. ROI math. A clean spec
          sheet. A side-by-side comparison. They want to believe they made the rational choice. With
          this person, you sell with arithmetic &mdash; the worked example, the failure rate
          avoided, the dollar figure on the line at the end of the year. Skip the story. Go to the
          spreadsheet.
        </p>
        <p style={bodyStyle}>
          The <strong style={strong}>emotional buyer</strong> wants a feeling. They want to belong
          to something &mdash; the company that took the leap, the team that bought the tool
          everyone is talking about, the executive who is seen to have made the right bet. The
          numbers matter, but only as cover for a decision they&rsquo;re going to make on identity
          and story. With this person, you sell with the narrative &mdash; who else is on this
          side of the trade, what the story looks like when it works, how it sounds when they
          explain it at the next board meeting.
        </p>
        <p style={bodyStyle}>
          The mistake most salespeople make is treating everyone as one or the other.{' '}
          <strong style={strong}>Most buyers are 70/30 in one direction, not 100/0.</strong> The
          logical buyer still needs a story to tell their boss. The emotional buyer still needs
          one number to point at. The job is to figure out which is the dominant register and which
          is the supporting cover &mdash; then lead with the dominant and back it up with the cover.
        </p>
        <p style={bodyStyle}>
          You read this in the first five minutes. Listen to what they ask first. &ldquo;What&rsquo;s
          the ROI?&rdquo; &rarr; logical, lead with numbers. &ldquo;Who else uses this?&rdquo;
          &rarr; emotional, lead with story. &ldquo;I&rsquo;ve been wanting to try this for a
          while&rdquo; &rarr; emotional, identity-led. &ldquo;We did a vendor comparison and you
          were a finalist&rdquo; &rarr; logical, rigour-led. The cues are loud once you&rsquo;re
          listening for them.
        </p>
        <p style={bodyStyle}>
          The technical version of this rule: every objection has a logical surface and an
          emotional core. The agree-then-resolve move below has to land on both layers. The
          logical layer is the spec answer. The emotional layer is the story under the spec.
        </p>

        <SectionLabel>Don't change your character. Change your sales.</SectionLabel>
        <p style={bodyStyle}>
          The worst advice in sales is &ldquo;be confident,&rdquo; &ldquo;be a closer,&rdquo;
          &ldquo;fake it till you make it,&rdquo; &ldquo;act like the person who already has the
          deal.&rdquo; All of that asks you to perform someone you&rsquo;re not. It fails for three
          reasons.
        </p>
        <p style={bodyStyle}>
          First, buyers can tell. They&rsquo;ve been pitched by the loud, polished version a
          hundred times this quarter. The next one doesn&rsquo;t stand out.
        </p>
        <p style={bodyStyle}>
          Second, performing someone else is exhausting and unsustainable. You can do it for a
          quarter. You can&rsquo;t do it for a career.
        </p>
        <p style={bodyStyle}>
          Third, and most importantly: performing erodes the parts of you that actually win deals.
          Your taste. Your judgement. Your willingness to say &ldquo;honestly, that&rsquo;s not
          what we&rsquo;re best at &mdash; here&rsquo;s who you should talk to.&rdquo; Those are the
          moves that compound into reputation, and reputation is the actual asset in tech sales.
          You can&rsquo;t perform your way into it.
        </p>
        <p style={bodyStyle}>
          The substitute is precise. <strong style={strong}>You don&rsquo;t change your character.
          You change your sales.</strong> Sales is a skill, not a personality. It&rsquo;s listening
          before pitching. It&rsquo;s asking what someone is actually solving for instead of what
          they said they want. It&rsquo;s reading the room &mdash; who has authority, who controls
          the budget, who is the technical veto. It&rsquo;s writing a clear follow-up. It&rsquo;s
          not flinching when someone names a competitor.
        </p>
        <p style={bodyStyle}>
          None of those require you to be louder, faster, or fake. They require you to be present
          and prepared.
        </p>

        <SectionLabel>Thick skin is real, but not what people think</SectionLabel>
        <p style={bodyStyle}>
          The advice &ldquo;develop a thick skin&rdquo; is correct and almost always
          misunderstood.
        </p>
        <p style={bodyStyle}>
          It does not mean: you stop feeling rejection. You will feel it. A <em>no</em>,
          especially the kind you worked hard for, is going to sting. Thick skin doesn&rsquo;t
          mean you&rsquo;ve removed the nervous system.
        </p>
        <p style={bodyStyle}>
          It means: <strong style={strong}>you don&rsquo;t let a no become an identity claim</strong>.
          Most nos are about timing, budget, fit, internal politics, or a champion who lost their
          job. Vanishingly few nos are about you specifically. The buyer who said no this quarter
          will say yes in six months when their situation changes &mdash; but only if you
          don&rsquo;t take this no personally, hold a grudge, and burn the relationship between
          now and then.
        </p>
        <p style={bodyStyle}>
          A practical move: set a <strong style={strong}>no-clock</strong>. After a no, you get N
          minutes to feel it. Could be five, could be sixty. Then the timer rings and you go back
          to the next call. The feeling is allowed. The dwelling is not.
        </p>

        <SectionLabel>Objections are almost never objections</SectionLabel>
        <p style={bodyStyle}>
          This is the single most useful technical insight on the subject.
        </p>
        <p style={bodyStyle}>
          Most things buyers call &ldquo;objections&rdquo; &mdash; <em>too expensive</em>,
          <em> we already use someone else</em>, <em>I need to think about it</em>,{' '}
          <em>not the right time</em> &mdash; are not objections in the literal sense. They&rsquo;re
          requests for information delivered in a defensive frame.
        </p>
        <p style={bodyStyle}>
          The wrong response is to argue. Arguing turns the conversation into a fight and confirms
          the buyer&rsquo;s instinct that you&rsquo;re pushing.
        </p>
        <p style={bodyStyle}>
          The right response is to <strong style={strong}>agree with the underlying concern</strong>{' '}
          &mdash; because it&rsquo;s always real &mdash;{' '}
          <strong style={strong}>and then make the information that resolves it available</strong>.
          Three concrete patterns:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>&ldquo;It&rsquo;s too expensive.&rdquo;</strong>{' '}
            &mdash; &ldquo;Yes, it costs more than X. Here&rsquo;s what it does that X
            doesn&rsquo;t, and here&rsquo;s the math on when it pays back.&rdquo; Then shut up.
          </li>
          <li>
            <strong style={strong}>&ldquo;We already use Y.&rdquo;</strong>{' '}
            &mdash; &ldquo;Y is solid. Most of our current customers came from Y once they hit the
            constraint I think you&rsquo;ll hit next year. Want to walk through what that looks
            like?&rdquo;
          </li>
          <li>
            <strong style={strong}>&ldquo;Let me think about it.&rdquo;</strong>{' '}
            &mdash; &ldquo;Of course. What specifically do you want to think about? If it&rsquo;s
            budget, here&rsquo;s how that conversation has gone for others. If it&rsquo;s a
            technical question, we should get that answer now.&rdquo;
          </li>
        </ul>
        <p style={bodyStyle}>
          The unifying move is the same: don&rsquo;t argue against the surface objection. Find the
          question underneath, name it, answer it.
        </p>
        <p style={bodyStyle}>
          This is also why the best objection-handlers are the people who know the product cold.
          You can only resolve concerns specifically if you understand the technology specifically.
          <strong style={strong}> There is no charisma substitute for actually knowing what
          you&rsquo;re selling.</strong>
        </p>

        <SectionLabel>The shape</SectionLabel>
        <p style={bodyStyle}>
          Tech sales is one of the few jobs where being smart, curious, and honest is competitive
          advantage rather than a personality liability. Most other sales jobs reward volume,
          push, and choreography. Tech rewards the opposite &mdash; because the buyers on the
          other side reward the opposite.
        </p>
        <p style={bodyStyle}>
          You don&rsquo;t have to become a salesperson to be good at sales. You have to become
          someone with sales skills. The skills are: listening, reading, naming, translating,
          asking the question under the question, and recovering from a no fast enough to take the
          next call. None of those require you to change who you are. They require you to put down
          the script and pay attention.
        </p>
        <p style={bodyStyle}>
          People love to buy. <strong style={strong}>Be the person they want to buy from.</strong>
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Shared inline styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
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
