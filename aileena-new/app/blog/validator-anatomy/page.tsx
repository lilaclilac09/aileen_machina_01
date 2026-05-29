'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const portRows: [string, string, string, string][] = [
  ['8000', 'UDP', 'other validators', 'Gossip — peer table, vote propagation, epoch slot info'],
  ['8001', 'UDP', 'other validators', 'Gossip alt / contact info exchange'],
  ['8003', 'UDP', 'leaders', 'TPU — transaction ingress for the current leader'],
  ['8004', 'UDP', 'next leaders', 'TPU-forwards — buffer for the upcoming leader'],
  ['8005', 'QUIC', 'clients', 'TPU-quic — the modern, rate-limited ingress'],
  ['8006', 'UDP', 'other validators', 'TVU — shred ingress for replay'],
  ['8007', 'UDP', 'other validators', 'TVU-forwards'],
  ['8008', 'UDP', 'other validators', 'Repair — request missing shreds'],
  ['8009', 'UDP', 'other validators', 'Vote — vote transaction submission'],
  ['8899', 'HTTP/WS', 'clients', 'JSON-RPC — the "Solana API" everyone means'],
  ['8900', 'HTTP', 'clients', 'PubSub WebSocket'],
  ['8910', 'HTTP', 'operator', 'Admin RPC over Unix socket'],
  ['9090', 'HTTP', 'metrics', 'Prometheus exporter (if enabled)'],
];

