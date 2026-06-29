# DoubleZero: Multicast Fiber for Solana Validators

> Draft — 2026.05.24. Numbers come from the Malbec Labs whitepaper, the Breakpoint 25 talk, the public docs at docs.malbeclabs.com, and the live telemetry dashboard at [data.malbeclabs.com](https://data.malbeclabs.com/) — verify against the live dashboards before publishing.

A Solana slot is 400ms. Inside that window a validator has to receive the previous leader's block, replay it, build its own, fan out 64-byte shreds to thousands of peers, and have enough of those shreds land before the next leader takes over. The compute side stopped being the bottleneck a long time ago — Firedancer pushes a single node past a million TPS in the lab. The remaining bottleneck is the public internet between validators.

**DoubleZero** — built by Malbec Labs, mainnet-beta since October 2025 — is the bet that the right answer is the same one HFT shops made fifteen years ago: stop sending consensus-critical packets over best-effort BGP, and put them on dedicated fiber. The twist is two-part. First, it's a *shared* private network — contributor-operated wavelengths, permissioned access, pooled across many validators — instead of every validator signing a million-dollar dark-fiber lease one route at a time. Second, and more importantly, it adds **multicast** as a primitive, which the public internet structurally cannot do.

About 40% of Solana validators are already on it. This is the deep version.

---

## 1. The bottleneck is jitter, not latency

Two different things get called "latency."

**Latency** is the median time a packet takes to get from A to B. NYC ↔ Frankfurt is ~76ms great-circle. Light in fiber goes ~2/3 of c, so the physical floor is around 38ms one-way. You don't beat that without a lower-latitude path.

**Jitter** is the variance. P50 might be 80ms; P99 is 140ms; P99.9 might be 400ms because some packet hit a congested peering point and got buffered for 300ms. That tail is the part that kills you.

Solana shred propagation under Turbine is a unicast fan-out tree. The leader sends shreds to a small root set; they forward to children; the tree fans down. A single late shred at any layer delays everyone beneath it. The block isn't reconstructed until enough shreds arrive, and the next leader can't safely build on top until that happens. P99 jitter at any intermediate hop compounds into P99+ jitter at the root of the next block.

The Malbec Labs team frames this directly in the Breakpoint 25 talk: *"latency without control, you get a lot of jitter and it makes predictions that much harder."* Their headline number is the worst-case time to land a transaction:

| Path | Worst-case tx land |
|---|---|
| Public internet | >1.5 seconds |
| DoubleZero | ~500 ms |

A 3× improvement at the tail. The median improvement is much smaller — DoubleZero doesn't move the speed of light. What it does is collapse the tail.

---

## 2. What DoubleZero actually is

Three layers stacked. Real terminology this time, not marketing.

**Physical layer.** Network Bandwidth Contributors provide "dedicated bandwidth that can provide IPv4 connectivity and an MTU of 2048 bytes between two data centers" — in practice, wavelength services on existing long-haul fiber. Three flavors: L1 wavelength on DWDM/CWDM, L2 packet-switched VLAN extension, or L3 dedicated third-party bandwidth. Each contributed link terminates at a **DZD** (DoubleZero Device — a physical switch, in practice a pair of Arista 7280CR3As plus AMD V80 NICs, in a 4U/4KW rack at each end).

**Exchange layer.** Contributor links bridge to each other at **DZXs** (DoubleZero Exchanges) — interconnect points in major metros. This is the part that turns N point-to-point contributions into a real mesh.

**Software layer.**
- **Controller** — derives device configuration from on-chain state.
- **Config Agent + Telemetry Agent** — run on each DZD. Config Agent applies whatever the Controller says; Telemetry Agent measures latency, jitter, and packet loss via **TWAMP** and publishes results.
- **doublezerod** — the daemon that runs on the validator or RPC host. Manages a `doublezero0` tunnel interface, the routing table, and the BGP session into the DoubleZero mesh.
- **On-chain ledger** — serviceability state and telemetry are written to a Solana program. Network state is verifiable; routing isn't a black box.

What it isn't: it's not "BGP-free." DoubleZero actually *uses* BGP — but inside its own permissioned mesh, on `169.254.0.0/16` link-local addresses over GRE (IP protocol 47), with all peers and policies known. The distinction from the public internet isn't "no BGP," it's "BGP across a deterministic mesh of N participants" vs "BGP across tens of thousands of unknown ASes doing best-effort policy routing." Same protocol, completely different blast radius.

The live multicast group state, contributor list, and per-link telemetry are published at [data.malbeclabs.com](https://data.malbeclabs.com/) — including [`/dz/multicast-groups`](https://data.malbeclabs.com/dz/multicast-groups) for the multicast topology specifically. The transparency is part of the design: contributors get paid based on measured service quality, so the measurements have to be public.

---

## 3. The multicast trick

Here is what makes DoubleZero structurally different from "we leased fiber."

Solana's Turbine sends shreds as unicast. The leader picks a root validator and sends one copy. The root forwards a copy to each of its children. Each child forwards to its children. To deliver one block to 1500 validators, the network carries roughly 1500 copies of every shred at the worst layer, and the depth of the tree adds latency at every hop.

The public internet has no choice but unicast at that scale. IP multicast exists in the spec but is almost universally disabled across the open internet — no ISP wants to carry replicated traffic for a third party. So Solana built a unicast tree on top of best-effort unicast delivery.

DoubleZero adds **native multicast** as a connection mode. A publisher sends one copy of a packet to a multicast group. The DoubleZero mesh replicates that packet at the switch fabric — at each DZD, in hardware, fan-out happens once and the copies go to every subscriber on the right egress links. From the publisher's perspective, one send. From each subscriber's perspective, one receive at near-line-rate.

For shred propagation specifically, the talk numbers it: Frankfurt subscribers saw **gains exceeding 16ms** on shred delivery via multicast vs unicast. That's per hop, per shred. For a hot validator on the next leader's slot, 16ms is 4% of the entire slot window.

The architectural shape of this is:

```
Public internet Turbine:
   leader ──► root ──► child ──► grandchild ──► ...  (N copies, N hops)

DoubleZero multicast:
   publisher ──► group address
                    │
              ┌─────┼─────┐         (1 copy in, replicated at each DZD)
              ▼     ▼     ▼
          subscriber subscriber subscriber
```

You can run Turbine over DoubleZero unicast and still win on jitter. You can run shred distribution over DoubleZero multicast and additionally win 16+ms per hop. The multicast path is the harder integration and the bigger payoff.

---

## 4. Connecting a validator

This is the part people get wrong: the original DoubleZero pitch sounded like "lease a wavelength, rebuild your validator." The actual story is much smaller.

The killer feature is **IBRL** — a connection mode that "allows validators and RPC nodes to connect to DoubleZero without restarting their blockchain clients." You don't fork Agave or Firedancer. You don't take downtime. doublezerod brings up a tunnel interface and a routing table, and the validator's existing sockets start using the better path for any peer that's also on the mesh.

Prerequisites are unglamorous:

- x86_64 server, Ubuntu 22.04+/Debian 11+/Rocky/RHEL 8+, installed directly on the validator host (not in a container)
- Public IP, no NAT
- Firewall opens IP protocol 47 (GRE) and TCP/179 (BGP) on the link-local range
- A cross-connect from your colo cage to a participating DZX

Installation, for Ubuntu mainnet-beta:

```bash
curl -1sLf https://dl.cloudsmith.io/public/malbeclabs/doublezero/setup.deb.sh | sudo -E bash
sudo apt-get install doublezero
doublezero keygen                # generates identity at ~/.config/doublezero/id.json
doublezero address               # prints your DZ pubkey
sudo systemctl status doublezerod
doublezero latency               # discover DZDs, measure ping
doublezero status                # confirm connection
```

`doublezero latency` is the one to run before signing anything. It enumerates the DZDs you can reach and shows ping times — if your nearest POP is more than a few ms away, the cross-connect topology isn't right yet.

Testnet and mainnet-beta are *physically distinct networks*, not the same fiber with different routing. You pick one at install time via the repo URL.

What the validator binary sees: nothing changed, except that traffic to peers also on the mesh now exits `doublezero0` instead of the default route, with much tighter jitter. Turbine and gossip pick paths from the OS routing table — they don't know or care that the better path is on dedicated fiber.

---

## 5. Connecting a searcher or extractor

The searcher geometry is different. You don't need to talk to every validator. You need to talk to the current leader, and the next few leaders, with the lowest possible tail latency. The leader schedule is public.

Today's serious-MEV stack: co-locate near a major validator concentration (FRA, NYC, TYO), stream tx submissions to multiple validator vote accounts, optionally route through Jito's relayer for bundle semantics, and pray the path to this slot's leader isn't going through Ashburn on a bad afternoon.

With a DoubleZero port your tx leaves your host, traverses one mesh hop to the leader's POP, and lands in their ingress queue in deterministic time. The variance disappears.

The non-obvious consequence: **the Jito relayer hop becomes optional for latency reasons.** You might still want it for bundle semantics, tip routing, or revert protection — but the latency argument for funneling everything through one relayer collapses when the underlying network is already deterministic. Searcher economics shift accordingly.

Per-millisecond revenue for searchers is asymmetric — losing the race on a profitable opportunity costs you the entire opportunity, not a fraction. The math for paying for a DZ port works out at much smaller scales for searchers than it does for validators.

---

## 6. Compared to renting your own fiber

HFT firms have been solving this problem since ~2010, and the comparison is worth making explicit because it's exactly why DoubleZero is structured as a shared substrate.

**The HFT model.** A trading firm signs a dark-fiber lease (or microwave path, McKay/Anova-style) on a specific route — say NYC → Aurora for CME, or NYC → London for LSE. They light their own wavelength, terminate at colocation cages on both ends, own every meter exclusively.

The numbers, roughly:

| | NYC ↔ CHI HFT-grade | NYC ↔ FRA HFT-grade |
|---|---|---|
| Setup | $50k–$200k | $250k+ |
| Annual | $500k–$2M | $1M–$5M |
| Capacity | One firm, one wavelength | One firm, one wavelength |
| Provisioning | months | 6–12 months |

You get the absolute best latency on earth for that route. You also pay for the entire pipe regardless of how much you push through it. For a firm doing $100M/year of MEV that math works. For a 50-validator cluster trying to recover skipped-slot APY, it doesn't.

**The DoubleZero model.** A bandwidth contributor dedicates a wavelength to the shared substrate, terminates it on a DZD pair (Arista 7280CR3A + AMD V80, ~4U/4KW per side), and bridges to the rest of the network at the nearest DZX. Many validators and searchers share ports into that substrate. Capacity is multiplexed, telemetry is published, contributors get paid via the on-chain Shapley-value reward program proportional to their measured contribution to network quality.

The participant side gets per-port pricing instead of per-route exclusivity. Per-port pricing is going to settle into a range that's economic for a typical validator — well under the APY recoverable from skipped-slot reduction — because the underlying fiber cost is amortized across many participants.

| | DoubleZero | HFT dark fiber |
|---|---|---|
| Latency | Within a few % of theoretical floor | Theoretical floor |
| Jitter | Sub-ms tail, published live | Sub-ms tail, you measure |
| Multicast | Yes (native, hardware replicated) | No (you'd have to build it) |
| Cost model | Per-port, shared | Per-route, exclusive |
| Provisioning | Days–weeks | Months |
| Counterparty | Network governance + on-chain telemetry | Carrier SLAs + your lawyers |
| Permissionless? | Permissioned, public telemetry | Bilateral commercial contract |

The multicast row is the interesting one. Even if a validator could afford an exclusive dark-fiber lease, they'd still get only unicast out of it — multicast at scale needs a coordinated mesh where every switch knows the group membership. That's something a shared network can do and a per-firm lease structurally cannot.

---

## 7. Frankendancer, Firedancer, and the integration surface

This is the part that gets undersold in the Malbec docs and is the most interesting for anyone who actually writes validator code.

**Frankendancer is on mainnet, and the wins compound with DoubleZero.** Frankendancer — the production hybrid where Firedancer's networking and block-packing replace Agave's, then Agave's runtime executes — has been on mainnet since September 2024. It posts roughly **~22% faster shredding without Merkle trees and almost 2× faster with Merkle trees** vs Agave's path on the same hardware. That's pure CPU-side improvement; the wire is still the same wire.

Drop Frankendancer on a DoubleZero port and the two improvements stack. Frankendancer takes less time to produce the shreds; DoubleZero takes less wall-clock and far less jitter to deliver them. Inside a 400ms slot, the leader gets back time on both ends — more time to keep the tx ingress open, less time spent waiting for the previous block's shreds to fully arrive before building.

**The integration shape is the `net_tile`.** Firedancer's [net_tile](https://docs.firedancer.io/guide/internals/net_tile.html) is the per-CPU thread that owns one NIC. The natural integration point with DoubleZero is binding a specific `net_tile` to the `doublezero0` interface — consensus traffic to peers also on the mesh routes through that tile; everything else routes through a separate `net_tile` bound to the regular uplink. Tile-level affinity means you can pin DoubleZero traffic to the cores closest to its NIC's PCIe slot, with no contention from public-internet traffic on the same thread.

The upstream `net_tile` patch that ties Firedancer's userspace directly to `doublezero0` isn't public yet — but the kernel-side half already exists. [cavemanloverboy/agave-xdp-rx-ebpf](https://github.com/cavemanloverboy/agave-xdp-rx-ebpf) is an XDP/eBPF program for Solana traffic that explicitly does **GRE tunnel decapsulation**, supports variable-length IPv4 headers, and a dynamic port count. GRE decap is exactly the work DoubleZero packets need before they hit the validator's normal socket layer — strip the protocol-47 outer header in kernel, hand the inner Solana packet to either an Agave socket or an AF_XDP-backed Firedancer `net_tile`. This is the layer *below* `net_tile`. The tile-side integration (subscription, group membership, reconciliation) is the next missing piece, but the kernel plumbing is already shipping.

Worth watching the same author's [firedancer fork](https://github.com/cavemanloverboy/firedancer) and [agave-pr](https://github.com/cavemanloverboy/agave-pr) workspace — they've been landing upstream Firedancer PRs (recent example: #8218, "resolv: use exact block height check") and are an obvious candidate to ship the tile-side glue. If you're looking for the first concrete Firedancer ↔ DZ integration to benchmark, that's probably where it lands.

The third validator client in scope here is [jito-foundation/jito-solana](https://github.com/jito-foundation/jito-solana) — Jito's Agave fork that adds the block engine and bundle relayer hooks, and the client most MEV-active validators run today. Because it inherits Agave's network stack, any DoubleZero integration would land via the same kernel-side hooks as on stock Agave — the XDP/GRE decap path described above applies to jito-solana directly. Whether [Jito Foundation](https://github.com/jito-foundation) ships a packaged DZ integration is unannounced as of this writing.

**Multicast subscribe at the tile level is the harder, bigger payoff.** DoubleZero's multicast pub/sub model maps onto Firedancer's tile model unusually well. A `shred` tile that subscribes to a DoubleZero multicast group — instead of receiving unicast Turbine shreds and re-publishing — collapses one full hop of the Turbine tree. For deep Turbine fanouts that's compound savings. The integration work is heavier here (the shred tile has to understand DZ group semantics and reconciliation between multicast and unicast paths) but this is where the 16+ms-per-shred Frankfurt number from §3 comes from, and it's where most of the latency upside lives.

---

## 8. What developers can build on top

The [DoubleZero Foundation GitHub org](https://github.com/doublezerofoundation/) is the entry point. The interesting pieces published as of mainnet-beta:

- **`doublezero-solana` Rust crate** (v0.3.0 as of late 2025) — primary client integration. If you're writing a Solana service that wants to be DoubleZero-aware, this is what you depend on.
- **`doublezero-edge-solana` shred receiver example** — a minimal program that subscribes to shreds over DoubleZero and prints throughput. The shortest possible "hello world" for understanding the multicast subscription API.
- **Package sidecar** — polls Cloudsmith for new `doublezero` and `doublezero-solana` releases and runs `apt-update`. Boring infrastructure, but the kind of thing you want pinned and audited if you're running validators at scale.
- **On-chain DZ ledger program** — telemetry and serviceability state are written to a Solana program. That means anyone can build a third-party telemetry consumer that doesn't need permission from Malbec, just RPC access.
- **TWAMP telemetry feed via [data.malbeclabs.com](https://data.malbeclabs.com/)** — the same data that drives contributor payouts. Public, structured, queryable.

Concretely, the things a competent dev can build this quarter without asking permission:

1. **A jitter-aware RPC router.** Read live TWAMP telemetry, route RPC reads/writes to the validator with the best path-quality for the requesting region. Useful for any RPC provider that wants to undercut Helius/Triton on tail latency without owning fiber.
2. **A multicast data feed.** Publish a custom data stream (oracle prices, orderbook events, anything time-sensitive) into a DoubleZero multicast group. Subscribers on the mesh receive at near-line-rate with sub-ms jitter. Pyth-style feeds are the obvious early use case; private market-maker feeds are the spicier one.
3. **A skip-rate alerting service.** Validators on DZ should post measurably better skip rates than identical hardware off DZ. Build the diff, alert when the gap collapses (which would suggest DZ degradation or a routing misconfiguration).
4. **A relayer that replaces Jito's latency role.** Bundle semantics still need a coordinator; lowest-latency-to-leader does not, on DZ. A small, focused relayer that handles bundle tip routing but assumes DZ for transport is a meaningfully smaller piece of software than Jito's full stack.
5. **A Firedancer/Frankendancer integration fork.** The clean architectural fit described in §7 is open work. Someone will publish it.

**Target dev audience.** Mostly Solana validator operators, MEV searchers, oracle providers, and RPC providers — people whose business is denominated in tail-latency reduction. Secondary audience: anyone running a private financial protocol with latency-sensitive participants (perp DEXes with their own market-maker programs, orderbook venues with non-validator participants who still care about tx submission speed). Tertiary: blockchain projects beyond Solana — DZ's transport layer is chain-agnostic, and Malbec has been explicit that the network isn't Solana-exclusive in principle.

The unusual property of this stack vs most "blockchain infrastructure": **the source-of-truth telemetry is public**, the integration crate is published, and the example code runs. You don't have to take anyone's word for performance numbers — you can subscribe to the same TWAMP feed Malbec uses to pay contributors.

---

## 9. Performance, with real numbers where they exist

Three things to measure, in order of how much they matter to participants:

**Worst-case tx land time.** Malbec's published figure: ~500ms on DoubleZero vs >1.5s on public internet at the tail. This is the headline number from the BP25 talk and the one most likely to move both validator skip rate and searcher inclusion rate.

**Multicast vs unicast shred delivery.** Frankfurt subscribers saw >16ms improvement per delivery in published testing. For a leader sitting on a 400ms slot, that's ~4% of the entire window recovered, per shred, per hop. Compounded across Turbine depth, the slot window loosens meaningfully — and the leader can keep their tx ingress open longer without risking a skip.

**Real-time link-level telemetry.** TWAMP measurements between every DZD pair are published to the on-chain ledger and visible on [data.malbeclabs.com](https://data.malbeclabs.com/). This is unusual — most private networks publish nothing — and it's load-bearing for the economic model. Contributors get paid based on what TWAMP says, so the measurements are the asset.

For the *median* validator the win is less dramatic than the tail number suggests. The median validator's path on public internet is fine most of the time. The pitch for joining is the tail: P99 jitter and skip rate during congested hours, particularly when the leader schedule puts a Frankfurt validator next after a Tokyo validator and the trans-Pacific shred propagation has to land in 200ms.

---

## 10. What this unlocks, and the counter-thesis

If this works at scale, three things happen:

1. **Skip rate compresses geographically.** A Tokyo validator and a Frankfurt validator stop paying a permanent tax for being far from the consensus center of mass. The leader schedule becomes location-agnostic in practice.
2. **The Jito relayer becomes one of several options.** It still owns bundle semantics and tip routing. It stops owning "lowest jitter to the leader" because the underlying network already provides that.
3. **Programmable network primitives become possible.** Native multicast is the first one shipped. In-network ordering, hardware-timestamped attestations, and deterministic shred reconstruction are all things that a private substrate can do and the public internet cannot.

The counter-thesis is worth saying out loud. **Maybe Solana ships protocol-level improvements that close the jitter gap without anyone needing private fiber.** Async block production, better Turbine fanout, QUIC tuning, smarter repair — each chips at the same problem from inside the protocol. If the median validator's skip rate gets to 0.3% on plain internet, the marginal case for DoubleZero on the validator side weakens.

The MEV/searcher side is more durable. Tail-latency for tx submission is going to matter regardless of consensus internals, and the multicast primitive isn't reproducible at the protocol layer — it requires the network layer to cooperate.

The bet Malbec is making is that *both* fronts move — protocol improvements happen, AND a dedicated network is still worth it for the participants who care most. That's a reasonable bet because the participants who care most are the ones with the budget to pay for it. The network has a real two-sided business model: validators pay to capture skipped-slot APY, searchers pay to capture inclusion-rate edge, contributors get paid in proportion to measured quality.

The fact that ~40% of Solana validators have already joined a six-month-old network is the strongest evidence the bet is paying.

---

## 11. What to watch over the next year

- **Skip rate distribution by region.** Tokyo/Singapore validators on DoubleZero converging with Frankfurt validators = thesis working. Track via the standard validator leaderboards plus the [DoubleZero telemetry dashboard](https://data.malbeclabs.com/).
- **Multicast group adoption.** Visible directly at [data.malbeclabs.com/dz/multicast-groups](https://data.malbeclabs.com/dz/multicast-groups). The interesting curve is how many validators move from unicast-over-DZ to multicast-over-DZ.
- **Jito relayer's share of bundle flow.** If it drops as searcher DZ ports proliferate, the unbundling is happening.
- **Contributor growth and POP coverage.** Each new DZX in a new metro pulls in the validators racked nearby. Network effects compound.
- **Firedancer's network tile integration.** Firedancer can bind specific traffic classes to specific NICs. Clean tile-level integration with `doublezero0` is the obvious next milestone.

The simplest test: in twelve months, look at the top 50 validators by stake, count how many have a DoubleZero port. If most of them, the bet paid. If a handful, public internet was good enough after all. Right now the answer is somewhere in the middle and rapidly converging upward.

---

*Sources: [Malbec Labs docs](https://docs.malbeclabs.com/), [architecture](https://docs.malbeclabs.com/architecture/), [setup](https://docs.malbeclabs.com/setup/), [contributor requirements](https://docs.malbeclabs.com/contribute/), [glossary](https://docs.malbeclabs.com/glossary/), [whitepaper Dec 2024](https://malbeclabs.com/whitepaper.pdf), [Breakpoint 25 tech talk on Solana Compass](https://solanacompass.com/learn/breakpoint-25/tech-talk-malbec-labs), live data at [data.malbeclabs.com](https://data.malbeclabs.com/) and [`/dz/multicast-groups`](https://data.malbeclabs.com/dz/multicast-groups). HFT comparison numbers are first-principles estimates from publicly known carrier pricing — verify before publishing.*
