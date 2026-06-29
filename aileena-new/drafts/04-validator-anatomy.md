# Anatomy of a Solana Validator: The Pipeline and the API Surface

> Draft — 2026.05.25. Claims here trace to the Agave source tree (`agave/core/`, `agave/rpc/`, `agave/gossip/`), the Anza validator docs, the Geyser plugin interface, and the Firedancer architecture notes. Verify against `agave --version` matching the cluster you care about before publishing — the TPU/TVU port layout and the JSON-RPC method set both move between releases.

A Solana validator looks like one process. It isn't. It's a pipeline of ten or so stages stitched together inside a single binary, each owning a UDP socket or a TCP listener or a Unix-domain channel, each exposing a different "API" to a different audience. The audiences don't overlap. Searchers talk to the TPU. Indexers talk to Geyser. Wallets talk to JSON-RPC. Other validators talk to gossip, repair, Turbine, and the vote port. Operators talk to the admin RPC and the metrics endpoint. Each of those is a real protocol with a real schema, and most of them are nothing like the JSON-RPC people mean when they say "the Solana API."

This is the version that distinguishes them all, traces the path of a transaction from socket to bank, and shows where each API surface actually lives in the binary.

---

## 1. One binary, ten APIs

When the Agave validator boots, it spins up — concurrently — a set of services that each listen on a distinct address. The defaults, on a mainnet-beta validator with the standard layout:

| Port (default) | Protocol | Audience | What it is |
|---|---|---|---|
| 8000 | UDP | other validators | Gossip — peer table, vote propagation, epoch slot info |
| 8001 | UDP | other validators | Gossip alt / contact info exchange |
| 8003 | UDP | leaders | TPU — transaction ingress for the current leader |
| 8004 | UDP | next leaders | TPU-forwards — buffer for the upcoming leader |
| 8005 | QUIC | clients | TPU-quic — the modern, rate-limited ingress |
| 8006 | UDP | other validators | TVU — shred ingress for replay |
| 8007 | UDP | other validators | TVU-forwards |
| 8008 | UDP | other validators | Repair — request missing shreds |
| 8009 | UDP | other validators | Vote — vote transaction submission |
| 8899 | HTTP/WS | clients | JSON-RPC — the "Solana API" everyone means |
| 8900 | HTTP | clients | PubSub WebSocket |
| 8910 | HTTP | operator | Admin RPC over Unix socket |
| 9090 | HTTP | metrics | Prometheus exporter (if enabled) |

The exact numbers come from `--dynamic-port-range` and the `--rpc-port` family of flags — verify on your cluster — but the *shape* of "ten distinct sockets" is stable across releases.

Two consequences fall out of this immediately.

**First**, the validator is not "an RPC server with consensus glued on." It's the inverse: a consensus engine that happens to ship with an optional RPC server. You can run a validator with `--no-rpc` and it works fine; it just stops accepting client traffic. Most large operators do exactly this and put a separate RPC fleet (also `agave-validator` binaries, but with vote disabled) in front. The split is structural, not optional ornamentation.

**Second**, the API everyone outside the protocol thinks of as "Solana" — `getAccountInfo`, `getBalance`, `sendTransaction` — is one of the smallest, least performance-critical surfaces in the binary. The hot path is gossip, TPU, TVU, repair, vote. Those are the APIs that decide whether a block lands.

---

## 2. The pipeline a transaction takes

The path of one transaction from a wallet to a confirmed slot, in stage order:

```
client ──tx──► JSON-RPC sendTransaction
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
                                                                            consensus
```

There are exactly two places where the transaction is on the network: client→TPU (one hop) and broadcast→TVU (Turbine fan-out, log(N) hops). Everything else is local to a single validator's process.

The stages, in real names:

**sigverify** — `core/src/sigverify_stage.rs`. Batches incoming packets, runs Ed25519 verification on the GPU if available, drops anything that fails. Throughput-critical; the bottleneck on a saturated leader. Anything that gets past sigverify is at minimum a structurally-valid signed transaction.

