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
          marginBottom: 0,
        }}>
          {isDE
            ? 'On-Chain-CLOBs galten als unmöglich. Solana bewies das Gegenteil. Aber das eigentliche Engineering-Problem beginnt erst danach — im Zusammenspiel von Matching-Architektur, Aggregator-Routing und MEV-Ökonomie.'
            : 'On-chain CLOBs were supposed to be impossible. Solana proved they weren\'t. The real engineering problem starts after that — in the intersection of matching architecture, aggregator routing, and MEV economics.'}
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Comparison bar ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'rgba(0,255,234,0.08)',
          border: '1px solid rgba(0,255,234,0.12)',
        }}>
          {[
            { label: 'MANIFEST', sub: 'Hypertree · Zero-fee · Global Orders', accent: true },
            { label: 'PHOENIX', sub: 'Crankless · Single-account · Battle-tested', accent: false },
            { label: 'SERUM / EVM', sub: 'Legacy · Crank-dependent · Gas-limited', accent: false },
          ].map((item) => (
            <div key={item.label} style={{
              padding: '20px 18px',
              background: item.accent ? 'rgba(0,255,234,0.05)' : 'rgba(0,0,0,0.6)',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.4em',
                color: item.accent ? '#00ffea' : 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>{item.label}</p>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.5rem',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
              }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — {isDE ? 'Die fundamentale Einschränkung' : 'The Fundamental Constraint'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Jedes CLOB hat dieselbe Architektur: eine zentrale Datenstruktur (Bids + Asks), atomares Matching, Preis-Zeit-Priorität. Das Problem auf einer Blockchain: Diese Struktur muss bei jeder Order, jeder Stornierung und jedem Fill geschrieben werden — sequenziell.'
            : 'Every CLOB has the same architecture: a central data structure (bids + asks), atomic matching, price-time priority. The problem on a blockchain is that this structure must be written by every order, cancel, and fill — all serialized.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Auf EVM war das fatal. Gaskosten machten häufige Order-Updates wirtschaftlich unmöglich. Die echte EVM-Antwort auf CLOBs war nie rein On-Chain: 0x Protocol bewies das bereits 2017 — Off-Chain-Relay, On-Chain-Settlement. Die reine On-Chain-Vision zog auf Hyperliquids eigene Chain um.'
            : 'On EVM, this was fatal. Gas costs made frequent order updates economically impossible. The real EVM answer was never pure on-chain: 0x Protocol proved that in 2017 — off-chain relay, on-chain settlement. The pure on-chain vision migrated to Hyperliquid\'s own chain.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Solana veränderte die Rechnung: 400ms Slots, Sub-Cent-Gebühren, parallele Ausführung (Sealevel). Aber Sealevel hat eine Einschränkung: Accounts mit geteiltem Write-Access müssen sequenziell ausgeführt werden. Das Market-Account eines CLOBs ist ein Hot-Write-Target. Jeder Teilnehmer konkurriert darum. Das ist die Wurzel aller Probleme.'
            : 'Solana changed the calculus: 400ms slots, sub-cent fees, parallel execution (Sealevel). But Sealevel\'s parallelism has a constraint: accounts that share write access must execute sequentially. A CLOB\'s market account is a hot write target. Every participant contends for it. This is the root of every problem.'}
        </p>

        <SectionLabel>02 — {isDE ? 'Manifest vs. Phoenix: Zwei Antworten' : 'Manifest vs Phoenix: Two Answers'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Phoenix (Ellipsis Labs) bewies, dass Crankless-Matching auf Solana machbar ist. Der Crank — ein Keeper-Prozess, der Events verarbeitet und State aktualisiert — war Serums notwendiges Übel. Phoenix eliminierte ihn: Matching geschieht atomar innerhalb der Order-Transaktion. Selber Slot, selbes CU-Budget, keine Keeper-Abhängigkeit.'
            : 'Phoenix (Ellipsis Labs) proved crankless matching was viable on Solana. The crank — a keeper process that processes events and updates state — was Serum\'s necessary evil. Phoenix eliminated it: matching happens atomically within the placing transaction. Same slot, same CU budget, no keeper dependency.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Manifest (Bonasa-Tech) ging den nächsten Schritt. Null Gebühren, dauerhaft. ~0.007 SOL für ein neues Market vs. Phoenix\'ens 3+ SOL. Die Kerninnovation ist der Hypertree: ein Red-Black-Tree und eine doppelt verkettete Liste, die denselben Fixed-Size-(80-Byte)-Node-Pool teilen. Das Orderbuch wächst dynamisch, ohne rent-intensive Accounts vorab zu allozieren.'
            : 'Manifest (Bonasa-Tech) took the next step. Zero fees, permanent. ~0.007 SOL to create a market vs Phoenix\'s 3+ SOL. The core innovation is the Hypertree: a Red-Black tree and doubly-linked list sharing the same fixed-size (80-byte) node pool. The order book grows dynamically without pre-allocating rent-heavy accounts.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das interessanteste Manifest-Primitiv sind Global Orders: Eine Position, einmal registriert, nutzbar in beliebigen Markets. Das Kapital bleibt an einem Ort; das Matching triggert JIT-Settlement. Das entspricht on-chain einem Prime-Brokerage-Account — dieselben Dollar arbeiten gleichzeitig in SOL/USDC, WIF/USDC und jedem Long-Tail-Pair. Manifest ist außerdem formal von Certora verifiziert: RB-Tree-Invarianten, No-Funds-Lost, Matching-Korrektheit.'
            : 'The most interesting Manifest primitive is Global Orders: a position registered once, usable across any market. Capital stays in one place; matching triggers JIT settlement. This is the on-chain equivalent of a prime brokerage account — the same dollars working simultaneously across SOL/USDC, WIF/USDC, and any long-tail pair. Manifest is also formally verified by Certora: RB tree invariants, no-funds-lost property, matching correctness.'}
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
            ? '"Das Orderbuch ist nicht das schwierige Teil. Das schwierige Teil ist, das Ökosystem darum herum zu überleben."'
            : '"The order book is not the hard part. The hard part is surviving the ecosystem around it."'}
        </blockquote>

        <SectionLabel>03 — {isDE ? 'Was 0x API über Aggregation lehrt' : 'What 0x API Teaches About Aggregation'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? '0x\'s Geschichte auf EVM ist aufschlussreich. Sie versuchten rein On-Chain-Orderbücher im Jahr 2017. Sie pivoteten zu Off-Chain-Relay. Sie kamen beim RFQ-Modell an — Market Maker quoten Off-Chain, On-Chain-Settlement mit atomaren Garantien. Diese Sequenz verrät etwas: Die Latenz- und Flow-Quality-Anforderungen professioneller Market Maker und die Einschränkungen von Blockchains stehen in fundamentaler Spannung.'
            : '0x\'s history on EVM is clarifying. They tried pure on-chain order books in 2017. They pivoted to off-chain relay. They arrived at RFQ — market makers quote off-chain, on-chain settlement with atomic guarantees. This sequence reveals something: the latency and flow-quality requirements of professional market makers and the constraints of blockchains are in fundamental tension.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Jetzt unterstützt 0x Solana über ihre Swap API — routing durch Jupiter, das Phoenix, Manifest, Orca und Raydium aggregiert. Aggregator-Flow ist strukturell anders als HFT-Flow: Retail-Größe, latenztolerant, preissensitiv. Weniger Adverse Selection. Für CLOBs bedeutet das: Wer auf dem Routing-Pfad steht, braucht kompetitive Preise, nicht die schnellste Latenz. Manifest\'s Global Orders werden hier besonders wertvoll — Kapital, das bereits in anderen Markets deployed ist, steht gleichzeitig für Aggregator-Routing zur Verfügung.'
            : 'Now 0x supports Solana via their Swap API — routing through Jupiter, which aggregates Phoenix, Manifest, Orca, and Raydium. Aggregator flow is structurally different from HFT flow: retail-sized, latency-tolerant, price-sensitive. Less adverse selection. For CLOBs, being on the routing path means: you need competitive pricing, not the fastest latency. Manifest\'s Global Orders become especially valuable here — capital already deployed in other markets is simultaneously available for aggregator routing.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Das RFQ-Modell, das 0x auf EVM entwickelt hat, sickert nun über Jupiter\'s eigenes RFQ-System auf Solana ein. Das erzeugt eine hybride Landschaft: On-Chain CLOB für kleinere/neuere Paare, RFQ für liquide Paare. Manifests Wrapper-Architektur — die den minimalen Core von Feature-Schichten trennt — positioniert es für beide Modi.'
            : 'The RFQ model 0x pioneered on EVM is creeping into Solana via Jupiter\'s own RFQ system. This creates a hybrid landscape: on-chain CLOB for smaller/newer pairs, RFQ for liquid pairs. Manifest\'s Wrapper architecture — separating the minimal core from feature layers — positions it to participate in both modes.'}
        </p>

        <SectionLabel>04 — {isDE ? 'Titan und die MEV-Ökonomie' : 'Titan and the MEV Economics'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Das "Stale Order"-Risiko, das Solana-CLOBs plagt, ist im Kern ein MEV-Problem. Ein Market Maker quotet einen Preis. Ein großer Trade kommt an. Bevor der MM stornieren und ersetzen kann, erkennt ein Searcher den Trade, front-runt das Fill, und der MM sitzt auf einer adversen Position.'
            : 'The "stale order" risk that plagues Solana CLOBs is a MEV problem at its root. A market maker quotes a price. A large trade arrives. Before the MM can cancel and replace, a searcher spots the trade, front-runs the fill, and the MM is left holding an adverse position.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Jito\'s Block Engine (in internen Kontexten oft als Titan bezeichnet) ist der primäre Mechanismus, über den MEV extrahiert — und teilweise zurückbesteuert — wird. Bundles ermöglichen atomares Cancel+Replace: ein Searcher kann {cancel, new_quote, fill} als eine einzige atomare Einheit einreichen. Das ist auch für MMs verfügbar, erfordert aber Priority Fees in einer kompetitiven Auktion.'
            : 'Jito\'s block engine (often called Titan in internal contexts) is the primary mechanism through which MEV is extracted and — partially — taxed back. Bundles allow atomic cancel+replace: a searcher can submit {cancel, new_quote, fill} as a single atomic unit. This is available to MMs too, but requires priority fees in a competitive auction.'}
        </p>

        {/* MEV impact grid */}
        <div style={{
          margin: '40px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {[
            {
              label: isDE ? 'Write Lock + Priority Auctions' : 'Write Lock + Priority Auctions',
              body: isDE
                ? 'Lock-Contention ist schlimmer als die rohen Zahlen zeigen — Priority-Fee-Auktionen erhöhen die Kosten, langsam zu sein.'
                : 'Lock contention is worse than raw numbers show — priority fee auctions amplify the cost of being slow.',
            },
            {
              label: isDE ? 'Global Orders: größere Angriffsfläche' : 'Global Orders: Wider Attack Surface',
              body: isDE
                ? 'Manifest\'s Cross-Market-Locks geben Searchern mehr Vektoren für adversariale Tx-Ordering.'
                : 'Manifest\'s cross-market locks give searchers more vectors for adversarial transaction ordering.',
            },
            {
              label: isDE ? 'Phoenix: einfacher zu modellieren' : 'Phoenix: Simpler to Model',
              body: isDE
                ? 'Einzel-Market-Struktur ist unter adversarialem Ordering einfacher zu begründen — Lock-Scope klar.'
                : 'Single-market structure is simpler to reason about under adversarial ordering — lock scope is known.',
            },
            {
              label: isDE ? 'Spread-Prämie = MEV-Versicherung' : 'Spread Premium = MEV Insurance',
              body: isDE
                ? 'Profis quoten breiter als theoretische Effizienz erlaubt. Der Spread ist zum Teil eine Gebühr an die Block Engine.'
                : 'Pros quote wider than theoretical efficiency allows. The spread is partly a fee paid to the block engine.',
            },
          ].map((item) => (
            <div key={item.label} style={{ padding: '20px 22px', background: 'rgba(0,0,0,0.5)' }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.52rem',
                letterSpacing: '0.35em',
                color: '#00ffea',
                textTransform: 'uppercase',
                marginBottom: 10,
                opacity: 0.75,
              }}>{item.label}</p>
              <p style={{
                fontSize: '0.88rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.02em',
              }}>{item.body}</p>
            </div>
          ))}
        </div>

        <SectionLabel>05 — {isDE ? 'Was ungelöst bleibt' : 'What Remains Unsolved'}</SectionLabel>
        <p style={bodyStyle}>
          {isDE
            ? 'Manifest\'s Global-Order-Lock-Contention ist das größte ungetestete Risiko. Die Theorie ist elegant; das Verhalten unter hochfrequentem, adversarialem Traffic ist nicht veröffentlicht. Das ist keine Kritik — es ist ein offenes Engineering-Problem, das echte Produktionsdaten braucht, um beantwortet zu werden.'
            : 'Manifest\'s Global Order lock contention is the biggest untested risk. The theory is elegant; the behavior under high-frequency adversarial traffic is unpublished. That\'s not a criticism — it\'s an open engineering problem that needs real production data to answer.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Solanas Alpenglow-Roadmap (~100ms Finalität) wird die MEV-Ökonomie verändern, nicht eliminieren. Der Block Engine-Markt ist strukturell, nicht nur ein Latenz-Artefakt. App-Specific Sequencing und asynchrone Ausführung sind die richtigen Langfrist-Hebel — aber sie existieren noch nicht in Produktion.'
            : 'Solana\'s Alpenglow roadmap (~100ms finality) will change the MEV economics, not eliminate them. The block engine market is structural, not just a latency artifact. App-specific sequencing and async execution are the right long-term levers — but they don\'t exist in production yet.'}
        </p>
        <p style={bodyStyle}>
          {isDE
            ? 'Tickless Matching in Manifest ermöglicht Preise über den gesamten Bereich — aber Zeit-Priorität bei gleichen Preisniveaus ist ohne Ticks schwerer zu erzwingen. Das ist ein subtiler Tradeoff, der erst unter professionellem Market Making-Betrieb sichtbar wird.'
            : 'Tickless matching in Manifest enables prices across the full range — but time priority at equal price levels is harder to enforce without ticks. This is a subtle tradeoff that only becomes visible under professional market making operations.'}
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
              ? 'Solana machte On-Chain-CLOBs möglich. Manifest und Phoenix machten sie praktisch.'
              : 'Solana made on-chain CLOBs possible. Manifest and Phoenix made them practical.'}<br />
            <span style={{ color: '#00ffea' }}>
              {isDE
                ? 'Was 0x und Titan hinzufügen: die Schichten über und unter dem Orderbuch.'
                : 'What 0x and Titan add: the layers above and below the order book.'}
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

        <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
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
