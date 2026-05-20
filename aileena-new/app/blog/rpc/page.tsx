'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function RpcArticle() {
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
            INFRASTRUCTURE
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
            Solana · RPC · Helius · Triton · FluxRPC
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
          The RPC Layer<br /><span style={{ color: '#00ffea' }}>That Cut the Cord</span>
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
          Every Solana read goes through an RPC node that was originally just a special-mode validator. Helius turned that into a developer product. Triton One turned it into institutional infrastructure. FluxRPC — the 2025 Solana Breakout Infrastructure Track winner — finally unhooked it from the validator layer entirely. Three bets on the same bottleneck, priced and built three different ways.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — The Validator Pretense</SectionLabel>
        <p style={bodyStyle}>
          A Solana RPC node is not a separate piece of software. It is a validator running with the <code style={codeStyle}>--full-rpc-api</code> flag set, declining to vote, but otherwise replaying every slot, holding the full account state in memory, and gossiping with the network. When you call <code style={codeStyle}>getBalance</code>, you are querying a process that thinks of itself as a consensus participant. The read path inherited every constraint of the write path — heavy memory, expensive disk, contention with replay, and a tight coupling to the leader&apos;s tick rate.
        </p>
        <p style={bodyStyle}>
          This was fine when Solana was small. It is not fine now. Public RPCs throttle, dedicated nodes cost thousands per month, and the bandwidth to serve a high-volume dashboard or indexer is wildly out of proportion with the bandwidth to actually run consensus. Three providers — Helius, Triton One, and FluxRPC — answer the resulting demand differently. The first two layer products on top of the existing model. The third tears the model up.
        </p>

        <SectionLabel>02 — Helius: RPC as Developer Platform</SectionLabel>
        <p style={bodyStyle}>
          Helius is the closest thing Solana has to a default RPC provider. Internally every Helius endpoint sits on a validator running RPC-mode, but the value you pay for is the layer wrapped around it: webhooks, DAS (Digital Asset Standard) for unified token / NFT / compressed-NFT queries, Enhanced Transactions that return parsed human-readable history, <code style={codeStyle}>getTransactionsForAddress</code> (a paginated address-history endpoint that doesn&apos;t exist in vanilla RPC), Sender for transaction landing during congestion, and LaserStream — a drop-in Yellowstone gRPC with multi-region failover, historical replay, and auto-reconnect.
        </p>
        <p style={bodyStyle}>
          Pricing is four tiers: Free ($0), Developer ($49), Business ($499), Professional ($999). The April 2026 unlock moved LaserStream gRPC down from Pro-only to Business (10 concurrent connections), and made Enhanced WebSockets with <code style={codeStyle}>transactionSubscribe</code> available on Developer (up to 100 subscriptions per connection). Streaming traffic is metered at 20 credits per 1MB — about $100/TB after the 33% cut earlier in 2026.
        </p>
        <p style={bodyStyle}>
          What is actually unique to Helius — and not just a wrapper around vanilla RPC — is the DAS API (one query returns ownership and metadata for SPL tokens, regular NFTs, and ZK-compressed NFTs in a single shape), the webhook system (push, not poll, with parsed payloads), Enhanced Transactions, and the LaserStream stack covered in section 04. Everyone else either matches these by integrating Helius, builds them from scratch, or ignores them. Use Helius when the binding constraint on your team is engineering time, not microseconds.
        </p>

        <SectionLabel>03 — Devnet vs Mainnet, Three Stances</SectionLabel>
        <p style={bodyStyle}>
          Helius is the only one of the three that treats devnet as a first-class environment. Devnet on the $0 plan gives you 1M credits/month, the full DAS API, webhooks, and Enhanced Transactions. From April 2026 the Developer tier added LaserStream on devnet too. The implication for builders is concrete: prototype an NFT marketplace, indexer, or DeFi UI against the devnet endpoint, exercise the same webhook payloads and DAS queries you will use in production, and pay nothing until traffic moves you up a tier.
        </p>
        <p style={bodyStyle}>
          On mainnet the four tiers gate three things: requests per second, sendTransaction throughput, and access to the streaming stack. Business ($499) is now the practical floor for serious indexers and DeFi apps — 200 RPC req/s, LaserStream gRPC, the full webhook fleet, and the bandwidth to actually serve a frontend at retail volume. Professional ($999) adds higher RPS, multi-region routing, and Sender for transaction landing under contention.
        </p>

        {/* Helius tier breakdown */}
        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Free $0</th>
                <th style={thStyle}>Developer $49</th>
                <th style={thStyle}>Business $499</th>
                <th style={thStyle}>Pro $999</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Credits / month</td>
                <td style={tdStyle}>1M</td>
                <td style={tdStyle}>10M</td>
                <td style={tdStyle}>100M</td>
                <td style={tdStyle}>200M+</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>RPC req/s</td>
                <td style={tdStyle}>10</td>
                <td style={tdStyle}>50</td>
                <td style={tdStyle}>200</td>
                <td style={tdStyle}>500+</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>LaserStream devnet</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>✓</td>
                <td style={tdStyle}>✓</td>
                <td style={tdStyle}>✓</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>LaserStream mainnet</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>✓ (10 conn)</td>
                <td style={tdStyle}>✓</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Enhanced WSS</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>✓ (100 subs)</td>
                <td style={tdStyle}>✓</td>
                <td style={tdStyle}>✓</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>DAS / Webhooks / Enhanced Tx</td>
                <td style={tdStyle}>✓ (devnet)</td>
                <td style={tdStyle}>✓</td>
                <td style={tdStyle}>✓</td>
                <td style={tdStyle}>✓</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Sender (tx landing)</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Triton on devnet.</strong> Triton lists devnet in their network coverage and the Yellowstone gRPC interface works against it, which is useful when you are testing a gRPC client integration before pointing it at a mainnet stream that is metering you. But the products that justify Triton&apos;s price floor — Professional Trading Centers, dedicated co-located nodes, Cascade SWQoS bandwidth, Old Faithful historical archive — are mainnet-only by design. There is no MEV competition on devnet to race against, no liquidity to make markets in, and nothing to backtest from a historical archive that does not exist. The pragmatic Triton devnet workflow is &quot;wire up the client, hit shared RPC, then move to mainnet with the dedicated node on the day you go live.&quot;
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>FluxRPC on devnet.</strong> Not currently advertised in 2026. The public endpoints, the Lantern sidecar binary, the bandwidth-priced billing, and the EU/US regional routing are all mainnet-shaped. FluxRPC&apos;s whole value proposition — caching hot mainnet account state next to your application — does not have a meaningful devnet analogue because devnet accounts are throwaway and rarely hot. The realistic FluxRPC adoption path is to prototype against Helius free-tier devnet, validate the integration, then migrate the production read path to FluxRPC mainnet on launch day. Lantern + a FluxRPC mainnet key is a deployment-day change, not a development-time one.
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>What actually differs at the RPC-call level.</strong> The JSON-RPC method names are identical — <code style={codeStyle}>getAccountInfo</code>, <code style={codeStyle}>getProgramAccounts</code>, <code style={codeStyle}>sendTransaction</code>, <code style={codeStyle}>getRecentPrioritizationFees</code> — but the behavior diverges in ways worth rehearsing on devnet before they bite you on mainnet. <code style={codeStyle}>requestAirdrop</code> works on devnet (and is rate-limited by the faucet) and is a no-op on mainnet. <code style={codeStyle}>getRecentPrioritizationFees</code> returns near-zero on devnet and returns the real, contested distribution on mainnet — your priority-fee logic ships untested if you only ever read devnet values. <code style={codeStyle}>sendTransaction</code> lands trivially on devnet with the default settings; on mainnet under congestion it fails silently unless you bundle through Jito, route through Helius Sender, or buy Triton Cascade bandwidth. Account-state freshness is essentially never an issue on devnet because there is no leader contention; on mainnet it is the central problem FluxRPC&apos;s HEAD-slot reads and LaserStream replay both target. Devnet teaches you that your client decodes correctly. Mainnet teaches you that landing a transaction is its own business.
        </p>

        <SectionLabel>04 — LaserStream SDKs: 40× Throughput Behind a Drop-In</SectionLabel>
        <p style={bodyStyle}>
          If LaserStream is Helius&apos;s answer to &quot;build me a reliable Yellowstone consumer,&quot; the LaserStream SDKs released in 2026 are the answer to &quot;do it in one line of code.&quot; Three SDKs ship today — JavaScript/TypeScript, Rust, and Go. All three present an interface byte-compatible with Yellowstone gRPC: swap the endpoint and the auth token in an existing Yellowstone client and the rest of the application is untouched. Everything else — connection, retry, slot tracking, decompression, regional failover — happens inside the library.
        </p>
        <p style={bodyStyle}>
          The JavaScript SDK is the architecturally interesting one. The streaming engine, gRPC connection management, protobuf serialization, and slot tracking are all written in Rust; only the application logic runs in JavaScript. NAPI bindings move data across the boundary zero-copy. The published throughput is 1.3 GB/s sustained versus roughly 30 MB/s for a pure-JS Yellowstone client — about 40×. The win is mechanical: the JavaScript event loop is no longer in the hot path, so the moment your consumer needs to keep up with mainnet block velocity, the SDK lets it do that without burning CPU on JSON deserialization. For Go and Rust users the headline matters less — they were already fast — but the parity of features across all three languages is the bigger deal.
        </p>
        <p style={bodyStyle}>
          Slot-based replay is the headline reliability feature. The SDK tracks the last slot it acknowledged; on disconnect it asks the upstream to resume from exactly that point. The advertised recovery window is up to 24 hours, which means a multi-hour incident no longer means a missed-events postmortem — the consumer catches up and continues. Dedicated nodes that don&apos;t support replay simply opt out with <code style={codeStyle}>replay: false</code>. Auto-reconnect uses exponential backoff and multi-region failover routes around regional outages. Zstd compression on the wire delivers a stated 70–80% bandwidth reduction — which matters because LaserStream traffic is metered at 20 credits per 1MB, so the compression is also a direct cost cut.
        </p>
        <p style={bodyStyle}>
          The named adopter is <strong style={{ color: '#00ffea' }}>DFlow</strong>, which uses LaserStream to power real-time order flow and execution monitoring — a workload where a missed account update is a missed trade. The broader strategic point is that LaserStream SDKs collapse a category of work. A serious gRPC consumer used to require a small infrastructure team to build retry, resume, decompression, and language-specific protobuf handling on top of raw Yellowstone. With the SDKs that work becomes &quot;import the library.&quot; The gating constraint shifts from &quot;do we have the engineers to maintain a gRPC client&quot; to &quot;do we have the engineers to write the strategy that consumes it.&quot;
        </p>

        <SectionLabel>05 — Triton One: Validator-Adjacent Infrastructure</SectionLabel>
        <p style={bodyStyle}>
          Triton One is the older operator and the more technically uncompromising one. Triton authored the open-source Yellowstone gRPC plugin that the rest of the ecosystem — including Helius&apos;s LaserStream — is either a drop-in for or a fork of. Their pricing model telegraphs their audience: pay-as-you-go on shared RPC, ~$2,900/month and up for dedicated nodes, no tier-gated throttling or overage premiums. The customer is a market maker, a validator operator, or a trading firm that already knows it needs co-location and gRPC.
        </p>

        <SectionLabel>06 — Project Yellowstone, Component by Component</SectionLabel>
        <p style={bodyStyle}>
          &quot;Project Yellowstone&quot; is the umbrella name for Triton&apos;s stack. The components map cleanly to use cases and are worth naming individually because each is a deliberate piece of infrastructure, not a marketing bundle.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Dragon&apos;s Mouth.</strong> gRPC account and transaction subscriptions. The original Yellowstone interface. Triton claims up to a 400ms edge versus WebSocket-based clients for DeFi traders — accurate, because the cancel race between a market maker on gRPC and a sniper on WSS is decided in exactly that window.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Steamboat.</strong> Custom indexes that make <code style={codeStyle}>getProgramAccounts</code> actually return in reasonable time for large programs. The vanilla call is famously brutal at scale; Steamboat replaces it with a maintained side-index.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Old Faithful.</strong> Archive of full historical Solana transaction state. Addresses the elephant-in-the-room problem that vanilla validators prune. If you need to query a transaction from two years ago, you need Old Faithful or you need to operate your own archival.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Whirligig.</strong> WebSocket layer for clients that don&apos;t speak gRPC. Front-end-friendly, lower throughput.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Fumarole &amp; Vixen.</strong> Persistent, scalable streaming (Fumarole) and parsed/decoded program-aware events (Vixen). Vixen is the one to know: instead of raw account-write bytes, you get already-decoded events for known programs.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Cascade.</strong> A marketplace where validators sell SWQoS bandwidth (0.1 SOL per epoch per 100 PPS). Applications can buy guaranteed transaction-inclusion bandwidth instead of fighting the public mempool. This is what Triton sells to anyone who wants to land transactions reliably during congestion — the alternative to Helius Sender or Jito bundles.
          </p>
        </div>

        <p style={bodyStyle}>
          The Triton extreme is the Professional Trading Center: a co-located, optimized package with local Jupiter, direct validator paths, gRPC streams, and custom indexes deployed next to the validator. You don&apos;t reach for that on devnet. Devnet on Triton exists but is not the focus — devnet&apos;s value proposition is iteration speed, and Triton sells you the opposite. Use Triton when you have to win a transaction race against another team that is also reaching for Triton.
        </p>

        <SectionLabel>07 — FluxRPC: The Validator Layer, Removed</SectionLabel>
        <p style={bodyStyle}>
          FluxRPC is the architecturally interesting one and the reason it took the Infrastructure Track ($25,000 USDC) at the Solana Breakout Hackathon in May 2025. Both Helius and Triton ultimately serve data from RPC-mode validators. Even when they wrap a beautiful product layer on top, the bottom of the stack is still a validator process. FluxRPC&apos;s claim is that the RPC layer doesn&apos;t need to <em>be</em> a validator at all. They ingest chain state through their own pipeline, hold it in a purpose-built store, and serve it without paying the consensus tax. The user-visible consequence is three things.
        </p>

        <div style={{ margin: '40px 0', padding: '28px 32px', background: 'rgba(0,255,234,0.04)', border: '1px solid rgba(0,255,234,0.15)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', marginBottom: 20 }}>
            FluxRPC at a glance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
            {[
              { stat: '$0.06 / GB', label: 'Bandwidth pricing, not per-request' },
              { stat: '10 GB', label: 'Free tier on signup' },
              { stat: '0.1–0.25 ms', label: 'Cached responses via Lantern' },
              { stat: '10k+ req/sec', label: 'Throughput from local Lantern cache' },
              { stat: 'HEAD slot', label: 'Latest confirmed state, no stale reads' },
              { stat: 'EU + US', label: 'Regional endpoints (pick the close one)' },
            ].map((d, i) => (
              <div key={i}>
                <p style={{ fontFamily: 'monospace', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 700, color: '#00ffea', margin: '0 0 6px', letterSpacing: '0.02em' }}>{d.stat}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>First, the pricing model is bandwidth, not requests.</strong> $0.06 per gigabyte, 10 GB free, top-up in crypto or fiat. A <code style={codeStyle}>getBalance</code> call moves about 0.5KB, so roughly 2 million calls cost $0.06. There are no per-second rate limits in the Helius sense and no tier-gating in the Triton sense — you pay for what comes down the wire. For bursty, read-heavy workloads (dashboards, indexers, leaderboards) this is genuinely cheaper than either competitor.
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Second, the data is HEAD slot.</strong> FluxRPC returns the latest confirmed state directly rather than serving a snapshot that may lag the leader. Combined with their own ingestion pipeline, this removes the &quot;is my read fresh&quot; question that creeps into multi-RPC deployments.
        </p>
        <p style={bodyStyle}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Third, FluxRPC ships a local cache — Lantern.</strong> This is the design choice that separates the architecture from a standard hosted RPC. A standard RPC sells you a URL; FluxRPC sells you a URL <em>and</em> a binary you run next to your application, fed by selective streams from the upstream. Account reads hit your local process, not the wire.
        </p>

        <SectionLabel>08 — Lantern: The Cache You Run Yourself</SectionLabel>
        <p style={bodyStyle}>
          Lantern is a sidecar process. You hand it your FluxRPC API key once, declare which programs and accounts you care about, and it maintains a live, edge-cached copy of that subset in RAM or on disk. Your application then points <code style={codeStyle}>Connection</code> at <code style={codeStyle}>http://localhost</code> and reads from the local process. Latency on <code style={codeStyle}>getAccountInfo</code> and <code style={codeStyle}>getMultipleAccounts</code> drops to 0.1–0.25ms, throughput climbs past 10k requests per second, and the upstream API key never leaves the ops box.
        </p>
        <p style={bodyStyle}>
          The trade-offs are real and worth stating. Lantern is mainnet-focused; devnet support is not currently advertised the way it is on Helius. Cache freshness depends on how Lantern is configured and how aggressively FluxRPC pushes updates — for fast-moving accounts (an active CLOB market, an oracle price feed) you still want the upstream HEAD-slot read for the critical write path. And Lantern is read-side only: you still submit transactions through the standard channel, with the same landing problem every other Solana developer has.
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
          The interesting move isn&apos;t making RPC faster. It&apos;s noticing that the RPC node never needed to be a validator in the first place.
        </blockquote>

        <SectionLabel>09 — Cross-Comparison Matrix</SectionLabel>
        <p style={bodyStyle}>
          The three providers are not competing on a single axis. Helius sells developer time. Triton sells physical edge. FluxRPC sells a different architectural assumption. The matrix below makes the feature surface comparable.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Capability</th>
                <th style={thStyle}>Helius</th>
                <th style={thStyle}>Triton One</th>
                <th style={thStyle}>FluxRPC</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Standard JSON-RPC</td>
                <td style={tdStyle}>Full</td>
                <td style={tdStyle}>Full</td>
                <td style={tdStyle}>Full</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>gRPC streaming</td>
                <td style={tdStyle}>LaserStream (Yellowstone-compat, replay)</td>
                <td style={tdStyle}>Dragon&apos;s Mouth (the original)</td>
                <td style={tdStyle}>Lantern push streams</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>WebSocket streaming</td>
                <td style={tdStyle}>Enhanced WSS + transactionSubscribe</td>
                <td style={tdStyle}>Whirligig</td>
                <td style={tdStyle}>Standard WSS</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Parsed / decoded streams</td>
                <td style={tdStyle}>Enhanced Transactions</td>
                <td style={tdStyle}>Vixen</td>
                <td style={tdStyle}>No (raw)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>DAS (NFT + cNFT + tokens)</td>
                <td style={tdStyle}>Yes</td>
                <td style={tdStyle}>No</td>
                <td style={tdStyle}>No</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Webhooks (push events)</td>
                <td style={tdStyle}>Yes</td>
                <td style={tdStyle}>No</td>
                <td style={tdStyle}>No</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Historical archive</td>
                <td style={tdStyle}>Limited</td>
                <td style={tdStyle}>Old Faithful</td>
                <td style={tdStyle}>No</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Indexing accelerator</td>
                <td style={tdStyle}>getTransactionsForAddress</td>
                <td style={tdStyle}>Steamboat</td>
                <td style={tdStyle}>Lantern local cache</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Tx landing service</td>
                <td style={tdStyle}>Sender</td>
                <td style={tdStyle}>Cascade (SWQoS market)</td>
                <td style={tdStyle}>—</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Dedicated nodes / co-lo</td>
                <td style={tdStyle}>Optional</td>
                <td style={tdStyle}>Yes (PTCs)</td>
                <td style={tdStyle}>—</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Validator-layer dependency</td>
                <td style={tdStyle}>Yes (RPC-mode)</td>
                <td style={tdStyle}>Yes (validator-adjacent)</td>
                <td style={tdStyle}>No — separated</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Pricing model</td>
                <td style={tdStyle}>Credits + tiers</td>
                <td style={tdStyle}>PAYG + dedicated</td>
                <td style={tdStyle}>Bandwidth only ($0.06/GB)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Devnet</td>
                <td style={tdStyle}>Free, full features</td>
                <td style={tdStyle}>Available, not focus</td>
                <td style={tdStyle}>Not advertised</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Mainnet entry price</td>
                <td style={tdStyle}>$0 → $999</td>
                <td style={tdStyle}>~$2,900 (dedicated)</td>
                <td style={tdStyle}>$0 (10 GB free)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Stated latency floor</td>
                <td style={tdStyle}>1.5–2× faster than std WS</td>
                <td style={tdStyle}>~400ms edge for traders</td>
                <td style={tdStyle}>0.1–0.25ms (Lantern)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>10 — Use Case Mapping</SectionLabel>
        <p style={bodyStyle}>
          The matrix is dense. The decision tree underneath is short — pick the provider that aligns with what your binding constraint actually is.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>NFT marketplace or wallet.</strong> Helius. The DAS API solves the cNFT / regular-NFT / SPL-token enumeration problem in a single call. No competitor matches that today.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Webhook-driven backend.</strong> Helius, uncontested. Discord bots, alert systems, accounting, anything event-shaped — webhooks with parsed payloads are their thing.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Devnet prototyping.</strong> Helius free tier. The alternatives are mainnet-shaped; devnet on Helius is full-feature at $0.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Custom indexer / Substreams-style pipeline.</strong> Triton if you want parsed streams (Vixen) and historical replay (Old Faithful); FluxRPC if you want bandwidth-priced bulk reads and don&apos;t mind decoding yourself.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>MEV / market making / liquidations.</strong> Triton. Dragon&apos;s Mouth + dedicated nodes + Cascade bandwidth is the institutional stack. The 400ms cancel-race edge is not marketing.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>High-volume read app.</strong> FluxRPC. Block explorers, analytics dashboards, leaderboards — bandwidth pricing punishes the Helius credit model and avoids Triton&apos;s dedicated-node floor.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Self-hosted trading bot.</strong> FluxRPC + Lantern inside your VPC for the read path, fall back to Triton Dragon&apos;s Mouth if the cancel-race edge matters.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>SVM L2 / Fogo / appchain work.</strong> FluxRPC is the only one advertising SVM-beyond-Solana support today. A hint at where they think the moat is.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Real-time order flow / execution monitoring.</strong> Helius LaserStream SDK — drop-in, 40× throughput over a raw JS Yellowstone consumer, slot replay for incident recovery. DFlow&apos;s stack is the case study; payment-for-order-flow and MEV-aware routing live or die on a stream that does not drop events under load.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Polyglot infrastructure team.</strong> Helius LaserStream SDKs — JavaScript, Rust, and Go all maintained against the same protocol, with the same replay and reconnect semantics. The frontend team consumes the JS SDK, the indexer team uses Rust, the analytics service runs Go, and a bug fix in one ships to all three.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Live cluster / validator monitoring dashboards.</strong> Triton — Dragon&apos;s Mouth gRPC against the cluster gives you account, slot, and vote-account streams without paying the Helius streaming meter, and Old Faithful answers historical questions when the dashboard needs to show last week.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Compliance archiving for regulated entities.</strong> Triton Old Faithful — the only commercial path to query arbitrary historical Solana transactions without running your own archival validator. Custodians and exchanges that owe regulators a query interface buy this.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Wallet showing parsed transaction history.</strong> Helius Enhanced Transactions. Building a wallet UI that decodes Jupiter swaps, Tensor sales, Drift trades, and Kamino borrows from raw instructions is months of work per program; Helius ships them pre-parsed. Phantom, Backpack, and Solflare consume this so they don&apos;t have to maintain decoders.
          </p>
        </div>

        <SectionLabel>11 — Who Actually Uses This: The Roster</SectionLabel>
        <p style={bodyStyle}>
          The abstract decision tree above is fine. The concrete version — who actually runs which provider behind which product, and what specifically they do with it — makes the picture sharper.
        </p>

        <div style={{ margin: '32px 0', padding: '0 0 0 24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>The pump.fun stack.</strong> Pump.fun&apos;s token-creation events ride on <strong style={{ color: '#00ffea' }}>Helius webhooks</strong> — when a new token launches, a webhook fires to anyone subscribed, with the parsed payload already shaped. Sniper bots layer Helius gRPC for transaction listening, <strong style={{ color: '#00ffea' }}>Jito ShredStream</strong> for sub-block-propagation reads of incoming buys, and Jito bundles for cancel-resistant entries. Frontends — <strong style={{ color: '#00ffea' }}>Photon, BullX, Axiom, GMGN</strong> — sit on top, with Photon claiming sub-0.3s execution. The reason BullX gets criticized vs. competitors is exactly the absence of ShredStream + priority fees + direct validator routing: it&apos;s fast, but it doesn&apos;t have the fastlane. Realistic infra floor for a new sniper in 2026: $50–$200/month on Helius or QuickNode before writing trading logic, four-figures/month with co-located nodes and ShredStream for serious operations.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Telegram trading bots.</strong> <strong style={{ color: '#00ffea' }}>BonkBot</strong> has done $14.1B lifetime volume across 526,000+ users. <strong style={{ color: '#00ffea' }}>Trojan</strong> and <strong style={{ color: '#00ffea' }}>Maestro</strong> are in the same category. The shared shape: premium RPC (Helius / QuickNode / private endpoints) for transaction building, Jupiter for routing, proprietary routing logic on top, and increasingly Jito bundles for landing during congestion. These bots ride retail flow — the trade-offs they make on infrastructure are different from a serious MEV searcher because their median user is paying 1% slippage and doesn&apos;t notice 50ms.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>MEV searchers and market makers.</strong> <strong style={{ color: '#00ffea' }}>Wintermute, GSR, Jump, Cumberland</strong> and the on-chain firms running serious quoting on Phoenix, Drift, and Zeta reach for <strong style={{ color: '#00ffea' }}>Triton</strong>. Dragon&apos;s Mouth gRPC for account-state updates with the 400ms cancel-race edge, dedicated nodes co-located with validators, Cascade for guaranteed bandwidth, Old Faithful for historical replay when building strategies, and Jito ShredStream for the absolute earliest signal. Triton&apos;s Professional Trading Centers — co-located bundles with local Jupiter and validator-direct paths — are designed for exactly this customer profile.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>NFT marketplaces and wallets.</strong> <strong style={{ color: '#00ffea' }}>Magic Eden</strong> uses Helius for metadata indexing, mint-event tracking, and compressed-NFT support — DAS is the only unified API that returns ownership across tokens, regular NFTs, and cNFTs in one shape. <strong style={{ color: '#00ffea' }}>Tensor</strong> and <strong style={{ color: '#00ffea' }}>Drip Haus</strong> (the largest cNFT distributor on Solana) sit on DAS for the same reason. <strong style={{ color: '#00ffea' }}>Phantom, Backpack, Solflare</strong> use Helius Enhanced Transactions to render parsed transaction history — instead of every wallet writing its own program decoder, they consume Helius&apos;s already-parsed payloads directly into the UI.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Aggregators and DEXes.</strong> <strong style={{ color: '#00ffea' }}>Jupiter</strong> — Solana&apos;s dominant aggregator — uses Helius for real-time transaction data and liquidity routing, and Triton for the deep account streams the routing engine consumes. <strong style={{ color: '#00ffea' }}>Drift</strong> and <strong style={{ color: '#00ffea' }}>Mango</strong> (perp DEXes) use Triton gRPC for orderbook state. The recent strategically interesting move: Helius + Triton + Jupiter + Anza + the Solana Foundation are jointly building <strong style={{ color: '#00ffea' }}>RPC 2.0</strong>, a purpose-built read layer designed to replace the validator-as-RPC model at the protocol level. FluxRPC is the hackathon-winning expression of the same hypothesis from outside the incumbent alliance — the divergence is whether the replacement comes top-down through the Foundation or bottom-up through independent teams.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Indexers, dashboards, leaderboards.</strong> <strong style={{ color: '#00ffea' }}>DexScreener, Birdeye, Solscan</strong>, and the long tail of analytics dashboards are exactly the workload bandwidth pricing was designed for. Millions of <code style={codeStyle}>getAccountInfo</code> and <code style={codeStyle}>getMultipleAccounts</code> calls per day, mostly returning small payloads. On Helius credits this gets expensive fast; on a Triton dedicated node it costs $2,900/month minimum even when you don&apos;t need the latency edge; on FluxRPC at $0.06/GB with Lantern caching hot accounts locally, the same workload is multiple times cheaper. This is where FluxRPC most obviously wins on a spreadsheet — and where the bandwidth-vs-requests pricing fight will be decided over the next 18 months.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Payment-for-order-flow and execution monitoring.</strong> <strong style={{ color: '#00ffea' }}>DFlow</strong> — Solana&apos;s PFOF infrastructure for wallets and aggregators — uses Helius LaserStream as the streaming substrate for real-time order flow and execution monitoring. The shape: a stream that must not drop events under load, must replay cleanly through a disconnect, and must keep up with mainnet block velocity from a Node-based service. LaserStream&apos;s Rust-cored JS SDK gives them 1.3 GB/s throughput without rebuilding their backend in Rust. DFlow is the named flagship; the same shape applies to any team running pre-trade or post-trade analytics off live Solana state.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>SVM L2 and appchain builders.</strong> <strong style={{ color: '#00ffea' }}>Fogo</strong> and the smaller SVM-compatible L2s being built in 2026 face a chicken-and-egg problem: no Helius DAS for their chain, no Triton Yellowstone plugin yet, no incumbent infrastructure. FluxRPC is the only one of the three meaningfully advertising SVM-beyond-Solana support today. The early-adopter list is small but strategic — the team that becomes the default RPC for SVM L2s now is positioned for whatever fraction of mainnet flow ends up rolled-up.
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Enterprise on-ramps, custodians, and TradFi.</strong> <strong style={{ color: '#00ffea' }}>Coinbase, Bitwise, Helium</strong> — and the long tail of compliance-driven entities that need Solana exposure with audit trails — sit on Helius enterprise plans. The reason isn&apos;t latency; it&apos;s SOC 2, support SLAs, predictable invoicing, and parsed transaction payloads that downstream compliance tooling can ingest without writing program-specific decoders. Triton&apos;s Old Faithful covers the archival side when the audit asks for a five-year transaction lookup. FluxRPC is not yet positioned for this customer because the relationship is bought, not metered.
          </p>
        </div>

        {/* Roster summary table */}
        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Provider</th>
                <th style={thStyle}>Named users / products</th>
                <th style={thStyle}>What they actually do with it</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Helius</td>
                <td style={tdStyle}>Pump.fun, Phantom, Backpack, Solflare, Magic Eden, Tensor, Drip Haus, Jupiter, BonkBot, Trojan, DFlow, Coinbase, Bitwise, Helium</td>
                <td style={tdStyle}>Webhooks for token launches, DAS for NFT/cNFT, Enhanced Tx for wallet UIs, Sender for landing, LaserStream SDKs (JS/Rust/Go) for order-flow and indexers</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Triton One</td>
                <td style={tdStyle}>Wintermute, GSR, Cumberland, Jump, Drift, Mango, Phoenix MMs, Pyth, Jupiter routing</td>
                <td style={tdStyle}>Dragon&apos;s Mouth for cancel races, Cascade for inclusion bandwidth, Old Faithful for backtests, PTC co-location</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>FluxRPC</td>
                <td style={tdStyle}>Indexers, analytics dashboards, self-hosted trading-bot read paths, Fogo SVM L2 builders (early adopters — the ecosystem is younger)</td>
                <td style={tdStyle}>Bulk reads at $0.06/GB, Lantern local cache for hot accounts, mainnet HEAD-slot reads without per-request gating</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Jito ShredStream</td>
                <td style={tdStyle}>Photon, top-tier pump.fun snipers, serious MEV searchers (typically alongside Triton or Helius)</td>
                <td style={tdStyle}>Pre-block-confirmation reads of incoming transactions — the 50–100ms cancel window</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The pattern that falls out of this roster is not &quot;one provider wins.&quot; It is that serious teams mix providers per workload. A pump.fun sniper runs Helius webhooks for new-token signal, Jito ShredStream for the cancel window, and may keep a FluxRPC + Lantern path for the analytics dashboard the trader watches alongside. A Magic Eden runs Helius DAS for the catalog and Triton for any latency-sensitive trade path. The interesting strategic question is no longer &quot;which RPC&quot; — it is &quot;which combination, in what order, for which code path.&quot;
        </p>

        <SectionLabel>12 — Where This Goes</SectionLabel>
        <p style={bodyStyle}>
          Helius, Triton, and FluxRPC are not competing for the same dollar. Helius is selling developer time — pay $49 to $999 a month and skip a quarter of backend work. Triton is selling physical edge — pay $2,900+ and get the same network position a validator has. FluxRPC is selling an architectural bet: an RPC layer that doesn&apos;t pretend to be a validator can be cheaper, faster on cached reads, and more horizontally scalable than either alternative. The Colosseum prize was a recognition that the assumption &quot;RPC = a special-mode validator&quot; had been unexamined for too long.
        </p>
        <p style={bodyStyle}>
          The honest starter playbook in 2026: Helius for devnet and most of mainnet shipping; swap individual hot paths to FluxRPC the day bandwidth pricing starts to win on a spreadsheet; reach for Triton the day your business requires winning a transaction race against another team that is also reaching for Triton. The interesting question is not which provider is best. It is which assumption about the RPC layer is right — and whether validator-coupled RPC will look obvious or quaint five years from now.
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
            Helius sells time. Triton sells edge.<br />
            <span style={{ color: '#00ffea' }}>
              FluxRPC sells the bet that the RPC node should never have been a validator at all.
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
              { label: 'Solana Breakout Hackathon — Winners Announcement (Colosseum)', href: 'https://blog.colosseum.com/announcing-the-winners-of-the-solana-breakout-hackathon/' },
              { label: 'Solana on X — FluxRPC wins Infrastructure Track, $25k USDC', href: 'https://x.com/solana/status/1940442210744566165' },
              { label: 'FluxRPC — Homepage', href: 'https://fluxrpc.com/' },
              { label: 'FluxRPC — Pricing', href: 'https://fluxrpc.com/pricing' },
              { label: 'FluxRPC Docs — Lantern Introduction', href: 'https://fluxbeam.gitbook.io/fluxrpc-docs/lantern/introduction' },
              { label: 'FluxRPC Quickstart — Query Solana in 5 Minutes (dev.to)', href: 'https://dev.to/shivamsspirit/fluxrpc-quickstart-query-solana-in-5-minutes-mgk' },
              { label: 'Helius — Plans and Pricing', href: 'https://www.helius.dev/docs/billing/plans' },
              { label: 'Helius — Introducing LaserStream', href: 'https://www.helius.dev/blog/introducing-laserstream' },
              { label: 'Helius — LaserStream SDKs (JS/Rust/Go, 40× throughput, slot replay)', href: 'https://www.helius.dev/blog/laserstream-sdks' },
              { label: 'Helius — LaserStream Now Powers All WebSockets', href: 'https://www.helius.dev/blog/laserstream-websockets' },
              { label: 'DFlow — Payment-for-order-flow on Solana (uses LaserStream)', href: 'https://www.dflow.net/' },
              { label: 'Helius RPC Provider: A Practical Overview (Chainstack, 2026)', href: 'https://chainstack.com/helius-rpc-provider-a-practical-overview/' },
              { label: 'Triton One — Solana RPC Infrastructure', href: 'https://triton.one/chains/solana' },
              { label: 'Triton One — Pricing', href: 'https://triton.one/pricing' },
              { label: 'Project Yellowstone & Geyser Streaming FAQs (Triton Blog)', href: 'https://blog.triton.one/project-yellowstone-geyser-streaming-faqs/' },
              { label: 'Yellowstone gRPC — Dragon\'s Mouth (GitHub)', href: 'https://github.com/rpcpool/yellowstone-grpc' },
              { label: 'Complete Guide to Solana RPC Providers in 2026 (Sanctum)', href: 'https://sanctum.so/blog/complete-guide-solana-rpc-providers-2026' },
              { label: 'Helius — Customer roster: Phantom, Jupiter, Magic Eden, Coinbase, Bitwise, Helium', href: 'https://www.helius.dev/' },
              { label: 'What Is Helius? Backpack Learn — Customer attribution', href: 'https://learn.backpack.exchange/articles/what-is-helius' },
              { label: 'Building Production-Grade Solana Sniper Bots — pump.fun infrastructure economics (Dysnix)', href: 'https://dysnix.com/blog/complete-stack-competitive-solana-sniper-bots' },
              { label: 'Top 8 Pump.fun Sniper Bots in 2026 (QuickNode Builders Guide)', href: 'https://www.quicknode.com/builders-guide/best/top-8-pump-fun-sniper-bots' },
              { label: 'BonkBot — Dune stats ($14.1B lifetime volume, 526k+ users)', href: 'https://bonkbot.io/' },
              { label: 'BonkBot vs Trojan — Telegram bot architecture comparison (Coinmonks)', href: 'https://medium.com/coinmonks/best-solana-telegram-trading-bot-bonkbot-vs-trojan-which-one-wins-3c2c9e635171' },
              { label: 'Top 7 Solana Sniper Bots in 2026 — Photon, BullX, Axiom comparison (RPC Fast)', href: 'https://rpcfast.com/blog/top-solana-sniper-bot' },
              { label: 'Jito ShredStream Proxy — Pre-block transaction streaming (GitHub)', href: 'https://github.com/jito-foundation/shredstream-proxy' },
              { label: 'Jito Low-Latency Transaction Send & Bundles (docs)', href: 'https://docs.jito.wtf/lowlatencytxnsend/' },
              { label: 'Solana on X — RPC 2.0 alliance (Triton + Helius + Jupiter + Anza + Solana Foundation)', href: 'https://x.com/solana/status/2044058449298792557' },
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
