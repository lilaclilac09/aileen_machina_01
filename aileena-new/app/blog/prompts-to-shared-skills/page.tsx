'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * Personal prompting → shared skill infrastructure — quotes from one verified English article.
 * Sibling to "Concepts You Think You Know": no invented thesis; Sources at the end.
 */

export default function PromptsToSharedSkillsArticle() {
  return (
    <SubstackShell
      category="Method"
      date="2026.10.30"
      tags="Prompts · Skills · Shared infra · Agents · Workflows"
      title="From Personal Prompts to Shared Skills"
      dek="One English essay on moving prompting craft out of one person’s chat and into a shared skill library. Quotes only — Sources at the end."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          Don&apos;t lock capability in one person&apos;s prompt craft — make it team-shared
          infrastructure. Lines from Ben Reed only; full piece in{' '}
          <a href="#sources" style={inlineLink}>
            Sources
          </a>
          .
        </p>

        <SectionLabel>1 · From prompts to skills</SectionLabel>
        <Quote cite="Ben Reed — AI Skills: Turning Prompts Into Repeatable Workflows">
          At one end, you have prompting: ad-hoc instructions, restated every session, with behaviour
          that shifts depending on how well you phrase the request. At the other, you have
          multi-agent systems: networks of agents coordinating with each other, which sound powerful
          but tend to introduce more complexity than they remove.
        </Quote>
        <Quote cite="Reed">
          What&apos;s been more useful in practice sits in the middle: a single lead agent operating
          within clear constraints, using a set of reusable skills to do real work.
        </Quote>
        <Quote cite="Reed">
          The shift for me wasn&apos;t adding more agents, it was moving from prompts to skills.
        </Quote>

        <SectionLabel>2 · Prompts are disposable; work is not</SectionLabel>
        <Quote cite="Reed">
          Prompting works until it doesn&apos;t.
        </Quote>
        <Quote cite="Reed">
          You can get good results, but they&apos;re inconsistent. You repeat yourself. Small wording
          changes produce different outcomes. Over time, you spend more effort maintaining the prompt
          than doing the work.
        </Quote>
        <Quote cite="Reed">
          The underlying issue is that prompts are stateless and disposable, while the work you&apos;re
          doing is not.
        </Quote>
        <Quote cite="Reed">
          What you actually need is something closer to a reusable unit of behaviour. That&apos;s what
          a skill is.
        </Quote>

        <SectionLabel>3 · A skill is structured behaviour, not a better prompt</SectionLabel>
        <Quote cite="Reed">
          A skill isn&apos;t a better prompt. It&apos;s a structured definition of behaviour.
        </Quote>
        <Quote cite="Reed">
          The important part isn&apos;t the wording, it&apos;s the shape. A good skill makes it
          obvious: when it applies · how the work should be done · what the output must look like
        </Quote>
        <Quote cite="Reed">That structure is what makes it reusable.</Quote>

        <SectionLabel>4 · One shared skill library (no drift)</SectionLabel>
        <Quote cite="Reed">
          One practical detail that made this setup hold together is that the skills don&apos;t live
          inside a specific tool.
        </Quote>
        <Quote cite="Reed">
          They live in a single ~/AI directory, and both Claude and Codex access them via symlinks.
        </Quote>
        <Quote cite="Reed">
          That means both environments operate against the same skill library, the same structure, and
          the same expectations. There&apos;s no duplication, and more importantly, no drift.
        </Quote>
        <Quote cite="Reed">
          Because the skills are just structured markdown, there&apos;s nothing tool-specific about
          them. The &ldquo;system&rdquo; isn&apos;t Claude or Codex. It&apos;s the constraints and
          workflows defined in those files.
        </Quote>
        <Quote cite="Reed">The models become interchangeable execution layers.</Quote>

        <SectionLabel>5 · What scales</SectionLabel>
        <Quote cite="Reed">
          What scales isn&apos;t the number of agents. It&apos;s the quality of the skills.
        </Quote>
        <Quote cite="Reed">
          As the skill library improves, the system becomes more predictable. The model matters less
          because behaviour is already defined.
        </Quote>
        <Quote cite="Reed">
          Skills are the missing layer between prompting and systems.
        </Quote>
        <Quote cite="Reed">
          They turn one-off instructions into reusable workflows, enforce constraints where they
          matter, and make outputs predictable enough to build on.
        </Quote>
        <Quote cite="Reed">
          The gains don&apos;t come from adding more agents. They come from tightening how work is
          defined and making those definitions reusable.
        </Quote>

        <SectionLabel id="sources">Sources</SectionLabel>
        <ol style={sourceList}>
          <li>
            Ben Reed —{' '}
            <a
              href="https://eightythreeapps.co.uk/blog/2026-04-17-ai-skills-turning-prompts-into-repeatable-workflows/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              AI Skills: Turning Prompts Into Repeatable Workflows
            </a>{' '}
            (April 17, 2026)
          </li>
        </ol>

        <p style={{ ...bodyStyle, marginTop: 48 }}>
          Sibling reset:{' '}
          <Link href="/blog/semi-basics-review" style={inlineLink}>
            Concepts You Think You Know
          </Link>
          .
        </p>
      </article>
    </SubstackShell>
  );
}

function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      style={{
        fontSize: '0.7rem',
        letterSpacing: '0.18em',
        color: '#00ffea',
        textTransform: 'uppercase',
        marginBottom: 20,
        marginTop: 56,
        opacity: 0.8,
      }}
    >
      {children}
    </p>
  );
}

function Quote({ children, cite }: { children: React.ReactNode; cite: string }) {
  return (
    <figure style={{ margin: '0 0 28px' }}>
      <blockquote style={quoteStyle}>{children}</blockquote>
      <figcaption style={citeStyle}>— {cite}</figcaption>
    </figure>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
const quoteStyle: React.CSSProperties = {
  margin: 0,
  padding: '20px 24px',
  borderLeft: '3px solid #00ffea',
  background: 'linear-gradient(90deg, rgba(0,255,234,0.08), rgba(0,255,234,0.0))',
  fontSize: 'clamp(1.0rem, 2.2vw, 1.18rem)',
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.9)',
  fontStyle: 'italic',
};
const citeStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: '0.78rem',
  letterSpacing: '0.04em',
  color: 'rgba(255,255,255,0.45)',
  paddingLeft: 24,
};
const sourceList: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
  lineHeight: 1.85,
  color: 'rgba(255,255,255,0.7)',
  paddingLeft: 22,
  marginBottom: 24,
};
