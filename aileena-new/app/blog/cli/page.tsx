'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function CliArticle() {
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
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/#blog" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
          Archive
        </Link>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
        }}>
          AILEENA MACHINA
        </span>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 32px 64px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.45em',
            color: '#00ffea',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '1px solid rgba(0,255,234,0.3)',
          }}>
            TOOLS
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.05.20
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            CLI · OpenClaw · Hermes · OKX
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.08,
          marginBottom: 32,
          color: '#fff',
        }}>
          The CLI Was Always<br /><span style={{ color: '#00ffea' }}>the Trading Floor</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20,
          marginBottom: 0,
        }}>
          Two CLIs share a prompt and almost nothing else. The dev CLI moves files. The trader CLI moves money. The first tolerates a few hundred milliseconds; the second loses on them. Agent runtimes — OpenClaw for orchestration, Hermes for prices, OKX and Solana for execution — don&apos;t replace the terminal. They become pipe stages inside it.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — The Two CLIs</SectionLabel>
        <p style={bodyStyle}>
          The shell prompt looks the same in both contexts: a blinking cursor over a black background, the muscle memory of <code style={codeStyle}>↑</code> for the last command, <code style={codeStyle}>|</code> to chain one tool into another. But the physics underneath are different. A developer running <code style={codeStyle}>git push</code> can wait two seconds and lose nothing. A trader running <code style={codeStyle}>cancel</code> on a stale quote can wait two hundred milliseconds and lose everything. The interface is identical. The deadline is not.
        </p>
        <p style={bodyStyle}>
          That difference shapes the whole tooling stack. The dev CLI optimizes for ergonomics — readable output, helpful errors, sensible defaults, retries that recover gracefully. The trader CLI optimizes for the inverse — silent on the happy path, terse on errors, deterministic latency, retries that fail loud because a retry on a filled order is a double-position. Both are CLIs. They are not the same artifact.
        </p>

        <SectionLabel>02 — Normal-Case CLI: The Universal Joint</SectionLabel>
        <p style={bodyStyle}>
          The normal-case CLI is the one most developers have a relationship with. <code style={codeStyle}>git</code>, <code style={codeStyle}>npm</code>, <code style={codeStyle}>kubectl</code>, <code style={codeStyle}>aws</code>, <code style={codeStyle}>gh</code>, <code style={codeStyle}>ssh</code>, <code style={codeStyle}>jq</code>, <code style={codeStyle}>curl</code>. Each does one thing, exposes it through flags and stdin, and emits text on stdout that another tool can read. The shell is the universal joint between them. The script is the unit of repeatability.
        </p>
        <p style={bodyStyle}>
          What the dev CLI is actually doing, when you trace it, is file manipulation: read a config, transform a tree, write a file, call an API, log the result. The latency budget is generous. <code style={codeStyle}>git status</code> on a large repo can take half a second and nobody notices. <code style={codeStyle}>kubectl apply</code> can take five seconds and the deploy still ships on time. The CLI&apos;s job here is to be the surface area for automation — not to be fast in absolute terms, but to be scriptable, composable, and observable. The terminal is the substrate on which knowledge work compiles.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            The dev CLI in one line
          </p>
          <pre style={preStyle}>{`# Normal-case: pipe stages are forgiving
gh pr list --json title,number | jq '.[] | select(.title | test("WIP"))' | head -5`}</pre>
        </div>

        <SectionLabel>03 — Trading-Case CLI: Why Traders Refuse to Leave the Terminal</SectionLabel>
        <p style={bodyStyle}>
          Walk into any prop shop or any one-person Solana-bot operation and you will find a terminal multiplexer — tmux, zellij, kitty — with eight panes split across two monitors. One pane runs a price stream. One runs the strategy log. One has an open <code style={codeStyle}>shell</code> on the exchange&apos;s API, ready to flatten the book if something goes wrong. There is usually no chart. The chart is a downstream artifact. The CLI is the floor.
        </p>
        <p style={bodyStyle}>
          The reason isn&apos;t romance. It&apos;s five concrete properties the terminal has and a GUI almost never matches.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Latency.</strong> A GUI adds a render frame — 16ms at 60Hz, often 30–80ms in practice once event loops, state diffs, and animations are involved. A direct HTTP call from the shell is whatever the network costs you, no more. For a market-making cancel race, that difference is the spread.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Composability.</strong> A trader doesn&apos;t want one app that does everything. They want a price feed (Pyth Hermes), a strategy script (anything from awk to a Rust binary), an exchange client (OKX, Drift, Hyperliquid), and a logger (stdout to a file). Pipes wire them together in one line.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Headlessness.</strong> The actual workload runs on a colocated VPS or a bare-metal box near the exchange. No display, no mouse, often no display server installed at all. A CLI is the only interface that survives the move from laptop to remote.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Audit.</strong> Every command leaves a line in shell history. Every script run leaves a log file. When the P&amp;L moves and you have to explain why, a CLI session is the cleanest forensic trace you can ask for. A GUI session is a memory.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Automation.</strong> The trader&apos;s actual edge — outside the few firms with genuine alpha — is automation. The strategy that wakes up at 03:14 and hedges a position the human shouldn&apos;t be awake to think about. Cron, systemd timers, agent runtimes. None of that lives in a GUI.
          </p>
        </div>

        <SectionLabel>04 — The Trader&apos;s Toolbox in 2026</SectionLabel>
        <p style={bodyStyle}>
          The set of CLIs a working crypto trader actually has installed has narrowed and deepened over the last two years. The category list reads short. The implementation list is long.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>What it does</th>
                <th style={thStyle}>Representative CLIs</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Price feed</td>
                <td style={tdStyle}>Pull or stream live prices off a chain-agnostic oracle</td>
                <td style={tdStyle}>Pyth Hermes (HTTP/SSE), Switchboard, Chainlink Data Streams</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Exchange client (CEX)</td>
                <td style={tdStyle}>Place, cancel, query orders against a centralised venue</td>
                <td style={tdStyle}>OKX V5 API, Binance, Bybit, Hyperliquid CLI</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>On-chain client</td>
                <td style={tdStyle}>Sign and submit transactions against a chain</td>
                <td style={tdStyle}>solana CLI, foundry/cast, viem, anchor</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Aggregator</td>
                <td style={tdStyle}>Route a swap or order across multiple venues</td>
                <td style={tdStyle}>Jupiter, 1inch, Kamino router, DFlow</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Bot framework</td>
                <td style={tdStyle}>Strategy harness, paper trading, exchange adapters</td>
                <td style={tdStyle}>Hummingbot, Freqtrade, Jesse, Drift Vaults SDK</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Agent runtime</td>
                <td style={tdStyle}>Long-running, scheduled, multi-channel automation glue</td>
                <td style={tdStyle}>OpenClaw, Claude Agent SDK, OKX AI Agent, Hummingbot AI</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Observability</td>
                <td style={tdStyle}>Read positions, P&amp;L, fills, drawdown from the shell</td>
                <td style={tdStyle}>jq + curl, custom dashboards, DefiLlama API</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          Three of these — Pyth Hermes for the price feed, OpenClaw as the agent runtime, OKX for execution — are the substrate of a workable single-trader stack. Wired through a thin CLI, they go from a list of services into a single command line.
        </p>

        <SectionLabel>05 — Hermes: The Pull Oracle as a Curl Target</SectionLabel>
        <p style={bodyStyle}>
          Hermes is the Pyth Network price service. It speaks HTTP, SSE, and WebSocket. It serves both an off-chain JSON view of the latest aggregated price and a binary VAA blob that can be posted on-chain to push the price into a Pyth oracle contract. Two interfaces, one binary. For a CLI-first trader, the relevant one is the JSON.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            Hermes from the shell
          </p>
          <pre style={preStyle}>{`# Latest SOL/USD — Pyth feed ID e62df...d6
curl -s 'https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' \\
  | jq '.parsed[0].price | {price: (.price | tonumber * pow(10; .expo)), conf, ts: .publish_time}'

# Streaming the same feed (SSE) — pipe straight into a strategy
curl -sN 'https://hermes.pyth.network/v2/updates/price/stream?ids%5B%5D=ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' \\
  | grep --line-buffered '^data:' \\
  | sed 's/^data: //' \\
  | jq -c '.parsed[0].price'`}</pre>
        </div>

        <p style={bodyStyle}>
          The streaming endpoint is the one that changes how the strategy is shaped. Instead of polling every 100ms and burning RPS, the strategy script reads stdin one line at a time and reacts on each new tick. The price feed becomes a generator. The strategy becomes a transformer. The exchange call becomes a sink. Three Unix processes, one pipe.
        </p>
        <p style={bodyStyle}>
          The trade-off Hermes makes is honesty about freshness. Each price object carries a <code style={codeStyle}>publish_time</code> and a <code style={codeStyle}>conf</code> (confidence band). A strategy that ignores either is making an assumption the API explicitly refuses to make. For a market-making loop, the conf band is part of the decision: widen the quote when conf widens, pull the quote when <code style={codeStyle}>publish_time</code> drifts beyond a threshold.
        </p>

        <SectionLabel>06 — OpenClaw: An Agent Runtime That Lives in the Terminal</SectionLabel>
        <p style={bodyStyle}>
          OpenClaw is an agent runtime that runs locally, holds long-lived workspaces and identities, schedules tasks on cron, and routes messages across channels (Telegram, web, shell). For trading, the relevant primitives are four: workspaces (a per-strategy directory with its own state), skills (small scripts the agent can invoke), cron (timed triggers), and subagents (parallel reasoning workers under a coordinator).
        </p>
        <p style={bodyStyle}>
          What makes it a fit for trading specifically is that the runtime is not a chat product first. It is a long-running process with a CLI entrypoint. You can <code style={codeStyle}>openclaw run</code> a skill, register a heartbeat, and walk away. The agent reasons about what to do; the skill it ends up calling is just a script. That separation — <em>reasoning over a fixed surface of tools</em> — is the actual agent pattern, and it maps to the trader&apos;s stack cleanly: the LLM picks the order shape, the skill executes the order through OKX or Solana.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            An OpenClaw skill is a script the agent can call
          </p>
          <pre style={preStyle}>{`~/.openclaw/skills/
├── pyth-quote/
│   ├── skill.json        # name, args schema, when to use
│   └── run.sh            # the actual executable
├── okx-place-order/
│   ├── skill.json
│   └── run.ts
└── solana-cancel-all/
    ├── skill.json
    └── run.rs`}</pre>
        </div>

        <p style={bodyStyle}>
          The skill manifest tells the agent <em>when</em> to reach for the tool. The agent supplies arguments. The executable runs in a sandboxed subprocess and returns JSON on stdout. From the agent&apos;s perspective it is the same shape as any other tool call. From the trader&apos;s perspective it is a script they can run manually with the same arguments — which is exactly the property an audit trail needs.
        </p>

        <SectionLabel>07 — OKX as the Execution Sink</SectionLabel>
        <p style={bodyStyle}>
          OKX exposes a V5 REST API and a parallel WebSocket. For agent-driven trading the REST path is the simpler surface: every order is one HTTP call with an HMAC signature derived from the timestamp, method, path, and body. The same shape works for spot, perpetuals, options, and margin — only the <code style={codeStyle}>instId</code> and <code style={codeStyle}>tdMode</code> change. The exchange is also one of the first majors to publish an explicit AI Agent SDK that wraps order placement, balance queries, and position management in a typed interface designed to be reached by an LLM.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            OKX V5 — sign-and-send in 15 lines
          </p>
          <pre style={preStyle}>{`import crypto from 'node:crypto';

const ts = new Date().toISOString();
const body = JSON.stringify({
  instId: 'SOL-USDT-SWAP',
  tdMode: 'cross',
  side: 'buy',
  ordType: 'limit',
  px: '142.50',
  sz: '10',
});
const prehash = ts + 'POST' + '/api/v5/trade/order' + body;
const sign = crypto.createHmac('sha256', process.env.OKX_SECRET!)
  .update(prehash).digest('base64');

await fetch('https://www.okx.com/api/v5/trade/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': process.env.OKX_KEY!,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-TIMESTAMP': ts,
    'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE!,
  },
  body,
});`}</pre>
        </div>

        <p style={bodyStyle}>
          The reason this is fifteen lines and not five hundred is that the protocol is small. Signing is HMAC-SHA256. There is no order-state machine in the SDK that the API itself does not also expose. Once you have this snippet wrapped as an OpenClaw skill, an agent can place orders by emitting a JSON argument object — no exchange adapter framework required.
        </p>

        <SectionLabel>08 — The Thin Wrapper: Wiring It Together</SectionLabel>
        <p style={bodyStyle}>
          The whole architecture lands in one diagram: a price feed (Hermes) on the left, an execution sink (OKX or a Solana RPC) on the right, an agent runtime (OpenClaw) in the middle as the coordinator, and a thin TypeScript CLI as the glue. The CLI does almost nothing — it parses one command, hands the work to a skill, prints the result. The agent does the reasoning. The exchange and the oracle do the work.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            tradectl — the thin CLI
          </p>
          <pre style={preStyle}>{`#!/usr/bin/env node
// tradectl: a 60-line broker between price, agent, and exchange.

import { spawnSync } from 'node:child_process';

const [, , cmd, ...rest] = process.argv;

const skills = {
  // 1. Read a Pyth feed via Hermes.
  quote: async (feedId: string) => {
    const r = await fetch(
      \`https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=\${feedId}\`
    );
    const j = await r.json();
    const p = j.parsed[0].price;
    return { px: Number(p.price) * 10 ** p.expo, conf: Number(p.conf), ts: p.publish_time };
  },

  // 2. Ask OpenClaw for a decision.
  decide: (ctx: object) => {
    const r = spawnSync('openclaw', ['ask', '--skill', 'sol-momentum'], {
      input: JSON.stringify(ctx), encoding: 'utf8',
    });
    return JSON.parse(r.stdout);
  },

  // 3. Hand the decision to OKX (or Solana — same shape).
  fill: async (order: { side: string; px: string; sz: string }) => {
    const okx = await import('./okx-skill.js');
    return okx.placeOrder({ instId: 'SOL-USDT-SWAP', tdMode: 'cross', ...order });
  },
};

(async () => {
  if (cmd === 'tick') {
    const q = await skills.quote(rest[0]);
    const d = skills.decide({ symbol: 'SOL', ...q });
    if (d.action === 'noop') return console.log('noop', q);
    const f = await skills.fill(d.order);
    console.log(JSON.stringify({ q, d, f }));
  }
})();`}</pre>
        </div>

        <p style={bodyStyle}>
          The script is intentionally boring. Every line is a function call into a service that already exists; there is no strategy logic, no exchange adapter, no order-state machine. Three external systems do the work. The CLI is the interview between them.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            Composing it as a pipe
          </p>
          <pre style={preStyle}>{`# Stream live SOL ticks → run a decision per tick → log JSON
curl -sN 'https://hermes.pyth.network/v2/updates/price/stream?ids%5B%5D=ef0d...56d' \\
  | grep --line-buffered '^data:' \\
  | sed 's/^data: //' \\
  | xargs -I{} tradectl tick {}`}</pre>
        </div>

        <blockquote style={{
          margin: '48px 0',
          padding: '28px 32px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '3px solid #00ffea',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.9)',
        }}>
          The agent doesn&apos;t replace the CLI. It becomes another stage in the pipe — one that happens to reason.
        </blockquote>

        <SectionLabel>09 — Why Thin Wins Over Monolithic</SectionLabel>
        <p style={bodyStyle}>
          The temptation in trading-bot design is to write the universe inside one process: strategy, risk, exchange adapter, paper-trading sandbox, dashboard. Hummingbot does this. Freqtrade does this. They are good products and they have a real audience. They are also enormous and opinionated, and the cost of swapping out their orderbook reader, their exchange client, or their notification layer is non-trivial.
        </p>
        <p style={bodyStyle}>
          The thin-CLI argument is the inverse: write almost nothing yourself, and let the seams be visible. The price feed is a separate process you can replace. The agent runtime is a separate process you can replace. The exchange client is a separate file. When the OKX V5 API changes — and it does — you edit one skill and nothing else. When Pyth ships a new endpoint, you point at it. When OpenClaw releases v2, the rest of the pipe is unaffected. The cost of this looseness is that there is no graphical dashboard out of the box. The benefit is that the entire system fits in your head.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Axis</th>
                <th style={thStyle}>Monolithic framework</th>
                <th style={thStyle}>Thin CLI + agent</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Setup time</td>
                <td style={tdStyle}>Minutes (a Docker image)</td>
                <td style={tdStyle}>Hours (gluing services)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Swap a price source</td>
                <td style={tdStyle}>Fork the adapter</td>
                <td style={tdStyle}>Edit one line of curl</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Swap an exchange</td>
                <td style={tdStyle}>Adapter rewrite + test harness</td>
                <td style={tdStyle}>Swap one skill file</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Add an LLM in the loop</td>
                <td style={tdStyle}>Plugin system, often retrofitted</td>
                <td style={tdStyle}>Already there — it is the agent</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Audit a failed trade</td>
                <td style={tdStyle}>Logs, dashboards, traces</td>
                <td style={tdStyle}>Replay the pipe with the same input</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Strategy library size</td>
                <td style={tdStyle}>Large (curated)</td>
                <td style={tdStyle}>Small (your own)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Best for</td>
                <td style={tdStyle}>Retail / paper-trading exploration</td>
                <td style={tdStyle}>Production single-trader or small team</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>10 — The Three Operating Postures</SectionLabel>
        <p style={bodyStyle}>
          Watching how this style of stack gets used in the wild, three postures recur. They are not exclusive — a trader will switch between them inside the same week — but they shape which tools get reached for.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Interactive.</strong> Manual order-entry from the shell. <code style={codeStyle}>tradectl quote ef0d... | tradectl fill --sz 10</code>. No agent involved. The trader is the strategy. The CLI is just faster than a UI.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Scheduled.</strong> Cron triggers a skill. Every five minutes, check the funding rate; every day at 16:00 UTC, rebalance to neutral. OpenClaw&apos;s heartbeat is a clean fit here. The agent does light reasoning — &quot;is the funding rate above 0.03%, and if so, what size?&quot; — and the CLI executes.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Streaming.</strong> The Hermes SSE stream feeds <code style={codeStyle}>tradectl</code> directly. The strategy is a real-time reaction to ticks. The agent here is usually <em>not</em> in the hot path — an LLM call costs hundreds of milliseconds — but it sits in a slower outer loop, deciding regime: trend, range, dislocation, halt. The inner loop is plain code.
          </p>
        </div>

        <p style={bodyStyle}>
          A common configuration is two loops at different speeds. The inner loop, deterministic and millisecond-scoped, fires on every tick. The outer loop, LLM-driven and second-scoped, evaluates state once a minute and writes parameters into a file the inner loop reads. The agent is the slow brain; the script is the fast hand. The CLI is the table they share.
        </p>

        <SectionLabel>11 — What the Agent Layer Actually Buys You</SectionLabel>
        <p style={bodyStyle}>
          A reasonable objection: if the inner loop is plain code, what does the agent layer earn? Three answers, ordered by how often they actually pay off.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Operator interface.</strong> The most underrated win. Instead of editing config files at 03:00 when a position is bleeding, you message the agent — &quot;close half the SOL perp&quot; — and it calls the skill. Telegram, terminal, web; OpenClaw routes them all into the same workspace. This is the thing that survives once the novelty wears off.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Regime classification.</strong> An LLM reading a thirty-minute window of ticks plus the latest funding rate, open interest, and news headlines is, empirically, better than most heuristics at calling whether the market is in a trendable state or a stop-hunt range. It is not better than a human at this. It is much better than a human who is asleep.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Failure narration.</strong> When a skill errors, the agent can read the stack trace, the last hundred lines of state, and produce a human-readable post-mortem in the same channel where you were chatting with it. The diff between &quot;ERR 50061&quot; and &quot;OKX rejected the order because tdMode was cross but the account is set to isolated&quot; is the difference between a trader who recovers in three minutes and a trader who is offline for an hour.
          </p>
        </div>

        <SectionLabel>12 — What This Doesn&apos;t Solve</SectionLabel>
        <p style={bodyStyle}>
          The thin-CLI pattern is not magic. It does not give you alpha. It does not give you a colocated server in NY4 or AWS Tokyo. It does not protect you from a flash crash, a custodial outage, or your own conviction. Three specific things it explicitly punts on:
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Latency at the absolute edge.</strong> Wrapping every step in a subprocess call costs microseconds you don&apos;t notice and milliseconds you might. For a sniper bot reaching for a Jito bundle, the inner loop should be a single Rust binary holding open gRPC sockets, not a Node script. The CLI pattern wins for systematic / market-making style work, not for race-to-block sniping.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Risk management.</strong> A position-size check, a max-drawdown circuit breaker, a kill switch — those have to live in a process that <em>cannot</em> be interrupted by an LLM hallucination. The pattern: risk is a separate watcher script that the agent has no permission to override. It can ask. The watcher answers.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Cross-venue settlement.</strong> Moving collateral between OKX and a Solana DEX is a multi-step, multi-chain dance that no current agent runtime handles well end-to-end. The honest answer is to script it explicitly and have the agent <em>call</em> the script when the strategy needs it — not to expect the agent to plan the bridge route on its own.
          </p>
        </div>

        <SectionLabel>13 — Where This Goes</SectionLabel>
        <p style={bodyStyle}>
          The terminal didn&apos;t lose to the GUI in trading; it absorbed it. Every chart on a Bloomberg or a TradingView panel is a side car to a CLI session somewhere. The new layer — agent runtimes that hold context, schedule work, and route messages — is doing the same thing the shell did: becoming the substrate on which automation compiles. OpenClaw, Hermes, OKX&apos;s AI Agent SDK, and the dozen similar runtimes shipping in 2026 are not competing with the CLI. They are extending it.
        </p>
        <p style={bodyStyle}>
          The honest version of the &quot;will AI replace traders&quot; question is sharper than the question itself: it has already replaced the manual-clicks layer for anyone who was willing to write a script, and that was already most serious traders. What it adds, when it&apos;s wired right, is a slow brain that doesn&apos;t sleep, an operator interface that doesn&apos;t require a dashboard, and the ability to narrate its own failures. That isn&apos;t a new product category. It&apos;s another stage in the pipe.
        </p>

        <div style={{
          marginTop: 64,
          padding: '40px 32px',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.88)',
            margin: 0,
          }}>
            Hermes is the generator. OKX is the sink. OpenClaw is the slow brain.<br />
            <span style={{ color: '#00ffea' }}>
              The CLI is the table they all sit at.
            </span>
          </p>
          <p style={{
            marginTop: 20,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
          }}>
            — AILEENA MACHINA / 2026
          </p>
        </div>

        {/* ── References ── */}
        <div style={{ marginTop: 64 }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.45em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>References</p>
          <ol style={{
            paddingLeft: 20,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {[
              { label: 'Pyth Network — Hermes API documentation', href: 'https://docs.pyth.network/price-feeds/api-reference' },
              { label: 'Pyth Network — Price Feed IDs (cross-chain catalog)', href: 'https://www.pyth.network/developers/price-feed-ids' },
              { label: 'Pyth Hermes — REST + SSE reference (hermes.pyth.network)', href: 'https://hermes.pyth.network/docs' },
              { label: 'OKX V5 API — Trading endpoints (place order)', href: 'https://www.okx.com/docs-v5/en/#order-book-trading-trade-post-place-order' },
              { label: 'OKX V5 API — Authentication (HMAC-SHA256 signing)', href: 'https://www.okx.com/docs-v5/en/#overview-rest-authentication' },
              { label: 'OKX AI Agent SDK — overview', href: 'https://www.okx.com/learn/okx-launches-ai-agent-sdk' },
              { label: 'Anthropic — Claude Agent SDK (general agent runtime patterns)', href: 'https://docs.anthropic.com/en/docs/build-with-claude/agent-sdk' },
              { label: 'Solana CLI — getting started (docs.solana.com)', href: 'https://docs.solana.com/cli' },
              { label: 'Foundry — cast (the CLI for Ethereum RPC and signing)', href: 'https://book.getfoundry.sh/cast/' },
              { label: 'Jupiter API — Swap endpoint (the aggregator behind most Solana CLIs)', href: 'https://station.jup.ag/docs/apis/swap-api' },
              { label: 'Hyperliquid CLI — official client', href: 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api' },
              { label: 'Hummingbot — open-source market-making framework', href: 'https://hummingbot.org/' },
              { label: 'Freqtrade — open-source crypto trading bot', href: 'https://www.freqtrade.io/' },
              { label: 'Drift Protocol — Vaults SDK (Solana perp DEX)', href: 'https://drift-labs.github.io/v2-teacher/' },
              { label: 'Jito — Low-latency transaction send and bundles', href: 'https://docs.jito.wtf/lowlatencytxnsend/' },
              { label: 'Pyth — Sponsored feeds and the pull-oracle model (whitepaper)', href: 'https://www.pyth.network/whitepaper.pdf' },
            ].map((ref, i) => (
              <li key={i} style={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.35)',
                lineHeight: 1.6,
              }}>
                <a
                  href={ref.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(0,255,234,0.6)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,255,234,0.6)')}
                >
                  {ref.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
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
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.85em',
  background: 'rgba(0,255,234,0.06)',
  color: 'rgba(0,255,234,0.85)',
  padding: '2px 6px',
  borderRadius: 3,
  letterSpacing: 0,
};

const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.72rem',
  lineHeight: 1.65,
  color: 'rgba(255,255,255,0.78)',
  letterSpacing: '0.01em',
  margin: 0,
  whiteSpace: 'pre',
  overflowX: 'auto',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: '#00ffea',
  fontSize: '0.65rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.78rem',
  letterSpacing: '0.02em',
};

const tdLabelStyle: React.CSSProperties = {
  ...tdStyle,
  color: 'rgba(255,255,255,0.4)',
  fontWeight: 500,
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
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
