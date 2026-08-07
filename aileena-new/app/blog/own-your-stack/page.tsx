'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * Small English note: good code judgment, own GitHub, know your stack, know what you need.
 * Sits next to the post-training curriculum spine.
 */

export default function OwnYourStackArticle() {
  return (
    <SubstackShell
      category="Software"
      date="2026.08.07"
      tags="Engineering · GitHub · Stack · Taste · Ownership"
      title="Know Good Code. Own the Repo. Know Your Stack."
      dek="Four habits that matter more than another framework tutorial: recognizing good code, writing and owning it on GitHub, knowing your actual stack, and knowing what you need before you build."
      showNarration={false}
    >
      <article style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 120px' }}>
        <p style={bodyStyle}>
          Post-training, agents, Rust, CLIs — none of that sticks if you cannot tell good code from
          noise, or name what you already run. This page is the meta-layer beside{' '}
          <Link href="/blog/post-training-path" style={linkStyle}>
            Post-Training Path
          </Link>
          .
        </p>

        <SectionLabel>1 · Know what good code is</SectionLabel>
        <p style={bodyStyle}>
          Good code is not &ldquo;clever.&rdquo; It is readable under time pressure, fails loudly, has a
          named contract (inputs, outputs, errors), and can be tested or eval&apos;d without a
          ceremony. Prefer small diffs that change one behavior. Prefer names that match the
          product surface. Prefer deleting dead paths over decorating them.
        </p>
        <p style={bodyStyle}>
          Taste is trained by reading strong repos and shipping your own. If you cannot explain
          why a change is better in one sentence, it is usually not ready.
        </p>

        <SectionLabel>2 · Write it and own it on GitHub</SectionLabel>
        <p style={bodyStyle}>
          Ownership means a public or private repo with history: commits that say <em>why</em>, a
          README that states the product surface, and a gate you trust (tests, holdout eval, CI).
          Stars are optional. A clone path and a green check are not.
        </p>
        <p style={bodyStyle}>
          Lab example:{' '}
          <a
            href="https://github.com/lilaclilac09/polar-lab"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            polar-lab
          </a>{' '}
          — owned data, owned adapters, holdout score. Site + agents live in the same habit: ship
          to a repo you control, then prove the path works.
        </p>

        <SectionLabel>3 · Know your stack</SectionLabel>
        <p style={bodyStyle}>
          Write down the stack you actually use in production — not the wishlist. Languages,
          runtimes, model providers, eval gates, deploy targets. Update it when reality changes.
          When someone asks &ldquo;what do you build with?&rdquo; the answer should be boring and
          accurate.
        </p>
        <ul style={listStyle}>
          <li>Solana / systems: Rust where the hot path matters; thin CLIs around it.</li>
          <li>
            Agents: harness + tools (CLI / MCP); measurement separate from chat vibes. Learn shape
            from{' '}
            <a
              href="https://github.com/gakonst/incur-rs"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              incur-rs
            </a>{' '}
            (Rust CLI that exposes the same graph as MCP / HTTP / skills).
          </li>
          <li>
            Post-train lab:{' '}
            <code style={codeStyle}>Qwen2.5-0.5B-Instruct</code> + LoRA, exact_match holdout — see{' '}
            <Link href="/blog/local-models" style={linkStyle}>
              local models
            </Link>
            .
          </li>
          <li>Product web: Next.js surface you can open and demo end-to-end.</li>
        </ul>

        <SectionLabel>4 · Know what you need</SectionLabel>
        <p style={bodyStyle}>
          Before coding: name the user-visible success in one sentence. Name the smallest path that
          proves it. Name the eval or check that would fail if you are wrong. Name what you are{' '}
          <em>not</em> building this week.
        </p>
        <p style={bodyStyle}>
          &ldquo;What do you need?&rdquo; is the operator question — env keys, a GPU hour, a holdout
          file, a deploy target, a reviewer. If you cannot list needs, you will invent scaffolding
          instead of shipping.
        </p>

        <SectionLabel>Keep these next to the curriculum</SectionLabel>
        <ol style={listStyle}>
          <li>
            <Link href="/blog/post-training-path" style={linkStyle}>
              Post-Training Path
            </Link>{' '}
            — Rust → CLI → eval → SFT.
          </li>
          <li>
            <Link href="/blog/cli" style={linkStyle}>
              CLI essay
            </Link>{' '}
            — thin operator surface.
          </li>
          <li>
            <Link href="/blog/software-watch" style={linkStyle}>
              Software YouTube (MCP)
            </Link>{' '}
            — protocol explainers.
          </li>
        </ol>

        <p style={{ ...bodyStyle, marginTop: 48 }}>
          <Link href="/blog/post-training-path" style={linkStyle}>
            ← Post-training path
          </Link>
        </p>
      </article>
    </SubstackShell>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(17, 17, 17, 0.84)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const linkStyle: React.CSSProperties = {
  color: '#111',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(17, 17, 17, 0.28)',
  textUnderlineOffset: 3,
};
const codeStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.88em',
  background: 'rgba(17, 17, 17, 0.06)',
  padding: '1px 6px',
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(17, 17, 17, 0.84)',
  marginBottom: 24,
  paddingLeft: 22,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.45em',
        color: '#008f84',
        textTransform: 'uppercase',
        marginBottom: 20,
        marginTop: 56,
        opacity: 0.9,
      }}
    >
      {children}
    </p>
  );
}
