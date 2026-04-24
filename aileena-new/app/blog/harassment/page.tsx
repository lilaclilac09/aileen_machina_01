'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function HarassmentArticle() {
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
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/#blog" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
          textTransform: 'uppercase', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
          Archive
        </Link>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.55rem',
          letterSpacing: '0.4em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
        }}>
          AILEENA MACHINA
        </span>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 32px 64px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          {/* RESEARCH DISPATCH — highlighted */}
          <span style={{
            fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.45em',
            color: '#000', textTransform: 'uppercase',
            padding: '5px 12px',
            background: '#00ffea',
            fontWeight: 700,
          }}>
            RESEARCH DISPATCH
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}>
            2026.04.23
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}>
            18 MIN READ
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 5rem)',
          fontWeight: 700, letterSpacing: '0.04em',
          lineHeight: 1.08, marginBottom: 32, color: '#fff',
        }}>
          Backing Female Founders<br />and Women in Tech:<br />
          <span style={{ color: '#00ffea' }}>Every One Has a<br />#MeToo Story</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em', fontStyle: 'italic',
          borderLeft: '3px solid #00ffea', paddingLeft: 20, marginBottom: 0,
        }}>
          &ldquo;When nobody is listening, every woman in tech has a MeToo story.&rdquo;
        </p>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        {/* Disclaimer */}
        <div style={{
          marginBottom: 48, padding: '20px 24px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '3px solid rgba(255,255,255,0.2)',
        }}>
          <p style={{ ...bodyStyle, marginBottom: 12, fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Personal position
          </p>
          <p style={{ ...bodyStyle, marginBottom: 12, fontSize: '0.9rem' }}>
            The views expressed in this article are my own personal position. They do not represent, reflect, or reconcile with any business, organization, or professional context I am associated with. This is me speaking as an individual.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Scope:</strong> This piece is about women working in conventional economic structures — employees, engineers, founders, builders. If a woman chooses sex work, OnlyFans, or any other economic model that operates under a different recognized power/money structure, that is a separate conversation — one that deserves its own research and its own essay, not a footnote here.
          </p>
        </div>

        <p style={{ ...bodyStyle, fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.8)' }}>
          Not most. Every one.
        </p>
        <p style={bodyStyle}>
          This is not a metaphor. This is not an exaggeration for effect. This is the finding that emerges every time anyone bothers to ask the question seriously. Hunter Walk, a venture capital investor who has backed more female founders than nearly anyone in his industry, sat down with those founders and found the same thing each time. Not occasionally. Not in a majority of cases. Every single one.
        </p>
        <p style={bodyStyle}>
          When #MeToo became public, men said they had no idea. Women said nothing, because there was nothing to say. They already knew. They had always known. The surprise was the men&apos;s surprise.
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          That gap is not a communication failure. It is the system working correctly.
        </p>

        {/* Section 01 */}
        <SectionLabel>01 — It Almost Always Comes From Someone You Know</SectionLabel>
        <p style={bodyStyle}>
          The stranger model is wrong and it has always been wrong.
        </p>
        <p style={bodyStyle}>
          The U.S. Equal Employment Opportunity Commission data is unambiguous: workplace harassment is perpetrated overwhelmingly by people in existing power relationships with the target. A colleague. A manager. A mentor. A client. Someone whose name you know, whose messages you answer, whose approval carries weight in the room.
        </p>
        <p style={bodyStyle}>
          The familiarity is not incidental. It is the mechanism. You are slower to name something when it comes from someone familiar. You are less likely to be believed when he is well-regarded. You are more likely to absorb the doubt — <em>was I misreading it, we&apos;ve met before, I thought I knew who he was</em> — and that doubt is load-bearing. It holds the whole structure up.
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          This is not a design flaw. It is the design.
        </p>

        {/* Section 02 */}
        <SectionLabel>02 — It Is About Power. It Was Always About Power.</SectionLabel>
        <p style={bodyStyle}>
          Harassment is not impulsive. It is not a compliment that went too far. Organizational psychology research, including foundational work on power and social hierarchy (Fiske, 1993; Pratto &amp; Walker, 2004), documents that individuals in positions of power frequently use sexual behavior as a dominance signal — not out of attraction, but out of control-seeking.
        </p>
        <p style={bodyStyle}>
          The quid pro quo pattern — <em>&ldquo;bring me this, sleep with me, and I&apos;ll give you access, volume, introductions, visibility&rdquo;</em> — is documented extensively in finance, tech, music, and every industry where gatekeeping exists. It is a calculated exchange offer that exploits professional vulnerability. It is designed to make you feel that your career depends on your compliance.
        </p>
        <p style={bodyStyle}>
          The physical version functions the same way. I was at an event hosted by Monad Foundation in Singapore, alone. A male acquaintance — someone I knew, not well — had been explicitly told by someone in the room to make clear he was not my partner. He was occupied elsewhere. Someone came up behind me suddenly and placed his hand on my shoulder and squeezed. Not a greeting. Deliberately threatening. Senior people nearby saw it. Nobody said anything. Nobody moved. So I stopped defending myself, and I kept moving.
        </p>
        <p style={bodyStyle}>
          There are other incidents I could name. I am choosing not to. That one is enough to illustrate what the pattern looks like when it is operating in a room full of witnesses.
        </p>

        <blockquote style={{
          margin: '48px 0', padding: '28px 32px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '3px solid #00ffea',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.55,
          color: 'rgba(255,255,255,0.9)',
        }}>
          Both the verbal and physical methods share the same logic: use a woman&apos;s need for professional safety against her.
        </blockquote>

        {/* Section 03 */}
        <SectionLabel>03 — Why You May Not Defend Yourself — And Why That Is Not Your Failure</SectionLabel>
        <p style={bodyStyle}>
          There is a physiological and psychological reason why many women freeze, go silent, or disengage in the moment harassment occurs — and why they often don&apos;t report it afterward.
        </p>
        <p style={bodyStyle}>
          The trauma response — freeze, fawn, or flight — is not weakness. It is a nervous system response to perceived threat where the brain calculates that overt resistance may escalate danger. In environments where senior people are present and doing nothing, the brain also calculates: <em>there is no institutional support here.</em> Both assessments are often accurate.
        </p>
        <p style={bodyStyle}>
          Psychologist Judith Herman&apos;s research on coercive control documents that environments of repeated low-level intimidation — the kind that never quite crosses a line visible enough for others to act on — progressively erode a person&apos;s sense of what she is entitled to defend. This is not an accident of the situation. It is a predictable outcome of the design.
        </p>
        <p style={bodyStyle}>
          If you have been in this position — if you saw it happening to you, felt it clearly, and still didn&apos;t act — you were not weak. You were responding rationally to an environment that had already told you it would not back you.
        </p>

        {/* Section 04 */}
        <SectionLabel>04 — The Ambiguous Manager</SectionLabel>
        <p style={bodyStyle}>
          This form is the most difficult to name because it is constructed specifically to resist naming.
        </p>
        <p style={bodyStyle}>
          A superior demonstrates interest in a female subordinate that exceeds professional necessity. Private conversations. Messages unrelated to work. Comments on appearance embedded in performance feedback. The language of special connection — <em>you and I understand each other in a way the others don&apos;t.</em> No single incident clears the threshold for a formal complaint. The pattern is legible. The individual data points are not.
        </p>
        <p style={bodyStyle}>
          Organizational psychology calls this supervisory emotional coercion. The superior uses access to promotion, evaluation, and opportunity as leverage to produce emotional dependency. Nothing needs to be stated. The condition — <em>he appears to have personal interest in me and he controls my review</em> — is sufficient to distort every professional decision she makes from that point forward. Caution. Withdrawal. Accommodation. Each of these outcomes serves him.
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          The ambiguity is not a failure of communication. It is the product itself.
        </p>
        <p style={bodyStyle}>
          When you attempt to maintain professional distance and his attitude changes — cooler, fewer opportunities, a shift in how your work is discussed — that response is evidence. It was not a professional relationship before you created distance. If it were, distance would not have changed anything.
        </p>

        <div style={{ margin: '40px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ ...bodyStyle, marginBottom: 14, color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Signs to notice</p>
          {[
            'He contacts you with frequency or content that exceeds work necessity',
            'He embeds personal evaluations unrelated to work into professional feedback',
            'He suggests you share a special understanding that other colleagues don\'t have',
            'He shows personal interest in your career beyond normal management scope',
            'When you maintain professional distance, his attitude noticeably cools or your opportunities diminish',
          ].map((item, i) => (
            <p key={i} style={{ ...bodyStyle, marginBottom: 8, paddingLeft: 16, borderLeft: '1px solid rgba(0,255,234,0.2)', fontSize: '0.95rem' }}>
              {item}
            </p>
          ))}
        </div>

        {/* Section 05 */}
        <SectionLabel>05 — Seniority Does Not Protect You</SectionLabel>
        <p style={bodyStyle}>
          Many women survive their early careers on a specific belief: <em>if I get senior enough, powerful enough, established enough, this will stop.</em>
        </p>
        <p style={bodyStyle}>
          A CMO I know has a MeToo story.
        </p>
        <p style={bodyStyle}>
          Not a junior employee. Not someone without standing. A CMO.
        </p>
        <p style={bodyStyle}>
          The belief that seniority confers immunity is false at every level of the evidence. In 2022, TIME magazine interviewed more than thirty current and former members of the effective altruism community — a movement built explicitly around ethics and doing good — and found that seven women reported harassment, coercion, and sexual assault within it. The community&apos;s own welfare point person fielded roughly twenty complaints per year across seven years. This is not an industry known for power asymmetry and bad actors. This is a community organised around moral philosophy. It made no difference.
        </p>
        <p style={bodyStyle}>
          The underlying variable — your gender being treated as a permanent liability — does not resolve at any rung of the hierarchy. The specific forms may shift. The openness of it may diminish. The leverage becomes more sophisticated. The fact of it does not disappear.
        </p>
        <p style={bodyStyle}>
          Young women carry the belief in seniority as a destination because they need something to move toward. That is understandable. But the belief is false, and it costs them. It makes them treat what is structural as temporary. It makes them wait for a threshold that does not exist.
        </p>

        {/* Section 06 */}
        <SectionLabel>06 — The People Who Watched</SectionLabel>
        <p style={bodyStyle}>
          In groups, responsibility diffuses. The bystander effect, documented by Darley and Latané in 1968, establishes that the presence of multiple observers decreases the likelihood that any individual will intervene. The more witnesses, in many cases, the less action.
        </p>
        <p style={bodyStyle}>
          Senior witnesses compound this. Their inaction does not read as neutrality. It reads as permission — to the person doing it, and to every other person in the room calculating whether this environment is safe.
        </p>
        <p style={bodyStyle}>
          A single incident that goes unaddressed by visible authority increases the probability of future incidents in the same environment. This is not speculation. It is documented in workplace culture research. The silence propagates forward.
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
          If you watched and said nothing: you made a choice. The consequences of that choice were paid by someone else.
        </p>

        {/* Section 07 */}
        <SectionLabel>07 — If They Threaten Your Job</SectionLabel>
        <p style={bodyStyle}>
          Threatening employment in response to refusal or reporting is illegal retaliation in most jurisdictions. It is a separate offense from the harassment itself, often easier to demonstrate because it has a clear before and after.
        </p>
        <p style={bodyStyle}>
          <strong>The explicit version:</strong> <em>if you report this, you will not have a job here.</em>
        </p>
        <p style={bodyStyle}>
          <strong>The implicit version:</strong> performance reviews that deteriorate after refusal. Removal from projects. Exclusion from meetings. Workloads constructed to fail. No one says the words. The trajectory says them.
        </p>
        <p style={bodyStyle}>
          The implicit version has a name: <strong>constructive dismissal</strong> — engineering conditions sufficiently hostile that the target resigns. Courts treat it as wrongful termination because the intent is identical.
        </p>
        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(0,255,234,0.03)', border: '1px solid rgba(0,255,234,0.12)' }}>
          <p style={{ ...bodyStyle, marginBottom: 0, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            Do not resign. This is the most important instruction in this document. Resignation surrenders legal standing. Document every change in your treatment — dates, specifics, written communications showing a shift in tone or opportunity. Stay employed while you build the record unless your physical safety is at immediate risk. Before you sign anything, consult a lawyer. In most countries this consultation is available at no cost through legal aid referral services.
          </p>
        </div>

        {/* Section 08 */}
        <SectionLabel>08 — If They Threaten You Directly</SectionLabel>
        <p style={bodyStyle}>
          A threat is evidence. It is the moment the other person has demonstrated, on record, that they know they have done something they need you to stay quiet about.
        </p>
        {[
          ['Physical threats', 'Report to police immediately. You do not need to wait for harm.'],
          ['Reputational threats', 'I\'ll make sure you never work here again, I know people — are constructed to make your professional survival feel conditional on silence. A person with unchecked institutional power to destroy your career without consequence does not warn you. They act. The warning is itself evidence of uncertainty.'],
          ['Blackmail and extortion', 'Threatening to release private material unless you comply — is a criminal offense. Not a harassment violation. A crime. Report it as one.'],
        ].map(([label, text]) => (
          <p key={label} style={bodyStyle}>
            <strong>{label}:</strong> {text}
          </p>
        ))}
        <p style={bodyStyle}>
          Do not delete anything. Screenshot every message. Forward to a personal account outside any shared system. Send one written response: <em>&ldquo;I am asking you not to contact me further.&rdquo;</em> One sentence. Do not negotiate. Do not explain. Do not apologize.
        </p>
        <p style={bodyStyle}>
          Tell one person you trust, immediately. Not for permission. To create a witness and a timestamp.
        </p>

        {/* Section 09 */}
        <SectionLabel>09 — The Cycle</SectionLabel>
        <p style={bodyStyle}>
          Women speak. Nobody catches it. It gets treated as a personal problem, an isolated incident, an overreaction. They are told to consider the team. They are told to think about what they want their reputation to be. Eventually they stop speaking. The outside world concludes the problem is smaller than it is. No structure changes. The next woman arrives and the cycle begins again.
        </p>
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          This is not entropy. This is maintenance. Someone benefits from it continuing and that person is not you.
        </p>

        {/* Section 10 */}
        <SectionLabel>10 — What You Are Actually Dealing With</SectionLabel>
        <p style={bodyStyle}>
          You are not dealing with individual men who lack social awareness. You are dealing with a system that has processed thousands of these incidents before yours and found the most efficient route to absorb them without producing consequences. It knows how to wait. It knows how to make you doubt. It knows how long most people can sustain a complaint before they need to get back to their lives.
        </p>
        <p style={bodyStyle}>
          The tools in this document exist because the system is beatable. Not easily. Not without cost. But the legal exposure on the other side is real, the documentation requirements are achievable, and the threats are frequently less executable than they are delivered.
        </p>

        {/* Closing */}
        <div style={{
          marginTop: 72, padding: '44px 36px',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            fontSize: 'clamp(1.15rem, 2.5vw, 1.55rem)',
            fontWeight: 600, letterSpacing: '0.05em',
            lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', margin: '0 0 16px',
          }}>
            Name it. Write it down. Do not leave quietly.
          </p>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px',
          }}>
            The person on the other side of this is counting on you to disappear. That is the only strategy that requires your participation.
          </p>
          <p style={{
            fontFamily: 'monospace', fontSize: '0.6rem',
            letterSpacing: '0.3em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', margin: 0,
          }}>
            — AILEENA / 2026
          </p>
        </div>

        {/* References */}
        <div style={{ marginTop: 64 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: '0.6rem',
            letterSpacing: '0.4em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            References
          </p>
          {[
            { text: 'Walk, H. (2017). What I Learned Backing Female Founders: Every One Has a #MeToo Story.', href: 'https://hunterwalk.medium.com/what-i-learned-backing-female-founders-every-one-has-a-metoo-story-b767e0f40cc0', label: 'hunterwalk.medium.com' },
            { text: 'Steinmetz, K. (2023). Effective Altruism Has a Sexual Harassment Problem, Women Say. TIME.', href: 'https://time.com/6252617/effective-altruism-sexual-harassment/', label: 'time.com' },
            { text: 'U.S. Equal Employment Opportunity Commission. (2016). Report of the Co-Chairs of the EEOC Select Task Force on the Study of Harassment in the Workplace.', href: null, label: null },
            { text: 'Herman, J. (1992). Trauma and Recovery. Basic Books.', href: null, label: null },
            { text: 'Darley, J. M., & Latané, B. (1968). Bystander intervention in emergencies: Diffusion of responsibility. Journal of Personality and Social Psychology, 8(4), 377–383.', href: null, label: null },
            { text: 'Fiske, S. T. (1993). Controlling other people: The impact of power on stereotyping. American Psychologist, 48(6), 621–628.', href: null, label: null },
            { text: 'Pratto, F., & Walker, A. (2004). The bases of gendered power. In The Psychology of Gender. Guilford Press.', href: null, label: null },
            { text: 'Johnson, M. P. (2008). A Typology of Domestic Violence. Northeastern University Press.', href: null, label: null },
          ].map((ref, i) => (
            <p key={i} style={{
              fontSize: '0.82rem', lineHeight: 1.75,
              color: 'rgba(255,255,255,0.3)', marginBottom: 10,
              letterSpacing: '0.01em',
            }}>
              {ref.text}{ref.href && <> <a href={ref.href} target="_blank" rel="noopener noreferrer" style={{ color: '#00ffea', opacity: 0.7, textDecoration: 'none' }}>{ref.label}</a></>}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem',
            letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)',
            textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            ← Back to Archive
          </Link>
        </div>

      </article>
    </div>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.62)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace', fontSize: '0.58rem',
      letterSpacing: '0.45em', color: '#00ffea',
      textTransform: 'uppercase', marginBottom: 20, marginTop: 60,
      opacity: 0.85,
    }}>
      {children}
    </p>
  );
}
