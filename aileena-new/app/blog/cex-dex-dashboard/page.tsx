'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function CexDexDashboardArticle() {
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
        padding: '20px 32px 20px 128px',
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
            DATA
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.05.21
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            Dune · SQL · CEX-DEX · Solana
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
          The Darkest<br /><span style={{ color: '#00ffea' }}>Dashboard</span>
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
          The companion piece to <Link href="/blog/cex-dex-arb" style={inlineLink}>The Darkest Trade</Link>{' '}—
          the SQL side. Public dashboards give you the headline number; this is how you build one that answers your
          own question. Block-level profit queries, markout methodology, searcher clustering, the Solana variant,
          and what no query on earth can show you about the off-chain leg.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — Why Build Your Own</SectionLabel>
        <p style={bodyStyle}>
          The <a href="https://dune.com/rig_ef/cex-dex-dash" target="_blank" rel="noopener noreferrer" style={inlineLink}>rig_ef CEX-DEX dashboard</a> on
          Dune is excellent. It gives you the headline numbers — $233.8M extracted, 7.2M trades, the top-three
          oligopoly — for the full 19-month window the paper studied. What it does not give you is the question
          you actually want answered: was last week different? Which pool is bleeding into Binance the most right
          now? Are the searchers I think I see on Solana the same names that show up on Ethereum?
        </p>
        <p style={bodyStyle}>
          Forking the public queries and writing your own is the only way to ask those questions, and Dune
          published the entire methodology open-source for exactly this reason. The four queries below are the
          minimum viable dashboard. Everything else — leaderboards, time-series, pool breakdowns — is a join
          on top of these four.
        </p>

        <SectionLabel>02 — Query 1: The Atomic Block-Level Profit</SectionLabel>
        <p style={bodyStyle}>
          This is the building block. For every block in a window, identify the DEX trades large enough to be a
          plausible arbitrage leg, then estimate the spread they captured against the CEX reference price at the
          block&apos;s timestamp. Sum per block, group by searcher.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`-- Block-level CEX-DEX profit, Ethereum DEXes vs Binance ref
WITH dex_legs AS (
  SELECT
    t.block_number,
    t.block_time,
    t.tx_hash,
    t.tx_from               AS searcher,
    t.project,
    t.token_bought_address  AS bought,
    t.token_sold_address    AS sold,
    t.token_bought_amount,
    t.token_sold_amount,
    t.amount_usd
  FROM dex.trades t
  WHERE t.blockchain = 'ethereum'
    AND t.block_time >= NOW() - INTERVAL '7' DAY
    AND t.amount_usd > 50000        -- size filter: real arb, not retail
    AND t.project IN ('uniswap','curve','balancer')
),
cex_ref AS (
  SELECT
    p.minute,
    p.contract_address,
    p.price
  FROM prices.usd p
  WHERE p.blockchain = 'ethereum'
    AND p.minute >= NOW() - INTERVAL '7' DAY
),
spread AS (
  SELECT
    d.block_number,
    d.block_time,
    d.searcher,
    d.tx_hash,
    d.amount_usd,
    -- DEX execution price (out / in)
    (d.token_bought_amount / NULLIF(d.token_sold_amount, 0)) AS dex_px,
    -- CEX reference at block minute
    (cb.price / NULLIF(cs.price, 0))                          AS cex_px,
    d.token_bought_amount,
    cb.price AS bought_usd,
    cs.price AS sold_usd
  FROM dex_legs d
  LEFT JOIN cex_ref cb
    ON cb.contract_address = d.bought
   AND cb.minute = DATE_TRUNC('minute', d.block_time)
  LEFT JOIN cex_ref cs
    ON cs.contract_address = d.sold
   AND cs.minute = DATE_TRUNC('minute', d.block_time)
)
SELECT
  block_number,
  block_time,
  searcher,
  amount_usd,
  -- estimated extracted value: how far DEX price was from CEX mid
  ((dex_px - cex_px) / NULLIF(cex_px, 0)) * amount_usd AS est_profit_usd
FROM spread
WHERE cex_px IS NOT NULL
ORDER BY block_number DESC;`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Tables: <code style={codeStyle}>dex.trades</code>, <code style={codeStyle}>prices.usd</code> (canonical Dune)
          </p>
        </div>

        <p style={bodyStyle}>
          Two structural choices matter here. First, the <strong style={strong}>$50,000 minimum</strong> on
          <code style={codeStyle}>amount_usd</code> filters out retail noise — a real CEX-DEX arb leg is rarely
          under five figures because the CEX-side hedge has a non-trivial minimum to be worth the operational
          overhead. Second, joining <code style={codeStyle}>prices.usd</code> at
          <code style={codeStyle}>DATE_TRUNC(&apos;minute&apos;, block_time)</code> gives you a CEX-side reference
          that updates roughly once per minute — coarser than Binance ticks but representative of where the
          searcher could have hedged in the same window.
        </p>

        <SectionLabel>03 — Query 2: The Markout</SectionLabel>
        <p style={bodyStyle}>
          The single biggest methodological wrinkle in the paper. The CEX leg is invisible, so you cannot ask
          &quot;when exactly did the searcher hedge?&quot;. Instead you check the CEX price at the block time and at
          several offsets afterward, and report the spread captured at each one. The reader gets to choose
          which markout horizon they believe the searcher uses.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`-- Markout panel: capture rate at +0s, +5s, +30s, +1min
WITH base AS (
  SELECT block_number, block_time, tx_hash, tx_from AS searcher,
         token_bought_address AS bought, amount_usd,
         token_bought_amount / NULLIF(token_sold_amount, 0) AS dex_px
  FROM dex.trades
  WHERE blockchain = 'ethereum'
    AND block_time >= NOW() - INTERVAL '7' DAY
    AND amount_usd > 50000
),
markouts AS (
  SELECT
    b.tx_hash,
    b.searcher,
    b.amount_usd,
    b.dex_px,
    p0.price  AS cex_t0,
    p5.price  AS cex_t5,
    p30.price AS cex_t30,
    p60.price AS cex_t60
  FROM base b
  LEFT JOIN prices.usd p0
    ON p0.contract_address = b.bought
   AND p0.minute = DATE_TRUNC('minute', b.block_time)
  LEFT JOIN prices.usd p5
    ON p5.contract_address = b.bought
   AND p5.minute = DATE_TRUNC('minute', b.block_time + INTERVAL '5' SECOND)
  LEFT JOIN prices.usd p30
    ON p30.contract_address = b.bought
   AND p30.minute = DATE_TRUNC('minute', b.block_time + INTERVAL '30' SECOND)
  LEFT JOIN prices.usd p60
    ON p60.contract_address = b.bought
   AND p60.minute = DATE_TRUNC('minute', b.block_time + INTERVAL '60' SECOND)
)
SELECT
  searcher,
  COUNT(*)                                                       AS trades,
  SUM(amount_usd)                                                AS notional_usd,
  SUM(((dex_px - cex_t0)  / NULLIF(cex_t0, 0))  * amount_usd)   AS extracted_t0,
  SUM(((dex_px - cex_t5)  / NULLIF(cex_t5, 0))  * amount_usd)   AS extracted_t5,
  SUM(((dex_px - cex_t30) / NULLIF(cex_t30, 0)) * amount_usd)   AS extracted_t30,
  SUM(((dex_px - cex_t60) / NULLIF(cex_t60, 0)) * amount_usd)   AS extracted_t60
FROM markouts
GROUP BY searcher
ORDER BY extracted_t30 DESC;`}
          </pre>
        </div>

        <p style={bodyStyle}>
          What you do with this in the dashboard: render a 4-bar chart per searcher, one bar per horizon. A
          consistent profit across <code style={codeStyle}>t0</code> through <code style={codeStyle}>t60</code> is
          the signature of a real arbitrageur capturing a structural spread. A profit at <code style={codeStyle}>t0</code> that
          decays to zero by <code style={codeStyle}>t30</code> is the signature of toxic flow being absorbed by
          the market — money the searcher would have lost if they had hedged five seconds late.
        </p>

        <SectionLabel>04 — Query 3: Searcher Clustering</SectionLabel>
        <p style={bodyStyle}>
          The paper&apos;s headline result is that three searchers captured 75% of the extracted value. The only
          way to make that claim with public data is to cluster wallet addresses into searcher identities. The
          heuristic is simple: a CEX-DEX searcher has a tight set of behaviours — large size, only a few specific
          token pairs, repeated tx structure, identifiable contract counterparts. You group by those signatures.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`-- Heuristic searcher buckets, last 30 days
WITH activity AS (
  SELECT
    tx_from AS wallet,
    COUNT(*)                       AS n_trades,
    SUM(amount_usd)                AS notional_usd,
    AVG(amount_usd)                AS avg_size,
    COUNT(DISTINCT project)        AS n_dexes,
    COUNT(DISTINCT
      CONCAT(token_bought_symbol, '-', token_sold_symbol)
    )                              AS n_pairs,
    MIN(block_time)                AS first_seen,
    MAX(block_time)                AS last_seen
  FROM dex.trades
  WHERE blockchain = 'ethereum'
    AND block_time >= NOW() - INTERVAL '30' DAY
    AND amount_usd > 50000
  GROUP BY tx_from
)
SELECT
  wallet,
  n_trades,
  notional_usd,
  avg_size,
  n_dexes,
  n_pairs,
  -- behavioural class
  CASE
    WHEN n_trades > 500
     AND avg_size > 100000
     AND n_pairs < 8
    THEN 'high-frequency CEX-DEX'
    WHEN n_trades BETWEEN 50 AND 500
     AND n_pairs < 12
    THEN 'mid-frequency arb'
    ELSE 'retail / one-off'
  END AS bucket,
  first_seen,
  last_seen
FROM activity
ORDER BY notional_usd DESC
LIMIT 100;`}
          </pre>
        </div>

        <p style={bodyStyle}>
          This is intentionally crude. The paper uses a much richer set of signals — contract bytecode similarity,
          consistent gas-price tipping behaviour, repeated builder relationships. The query above gets you to
          maybe 80% of the population with one screenful of SQL, which is enough to fork from and refine.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>NAMING THE WALLET</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            Dune ships a <code style={codeStyle}>labels.all</code> table that maps raw addresses to human-readable
            names contributed by the community. Joining on it turns &quot;0x4838b1...&quot; into &quot;Wintermute&quot; or
            &quot;SCP&quot;. The paper&apos;s leaderboard uses this directly; your fork should too, otherwise the
            output is wallets, not searchers.
          </p>
        </div>

        <SectionLabel>05 — Query 4: The Solana Variant</SectionLabel>
        <p style={bodyStyle}>
          The Ethereum version of this dashboard is the well-trodden path. The Solana version is harder, mostly
          because the on-chain leg is more entangled with non-arbitrage activity in the same transaction. A
          Jupiter swap looks like a stack of pool interactions; isolating the arbitrage component requires
          tracing the program calls, not just reading the top-level trade.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`-- Solana DEX legs, large size, last 24h
WITH sol_dex AS (
  SELECT
    t.block_slot,
    t.block_time,
    t.tx_id,
    t.trader_id              AS searcher,
    t.project,
    t.token_bought_mint_address  AS bought,
    t.token_sold_mint_address    AS sold,
    t.token_bought_amount,
    t.token_sold_amount,
    t.amount_usd
  FROM dex_solana.trades t
  WHERE t.block_time >= NOW() - INTERVAL '24' HOUR
    AND t.amount_usd > 10000      -- Solana threshold lower; fees are cheap
    AND t.project IN ('jupiter','orca','raydium','phoenix','meteora')
)
SELECT
  searcher,
  COUNT(*)                            AS trades,
  SUM(amount_usd)                     AS notional_usd,
  AVG(amount_usd)                     AS avg_size,
  COUNT(DISTINCT project)             AS n_dexes
FROM sol_dex
GROUP BY searcher
ORDER BY notional_usd DESC
LIMIT 50;`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Tables: <code style={codeStyle}>dex_solana.trades</code> — Dune&apos;s Solana DEX aggregate.
          </p>
        </div>

        <p style={bodyStyle}>
          Two things change vs the Ethereum query. The size threshold drops from $50,000 to $10,000 because
          Solana&apos;s fee floor is three orders of magnitude lower — a $5,000 arb that would lose to gas on
          Ethereum is comfortably profitable on Solana. And the markout window has to shrink: with 400ms slots,
          a 30-second markout is 75 slots of decay, which is more than enough for any temporary spread to be
          fully consumed by competing flow.
        </p>
        <p style={bodyStyle}>
          What this query cannot give you on Solana — and the Ethereum equivalents can — is the mempool view.
          Solana has no public mempool. Searcher behaviour pre-block is hidden behind <strong style={strong}>ShredStream</strong> and the
          <strong style={strong}> Jito relay</strong>, which are private feeds. A complete Solana CEX-DEX dashboard would
          require integrating a third-party data source on top of Dune. See <Link href="/blog/wire" style={inlineLink}>The Wire</Link> for
          how those feeds work.
        </p>

        <SectionLabel>06 — Funding-Rate Variant</SectionLabel>
        <p style={bodyStyle}>
          The price-arb queries above don&apos;t cover the second flavour of CEX-DEX arb: funding rate
          arbitrage on perpetuals. That one needs different tables. The good news is Dune has them — Drift,
          dYdX, Hyperliquid all publish funding rates and open interest to community queries. The shape of
          the query is the same: pull DEX funding rate, pull CEX funding rate from a reference feed, take the
          spread, multiply by OI.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`-- Funding spread, DEX perp vs CEX perp reference (illustrative)
SELECT
  d.hour,
  d.market                     AS dex_market,
  d.funding_rate_hourly        AS dex_funding,
  c.funding_rate_hourly        AS cex_funding,
  (d.funding_rate_hourly - c.funding_rate_hourly) AS spread,
  d.open_interest_usd          AS dex_oi,
  -- captureable per hour, assumes carry trade size = dex_oi cap
  (d.funding_rate_hourly - c.funding_rate_hourly) * d.open_interest_usd
                               AS hourly_extractable_usd
FROM perp_dex.funding_hourly d
JOIN perp_cex.funding_hourly c
  ON d.symbol = c.symbol
 AND d.hour   = c.hour
WHERE d.hour >= NOW() - INTERVAL '7' DAY
  AND ABS(d.funding_rate_hourly - c.funding_rate_hourly) > 0.0001
ORDER BY ABS(spread) DESC
LIMIT 200;`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Table names <code style={codeStyle}>perp_dex.funding_hourly</code> / <code style={codeStyle}>perp_cex.funding_hourly</code> are
            illustrative — replace with the specific protocol&apos;s tables (e.g. <code style={codeStyle}>drift.funding_payments</code>).
          </p>
        </div>

        <p style={bodyStyle}>
          The interesting reading of this query is the <em>distribution of the spread</em>. A small spread that
          persists for hours is a stable carry; a large spread that closes within minutes is the signature of
          someone aggressively arbitraging it away. The headline of the funding-arb world is that the easy
          spreads close fast, and the persistent ones are persistent for a reason — usually because one venue
          has a structural inventory imbalance no single trader can fully offset.
        </p>

        <SectionLabel>07 — Putting It Together</SectionLabel>
        <p style={bodyStyle}>
          A working dashboard is the four queries above arranged into six panels:
        </p>

        <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '32px 0 48px' }}>
          {[
            ['1', 'Block-level profit time series', 'Query 1 grouped by hour. Y-axis: extracted USD. Shows the rhythm of the market and the obvious spikes during volatility events.'],
            ['2', 'Searcher leaderboard', 'Query 3 joined with labels.all. Top 20 wallets by 30-day notional, with bucket and behaviour class.'],
            ['3', 'Markout heatmap', 'Query 2 rendered as a 4-column table per searcher: t0, t5, t30, t60. Green if consistent, red if decay.'],
            ['4', 'Pool / venue breakdown', 'Group Query 1 by project. Which AMMs leak the most into CEX hedges.'],
            ['5', 'Solana panel', 'Query 4 in its own section, with a caveat about ShredStream coverage gaps.'],
            ['6', 'Funding panel', 'Query 5 — spread distribution histogram + current top-10 spreads.'],
          ].map(([num, title, body]) => (
            <li key={num} style={{
              display: 'flex',
              gap: 20,
              padding: '16px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#00ffea', minWidth: 32 }}>{num}</span>
              <div>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', margin: '0 0 6px', textTransform: 'uppercase', fontWeight: 600 }}>{title}</p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p style={bodyStyle}>
          The dashboard is opinionated by design. Panel 3 — the markout heatmap — is the panel that will
          actually let you tell apart the searchers extracting structural alpha from the ones holding the bag
          on toxic flow. Everything else is bookkeeping. Build that one first, even if you skip the rest.
        </p>

        <SectionLabel>08 — The Limit</SectionLabel>
        <blockquote style={blockquoteStyle}>
          Every number in this dashboard is the on-chain shadow of a two-legged trade. The shadow is enough to
          rank the searchers and watch the market move; it is never enough to know exactly what they made.
        </blockquote>
        <p style={bodyStyle}>
          The CEX leg lives inside a private matching engine that no public dataset will ever index. You can
          improve the precision of the estimate — finer-grained reference prices, better searcher clustering,
          more horizons in the markout — but the floor of the error bar is set by the fact that you are
          inferring the hedge, not observing it. The paper&apos;s authors are explicit about this: their headline
          $233.8M is their best estimate, not a measurement.
        </p>
        <p style={bodyStyle}>
          That is also why the dashboard is useful to <em>build</em> rather than just to consume. The act of
          writing the queries forces you to confront which assumptions you are making about how the searcher
          hedges. The default markout (30 seconds, minute-truncated prices) implies one model of execution.
          Tighter markouts imply colocated infrastructure; longer ones imply inventory carry. Each variant
          you fork is a different hypothesis about what the trade actually looks like behind the scenes.
        </p>

        <SectionLabel>References</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <ol style={{ paddingLeft: 28, margin: 0 }}>
            {[
              { label: 'The Darkest Trade — the mechanism this dashboard is built on (companion piece)', href: '/blog/cex-dex-arb' },
              { label: 'Sui414, William, soispoke, malleshpai — Measuring CEX-DEX Extracted Value (arxiv 2507.13023v2)', href: 'https://arxiv.org/html/2507.13023v2' },
              { label: 'CEX-DEX Arbitrage 💰 — public Dune dashboard the paper ships with', href: 'https://dune.com/rig_ef/cex-dex-dash' },
              { label: 'Arbitrage profit per block, DEX ↔ CEX — forkable single query (3999754)', href: 'https://dune.com/queries/3999754' },
              { label: 'Dune docs — dex.trades canonical schema', href: 'https://docs.dune.com/data-catalog/curated/evm/DEX/dex-trades' },
              { label: 'Dune docs — prices.usd schema', href: 'https://docs.dune.com/data-catalog/community/prices-usd' },
              { label: 'Dune docs — labels.all (community-contributed wallet names)', href: 'https://docs.dune.com/data-catalog/community/labels' },
              { label: 'Dune docs — Solana tables (dex_solana.trades and friends)', href: 'https://docs.dune.com/data-catalog/curated/solana/overview' },
              { label: 'Drift Learn — How To Arbitrage between CEXs & DEXs (funding rate framework)', href: 'https://www.drift.trade/learn/how-to-arbitrage-between-cexs-dexs' },
              { label: 'Helius — Solana MEV Report (mempool / ShredStream context)', href: 'https://www.helius.dev/blog/solana-mev-report' },
              { label: 'The Wire — How Solana Actually Moves Bytes (ShredStream + Jito relay)', href: '/blog/wire' },
              { label: 'Solana at Wire Speed — validator architecture (companion piece)', href: '/blog/wire-speed' },
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
    </div>
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

const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.78rem',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.75)',
  background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px',
  overflowX: 'auto',
  letterSpacing: '0.01em',
  margin: 0,
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
