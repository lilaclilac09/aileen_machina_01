'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * Why Rust Is Hot — short quotes from Huntley (+ Moss / codecentric).
 * Sibling to "Concepts You Think You Know": no invented thesis; Sources at the end.
 */

export default function WhyRustIsHotArticle() {
  return (
    <SubstackShell
      category="Method"
      date="2026.10.30"
      tags="Rust · Agents · Types · Back pressure · Compile loop"
      title="Why Rust Is Hot"
      dek="Short quotes on types as back pressure, agent loops, and why compile/test sensors have to stay fast. Not a thesis — a reading list with the lines that stick."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          「为什么 Rust 吃香」 in one frame: languages that reject invalid generations keep agents on the
          rails — and the wheel still has to turn fast. Quotes only; full pieces in{' '}
          <a href="#sources" style={inlineLink}>
            Sources
          </a>
          .
        </p>

        <SectionLabel>1 · Explainable, not readable</SectionLabel>
        <Quote cite="Geoffrey Huntley — software doesn't need to be readable anymore. it needs to be explainable.">
          Software doesn&apos;t need to be readable by a human. It needs to be explainable to a human.
        </Quote>

        <SectionLabel>2 · Types are back pressure</SectionLabel>
        <Quote cite="Huntley — readable">
          If you want a codebase that agents can maintain, you&apos;ll notice something quickly: a Rust
          codebase is far more maintainable with agents than a Python one. Types are a form of
          verification. They provide back pressure: compiler errors that the LLM picks up and fixes
          automatically, every loop.
        </Quote>
        <Quote cite="Huntley — readable">
          This is also why I can get away with cheaper models. Pick a language that does the
          verification for you, and you need less intelligence to stay on the rails.
        </Quote>
        <Quote cite="Huntley — readable (simulator-first)">
          I&apos;m building it in Rust and building the simulator first, then driving the agent to
          validate everything through the simulator. That has kept the agent on the rails remarkably
          well.
        </Quote>

        <SectionLabel>3 · Correctness vs wheel speed</SectionLabel>
        <Quote cite="Huntley — Ralph Wiggum as a &quot;software engineer&quot;">
          Specific programming languages have inbuilt back pressure through their type system.
        </Quote>
        <Quote cite="Huntley — ralph">
          Now you might be thinking, &ldquo;Rust! It&apos;s got the best type system.&rdquo; However,
          one thing with Rust is that the compilation speed is slow. It&apos;s the speed of the wheel
          turning that matters, balanced against the axis of correctness.
        </Quote>
        <Quote cite="Huntley — ralph">
          If you&apos;re using a dynamically typed language, I must stress the importance of wiring in
          a static analyser/type checker when Ralphing &hellip; If you do not, then you will run into a
          bonfire of outcomes.
        </Quote>

        <SectionLabel>4 · Drive harder; keep the loop fast</SectionLabel>
        <Quote cite="Huntley — The future belongs to people who can just do things">
          The stronger the type system of the language and the better the compiler errors the harder
          you can drive these LLMs. If the software doesn&apos;t compile and the compiler provides
          strong primitives that are compiling = success, the harder it goes.
        </Quote>
        <Quote cite="Huntley — dothings">
          Compilation times matter, and your test suite needs to run fast. The faster the inner loop,
          the faster you can provide reinforcement to the LLMs and reward it with a pass or fail.
        </Quote>

        <SectionLabel>5 · Don’t waste your back pressure</SectionLabel>
        <Quote cite="Moss — Don’t waste your back pressure">
          This means you spend your back pressure (the time you spend giving feedback to agents) on
          typing a message telling the agent it missed an import. This scales poorly and limits you to
          working on simple problems.
        </Quote>
        <Quote cite="Moss — Don’t waste your back pressure">
          Bonus points go to languages that work to produce excellent error messages (think Rust, Elm
          and even Python). These messages are fed directly back into the LLM so the more guidance or
          even suggested resolutions the better.
        </Quote>
        <Quote cite="Huntley — don’t waste your back pressure">
          software engineering is now about preventing failure scenarios and preventing the wheel from
          turning over through back pressure to the generative function
        </Quote>
        <Quote cite="Huntley — pressure">
          If you aren&apos;t capturing your back-pressure then you are failing as a software engineer.
        </Quote>

        <SectionLabel>6 · Sensors in the coding loop</SectionLabel>
        <Quote cite="Johannes Barop / codecentric — The Bottleneck in the AI Coding Loop">
          Build, compiler and tests are sensors.
        </Quote>
        <Quote cite="codecentric">
          A slow sensor slows down the coding loop, because the agent has to wait for the result before
          the next step.
        </Quote>
        <Quote cite="Huntley via codecentric (back-pressure dosage)">
          Back-pressure is part art, part engineering [...] you need &ldquo;just enough&rdquo; to
          reject invalid generations (aka &ldquo;hallucinations&rdquo;) but if the wheel spins too
          slow (&ldquo;tests take a long time to run or for the application to compile&rdquo;) then
          it&apos;s too much resistance.
        </Quote>
        <Quote cite="codecentric on pre-commit / agents">
          Hooks were always considered annoying because they hold humans up. When the agent makes the
          commit, the agent waits for the hook. Nobody pays those seconds out of their own time any
          more. An error the hook catches no longer arrives in review.
        </Quote>

        <SectionLabel id="sources">Sources</SectionLabel>
        <ol style={sourceList}>
          <li>
            Geoffrey Huntley —{' '}
            <a
              href="https://ghuntley.com/readable/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              software doesn&apos;t need to be readable anymore. it needs to be explainable.
            </a>
          </li>
          <li>
            Geoffrey Huntley —{' '}
            <a
              href="https://ghuntley.com/ralph/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Ralph Wiggum as a &quot;software engineer&quot;
            </a>
          </li>
          <li>
            Geoffrey Huntley —{' '}
            <a
              href="https://ghuntley.com/dothings/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              The future belongs to people who can just do things
            </a>
          </li>
          <li>
            Geoffrey Huntley —{' '}
            <a
              href="https://ghuntley.com/pressure/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              don&apos;t waste your back pressure
            </a>{' '}
            (framing) · Moss —{' '}
            <a
              href="https://banay.me/dont-waste-your-backpressure/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Don&apos;t waste your back pressure
            </a>
          </li>
          <li>
            Johannes Barop / codecentric —{' '}
            <a
              href="https://www.codecentric.de/en/knowledge-hub/blog/the-bottleneck-in-the-ai-coding-loop"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              The Bottleneck in the AI Coding Loop
            </a>
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
