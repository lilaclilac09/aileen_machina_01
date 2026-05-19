'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function ClobArticle() {
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
            ANALYSIS
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.05.17
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            DeFi · Solana · CLOB · MEV
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
          The Order Book<br /><span style={{ color: '#00ffea' }}>That Doesn&apos;t Break</span>
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
          On-chain CLOBs were supposed to be impossible. Solana proved they weren&apos;t.
          But the matching engine is the easy part. The real engineering problem is everything around it:
          how capital flows, who fills your orders, and whether you get frontrun before your cancel lands.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — The Write Lock Problem</SectionLabel>
        <p style={bodyStyle}>
          An order book is a sorted list. Every new order inserts into that list, every fill removes from it, every cancel modifies it. On a centralized exchange, this is a single-threaded data structure in memory. Fast. On a blockchain, this list is an on-chain account, and Solana enforces a rule: only one transaction can write to a given account per slot. Everything else queues.
        </p>
        <p style={bodyStyle}>
          At low volume, this is fine. At high volume, the order book account becomes a bottleneck. Market makers submit hundreds of updates per second. If they all target the same account, most transactions fail with write-lock contention. The matching engine might be correct, but it can&apos;t process the load.
        </p>
        <p style={bodyStyle}>
          Ethereum&apos;s approach was to give up. Gas costs made frequent order updates economically unviable anyway. A single order placement on Uniswap costs $2-50 in gas depending on congestion. Market makers who need to update quotes every few hundred milliseconds would go bankrupt. The industry pivoted to AMMs, which only require liquidity providers to deposit once and let a mathematical formula handle price discovery. The trade-off: permanent impermanent loss, no limit orders, and MEV extraction baked into the design.
        </p>
        <p style={bodyStyle}>
          Solana changes the economics. A new block every 400ms. Transaction fees measured in fractions of a cent. But it doesn&apos;t change the write-lock constraint. The engineering challenge isn&apos;t cost. It&apos;s concurrency.
        </p>

        <SectionLabel>02 — Phoenix: Inline Matching</SectionLabel>
        <p style={bodyStyle}>
          Serum was Solana&apos;s first CLOB. Its architecture separated order submission from order matching. Orders entered a request queue (an on-chain account). A separate program called the &quot;crank&quot; periodically read the queue, matched orders against the book, and wrote the results back. The crank was an off-chain process that someone had to run and pay for. If the crank operator went down, the order book froze. Orders would sit in the queue, unmatched.
        </p>
        <p style={bodyStyle}>
          Phoenix eliminated this dependency by moving matching inline. When you submit an order, the transaction itself checks the book, finds counterparties, executes fills, and updates balances. One transaction, one atomic operation. No queue, no crank, no external process.
        </p>
        <p style={bodyStyle}>
          The constraint that makes this hard: Solana caps compute per transaction at 1.4 million compute units (CU). The default allocation is 200K CU. A Phoenix market order that walks through multiple price levels, matching against several resting orders, executing partial fills, and updating maker/taker balances, has to fit inside this budget. The matching engine is written to minimize every unnecessary memory access and computation. Each order node in the book is a fixed-size struct laid out for sequential reads.
        </p>
        <p style={bodyStyle}>
          Phoenix uses a FIFO (First In, First Out) matching priority. At the same price level, the order that arrived first gets filled first. This is the same model as CME and most traditional exchanges. It rewards speed: if you can get your order on-chain first, you have priority. For market makers, this means the game becomes about transaction landing latency, not just pricing.
        </p>

        <SectionLabel>03 — Manifest: Zero Fees, Permissionless Markets</SectionLabel>
        <p style={bodyStyle}>
          Manifest takes a different position in the design space. Where Phoenix prioritizes execution quality and tight spreads for a curated set of markets, Manifest prioritizes accessibility.
        </p>

        {/* Comparison table */}
        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Phoenix</th>
                <th style={thStyle}>Manifest</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Market creation cost</td>
                <td style={tdStyle}>~3 SOL (~$500)</td>
                <td style={tdStyle}>&lt;0.01 SOL (~$1.50)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Trading fees</td>
                <td style={tdStyle}>Configurable per market</td>
                <td style={tdStyle}>Zero, permanently</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Matching priority</td>
                <td style={tdStyle}>FIFO</td>
                <td style={tdStyle}>FIFO</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Cross-market capital</td>
                <td style={tdStyle}>No (siloed per market)</td>
                <td style={tdStyle}>Yes (Global Orders)</td>
              </tr>

            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The fee structure matters. Zero fees means there&apos;s no protocol revenue, which means no protocol-level incentive to direct flow to specific markets. This is a deliberate design: the protocol is infrastructure, not a business. Market makers set their own spreads; the protocol takes nothing on top.
        </p>
        <SectionLabel>04 — Global Orders: Cross-Margin Without Leverage</SectionLabel>
        <p style={bodyStyle}>
          This is Manifest&apos;s most consequential design decision and the part worth understanding in detail.
        </p>
        <p style={bodyStyle}>
          Standard CLOB capital flow: you deposit USDC into a specific market&apos;s vault account. Those funds are locked. You can place orders, cancel orders, but the capital stays in that market until you withdraw. If you market-make on five pairs, you need five separate deposits. Capital is fragmented.
        </p>
        <p style={bodyStyle}>
          Manifest Global Orders change the settlement model. Your funds stay in your own global account. When you place a Global Order on SOL/USDC, no USDC moves. The order sits on the book as a claim against your global balance. When a taker fills your order, the settlement happens at fill time: your USDC leaves the global account and goes to the taker, the SOL comes to you. This is JIT (Just In Time) settlement.
        </p>
        <p style={bodyStyle}>
          The capital efficiency gain is multiplicative. With $100K in a global account, you can quote across ten markets simultaneously. Each market sees $100K of available liquidity on your orders. Same capital, 10x the on-book depth. This is the same logic as cross-margin on a centralized exchange, except there&apos;s no leverage and no liquidation risk. Every order is fully backed at the moment of placement. The risk is only that multiple orders fill simultaneously.
        </p>

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
          The order book itself isn&apos;t the hard part. The hard part is getting capital efficiency and settlement guarantees right at the same time.
        </blockquote>

        {/* Risk box */}
        <div style={{
          margin: '40px 0',
          padding: '28px 32px',
          background: 'rgba(255,60,60,0.04)',
          border: '1px solid rgba(255,60,60,0.15)',
        }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.4em',
            color: 'rgba(255,100,100,0.7)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>RISK: SIMULTANEOUS FILLS ACROSS MARKETS</p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            You have $100K in your global account. You place $80K buy orders across eight markets. Under normal conditions, only one or two fill at any given time. The math works.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            During a market-wide crash, multiple pairs dump simultaneously. Three markets try to fill your orders in the same slot. Manifest processes them first-come-first-served within the block: fill one, deduct $80K, balance is $20K. Fill two fails. Fill three fails. Your orders were on the book, but they were phantom liquidity at the exact moment the market needed them most.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            This isn&apos;t a bug. It&apos;s the design trade-off. Capital efficiency and settlement guarantees are in tension. Market makers who use Global Orders need to model their worst-case simultaneous fill scenario and size accordingly. The naive approach of quoting full balance everywhere creates a false picture of depth.
          </p>
        </div>

        <SectionLabel>05 — Aggregator Routing: Who Fills Your Orders</SectionLabel>
        <p style={bodyStyle}>
          A CLOB can have perfect matching logic and still see zero volume if nobody sends orders to it. This is the aggregator problem: how does trade flow reach the book?
        </p>
        <p style={bodyStyle}>
          Jupiter is Solana&apos;s dominant aggregator, routing through AMMs (Orca, Raydium) and CLOBs (Phoenix, Manifest) simultaneously. When a user swaps SOL for USDC on Jupiter, the router compares prices across all integrated venues, splits the order if needed, and executes against whichever combination gives the best output. The CLOB competes on price with every AMM pool.
        </p>
        <p style={bodyStyle}>
          0x comes from Ethereum, where they built a Request-for-Quote (RFQ) system. Professional market makers respond to quote requests in real time, competing to fill each order. On Solana, 0x&apos;s Swap API aggregates across venues the same way Jupiter does. For market makers, being integrated into both aggregators means more flow. The question is what kind of flow.
        </p>
        <p style={bodyStyle}>
          Aggregator flow skews retail. A user swapping $500 of SOL on a frontend doesn&apos;t watch the order book or time their execution. They accept the best price the aggregator finds. This flow is less toxic than direct DEX trading, where sophisticated actors monitor the book and pick off stale quotes. For market makers, retail aggregator flow is the good flow. You quote a spread, the fill arrives, and the price hasn&apos;t moved against you by the time you hedge.
        </p>
        <p style={bodyStyle}>
          The downside: aggregator integration is binary. If your price is the best, you get the fill. If it&apos;s not, you get nothing. There&apos;s no loyalty, no relationship, no &quot;you filled me last time so I&apos;ll route to you again.&quot; Pure price competition, every single order.
        </p>

        <SectionLabel>06 — Cancel Latency: The Market Maker&apos;s Real Problem</SectionLabel>
        <p style={bodyStyle}>
          For a market maker on a centralized exchange, canceling an order is instantaneous — a message over a WebSocket, acknowledged in microseconds. No fee, no queue, no race. On a Solana CLOB, a cancel is a transaction. It must be submitted, propagated, included in a block, and confirmed. At Solana&apos;s baseline, that&apos;s 400ms per slot — an eternity when prices are moving.
        </p>
        <p style={bodyStyle}>
          This asymmetry is the defining constraint of on-chain market making. Posting a quote is a commitment that can&apos;t be undone instantly. Every resting order is a liability: a promise to trade at a fixed price, regardless of what the market does before the cancel lands. When a large order hits the mempool and moves price, the window between &quot;price moved&quot; and &quot;cancel confirmed&quot; is where market makers bleed. Sophisticated actors — termed &quot;snipers&quot; — exist specifically to fill stale quotes in that window before the cancel arrives.
        </p>

        {/* Cancel latency data box */}
        <div style={{ margin: '40px 0', padding: '28px 32px', background: 'rgba(0,255,234,0.03)', border: '1px solid rgba(0,255,234,0.12)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.6)', textTransform: 'uppercase', marginBottom: 16 }}>Cancel Latency in Practice</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
            {[
              { stat: '~400ms', label: 'Solana slot time — baseline cancel window' },
              { stat: '50–200ms', label: 'Practical landing time with priority fee' },
              { stat: '&lt;1ms', label: 'CEX cancel acknowledgment (WebSocket)' },
              { stat: '~80%', label: 'Solana validators running Jito software (2024)' },
            ].map((d, i) => (
              <div key={i}>
                <p style={{ fontFamily: 'monospace', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#00ffea', margin: '0 0 6px', letterSpacing: '0.02em' }} dangerouslySetInnerHTML={{ __html: d.stat }} />
                <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={bodyStyle}>
          The cancel problem cascades into quoting strategy. A market maker who quotes tight spreads on many price levels is most exposed: more resting orders means more potential fills at stale prices during a move. The rational response is to either quote wider (reducing sniper profitability but also reducing competitiveness) or to invest heavily in cancel infrastructure — colocation with validators, low-latency RPC nodes, priority fee tuning. This is why professional on-chain market making is expensive. The edge is not in the pricing model; it&apos;s in the infrastructure that gets cancels on-chain faster than competitors.
        </p>

        <SectionLabel>06b — Jito: Block Auctions, Bundles, and the Private Mempool</SectionLabel>
        <p style={bodyStyle}>
          Jito is not a single tool — it is a layered MEV infrastructure that runs across most of Solana&apos;s validator set. Understanding it requires separating four distinct components.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Block Engine.</strong> Jito operates a block engine — a service that validators (running Jito-patched software) connect to. The block engine receives bundles and individual transactions, simulates them, and assembles the most profitable ordering for the validator. As of 2024, approximately 80% of Solana validators run Jito software, which means most blocks are built through the Jito block engine. A transaction sent only to standard RPC has no path into a Jito block unless it is also forwarded.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Bundles.</strong> A bundle is an ordered sequence of up to five transactions submitted atomically. All five execute in sequence, or none do. The canonical MM use case: [cancel stale bid] → [cancel stale ask] → [place new bid] → [place new ask]. No bot can insert a transaction between the cancel and the requote because the entire sequence lands as one unit. Bundles can also include a fill: [fill incoming order] → [hedge on another venue], ensuring the hedge lands in the same slot as the fill.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Tips.</strong> Every bundle includes a tip — a direct SOL payment to the validator (via a Jito tip account). This is separate from the base transaction fee. The tip is the auction price for block ordering priority. Median tips are a fraction of a cent during quiet markets. During high-volatility events (token launches, major liquidations), tips spike: competitive bundles have been observed paying 1–5 SOL (~$150–750 at $150/SOL) for a single bundle to ensure first-in-block execution. The tip market is a second-price auction dynamic — you need to outbid the next competitor, not maximize your payment.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>ShredStream.</strong> Shreds are the raw data fragments Solana validators broadcast as they build blocks — before the block is complete or confirmed. Jito&apos;s ShredStream service lets subscribers receive shreds directly from validators in real time, giving them the earliest possible view of what is landing on-chain. For market makers, this is the cancel signal: when ShredStream shows a large order approaching their resting quotes, they have ~50–100ms to submit a cancel bundle before the order lands. Without ShredStream, you are reacting to confirmed state — already too late.
          </p>
        </div>

        <p style={bodyStyle}>
          The difference between regular trading and Jito-mediated trading is architectural. A standard transaction goes to a public RPC node, propagates through gossip, and competes for inclusion based on base fee alone. It is visible to anyone watching the mempool. A Jito bundle goes through a private channel directly to the block engine, is simulated off-chain, and is only revealed to the network when it lands in a confirmed block. No front-running window. No public visibility. The bundle either executes as written or is dropped silently.
        </p>

        {/* Jito vs regular comparison table */}
        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Standard tx</th>
                <th style={thStyle}>Jito bundle</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Visibility before landing</td>
                <td style={tdStyle}>Public mempool — anyone can see</td>
                <td style={tdStyle}>Private — only block engine sees</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Atomicity</td>
                <td style={tdStyle}>Single tx — can be reordered around</td>
                <td style={tdStyle}>Up to 5 txs — all land in order or none do</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Priority mechanism</td>
                <td style={tdStyle}>Priority fee (lamports/CU)</td>
                <td style={tdStyle}>Tip (flat SOL) + priority fee</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Failure mode</td>
                <td style={tdStyle}>Tx included but reverts — fee still paid</td>
                <td style={tdStyle}>Bundle dropped if simulation fails — no fee</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Front-run risk</td>
                <td style={tdStyle}>High — visible in gossip</td>
                <td style={tdStyle}>None — private until confirmed</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Typical cost</td>
                <td style={tdStyle}>~0.000005 SOL base fee</td>
                <td style={tdStyle}>0.0001–5 SOL tip (market-rate dependent)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The spread you see on a Solana CLOB encodes all of this. It is not the market maker&apos;s profit margin. It is the sum of: expected adverse selection from fills before cancels land, Jito tip cost amortized across expected fill volume, infrastructure costs (ShredStream, colocation, low-latency RPC), and the actual profit target — likely the smallest component of the four during volatile periods. A 5 bps spread on a liquid pair on Phoenix may represent 1 bps of actual profit and 4 bps of operational overhead that does not exist on a centralized exchange.
        </p>

        <SectionLabel>07 — The Mechanism Landscape: AMM, RFQ, Intent, CLOB</SectionLabel>
        <p style={bodyStyle}>
          A CLOB is one answer to the price discovery problem. Three others coexist on-chain, each making different trade-offs.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Mechanism</th>
                <th style={thStyle}>Examples</th>
                <th style={thStyle}>Price discovery</th>
                <th style={thStyle}>Who takes risk</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>AMM (x·y=k)</td>
                <td style={tdStyle}>Uniswap, Orca, Raydium</td>
                <td style={tdStyle}>Formula — price moves with each swap</td>
                <td style={tdStyle}>LPs (impermanent loss)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>RFQ</td>
                <td style={tdStyle}>0x, Hashflow</td>
                <td style={tdStyle}>Market makers quote on request, off-chain</td>
                <td style={tdStyle}>Market maker</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Intent-based</td>
                <td style={tdStyle}>UniswapX, Across, CoW Protocol</td>
                <td style={tdStyle}>Solver competition — best fill wins</td>
                <td style={tdStyle}>Solver (short window)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>On-chain CLOB</td>
                <td style={tdStyle}>Phoenix, Manifest</td>
                <td style={tdStyle}>Transparent book — FIFO matching</td>
                <td style={tdStyle}>Market maker</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>AMMs</strong> trade execution simplicity for capital efficiency. Liquidity providers deposit once; the formula handles everything. But the formula is predictable — every large order is sandwichable, LPs absorb adverse selection by design, and there are no limit orders. AMMs work for passive liquidity. They fail for tight spreads.
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>RFQ</strong> flips the model: no public book, no formula. A user requests a quote, market makers compete to respond, the best bid wins. Zero MEV exposure — the price is agreed before the tx broadcasts. But it requires market makers to be online, responsive, and willing to quote every token. Long-tail assets get no coverage.
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Intent-based routing</strong> (UniswapX, CoW Protocol) abstracts the venue entirely. The user signs an intent: &quot;give me at least X for Y.&quot; Solvers — bots competing to fill — find the optimal path across AMMs, CLOBs, private inventory. The user gets best execution. The solver captures the surplus. MEV is redirected from extractors to solvers and partially returned to users. The risk: solver centralization. A handful of solvers handle the majority of flow.
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>On-chain CLOBs</strong> are the only model where price is transparent before the trade and limit orders are native. Every resting order is a public commitment. Market makers compete on spread. Takers see the full depth. The cost: write-lock contention, compute constraints, MEV exposure on every cancel-requote cycle.
        </p>

        <SectionLabel>08 — Derivative Markets: Hyperliquid, dYdX, GMX</SectionLabel>
        <p style={bodyStyle}>
          Spot CLOBs solve one problem: matching buyers and sellers of existing assets. Derivatives add a second layer — synthetic exposure, leverage, funding rates, liquidation engines, oracle pricing. Each solved it differently.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>GMX / GLP model.</strong> No order book. Liquidity providers deposit a basket of assets into a pool (GLP). Traders open long or short positions against the pool as counterparty. Prices come from Chainlink oracles — no book depth, no spread. The pool earns fees when traders lose; it bleeds when traders win. Capital efficient for LPs when traders are net unprofitable. Structurally fragile when they are not.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>dYdX v4 (Cosmos app-chain).</strong> Off-chain order book, on-chain settlement. Validators run the matching engine off-chain in their local state; only fills hit the Cosmos chain. Sub-second latency. The trade-off: validators must be trusted to match orders honestly. Censorship is possible at the validator level. dYdX chose performance over full on-chain transparency.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Hyperliquid.</strong> Purpose-built L1 (HyperBFT consensus, Tendermint-derived). The entire matching engine runs on-chain on their own chain — no shared congestion with other applications. Order acknowledgment under 1ms. The validator set is small (~20 initially), which is the central trust assumption. HIP-1 defines the native token standard for deploying assets directly on Hyperliquid&apos;s L1. HIP-2 provides automatic liquidity seeding for new HIP-1 spot markets — the protocol bootstraps initial order book depth at the auction clearing price, preventing empty-book cold-start failure. The HLP (Hyperliquidity Provider) vault acts as the native market maker, absorbing flow the external maker ecosystem doesn&apos;t cover.
          </p>
        </div>

        <p style={bodyStyle}>
          The structural difference between Phoenix and Hyperliquid comes down to one question: who controls the sequencer? On Solana, Solana&apos;s decentralized validator set sequences your transactions. On Hyperliquid, Hyperliquid&apos;s validator set does. You get 400x the speed in exchange for trusting a smaller committee. Whether that trade-off is acceptable depends on what you&apos;re trading and how much you&apos;re putting at risk.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Phoenix</th>
                <th style={thStyle}>Hyperliquid</th>
                <th style={thStyle}>dYdX v4</th>
                <th style={thStyle}>GMX</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Chain</td>
                <td style={tdStyle}>Solana</td>
                <td style={tdStyle}>Own L1 (HyperBFT)</td>
                <td style={tdStyle}>Own L1 (Cosmos)</td>
                <td style={tdStyle}>Arbitrum / Avalanche</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Matching</td>
                <td style={tdStyle}>On-chain, inline</td>
                <td style={tdStyle}>On-chain, own chain</td>
                <td style={tdStyle}>Off-chain (validators)</td>
                <td style={tdStyle}>Oracle — no book</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Latency</td>
                <td style={tdStyle}>~400ms</td>
                <td style={tdStyle}>&lt;1ms ack, ~2s finality</td>
                <td style={tdStyle}>~500ms</td>
                <td style={tdStyle}>Oracle refresh rate</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Validator trust</td>
                <td style={tdStyle}>1,800+ Solana validators</td>
                <td style={tdStyle}>~20 (semi-centralised)</td>
                <td style={tdStyle}>dYdX validator set</td>
                <td style={tdStyle}>Chainlink oracle network</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Derivatives</td>
                <td style={tdStyle}>Spot only</td>
                <td style={tdStyle}>Perps + spot</td>
                <td style={tdStyle}>Perps</td>
                <td style={tdStyle}>Perps (synthetic)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>MEV exposure</td>
                <td style={tdStyle}>High (Solana mempool)</td>
                <td style={tdStyle}>Low (own mempool)</td>
                <td style={tdStyle}>Low (off-chain matching)</td>
                <td style={tdStyle}>Oracle latency arb</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>09 — Scalability: Where Each Model Breaks</SectionLabel>
        <p style={bodyStyle}>
          Every trading architecture has a ceiling. The question is where it cracks under load — and whether that ceiling is infrastructure, economics, or trust.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>AMMs scale until MEV does.</strong> Each swap is O(1) — no book to traverse, no matching logic. Solana AMMs handle millions of swaps. But as TVL grows, so does the size of sandwichable trades. MEV extraction scales with liquidity. Concentrated liquidity (Orca Whirlpools) improves capital efficiency but narrows the range that earns fees, concentrating IL risk. The model doesn&apos;t break; it just becomes more extractive at scale.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>On-chain CLOBs (Solana) hit write-lock ceilings.</strong> Phoenix and Manifest are bottlenecked by Solana&apos;s account write-lock rule: one writer per account per slot. At low volume, fine. At high volume, the order book account becomes a serial resource. Multiple market makers targeting the same account in the same slot means most of them fail. The practical throughput for a single Phoenix market under contested conditions is far below Solana&apos;s theoretical 65,000 TPS. Compute limits per transaction add a second ceiling: deep order walks that touch many price levels hit the 1.4M CU cap.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Own-chain CLOBs (Hyperliquid, dYdX) remove the shared congestion problem.</strong> No other applications compete for the same write locks. The matching engine has the full validator throughput. Hyperliquid processes 100,000+ orders per second in their own benchmarks. But the ceiling shifts: it&apos;s now the validator set size and the trust model. Fewer validators means faster BFT consensus but a smaller security set. A cartel of validators could front-run orders or censor cancels. This is a governance and decentralization problem, not an infrastructure one — and it gets harder to solve as the platform grows more valuable.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>RFQ scales with market maker capital, not infrastructure.</strong> There&apos;s no order book to contend for, no write-lock bottleneck. Throughput is limited by how many quote requests market makers can respond to per second. For liquid pairs, this is effectively unlimited. For long-tail assets, market makers simply don&apos;t show up. The model scales horizontally — add more market makers — but fails vertically: there&apos;s no native price discovery, so takers depend entirely on the market maker being honest and competitive.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Intent-based routing scales with solver infrastructure.</strong> Solvers run off-chain, spin up as needed, and compete on every order independently. The on-chain footprint is a single settlement tx per fill. This is the most scalable model from a pure throughput perspective. The risk is solver centralization: if three solvers handle 90% of flow, the &quot;competitive solver auction&quot; becomes oligopolistic pricing in practice. The user sees best execution today; whether that holds as solver market structure consolidates is the open question.
          </p>
        </div>

        <p style={bodyStyle}>
          No model wins cleanly. AMMs win on simplicity and passive liquidity. RFQ wins on MEV protection for liquid pairs. Intent-based wins on user execution quality. On-chain CLOBs win on transparency and limit order support. Own-chain CLOBs win on raw throughput — at the cost of the decentralization properties that make on-chain trading meaningful in the first place.
        </p>

        <SectionLabel>10 — Where This Goes</SectionLabel>
        <p style={bodyStyle}>
          The technical stack for on-chain CLOBs on Solana is production-ready. Phoenix and Manifest both work. Orders match, settlements clear, the matching engines survive real load. The solved problem is the matching engine.
        </p>
        <p style={bodyStyle}>
          The unsolved problems are all economic. Capital efficiency vs. settlement guarantees (Global Orders). Spread compression vs. MEV exposure (Jito costs). Aggregator integration vs. adverse selection (flow quality). These are the same problems centralized exchanges have spent decades optimizing. The difference is that on-chain, every parameter is visible, every trade-off is measurable, and every design decision plays out in public.
        </p>
        <p style={bodyStyle}>
          The interesting question isn&apos;t whether on-chain order books can work. They can. The interesting question is whether the economic equilibrium they converge to is better than AMMs for the median user — and whether own-chain CLOBs like Hyperliquid can maintain their speed advantage without sacrificing the decentralization that makes the whole model trustworthy. That answer depends on how many sophisticated market makers show up, how much capital they deploy, how much MEV they&apos;re willing to absorb, and whether the validator sets running these systems stay honest as the stakes grow. The matching engine was the prerequisite. Now the game is about who plays it, on which chain, under which rules.
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
            The matching engine was the prerequisite.<br />
            <span style={{ color: '#00ffea' }}>
              Capital flow, aggregator routing, MEV economics. Three separate games, all running simultaneously, all deciding whether the book survives.
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
              { label: 'Phoenix Protocol — On-Chain CLOB Architecture', href: 'https://github.com/Ellipsis-Labs/phoenix-v1' },
              { label: 'Manifest — Permissionless CLOB & Global Orders', href: 'https://github.com/CKS-Systems/manifest' },
              { label: 'Jito Labs — Block Engine & Bundle Documentation', href: 'https://docs.jito.wtf/lowlatencytxnsend/' },
              { label: 'Jito ShredStream — Real-Time Validator Data', href: 'https://github.com/jito-foundation/shredstream-proxy' },
              { label: 'Jito MEV Dashboard — On-Chain Tip & Bundle Data', href: 'https://explorer.jito.wtf/' },
              { label: 'Jupiter Aggregator — Routing Across Solana Venues', href: 'https://station.jup.ag/docs' },
              { label: 'Solana Transaction Compute Budget', href: 'https://solana.com/docs/core/transactions/compute' },
              { label: 'Solana Validator Economics & Jito Adoption (Helius)', href: 'https://www.helius.dev/blog/solana-mev-an-introduction' },
              { label: 'Hyperliquid — HIP-1 & HIP-2 Specification', href: 'https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-1-and-hip-2' },
              { label: 'Hyperliquid — HLP Vault & Liquidity Design', href: 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/hlp' },
              { label: 'dYdX v4 — Cosmos App-Chain Architecture', href: 'https://dydx.exchange/blog/dydx-chain' },
              { label: 'GMX — GLP Pool and Oracle Pricing Model', href: 'https://gmx-io.notion.site/gmx-io/GMX-Whitepaper-3a06fba7a6a64bda8bc70e9ca8f56de4' },
              { label: 'CoW Protocol — Intent-Based Settlement', href: 'https://docs.cow.fi/cow-protocol/concepts/introduction/intents' },
              { label: 'UniswapX — Solver Auction Design', href: 'https://blog.uniswap.org/uniswapx-protocol' },
              { label: 'Flashbots — MEV Research & Bundle Auction Theory', href: 'https://writings.flashbots.net/mev-auction-theory' },
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
  fontSize: '0.8rem',
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
