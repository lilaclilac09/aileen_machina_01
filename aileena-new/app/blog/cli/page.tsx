'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function CliArticle() {
  return (
    <SubstackShell
      category="Tools"
      date="2026.05.20"
      tags="CLI · OpenClaw · Hermes · OKX"
      title="The CLI Was Always the Trading Floor"
      dek="Two CLIs share a prompt and almost nothing else. The dev CLI moves files. The trader CLI moves money. The first tolerates a few hundred milliseconds; the second loses on them."
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The Two CLIs</SectionLabel>
        <p style={bodyStyle}>
          A CLI — command-line interface, the text prompt you type commands into — looks the same in both worlds: a blinking cursor over a black background, the muscle memory of <code style={codeStyle}>↑</code> for the last command, <code style={codeStyle}>|</code> to chain one tool into the next. But the physics underneath are different. A developer running <code style={codeStyle}>git push</code> can wait two seconds and lose nothing. A trader running <code style={codeStyle}>cancel</code> on a stale quote can wait two hundred milliseconds and lose everything. The interface is identical. The deadline isn&apos;t.
        </p>
        <p style={bodyStyle}>
          That one difference shapes the whole tooling stack. The dev CLI is built for ergonomics — readable output, helpful errors, sensible defaults, retries that recover gracefully. The trader CLI is built for the opposite — silent when things go right, terse on errors, predictable latency, and retries that fail loud, because a retry on an already-filled order means you&apos;re now holding double the position. Both are CLIs. They are not the same tool.
        </p>

        <SectionLabel>Normal-Case CLI: The Universal Joint</SectionLabel>
        <p style={bodyStyle}>
          The normal-case CLI is the one most developers know intimately. <code style={codeStyle}>git</code>, <code style={codeStyle}>npm</code>, <code style={codeStyle}>kubectl</code>, <code style={codeStyle}>aws</code>, <code style={codeStyle}>gh</code>, <code style={codeStyle}>ssh</code>, <code style={codeStyle}>jq</code>, <code style={codeStyle}>curl</code>. Each does one thing, exposes it through flags and stdin (the input you pipe in), and prints text on stdout (its output) that another tool can read. The shell is the universal joint between them. The script is the unit of repeatability.
        </p>
        <p style={bodyStyle}>
          When you trace what the dev CLI is actually doing, it&apos;s file manipulation: read a config, transform a tree, write a file, call an API, log the result. The latency budget is generous. <code style={codeStyle}>git status</code> on a large repo can take half a second and nobody notices. <code style={codeStyle}>kubectl apply</code> can take five seconds and the deploy still ships on time. The CLI&apos;s job here is to be the surface for automation — not to be fast in absolute terms, but to be scriptable, composable, and observable. The terminal is the surface on which knowledge work compiles.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            The dev CLI in one line
          </p>
          <pre style={preStyle}>{`# Normal-case: pipe stages are forgiving
gh pr list --json title,number | jq '.[] | select(.title | test("WIP"))' | head -5`}</pre>
        </div>

        <SectionLabel>Trading-Case CLI: Why Traders Refuse to Leave the Terminal</SectionLabel>
        <p style={bodyStyle}>
          Walk into any prop shop, or any one-person Solana-bot operation, and you&apos;ll find a terminal multiplexer — tmux, zellij, kitty (tools that split one terminal into many panes) — with eight panes spread across two monitors. One pane runs a price stream. One runs the strategy log. One has an open <code style={codeStyle}>shell</code> on the exchange&apos;s API, ready to flatten the book if something goes wrong. Usually there&apos;s no chart at all. The chart is a downstream artifact. The CLI is the floor.
        </p>
        <p style={bodyStyle}>
          The reason isn&apos;t romance. It&apos;s five concrete things the terminal gives you that a GUI almost never matches.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Latency.</strong> A GUI adds a render frame — 16ms at 60Hz, often 30–80ms in practice once event loops, state diffs, and animations get involved. A direct HTTP call from the shell costs you whatever the network costs, and nothing more. In a market-making cancel race, that difference is the spread.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Composability.</strong> A trader doesn&apos;t want one app that does everything. They want a price feed (Pyth Hermes), a strategy script (anything from awk to a Rust binary), an exchange client (OKX, Drift, Hyperliquid), and a logger (stdout to a file). Pipes wire them all together in one line.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Headlessness.</strong> The real workload runs on a colocated VPS or a bare-metal box near the exchange. No display, no mouse, often no display server installed at all. A CLI is the only interface that survives the move from laptop to remote.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Audit.</strong> Every command leaves a line in shell history. Every script run leaves a log file. When the P&amp;L moves and you have to explain why, a CLI session is the cleanest forensic trace you can ask for. A GUI session is a memory.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Automation.</strong> A trader&apos;s real edge — outside the handful of firms with genuine alpha — is automation: the strategy that wakes up at 03:14 and hedges a position no human should be awake to think about. Cron, systemd timers, agent runtimes. None of that lives in a GUI.
          </p>
        </div>

        <SectionLabel>The Trader&apos;s Toolbox in 2026</SectionLabel>
        <p style={bodyStyle}>
          The set of CLIs a working crypto trader actually has installed has narrowed and deepened over the last two years. The list of categories is short. The list of implementations is long.
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
                <td style={tdStyle}>Jupiter, 1inch, Kamino router, DFlow, Titan (meta-aggregator)</td>
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
          Three of these — Pyth Hermes for the price feed, OpenClaw as the agent runtime, OKX for execution — are the backbone of a workable single-trader stack. Wired through a thin CLI, they go from a list of services to a single command line.
        </p>

        <SectionLabel>Hermes: The Pull Oracle as a Curl Target</SectionLabel>
        <p style={bodyStyle}>
          Hermes is the Pyth Network price service — the thing you ask for a current price. It speaks HTTP, SSE, and WebSocket. It serves two things: an off-chain JSON view of the latest aggregated price, and a binary VAA blob you can post on-chain to push that price into a Pyth oracle contract. Two interfaces, one service. For a CLI-first trader, the one that matters is the JSON.
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
          The streaming endpoint is the one that changes the shape of the strategy. Instead of polling every 100ms and burning through your request budget, the strategy script reads stdin one line at a time and reacts to each new tick. The price feed becomes a generator. The strategy becomes a transformer. The exchange call becomes a sink. Three Unix processes, one pipe.
        </p>
        <p style={bodyStyle}>
          What Hermes gives you in return is honesty about freshness. Each price object carries a <code style={codeStyle}>publish_time</code> and a <code style={codeStyle}>conf</code> (a confidence band — how sure Pyth is about the number). A strategy that ignores either is making an assumption the API flatly refuses to make. For a market-making loop, the conf band is part of the decision: widen your quote when conf widens, pull the quote when <code style={codeStyle}>publish_time</code> drifts past a threshold.
        </p>

        <SectionLabel>OpenClaw: An Agent Runtime That Lives in the Terminal</SectionLabel>
        <p style={bodyStyle}>
          OpenClaw is an agent runtime (a host process that lets an LLM reason and call tools) that runs locally, holds long-lived workspaces and identities, schedules tasks on cron, and routes messages across channels (Telegram, web, shell). For trading, four primitives matter: workspaces (a per-strategy directory with its own state), skills (small scripts the agent can invoke), cron (timed triggers), and subagents (parallel reasoning workers under a coordinator).
        </p>
        <p style={bodyStyle}>
          What makes it a fit for trading specifically is that it isn&apos;t a chat product first. It&apos;s a long-running process with a CLI entrypoint. You can <code style={codeStyle}>openclaw run</code> a skill, register a heartbeat, and walk away. The agent reasons about what to do; the skill it ends up calling is just a script. That separation — <em>an LLM reasoning over a fixed set of tools</em> — is the actual agent pattern, and it maps onto the trader&apos;s stack cleanly: the LLM picks the order shape, the skill places the order through OKX or Solana.
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
          The skill manifest tells the agent <em>when</em> to reach for the tool. The agent fills in the arguments. The executable runs in a sandboxed subprocess and returns JSON on stdout. From the agent&apos;s side, it looks like any other tool call. From the trader&apos;s side, it&apos;s a script they can run by hand with the same arguments — which is exactly what an audit trail needs.
        </p>

        <SectionLabel>OKX as the Execution Sink</SectionLabel>
        <p style={bodyStyle}>
          OKX exposes a V5 REST API and a parallel WebSocket. For agent-driven trading, REST is the simpler surface: every order is one HTTP call with an HMAC signature (a cryptographic stamp proving the request is yours) derived from the timestamp, method, path, and body. The same shape works for spot, perpetuals, options, and margin — only the <code style={codeStyle}>instId</code> and <code style={codeStyle}>tdMode</code> change. OKX is also one of the first majors to publish an explicit AI Agent SDK that wraps order placement, balance queries, and position management in a typed interface meant to be called by an LLM.
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
          The reason this is fifteen lines and not five hundred is that the protocol is small. Signing is HMAC-SHA256. There&apos;s no order-state machine hidden in the SDK that the API doesn&apos;t also expose. Once you&apos;ve wrapped this snippet as an OpenClaw skill, an agent can place orders just by emitting a JSON argument object — no exchange-adapter framework required.
        </p>

        <SectionLabel>The Thin Wrapper: Wiring It Together</SectionLabel>
        <p style={bodyStyle}>
          The whole architecture fits in one diagram: a price feed (Hermes) on the left, an execution sink (OKX or a Solana RPC) on the right, an agent runtime (OpenClaw) in the middle as the coordinator, and a thin TypeScript CLI as the glue. The CLI does almost nothing — it parses one command, hands the work to a skill, prints the result. The agent does the reasoning. The exchange and the oracle do the work.
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
          The script is boring on purpose. Every line is a function call into a service that already exists; there&apos;s no strategy logic, no exchange adapter, no order-state machine. Three external systems do the work. The CLI is just the interview between them.
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

        <SectionLabel>Why Thin Wins Over Monolithic</SectionLabel>
        <p style={bodyStyle}>
          The temptation in trading-bot design is to cram the whole universe into one process: strategy, risk, exchange adapter, paper-trading sandbox, dashboard. Hummingbot does this. Freqtrade does this. They&apos;re good products with a real audience. They&apos;re also enormous and opinionated, and swapping out their orderbook reader, their exchange client, or their notification layer is real work.
        </p>
        <p style={bodyStyle}>
          The thin-CLI argument is the opposite: write almost nothing yourself, and leave the seams visible. The price feed is a separate process you can replace. The agent runtime is a separate process you can replace. The exchange client is a separate file. When the OKX V5 API changes — and it does — you edit one skill and nothing else. When Pyth ships a new endpoint, you point at it. When OpenClaw releases v2, the rest of the pipe doesn&apos;t notice. The cost of all this looseness is that there&apos;s no graphical dashboard out of the box. The payoff is that the entire system fits in your head.
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

        <SectionLabel>The Other Two Patterns: MCP Servers and Codegen Skills</SectionLabel>
        <p style={bodyStyle}>
          The thin-CLI / monolithic-framework split isn&apos;t the only axis. A third tradition took shape in 2026 around <em>structured</em> agent-tool protocols — and it solves real problems the thin CLI ignores. Two flavours are worth naming on their own: MCP servers, and codegen skills. Neither competes with the CLI pattern. They sit at different points in the stack.
        </p>

        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>MCP — Model Context Protocol.</strong> An Anthropic-authored open protocol for handing tools to LLMs in a standardized way. The shape is client/server over stdio (or HTTP): an MCP server declares a list of tools, each with a name, a JSON schema for its arguments, and a callback. The LLM client — Claude Desktop, Cursor, Zed — discovers the tools, picks one, asks the user for permission, and runs it. The server returns a structured result. The QuickNode Solana MCP server is the canonical demo: register <code style={codeStyle}>getBalance</code>, <code style={codeStyle}>getTokenAccounts</code>, <code style={codeStyle}>simulateTransaction</code> as MCP tools backed by Solana Kit, and Claude can call them in chat with no shell glue at all.
        </p>

        <p style={bodyStyle}>
          The Solana ecosystem has settled on a small set of MCP-shaped toolkits. <strong style={{ color: '#00ffea' }}>Solana Agent Kit</strong> (SendAI) ships 60+ pre-built actions covering tokens, NFTs, and DeFi. <strong style={{ color: '#00ffea' }}>GOAT</strong> (Crossmint) ships 200+ plugins across Solana <em>and</em> EVM. <strong style={{ color: '#00ffea' }}>ElizaOS</strong> bundles MCP into a persistent-agent runtime with Twitter, Discord, and Telegram channels baked in. <strong style={{ color: '#00ffea' }}>Rig</strong> (a Rust framework) goes after the opposite case — the lowest-latency path from LLM decision to on-chain execution, for trading loops that can&apos;t afford the Node round-trip.
        </p>

        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Codegen skills — the Titan pattern.</strong> <code style={codeStyle}>@titanexchange/titan-api-skill</code> is a different shape entirely. It isn&apos;t a runtime. It&apos;s a Claude Code skill — a documented bundle that ships with the protocol&apos;s quirks already encoded, so an LLM can write <em>correct</em> integration code on the first try. The quirks are specific and ugly: WebSocket + MessagePack instead of JSON-REST, <code style={codeStyle}>BigInt</code> for amounts, <code style={codeStyle}>Uint8Array</code> for token mints via <code style={codeStyle}>bs58.decode()</code>, deeply nested parameter objects where <code style={codeStyle}>slippageBps</code> lives in <code style={codeStyle}>swap</code> and <code style={codeStyle}>intervalMs</code> lives in <code style={codeStyle}>update</code>. Skip a nesting level and the LLM writes plausible-looking code that fails at runtime.
        </p>

        <div style={{ margin: '32px 0', padding: '24px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 16 }}>
            What the Titan skill protects against
          </p>
          <pre style={preStyle}>{`// The LLM, unaided, writes this — and it fails silently:
client.newSwapQuoteStream({
  inputMint: "So111...",       // ✗ string, should be Uint8Array
  outputMint: "EPjF...",
  amount: 100_000_000,          // ✗ number, should be BigInt
  slippageBps: 50,              // ✗ at root, should be nested in .swap
});

// With the skill loaded, it writes this — and it works:
client.newSwapQuoteStream({
  swap: {
    inputMint:  bs58.decode("So111..."),
    outputMint: bs58.decode("EPjF..."),
    amount:     BigInt(100_000_000),
    slippageBps: 50,
  },
  transaction: { userPublicKey: bs58.decode(pubkey) },
});`}</pre>
        </div>

        <p style={bodyStyle}>
          Why Titan needed a codegen skill is a clue to the broader pattern. Titan is a <em>meta</em>-aggregator — its Argos router sits on top of Jupiter, OKX&apos;s router, and DFlow, scoring all of them on the same simulated block and routing through whichever wins. Public benchmarks have Argos beating competing engines on 87% of swap comparisons since it launched in September 2025. That sophistication earned it a wire format that isn&apos;t REST — and the moment a protocol leaves the well-trodden REST path, LLMs start writing broken integration code. The skill exists so the model doesn&apos;t have to guess.
        </p>

        <p style={bodyStyle}>
          Titan also ships <code style={codeStyle}>llms.txt</code> and <code style={codeStyle}>llms-full.txt</code> at their docs root — a 2025 convention for serving LLM-optimized documentation that GitBook now auto-generates. The fact that this is now a default tells you something specific: in 2026, the main reader of API docs is increasingly an agent, not a human scanning a sidebar.
        </p>

        <SectionLabel>Three Patterns, Three Deadlines</SectionLabel>
        <p style={bodyStyle}>
          The clean way to read the field is that each pattern wins on a different deadline.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>The thin CLI wins on runtime.</strong> When the price feed ticks and a decision has to land in milliseconds, a Unix pipe beats a permission dialog. There&apos;s no model call in the hot path; the LLM, if it&apos;s there at all, sits in a slower outer loop tuning parameters.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>MCP wins on operator ergonomics.</strong> Natural-language tool use from a chat client, with a permission gate on every action and an audit trail of every approval. The fit is the off-hours operator — &quot;close half the SOL perp&quot; typed into Claude Desktop, with the model picking the OKX-place-order tool and waiting for a yes before it fires.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Codegen skills win on integration time.</strong> Getting a tricky protocol — Titan&apos;s MessagePack, a non-REST exchange, a Solana program with byte-packed account layouts — wired up correctly without spending a week debugging the wire format. The skill pays for itself in saved engineering hours, not runtime latency.
          </p>
        </div>

        <p style={bodyStyle}>
          A serious stack uses all three. The thin CLI runs production. MCP runs the operator console. The codegen skill helps you write the thin CLI in the first place. The mistake is forcing one pattern to do all three jobs.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Axis</th>
                <th style={thStyle}>Thin CLI + agent</th>
                <th style={thStyle}>MCP server</th>
                <th style={thStyle}>Codegen skill (Titan)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>What it is</td>
                <td style={tdStyle}>Pipe of processes</td>
                <td style={tdStyle}>Stdio/HTTP tool registry</td>
                <td style={tdStyle}>Doc bundle + examples</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Where it runs</td>
                <td style={tdStyle}>VPS, headless, 24/7</td>
                <td style={tdStyle}>Local, beside Claude/Cursor</td>
                <td style={tdStyle}>Inside the IDE, design-time</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Latency floor</td>
                <td style={tdStyle}>Network + subprocess (~10ms)</td>
                <td style={tdStyle}>LLM call + permission (~1s+)</td>
                <td style={tdStyle}>N/A — not in the hot path</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>LLM role</td>
                <td style={tdStyle}>Slow outer brain</td>
                <td style={tdStyle}>Interactive operator</td>
                <td style={tdStyle}>Code author</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Permissioning</td>
                <td style={tdStyle}>Filesystem perms, env vars</td>
                <td style={tdStyle}>Per-tool approval prompt</td>
                <td style={tdStyle}>Not applicable</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Best for</td>
                <td style={tdStyle}>Production trading loop</td>
                <td style={tdStyle}>Operator console, ad-hoc</td>
                <td style={tdStyle}>Non-REST or quirky wire format</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Representative</td>
                <td style={tdStyle}>tradectl + OpenClaw</td>
                <td style={tdStyle}>Solana Agent Kit, GOAT, ElizaOS</td>
                <td style={tdStyle}>@titanexchange/titan-api-skill</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Failure mode</td>
                <td style={tdStyle}>Pipe dies silently</td>
                <td style={tdStyle}>User clicks-through dialog</td>
                <td style={tdStyle}>Skill goes stale on API change</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The Titan column is the most architecturally interesting, because it tells you what the API design itself has been up to. Argos needed MessagePack for the byte savings on streaming quotes. MessagePack forced <code style={codeStyle}>BigInt</code> and <code style={codeStyle}>Uint8Array</code> into the client. Those two requirements put the integration out of reach for an LLM writing TypeScript from memory. The skill is the protocol author admitting that the wire format is now an LLM-ergonomics problem — and shipping the fix in the same repo. That admission is the genuinely new thing in 2026, more than MCP or any specific agent kit. The protocol layer and the agent layer have noticed each other.
        </p>

        <SectionLabel>The Three Operating Postures</SectionLabel>
        <p style={bodyStyle}>
          Watch how this style of stack gets used in the wild and three postures keep recurring. They&apos;re not exclusive — a trader will switch between them inside the same week — but they shape which tools get reached for.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Interactive.</strong> Manual order entry from the shell. <code style={codeStyle}>tradectl quote ef0d... | tradectl fill --sz 10</code>. No agent involved. The trader is the strategy. The CLI is just faster than a UI.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Scheduled.</strong> Cron triggers a skill. Every five minutes, check the funding rate; every day at 16:00 UTC, rebalance to neutral. OpenClaw&apos;s heartbeat is a clean fit here. The agent does light reasoning — &quot;is the funding rate above 0.03%, and if so, what size?&quot; — and the CLI executes.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Streaming.</strong> The Hermes SSE stream feeds <code style={codeStyle}>tradectl</code> directly. The strategy is a real-time reaction to ticks. Here the agent usually <em>isn&apos;t</em> in the hot path — an LLM call costs hundreds of milliseconds — but it sits in a slower outer loop, deciding the regime: trend, range, dislocation, halt. The inner loop is plain code.
          </p>
        </div>

        <p style={bodyStyle}>
          A common setup is two loops running at different speeds. The inner loop — deterministic, scoped to milliseconds — fires on every tick. The outer loop — LLM-driven, scoped to seconds — looks at the state once a minute and writes parameters into a file the inner loop reads. The agent is the slow brain; the script is the fast hand. The CLI is the table they share.
        </p>

        <SectionLabel>What the Agent Layer Actually Buys You</SectionLabel>
        <p style={bodyStyle}>
          A fair objection: if the inner loop is plain code, what does the agent layer actually earn? Three answers, ordered by how often they pay off.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Operator interface.</strong> The most underrated win. Instead of editing config files at 03:00 while a position is bleeding, you message the agent — &quot;close half the SOL perp&quot; — and it calls the skill. Telegram, terminal, web; OpenClaw routes them all into the same workspace. This is the part that survives once the novelty wears off.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Regime classification.</strong> An LLM reading a thirty-minute window of ticks plus the latest funding rate, open interest, and news headlines is, in practice, better than most heuristics at calling whether the market is trendable or stuck in a stop-hunt range. It isn&apos;t better than a human at this. It&apos;s much better than a human who&apos;s asleep.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Failure narration.</strong> When a skill errors, the agent can read the stack trace and the last hundred lines of state and write a plain-English post-mortem in the same channel where you were chatting with it. The gap between &quot;ERR 50061&quot; and &quot;OKX rejected the order because tdMode was cross but the account is set to isolated&quot; is the gap between a trader who recovers in three minutes and one who&apos;s offline for an hour.
          </p>
        </div>

        <SectionLabel>What This Doesn&apos;t Solve</SectionLabel>
        <p style={bodyStyle}>
          The thin-CLI pattern isn&apos;t magic. It doesn&apos;t give you alpha. It doesn&apos;t give you a colocated server in NY4 or AWS Tokyo. It doesn&apos;t protect you from a flash crash, a custodial outage, or your own conviction. Three specific things it openly punts on:
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Latency at the absolute edge.</strong> Wrapping every step in a subprocess call costs microseconds you won&apos;t notice and milliseconds you might. For a sniper bot reaching for a Jito bundle, the inner loop should be a single Rust binary holding open gRPC sockets, not a Node script. The CLI pattern wins for systematic / market-making style work, not for race-to-block sniping.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Risk management.</strong> A position-size check, a max-drawdown circuit breaker, a kill switch — those have to live in a process that <em>cannot</em> be interrupted by an LLM hallucination. The pattern: risk is a separate watcher script the agent has no permission to override. The agent can ask. The watcher answers.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Cross-venue settlement.</strong> Moving collateral between OKX and a Solana DEX is a multi-step, multi-chain dance that no current agent runtime handles well end to end. The honest answer is to script it explicitly and have the agent <em>call</em> the script when the strategy needs it — not to expect the agent to plan the bridge route on its own.
          </p>
        </div>

        <SectionLabel>Where This Goes</SectionLabel>
        <p style={bodyStyle}>
          The terminal didn&apos;t lose to the GUI in trading; it absorbed it. Every chart on a Bloomberg or a TradingView panel is a sidecar to a CLI session somewhere. The new layer — agent runtimes that hold context, MCP servers that gate tool use behind permissions, codegen skills that translate quirky wire formats — is doing the same thing the shell did: becoming the surface on which automation compiles. OpenClaw, Hermes, OKX&apos;s AI Agent SDK, Solana Agent Kit, GOAT, Titan&apos;s skill, and the dozen similar runtimes shipping in 2026 aren&apos;t competing with the CLI. They&apos;re extending it at different points in the stack — runtime, console, design-time.
        </p>
        <p style={bodyStyle}>
          The honest version of the &quot;will AI replace traders&quot; question is sharper than the question itself. It has already replaced the manual-clicks layer for anyone willing to write a script — and that was already most serious traders. What it adds, when it&apos;s wired right, is a slow brain that doesn&apos;t sleep, an operator interface that doesn&apos;t need a dashboard, and the ability to narrate its own failures. That isn&apos;t a new product category. It&apos;s another stage in the pipe.
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
              { label: 'Titan Developer Docs — AI / LLM Integration overview', href: 'https://titan-exchange.gitbook.io/titan/developer-doc/resources/ai-llm-integration' },
              { label: '@titanexchange/titan-api-skill — Claude Code skill for Titan’s WebSocket + MessagePack protocol (npm)', href: 'https://www.npmjs.com/package/@titanexchange/titan-api-skill' },
              { label: 'What Is Titan? The Meta DEX Aggregator (Backpack Learn)', href: 'https://learn.backpack.exchange/articles/what-is-titan-aggregator-solana' },
              { label: 'Titan Exchange — DefiLlama protocol stats', href: 'https://defillama.com/protocol/titan-exchange' },
              { label: 'llms.txt — the LLM-optimized documentation convention (spec)', href: 'https://llmstxt.org/' },
              { label: 'Model Context Protocol — official specification (modelcontextprotocol.io)', href: 'https://modelcontextprotocol.io/' },
              { label: 'How to Build a Solana MCP Server for LLM Integration (QuickNode)', href: 'https://www.quicknode.com/guides/ai/solana-mcp-server' },
              { label: 'How to Build Solana AI Agents in 2026 — layered architecture guide (Alchemy)', href: 'https://www.alchemy.com/blog/how-to-build-solana-ai-agents-in-2026' },
              { label: 'Solana Agent Kit (SendAI) — 60+ pre-built actions (GitHub)', href: 'https://github.com/sendaifun/solana-agent-kit' },
              { label: 'GOAT SDK (Crossmint) — 200+ plugins across Solana and EVM (GitHub)', href: 'https://github.com/goat-sdk/goat' },
              { label: 'ElizaOS — persistent agent runtime with multi-channel routing (GitHub)', href: 'https://github.com/elizaOS/eliza' },
              { label: 'Rig — Rust framework for low-latency LLM-to-on-chain execution', href: 'https://github.com/0xPlaygrounds/rig' },
              { label: 'awesome-solana-ai — Solana Foundation curated AI tooling list', href: 'https://github.com/solana-foundation/awesome-solana-ai' },
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
