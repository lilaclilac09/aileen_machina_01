'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { c, s, PullQuote, Aside, Sources } from '../essayStyle';

const dzVsHft: [string, string, string][] = [
  ['Latency', 'Within a few % of theoretical floor', 'Theoretical floor'],
  ['Jitter', 'Sub-ms tail, published live', 'Sub-ms tail, you measure it'],
  ['Multicast', 'Yes — native, hardware replicated', 'No — you would have to build it'],
  ['Cost model', 'Per-port, shared', 'Per-route, exclusive'],
  ['Provisioning', 'Days to weeks', 'Months'],
  ['Counterparty', 'Network governance + on-chain telemetry', 'Carrier SLAs + your lawyers'],
];

const references = [
  { label: 'DoubleZero Foundation — GitHub org', href: 'https://github.com/doublezerofoundation/' },
  { label: 'Malbec Labs docs', href: 'https://docs.malbeclabs.com/' },
  { label: 'DoubleZero architecture', href: 'https://docs.malbeclabs.com/architecture/' },
  { label: 'Glossary — DZD, DZX, IBRL, TWAMP', href: 'https://docs.malbeclabs.com/glossary/' },
  { label: 'DoubleZero Whitepaper (Dec 2024)', href: 'https://malbeclabs.com/whitepaper.pdf' },
  { label: 'Breakpoint 25 tech talk — Malbec Labs (Solana Compass writeup)', href: 'https://solanacompass.com/learn/breakpoint-25/tech-talk-malbec-labs' },
  { label: 'Live telemetry dashboard', href: 'https://data.malbeclabs.com/' },
  { label: 'Multicast groups — live', href: 'https://data.malbeclabs.com/dz/multicast-groups' },
  { label: 'Firedancer net_tile internals', href: 'https://docs.firedancer.io/guide/internals/net_tile.html' },
  { label: 'cavemanloverboy/agave-xdp-rx-ebpf — XDP + GRE decap for Solana traffic', href: 'https://github.com/cavemanloverboy/agave-xdp-rx-ebpf' },
  { label: 'jito-foundation/jito-solana — MEV Solana client', href: 'https://github.com/jito-foundation/jito-solana' },
  { label: 'Anatomy of a Solana Validator — the ten APIs in one binary (companion piece)', href: '/blog/validator-anatomy' },
];

