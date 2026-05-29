'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { c, s, PullQuote, Aside, Sources } from '../essayStyle';

const portRows: [string, string, string, string][] = [
  ['8000', 'UDP', 'other validators', 'Gossip — peer table, vote propagation, epoch slot info'],
  ['8001', 'UDP', 'other validators', 'Gossip alt / contact info exchange'],
  ['8003', 'UDP', 'leaders', 'TPU — transaction ingress for the current leader'],
  ['8004', 'UDP', 'next leaders', 'TPU-forwards — buffer for the upcoming leader'],
  ['8005', 'QUIC', 'clients', 'TPU-quic — the modern, rate-limited ingress'],
  ['8006', 'UDP', 'other validators', 'TVU — shred ingress for replay'],
  ['8008', 'UDP', 'other validators', 'Repair — request missing shreds'],
  ['8009', 'UDP', 'other validators', 'Vote — vote transaction submission'],
  ['8899', 'HTTP/WS', 'clients', 'JSON-RPC — the "Solana API" everyone means'],
  ['8900', 'HTTP', 'clients', 'PubSub WebSocket'],
  ['8910', 'HTTP', 'operator', 'Admin RPC over Unix socket'],
  ['9090', 'HTTP', 'metrics', 'Prometheus exporter (if enabled)'],
];

const sourceFiles: [string, string][] = [
  ['TPU', 'core/src/tpu.rs · streamer/src/quic.rs'],
  ['Banking stage', 'core/src/banking_stage/'],
  ['PoH', 'poh/src/poh_recorder.rs · poh/src/poh_service.rs'],
  ['Broadcast', 'core/src/broadcast_stage/'],
  ['TVU', 'core/src/tvu.rs · core/src/window_service.rs'],
  ['Replay', 'core/src/replay_stage.rs'],
  ['Gossip', 'gossip/src/cluster_info.rs · gossip/src/crds.rs'],
  ['Repair', 'core/src/repair/'],
  ['JSON-RPC', 'rpc/src/rpc.rs · rpc/src/rpc_service.rs'],
  ['Geyser', 'geyser-plugin-interface/src/geyser_plugin_interface.rs'],
  ['Admin RPC', 'validator/src/admin_rpc_service.rs'],
];

const references = [
  { label: 'Agave validator source tree — anza-xyz/agave', href: 'https://github.com/anza-xyz/agave' },
  { label: 'Anza — validator operator documentation', href: 'https://docs.anza.xyz/' },
  { label: 'Geyser plugin interface (Agave subtree)', href: 'https://github.com/anza-xyz/agave/tree/master/geyser-plugin-interface' },
  { label: 'Yellowstone gRPC — Triton / rpcpool', href: 'https://github.com/rpcpool/yellowstone-grpc' },
  { label: 'Firedancer architecture docs (Jump Crypto)', href: 'https://docs.firedancer.io/' },
  { label: 'Firedancer net_tile internals', href: 'https://docs.firedancer.io/guide/internals/net_tile.html' },
  { label: 'DoubleZero, Multicast Fiber — why the wire is the real bottleneck (companion piece)', href: '/blog/doublezero' },
  { label: 'The Wire — How Solana Actually Moves Bytes (companion piece)', href: '/blog/wire' },
];

