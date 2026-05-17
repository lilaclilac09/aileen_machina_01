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
          The real engineering problem starts after that — in the intersection of matching architecture, aggregator routing, and MEV economics.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — Why It Was Impossible Before</SectionLabel>
        <p style={bodyStyle}>
          The idea behind an on-chain order book is simple: put the exchange&apos;s buy/sell list on a blockchain. Anyone can place orders, match, and settle. No intermediary, no counterparty risk.
        </p>
        <p style={bodyStyle}>
          The problem is that blockchains enforce a rule: only one writer per account at a time. The order book is one account. When you, me, and everyone else submit orders simultaneously, they queue up. Low volume is fine. High volume locks everything.
        </p>
        <p style={bodyStyle}>
          Ethereum tried. It failed. Every quote update costs gas. Frequent updates bleed money. The industry compromised: quotes off-chain, only settlement on-chain. Not a real on-chain order book.
        </p>
        <p style={bodyStyle}>
          Solana is different. A new block every 400 milliseconds. Near-zero fees. Fast enough, cheap enough. On-chain order books became possible for the first time.
        </p>

        <SectionLabel>02 — Phoenix: The First Proof</SectionLabel>
        <p style={bodyStyle}>
          Serum, Solana&apos;s first-generation order book, had a design where orders entered a queue and a separate &quot;crank&quot; program periodically processed the queue, matched orders, and updated the ledger. The crank had to run off-chain continuously — an external dependency.
        </p>
        <p style={bodyStyle}>
          Phoenix eliminated the crank entirely. It packs the matching logic directly into the order transaction itself. One transaction goes out, and it simultaneously checks the book, finds a counterparty, matches, and updates balances. One step. No waiting, no external program.
        </p>
        <p style={bodyStyle}>
          Sounds simple. Engineering-wise, it&apos;s not. Solana imposes a compute limit per transaction. Fitting the full matching engine inside that limit requires extremely optimized code. Phoenix did it and proved the concept viable.
        </p>

        <SectionLabel>03 — Manifest: The More Aggressive Approach</SectionLabel>
        <p style={bodyStyle}>
          Manifest pushes further than Phoenix on several fronts.
        </p>
        <p style={bodyStyle}>
          Creating a new market on Phoenix costs 3+ SOL. On Manifest, less than a cent. Trading fees are permanently zero. Anyone can create a market for any token, permissionlessly, at near-zero cost.
        </p>
        <p style={bodyStyle}>
          But Manifest&apos;s core innovation is <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Global Orders</strong> — a mechanism that dramatically improves capital efficiency for market makers.
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
          The order book itself isn&apos;t the hard part. The hard part is getting the layer above and the layer below right at the same time.
        </blockquote>

        <SectionLabel>04 — Global Orders: On-Chain Cross Margin</SectionLabel>
        <p style={bodyStyle}>
          The standard approach (including Phoenix): to market-make on SOL/USDC, you lock funds into that market&apos;s account. Want to also make WIF/USDC? Lock another batch. Five markets, five separate pools of capital, all siloed.
        </p>
        <p style={bodyStyle}>
          Manifest&apos;s Global Orders: your funds stay in your own account. You place orders across ten markets simultaneously, and the money doesn&apos;t move until someone actually fills your order — JIT settlement (Just In Time).
        </p>
        <p style={bodyStyle}>
          The result: with $100K, Phoenix splits it into $20K across five markets. Manifest lets you quote $100K across ten markets simultaneously. Same capital, multiples more liquidity provided.
        </p>
        <p style={bodyStyle}>
          It&apos;s essentially <strong style={{ color: 'rgba(255,255,255,0.85)' }}>cross margin</strong> — all markets share one capital pool. Same logic as Binance&apos;s cross-margin mode for futures. The difference: Manifest has no leverage. You place limit orders, they fill or they don&apos;t. No liquidation risk.
        </p>

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
            You have $100K and place $50K buy orders across ten markets. Normally they won&apos;t all fill at once. No problem.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            But during extreme volatility, multiple markets can fill simultaneously. Manifest processes first-come-first-served: the first fill deducts funds, the second deducts, the third checks the balance — insufficient. It fails. Everything after fails.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            You don&apos;t lose money, but you thought you were providing liquidity across ten markets when only the first few were actually live. Market makers need to size their total exposure carefully — overcommitting means most orders are phantom at the moment they matter most.
          </p>
        </div>

        <SectionLabel>05 — Who Fills Your Orders: The Aggregator Layer</SectionLabel>
        <p style={bodyStyle}>
          0x is a veteran Ethereum protocol. In 2017 they tried on-chain order books too and failed. They pivoted to off-chain quotes with on-chain settlement. Now their Swap API supports Solana, automatically comparing prices across all venues — Phoenix, Manifest, Orca, Raydium — and routing trades to the cheapest one.
        </p>
        <p style={bodyStyle}>
          For market makers, aggregator integration means order flow. But aggregators are price-only. If your spread is 0.1% wider than the competition, trades go elsewhere.
        </p>
        <p style={bodyStyle}>
          The upside: aggregator flow is mostly retail, not high-frequency arbitrage bots. Retail traders don&apos;t watch your quotes and frontrun you. For market makers, that&apos;s higher-quality flow.
        </p>

        <SectionLabel>06 — The Cost of Being Frontrun: The Jito Layer</SectionLabel>
        <p style={bodyStyle}>
          The market maker&apos;s worst nightmare: you quote a price, a large order hits, you know it&apos;ll move the market, and you rush to cancel your stale quotes. But before you can, a bot has already picked off your old prices and resold at the new level. Your orders filled, but the price already moved past you. That&apos;s frontrunning.
        </p>
        <p style={bodyStyle}>
          Jito is Solana&apos;s infrastructure for handling this. It lets you bundle &quot;cancel + requote + fill&quot; into a single atomic operation — all succeed or all fail, with no gap for bots to exploit.
        </p>
        <p style={bodyStyle}>
          But Jito charges an auction fee, and you&apos;re bidding against others — the higher your bid, the higher your transaction priority. Market makers bake this cost into the spread. The bid-ask spread you see isn&apos;t just profit — part of it is insurance against being frontrun. The spread is both margin and protection.
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
            Writing the order book code is just the beginning.<br />
            <span style={{ color: '#00ffea' }}>
              Who fills your orders and whether you get frontrun — two entirely different problems, both deciding whether you survive.
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
