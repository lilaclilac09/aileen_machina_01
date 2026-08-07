'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * English curriculum spine: Rust → CLI → Eval → post-train a small base model.
 * YouTube stays on /blog/software-watch (MCP now; Rust clip when a URL lands).
 */

export default function PostTrainingPathArticle() {
  return (
    <SubstackShell
      category="Software"
      date="2026.08.07"
      tags="Rust · CLI · Eval · SFT · LoRA · Polar Lab · Post-training"
      title="Post-Training Path: Rust, CLI, Eval, Base Model"
      dek="A short order of operations if you want to post-train a small open model yourself — not rent an API brain. Rust literacy, thin CLIs, honest eval, then LoRA SFT on Qwen2.5-0.5B-Instruct (Polar Lab)."
      showNarration={false}
    >
      <article style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 120px' }}>
        <p style={bodyStyle}>
          Goal in one line: <strong style={strong}>owned data → owned weights → holdout score</strong>.
          The rented model can still be the harness. The lab model is the thing you measure.
          Full narrative of why that itch matters:{' '}
          <Link href="/blog/local-models" style={linkStyle}>
            How I Fell for Local Models
          </Link>
          . Meta habits (taste, GitHub ownership, stack, needs):{' '}
          <Link href="/blog/own-your-stack" style={linkStyle}>
            Know Good Code. Own the Repo.
          </Link>
          . Protocol side-quest (MCP theater):{' '}
          <Link href="/blog/software-watch" style={linkStyle}>
            Software YouTube — MCP
          </Link>
          .
        </p>

        <SectionLabel>1 · Rust — fast literacy, not a second career</SectionLabel>
        <p style={bodyStyle}>
          You need enough ownership / borrowing / Result to <em>read</em> systems tooling and agent
          runtimes — not to rewrite the universe. Target: follow a crate, fix a type error, understand
          why a hot path sits in Rust next to a thin CLI.
        </p>
        <p style={bodyStyle}>
          Video for a crash course: still open (paste a YouTube URL when you find one — it will land
          on the{' '}
          <Link href="/blog/software-watch" style={linkStyle}>
            software watch shelf
          </Link>
          ). Until then, the clean written path is{' '}
          <a
            href="https://google.github.io/comprehensive-rust/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Google Comprehensive Rust
          </a>
          .
        </p>

        <SectionLabel>2 · CLI — the operator surface</SectionLabel>
        <p style={bodyStyle}>
          Post-training without a CLI habit dies in notebooks. Prefer thin commands that do one job:
          wash data, dry-run train, score holdout, chat the adapter. Agents and traders already live
          here — the same shape shows up when you wire tools to models.
        </p>
        <p style={bodyStyle}>
          Essay:{' '}
          <Link href="/blog/cli" style={linkStyle}>
            The CLI Was Always the Trading Floor
          </Link>{' '}
          (thin CLI vs frameworks, and where MCP sits as the chat-side console). Study repo:{' '}
          <a
            href="https://github.com/gakonst/incur-rs"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            gakonst/incur-rs
          </a>{' '}
          — agent-native Rust CLI framework: one{' '}
          <code style={codeStyle}>#[derive(Incur)]</code> command graph → JSON Schema, MCP tools,
          skills, HTTP, completions. Walk the{' '}
          <code style={codeStyle}>examples/</code> path (
          <code style={codeStyle}>01_greet</code> → <code style={codeStyle}>05_http_and_mcp</code>
          ).
        </p>

        <SectionLabel>3 · Eval — scoreboard before training</SectionLabel>
        <p style={bodyStyle}>
          If you train first and &ldquo;feel&rdquo; later, you will fool yourself. Lock a holdout that
          never enters train JSONL. Prefer <strong style={strong}>exact_match</strong> (or another
          named metric) written to disk. Chat vibes are not a gate.
        </p>
        <p style={bodyStyle}>
          Polar Lab contracts live in the repo:{' '}
          <a
            href="https://github.com/lilaclilac09/polar-lab/blob/main/SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            SPEC.md
          </a>
          ,{' '}
          <a
            href="https://github.com/lilaclilac09/polar-lab/blob/main/HANDS_ON.md"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            HANDS_ON.md
          </a>
          , and{' '}
          <code style={codeStyle}>python scripts/05_eval_holdout.py --adapter outputs/sft/adapter</code>.
          On the site, the measured loop is the{' '}
          <Link href="/blog/local-models" style={linkStyle}>
            local-models
          </Link>{' '}
          essay.
        </p>

        <SectionLabel>4 · Post-train the base model</SectionLabel>
        <p style={bodyStyle}>
          Default smoke stack: <code style={codeStyle}>Qwen2.5-0.5B-Instruct</code> + LoRA SFT → chat
          the adapter → holdout eval. Do not put that tiny LoRA on a realtime voice loop; keep it a
          gated short-fact tool. Lab repo:{' '}
          <a
            href="https://github.com/lilaclilac09/polar-lab"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            lilaclilac09/polar-lab
          </a>
          .
        </p>

        <SectionLabel>Do this next</SectionLabel>
        <pre style={preStyle}>{`git clone https://github.com/lilaclilac09/polar-lab.git
cd polar-lab
python3 -m venv .venv && source .venv/bin/activate
# install torch for your device, then:
pip install -r requirements.txt

python scripts/check_data.py
python scripts/01_sft.py --dry-run
python scripts/01_sft.py --config configs/base.yaml
python scripts/04_chat.py --adapter outputs/sft/adapter --prompt "What is 7 * 6?"
python scripts/05_eval_holdout.py --adapter outputs/sft/adapter`}</pre>
        <p style={bodyStyle}>
          Read <code style={codeStyle}>exact_match</code> in the metrics JSON. That number is the
          product — not the loss curve alone.
        </p>

        <p style={{ ...bodyStyle, marginTop: 48 }}>
          <Link href="/blog/software-watch" style={linkStyle}>
            ← Software YouTube (MCP)
          </Link>
          {' · '}
          <Link href="/blog/local-models" style={linkStyle}>
            Local models essay →
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
const strong: React.CSSProperties = { color: '#111', fontWeight: 600 };
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
const preStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.78rem',
  lineHeight: 1.55,
  background: 'rgba(17, 17, 17, 0.04)',
  border: '1px solid rgba(17, 17, 17, 0.08)',
  padding: '16px 18px',
  overflowX: 'auto',
  marginBottom: 24,
  color: 'rgba(17, 17, 17, 0.82)',
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