**banking stage** — `core/src/banking_stage/`. This is the heart of block production. It takes verified transactions, schedules them across worker threads using a conflict-aware scheduler (the Greedy Scheduler, since Agave 1.18; previously the Threaded Scheduler), and executes them against the current `Bank` (an in-memory snapshot of all account state for one slot). Conflicting transactions — same writable account — serialize; non-conflicting ones parallelize.

**PoH service** — `poh/src/poh_service.rs`. Runs continuously, ticking SHA-256 at a fixed rate, "recording" entries that contain transaction hashes. The PoH stream is the timeline; the banking stage hands it batches of executed transactions to record. When a slot boundary arrives, PoH emits the final tick and the bank gets frozen.

**broadcast stage** — `core/src/broadcast_stage/`. Takes the entries from PoH, packages them into shreds (data shreds + coding shreds for FEC), and sends them out via Turbine to the validator's children in the tree.

**replay stage** — `core/src/replay_stage.rs`. On every other validator: receives shreds via TVU, reassembles entries, re-executes the transactions against a local fork of the bank, votes for the resulting block if consensus rules permit.

The whole loop has to close in 400ms (one slot) or the network skips. The expensive parts are sigverify (CPU/GPU bound, ~5-10ms for a full batch), conflict scheduling (depends on contention), execution (depends on compute units), and shred propagation (depends on network — see DoubleZero post for why this is the actual bottleneck).

---

## 3. The TPU: where leaders get pinned

The TPU — Transaction Processing Unit — is the ingress for the current slot's leader. It's the API a searcher cares about, because it's the only place where landing matters per-millisecond.

There are three TPU ports, and the distinction is load-bearing:

- **TPU (UDP 8003)** — legacy, plain UDP. Still listening; mostly used by older clients and by other validators forwarding transactions.
- **TPU-forwards (UDP 8004)** — non-leaders listen here and forward to the current leader. A client that doesn't know the leader schedule can blast to any validator's TPU-forwards and get its transaction relayed.
- **TPU-quic (QUIC, default 8005)** — the modern path. QUIC adds connection establishment (so the validator can rate-limit per identity), congestion control, and stream multiplexing. The leader can drop packets from a noisy peer without dropping the whole flow. Since the 1.14 / QUIC rollout, this is the path serious clients use.

The leader schedule tells you who's leader for each of the next ~432,000 slots in an epoch. A searcher with a real shot at inclusion does this:

1. Fetch the leader schedule (`getLeaderSchedule` JSON-RPC).
2. Look up the current and next ~4 leaders' contact info from gossip.
3. Open QUIC connections to each of their TPU-quic ports ahead of time.
4. When a transaction is ready, send to the current leader *and* the next 1–2, in parallel.
5. Move connections as the schedule rotates.

Every serious Solana client library does some version of this — `solana-client`'s `TpuClient`, the Jito bundle submitter, Helius's `SmartTransaction`. The hand-rolled version is maybe 300 lines of Rust around `quinn`.

The TPU is the only API in the validator where the network latency from client to socket is in the critical path of transaction inclusion. Everything else either (a) doesn't care about latency at sub-second resolution or (b) is internal.

---

## 4. The TVU: where followers get blocks

The TVU — Transaction Validation Unit — is the mirror of the TPU. The TPU is "I am leader, send me transactions to include." The TVU is "I am not leader, send me shreds so I can replay the leader's block."

Shred ingress goes here. The TVU stage pipeline:

```
TVU socket ──► shred dedup ──► shred verifier ──► retransmit ──► replay
                                                       │
                                                       ▼
                                                  other validators
                                                  (Turbine children)
```

The interesting thing about TVU is **retransmit**. Every non-leaf validator in the Turbine tree forwards the shreds it receives to its own children, in parallel with passing them to the replay stage. The fan-out is part of the TVU's contract — if you join the network, you participate in propagation; you don't get to free-ride on shreds.