export default function DoubleZeroArticle() {
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
        <p style={s.kicker}>Infrastructure · May 24, 2026 · 12 min read</p>
        <h1 style={s.h1}>DoubleZero, Multicast Fiber</h1>
        <p style={s.dek}>
          A Solana slot is 400 milliseconds. The compute is solved — the bottleneck is the public internet
          between validators. DoubleZero&apos;s bet is private fiber, plus the one thing the open internet
          structurally can&apos;t do: multicast.
        </p>

        <hr style={s.rule} />

        <p style={s.lead}>
          Inside a single 400-millisecond slot, a validator has to receive the previous block, replay it,
          build its own, and fan out the pieces before the next leader takes over. The compute side of that
          is solved. The hard part is the public internet between validators. Live on mainnet-beta since
          October 2025, DoubleZero is the bet that the right answer is the same one high-frequency traders
          reached fifteen years ago — private fiber — plus one thing the public internet structurally cannot
          do: multicast.
        </p>

        <h2 style={s.h2}>The bottleneck is jitter, not latency</h2>
        <p style={s.body}>
          People use &quot;latency&quot; to mean two different things. Pull them apart and the bottleneck
          becomes obvious. <strong style={s.strong}>Latency</strong> is the typical time a packet takes to
          get from one machine to another. New York to Frankfurt is about 76 milliseconds round-trip. Light
          in glass moves at roughly two-thirds the speed of light in vacuum, so the physical floor for that
          route is about 38 ms one way. You cannot beat that. Physics.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>Jitter</strong> is how much that number wobbles. Most packets arrive in
          80 ms; one in a hundred takes 140 ms because it sat behind something at a router; one in a thousand
          takes 400 ms because it hit a congested handoff between two networks. The average is fine. The tail
          is what hurts you.
        </p>
        <p style={s.body}>
          Solana&apos;s block propagation rides on ordinary point-to-point traffic. The leader breaks a block
          into small pieces called <em>shreds</em>, sends them to a handful of root validators, and each root
          forwards copies to its children — the shreds fan out down a tree. If one shred is late at any level,
          every validator below it is late too, and the next leader can&apos;t safely build until enough
          shreds arrive. Slowness at one hop ripples into the next block&apos;s start. As the Malbec Labs team
          put it at Breakpoint 25: latency without control gives you a lot of jitter, and that makes
          predictions much harder.
        </p>
        <p style={s.body}>
          Their headline number is the worst-case time to land a transaction: over 1.5 seconds on the public
          internet, about 500 ms on DoubleZero. That&apos;s a 3× improvement at the tail. The median
          improvement is much smaller — DoubleZero doesn&apos;t move the speed of light. What it does is
          collapse the tail.
        </p>

        <h2 style={s.h2}>What DoubleZero actually is</h2>
        <p style={s.body}>
          DoubleZero is three layers. None of them are mysterious; they just have unfamiliar names.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>The physical layer is the actual fiber.</strong> Companies that own
          long-haul fiber donate a slice of capacity between two cities — in telecom terms, a
          &quot;wavelength service,&quot; one color of light on a much fatter cable. At each end sits a switch
          in someone&apos;s data center, which DoubleZero calls a <code style={s.code}>DZD</code> (DoubleZero
          Device): in practice a pair of Arista 7280CR3A switches and AMD V80 network cards, about a
          server-rack&apos;s worth of space and four kilowatts of power.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>The exchange layer stitches the pieces into a network.</strong> One
          donated link goes from city A to B, another from B to C; to turn a bag of point-to-point links into
          something a validator can plug into and reach anyone, they have to meet somewhere. Those meeting
          points are <code style={s.code}>DZX</code> exchanges in major metros — exactly like the internet
          exchanges carriers already use.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>The software layer makes it programmable.</strong> A controller reads the
          on-chain configuration and tells every switch what to do; a config agent on each switch applies it;
          a telemetry agent measures latency, jitter, and loss between every pair of devices using{' '}
          <code style={s.code}>TWAMP</code> (a standard active-measurement protocol) and publishes the numbers
          live. On your validator you install <code style={s.code}>doublezerod</code>, a daemon that brings up
          a virtual interface (<code style={s.code}>doublezero0</code>) and a small routing table — whenever
          your validator talks to a peer that&apos;s also on the mesh, the traffic takes the fast path instead
          of the public internet. Membership and telemetry live in an on-chain ledger on Solana that anyone
          can read.
        </p>
        <p style={s.body}>
          One point of confusion worth clearing up: DoubleZero is not &quot;BGP-free.&quot; It runs BGP — the
          same routing protocol the public internet runs — but inside a closed network where every
          participant is known and every policy is auditable. The open internet has tens of thousands of
          independent networks running BGP at each other on best effort; DoubleZero runs it across a few dozen
          participants who agreed on the rules ahead of time. Same protocol, very different failure modes. The
          telemetry is public — at <a href="https://data.malbeclabs.com/" target="_blank" rel="noopener noreferrer" style={s.link}>data.malbeclabs.com</a>,
          including the live multicast topology — because contributors get paid based on what it measures.
        </p>

        <h2 style={s.h2}>The multicast trick</h2>
        <p style={s.body}>
          Here is what makes DoubleZero structurally different from &quot;we leased some fiber.&quot;
          Solana&apos;s Turbine sends shreds as unicast: the leader picks a root validator and sends one copy,
          the root forwards a copy to each child, each child forwards to its children. To deliver one block to
          1,500 validators, the network carries roughly 1,500 copies of every shred at the worst layer, and
          the depth of the tree adds latency at every hop.
        </p>
        <p style={s.body}>
          The public internet has no choice but unicast at that scale. IP multicast exists in the spec but is
          almost universally disabled on the open internet — no ISP wants to carry replicated traffic for a
          third party. So Solana built a unicast tree on top of best-effort unicast delivery. DoubleZero adds
          <strong style={s.strong}> native multicast</strong> as a connection mode. A publisher sends one copy
          to a multicast group; the mesh replicates that packet in hardware at each <code style={s.code}>DZD</code>,
          fanning out once and sending copies to every subscriber on the right egress links. From the
          publisher&apos;s side, one send. From each subscriber&apos;s side, one receive at near line rate. For
          shred propagation specifically, the talk numbers it: Frankfurt subscribers saw gains exceeding 16 ms
          per shred via multicast versus unicast — per hop, per shred, which is 4% of the entire 400 ms slot.
        </p>

        <PullQuote>
          The public internet has no choice but unicast at that scale. DoubleZero adds multicast back as a
          network primitive — the harder integration, and the bigger payoff.
        </PullQuote>

        <p style={s.body}>
          You can run Turbine over DoubleZero unicast and still win on jitter. You can run shred distribution
          over DoubleZero multicast and additionally win 16-plus ms per hop. The multicast path is the harder
          integration and the bigger payoff.
        </p>

        <h2 style={s.h2}>Connecting a validator</h2>
        <p style={s.body}>
          The original DoubleZero pitch sounded like &quot;lease a wavelength, rebuild your validator.&quot;
          The actual story is much smaller. The killer feature is <code style={s.code}>IBRL</code>, a
          connection mode that lets validators and RPC nodes join <em>without restarting their blockchain
          clients</em>. You don&apos;t fork Agave or Firedancer and you don&apos;t take downtime;{' '}
          <code style={s.code}>doublezerod</code> brings up a tunnel interface and a routing table, and the
          validator&apos;s existing sockets start using the better path for any peer that&apos;s also on the
          mesh.
        </p>
        <p style={s.body}>The prerequisites are unglamorous:</p>
        <ul style={s.list}>
          <li style={s.li}>An x86_64 server on Ubuntu 22.04+, Debian 11+, Rocky, or RHEL 8+, installed directly on the validator host — not in a container.</li>
          <li style={s.li}>A public IP, no NAT.</li>
          <li style={s.li}>A firewall that opens IP protocol 47 (GRE) and TCP/179 (BGP) on the link-local range.</li>
          <li style={s.li}>A cross-connect from your colo cage to a participating <code style={s.code}>DZX</code>.</li>
        </ul>
        <p style={s.body}>
          Install is a Cloudsmith apt repo and a package, then <code style={s.code}>doublezero keygen</code> to
          generate an identity and <code style={s.code}>doublezero status</code> to confirm the connection.
          The one to run before signing anything is <code style={s.code}>doublezero latency</code>: it
          enumerates the <code style={s.code}>DZD</code>s you can reach and shows ping times — if your nearest
          point of presence is more than a few ms away, the cross-connect topology isn&apos;t right yet.
          Testnet and mainnet-beta are <em>physically distinct networks</em>, not the same fiber with different
          routing; you pick one at install time via the repo URL. What the validator binary sees: nothing
          changed, except that traffic to mesh peers now exits <code style={s.code}>doublezero0</code> with
          much tighter jitter. Turbine and gossip pick paths from the OS routing table — they don&apos;t know
          or care that the better path is on dedicated fiber.
        </p>

        <h2 style={s.h2}>Connecting a searcher or extractor</h2>
        <p style={s.body}>
          The searcher geometry is different. You don&apos;t need to talk to every validator; you need to talk
          to the current leader and the next few, with the lowest possible tail latency, and the leader
          schedule is public. Today&apos;s serious MEV stack co-locates near a major validator concentration
          (Frankfurt, New York, Tokyo), streams transaction submissions to multiple validator vote accounts,
          optionally routes through Jito&apos;s relayer for bundle semantics, and prays the path to this
          slot&apos;s leader isn&apos;t going through Ashburn on a bad afternoon. With a DoubleZero port your
          transaction leaves your host, traverses one mesh hop to the leader&apos;s POP, and lands in their
          ingress queue in deterministic time. The variance disappears.
        </p>

        <Aside label="The non-obvious consequence">
          <strong style={s.strong}>The Jito relayer hop becomes optional for latency reasons.</strong> You
          might still want it for bundle semantics, tip routing, or revert protection — but the latency
          argument for funneling everything through one relayer collapses when the underlying network is
          already deterministic. Searcher economics shift accordingly.
        </Aside>

        <p style={s.body}>
          Per-millisecond revenue for searchers is asymmetric: losing the race on a profitable opportunity
          costs you the entire opportunity, not a fraction of it. So the math for paying for a DoubleZero port
          works out at much smaller scales for searchers than it does for validators.
        </p>

        <h2 style={s.h2}>Compared to renting your own fiber</h2>
        <p style={s.body}>
          High-frequency trading firms have been solving the &quot;public internet is too jittery&quot; problem
          since about 2010, and looking at how they did it makes the shape of DoubleZero clearer. The HFT
          playbook: pick a route that matters — Chicago to New York for futures, New York to London for
          cross-Atlantic — sign a private deal for fiber along it, light a single wavelength, and own every
          meter end to end. Nobody else&apos;s packets touch it. You get the best latency physically possible
          on that route, and you pay for the whole pipe whether you use it or not.
        </p>
        <p style={s.body}>
          The prices are serious. An HFT-grade New York–Chicago line runs $50k–$200k to set up and $500k–$2M a
          year; a transatlantic New York–Frankfurt line is $250k-plus to set up, $1M–$5M a year, and six to
          twelve months to provision — one firm, one wavelength. For a firm pulling $100M a year of MEV on that
          route, the math is easy. For a fifty-validator cluster trying to claw back a few percent of skipped
          slots, it isn&apos;t.
        </p>
        <p style={s.body}>
          The DoubleZero playbook inverts it. Instead of one firm leasing a whole route end to end, many firms
          each donate a slice of fiber they already own; the slices get glued together at exchanges, and
          validators plug into the combined network with a regular port. Capacity is shared, telemetry is
          public, and contributors get paid in proportion to how much their slice actually improved the
          network — measured by the telemetry, not negotiated. The payout formula is borrowed from game theory
          and called Shapley values: it asks how much worse the network would be if a given contributor
          weren&apos;t there, and pays accordingly.
        </p>

        <div style={{ margin: '2em 0', overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}></th>
                <th style={s.th}>DoubleZero</th>
                <th style={s.th}>HFT dark fiber</th>
              </tr>
            </thead>
            <tbody>
              {dzVsHft.map((r, i) => (
                <tr key={i}>
                  <td style={s.tdLabel}>{r[0]}</td>
                  <td style={s.td}>{r[1]}</td>
                  <td style={s.td}>{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={s.body}>
          The multicast row is the interesting one. Even if a validator could afford an exclusive dark-fiber
          lease, they&apos;d still get only unicast out of it — multicast at scale needs a coordinated mesh
          where every switch knows the group membership. That&apos;s something a shared network can do and a
          per-firm lease structurally cannot.
        </p>

        <h2 style={s.h2}>Frankendancer and the integration surface</h2>
        <p style={s.body}>
          This is the part that gets undersold in the Malbec docs, and the most interesting for anyone who
          writes validator code. <strong style={s.strong}>Frankendancer is on mainnet, and the wins compound
          with DoubleZero.</strong> Frankendancer — the production hybrid where Firedancer&apos;s networking
          and block-packing replace Agave&apos;s, then Agave&apos;s runtime executes — has been on mainnet
          since September 2024. It posts roughly 22% faster shredding without Merkle trees and almost 2× faster
          with them, versus Agave on the same hardware. That&apos;s pure CPU-side improvement; the wire is
          still the same wire.
        </p>
        <p style={s.body}>
          Drop Frankendancer on a DoubleZero port and the two improvements stack. Frankendancer takes less time
          to <em>produce</em> the shreds; DoubleZero takes less wall-clock and far less jitter to{' '}
          <em>deliver</em> them. Inside a 400 ms slot, the leader gets time back on both ends. The natural
          integration point is the <code style={s.code}>net_tile</code> — Firedancer&apos;s per-CPU thread that
          owns one NIC. You bind a specific <code style={s.code}>net_tile</code> to{' '}
          <code style={s.code}>doublezero0</code> so consensus traffic to mesh peers routes through it, while
          everything else goes through a separate <code style={s.code}>net_tile</code> on the regular uplink.
          Tile-level affinity lets you pin DoubleZero traffic to the cores closest to that NIC&apos;s PCIe slot,
          with no contention from public-internet traffic.
        </p>
        <p style={s.body}>
          The upstream patch that ties Firedancer&apos;s userspace directly to{' '}
          <code style={s.code}>doublezero0</code> isn&apos;t public yet, but pieces of the integration are
          already shipping. Three workspaces to watch:
        </p>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>cavemanloverboy/agave-xdp-rx-ebpf</strong> — an XDP/eBPF program that does GRE tunnel decapsulation in the kernel (strip the protocol-47 outer header, hand the inner packet to Agave or an AF_XDP Firedancer <code style={s.code}>net_tile</code>). The layer <em>below</em> the tile, and it already ships.</li>
          <li style={s.li}><strong style={s.strong}>cavemanloverboy/firedancer + agave-pr</strong> — the active workspace landing upstream Firedancer PRs, and the likely site for the userspace tile-side glue: subscription, group membership, and reconciliation between unicast and multicast paths.</li>
          <li style={s.li}><strong style={s.strong}>jito-foundation/jito-solana</strong> — Jito&apos;s Agave fork with block-engine and bundle-relayer hooks, the client most MEV-active validators run. It inherits Agave&apos;s network stack, so DoubleZero lands via the same kernel-side hooks; a packaged Jito-shipped DZ variant is unannounced.</li>
        </ul>
        <p style={s.body}>
          The kernel-side plumbing is already shipping. The tile-side glue and a Jito-packaged variant are the
          two missing pieces — both mechanically obvious, neither published yet.
        </p>

        <Aside label="Multicast subscribe at the tile level">
          DoubleZero&apos;s multicast pub/sub model maps onto Firedancer&apos;s tile model unusually well. A
          <code style={s.code}> shred</code> tile that subscribes to a DoubleZero multicast group — instead of
          receiving unicast Turbine shreds and re-publishing — collapses one full hop of the Turbine tree. The
          integration is heavier (the shred tile has to understand DZ group semantics and reconcile multicast
          with unicast), but this is where the 16-plus-ms-per-shred Frankfurt number comes from, and where most
          of the latency upside lives.
        </Aside>

        <h2 style={s.h2}>What developers can build on top</h2>
        <p style={s.body}>
          The DoubleZero Foundation GitHub org is the entry point. The interesting pieces published as of
          mainnet-beta: a <code style={s.code}>doublezero-solana</code> Rust crate (the primary client
          integration); a <code style={s.code}>doublezero-edge-solana</code> shred-receiver example (the
          shortest possible &quot;hello world&quot; for the multicast subscription API); a package sidecar that
          polls Cloudsmith for new releases; the on-chain DZ ledger program, which means anyone can build a
          third-party telemetry consumer with just RPC access; and the public TWAMP telemetry feed at{' '}
          <a href="https://data.malbeclabs.com/" target="_blank" rel="noopener noreferrer" style={s.link}>data.malbeclabs.com</a> —
          the same data that drives contributor payouts. Concretely, the things a competent dev can build this
          quarter without asking permission:
        </p>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>A jitter-aware RPC router.</strong> Read live TWAMP telemetry and route reads and writes to the validator with the best path quality for the requesting region. Useful for any RPC provider that wants to undercut Helius or Triton on tail latency without owning fiber.</li>
          <li style={s.li}><strong style={s.strong}>A multicast data feed.</strong> Publish a custom stream — oracle prices, orderbook events — into a DZ multicast group; subscribers receive at near line rate with sub-ms jitter. Pyth-style feeds are the obvious early case; private market-maker feeds are the spicier one.</li>
          <li style={s.li}><strong style={s.strong}>Skip-rate alerting.</strong> Validators on DZ should post measurably better skip rates than identical hardware off it. Build the diff and alert when the gap collapses — a sign of DZ degradation or a routing misconfig.</li>
          <li style={s.li}><strong style={s.strong}>A thin bundle relayer.</strong> Bundle semantics still need a coordinator; lowest-latency-to-leader does not, on DZ. A focused relayer that handles tip routing but assumes DZ for transport is a much smaller piece of software than Jito&apos;s full stack.</li>
          <li style={s.li}><strong style={s.strong}>A Firedancer × DZ fork.</strong> The clean architectural fit — a <code style={s.code}>net_tile</code> bound to <code style={s.code}>doublezero0</code>, a shred tile subscribing to multicast groups — is open work. Someone will publish it.</li>
        </ul>
        <p style={s.body}>
          The target audience is mostly validator operators, MEV searchers, oracle providers, and RPC providers
          — people whose business is denominated in tail-latency reduction. Secondary: anyone running a private
          latency-sensitive protocol, like a perp DEX with its own market-maker program. Tertiary: chains
          beyond Solana, since DoubleZero&apos;s transport layer is chain-agnostic and Malbec has been explicit
          that the network isn&apos;t Solana-exclusive in principle.
        </p>

        <Aside label="The unusual property">
          The source-of-truth telemetry is public, the integration crate is published, and the example code
          runs. You don&apos;t have to take anyone&apos;s word for the performance numbers — you can subscribe
          to the same TWAMP feed Malbec uses to pay contributors.
        </Aside>

        <h2 style={s.h2}>Performance, with real numbers where they exist</h2>
        <p style={s.body}>
          Three things to measure, in order of how much they matter. <strong style={s.strong}>Worst-case
          transaction land time:</strong> Malbec&apos;s published figure is ~500 ms on DoubleZero versus &gt;1.5
          s on the public internet at the tail — the headline from the Breakpoint 25 talk and the number most
          likely to move both validator skip rate and searcher inclusion rate. <strong style={s.strong}>Multicast
          versus unicast shred delivery:</strong> Frankfurt subscribers saw &gt;16 ms improvement per delivery,
          about 4% of the 400 ms window per shred per hop; compounded across Turbine depth, the slot window
          loosens meaningfully and the leader can keep ingress open longer without risking a skip.{' '}
          <strong style={s.strong}>Real-time link telemetry:</strong> TWAMP measurements between every{' '}
          <code style={s.code}>DZD</code> pair are published to the on-chain ledger and visible on
          data.malbeclabs.com. That&apos;s unusual — most private networks publish nothing — and it&apos;s
          load-bearing for the economic model, since contributors are paid on what TWAMP says.
        </p>
        <p style={s.body}>
          For the <em>median</em> validator the win is less dramatic than the tail number suggests. Its path on
          the public internet is fine most of the time. The pitch for joining is the tail: p99 jitter and skip
          rate during congested hours, especially when the leader schedule puts a Frankfurt validator right
          after a Tokyo one and the trans-Pacific shreds have to land in 200 ms.
        </p>

        <h2 style={s.h2}>What this unlocks, and the counter-thesis</h2>
        <p style={s.body}>If this works at scale, three things happen:</p>
        <ol style={s.list}>
          <li style={s.li}><strong style={s.strong}>Skip rate compresses geographically.</strong> A Tokyo validator and a Frankfurt validator stop paying a permanent tax for being far from the consensus center of mass. The leader schedule becomes location-agnostic in practice.</li>
          <li style={s.li}><strong style={s.strong}>The Jito relayer becomes one of several options.</strong> It still owns bundle semantics and tip routing; it stops owning &quot;lowest jitter to the leader,&quot; because the network already provides that.</li>
          <li style={s.li}><strong style={s.strong}>Programmable network primitives become possible.</strong> Native multicast is the first one shipped. In-network ordering, hardware-timestamped attestations, and deterministic shred reconstruction are all things a private substrate can do and the public internet cannot.</li>
        </ol>
        <p style={s.body}>
          The counter-thesis is worth saying out loud. Maybe Solana ships protocol-level improvements that close
          the jitter gap without anyone needing private fiber — async block production, better Turbine fanout,
          QUIC tuning, smarter repair. If the median validator&apos;s skip rate gets to 0.3% on plain internet,
          the marginal case for DoubleZero on the validator side weakens. The MEV and searcher side is more
          durable: tail latency for transaction submission matters regardless of consensus internals, and the
          multicast primitive isn&apos;t reproducible at the protocol layer — it requires the network layer to
          cooperate. Malbec&apos;s bet is that both fronts move at once, which is reasonable because the
          participants who care most are the ones with the budget to pay for it. The network has a real
          two-sided model: validators pay to capture skipped-slot APY, searchers pay for inclusion edge,
          contributors get paid in proportion to measured quality.
        </p>

        <blockquote style={s.blockquote}>
          ~40% of Solana validators have already joined a six-month-old network. That is the strongest evidence
          the bet is paying.
        </blockquote>

        <h2 style={s.h2}>What to watch over the next year</h2>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>Skip rate by region.</strong> Tokyo and Singapore validators on DoubleZero converging with Frankfurt validators means the thesis is working.</li>
          <li style={s.li}><strong style={s.strong}>Multicast group adoption,</strong> visible directly at data.malbeclabs.com/dz/multicast-groups. The interesting curve is how many validators move from unicast-over-DZ to multicast-over-DZ.</li>
          <li style={s.li}><strong style={s.strong}>Jito&apos;s share of bundle flow.</strong> If it drops as searcher DZ ports proliferate, the unbundling is happening.</li>
          <li style={s.li}><strong style={s.strong}>Contributor growth and POP coverage.</strong> Each new <code style={s.code}>DZX</code> in a new metro pulls in the validators racked nearby, and the network effects compound.</li>
          <li style={s.li}><strong style={s.strong}>Firedancer&apos;s net_tile integration.</strong> A clean tile-level binding to <code style={s.code}>doublezero0</code> is the obvious next milestone; the first public patch is the signal to watch.</li>
        </ul>
        <p style={s.body}>
          The simplest test: in twelve months, look at the top 50 validators by stake and count how many have a
          DoubleZero port. If most of them, the bet paid. If a handful, the public internet was good enough
          after all. Right now the answer is somewhere in the middle and rapidly converging upward.
        </p>

        <hr style={s.rule} />

        <h2 style={{ ...s.h2, fontSize: '1.2rem', marginTop: '1.6em' }}>Sources</h2>
        <Sources items={references} />

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
