'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function CexDexArbArticle() {
  return (
    <SubstackShell
      category="Market Structure"
      date="2026.05.21"
      tags="CEX · DEX · MEV · Dune"
      title="The Darkest Trade"
      dek="CEX-DEX arbitrage is the largest single MEV category on Ethereum, the quietest game on Solana, and the only profitable strategy where one leg of the trade is invisible to the chain you are trading on."
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The Two-Cent Spread</SectionLabel>
        <p style={bodyStyle}>
          Picture this. SOL is quoted at <strong style={strong}>$172.41</strong> on Binance — a CEX, a
          centralized exchange where one company runs the order book. Twenty milliseconds later, the same SOL
          is quoted at <strong style={strong}> $172.46</strong> on a Solana DEX — a decentralized exchange
          that lives entirely on-chain. Why have the two prices drifted apart? Because they aren&apos;t the
          same machine. Binance updates its order book maybe a thousand times a second over a private matching
          engine. The DEX only updates when someone submits a transaction that lands in the next block — and
          that happens once every 400 milliseconds on Solana, once every twelve seconds on Ethereum.
        </p>
        <p style={bodyStyle}>
          That five-cent gap is basically a free option. Buy on Binance, sell on the DEX at the same instant,
          and if you move before either price catches up you&apos;ve pocketed five cents on a position you
          never had to hold. Do it a thousand times in one block and that&apos;s fifty dollars in a single
          400-millisecond slot. Do it for a year and you&apos;ve built a profit pool the public chain data
          can&apos;t explain on its own — because half of the trade never touched the chain at all.
        </p>
        <p style={bodyStyle}>
          This is <strong style={strong}>CEX-DEX arbitrage</strong>. On Ethereum it&apos;s the single largest
          category of extracted value. On Solana it&apos;s the most under-measured form of MEV — maximal
          extractable value, which is just the profit you can squeeze out of ordering and inserting
          transactions. Until 2025 nobody had a clean public number for how big it was. That changed when a
          group of researchers — Sui414, William, soispoke, and malleshpai — released a custom Dune dataset
          that finally let outsiders see it.
        </p>

        <SectionLabel>Two Flavors of the Trade</SectionLabel>
        <p style={bodyStyle}>
          There are two distinct CEX-DEX strategies, and they live on different parts of the order book.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, margin: '32px 0 40px' }}>
          {[
            {
              tag: 'PRICE ARB',
              tagline: 'Spot price on a CEX drifts away from spot price on a DEX. Buy the cheap one, sell the expensive one, hold no inventory at the end of the slot.',
              who: 'The classic two-legged trade. Capacity bounded by DEX liquidity at depth.',
            },
            {
              tag: 'FUNDING RATE ARB',
              tagline: 'Perpetual funding rate differs between a CEX perp and a DEX perp. Long the cheaper funding, short the more expensive funding, collect the spread per hour.',
              who: 'Carry trade, not directional. Capacity bounded by venue OI (open interest — the total size of outstanding positions) caps.',
            },
          ].map((card, i) => (
            <div key={i} style={{
              padding: '20px 22px',
              border: '1px solid rgba(0,255,234,0.15)',
              background: 'rgba(0,255,234,0.02)',
              borderRadius: 4,
            }}>
              <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em', color: '#00ffea', margin: '0 0 8px' }}>{card.tag}</p>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', margin: '0 0 10px' }}>{card.tagline}</p>
              <p style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.4)', margin: 0, fontStyle: 'italic' }}>{card.who}</p>
            </div>
          ))}
        </div>

        <p style={bodyStyle}>
          Drift&apos;s educational write-up gives the textbook retail version. SOL spot at $13.179 on Binance
          versus $13.21 on Orca is a price-arb opportunity worth $0.031 per unit. A SOL-PERP funding rate —
          the periodic payment that keeps a perpetual future tethered to spot — of
          <code style={codeStyle}>0.003%</code> hourly on Binance versus <code style={codeStyle}>-0.00511%</code> hourly
          on Drift is a funding-arb opportunity worth that spread every hour, for as long as it holds. The
          mechanics differ, but the engineering problem is the same: move capital between two venues fast
          enough that the spread doesn&apos;t close while you&apos;re mid-trade.
        </p>

        <SectionLabel>Why They Call It &quot;Dark&quot;</SectionLabel>
        <p style={bodyStyle}>
          Most MEV leaves a complete fingerprint on the blockchain. Sandwich attacks, JIT liquidity, on-chain
          DEX-to-DEX arbitrage — it&apos;s all right there in the ledger. The bot&apos;s transaction is there.
          The pool it touched is there. The user it extracted from is there. You can write a Dune query, count
          the swaps, sum the profit, and rank the searchers — a searcher being the bot operator hunting for
          these gaps. Every step of the proof sits on a public ledger.
        </p>
        <p style={bodyStyle}>
          CEX-DEX arbitrage is different, because <strong style={strong}>one leg of the trade is off-chain.</strong> You can
          watch a searcher swap a million USDC for SOL on Uniswap or Orca. But the hedging short on Binance
          that actually locked in the profit? Invisible. It lives inside a private matching engine you
          can&apos;t subpoena. The chain only ever shows you half the picture.
        </p>
        <p style={bodyStyle}>
          The 2025 paper by Sui414 et al., titled <em>Measuring CEX-DEX Extracted Value and Searcher Profitability:
          The Darkest of the MEV Dark Forest</em>, is the first serious attempt to reconstruct that hidden
          leg. The trick is to work backwards. You spot the on-chain leg of the arbitrage by its shape — atomic
          (the whole thing settles in one all-or-nothing transaction), large, and followed by no offsetting
          trade — then check the CEX price at the same block time to estimate the spread the searcher captured.
          Aggregate that over millions of trades and you finally have a number for the size of the market.
        </p>

        <SectionLabel>The Numbers</SectionLabel>
        <p style={bodyStyle}>
          Over the <strong style={strong}>August 2023 to March 2025</strong> window — 19 months — the
          researchers identified 7,203,560 CEX-DEX arbitrage trades and estimated $233.8 million in extracted
          value across them. That works out to about <strong style={strong}>$32 per trade</strong>. Sounds
          tiny, until you remember these trades are atomic and risk-free in the way arbitrage is supposed to
          be: by the time the on-chain leg confirms, the CEX leg is already done.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={trStyle}>
                <th style={thStyle}>Metric</th>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Period studied</td>
                <td style={tdStyle}>Aug 2023 – Mar 2025</td>
                <td style={tdStyle}>19 months</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Trades identified</td>
                <td style={tdStyle}>7,203,560</td>
                <td style={tdStyle}>On-chain leg only</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Extracted value</td>
                <td style={tdStyle}>$233.8M</td>
                <td style={tdStyle}>Estimated from spread × size</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Average per trade</td>
                <td style={tdStyle}>$32</td>
                <td style={tdStyle}>Risk-bounded</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Identified searchers</td>
                <td style={tdStyle}>19</td>
                <td style={tdStyle}>Top 3 captured 75% of volume and value</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Source: Sui414 et al., arxiv 2507.13023v2 (2025).
          </p>
        </div>

        <p style={bodyStyle}>
          The most interesting finding is how concentrated it all is. Three searchers controlled three quarters
          of the extracted value over the entire study period. CEX-DEX isn&apos;t a long-tail competitive market
          like DEX-to-DEX arbitrage — it&apos;s an oligopoly. And the barriers to entry aren&apos;t technical;
          the code is straightforward. They&apos;re operational. You need real-time, low-latency feeds from
          multiple CEXes, inventory parked on both sides, a settlement loop that nets out your exposures
          continuously, and enough volume on each venue that your own trades don&apos;t tip off the market. A
          solo searcher has none of that.
        </p>

        <SectionLabel>The Dashboard</SectionLabel>
        <p style={bodyStyle}>
          The paper&apos;s authors open-sourced the Dune queries that drive the analysis, so you can fork them
          and watch the market live. Two of them are worth knowing by name.
        </p>

        <div style={{ margin: '32px 0 40px' }}>
          <div style={{
            padding: '24px 28px',
            border: '1px solid rgba(0,255,234,0.2)',
            background: 'rgba(0,255,234,0.03)',
            borderRadius: 4,
            marginBottom: 16,
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.4em', color: '#00ffea', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Public dashboard
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 6px', fontWeight: 600 }}>
              CEX-DEX Arbitrage — full coverage view
            </p>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              The full dashboard that accompanies the arxiv paper. Volume, value, leaderboard, pool
              breakdown, and per-searcher profitability across the entire 19-month window.
            </p>
          </div>

          <div style={{
            padding: '24px 28px',
            border: '1px solid rgba(0,255,234,0.2)',
            background: 'rgba(0,255,234,0.03)',
            borderRadius: 4,
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.4em', color: '#00ffea', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Single query
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 6px', fontWeight: 600 }}>
              Arbitrage profit per block, DEX ↔ CEX
            </p>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              Forkable single query. The atomic building block — block-by-block view of how much
              CEX-DEX profit is being captured, by who, on which pool.
            </p>
          </div>
        </div>

        <p style={bodyStyle}>
          The clever trick in the methodology is the <em>markout</em> — checking the CEX price at a few moments
          after a trade to see what the searcher could have captured. Because the CEX leg is invisible, you can
          never know exactly when the searcher hedged. So the queries don&apos;t even try. They check the CEX
          price <strong style={strong}> at the block time</strong>, then again at a few offsets after (1 second,
          5 seconds, 30 seconds), and assume the searcher captured something close to the average. For any
          single trade the estimate is noisy, but it converges fast once you aggregate across millions of them.
        </p>

        <p style={bodyStyle}>
          There&apos;s also a Python script for pulling the same dataset through the Dune API, published right
          alongside the queries. So you don&apos;t even need a Dune subscription to reproduce the headline
          numbers — grab the raw CSV and run your own analysis offline.
        </p>

        <SectionLabel>Why Solana Changes the DEX Leg</SectionLabel>
        <p style={bodyStyle}>
          Almost all the public research on CEX-DEX arbitrage uses Ethereum data. There the DEX leg is Uniswap
          V3 or Curve (leading Ethereum DEXs), and the on-chain economics are dominated by Ethereum&apos;s 12-second blocks and high gas
          fees — gas being the per-transaction fee you pay to get your trade included. Solana flips both of
          those inputs.
        </p>
        <p style={bodyStyle}>
          A Solana block lands every 400 milliseconds, not every 12 seconds. The base fee on a swap is
          5,000 lamports per signature, not $5. So a bot can attempt twenty times as many CEX-DEX trades per
          minute, at a tiny fraction of the cost per attempt. That changes which opportunities are even worth chasing: spreads that would never
          clear gas on Ethereum clear easily on Solana. It&apos;s part of why Solana&apos;s DEX prices have
          tracked CEX prices so tightly in 2025 despite a 90% drop in DEX volume since 2024 — the arbitrage
          pressure is doing more work per unit of liquidity.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={trStyle}>
                <th style={thStyle}></th>
                <th style={thStyle}>Ethereum</th>
                <th style={thStyle}>Solana</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Block time</td>
                <td style={tdStyle}>12 s</td>
                <td style={tdStyle}>400 ms</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Min fee per swap</td>
                <td style={tdStyle}>$1 – $10 typical</td>
                <td style={tdStyle}>5,000 lamports / signature base</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Atomicity model</td>
                <td style={tdStyle}>Bundle via Flashbots / MEV-Boost (transaction-ordering / bundle services)</td>
                <td style={tdStyle}>Bundle via Jito / Samba; flash loans within one tx</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Read-the-mempool latency</td>
                <td style={tdStyle}>Public mempool, hundreds of ms</td>
                <td style={tdStyle}>No public mempool; ShredStream / Jito relay, sub-100 ms</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Min profitable spread</td>
                <td style={tdStyle}>$30 to clear gas + bid</td>
                <td style={tdStyle}>$0.50 with priority fee</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Ranges illustrative, based on Helius MEV Report and public protocol fee schedules.
          </p>
        </div>

        <p style={bodyStyle}>
          The atomicity model is the part that matters most. On Ethereum, the DEX leg can be a multi-step
          transaction bundle. On Solana, you get the same effect with a
          <strong style={strong}> flash loan inside a single transaction</strong> — an uncollateralized loan
          that has to be borrowed and repaid in the same transaction or the whole thing unwinds. Borrow a
          million USDC, do the swap, hedge the CEX leg out of band, repay the loan, all inside the 400ms slot.
          If the spread closes mid-flight, the transaction just reverts and the only thing you&apos;re out is
          the priority fee. That asymmetry is what makes Solana&apos;s DEX leg attractive for high-frequency
          CEX-DEX strategies even when the spread is small.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>WHAT IS NOT IN PUBLIC DATA</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            The arxiv paper&apos;s 7.2M trades are mostly Ethereum activity, because that&apos;s where the DEX
            leg is easiest to read. The equivalent Solana number is much harder to pin down publicly. Solana
            has no public mempool — no shared waiting room of pending transactions to watch — the on-chain leg
            can be deeply tangled up with non-arbitrage activity in the same transaction, and the relevant Dune
            tables are still maturing. So treat any public Solana CEX-DEX size estimate with the same skepticism
            the paper applies to its own Ethereum estimates.
          </p>
        </div>

        <SectionLabel>The Builder&apos;s Map</SectionLabel>
        <p style={bodyStyle}>
          Two pieces of work are worth reading if you want to build instead of just measure.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, margin: '32px 0 40px' }}>
          <div style={{
            padding: '20px 22px',
            border: '1px solid rgba(0,255,234,0.15)',
            background: 'rgba(0,255,234,0.02)',
            borderRadius: 4,
            height: '100%',
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em', color: '#00ffea', margin: '0 0 8px' }}>CEX-DEX ARB RESEARCH</p>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              An open-source research template (real-time CEX and DEX feeds, spread detection, hookable
              execution layer) circulating in the MEV builder community. The starting point most builders use.
            </p>
          </div>

          <div style={{
            padding: '20px 22px',
            border: '1px solid rgba(0,255,234,0.15)',
            background: 'rgba(0,255,234,0.02)',
            borderRadius: 4,
            height: '100%',
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em', color: '#00ffea', margin: '0 0 8px' }}>WHACK-A-MOLE WRITEUP</p>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              A public long-form writeup walking through the first version of such a bot. Useful as
              a pedagogical walk-through — what works, what doesn&apos;t, and which assumptions about
              latency turn out to be wrong in production.
            </p>
          </div>
        </div>

        <p style={bodyStyle}>
          Neither of these will make you competitive with the top three searchers in the paper. They&apos;re
          starting points for understanding the shape of the problem, not a production stack. The real edge
          lives in the things that cost money: colocated CEX connections (your servers sitting physically next
          to the exchange&apos;s), sub-millisecond market data feeds, real-time inventory netting, and —
          increasingly on Solana — a relationship with a stake-weighted relay so your DEX-leg transactions
          don&apos;t sit behind everyone else&apos;s public traffic.
        </p>

        <SectionLabel>Where to Read the Spread on Solana</SectionLabel>
        <p style={bodyStyle}>
          If you want to watch the same kind of trade happen on Solana rather than Ethereum, start at the layer
          below the DEX swap — the mempool-equivalent. Solana doesn&apos;t have a public mempool the way
          Ethereum does, but it does have <strong style={strong}>ShredStream</strong> and the
          <strong style={strong}> Jito relay</strong>, both of which expose in-flight transactions to subscribers
          before they land in a block. A CEX-DEX searcher on Solana is reading from one of these (or both),
          comparing the implied DEX-leg price against a live CEX quote, and firing off the arbitrage
          transaction with a priority fee tuned to land in the next slot.
        </p>
        <p style={bodyStyle}>
          The companion piece <Link href="/blog/wire" style={inlineLink}>The Wire — How Solana Actually Moves Bytes</Link>
          covers ShredStream, the leader schedule, and commitment levels in detail; the
          <Link href="/blog/wire-speed" style={inlineLink}> Wire Speed</Link> piece covers the validator
          architecture that makes Solana&apos;s tight slot timing possible in the first place. CEX-DEX arb is
          the trade that pays for that infrastructure.
        </p>

        <SectionLabel>The Mental Model</SectionLabel>
        <blockquote style={blockquoteStyle}>
          A CEX-DEX arbitrage is a single trade with two execution clocks: a 1-millisecond clock for the CEX
          leg, and a 400-millisecond (or 12-second) clock for the DEX leg. The job is to keep both clocks
          synchronised long enough to extract the gap, then unwind without leaving inventory on either side.
        </blockquote>
        <p style={bodyStyle}>
          Every engineering choice in this game comes back to that one tension. Why pay for co-location?
          Because it shrinks the CEX clock toward zero. Why is Solana&apos;s 400ms slot attractive? Because it
          shrinks the DEX clock toward the CEX clock. Why are flash loans useful? Because they let the DEX leg
          behave atomically — collapse if either side fails — which removes the asymmetric risk of being left
          holding the bag on a half-completed trade.
        </p>
        <p style={bodyStyle}>
          CEX-DEX is &quot;the darkest of the dark forest&quot; not because it&apos;s hidden by design, but because half
          of the relevant data lives on a private matching engine nobody can access. The Dune queries above
          aren&apos;t measuring the trade directly — they&apos;re measuring its on-chain shadow. That shadow is
          enough to estimate $233.8M of extracted value over 19 months, reveal the oligopoly structure of the
          searcher market, and watch the spreads open and close block by block. It is not enough to copy what
          the top three searchers are doing, because the code path that matters is the one you can&apos;t see.
        </p>

        <SectionLabel>References</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <ol style={{ paddingLeft: 28, margin: 0 }}>
            {[
              { label: 'Sui414, William, soispoke, malleshpai — Measuring CEX-DEX Extracted Value and Searcher Profitability (arxiv 2507.13023v2)', href: 'https://arxiv.org/html/2507.13023v2' },
              { label: 'CEX-DEX Arbitrage 💰 — main Dune dashboard for the paper', href: 'https://dune.com/rig_ef/cex-dex-dash' },
              { label: 'Arbitrage profit per block, DEX ↔ CEX — forkable Dune query', href: 'https://dune.com/queries/3999754' },
              { label: 'Dune — official X thread summarising the dataset', href: 'https://x.com/Dune/status/1948370502445420915' },
              { label: 'Drift Learn — How To Arbitrage between CEXs & DEXs (price arb vs funding rate arb)', href: 'https://www.drift.trade/learn/how-to-arbitrage-between-cexs-dexs' },
              { label: 'Helius — Solana MEV Report', href: 'https://www.helius.dev/blog/solana-mev-report' },
              { label: 'Analysis of CEX-DEX Arbitrage Opportunities with Hidden Markov Models — ACM Web Conference 2026', href: 'https://dl.acm.org/doi/10.1145/3774904.3792185' },
              { label: 'DexAnalytics TLDR — Analysis of CEX/DEX Arbitrage', href: 'https://dexanalytics.org/research/tldr/analysis-of-cex-dex-arbitrage' },
              { label: 'Solid Quant — Whack-A-Mole: how I built my first MEV arbitrage bot', href: 'https://medium.com/@solidquant/how-i-built-my-first-mev-arbitrage-bot-introducing-whack-a-mole-66d91657152e' },
              { label: 'Solid Quant — cex-dex-arb-research (GitHub template)', href: 'https://github.com/solidquant/cex-dex-arb-research' },
              { label: 'crypto.news — Solana DEXs match CEX pricing as on-chain liquidity evolves', href: 'https://crypto.news/solana-dexs-match-cex-pricing-as-on-chain-liquidity-structure-evolves/' },
              { label: 'The Wire — How Solana Actually Moves Bytes (companion piece)', href: '/blog/wire' },
              { label: 'Solana at Wire Speed — validator architecture (companion piece)', href: '/blog/wire-speed' },
              { label: 'The RPC Layer That Cut the Cord — RPC provider landscape (companion piece)', href: '/blog/rpc' },
            ].map((ref, i) => (
              <li key={i} style={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.35)',
                lineHeight: 1.7,
                marginBottom: 6,
              }}>
                <a
                  href={ref.href}
                  target={ref.href.startsWith('http') ? '_blank' : undefined}
                  rel={ref.href.startsWith('http') ? 'noopener noreferrer' : undefined}
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

        <div style={{ marginTop: 56 }}>
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
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};

const strong: React.CSSProperties = {
  color: 'rgba(255,255,255,0.95)',
  fontWeight: 600,
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.85em',
  background: 'rgba(0,255,234,0.08)',
  padding: '1px 6px',
  border: '1px solid rgba(0,255,234,0.18)',
  borderRadius: 2,
  color: 'rgba(0,255,234,0.9)',
};

const inlineLink: React.CSSProperties = {
  color: 'rgba(0,255,234,0.85)',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(0,255,234,0.3)',
  textUnderlineOffset: '3px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
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
  verticalAlign: 'top',
};

const tdLabelStyle: React.CSSProperties = {
  ...tdStyle,
  color: 'rgba(255,255,255,0.45)',
  fontWeight: 500,
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const blockquoteStyle: React.CSSProperties = {
  margin: '48px 0',
  padding: '28px 32px',
  background: 'rgba(0,255,234,0.04)',
  borderLeft: '3px solid #00ffea',
  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
  fontWeight: 600,
  letterSpacing: '0.05em',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.9)',
};

const calloutAccent: React.CSSProperties = {
  margin: '32px 0',
  padding: '22px 26px',
  background: 'rgba(0,255,234,0.04)',
  border: '1px solid rgba(0,255,234,0.18)',
};

const calloutTitle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.55rem',
  letterSpacing: '0.4em',
  color: 'rgba(0,255,234,0.8)',
  textTransform: 'uppercase',
  margin: '0 0 14px',
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
