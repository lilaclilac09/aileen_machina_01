'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function SolanaOrderingArticle() {
  return (
    <SubstackShell
      category="Engineering Primer"
      date="2026.06.01"
      tags="Solana · MEV · Jito · Banking Stage · Sealevel"
      title="Where Solana's Order Is Made"
      dek="Solana has no mempool, one leader per 400 ms slot, and a single scheduler that decides everything. Here's a transaction's path from sign to finality — and the three places bots fight inside it."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          A transaction on Solana goes from sign to <strong style={strong}>finalized</strong> in
          about <strong style={strong}>12.8 seconds</strong> &mdash; 32 slots at 400 milliseconds
          each. In that small window, the network decides whether your trade got the price you
          wanted, whether you got front-run, and whether your bot beat the other bot to the same
          AMM pool.
        </p>
        <p style={bodyStyle}>
          Three of those decisions get made inside one specific stage of one specific machine:
          the <strong style={strong}>banking stage</strong> of the current leader. Everything else
          on the chain barely matters for ordering. This piece is the path one transaction takes,
          top to bottom, and the three places inside it where bots fight.
        </p>

        <SectionLabel>There is no mempool</SectionLabel>
        <p style={bodyStyle}>
          On Ethereum, a transaction sits in a public mempool while it waits to be included.
          Anyone can see it, simulate it, and front-run it. Solana doesn&rsquo;t have that.
        </p>
        <p style={bodyStyle}>
          At the start of each epoch (~2 days), the network computes the{' '}
          <strong style={strong}>leader schedule</strong>: a deterministic table that says which
          validator is the leader for every one of the next ~<strong style={strong}>432,000</strong>{' '}
          slots. Everyone &mdash; bots, RPC nodes, you &mdash; can read this schedule. Your client
          looks at it, finds whoever is leader <em>right now</em> (and the next handful of
          upcoming leaders), and sends the transaction directly to them over QUIC.
        </p>
        <p style={bodyStyle}>
          There is no public pool. There is <em>one</em> current leader, holding incoming
          transactions in its own memory, deciding what to do next. That single fact removes a
          whole class of MEV &mdash; you can&rsquo;t snipe a public mempool that doesn&rsquo;t
          exist &mdash; and shifts the fight to a different layer: who can reach the current
          leader at all, and how loudly.
        </p>

        <SectionLabel>Stage 1 — Fetch (fight #1: bandwidth)</SectionLabel>
        <p style={bodyStyle}>
          The leader runs a pipeline called the <strong style={strong}>TPU</strong> (Transaction
          Processing Unit). Its first stage is <strong style={strong}>Fetch</strong>: a QUIC port
          listening for incoming transactions. QUIC is the encrypted UDP transport behind HTTP/3
          &mdash; fast handshakes, many multiplexed streams.
        </p>
        <p style={bodyStyle}>
          But the leader can&rsquo;t open infinite streams. There&rsquo;s a quota, and the quota
          is split <strong style={strong}>by stake</strong>. This is{' '}
          <strong style={strong}>stake-weighted QoS</strong>: total QUIC bandwidth gets divided
          across validators in proportion to how much SOL is staked to them. A client connecting
          with zero stake gets a small shared pool &mdash; and the moment a memecoin launches or
          an NFT mint goes live, that shared pool saturates 100 %. The transaction never reaches
          the next stage.
        </p>
        <p style={bodyStyle}>
          That&rsquo;s why a serious bot doesn&rsquo;t connect to leaders itself. It rents access
          from an RPC provider &mdash; <strong style={strong}>Helius</strong>,{' '}
          <strong style={strong}>Triton One</strong>, <strong style={strong}>FluxRPC</strong>,
          Jito&rsquo;s SWQOS &mdash; that holds large amounts of SOL staked to validators and
          forwards client traffic through its own stake-weighted lane. That cost is the price of
          admission. <em>Fight #1 happens here</em>: which lane you ride on, how much stake it
          carries, how saturated it is.
        </p>

        <SectionLabel>Stage 2 — The banking scheduler (fights #2 and #3)</SectionLabel>
        <p style={bodyStyle}>
          After Fetch comes <strong style={strong}>SigVerify</strong> &mdash; bulk signature
          verification, GPU-accelerated. It&rsquo;s fast and mostly mechanical.
        </p>
        <p style={bodyStyle}>
          Then the heart of the machine: the <strong style={strong}>banking-stage scheduler</strong>.
          The scheduler sees a queue of verified transactions, knows how many cores are free, and
          has to decide which transaction goes next, on which thread, in what order. Two signals
          drive that decision.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Priority fee.</strong> Every Solana transaction can attach a{' '}
          <strong style={strong}>compute-unit price</strong> &mdash; micro-lamports per compute
          unit (CU). The fee paid equals price &times; CU consumed, divided by a million. A swap
          consuming 200,000 CU at a price of 1,000,000 &micro;-lamports/CU pays{' '}
          <strong style={strong}>200,000 lamports</strong> = 0.0002 SOL in priority fee, on top of
          the base fee. The scheduler picks higher-fee tx first. In peak demand &mdash; a
          memecoin launch, an NFT mint &mdash; CU prices climb by several orders of magnitude,
          and the same swap can cost dollars in priority fees alone. <em>Fight #2 is the
          priority-fee auction.</em>
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Jito bundles.</strong> The bigger lever. Jito Labs ships a fork
          of the validator client &mdash; <strong style={strong}>jito-solana</strong> &mdash; that{' '}
          <strong style={strong}>over 95 %</strong> of all active stake now runs. On top of it
          sits the <strong style={strong}>Jito Block Engine</strong>, an off-chain auction. Bots
          submit <strong style={strong}>bundles</strong> &mdash; atomic, ordered groups of
          transactions &mdash; along with a <strong style={strong}>tip</strong> in SOL. The Block
          Engine sells slices of the leader&rsquo;s block to the highest tipper, and the winning
          bundle is the first thing executed at the start of the slot, in the order the bot
          specified.
        </p>
        <p style={bodyStyle}>
          The economics are not subtle. The TipRouter takes a{' '}
          <strong style={strong}>6 %</strong> cut of each tip &mdash;{' '}
          <strong style={strong}>5.7 %</strong> to the Jito DAO,{' '}
          <strong style={strong}>0.15 %</strong> to JitoSOL stakers,{' '}
          <strong style={strong}>0.15 %</strong> to JTO stakers &mdash; and the remaining{' '}
          <strong style={strong}>94 %</strong> goes to validators, who pass some on to their
          delegators. Jito tips today account for{' '}
          <strong style={strong}>over 60 %</strong> of all priority-fee volume on Solana. The
          bundle auction is the real ordering market. <em>Fight #3 is the bundle bid.</em>
        </p>

        <SectionLabel>Stage 3 — Sealevel and the one-account problem</SectionLabel>
        <p style={bodyStyle}>
          Transactions exit the scheduler into <strong style={strong}>Sealevel</strong>,
          Solana&rsquo;s parallel execution engine. What makes Sealevel work, and what makes it
          bottleneck, is the same single design decision:
        </p>
        <blockquote style={blockquoteStyle}>
          Every Solana transaction must declare, at signing time, the full list of accounts it
          reads from and writes to.
        </blockquote>
        <p style={bodyStyle}>
          That declaration is the schedule. The engine looks at a batch of transactions, finds
          the ones whose <em>write sets</em> don&rsquo;t overlap, and dispatches them to parallel
          CPU cores. Eight unrelated transfers &mdash; from eight different senders to eight
          different recipients &mdash; touch sixteen different writable accounts. An eight-core
          machine simply runs all eight at once. Nothing waits.
        </p>
        <p style={bodyStyle}>
          But any two transactions that <strong style={strong}>write the same account</strong>{' '}
          must serialize. There is no clever fork around it. A popular AMM pool &mdash; say a
          SOL/memecoin pool everyone is swapping into &mdash; has one writable account holding
          the pool state. Every swap against that pool has to take its turn on that single lock.
          Eight cores don&rsquo;t help. Faster network doesn&rsquo;t help. The bottleneck is the
          lock on one account, and the order of arrivals at that lock is decided up in Stage 2.
        </p>
        <p style={bodyStyle}>
          This is the geometry that makes MEV possible. If a sandwich&rsquo;s buy transaction and
          a victim&rsquo;s swap both write the same pool, and the sandwich is scheduled first,
          the sandwich captures the spread. The whole point of the bidding fights in Stage 2 is
          that Stage 3 then locks the contested account one transaction at a time.{' '}
          <strong style={strong}>Solana parallelizes the boring transactions and serializes the
          interesting ones.</strong> The interesting ones are where every bot fights.
        </p>

        <SectionLabel>Stages 4 & 5 — Timestamps and broadcast</SectionLabel>
        <p style={bodyStyle}>
          As transactions execute, the leader interleaves them with{' '}
          <strong style={strong}>Proof of History</strong> ticks &mdash; a continuous SHA-256
          self-chain that proves time passed between events. PoH is not consensus; it&rsquo;s a
          verifiable clock that lets every other validator replay the slot and check the timing.
          Transactions plus PoH ticks together form <strong style={strong}>entries</strong>, and
          entries are the unit the leader broadcasts on the fly &mdash; it doesn&rsquo;t wait for
          the slot to finish.
        </p>
        <p style={bodyStyle}>
          Each entry is sliced into <strong style={strong}>shreds</strong>: ~1,280-byte
          Reed-Solomon-encoded packets that fit one UDP datagram. A 400 ms slot typically produces
          30&ndash;60 shreds. They travel out through <strong style={strong}>Turbine</strong>, a
          tree-shaped gossip overlay: the leader sends to a top-tier layer of a couple hundred
          root validators, who fan out to the next tier, and so on. By the time the block is
          finished, most of the network already has most of it.
        </p>
        <p style={bodyStyle}>
          The network plumbing &mdash; turbine, shreds, RPC paths, gRPC streams &mdash; is
          covered in more depth in{' '}
          <Link href="/blog/wire" style={linkStyle}>The Wire &mdash; How Solana Actually Moves
          Bytes</Link>.
        </p>

        <SectionLabel>Stage 6 — Replay, vote, finality</SectionLabel>
        <p style={bodyStyle}>
          Every validator independently receives the shreds, replays the transactions in order,
          computes its own copy of the new state, and votes for the slot with a{' '}
          <strong style={strong}>vote transaction</strong> in the next slot. Votes accumulate.
          A given transaction has three confirmation levels:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>processed</strong> &mdash; the leader produced a block
            containing it; no votes yet. ~<strong style={strong}>0.4 s</strong>.
          </li>
          <li>
            <strong style={strong}>confirmed</strong> &mdash; a supermajority voted but
            hasn&rsquo;t locked it in. ~<strong style={strong}>1&ndash;2 s</strong>.
          </li>
          <li>
            <strong style={strong}>finalized</strong> &mdash; locked in by a 32-slot supermajority,
            irreversible. ~<strong style={strong}>12.8 s</strong>.
          </li>
        </ul>
        <p style={bodyStyle}>
          Most DeFi UX uses <strong style={strong}>confirmed</strong>. Bots can&rsquo;t wait
          12.8 seconds; they take the slightly weaker guarantee for the speed.
        </p>

        <SectionLabel>The shape</SectionLabel>
        <p style={bodyStyle}>
          Pull back, and ordering on Solana is a stack of three competitive layers, each gated by
          the previous:
        </p>
        <ol style={listStyle}>
          <li>
            <strong style={strong}>Get in</strong> (SWQOS). Can your tx even reach the leader?
            Bandwidth is split by stake.
          </li>
          <li>
            <strong style={strong}>Get scheduled</strong> (priority fee). At what compute-unit
            price will the scheduler pick you out of the queue?
          </li>
          <li>
            <strong style={strong}>Get atomic</strong> (Jito bundle). Can you outbid everyone else
            for an ordered region of the block?
          </li>
        </ol>
        <p style={bodyStyle}>
          All three feed into the same chokepoint:{' '}
          <strong style={strong}>the banking-stage scheduler at one machine, for one 400 ms
          slot.</strong> That&rsquo;s where Solana&rsquo;s order is made. Sealevel&rsquo;s
          parallel execution is the headline number &mdash; high throughput on average &mdash;
          but every moment that matters for MEV falls back to one account being written one
          transaction at a time. The chain&rsquo;s throughput is high in the aggregate; its{' '}
          <em>ordering</em> is decided one slot, one account, at a time.
        </p>
        <p style={bodyStyle}>
          That&rsquo;s the gap to live with. Solana parallelizes the cheap, uncontested traffic
          and quietly serializes everything that&rsquo;s actually worth fighting over. Every bot
          on the chain organizes its entire stack around that one fact.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Adjacent reading: <Link href="/blog/wire" style={linkStyle}>The Wire</Link>{' '}
          (the network layer under all of this);{' '}
          <Link href="/blog/cex-dex-arb" style={linkStyle}>The Darkest Trade</Link>{' '}
          (where this ordering geometry shows up as live MEV);{' '}
          <Link href="/blog/humidifi-decoded" style={linkStyle}>Humidifi, Decoded</Link>{' '}
          (byte-level reversal of a contested AMM under the same scheduler).
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Archive
          </Link>
        </div>
      </article>
    </SubstackShell>
  );
}

/* ── Shared inline styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const linkStyle: React.CSSProperties = { color: '#00ffea', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,234,0.3)' };
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
const blockquoteStyle: React.CSSProperties = {
  borderLeft: '3px solid rgba(255,255,255,0.45)',
  fontStyle: 'italic',
  fontSize: '1.15rem',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.92)',
  padding: '0.4rem 0 0.4rem 1.5rem',
  margin: '2rem 0',
  letterSpacing: 0,
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