const sourceRows: [string, string][] = [
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
    <SubstackShell
      category="Architecture"
      date="2026.05.25"
      tags="Solana · Agave · Firedancer · Geyser"
      title="Anatomy of a Solana Validator"
      dek={<>A validator looks like one process. It&apos;s really ten APIs in one binary, each talking to a different audience — searchers to the TPU, indexers to Geyser, wallets to JSON-RPC, other validators to gossip and Turbine and vote. A trace from socket to bank, and where each surface lives in the code.</>}
    >
      {/* ── Stats wall ── */}
      <StatsWall stats={[
        { value: '10', label: 'API surfaces', sub: 'one binary, audiences that never overlap' },
        { value: '400 ms', label: 'the slot budget', sub: 'receive · replay · build · fan out, or skip' },
        { value: '~50k', label: 'lines of JSON-RPC', sub: 'a separate program in all but Cargo.toml' },
        { value: '2', label: 'hops on the wire', sub: 'client→TPU, broadcast→TVU; the rest is local' },
      ]} />

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          A Solana validator looks like one process. It isn&apos;t. It&apos;s a pipeline of ten or so stages
          stitched together inside a single binary, each owning a socket and exposing a different API to a
          different audience. Searchers talk to the TPU. Indexers talk to Geyser. Wallets talk to JSON-RPC.
          Other validators talk to gossip, repair, Turbine, and the vote port. Most of those are nothing like
          the JSON-RPC people mean when they say &quot;the Solana API.&quot;
        </p>

        <SectionLabel>One binary, ten APIs</SectionLabel>
        <p style={bodyStyle}>
          When the Agave validator boots, it spins up — concurrently — a set of services that each listen on
          a distinct address. The defaults on a mainnet-beta validator with the standard layout:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Port</th>
                <th style={thStyle}>Protocol</th>
                <th style={thStyle}>Audience</th>
                <th style={thStyle}>What it is</th>
              </tr>
            </thead>
            <tbody>
              {portRows.map((r, i) => (
                <tr key={i} style={trStyle}>
                  <td style={tdLabelStyle}>{r[0]}</td>
                  <td style={tdStyle}>{r[1]}</td>
                  <td style={tdStyle}>{r[2]}</td>
                  <td style={tdStyle}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The exact numbers come from <code style={codeStyle}>--dynamic-port-range</code> and the{' '}
          <code style={codeStyle}>--rpc-port</code> family of flags — verify on your own cluster — but the
          shape of &quot;ten distinct sockets&quot; is stable across releases. Two consequences fall out
          immediately.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>First, the validator is not an RPC server with consensus glued on.</strong>{' '}
          It&apos;s the inverse: a consensus engine that happens to ship with an optional RPC server. You can
          run a validator with <code style={codeStyle}>--no-rpc</code> and it works fine; it just stops
          accepting client traffic. Most large operators do exactly this and put a separate RPC fleet — also{' '}
          <code style={codeStyle}>agave-validator</code> binaries, but with vote disabled — in front.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Second, the API everyone outside the protocol calls &quot;Solana&quot;</strong>{' '}
          — <code style={codeStyle}>getAccountInfo</code>, <code style={codeStyle}>getBalance</code>,{' '}
          <code style={codeStyle}>sendTransaction</code> — is one of the smallest, least performance-critical
          surfaces in the binary. The hot path is gossip, TPU, TVU, repair, vote. Those are the APIs that
          decide whether a block lands.
        </p>

        <SectionLabel>The pipeline a transaction takes</SectionLabel>
        <p style={bodyStyle}>
          The path of one transaction from a wallet to a confirmed slot, in stage order:
        </p>

        <Diagram caption="One transaction, socket to consensus. Only two segments touch the network.">
{`client ──tx──► JSON-RPC sendTransaction
                       │
                       ▼ forward
              TPU (current leader) ──► sigverify ─► dedup ─► banking stage
                                                                    │
                                                                    ▼ execute on a Bank
                                                          PoH service ── records tick
                                                                    │
                                                                    ▼ shred
                                                          broadcast stage ──► Turbine
                                                                              tree
                                                                              │
                                                                              ▼
                                                    other validators' TVU ──► replay
                                                                              │
                                                                              ▼
                                                                          vote ──► gossip
                                                                                   ▼
                                                                            consensus`}
        </Diagram>

        <p style={bodyStyle}>
          There are exactly two places where the transaction is on the network: client to TPU (one hop) and
          broadcast to TVU (Turbine fan-out, log(N) hops). Everything else is local to a single
          validator&apos;s process. The stages, in their real names:
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>sigverify</strong> (<code style={codeStyle}>core/src/sigverify_stage.rs</code>)
          batches incoming packets, runs Ed25519 verification on the GPU if available, and drops anything that
          fails. It&apos;s the throughput bottleneck on a saturated leader.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>banking stage</strong> (<code style={codeStyle}>core/src/banking_stage/</code>)
          is the heart of block production. It schedules verified transactions across worker threads with a
          conflict-aware scheduler (the Greedy Scheduler since Agave 1.18) and executes them against the
          current <code style={codeStyle}>Bank</code>, an in-memory snapshot of all account state for one
          slot. Transactions that write the same account serialize; everything else parallelizes.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>PoH service</strong> (<code style={codeStyle}>poh/src/poh_service.rs</code>)
          ticks SHA-256 continuously and records entries that contain transaction hashes. At the slot boundary
          it emits the final tick and the bank freezes.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>broadcast stage</strong> (<code style={codeStyle}>core/src/broadcast_stage/</code>)
          packages the entries into shreds (data shreds plus coding shreds for forward error correction) and
          sends them out via Turbine to the validator&apos;s children in the tree.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>replay stage</strong> (<code style={codeStyle}>core/src/replay_stage.rs</code>),
          on every other validator, receives shreds via TVU, re-executes the transactions against a local fork
          of the bank, and votes for the resulting block if consensus rules permit.
        </p>
        <p style={bodyStyle}>
          The whole loop has to close in 400ms — one slot — or the network skips. The expensive parts are
          sigverify (CPU/GPU bound), conflict scheduling (depends on contention), execution (depends on compute
          units), and shred propagation (depends on the network — the{' '}
          <Link href="/blog/doublezero" style={inlineLink}>DoubleZero companion piece</Link> is about why that
          last one is the actual bottleneck).
        </p>

        <SectionLabel>The TPU: where leaders get pinned</SectionLabel>
        <p style={bodyStyle}>
          The TPU — Transaction Processing Unit — is the ingress for the current slot&apos;s leader. It&apos;s
          the API a searcher cares about, because it&apos;s the only place where landing matters
          per-millisecond. There are three TPU ports, and the distinction is load-bearing:
        </p>
        <ul style={listStyle}>
          <li><strong style={strong}>TPU (UDP 8003)</strong> — legacy plain UDP, used by older clients and by validators forwarding transactions.</li>
          <li><strong style={strong}>TPU-forwards (UDP 8004)</strong> — non-leaders listen here and relay to the current leader, so a client that doesn&apos;t know the schedule can blast any validator&apos;s TPU-forwards.</li>
          <li><strong style={strong}>TPU-quic (QUIC, default 8005)</strong> — the modern path. QUIC adds connection setup (so the validator can rate-limit per identity), congestion control, and stream multiplexing; the leader can drop a noisy peer without dropping the whole flow.</li>
        </ul>
        <p style={bodyStyle}>
          The leader schedule tells you who is leader for each of the ~432,000 slots in an epoch. A searcher
          with a real shot at inclusion does this:
        </p>
        <ol style={orderedListStyle}>
          <li style={{ marginBottom: 8 }}>Fetch the leader schedule (<code style={codeStyle}>getLeaderSchedule</code> over JSON-RPC).</li>
          <li style={{ marginBottom: 8 }}>Look up the current and next ~4 leaders&apos; contact info from gossip.</li>
          <li style={{ marginBottom: 8 }}>Open QUIC connections to each of their TPU-quic ports ahead of time.</li>
          <li style={{ marginBottom: 8 }}>Send each transaction to the current leader <em>and</em> the next one or two, in parallel.</li>
          <li>Move connections as the schedule rotates.</li>
        </ol>
        <p style={bodyStyle}>
          Every serious Solana client library does some version of this —{' '}
          <code style={codeStyle}>solana-client</code>&apos;s <code style={codeStyle}>TpuClient</code>, the
          Jito bundle submitter, Helius&apos;s <code style={codeStyle}>SmartTransaction</code> — and the
          hand-rolled version is maybe 300 lines of Rust around <code style={codeStyle}>quinn</code>. The TPU
          is the only API where network latency from client to socket sits in the critical path of inclusion.
        </p>

        <SectionLabel>The TVU: where followers get blocks</SectionLabel>
        <p style={bodyStyle}>
          The TVU — Transaction Validation Unit — is the mirror of the TPU. The TPU says &quot;I am leader,
          send me transactions to include.&quot; The TVU says &quot;I am not leader, send me shreds so I can
          replay the leader&apos;s block.&quot; Shred ingress goes here:
        </p>

        <Diagram caption="Every non-leaf validator retransmits as it replays — propagation is part of the contract.">
{`TVU socket ──► shred dedup ──► shred verifier ──► retransmit ──► replay
                                                       │
                                                       ▼
                                                  other validators
                                                  (Turbine children)`}
        </Diagram>

        <p style={bodyStyle}>
          The interesting thing about TVU is <strong style={strong}>retransmit</strong>. Every non-leaf
          validator in the Turbine tree forwards the shreds it receives to its own children, in parallel with
          passing them to the replay stage. The fan-out is part of the contract — if you join the network, you
          participate in propagation; you don&apos;t get to free-ride on shreds. The TVU pairs with{' '}
          <strong style={strong}>repair</strong> (UDP 8008): if you missed a shred, you request it from a peer
          who has it. Repair is request/response, not push, and the validator throttles it aggressively,
          because under congestion it amplifies — lost shreds cause repair requests that compete with the next
          slot&apos;s shreds for bandwidth. The asymmetry is the lesson: TPU is a few clients talking to one
          server; TVU is every validator talking to every other, in a tree. TPU is QUIC over a known peer set
          with rate limiting; TVU is UDP with FEC, because retries don&apos;t fit the time budget.
        </p>

        <PullQuote>
          You design APIs differently when the receiver has 400 milliseconds and a reputation cost for missing
          one byte.
        </PullQuote>

        <SectionLabel>Gossip: the metadata API nobody calls &quot;API&quot;</SectionLabel>
        <p style={bodyStyle}>
          Gossip (UDP 8000/8001) is where every validator advertises its identity pubkey, its vote account,
          its contact info (the TPU, TVU, and RPC addresses), its current root slot, its version, its epoch
          slot info, and its votes until they make it into a block. The protocol is a CRDT: every validator
          holds a <code style={codeStyle}>ClusterInfo</code> table, every push message is a vector of{' '}
          <code style={codeStyle}>CrdsValue</code>s with timestamps, and conflicts resolve by max-timestamp.
          The push interval is 100ms; the pull interval — sync with a random peer — is 200ms.
        </p>
        <p style={bodyStyle}>
          The reason this is the &quot;real&quot; API is that{' '}
          <strong style={strong}>every other API on the validator is bootstrapped from gossip</strong>. You
          don&apos;t have a hardcoded list of validators; you join gossip, discover everyone&apos;s
          TPU/TVU/RPC addresses, and the rest of the network falls out. A new validator with one entrypoint URL
          has the full topology within about ten seconds. It also means the validator has an introspective
          API: <code style={codeStyle}>getClusterNodes</code> over JSON-RPC just dumps the local gossip table.
          And it&apos;s the extension point — to publish new validator-level metadata you don&apos;t add an RPC
          method, you add a <code style={codeStyle}>CrdsValue</code> variant and let gossip propagate it.
          That&apos;s how Jito-Solana publishes block-engine endpoints, how Firedancer published feature flags
          during its rollout, and how restart coordination works during cluster-wide upgrades.
        </p>

        <SectionLabel>JSON-RPC is a separate program in all but Cargo.toml</SectionLabel>
        <p style={bodyStyle}>
          The <code style={codeStyle}>rpc/</code> tree is roughly 50,000 lines, and it is structurally a
          different system from the consensus core. It runs in its own thread pool, holds its own snapshot of
          the bank, talks to the core through internal channels, and can be disabled with one flag — the{' '}
          <code style={codeStyle}>rpc-only</code> mode runs everything except TPU ingress and vote submission.
          The method set splits four ways:
        </p>
        <ul style={listStyle}>
          <li><strong style={strong}>Read methods</strong> (<code style={codeStyle}>getAccountInfo</code>, <code style={codeStyle}>getBalance</code>, <code style={codeStyle}>getBlock</code>, <code style={codeStyle}>getProgramAccounts</code>) hit the rooted bank or a replayed fork. <code style={codeStyle}>getProgramAccounts</code> is the one that destroys nodes — it can scan millions of accounts.</li>
          <li><strong style={strong}>Write methods</strong> — really just <code style={codeStyle}>sendTransaction</code>. The node accepts the transaction, optionally simulates it, and forwards it to the current leader&apos;s TPU. The RPC node is a postal worker, not the leader.</li>
          <li><strong style={strong}>Subscription methods</strong> (<code style={codeStyle}>accountSubscribe</code>, <code style={codeStyle}>signatureSubscribe</code>, <code style={codeStyle}>slotSubscribe</code>) run over the PubSub WebSocket (8900) and poll the bank on every commit. They work at small scale and fall apart under load; most pros bypass them.</li>
          <li><strong style={strong}>Pseudo-public state</strong> (<code style={codeStyle}>getLeaderSchedule</code>, <code style={codeStyle}>getEpochInfo</code>) — data the validator computes for its own consensus needs and happens to expose.</li>
        </ul>
        <p style={bodyStyle}>
          The thing that surprises people coming from EVM-land: JSON-RPC on Solana is not the canonical API.
          It&apos;s a convenience wrapper over a much richer internal one. Anything you can do via JSON-RPC, the
          validator does internally via direct function calls on the bank — and the bank can tell you things
          JSON-RPC simply doesn&apos;t expose. Which is why the people who care about performance bypass it
          entirely.
        </p>

        <SectionLabel>Geyser: the actual real-time API</SectionLabel>
        <p style={bodyStyle}>
          The Geyser plugin interface (<code style={codeStyle}>geyser-plugin-interface/</code>) is a Rust trait
          the validator loads at startup as a dynamic library — a <code style={codeStyle}>.so</code> on Linux.
          The trait has methods like:
        </p>

        <div style={{ margin: '32px 0 32px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`fn update_account(&mut self, account: ReplicaAccountInfoVersions, slot: Slot, is_startup: bool);
fn notify_transaction(&mut self, transaction: ReplicaTransactionInfoVersions, slot: Slot);
fn notify_block_metadata(&mut self, blockinfo: ReplicaBlockInfoVersions);
fn update_slot_status(&mut self, slot: Slot, parent: Option<Slot>, status: SlotStatus);`}
          </pre>
        </div>

        <p style={bodyStyle}>
          These get called <em>inside the validator process</em> the moment the corresponding event happens.
          Account updated during banking? <code style={codeStyle}>update_account</code> fires synchronously.
          Transaction landed? <code style={codeStyle}>notify_transaction</code> fires. New slot rooted?{' '}
          <code style={codeStyle}>update_slot_status</code>. It&apos;s the only way to get cluster events at
          full fidelity with no polling overhead: JSON-RPC&apos;s <code style={codeStyle}>accountSubscribe</code>{' '}
          polls and pushes diffs, while Geyser is handed the actual data, in-process, the moment it changes.
        </p>
        <p style={bodyStyle}>
          The standard implementation is <strong style={strong}>Yellowstone gRPC</strong> (Triton&apos;s{' '}
          <a href="https://github.com/rpcpool/yellowstone-grpc" target="_blank" rel="noopener noreferrer" style={inlineLink}>yellowstone-grpc</a>),
          which forwards everything over gRPC streams. Helius, QuickNode, Triton, and Jito all run fleets of
          validators with Yellowstone plugins and sell streaming access.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>The economic inversion</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={strong}>The JSON-RPC node has become a commodity; the Geyser node has become the
            premium product.</strong> The provider that runs the most-instrumented validator with the best
            Geyser plumbing wins the data game. JSON-RPC is for retail wallets. And the plugin interface is
            also the cleanest extension surface on the validator: ship a custom feature, like writing every
            transaction touching a program to a Kafka topic, as a 200-line crate and a config flag, no fork.
          </p>
        </div>

        <SectionLabel>Admin RPC, metrics, the operator surface</SectionLabel>
        <p style={bodyStyle}>
          Two more surfaces, both for the operator rather than the network.{' '}
          <strong style={strong}>Admin RPC</strong> runs over a Unix socket and exposes operator-only methods
          that have no business being on the network: <code style={codeStyle}>setLogFilter</code> (change log
          level live), <code style={codeStyle}>setIdentity</code> (hot-swap the validator keypair during
          failover), <code style={codeStyle}>contactInfo</code>, and <code style={codeStyle}>repairWhitelist</code>.
          The Anza failover playbook — promote a standby from non-voting to voting — is essentially a sequence
          of admin RPC calls: stop the active node, copy the tower, set the identity on the standby, restart
          with vote enabled. The binary doesn&apos;t restart for an identity swap.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Prometheus metrics</strong> live at{' '}
          <code style={codeStyle}>:9090/metrics</code> if you enabled them — thousands of timeseries covering
          replay-stage timing per slot, banking throughput, sigverify drops, gossip table size, PoH tick
          variance. The Solana Foundation publishes a Grafana dashboard library that&apos;s the de facto
          operator standard. The operator API is what turns a running validator from a black box into an
          instrumented machine; without it you cannot run one in production.
        </p>

        <SectionLabel>Firedancer: same APIs, different chassis</SectionLabel>
        <p style={bodyStyle}>
          <a href="https://docs.firedancer.io/" target="_blank" rel="noopener noreferrer" style={inlineLink}>Firedancer</a>{' '}
          is a from-scratch reimplementation of the validator in C, by Jump Crypto. It is wire-compatible with
          Agave — same gossip, Turbine, TPU, vote — but the internal architecture is unrecognizable. The model
          is <strong style={strong}>tiles</strong>: separate processes, each pinned to a CPU core,
          communicating through shared-memory ring buffers with no kernel involvement on the hot path. Each
          tile is a single-purpose state machine — net, sigverify, dedup, pack, bank, poh, shred, store.
        </p>
        <p style={bodyStyle}>
          Why it matters for the API discussion: <strong style={strong}>every API surface becomes a tile
          boundary</strong>, and tiles can be replaced independently. Want a custom sigverify tile? Drop it in.
          A custom banking scheduler? It&apos;s a tile. A tile that publishes directly into your data pipeline
          instead of the standard Geyser interface? Allowed. The current production deployment is{' '}
          <strong style={strong}>Frankendancer</strong> — Firedancer&apos;s network stack and tile
          architecture, with Agave&apos;s runtime and banking for compatibility while the Firedancer banking
          matures — and it already runs on a meaningful fraction of mainnet stake. Jump&apos;s headline TPS
          numbers are about the compute side; the network side still plays by the same Turbine rules, which
          loops right back to <Link href="/blog/doublezero" style={inlineLink}>why DoubleZero exists</Link>. A
          useful mental model: Agave is the reference implementation, Firedancer is what you&apos;d build in
          2024 with no compatibility constraints, and Frankendancer is the bridge that ships the network-layer
          wins today.
        </p>

        <SectionLabel>What this means if you&apos;re building</SectionLabel>
        <p style={bodyStyle}>Different audience, different door.</p>

        <CardGrid columns={3} cards={[
          { tag: 'Wallet', title: 'Wallet developer', body: <>JSON-RPC, via a hosted provider. If you&apos;re hitting rate limits on <code style={codeStyle}>getProgramAccounts</code>, switch to Geyser-backed indexing.</> },
          { tag: 'Searcher', title: 'Searcher / market maker', body: <>TPU-quic to the current leader and the next two or three, connections pre-warmed, schedule polled each epoch. Geyser for the mempool view. Co-locate near the leader-of-the-moment.</> },
          { tag: 'Indexer', title: 'Data product / indexer', body: <>Yellowstone Geyser on your own validators, or buy from Triton/Helius. Don&apos;t poll JSON-RPC, and decide early whether you need transaction history or live state.</> },
          { tag: 'Protocol', title: 'Protocol team', body: <>Probably no API change at all. New on-chain state lives in accounts; the only real question is whether you need a gossip extension for off-chain metadata. Usually no.</> },
          { tag: 'Operator', title: 'Validator operator', body: <>Admin RPC plus Prometheus. The question is &quot;where am I losing the slot&quot; — sigverify, replay, broadcast — and network jitter shows up in replay-stage timing.</> },
          { tag: 'Infra', title: 'Infrastructure provider', body: <>RPC, Geyser, or both — with very different hardware curves. RPC is read-heavy random IO; Geyser is write-heavy sequential. Don&apos;t combine them on one host.</> },
        ]} />

        <blockquote style={blockquoteStyle}>
          The validator&apos;s ten APIs are the natural decomposition of a state machine, a switchboard, a
          clock, a journal, and a postal service. Treating them as one thing is how you end up with the wrong
          architecture.
        </blockquote>

        <SectionLabel>Read the source</SectionLabel>
        <p style={bodyStyle}>
          For each surface above, the file that answers your question:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Surface</th>
                <th style={thStyle}>Module</th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map((r, i) => (
                <tr key={i} style={trStyle}>
                  <td style={tdLabelStyle}>{r[0]}</td>
                  <td style={tdStyle}><code style={codeStyle}>{r[1]}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The validator is reasonably approachable once you know which directory answers your question. The
          pipeline is straightforward in source; what&apos;s hard is keeping all ten APIs in your head at once.
        </p>

        <SectionLabel>References</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <ol style={{ paddingLeft: 28, margin: 0 }}>
            {references.map((ref, i) => (
              <li key={i} style={{
                fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 6,
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

        <p style={{ ...bodyStyle, marginTop: 40, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          Port numbers come from <code style={codeStyle}>agave-validator --help</code> on a stock mainnet-beta
          build — verify against the cluster version you run, since the TPU/TVU port layout and the JSON-RPC
          method set both move between releases. The transaction-flow diagram is simplified; the real path
          includes a fetch stage, an ancestor-hashes service, vote signing, and other components that
          don&apos;t change the picture but matter in code.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
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

/* ── Styles (dark inline values; substack.css re-skins them light) ── */
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

const listStyle: React.CSSProperties = {
  paddingLeft: 24,
  margin: '0 0 24px',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  letterSpacing: '0.025em',
};

const orderedListStyle: React.CSSProperties = {
  paddingLeft: 24,
  margin: '0 0 24px',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  letterSpacing: '0.025em',
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

const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationColor: 'rgba(0,255,234,0.4)',
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

/* ── Stats wall ── */
function StatsWall({ stats }: { stats: { value: string; label: string; sub?: string }[] }) {
  return (
    <div style={{
      maxWidth: 1100,
      margin: '48px auto 0',
      padding: '0 32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 1,
      background: 'rgba(0,255,234,0.12)',
      border: '1px solid rgba(0,255,234,0.18)',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: '#000',
          padding: '32px 28px',
          display: 'flex', flexDirection: 'column', gap: 8,
          position: 'relative',
        }}>
          <span style={{
            fontFamily: "'Barlow Condensed', system-ui, sans-serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 700, letterSpacing: '0.02em',
            color: '#00ffea', lineHeight: 1,
          }}>
            {s.value}
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
            marginTop: 6,
          }}>
            {s.label}
          </span>
          {s.sub && (
            <span style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.45, letterSpacing: '0.02em', marginTop: 2,
            }}>
              {s.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Card grid ── */
function CardGrid({ cards, columns = 3 }: {
  cards: { num?: string; tag: string; title: string; href?: string; body: React.ReactNode }[];
  columns?: number;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 2 ? 280 : 240}px, 1fr))`,
      gap: 14,
      margin: '32px 0 40px',
    }}>
      {cards.map((c, i) => {
        const inner = (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
              {c.num ? (
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.3em',
                  color: 'rgba(0,255,234,0.55)',
                }}>
                  {c.num}
                </span>
              ) : null}
              <span style={{
                fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.4em',
                color: '#00ffea', textTransform: 'uppercase',
              }}>
                {c.tag}
              </span>
            </div>
            <p style={{
              fontFamily: 'monospace', fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.92)', margin: '0 0 12px',
              wordBreak: 'break-word', letterSpacing: '0.01em',
            }}>
              {c.title}
            </p>
            <p style={{
              fontSize: '0.85rem', lineHeight: 1.65,
              color: 'rgba(255,255,255,0.55)', margin: 0,
              letterSpacing: '0.02em',
            }}>
              {c.body}
            </p>
          </>
        );
        const baseCardStyle: React.CSSProperties = {
          padding: '20px 22px',
          background: 'rgba(0,255,234,0.025)',
          border: '1px solid rgba(0,255,234,0.15)',
          borderTop: '2px solid rgba(0,255,234,0.5)',
          textDecoration: 'none',
          display: 'block',
          transition: 'background 0.18s, border-color 0.18s',
        };
        if (c.href) {
          return (
            <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" style={baseCardStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,255,234,0.06)';
                e.currentTarget.style.borderColor = 'rgba(0,255,234,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,255,234,0.025)';
                e.currentTarget.style.borderColor = 'rgba(0,255,234,0.15)';
              }}
            >
              {inner}
            </a>
          );
        }
        return <div key={i} style={baseCardStyle}>{inner}</div>;
      })}
    </div>
  );
}

