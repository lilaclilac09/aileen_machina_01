'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function WireSpeedArticle() {
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
            ARCHITECTURE
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
            Solana · Firedancer · Samba · Delorean · pmm-sim
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
          Solana at<br /><span style={{ color: '#00ffea' }}>Wire Speed</span>
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
          A Jupiter swap, an NFT mint, a $40k liquidation — all of it crosses through a validator in 400 milliseconds.
          Four open-source projects are racing to make that machine faster, surgically modifiable, rewindable,
          and dissectible on a laptop. Here is what each one actually does, who uses it on mainnet today,
          and how to choose the right tool for the job in front of you.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The 400-Millisecond Machine</SectionLabel>
        <p style={bodyStyle}>
          Every Solana transaction passes through a piece of software called a <strong style={strong}>validator</strong>. A validator is
          a state machine: it reads transactions off the network, verifies their signatures, executes the
          program calls, updates the affected accounts, and writes the result into a block. Then it does it again,
          starting from the new state, in the next 400-millisecond slot.
        </p>
        <p style={bodyStyle}>
          Think of an air traffic control center. Thousands of planes (transactions) arrive per second from every
          direction. Each one needs to be cleared, sequenced, and routed onto exactly one runway (the block). The
          tower never sleeps. It never gets to say &quot;come back later.&quot; Every second of delay costs someone money,
          and a single mistake can crash a flight. That is the job description for a validator — except the volume
          is closer to 5,000 transactions per second and the deadline to produce a block is shorter than a human
          blink.
        </p>
        <p style={bodyStyle}>
          The pressure to make this machine faster has spawned three entirely different engineering projects, plus
          a fourth tool that does not sit inside the validator at all but lets you replay and dissect what one of
          them did. The four projects you should know by name:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '32px 0 48px' }}>
          {[
            { tag: 'FIREDANCER', tagline: 'The C engine, built from scratch by Jump Crypto for raw speed.', who: 'Jump Crypto' },
            { tag: 'SAMBA', tagline: 'Firedancer + native MEV bundles, built by Harmonic Finance.', who: 'Harmonic Finance' },
            { tag: 'DELOREAN', tagline: 'Replay any historical transaction on your laptop in &lt; 1 second.', who: 'Temporal XYZ' },
            { tag: 'PMM-SIM', tagline: 'A lab for dissecting private AMMs and their VIP pricing.', who: 'LimeChain' },
          ].map((card, i) => (
            <div key={i} style={{
              padding: '20px 22px',
              border: '1px solid rgba(0,255,234,0.15)',
              background: 'rgba(0,255,234,0.02)',
              borderRadius: 4,
            }}>
              <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em', color: '#00ffea', margin: '0 0 8px' }}>{card.tag}</p>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', margin: '0 0 10px' }}
                 dangerouslySetInnerHTML={{ __html: card.tagline }} />
              <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', margin: 0 }}>by {card.who}</p>
            </div>
          ))}
        </div>

        <p style={bodyStyle}>
          The incumbent in this picture is <strong style={strong}>Agave</strong>, the original Solana validator maintained by Anza
          (formerly Solana Labs). Most of mainnet still runs Agave. Firedancer is the challenger; Samba is a fork of
          Firedancer that adds one capability the chain could not otherwise express; Delorean is the debugger for
          what the validators produce; pmm-sim is the laboratory bench for the private market-making programs that
          ride on top.
        </p>

        <SectionLabel>Firedancer: The C Engine</SectionLabel>
        <p style={bodyStyle}>
          Firedancer is what happens when a high-frequency-trading firm writes a blockchain validator. Jump Crypto
          built it from scratch in C, with no garbage collection, no shared memory between threads, and one job per
          CPU core. The unifying design idea is the <strong style={strong}>tile</strong>.
        </p>
        <p style={bodyStyle}>
          A tile is one thread on one CPU core that does exactly one thing — receive packets, or verify signatures,
          or deduplicate transactions, or pack a block. Tiles never call each other and never share memory directly.
          They pass work down the pipeline through a shared-memory ring buffer called <strong style={strong}>Tango</strong>, which
          Jump borrowed from the HFT world. The result is a system that scales by adding more CPU cores: need more
          ingress bandwidth? Add more NIC tiles. Need more signature throughput? Add more SigVerify tiles. No lock
          contention, no coordination overhead.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`from external NIC
     |
     v
  +-- core ----+
  | NIC / QUIC |     ← tile: raw packets
  | SIG VERIFY |     ← tile: ed25519 verification
  |  DEDUP TAG |     ← tile: fingerprint already-seen txs
  +------------+
     |
     v   (metadata via Tango mcache)
  +-- core ----+
  |    DEDUP   |     ← tile: drop duplicates
  |     MUX    |     ← tile: multiplex verified txs
  +------------+
     |
     v
  +-- core ----+
  | BLOCK PACK |     ← tile: choose what enters the block
  +------------+
     |
     v
  to Agave (Frankendancer) or flamenco (full Firedancer)`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Source: firedancer/doc/organization.txt (abbreviated)
          </p>
        </div>

        <p style={bodyStyle}>
          The source tree mirrors the pipeline. <code style={codeStyle}>tango/</code> is the nervous system — the
          IPC layer every tile uses to talk to the next one. <code style={codeStyle}>ballet/</code> is the math library
          where SHA-256, ed25519, and base58 are reimplemented in vector C for maximum speed. <code style={codeStyle}>disco/</code>
          holds the common pipeline tiles; <code style={codeStyle}>flamenco/</code> is where the Solana VM runtime
          actually executes program bytecode. <code style={codeStyle}>funk/</code> is the in-memory, fork-aware accounts
          database. <code style={codeStyle}>waltz/</code> is the networking layer; <code style={codeStyle}>wiredancer/</code>
          contains the FPGA modules — yes, Jump is building hardware-accelerated tiles for the truly throughput-bound
          stages.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>FRANKENDANCER VS FULL FIREDANCER</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={strong}>Frankendancer</strong> is the production-ready hybrid running on mainnet today: Firedancer
            does the networking, packet processing, and block packing, then hands off to the Agave runtime to actually
            execute the transactions. <strong style={strong}>Full Firedancer</strong> is the all-C version still under
            development — its own runtime (flamenco), its own consensus (choreo), its own everything. Frankendancer
            is the bridge that lets you adopt Firedancer&apos;s speed without waiting for the entire stack to be
            independent.
          </p>
        </div>

        <SectionLabel>The Pipeline: A Transaction&apos;s Six Checkpoints</SectionLabel>
        <p style={bodyStyle}>
          Imagine you click <em>Swap</em> on Jupiter. In the next 400 milliseconds, your transaction passes through six
          distinct checkpoints inside a Firedancer validator before it is committed to the chain. Every checkpoint
          either stamps it <em>valid, continue</em> or silently drops it. Nothing goes backward. Nothing is copied —
          the NIC tile writes your bytes once into a shared <code style={codeStyle}>dcache</code> region, and every
          downstream tile reads from the same pointer. This is the zero-copy insight that makes Firedancer fast.
        </p>

        <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '32px 0 48px' }}>
          {[
            ['1', 'QUIC ingest', 'The NIC tile receives your transaction as raw UDP packets over QUIC and extracts the transaction payload.'],
            ['2', 'Signature verify', 'The SigVerify tile checks the ed25519 signature against your public key. Invalid? Dropped silently.'],
            ['3', 'Dedup tag', 'A 64-bit fingerprint is computed. If this validator has already seen the same fingerprint recently, the transaction is dropped — it is a resend.'],
            ['4', 'Block pack', 'Verified, unique transactions enter the Pack tile, which ranks them by priority fee and selects which ones go in the next block. There are ~2,400 slots per block.'],
            ['5', 'SVM execute', 'The Solana VM runs each selected transaction against the current accounts state. Compute units are metered. If you exceed your budget, the SVM halts and rolls back all account changes.'],
            ['6', 'Consensus commit', 'The block is signed, gossiped to other validators, voted on, and confirmed.'],
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
          When a transaction fails or stalls, knowing <em>which</em> checkpoint dropped it is the difference between
          debugging in five minutes and debugging for two days. &quot;Transaction never confirmed&quot; almost always means
          step 3 (deduped — you sent it twice and the validator silently dropped the second copy). &quot;Transaction failed
          with simulation error&quot; means step 5 (SVM execution rejected it). &quot;Transaction is taking too long to land&quot;
          usually means step 4 (your priority fee is too low and the Pack tile is choosing other transactions ahead of
          yours).
        </p>

        <SectionLabel>Samba: MEV at Wire Speed</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>MEV</strong> — Maximum Extractable Value — is money that exists purely in the ordering of
          transactions. If your arbitrage trade lands one slot after a large price-moving swap and one slot before
          anyone else reacts, you capture the spread. Application-layer solutions cannot guarantee this ordering;
          only the validator can. Harmonic Finance forked Firedancer to build that guarantee directly into the
          validator. The fork is called <strong style={strong}>Samba</strong>.
        </p>
        <p style={bodyStyle}>
          A <strong style={strong}>bundle</strong> in Samba is an ordered group of transactions that must land together,
          in the exact submitted order, or all of them are rejected. The Samba pack tile holds a separate queue for
          bundles. When the validator is the upcoming leader for a slot, the bundle queue is drained first, with
          bundles locked into consecutive block positions before any regular fee-priority transactions are packed
          around them.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`samba/src/discof/sender/   ← Harmonic-added: bundle sender tile
samba/src/discof/send/     ← Harmonic-added: streaming tx submission
samba/src/discof/resolv/   ← Modified: resolv tile with MEV routing`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            Samba additions on top of upstream Firedancer.
          </p>
        </div>

        <p style={bodyStyle}>
          Why fork Firedancer rather than build the same thing on Agave? The tile architecture makes it surgically
          modifiable: to add bundle support, Harmonic added a new tile (the bundle sender) and modified one
          existing tile (pack). The same change inside Agave&apos;s Rust monolith would mean threading MEV logic
          through a much more complex codebase. Firedancer&apos;s &quot;one tile, one job&quot; rule turned MEV from an
          architectural rewrite into a 6-tile diff.
        </p>

        <div style={calloutInfo}>
          <p style={calloutTitle}>SAMBA VS JITO</p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            Both deliver MEV bundles, but at different layers. <strong style={strong}>Jito</strong> patches the Agave validator
            and runs a centralized block engine that auctions bundle ordering off-chain, then forwards the winning
            bundle to a Jito-patched validator. It is the dominant solution on mainnet today (~80% of stake runs Jito
            software).
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={strong}>Samba</strong> moves the bundle pipeline inside the validator itself, fully native, no
            external block engine. Trade-off: Jito has the network effect; Samba has the cleaner architecture and the
            speed of the C engine. They are not mutually exclusive — a validator can run Samba <em>and</em> participate
            in Jito&apos;s auction, choosing per-slot.
          </p>
        </div>

        <SectionLabel>Delorean: The Time Machine</SectionLabel>
        <p style={bodyStyle}>
          A trading bot loses $40,000 on a transaction that should have succeeded. The transaction is buried in a
          block from three days ago. How do you debug it? Without Delorean, you cannot — the on-chain state has
          moved on, the program may have been upgraded, the feature flags may have changed. The transaction is a
          fossil with no surrounding context.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Delorean</strong> is the time machine for Solana transactions. It pairs with a service called
          <strong style={strong}> Penrose</strong>, built by Temporal XYZ, which captures a complete snapshot — a
          <strong style={strong}> fixture</strong> — of every account, program bytecode, and Solana system variable that any
          transaction touched, at the exact slot it ran. Penrose serves these fixtures over a custom RPC method. The
          Delorean CLI fetches one, builds an in-memory mock bank, runs the transaction through the real Solana VM
          on your laptop, and tells you whether the replay matches the original.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`fetching fixture for WRM4dvtB32k261TTsn2nc4ini9VvWrB1NBLCQdtZk1FRycp54VTuaDikufLk1E2MANthZjQQS6skzeis2W3bvNA

--- fixture ---
  schema_version  : 0
  slot            : 420195494
  client_version  : 4.2.0-alpha.0
  enabled features: 221
  pre-accounts    : 25
  post-accounts   : 25
  loader-v3 progs : 3
  sysvars         : 9
  expected CUs    : 104291

--- replay outcome ---
  actual status   : Ok(())
  expected status : Ok(())
  status          : MATCH
  actual CUs      : 104291
  expected CUs    : 104291
  CUs             : MATCH
  post-state      : MATCH`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            A successful Delorean replay. Status matches, compute units match, every post-state account matches.
          </p>
        </div>

        <p style={bodyStyle}>
          The fixture format is itself worth understanding because it answers the question: <em>what does the SVM need
          to execute a transaction?</em> Look at the Rust struct:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`pub struct TransactionFixture {
    pub schema_version: u32,
    pub slot: u64,
    pub recent_blockhash: Hash,
    pub signature: Signature,
    pub client_version: Vec<u8>,
    pub enabled_features: Vec<Pubkey>,
    pub lamports_per_signature: u64,
    pub transaction: Vec<u8>,
    pub alt_writable: Vec<Pubkey>,
    pub alt_readonly: Vec<Pubkey>,
    pub pre_accounts: Vec<FixtureAccount>,
    pub programs: Vec<FixtureProgramData>,
    pub sysvars: Arc<Vec<FixtureSysvar>>,
    pub result: ExecutionResult,
    pub post_accounts: Vec<FixtureAccount>,
}`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Read it like a forensic kit: <code style={codeStyle}>slot</code> pins the moment in time;
          <code style={codeStyle}> enabled_features</code> captures which of Solana&apos;s ~221 feature flags were active
          (a flag flip can change how a transaction executes); <code style={codeStyle}>pre_accounts</code> is every
          wallet and contract state before the transaction; <code style={codeStyle}>programs</code> is the bytecode of
          every smart contract involved <em>as it was deployed at that slot</em>; <code style={codeStyle}>post_accounts</code>
          is the ground-truth result. With all of this in hand, you can replay the transaction in isolation, perfectly,
          three days or three years later.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>THE --REPLACE-PROGRAM FLAG</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            Delorean&apos;s killer feature: you can swap out any program&apos;s bytecode before the replay. Testing
            whether your bug fix actually works? Replace the deployed program with your patched ELF, replay the
            historical failing transaction, and see whether it passes now. Same accounts, same feature flags, same
            block height, <em>your</em> code. This is historical simulation as a debugging primitive.
          </p>
        </div>

        <SectionLabel>pmm-sim: The Private AMM Dissection Lab</SectionLabel>
        <p style={bodyStyle}>
          You swap 15,000 USDC into WSOL on Jupiter. Your friend calls the exact same private AMM contract directly,
          same pool, same amount. She gets less WSOL. Same code, same liquidity, different result. Why?
        </p>
        <p style={bodyStyle}>
          The answer is that some Solana AMMs are not neutral. They are <strong style={strong}>private AMMs</strong> (also
          called proprietary or prop AMMs) — programs whose pricing logic is closed-source and which look at the
          identity of the calling program to decide what quote to give. If your call originated from an aggregator
          on their whitelist, you get the VIP price. If it came from a random wallet, you get the public price.
          <strong style={strong}> pmm-sim</strong>, built by LimeChain, is the laboratory for measuring that gap.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, margin: '32px 0' }}>
          {[
            { name: 'HumidiFi', desc: 'swap-v1/v2/v3 instructions, five WSOL-USDC markets, large discount for Jupiter callers.' },
            { name: 'SolFi V2', desc: 'Deep WSOL-USDC and USDT-USDC books, oracle-priced, special pricing for DFlow.' },
            { name: 'GoonFi / BisonFi', desc: 'Newer prop AMMs; some apply blacklists; whitelisted aggregators get lower slippage.' },
            { name: 'Tessera / Obric / ZeroFi', desc: 'Stable-focused or multi-oracle; ZeroFi runs an independent vault structure.' },
          ].map((p, i) => (
            <div key={i} style={{
              padding: '16px 18px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: '3px solid #00ffea',
            }}>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.05em' }}>{p.name}</p>
              <p style={{ fontSize: '0.78rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        <p style={bodyStyle}>
          pmm-sim uses <strong style={strong}>LiteSVM</strong> — a lightweight, in-process Solana VM — to spin up a clean
          environment in milliseconds, inject only the accounts and programs you need, and run swaps over and over
          while measuring exchange rates and compute usage. No mainnet calls, no validator startup, no historical
          fossil. Where Delorean is an archaeologist replaying a real event, pmm-sim is a chemistry bench: fresh
          glassware every run.
        </p>
        <p style={bodyStyle}>
          The core trick is <strong style={strong}>CPI impersonation</strong>. Private AMMs identify their caller by reading
          the upstream program ID in the CPI (Cross-Program Invocation) chain. pmm-sim substitutes the program ID of
          its own router with the ID of a real aggregator — Jupiter (<code style={codeStyle}>route_v2</code>), DFlow
          (<code style={codeStyle}>swap2</code>), Titan (<code style={codeStyle}>swap_route_v2</code>), OKX Labs
          (<code style={codeStyle}>swap_v3_with_cpi_event</code>) — making the private AMM believe it is being called
          by a whitelisted entity. You can now measure, in numbers, exactly how much better the VIP price is for each
          identity, for each pool, at each size.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`let mut svm = LiteSVM::new()
    .with_default_programs()
    .with_sysvars()
    .with_sigverify(true)
    .with_compute_budget(budget);

// Inject token mints
mints.iter().for_each(|(mint, dec)| {
    svm.set_account(*mint, Misc::mk_mint_acc(*dec))
});

// Load the private AMM program from disk
svm.add_program_from_file(program_id, path_to_elf);`}
          </pre>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', letterSpacing: '0.1em' }}>
            pmm-sim env.rs — building a fresh SVM, injecting mints, loading the AMM ELF.
          </p>
        </div>

        <p style={bodyStyle}>
          The fact that you <em>can</em> do this matters for the ecosystem. Private AMMs publish their on-chain bytecode
          (you cannot deploy a Solana program without publishing the ELF) even when their off-chain pricing service is
          closed-source. pmm-sim makes &quot;what does this program actually do given input X?&quot; an empirical question
          again, instead of a leak of faith. Aggregators that integrate prop AMMs use it to validate quotes; researchers
          use it to expose pricing asymmetries; market makers use it to estimate how much edge they are giving up by
          routing through one aggregator versus another.
        </p>

        <SectionLabel>Client Diversity: Why Three Engines Beat One</SectionLabel>
        <p style={bodyStyle}>
          In March 2023, a bug in Agave caused a 4.5-hour mainnet outage. Every validator was running the same code,
          so every validator was vulnerable to the same bug. The fix had to come from one team. The chain stopped.
        </p>
        <p style={bodyStyle}>
          With Firedancer running an increasing share of mainnet stake — already past 30% by 2025 — a future similar
          bug looks different. The two implementations were written independently from the same protocol spec.
          When they agree, the network keeps moving. When they disagree, the disagreement itself is the signal: there
          is a protocol ambiguity that needs to be fixed in the spec, not in one team&apos;s codebase. This is
          <strong style={strong}> consensus diversity</strong>, and it is the same reason ATMs and aircraft systems have
          redundant computers from different vendors.
        </p>

        <div style={{ margin: '40px 0', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Team</th>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>Language</th>
                <th style={thStyle}>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Anza (Solana Labs)</td>
                <td style={tdStyle}>Agave</td>
                <td style={tdStyle}>Rust</td>
                <td style={tdStyle}>The incumbent validator. Majority of mainnet today.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Jump Crypto</td>
                <td style={tdStyle}>Firedancer / Frankendancer</td>
                <td style={tdStyle}>C</td>
                <td style={tdStyle}>The independent C reimplementation. Frankendancer is the production hybrid.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Harmonic Finance</td>
                <td style={tdStyle}>Samba</td>
                <td style={tdStyle}>C</td>
                <td style={tdStyle}>Firedancer fork with native MEV bundles. Production MEV validators.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Temporal XYZ</td>
                <td style={tdStyle}>Penrose + Delorean</td>
                <td style={tdStyle}>Rust</td>
                <td style={tdStyle}>Historical fixture service + replay client. Debugging primitive.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>LimeChain</td>
                <td style={tdStyle}>pmm-sim</td>
                <td style={tdStyle}>Rust</td>
                <td style={tdStyle}>LiteSVM benchmarking harness for private AMMs.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <blockquote style={blockquoteStyle}>
          Client diversity is not fragmentation. It is resilience. A chain where every validator runs identical code
          is a single point of failure. Multiple independent implementations catch bugs that no single team can find
          alone.
        </blockquote>

        <SectionLabel>Who Uses What, When</SectionLabel>
        <p style={bodyStyle}>
          Every project in this stack solves a different problem for a different kind of user. Before reaching for one,
          ask yourself which seat you are sitting in. Below are the eight most common ones, the tool that fits each,
          and the concrete scenario that triggers reaching for it.
        </p>

        <PersonaCard
          role="The dapp developer"
          tldr="You ship a frontend that sends transactions. Users complain when things fail."
          tool="Delorean"
          scenario="A user&apos;s Jupiter swap failed two hours ago with &quot;transaction simulation failed.&quot; The error message is unhelpful, the transaction is on-chain but not in your error tracker, and the user wants their money back. Pull the fixture from Penrose, replay it with Delorean, and read the actual SVM trace. You will know within minutes whether the failure was your code, the user&apos;s wallet, the Jupiter router, or the destination AMM."
          gotcha="Penrose is currently in alpha and only retains fixtures for a finite window. If you need history beyond that window, you must capture fixtures yourself at the time the transaction lands. Build this into your error reporter."
        />

        <PersonaCard
          role="The validator operator"
          tldr="You run validators for staking yield and want to maximize uptime and rewards."
          tool="Frankendancer (production) + Firedancer (testnet)"
          scenario="You currently run Agave. Frankendancer gives you Firedancer&apos;s networking and block-packing speed while keeping the battle-tested Agave runtime — fewer skipped slots, more vote credits, higher rewards. Run full Firedancer on testnet to be ready for the migration when the runtime hits parity."
          gotcha="Frankendancer&apos;s mainnet-readiness is moving fast but specific feature flags can lag Agave by days. Subscribe to the Firedancer release feed and do not assume parity — verify."
        />

        <PersonaCard
          role="The MEV searcher / arbitrageur"
          tldr="You write bots that capture arbitrage, sandwiches, and liquidations."
          tool="Samba bundles + Jito bundles + pmm-sim"
          scenario="You spot a $80k arbitrage between two pools that will close in one block. You need an atomic group of three transactions — open, arbitrage, close — with guaranteed ordering. Submit as a Samba bundle (or Jito bundle, depending on which leader is up) so all three either land in order or none do. Before deploying the bot, use pmm-sim to measure exactly which private AMMs price-discriminate against your router ID, and pick the aggregator that gets the best fills."
          gotcha="Bundle inclusion is not free. Tips can spike to 1–5 SOL during volatility, and a bundle rejected for any reason gives the validator information about your strategy. Model the tip auction and the leak surface together."
        />

        <PersonaCard
          role="The market maker on an on-chain CLOB"
          tldr="You quote two-sided liquidity on Phoenix, Manifest, or similar."
          tool="Samba (or Jito) for cancel bundles + Delorean for fill post-mortems"
          scenario="A taker just lifted three of your stale quotes simultaneously during a 2% price move. Your single-tx cancels were too slow. Wrap [cancel bid, cancel ask, requote bid, requote ask] in a bundle so the entire cycle is atomic — no sniper can wedge a stale fill between your cancel and your requote. After the dust settles, pull the lifted-quote transactions through Delorean to verify exactly when the taker&apos;s tx landed relative to your cancel, and tune your latency budget accordingly."
          gotcha="A bundle holds up to five transactions. If you quote on many pairs, you may need parallel bundles per leader slot. Plan capacity ahead."
        />

        <PersonaCard
          role="The aggregator / router engineer"
          tldr="You build the routing layer that decides where each swap goes."
          tool="pmm-sim + Delorean"
          scenario="You are integrating HumidiFi as a venue. Their on-chain ELF is public but the off-chain pricing service is closed. pmm-sim lets you measure their quote function in your sandbox — every CPI identity, every market, every size — and build a routing model that knows when HumidiFi will give the best fill. When a real user reports a bad fill in production, Delorean replays the exact slot to confirm whether HumidiFi gave you the same quote it promised, or whether the price moved between quote and execution."
          gotcha="Private AMMs can change their pricing logic on-chain at any time by deploying a new ELF. Re-run your pmm-sim benchmarks on a schedule, not once."
        />

        <PersonaCard
          role="The protocol developer"
          tldr="You write programs (smart contracts) that other people&apos;s capital flows through."
          tool="Delorean with --replace-program + pmm-sim"
          scenario="An exploit drains a competitor&apos;s lending protocol. You have a hypothesis about why. Pull the exploit transaction&apos;s fixture, write a patched version of the program, and use Delorean&apos;s --replace-program flag to replay the attack against your fix. If the replay succeeds (drain prevented), you have an empirical proof that your patch works against the real-world attack vector. Use pmm-sim to fuzz your own program against edge-case account states before deployment."
          gotcha="Replaying a fix tells you the patch handles that specific attack. It does not tell you the patch handles all variants. Use the replay as one of several signals, not the entire test plan."
        />

        <PersonaCard
          role="The security researcher / post-mortem investigator"
          tldr="You write the report after the protocol loses money."
          tool="Delorean + on-chain fixtures + pmm-sim for adjacent programs"
          scenario="A $4M oracle manipulation. Five protocols are affected. For each, you need a clean reconstruction of how the attack moved through the program&apos;s state machine. Delorean gives you that reconstruction with byte-exact fidelity at the slot the attack ran. The replay is the single most credible artifact you can include in a public report — anyone can re-run it themselves."
          gotcha="If the affected protocol was upgraded after the attack, pmm-sim can rebuild a clean test bench using the historical ELF. This is sometimes the only way to reproduce the pre-fix behavior once the program account has been overwritten."
        />

        <PersonaCard
          role="The student / curious engineer"
          tldr="You are learning how Solana actually works under the hood."
          tool="Read all four repos. Start with Firedancer&apos;s organization.txt."
          scenario="You want to understand consensus, networking, runtimes, MEV, and tooling — the full stack. Start with Firedancer&apos;s tree to see how a validator is laid out as physical CPU work. Read one tile in disco/ end-to-end. Then read Samba&apos;s diff against Firedancer to see what one targeted modification looks like. Then run Delorean on any random mainnet signature you find on a block explorer — you will get a working SVM replay in under a minute, with no Solana keys, no funding, no setup beyond the binary."
          gotcha="Do not start with the runtime. Start with networking. The interesting design decisions in modern blockchains are in how packets move, not in how the language executes — by the time you reach the runtime, half the design space has already been settled by the pipeline."
        />

        <SectionLabel>A Builder&apos;s Quickstart Path</SectionLabel>
        <p style={bodyStyle}>
          If you are coming in cold and want a concrete sequence to follow, this is the shortest path that produces
          something running:
        </p>

        <ol style={{ paddingLeft: 24, margin: '32px 0 48px' }}>
          {[
            ['Pick any random mainnet signature.', 'A swap, a transfer, an NFT mint — anything. Copy it from a block explorer.'],
            ['Install Delorean.', 'Clone temporal/delorean-client, cargo build --release. The binary is the only artifact you need.'],
            ['Run a replay.', 'delorean <signature> https://penrose.temporal.xyz — you have just executed a historical Solana transaction on your laptop. The output shows fixture metadata and replay outcome.'],
            ['Modify a program locally.', 'Pull the deployed ELF for any program the transaction touched. Patch it (or write a stub). Pass --replace-program to swap your ELF in. Watch what changes in the replay.'],
            ['Stand up pmm-sim.', 'Clone limechain/pmm-sim, point it at a private AMM ELF, configure a CPI identity. Run a swap. Vary the identity. Read the difference in your output WSOL.'],
            ['Read one Firedancer tile.', 'Open firedancer/src/disco/sig/fd_sig_tile.c. This is the SigVerify tile in 600 lines of C — the cleanest possible illustration of the tile pattern.'],
            ['Read the Samba diff.', 'git log against upstream Firedancer. Six commits tell the entire MEV-by-fork story.'],
          ].map(([title, body], i) => (
            <li key={i} style={{ ...bodyStyle, marginBottom: 16, paddingLeft: 8 }}>
              <strong style={{ ...strong, fontSize: '1.05em' }}>{title}</strong>{' '}
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{body}</span>
            </li>
          ))}
        </ol>

        <SectionLabel>The Bigger Picture</SectionLabel>
        <p style={bodyStyle}>
          Four teams. Four open-source repos. One observable thread: Solana is no longer one validator and one
          runtime and one debugger. It is becoming a stack where the validator layer competes on architecture, the
          MEV layer competes on guarantees, the tooling layer competes on fidelity, and the trading layer competes on
          measurement. Each project we covered started from a different question:
        </p>

        <ul style={{ paddingLeft: 24, margin: '24px 0 32px', lineHeight: 1.9, color: 'rgba(255,255,255,0.65)' }}>
          <li style={{ marginBottom: 10 }}><strong style={strong}>Firedancer</strong> — what if validators were built like HFT systems?</li>
          <li style={{ marginBottom: 10 }}><strong style={strong}>Samba</strong> — what if MEV guarantees lived in the validator, not the application layer?</li>
          <li style={{ marginBottom: 10 }}><strong style={strong}>Delorean</strong> — what if every historical transaction were replayable, perfectly, in under a second?</li>
          <li style={{ marginBottom: 10 }}><strong style={strong}>pmm-sim</strong> — what if you could measure the exact pricing edge a private market maker is giving you, before sending the trade?</li>
        </ul>

        <p style={bodyStyle}>
          The interesting answer to all four questions is the same. <em>Yes — open source, today, on a laptop.</em> That
          fact is the underlying claim Solana is making about what it can be: not just a chain that runs fast, but an
          ecosystem where the inside of the machine is visible, modifiable, and reproducible by anyone who is willing
          to read C and Rust. That is the part worth showing up for.
        </p>

        <blockquote style={blockquoteStyle}>
          The chain runs at wire speed because four different teams decided, separately, to write the machine they
          wished existed and then publish the source.
        </blockquote>

        {/* References */}
        <SectionLabel>References</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <ol style={{ paddingLeft: 28, margin: 0 }}>
            {[
              { label: 'Firedancer — Jump Crypto&apos;s C validator', href: 'https://github.com/firedancer-io/firedancer' },
              { label: 'Firedancer documentation — organization, tile model, Tango IPC', href: 'https://firedancer-io.github.io/firedancer/' },
              { label: 'Samba — Harmonic Finance&apos;s MEV fork of Firedancer', href: 'https://github.com/harmonic-finance/samba' },
              { label: 'Delorean Client — Temporal XYZ replay tool', href: 'https://github.com/temporal-xyz/delorean-client' },
              { label: 'Penrose — historical transaction fixture service (alpha)', href: 'https://penrose.temporal.xyz' },
              { label: 'pmm-sim — LimeChain&apos;s private AMM benchmarking harness', href: 'https://github.com/limechain/pmm-sim' },
              { label: 'LiteSVM — lightweight in-process Solana VM', href: 'https://github.com/LiteSVM/litesvm' },
              { label: 'Agave — the incumbent Solana validator (Anza)', href: 'https://github.com/anza-xyz/agave' },
              { label: 'Jito Labs — block engine & bundle protocol', href: 'https://docs.jito.wtf/' },
              { label: 'Solana compute budget & transaction architecture', href: 'https://solana.com/docs/core/transactions/compute' },
              { label: 'Jump Crypto on Firedancer&apos;s tile architecture', href: 'https://jumpcrypto.com/writing/firedancer-introduction/' },
              { label: 'Anza — feature flag governance & client diversity', href: 'https://www.anza.xyz/blog/firedancer-and-the-future-of-the-solana-validator' },
              { label: 'Helius — RPC infrastructure for builders (covered in The RPC Layer That Cut the Cord)', href: '/blog/rpc' },
              { label: 'The Order Book That Doesn&apos;t Break — CLOB / Jito / MEV deep-dive', href: '/blog/clob' },
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
                  dangerouslySetInnerHTML={{ __html: ref.label }}
                />
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

/* ── Persona card ── */
function PersonaCard({ role, tldr, tool, scenario, gotcha }: {
  role: string;
  tldr: string;
  tool: string;
  scenario: string;
  gotcha: string;
}) {
  return (
    <div style={{
      margin: '32px 0',
      padding: '24px 28px',
      background: 'rgba(0,255,234,0.025)',
      border: '1px solid rgba(0,255,234,0.12)',
      borderLeft: '3px solid rgba(0,255,234,0.5)',
    }}>
      <p style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase', margin: '0 0 14px' }}>
        Persona
      </p>
      <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 600, color: '#fff', letterSpacing: '0.04em', margin: '0 0 6px' }}>
        {role}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, margin: '0 0 18px', fontStyle: 'italic' }}>
        {tldr}
      </p>

      <p style={{ ...bodyStyle, marginBottom: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.3em', color: '#00ffea', textTransform: 'uppercase', marginRight: 10 }}>Tool</span>
        <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{tool}</strong>
      </p>
      <p style={{ ...bodyStyle, marginBottom: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.3em', color: '#00ffea', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Scenario</span>
        <span dangerouslySetInnerHTML={{ __html: scenario }} />
      </p>
      <p style={{ ...bodyStyle, marginBottom: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(255,200,100,0.8)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Gotcha</span>
        {gotcha}
      </p>
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

const calloutInfo: React.CSSProperties = {
  margin: '32px 0',
  padding: '22px 26px',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.1)',
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