export default function ValidatorAnatomyArticle() {
  return (
    <div style={s.page}>
      <ScrollUnlock />

      <header style={s.topBar}>
        <Link href="/#blog" style={s.topLink}
          onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = c.muted)}
        >
          ← Archive
        </Link>
        <span style={s.siteName}>Aileena Machina</span>
      </header>

      <article style={s.container}>
        <p style={s.kicker}>Architecture · May 25, 2026 · 11 min read</p>
        <h1 style={s.h1}>Anatomy of a Solana Validator</h1>
        <p style={s.dek}>
          A validator looks like one process. It&apos;s really ten APIs in one binary, each talking to a
          different audience — searchers, indexers, wallets, other validators. A trace from socket to bank.
        </p>

        <hr style={s.rule} />

        <p style={s.lead}>
          A Solana validator looks like one process. It isn&apos;t. It&apos;s a pipeline of ten or so stages
          stitched together inside a single binary, each owning a socket and exposing a different API to a
          different audience. Searchers talk to the TPU. Indexers talk to Geyser. Wallets talk to JSON-RPC.
          Other validators talk to gossip, repair, Turbine, and the vote port. Most of those are nothing like
          the JSON-RPC people mean when they say &quot;the Solana API.&quot;
        </p>

        <h2 style={s.h2}>One binary, ten APIs</h2>
        <p style={s.body}>
          When the Agave validator boots, it spins up — concurrently — a set of services that each listen on
          a distinct address. The defaults on a mainnet-beta validator with the standard layout:
        </p>

        <div style={{ margin: '2em 0', overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Port</th>
                <th style={s.th}>Protocol</th>
                <th style={s.th}>Audience</th>
                <th style={s.th}>What it is</th>
              </tr>
            </thead>
            <tbody>
              {portRows.map((r, i) => (
                <tr key={i}>
                  <td style={s.tdLabel}>{r[0]}</td>
                  <td style={s.td}>{r[1]}</td>
                  <td style={s.td}>{r[2]}</td>
                  <td style={s.td}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={s.body}>
          The exact numbers come from <code style={s.code}>--dynamic-port-range</code> and the{' '}
          <code style={s.code}>--rpc-port</code> family of flags — verify on your own cluster — but the shape
          of &quot;ten distinct sockets&quot; is stable across releases. Two consequences fall out
          immediately. <strong style={s.strong}>First, the validator is not an RPC server with consensus
          glued on.</strong> It&apos;s the inverse: a consensus engine that happens to ship with an optional
          RPC server. You can run a validator with <code style={s.code}>--no-rpc</code> and it works fine; it
          just stops accepting client traffic. Most large operators do exactly this and put a separate RPC
          fleet — also <code style={s.code}>agave-validator</code> binaries, but with vote disabled — in
          front.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>Second, the API everyone outside the protocol calls &quot;Solana&quot;</strong>{' '}
          — <code style={s.code}>getAccountInfo</code>, <code style={s.code}>getBalance</code>,{' '}
          <code style={s.code}>sendTransaction</code> — is one of the smallest, least performance-critical
          surfaces in the binary. The hot path is gossip, TPU, TVU, repair, vote. Those are the APIs that
          decide whether a block lands.
        </p>

        <h2 style={s.h2}>The pipeline a transaction takes</h2>
        <p style={s.body}>
          The path of one transaction from a wallet to a confirmed slot, in stage order:
        </p>
        <ol style={s.list}>
          <li style={s.li}><strong style={s.strong}>JSON-RPC sendTransaction</strong> accepts it and forwards it to the current leader&apos;s TPU.</li>
          <li style={s.li}><strong style={s.strong}>sigverify</strong> batches incoming packets, runs Ed25519 verification on the GPU if available, and drops anything that fails. It&apos;s the bottleneck on a saturated leader.</li>
          <li style={s.li}><strong style={s.strong}>banking stage</strong> schedules verified transactions across worker threads with a conflict-aware scheduler (the Greedy Scheduler since Agave 1.18) and executes them against the current <code style={s.code}>Bank</code>. Transactions that write the same account serialize; the rest parallelize.</li>
          <li style={s.li}><strong style={s.strong}>PoH service</strong> ticks SHA-256 continuously and records entries containing transaction hashes. At the slot boundary the bank freezes.</li>
          <li style={s.li}><strong style={s.strong}>broadcast stage</strong> packages entries into shreds (data plus coding shreds for error correction) and sends them via Turbine to the validator&apos;s children in the tree.</li>
          <li style={s.li}><strong style={s.strong}>replay stage</strong>, on every other validator, receives shreds over TVU, re-executes the transactions against a local fork of the bank, and votes if consensus rules permit.</li>
        </ol>
        <p style={s.body}>
          There are exactly two places where the transaction is on the network: client to TPU (one hop) and
          broadcast to TVU (Turbine fan-out, log(N) hops). Everything else is local to a single
          validator&apos;s process. The whole loop has to close in 400 ms — one slot — or the network skips.
          The expensive parts are sigverify (CPU/GPU bound), conflict scheduling (depends on contention),
          execution (depends on compute units), and shred propagation (depends on the network — the{' '}
          <Link href="/blog/doublezero" style={s.link}>DoubleZero companion piece</Link> is about why that
          last one is the actual bottleneck).
        </p>

        <h2 style={s.h2}>The TPU: where leaders get pinned</h2>
        <p style={s.body}>
          The TPU — Transaction Processing Unit — is the ingress for the current slot&apos;s leader. It&apos;s
          the API a searcher cares about, because it&apos;s the only place where landing matters
          per-millisecond. There are three TPU ports, and the distinction is load-bearing:
        </p>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>TPU (UDP 8003)</strong> — legacy plain UDP, used by older clients and by validators forwarding transactions.</li>
          <li style={s.li}><strong style={s.strong}>TPU-forwards (UDP 8004)</strong> — non-leaders listen here and relay to the current leader, so a client that doesn&apos;t know the schedule can blast any validator&apos;s TPU-forwards.</li>
          <li style={s.li}><strong style={s.strong}>TPU-quic (QUIC 8005)</strong> — the modern path. QUIC adds connection setup (so the validator can rate-limit per identity), congestion control, and stream multiplexing; the leader can drop a noisy peer without dropping the whole flow. Serious clients use it.</li>
        </ul>
        <p style={s.body}>
          The leader schedule tells you who is leader for each of the ~432,000 slots in an epoch. A searcher
          with a real shot at inclusion fetches the schedule with <code style={s.code}>getLeaderSchedule</code>,
          looks up the current and next four leaders&apos; contact info from gossip, opens QUIC connections to
          their TPU-quic ports ahead of time, sends each transaction to the current leader and the next one or
          two in parallel, and rotates connections as the schedule advances. Every serious client library does
          some version of this — <code style={s.code}>solana-client</code>&apos;s{' '}
          <code style={s.code}>TpuClient</code>, the Jito bundle submitter, Helius&apos;s{' '}
          <code style={s.code}>SmartTransaction</code> — and the hand-rolled version is maybe 300 lines of Rust
          around <code style={s.code}>quinn</code>. The TPU is the only API where network latency from client
          to socket sits in the critical path of inclusion.
        </p>

        <h2 style={s.h2}>The TVU: where followers get blocks</h2>
        <p style={s.body}>
          The TVU — Transaction Validation Unit — is the mirror of the TPU. The TPU says &quot;I am leader,
          send me transactions to include.&quot; The TVU says &quot;I am not leader, send me shreds so I can
          replay the leader&apos;s block.&quot; Shred ingress arrives at the socket, gets deduplicated and
          verified, then is retransmitted and replayed.
        </p>
        <p style={s.body}>
          The interesting thing about TVU is <strong style={s.strong}>retransmit</strong>. Every non-leaf
          validator in the Turbine tree forwards the shreds it receives to its own children, in parallel with
          passing them to the replay stage. The fan-out is part of the contract — if you join the network, you
          participate in propagation; you don&apos;t get to free-ride on shreds. The TVU pairs with{' '}
          <strong style={s.strong}>repair</strong> (UDP 8008): if you missed a shred, you request it from a
          peer who has it. Repair is request/response, not push, and the validator throttles it aggressively,
          because under congestion it amplifies — lost shreds cause repair requests that compete with the next
          slot&apos;s shreds for bandwidth. The asymmetry is the lesson: TPU is a few clients talking to one
          server; TVU is every validator talking to every other, in a tree. TPU is QUIC over a known peer set
          with rate limiting; TVU is UDP with forward error correction, because retries don&apos;t fit the time
          budget.
        </p>

        <PullQuote>
          You design APIs differently when the receiver has 400 milliseconds and a reputation cost for missing
          one byte.
        </PullQuote>

        <h2 style={s.h2}>Gossip: the metadata API nobody calls &quot;API&quot;</h2>
        <p style={s.body}>
          Gossip (UDP 8000/8001) is where every validator advertises its identity pubkey, its vote account,
          its contact info (the TPU, TVU, and RPC addresses), its current root slot, its version, its epoch
          slot info, and its votes until they make it into a block. The protocol is a CRDT: every validator
          holds a <code style={s.code}>ClusterInfo</code> table, every push message is a vector of{' '}
          <code style={s.code}>CrdsValue</code>s with timestamps, and conflicts resolve by max-timestamp. The
          push interval is 100 ms; the pull interval — sync with a random peer — is 200 ms.
        </p>
        <p style={s.body}>
          The reason this is the &quot;real&quot; API is that{' '}
          <strong style={s.strong}>every other API on the validator is bootstrapped from gossip</strong>. You
          don&apos;t have a hardcoded list of validators; you join gossip, discover everyone&apos;s
          TPU/TVU/RPC addresses, and the rest of the network falls out. A new validator with one entrypoint URL
          has the full topology within about ten seconds. It also means the validator has an introspective API:{' '}
          <code style={s.code}>getClusterNodes</code> over JSON-RPC just dumps the local gossip table. And it&apos;s
          the extension point — to publish a new piece of validator-level metadata you don&apos;t add an RPC
          method, you add a <code style={s.code}>CrdsValue</code> variant and let gossip propagate it. That&apos;s
          how Jito-Solana publishes block-engine endpoints, how Firedancer published feature flags during its
          rollout, and how restart coordination works during cluster-wide upgrades.
        </p>

        <h2 style={s.h2}>JSON-RPC is a separate program in all but Cargo.toml</h2>
        <p style={s.body}>
          The <code style={s.code}>rpc/</code> tree is roughly 50,000 lines, and it is structurally a different
          system from the consensus core. It runs in its own thread pool, holds its own snapshot of the bank,
          talks to the core through internal channels, and can be disabled with one flag — the{' '}
          <code style={s.code}>rpc-only</code> mode runs everything except TPU ingress and vote submission. The
          method set splits four ways:
        </p>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>Read methods</strong> (<code style={s.code}>getAccountInfo</code>, <code style={s.code}>getBalance</code>, <code style={s.code}>getBlock</code>, <code style={s.code}>getProgramAccounts</code>) hit the rooted bank or a replayed fork. <code style={s.code}>getProgramAccounts</code> is the one that destroys nodes — it can scan millions of accounts.</li>
          <li style={s.li}><strong style={s.strong}>Write methods</strong> — really just <code style={s.code}>sendTransaction</code>. The node accepts the transaction, optionally simulates it, and forwards it to the current leader&apos;s TPU. The RPC node is a postal worker, not the leader.</li>
          <li style={s.li}><strong style={s.strong}>Subscription methods</strong> (<code style={s.code}>accountSubscribe</code>, <code style={s.code}>signatureSubscribe</code>, <code style={s.code}>slotSubscribe</code>) run over the PubSub WebSocket (8900) and poll the bank on every commit. They work at small scale and fall apart under load; most pros bypass them.</li>
          <li style={s.li}><strong style={s.strong}>Pseudo-public state</strong> (<code style={s.code}>getLeaderSchedule</code>, <code style={s.code}>getEpochInfo</code>) — data the validator computes for its own consensus needs and happens to expose.</li>
        </ul>
        <p style={s.body}>
          The thing that surprises people coming from EVM-land: JSON-RPC on Solana is not the canonical API.
          It&apos;s a convenience wrapper over a much richer internal one. Anything you can do via JSON-RPC, the
          validator does internally via direct function calls on the bank — and the bank can tell you things
          JSON-RPC simply doesn&apos;t expose. Which is why the people who care about performance bypass it
          entirely.
        </p>

        <h2 style={s.h2}>Geyser: the actual real-time API</h2>
        <p style={s.body}>
          The Geyser plugin interface is a Rust trait the validator loads at startup as a dynamic library — a{' '}
          <code style={s.code}>.so</code> on Linux. Its methods get called <em>inside the validator
          process</em> the moment the corresponding event happens:
        </p>
        <ul style={s.list}>
          <li style={s.li}><code style={s.code}>update_account</code> fires synchronously when an account changes during banking.</li>
          <li style={s.li}><code style={s.code}>notify_transaction</code> fires when a transaction lands.</li>
          <li style={s.li}><code style={s.code}>notify_block_metadata</code> hands over block-level info.</li>
          <li style={s.li}><code style={s.code}>update_slot_status</code> fires as a slot is processed, confirmed, and rooted.</li>
        </ul>
        <p style={s.body}>
          This is the API that powers every serious indexer, every MEV stack&apos;s mempool view, every modern
          data product on Solana. It&apos;s the only way to get cluster events at full fidelity with no polling
          overhead: JSON-RPC&apos;s <code style={s.code}>accountSubscribe</code> polls and pushes diffs, while
          Geyser is handed the actual data, in-process, the moment it changes. The standard implementation is{' '}
          <strong style={s.strong}>Yellowstone gRPC</strong> (Triton&apos;s{' '}
          <a href="https://github.com/rpcpool/yellowstone-grpc" target="_blank" rel="noopener noreferrer" style={s.link}>yellowstone-grpc</a>),
          which forwards everything over gRPC streams. Helius, QuickNode, Triton, and Jito all run fleets of
          validators with Yellowstone plugins and sell streaming access.
        </p>

        <Aside label="The economic inversion">
          <strong style={s.strong}>The JSON-RPC node has become a commodity; the Geyser node has become the
          premium product.</strong> The provider that runs the most-instrumented validator with the best
          Geyser plumbing wins the data game. JSON-RPC is for retail wallets. The money is in the in-process
          firehose — and the plugin interface is also the cleanest extension surface on the validator: ship a
          custom feature, like writing every transaction touching a program to a Kafka topic, as a 200-line
          crate and a config flag, no fork required.
        </Aside>

        <h2 style={s.h2}>Admin RPC, metrics, the operator surface</h2>
        <p style={s.body}>
          Two more surfaces, both for the operator rather than the network.{' '}
          <strong style={s.strong}>Admin RPC</strong> runs over a Unix socket and exposes operator-only methods
          that have no business being on the network: <code style={s.code}>setLogFilter</code> (change log
          level live), <code style={s.code}>setIdentity</code> (hot-swap the validator keypair during
          failover), <code style={s.code}>contactInfo</code>, and <code style={s.code}>repairWhitelist</code>.
          The Anza failover playbook — promote a standby from non-voting to voting — is essentially a sequence
          of admin RPC calls: stop the active node, copy the tower, set the identity on the standby, restart
          with vote enabled. The binary doesn&apos;t restart for an identity swap.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>Prometheus metrics</strong> live at{' '}
          <code style={s.code}>:9090/metrics</code> if you enabled them — thousands of timeseries covering
          replay-stage timing per slot, banking throughput, sigverify drops, gossip table size, PoH tick
          variance. The Solana Foundation publishes a Grafana dashboard library that&apos;s the de facto
          operator standard. The operator API is what turns a running validator from a black box into an
          instrumented machine; without it you cannot run one in production.
        </p>

        <h2 style={s.h2}>Firedancer: same APIs, different chassis</h2>
        <p style={s.body}>
          <a href="https://docs.firedancer.io/" target="_blank" rel="noopener noreferrer" style={s.link}>Firedancer</a>{' '}
          is a from-scratch reimplementation of the validator in C, by Jump Crypto. It is wire-compatible with
          Agave — same gossip, Turbine, TPU, vote — but the internal architecture is unrecognizable. The model
          is <strong style={s.strong}>tiles</strong>: separate processes, each pinned to a CPU core,
          communicating through shared-memory ring buffers with no kernel involvement on the hot path. Each
          tile is a single-purpose state machine — net, sigverify, dedup, pack, bank, poh, shred, store.
        </p>
        <p style={s.body}>
          Why it matters for the API discussion: <strong style={s.strong}>every API surface becomes a tile
          boundary</strong>, and tiles can be replaced independently. Want a custom sigverify tile? Drop it in.
          A custom banking scheduler? It&apos;s a tile. A tile that publishes directly into your data pipeline
          instead of the standard Geyser interface? Allowed. The current production deployment is{' '}
          <strong style={s.strong}>Frankendancer</strong> — Firedancer&apos;s network stack and tile
          architecture, with Agave&apos;s runtime and banking for compatibility while the Firedancer banking
          matures — and it already runs on a meaningful fraction of mainnet stake. Jump&apos;s headline TPS
          numbers are about the compute side; the network side still plays by the same Turbine rules, which
          loops right back to <Link href="/blog/doublezero" style={s.link}>why DoubleZero exists</Link>. A
          useful mental model: Agave is the reference implementation, Firedancer is what you&apos;d build in
          2024 with no compatibility constraints, and Frankendancer is the bridge that ships the network-layer
          wins today.
        </p>

        <h2 style={s.h2}>What this means if you&apos;re building</h2>
        <p style={s.body}>Different audience, different door.</p>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>Wallet developer.</strong> JSON-RPC, via a hosted provider. If you&apos;re hitting rate limits on <code style={s.code}>getProgramAccounts</code>, switch to Geyser-backed indexing.</li>
          <li style={s.li}><strong style={s.strong}>Searcher / market maker.</strong> TPU-quic to the current leader and the next two or three, connections pre-warmed, schedule polled each epoch. Geyser for the mempool view. Co-locate near the leader-of-the-moment.</li>
          <li style={s.li}><strong style={s.strong}>Data product / indexer.</strong> Yellowstone Geyser on your own validators, or buy from Triton/Helius. Don&apos;t poll JSON-RPC, and decide early whether you need transaction history or live state.</li>
          <li style={s.li}><strong style={s.strong}>Protocol team.</strong> Probably no API change at all. New on-chain state lives in accounts; the only real question is whether you need a gossip extension for off-chain metadata. Usually no.</li>
          <li style={s.li}><strong style={s.strong}>Validator operator.</strong> Admin RPC plus Prometheus. The question is &quot;where am I losing the slot&quot; — sigverify, replay, broadcast — and network jitter shows up in replay-stage timing.</li>
          <li style={s.li}><strong style={s.strong}>Infrastructure provider.</strong> RPC, Geyser, or both — with very different hardware curves. RPC is read-heavy random IO; Geyser is write-heavy sequential. Don&apos;t combine them on one host.</li>
        </ul>

        <blockquote style={s.blockquote}>
          The validator&apos;s ten APIs are the natural decomposition of a state machine, a switchboard, a
          clock, a journal, and a postal service. Treating them as one thing is how you end up with the wrong
          architecture.
        </blockquote>

        <h2 style={s.h2}>Read the source</h2>
        <p style={s.body}>
          For each surface above, the file that answers your question:
        </p>
        <ul style={s.list}>
          {sourceFiles.map((r, i) => (
            <li key={i} style={s.li}>
              <strong style={s.strong}>{r[0]}</strong> — <code style={s.code}>{r[1]}</code>
            </li>
          ))}
        </ul>
        <p style={s.body}>
          The validator is reasonably approachable once you know which directory answers your question. The
          pipeline is straightforward in source; what&apos;s hard is keeping all ten APIs in your head at once.
        </p>

        <hr style={s.rule} />

        <h2 style={{ ...s.h2, fontSize: '1.2rem', marginTop: '1.6em' }}>Sources</h2>
        <Sources items={references} />

        <p style={s.note}>
          Port numbers come from <code style={s.code}>agave-validator --help</code> on a stock mainnet-beta
          build — verify against the cluster version you run, since the TPU/TVU port layout and the JSON-RPC
          method set both move between releases. The transaction-flow is simplified; the real path includes a
          fetch stage, an ancestor-hashes service, vote signing, and other components that don&apos;t change
          the picture but matter in code.
        </p>

        <div style={{ marginTop: '3em' }}>
          <Link href="/#blog" style={s.topLink}
            onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = c.muted)}
          >
            ← Back to Archive
          </Link>
        </div>
      </article>
    </div>
  );
}