The TVU pairs with **repair** (UDP 8008). If you missed a shred — packet loss, dropped from the tree, joined late — you send a repair request to a peer who has it. Repair is request/response, not push, and the validator throttles it aggressively because under congestion it amplifies (lost shreds cause repair requests that compete with the next slot's shreds for bandwidth).

The asymmetry between TPU and TVU is interesting from an API-design view. TPU is a small number of *clients* (searchers, wallets, relayers) talking to one *server* (the current leader). TVU is *every validator* talking to *every other validator*, in a tree. TPU is QUIC over a known-peer-set with rate limiting; TVU is UDP with FEC because retries don't fit in the time budget.

You design APIs differently when the receiver has 400ms and a reputation cost for missing one byte.

---

## 5. Gossip: the metadata API nobody calls "API"

Gossip (UDP 8000/8001) is where every validator advertises:

- Its identity pubkey
- Its vote account
- Its contact info (TPU, TVU, RPC port addresses)
- Its current root slot
- Its version
- Its epoch slot info
- Its votes (until they make it into a block)

The gossip protocol is a CRDT — every validator holds a `ClusterInfo` table, every push message is a vector of `CrdsValue`s with timestamps, and conflicts resolve by max-timestamp. The push interval is 100ms; the pull interval (sync with a random peer) is 200ms.

The reason this is the "real" API is that **every other API on the validator is bootstrapped from gossip**. You don't have a hardcoded list of validators. You join gossip, you discover everyone's TPU/TVU/RPC addresses, and the rest of the network falls out. A new validator with one entrypoint URL has, within ~10 seconds, the full topology.

It also means the validator has an *introspective* API: `getClusterNodes` over JSON-RPC just dumps the local gossip table. Anything you can see about the cluster from outside is, ultimately, gossip data exposed through a different surface.

This matters for protocol design. Want to publish a new piece of validator-level metadata? You don't add an RPC method. You add a `CrdsValue` variant and let gossip propagate it. That's how Jito-Solana publishes block engine endpoints, how Firedancer published feature flags during the rollout, how restart coordination works during cluster-wide upgrades. Gossip is the extension point.

---

## 6. The JSON-RPC layer is a separate program in everything but `Cargo.toml`

`jsonrpc/` in the Agave tree is ~50,000 lines of code. It is, structurally, a different system from the consensus core. It runs in its own thread pool, holds its own snapshot of the bank, talks to the consensus core through internal channels, and can be disabled with one flag. The `rpc-only` validator mode runs everything *except* TPU ingress and vote submission.

The method set splits into categories:

**Read methods** — `getAccountInfo`, `getBalance`, `getSignatureStatuses`, `getBlock`, `getProgramAccounts`, etc. These hit the rooted bank or one of the replayed forks. Read-heavy RPC nodes spend most of their CPU here. `getProgramAccounts` in particular is the one that destroys nodes — it can require scanning millions of accounts.

**Write methods** — really just one: `sendTransaction`. The RPC node accepts the transaction, optionally simulates it, then forwards to the TPU of the current leader via the TPU forwarding service (which is just `TpuClient` running inside the validator). The RPC node is not the leader — it's a postal worker.

**Subscription methods** — `accountSubscribe`, `signatureSubscribe`, `slotSubscribe`, etc. These run over the PubSub WebSocket (port 8900) and let a client get push notifications when state they care about changes. The implementation polls the bank on every commit. It works at small scale; it falls apart under serious load. Most pros bypass it (see Geyser, next section).

**Pseudo-public state** — `getLeaderSchedule`, `getEpochInfo`, `getRecentPerformanceSamples`. These return data the validator computes for its own consensus needs and just happens to also expose.

The thing that surprises people coming from EVM-land: JSON-RPC on Solana is *not* the canonical API. It's a convenience wrapper over a much richer internal API. Anything you can do via JSON-RPC, the validator does internally via direct function calls on the bank — and there are many things the bank can tell you that JSON-RPC simply doesn't expose.

Which is why the people who care about performance bypass it entirely.

---

## 7. Geyser: the actual real-time API

The Geyser plugin interface (`geyser-plugin-interface/`) is a Rust trait that the validator loads at startup via dynamic library (a `.so` on Linux). The trait has methods like:

```rust
fn update_account(&mut self, account: ReplicaAccountInfoVersions, slot: Slot, is_startup: bool);
fn notify_transaction(&mut self, transaction: ReplicaTransactionInfoVersions, slot: Slot);
fn notify_block_metadata(&mut self, blockinfo: ReplicaBlockInfoVersions);
fn update_slot_status(&mut self, slot: Slot, parent: Option<Slot>, status: SlotStatus);
```

These get called *inside the validator process* whenever the corresponding event happens. Account updated during banking? `update_account` fires synchronously. Transaction landed? `notify_transaction` fires. New slot rooted? `update_slot_status`.

This is the API that powers every serious indexer, every MEV stack's mempool view, every modern data product on Solana. The reason: it's the only way to get cluster events at full fidelity with no polling overhead. JSON-RPC `accountSubscribe` polls and pushes diffs. Geyser is called by the validator with the actual data, the moment it changes, in-process.

The standard implementation is **Yellowstone gRPC** (Triton's `yellowstone-grpc`): a Geyser plugin that forwards everything over gRPC streams to subscribers. Helius, QuickNode, Triton, Jito — all the major data providers run a fleet of validators with Yellowstone Geyser plugins and sell streaming access.

The economic implication: **the JSON-RPC node has become a commodity, and the Geyser node has become the premium product.** The provider that runs the most-instrumented validator with the best Geyser plumbing wins the data game. JSON-RPC is for retail wallets.

There's also **Geyser file output** (write to local disk or to S3) and direct PostgreSQL Geyser plugins, both of which exist mostly for historical-data ingestion rather than live streaming.

The plugin interface is also the *cleanest* extension surface on the validator. You can ship a custom feature — say, write every transaction touching a specific program to a Kafka topic — as a 200-line Rust crate and a config flag, no fork required.

---

## 8. Admin RPC, metrics, the operator-facing surface

Two more surfaces, both for the operator rather than the network.

**Admin RPC** runs over a Unix socket at `--ledger/admin.rpc` and exposes operator-only methods that have no business being on the network: `setLogFilter` (change log level live), `setIdentity` (hot-swap the validator keypair, e.g. during failover), `contactInfo` (introspect own gossip), `repairWhitelist` (allow-list peers for repair). It's the API your monitoring/automation talks to.

The Anza failover playbook — promote standby validator from non-voting to voting — is essentially a sequence of admin RPC calls: stop the active node, copy the tower, set the identity on the standby, restart with vote enabled. The validator binary doesn't have to restart for an identity swap.

**Prometheus metrics** at `:9090/metrics` if you enabled them. The validator exports thousands of timeseries — replay stage timing per slot, banking stage tx throughput, sigverify packets dropped, gossip table size, PoH tick variance. The Solana Foundation publishes a Grafana dashboard library that's the de facto operator standard.

The operator API is the one that turns a running validator from "black box" to "instrumented machine." Without it, you cannot run one in production. With it, you can.

---

## 9. Firedancer: same APIs, different chassis

Firedancer is a from-scratch reimplementation of the validator in C, designed by Jump Crypto. It is wire-compatible with Agave — same gossip, same Turbine, same TPU, same vote — but the internal architecture is unrecognizable.

Firedancer's model is **tiles**: separate processes, each pinned to a CPU core, communicating through shared-memory ring buffers ("frags") with no kernel involvement on the hot path. Each tile is a single-purpose state machine: net tile, sigverify tile, dedup tile, pack tile, bank tile, poh tile, shred tile, store tile.

Why this matters for the API discussion: **every API surface in the validator becomes a tile boundary**, and tiles can be replaced independently. Want a custom sigverify tile that batches differently? Drop it in. Want a custom banking scheduler? It's a tile. Want to bypass the standard Geyser interface with a tile that publishes directly into your data pipeline? Allowed.

The current production deployment is **Frankendancer** — Firedancer's network stack and tile architecture, but Agave's runtime/banking for compatibility while the Firedancer banking implementation matures. It's already running on a meaningful fraction of mainnet stake. The full Firedancer is the milestone the network is moving toward.

The headline numbers from Jump's published benchmarks are eye-watering — single-node TPS in the millions on representative hardware — but those numbers are about the *compute side* of the validator. The network side still has to play by the same Turbine rules as everyone else (until or unless the protocol changes), which loops back to why DoubleZero exists.

A useful mental model: Agave is the reference implementation; Firedancer is what you'd build if you started in 2024 with no compatibility constraints; Frankendancer is the bridge that lets you ship the network-layer improvements today without waiting on the runtime.

---

## 10. What this means if you're building

Different audience, different door.

- **Wallet developer.** JSON-RPC. Use a hosted provider; don't run your own. If you're hitting rate limits on `getProgramAccounts`, you're holding it wrong — switch to Geyser-backed indexing.
- **Searcher / market maker.** TPU-quic to the current leader and next 2–3, pre-warmed connections, leader schedule polled every epoch. Geyser stream for mempool view. Co-locate near the leader-of-the-moment, or accept that someone else will.
- **Data product / indexer.** Yellowstone Geyser on your own validators, or buy from Triton/Helius. Do not poll JSON-RPC. Decide early whether you need transaction history or live state — they have very different ingestion shapes.
- **Protocol team shipping a new feature.** Probably no API change at all. New on-chain state lives in accounts; clients read it through normal account methods. The interesting question is whether you also need a gossip extension for off-chain metadata. Usually no.
- **Validator operator.** Admin RPC + Prometheus. The performance question is "where am I losing the slot" — sigverify, replay, broadcast — and the metrics tell you immediately. Network jitter shows up in replay stage timing.
- **Infrastructure provider.** All of the above, plus the question of whether to run RPC, Geyser, or both. The two profiles have very different hardware curves — RPC is read-heavy random IO, Geyser is write-heavy sequential. Don't combine them on one host.

The validator's ten APIs are not a design accident. They're the natural decomposition of "this is a state machine, this is a switchboard, this is a clock, this is a journal, this is a postal service." Treating them as one thing — "the Solana API" — is how you end up with the wrong architecture.

---

## 11. Read the source

For each section above, the actual file:

| Surface | Module |
|---|---|
| TPU | `core/src/tpu.rs`, `streamer/src/quic.rs` |
| Banking stage | `core/src/banking_stage/` |
| PoH | `poh/src/poh_recorder.rs`, `poh/src/poh_service.rs` |
| Broadcast | `core/src/broadcast_stage/` |
| TVU | `core/src/tvu.rs`, `core/src/window_service.rs` |
| Replay | `core/src/replay_stage.rs` |
| Gossip | `gossip/src/cluster_info.rs`, `gossip/src/crds.rs` |
| Repair | `core/src/repair/` |
| JSON-RPC | `rpc/src/rpc.rs`, `rpc/src/rpc_service.rs` |
| PubSub | `rpc/src/rpc_pubsub.rs` |
| Geyser | `geyser-plugin-interface/src/geyser_plugin_interface.rs` |
| Admin RPC | `validator/src/admin_rpc_service.rs` |

The validator is reasonably approachable once you know which directory answers your question. The pipeline is straightforward in source; what's hard is keeping all ten APIs in your head at once.

---

*Sources: Agave validator source tree at [github.com/anza-xyz/agave](https://github.com/anza-xyz/agave), Anza validator operator docs, the Geyser plugin interface README, Jump's Firedancer architecture writeups, Triton's Yellowstone gRPC documentation. Port numbers from `agave-validator --help` on a stock mainnet-beta build — verify against the cluster version you run. The transaction-flow diagram is a simplification; the real path includes a fetch stage, ancestor hashes service, vote signing, and several other components that don't change the picture but matter in code.*