/* ── Pull quote ── */
function PullQuote({ children, attribution }: { children: React.ReactNode; attribution?: string }) {
  return (
    <div style={{
      margin: '48px -8px',
      padding: '28px 32px 28px 28px',
      borderLeft: '3px solid #00ffea',
      background: 'linear-gradient(90deg, rgba(0,255,234,0.08), rgba(0,255,234,0.0))',
    }}>
      <p style={{
        fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)',
        lineHeight: 1.5, letterSpacing: '0.02em',
        color: 'rgba(255,255,255,0.92)', fontStyle: 'italic',
        margin: 0, fontWeight: 500,
      }}>
        &ldquo;{children}&rdquo;
      </p>
      {attribution && (
        <p style={{
          fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.3em',
          color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase',
          margin: '14px 0 0',
        }}>
          — {attribution}
        </p>
      )}
    </div>
  );
}

/* ── Diagram frame (wraps ASCII as a visual figure) ── */
function Diagram({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <figure style={{ margin: '40px 0 48px' }}>
      <div style={{
        padding: '4px',
        background: 'linear-gradient(135deg, rgba(0,255,234,0.25), rgba(0,255,234,0.04))',
      }}>
        <div style={{
          background: '#000',
          padding: '28px 32px',
          overflowX: 'auto',
          boxShadow: 'inset 0 0 40px rgba(0,255,234,0.05)',
        }}>
          <pre style={{
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            {children}
          </pre>
        </div>
      </div>
      {caption && (
        <figcaption style={{
          fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
          margin: '10px 0 0', textAlign: 'left',
        }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
