'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * English how-to: gakonst/incur-rs on the Rust step of the post-training path.
 * Comprehensive Rust → incur-rs examples → CLI / MCP / Polar SFT.
 */

export default function IncurRsHowToArticle() {
  return (
    <SubstackShell
      category="Software"
      date="2026.08.08"
      tags="Rust · CLI · MCP · Agents · incur-rs"
      title="How to Use incur-rs"
      dek="Agent-native Rust CLI: one #[derive(Incur)] command graph for humans and models — JSON Schema, MCP, skills, HTTP, completions. This is the apply project on the Rust step of the post-training path."
      showNarration={false}
    >
      <article style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 120px' }}>
        <p style={bodyStyle}>
          Repo:{' '}
          <a
            href="https://github.com/gakonst/incur-rs"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            github.com/gakonst/incur-rs
          </a>
          . Curriculum slot:{' '}
          <Link href="/blog/post-training-path" style={linkStyle}>
            Post-Training Path §1 Rust
          </Link>{' '}
          — after{' '}
          <a
            href="https://google.github.io/comprehensive-rust/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Comprehensive Rust
          </a>
          , before Polar eval / SFT. MCP video shelf:{' '}
          <Link href="/blog/software-watch" style={linkStyle}>
            Software YouTube
          </Link>
          .
        </p>

        <SectionLabel>What it is</SectionLabel>
        <p style={bodyStyle}>
          Incur is a Rust port of wevm/incur for CLIs that must work for <em>people and coding
          agents</em>. You define the CLI once; Incur derives JSON Schema, <code style={codeStyle}>--llms</code>{' '}
          manifests, skills, shell completions, HTTP routes, and MCP tools from the same graph.
          MSRV <strong style={strong}>Rust 1.88+</strong>. App dependency:{' '}
          <code style={codeStyle}>incur = &quot;0.1&quot;</code>.
        </p>

        <SectionLabel>A · Run the examples (Rust homework)</SectionLabel>
        <pre style={preStyle}>{`git clone https://github.com/gakonst/incur-rs.git
cd incur-rs
rustup install 1.88   # if needed

cargo run -p incur-examples --bin 01_greet -- Ada
cargo run -p incur-examples --bin 01_greet -- Ada --format json`}</pre>
        <p style={bodyStyle}>Walk the progressive path (each adds one layer):</p>
        <ol style={listStyle}>
          <li>
            <code style={codeStyle}>01_greet</code> — derive input + typed output
          </li>
          <li>
            <code style={codeStyle}>02_subcommands</code> — enums, defaults
          </li>
          <li>
            <code style={codeStyle}>03_ctas_and_errors</code> — stable errors + suggested next commands
          </li>
          <li>
            <code style={codeStyle}>04_middleware_and_config</code> — middleware + config
          </li>
          <li>
            <code style={codeStyle}>05_http_and_mcp</code> — HTTP + MCP from the same graph
          </li>
          <li>
            <code style={codeStyle}>06_tool_metadata</code> — agent instructions / safety hints (
            <code style={codeStyle}>--llms-full</code>)
          </li>
        </ol>
        <pre style={preStyle}>{`cargo run -p incur-examples --bin 02_subcommands -- install tracing --kind development
cargo run -p incur-examples --bin 03_ctas_and_errors -- create deploy --format json
cargo run -p incur-examples --bin 05_http_and_mcp
cargo run -p incur-examples --bin 06_tool_metadata -- --llms-full`}</pre>

        <SectionLabel>B · Use in your own crate</SectionLabel>
        <pre style={preStyle}>{`# Cargo.toml
[dependencies]
incur = "0.1"`}</pre>
        <p style={bodyStyle}>
          Pattern: <code style={codeStyle}>#[derive(Incur)]</code> on the CLI struct,{' '}
          <code style={codeStyle}>#[derive(IncurOutput)]</code> on the result,{' '}
          <code style={codeStyle}>#[incur::main]</code> +{' '}
          <code style={codeStyle}>Cli::incur(run).serve().await</code>. Full snippet lives in the
          upstream README quick start.
        </p>
        <p style={bodyStyle}>
          TTY shows human-friendly data. Pipes / agents get full envelopes. CTAs are{' '}
          <em>suggested</em> next commands — Incur never auto-runs them.
        </p>

        <SectionLabel>C · Agent surfaces (same binary)</SectionLabel>
        <pre style={preStyle}>{`your-cli --llms
your-cli --llms-full
your-cli deploy --schema --json

your-cli --mcp
your-cli mcp add --agent cursor
your-cli skills add
your-cli completions zsh`}</pre>
        <p style={bodyStyle}>
          One derive → CLI help for you, MCP tools for Cursor/Claude, skills for agents, HTTP/OpenAPI
          when you need a service. That is why this sits on the <strong style={strong}>Rust</strong>{' '}
          step: you learn the language by shipping a graph agents can actually call.
        </p>

        <SectionLabel>On the path</SectionLabel>
        <ol style={listStyle}>
          <li>
            <Link href="/blog/post-training-path" style={linkStyle}>
              Post-Training Path
            </Link>{' '}
            — Rust → CLI → eval → SFT
          </li>
          <li>
            <Link href="/blog/own-your-stack" style={linkStyle}>
              Own Your Stack
            </Link>{' '}
            — taste, GitHub ownership, needs
          </li>
          <li>
            <Link href="/blog/cli" style={linkStyle}>
              CLI essay
            </Link>{' '}
            — thin operator surface
          </li>
          <li>
            <Link href="/blog/software-watch" style={linkStyle}>
              Software YouTube (MCP)
            </Link>
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
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(17, 17, 17, 0.84)',
  marginBottom: 24,
  paddingLeft: 22,
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
