'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { useLanguage } from '../../../components/LanguageProvider';

export default function ClobArticle() {
  const { language } = useLanguage();
  const isDE = language === 'DE';

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
          {isDE ? 'Archiv' : 'Archive'}
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
          <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}>
            2026.05.17
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}>
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
          {isDE ? (
            <>Das Orderbuch,<br /><span style={{ color: '#00ffea' }}>das nicht bricht</span></>
          ) : (
            <>The Order Book<br /><span style={{ color: '#00ffea' }}>That Doesn't Break</span></>
          )}
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20,
        }}>
          {isDE
            ? 'On-Chain-Orderbücher galten als unmöglich. Solana bewies das Gegenteil. Aber das eigentliche Problem beginnt erst danach.'
            : 'On-chain order books were supposed to be impossible. Solana proved they weren\'t. The real problem starts after that.'}
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — {isDE ? 'Warum es vorher nicht ging' : 'Why it didn\'t work before'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Eine Blockchain hat eine Regel: Auf dasselbe Konto kann zur gleichen Zeit nur eine Person schreiben. Ein Orderbuch ist ein einziges Konto. Alle Orders, Stornierungen und Ausführungen müssen nacheinander. Bei wenig Traffic kein Problem. Bei viel Traffic: alles steckt fest.'
            : 'A blockchain has one hard rule: only one person can write to the same account at the same time. An order book is one account. Every order, cancel, and fill has to queue up. Low traffic — fine. High traffic — everything jams.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Auf Ethereum war das fatal. Jede Preisänderung kostet Gas. Professionelle Market Maker müssen Preise sekündlich aktualisieren — das war schlicht unbezahlbar. Die echte Lösung auf EVM war nie ein echtes On-Chain-Orderbuch: 0x Protocol baute 2017 das Kompromissmodell — Preise Off-Chain, nur Abschlüsse On-Chain. Hyperliquid zog auf eine eigene Chain um.'
            : 'On Ethereum this was fatal. Every price update costs gas. Professional market makers update quotes every second — completely unaffordable. The real EVM answer was never a true on-chain order book: 0x Protocol built the compromise in 2017 — quotes off-chain, only settlement on-chain. Hyperliquid moved to its own chain entirely.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Solana änderte die Rechnung. 400ms Blöcke, Sub-Cent-Gebühren. Zum ersten Mal war ein echtes On-Chain-Orderbuch wirtschaftlich machbar.'
            : 'Solana changed the math. 400ms blocks, sub-cent fees. For the first time, a real on-chain order book was economically viable.'}
        </p>

        <SectionLabel>02 — Phoenix: {isDE ? 'Der Beweis' : 'Proof it works'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Serum, das erste Solana-Orderbuch, brauchte einen "Crank" — ein externes Programm, das ständig lief und Ereignisse verarbeitete, Matches ausführte und Salden aktualisierte. Eine externe Abhängigkeit, die gepflegt werden musste.'
            : 'Serum, the first Solana order book, needed a "crank" — an external program that ran constantly, processing events, executing matches, updating balances. An external dependency that had to be maintained.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Phoenix eliminierte den Crank vollständig. Deine Order-Transaktion erledigt alles auf einmal: Orderbuch prüfen, Gegenpartei finden, matchen, Salden aktualisieren. Ein Schritt, eine Transaktion, keine externen Programme. Das klingt einfach, ist es technisch aber nicht — Solana hat ein Compute-Budget pro Transaktion, und die gesamte Match-Logik hineinzubekommen ohne dieses zu überschreiten, erfordert extrem optimierten Code.'
            : 'Phoenix eliminated the crank entirely. Your order transaction does everything at once: check the book, find a counterparty, match, update balances. One step, one transaction, no external programs. Sounds simple — technically it\'s not. Solana has a compute budget per transaction, and fitting all the matching logic inside it without blowing the limit requires extremely optimized code.'}
        </p>

        <SectionLabel>03 — Manifest: {isDE ? 'Noch aggressiver' : 'Going further'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Manifest baut auf Phoenix auf und geht in jedem entscheidenden Bereich weiter. Einen neuen Markt erstellen kostet weniger als einen Cent — Phoenix verlangt über 3 SOL. Gebühren: dauerhaft null. Jeder kann für jeden Token einen Markt starten, ohne Erlaubnis, ohne Kosten.'
            : 'Manifest builds on what Phoenix proved and pushes further in every important dimension. Creating a new market costs less than a cent — Phoenix charges 3+ SOL. Fees: permanently zero. Anyone can spin up a market for any token, no permission, no cost.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Die Kerninnovation ist Global Orders: ein Mechanismus, der die Kapitaleffizienz von Market Makern dramatisch verbessert.'
            : 'The core innovation is Global Orders: a mechanism that dramatically improves how efficiently market makers can deploy capital.'}
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
          {isDE
            ? '"Das Orderbuch ist nicht das schwierige Teil. Schwierig ist, das Ökosystem darum herum zu überleben."'
            : '"The order book is not the hard part. The hard part is surviving the ecosystem around it."'}
        </blockquote>

        <SectionLabel>04 — Global Orders: {isDE ? 'On-Chain Cross Margin' : 'On-chain cross margin'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Normale Herangehensweise (auch Phoenix): Du willst an fünf Märkten Market Making betreiben, also sperrst du Geld in fünf separate Konten. Dasselbe Kapital kann nicht gleichzeitig an mehreren Orten arbeiten.'
            : 'Normal approach — Phoenix included: you want to market-make on five pairs, so you lock money into five separate accounts. The same capital can\'t work in multiple places at once.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Manifest\'s Global Orders: Dein Kapital bleibt in deinem eigenen Konto. Du stellst gleichzeitig an zehn Märkten Quotes. Das Geld bewegt sich erst im Moment des Abschlusses — JIT Settlement (Just In Time). Mit denselben $100.000 kannst du zehnmal so viel Liquidität anbieten.'
            : 'Manifest\'s Global Orders: your capital stays in your own account. You quote across ten markets simultaneously. The money only moves at the moment of settlement — JIT, just in time. The same $100k can back ten times the liquidity.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das ist im Kern Cross Margin — dasselbe Prinzip wie der Gesamtmargenmodus auf Binance Futures. Der Unterschied: kein Hebel, kein Liquidationsrisiko. Du bietest Limit-Orders an, kein gehebeltes Exposure. Abgewickelt wird nur, was tatsächlich getroffen wird.'
            : 'This is cross margin in everything but name — same principle as portfolio margin on a futures exchange. The difference: no leverage, no liquidation risk. You\'re quoting limit orders, not leveraged exposure. Only what actually gets hit gets settled.'}
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
          }}>{isDE ? 'Das Risiko: gleichzeitige Fills' : 'The risk: simultaneous fills'}</p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            {isDE
              ? 'Du hast $100.000 und hast an zehn Märkten je $50.000 geboten. Normalerweise werden nicht alle gleichzeitig getroffen. Aber bei starker Marktbewegung können mehrere Märkte gleichzeitig gegen dich laufen.'
              : 'You have $100k and you\'ve quoted $50k bids across ten markets. Normally they don\'t all get hit at once. But during a sharp market move, multiple markets can come for you simultaneously.'}
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            {isDE
              ? 'Manifest verarbeitet nach dem Prinzip "Wer zuerst kommt, mahlt zuerst": Der erste Abschluss bucht das Geld, der zweite prüft den Saldo, wenn nicht genug da ist — gescheitert. Alle weiteren ebenfalls. Du verlierst nichts, aber deine Quotes an den verbleibenden Märkten sind in dem Moment, in dem du sie am meisten brauchst, wertlos. Market Maker müssen ihr gesamtes offenes Exposure im Blick behalten, nicht nur jeden Markt einzeln.'
              : 'Manifest processes first-come-first-served: the first fill books the money, the second checks the balance, not enough — failed. All subsequent ones too. You lose nothing, but your quotes on the remaining markets are worthless at exactly the moment you need them most. Market makers have to track total open exposure, not just each market individually.'}
          </p>
        </div>

        <SectionLabel>05 — {isDE ? 'Wer deine Orders kauft: Die Aggregator-Schicht' : 'Who buys your orders: the aggregator layer'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? '0x Protocol entwickelte 2017 auf Ethereum das Kompromissmodell für DEX-Handel und baut heute eine Swap API, die Liquidität über mehrere Chains aggregiert — einschließlich Solana, wo sie durch Jupiter zu Phoenix, Manifest, Orca und Raydium routen. Wer das beste Angebot hat, bekommt den Trade.'
            : '0x Protocol built the EVM compromise model for DEX trading in 2017 and now builds a swap API that aggregates liquidity across chains — including Solana, where they route through Jupiter to Phoenix, Manifest, Orca, and Raydium. Best price wins the trade.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Aggregator-Flow ist besser als HFT-Flow. Es sind Retail-Nutzer, keine adversariellen Bots — weniger wahrscheinlich, dich zu frontrunnen, einfacher zu quotieren dagegen. Aber Aggregatoren erzwingen auch enge Spreads: 0,1% zu breit und der Trade geht woanders hin. Um auf dem Routing-Pfad zu sein, musst du konstant wettbewerbsfähig sein.'
            : 'Aggregator flow is better than HFT flow. It\'s retail users, not adversarial bots — less likely to front-run you, easier to quote against. But aggregators also force tight spreads: 0.1% too wide and the trade goes elsewhere. To be on the routing path, you need to be consistently competitive.'}
        </p>

        <SectionLabel>06 — {isDE ? 'Die Kosten des Frontrunnings: Die MEV-Schicht' : 'The cost of being front-run: the MEV layer'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Du bist Market Maker. Du quotierst SOL bei 100. Ein großer Kauf kommt — du weißt, der Preis wird steigen. Du willst deinen Quote sofort canceln und bei 101 neu quotieren. Aber bevor deine Cancellation landet, hat ein Suchbot deinen 100er-Quote gesehen, ihn gecancelt, für 101 zurückgekauft. Dein Abschluss hat stattgefunden, aber zu einem Preis, der dir bereits weggeglitten ist.'
            : 'You\'re a market maker. You\'re quoting SOL at 100. A large buy comes in — you know the price will move. You want to cancel your quote immediately and re-quote at 101. But before your cancel lands, a search bot has seen your 100 quote, eaten it, and flipped it for 101. Your fill happened, but at a price that already moved against you.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Jito\'s Block Engine lässt dich Cancel + Re-Quote als atomare Operation bündeln — entweder beides passiert oder keines. Keine Lücke für Bots. Aber das kostet Gebühren in einer kompetitiven Auktion. Market Maker wälzen diese Kosten auf die Spreads um. Der Spread, den du als Trader zahlst, ist nicht nur Profit des Market Makers — es ist teilweise auch seine Versicherungsprämie gegen Frontrunning.'
            : 'Jito\'s block engine lets you bundle cancel + re-quote as an atomic operation — either both happen or neither does. No gap for bots. But this costs fees in a competitive auction. Market makers pass this cost into spreads. The spread you pay as a trader isn\'t just the market maker\'s profit — part of it is their insurance premium against being front-run.'}
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
            {isDE
              ? 'Den Orderbuch-Code fertigzuschreiben ist erst der Anfang.'
              : 'Getting the order book code right is just the beginning.'}<br />
            <span style={{ color: '#00ffea' }}>
              {isDE
                ? 'Wer deine Orders kauft und was dich das Frontrunning kostet — das sind zwei völlig andere Probleme, die beide entscheiden, ob du überlebst.'
                : 'Who buys your orders and what front-running costs you — those are two completely separate problems that both decide whether you survive.'}
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
          }}>
            ← {isDE ? 'Zurück zum Archiv' : 'Back to Archive'}
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
