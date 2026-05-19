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

        <SectionLabel>06 — MEV and Jito: The Cost of Being Seen</SectionLabel>
        <p style={bodyStyle}>
          Every transaction on Solana is visible in the mempool before it lands in a block. A market maker posts a quote. A large buy order appears in the mempool. A bot sees both. The bot sends its own transaction to buy ahead of the large order, pushing the price up, then sells into the large order at the higher price. The market maker&apos;s quote gets filled, but at a stale price. This is sandwich MEV.
        </p>
        <p style={bodyStyle}>
          The market maker&apos;s defense: cancel stale quotes before they get picked off. But the cancel is also a transaction that has to land. If the bot&apos;s transaction has higher priority (higher fee), the bot fills the stale quote before the cancel arrives. The market maker&apos;s only option is to pay more for priority.
        </p>
        <p style={bodyStyle}>
          Jito is Solana&apos;s MEV infrastructure. It provides two mechanisms that market makers use:
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Bundles.</strong> You package &quot;cancel old quote + place new quote + fill incoming order&quot; into a single atomic bundle. All three execute in sequence within the same slot, or none do. No gap for bots to exploit between cancel and requote.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Tips.</strong> You attach a tip (in SOL) to your bundle. Higher tip means higher priority in the block. This is an auction: you&apos;re bidding against other bundles for execution order. During volatile markets, tips spike because everyone is racing to cancel and requote.
          </p>
        </div>

        <p style={bodyStyle}>
          The spread you see on a Solana CLOB is not just the market maker&apos;s profit margin. Part of it is the cost of Jito tips. Part of it is the expected loss from times the cancel didn&apos;t land fast enough. The tighter the spread, the more the market maker bleeds to MEV. The wider the spread, the less competitive they are on aggregators. This is the fundamental tension of on-chain market making.
        </p>

        <SectionLabel>07 — Where This Goes</SectionLabel>
        <p style={bodyStyle}>
          The technical stack for on-chain CLOBs on Solana is production-ready. Phoenix and Manifest both work. Orders match, settlements clear, the matching engines survive real load. The solved problem is the matching engine.
        </p>
        <p style={bodyStyle}>
          The unsolved problems are all economic. Capital efficiency vs. settlement guarantees (Global Orders). Spread compression vs. MEV exposure (Jito costs). Aggregator integration vs. adverse selection (flow quality). These are the same problems centralized exchanges have spent decades optimizing. The difference is that on-chain, every parameter is visible, every trade-off is measurable, and every design decision plays out in public.
        </p>
        <p style={bodyStyle}>
          The interesting question isn&apos;t whether on-chain order books can work. They can. The interesting question is whether the economic equilibrium they converge to is better than AMMs for the median user. That answer depends on how many sophisticated market makers show up, how much capital they deploy, and how much MEV they&apos;re willing to absorb. The matching engine was the prerequisite. Now the game is about who plays it.
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
              { label: 'Jito — MEV Infrastructure on Solana', href: 'https://www.jito.network/' },
              { label: 'Jupiter Aggregator — Routing Across Solana Venues', href: 'https://station.jup.ag/docs' },
              { label: 'Solana Transaction Compute Budget', href: 'https://solana.com/docs/core/transactions/compute' },
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
