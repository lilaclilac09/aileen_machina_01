'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function DoubleZeroArticle() {
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
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)', textDecoration: 'none', textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
          Archive
        </Link>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
        }}>
          AILEENA MACHINA
        </span>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 32px 64px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.45em',
            color: '#00ffea', textTransform: 'uppercase',
            padding: '4px 10px', border: '1px solid rgba(0,255,234,0.3)',
          }}>
            INFRASTRUCTURE
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.05.24
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            Solana · DoubleZero · Multicast · Frankendancer
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
          fontWeight: 700, letterSpacing: '0.04em',
          lineHeight: 1.08, marginBottom: 32, color: '#fff',
        }}>
          DoubleZero,<br /><span style={{ color: '#00ffea' }}>Multicast Fiber</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20, marginBottom: 0,
        }}>
          A Solana slot is 400ms. Inside it a validator has to receive the previous block, replay it, build
          its own, and fan out shreds before the next leader takes over. The compute is solved.
          The bottleneck is the public internet between validators. Mainnet-beta since October 2025,
          DoubleZero is the bet that the right answer is the same one HFT shops made fifteen years ago —
          private fiber — plus one thing the public internet structurally cannot do: <em>multicast</em>.
        </p>
      </section>

      {/* ── Stats wall ── */}
      <StatsWall stats={[
        { value: '~500 ms', label: 'worst-case tx land', sub: 'vs >1.5s on public internet' },
        { value: '>16 ms', label: 'per-shred multicast gain', sub: 'Frankfurt subscribers, BP25' },
        { value: '~40 %', label: 'Solana validators on DZ', sub: 'as of mainnet-beta' },
        { value: 'Oct 2025', label: 'mainnet-beta launch', sub: 'whitepaper Dec 2024' },
      ]} />

      <div style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — The bottleneck is jitter, not latency</SectionLabel>
        <p style={bodyStyle}>
          Two different things get called &quot;latency.&quot;
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Latency</strong> is the median time a packet takes from A to B.
          NYC ↔ Frankfurt is ~76ms great-circle. Light in fiber goes ~2/3 of c, so the physical
          floor is around 38ms one-way. You don&apos;t beat that without a lower-latitude path.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Jitter</strong> is the variance. P50 might be 80ms; P99 is 140ms;
          P99.9 might be 400ms because some packet hit a congested peering point and got buffered for
          300ms. That tail is the part that kills you.
        </p>
        <p style={bodyStyle}>
          Solana shred propagation under Turbine is a unicast fan-out tree. The leader sends shreds
          to a small root set; they forward to children; the tree fans down. A single late shred at
          any layer delays everyone beneath it. The block isn&apos;t reconstructed until enough shreds
          arrive, and the next leader can&apos;t safely build on top until that happens. P99 jitter at
          any intermediate hop compounds into P99+ jitter at the root of the next block.
        </p>
        <p style={bodyStyle}>
          The Malbec Labs team frames it directly in the Breakpoint 25 talk:{' '}
          <em>&quot;latency without control, you get a lot of jitter and it makes predictions that much harder.&quot;</em>{' '}
          Their headline number is the worst-case time to land a transaction:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Path</th>
                <th style={thStyle}>Worst-case tx land</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Public internet</td>
                <td style={tdStyle}>&gt;1.5 seconds</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>DoubleZero</td>
                <td style={tdStyle}>~500 ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          A 3× improvement at the tail. The median improvement is much smaller — DoubleZero
          doesn&apos;t move the speed of light. What it does is collapse the tail.
        </p>

        <SectionLabel>02 — What DoubleZero actually is</SectionLabel>
        <p style={bodyStyle}>
          Three layers stacked. Real terminology this time, not marketing.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Physical layer.</strong> Network Bandwidth Contributors provide
          dedicated bandwidth with IPv4 connectivity and an MTU of 2048 bytes between two data centers —
          in practice, wavelength services on existing long-haul fiber. Three flavors: L1 wavelength on
          DWDM/CWDM, L2 packet-switched VLAN extension, or L3 dedicated third-party bandwidth. Each
          contributed link terminates at a <strong style={strong}>DZD</strong> (DoubleZero Device — a
          physical switch, in practice a pair of Arista 7280CR3As plus AMD V80 NICs, in a 4U/4KW rack at
          each end).
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Exchange layer.</strong> Contributor links bridge to each other at{' '}
          <strong style={strong}>DZXs</strong> (DoubleZero Exchanges) — interconnect points in major
          metros. This is what turns N point-to-point contributions into a real mesh.
        </p>
        <p style={bodyStyle}><strong style={strong}>Software layer.</strong></p>
        <ul style={listStyle}>
          <li><strong style={strong}>Controller</strong> — derives device configuration from on-chain state.</li>
          <li><strong style={strong}>Config Agent + Telemetry Agent</strong> — run on each DZD. Config Agent applies whatever the Controller says; Telemetry Agent measures latency, jitter, and packet loss via <strong style={strong}>TWAMP</strong> and publishes results.</li>
          <li><code style={codeStyle}>doublezerod</code> — the daemon that runs on the validator or RPC host. Manages a <code style={codeStyle}>doublezero0</code> tunnel interface, the routing table, and the BGP session into the mesh.</li>
          <li><strong style={strong}>On-chain ledger</strong> — serviceability state and telemetry are written to a Solana program. Network state is verifiable; routing isn&apos;t a black box.</li>
        </ul>
        <p style={bodyStyle}>
          What it isn&apos;t: it&apos;s not &quot;BGP-free.&quot; DoubleZero actually <em>uses</em> BGP — but
          inside its own permissioned mesh, on <code style={codeStyle}>169.254.0.0/16</code> link-local
          addresses over GRE (IP protocol 47), with all peers and policies known. The distinction from
          the public internet isn&apos;t &quot;no BGP,&quot; it&apos;s &quot;BGP across a deterministic mesh of
          N participants&quot; vs &quot;BGP across tens of thousands of unknown ASes doing best-effort policy
          routing.&quot; Same protocol, completely different blast radius.
        </p>
        <p style={bodyStyle}>
          The live multicast group state, contributor list, and per-link telemetry are published at{' '}
          <a href="https://data.malbeclabs.com/" target="_blank" rel="noopener noreferrer" style={inlineLink}>data.malbeclabs.com</a>{' '}
          — including{' '}
          <a href="https://data.malbeclabs.com/dz/multicast-groups" target="_blank" rel="noopener noreferrer" style={inlineLink}>/dz/multicast-groups</a>{' '}
          for the multicast topology specifically. The transparency is part of the design: contributors
          get paid based on measured service quality, so the measurements have to be public.
        </p>

        <SectionLabel>03 — The multicast trick</SectionLabel>
        <p style={bodyStyle}>
          Here is what makes DoubleZero structurally different from &quot;we leased fiber.&quot;
        </p>
        <p style={bodyStyle}>
          Solana&apos;s Turbine sends shreds as unicast. The leader picks a root validator and sends one
          copy. The root forwards a copy to each of its children. Each child forwards to its children.
          To deliver one block to 1500 validators, the network carries roughly 1500 copies of every
          shred at the worst layer, and the depth of the tree adds latency at every hop.
        </p>
        <p style={bodyStyle}>
          The public internet has no choice but unicast at that scale. IP multicast exists in the spec
          but is almost universally disabled across the open internet — no ISP wants to carry replicated
          traffic for a third party. So Solana built a unicast tree on top of best-effort unicast delivery.
        </p>
        <p style={bodyStyle}>
          DoubleZero adds <strong style={strong}>native multicast</strong> as a connection mode. A
          publisher sends one copy of a packet to a multicast group. The mesh replicates that packet at
          the switch fabric — at each DZD, in hardware, fan-out happens once and the copies go to every
          subscriber on the right egress links. From the publisher&apos;s perspective, one send. From each
          subscriber&apos;s perspective, one receive at near-line-rate.
        </p>
        <p style={bodyStyle}>
          For shred propagation specifically, the talk numbers it: Frankfurt subscribers saw{' '}
          <strong style={strong}>gains exceeding 16ms</strong> on shred delivery via multicast vs unicast.
          That&apos;s per hop, per shred. For a hot validator on the next leader&apos;s slot, 16ms is 4% of
          the entire slot window.
        </p>

        <Diagram caption="Replication moves from the leader's upstream NIC into the DZD switch fabric.">
{`  ┌─ PUBLIC INTERNET — UNICAST TURBINE ──────────────────────────────┐
  │                                                                   │
  │   leader ──► root ──► child ──► grandchild ──► …                  │
  │                                                                   │
  │   N copies of every shred · N hops of compound jitter             │
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘

  ┌─ DOUBLEZERO — NATIVE MULTICAST ──────────────────────────────────┐
  │                                                                   │
  │   publisher ─► group ──────╮                                      │
  │                            │   (1 copy in, hardware replicated    │
  │                       ┌────┴────┐    at each DZD switch fabric)   │
  │                       ▼    ▼    ▼                                 │
  │                     sub  sub  sub  …                              │
  │                                                                   │
  │   1 send · 1 receive per subscriber · sub-ms jitter               │
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘`}
        </Diagram>

        <p style={bodyStyle}>
          You can run Turbine over DoubleZero unicast and still win on jitter. You can run shred
          distribution over DoubleZero multicast and additionally win 16+ms per hop. The multicast path
          is the harder integration and the bigger payoff.
        </p>

        <PullQuote>
          The public internet has no choice but unicast at that scale. DoubleZero adds multicast back
          as a network primitive — the harder integration, and the bigger payoff.
        </PullQuote>

        <SectionLabel>04 — Connecting a validator</SectionLabel>
        <p style={bodyStyle}>
          The part people get wrong: the original DoubleZero pitch sounded like &quot;lease a wavelength,
          rebuild your validator.&quot; The actual story is much smaller.
        </p>
        <p style={bodyStyle}>
          The killer feature is <strong style={strong}>IBRL</strong> — a connection mode that lets
          validators and RPC nodes connect to DoubleZero <em>without restarting their blockchain clients</em>.
          You don&apos;t fork Agave or Firedancer. You don&apos;t take downtime. <code style={codeStyle}>doublezerod</code> brings
          up a tunnel interface and a routing table, and the validator&apos;s existing sockets start
          using the better path for any peer that&apos;s also on the mesh.
        </p>
        <p style={bodyStyle}>Prerequisites are unglamorous:</p>
        <ul style={listStyle}>
          <li>x86_64 server, Ubuntu 22.04+ / Debian 11+ / Rocky / RHEL 8+, installed directly on the validator host (not in a container)</li>
          <li>Public IP, no NAT</li>
          <li>Firewall opens IP protocol 47 (GRE) and TCP/179 (BGP) on the link-local range</li>
          <li>A cross-connect from your colo cage to a participating DZX</li>
        </ul>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`# Ubuntu mainnet-beta install
curl -1sLf https://dl.cloudsmith.io/public/malbeclabs/doublezero/setup.deb.sh | sudo -E bash
sudo apt-get install doublezero

doublezero keygen        # generates identity at ~/.config/doublezero/id.json
doublezero address       # prints your DZ pubkey
sudo systemctl status doublezerod
doublezero latency       # discover DZDs, measure ping
doublezero status        # confirm connection`}
          </pre>
        </div>

        <p style={bodyStyle}>
          <code style={codeStyle}>doublezero latency</code> is the one to run before signing anything.
          It enumerates the DZDs you can reach and shows ping times — if your nearest POP is more than a
          few ms away, the cross-connect topology isn&apos;t right yet.
        </p>
        <p style={bodyStyle}>
          Testnet and mainnet-beta are <em>physically distinct networks</em>, not the same fiber with
          different routing. You pick one at install time via the repo URL.
        </p>
        <p style={bodyStyle}>
          What the validator binary sees: nothing changed, except that traffic to peers also on the mesh
          now exits <code style={codeStyle}>doublezero0</code> instead of the default route, with much
          tighter jitter. Turbine and gossip pick paths from the OS routing table — they don&apos;t know
          or care that the better path is on dedicated fiber.
        </p>

        <SectionLabel>05 — Connecting a searcher or extractor</SectionLabel>
        <p style={bodyStyle}>
          The searcher geometry is different. You don&apos;t need to talk to every validator. You need to
          talk to the current leader, and the next few leaders, with the lowest possible tail latency.
          The leader schedule is public.
        </p>
        <p style={bodyStyle}>
          Today&apos;s serious-MEV stack: co-locate near a major validator concentration (FRA, NYC, TYO),
          stream tx submissions to multiple validator vote accounts, optionally route through Jito&apos;s
          relayer for bundle semantics, and pray the path to this slot&apos;s leader isn&apos;t going through
          Ashburn on a bad afternoon.
        </p>
        <p style={bodyStyle}>
          With a DoubleZero port your tx leaves your host, traverses one mesh hop to the leader&apos;s
          POP, and lands in their ingress queue in deterministic time. The variance disappears.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>THE NON-OBVIOUS CONSEQUENCE</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            <strong style={strong}>The Jito relayer hop becomes optional for latency reasons.</strong>{' '}
            You might still want it for bundle semantics, tip routing, or revert protection — but the
            latency argument for funneling everything through one relayer collapses when the underlying
            network is already deterministic. Searcher economics shift accordingly.
          </p>
        </div>

        <p style={bodyStyle}>
          Per-millisecond revenue for searchers is asymmetric — losing the race on a profitable
          opportunity costs you the entire opportunity, not a fraction. The math for paying for a DZ
          port works out at much smaller scales for searchers than it does for validators.
        </p>

        <SectionLabel>06 — Compared to renting your own fiber</SectionLabel>
        <p style={bodyStyle}>
          HFT firms have been solving this problem since ~2010, and the comparison is worth making
          explicit because it&apos;s exactly why DoubleZero is structured as a shared substrate.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The HFT model.</strong> A trading firm signs a dark-fiber lease (or
          microwave path, McKay/Anova-style) on a specific route — say NYC → Aurora for CME, or NYC →
          London for LSE. They light their own wavelength, terminate at colocation cages on both ends,
          own every meter exclusively.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>NYC ↔ CHI HFT-grade</th>
                <th style={thStyle}>NYC ↔ FRA HFT-grade</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Setup</td>
                <td style={tdStyle}>$50k–$200k</td>
                <td style={tdStyle}>$250k+</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Annual</td>
                <td style={tdStyle}>$500k–$2M</td>
                <td style={tdStyle}>$1M–$5M</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Capacity</td>
                <td style={tdStyle}>One firm, one wavelength</td>
                <td style={tdStyle}>One firm, one wavelength</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Provisioning</td>
                <td style={tdStyle}>months</td>
                <td style={tdStyle}>6–12 months</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          You get the absolute best latency on earth for that route. You also pay for the entire pipe
          regardless of how much you push through it. For a firm doing $100M/year of MEV that math
          works. For a 50-validator cluster trying to recover skipped-slot APY, it doesn&apos;t.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The DoubleZero model.</strong> A bandwidth contributor dedicates a
          wavelength to the shared substrate, terminates it on a DZD pair (Arista 7280CR3A + AMD V80,
          ~4U/4KW per side), and bridges to the rest of the network at the nearest DZX. Many validators
          and searchers share ports into that substrate. Capacity is multiplexed, telemetry is published,
          contributors get paid via the on-chain Shapley-value reward program proportional to their
          measured contribution to network quality.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>DoubleZero</th>
                <th style={thStyle}>HFT dark fiber</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Latency</td>
                <td style={tdStyle}>Within a few % of theoretical floor</td>
                <td style={tdStyle}>Theoretical floor</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Jitter</td>
                <td style={tdStyle}>Sub-ms tail, published live</td>
                <td style={tdStyle}>Sub-ms tail, you measure</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Multicast</td>
                <td style={tdStyle}>Yes (native, hardware replicated)</td>
                <td style={tdStyle}>No (you&apos;d have to build it)</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Cost model</td>
                <td style={tdStyle}>Per-port, shared</td>
                <td style={tdStyle}>Per-route, exclusive</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Provisioning</td>
                <td style={tdStyle}>Days–weeks</td>
                <td style={tdStyle}>Months</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Counterparty</td>
                <td style={tdStyle}>Network governance + on-chain telemetry</td>
                <td style={tdStyle}>Carrier SLAs + your lawyers</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The multicast row is the interesting one. Even if a validator could afford an exclusive
          dark-fiber lease, they&apos;d still get only unicast out of it — multicast at scale needs a
          coordinated mesh where every switch knows the group membership. That&apos;s something a shared
          network can do and a per-firm lease structurally cannot.
        </p>

        <SectionLabel>07 — Frankendancer and the integration surface</SectionLabel>
        <p style={bodyStyle}>
          This is the part that gets undersold in the Malbec docs and is the most interesting for anyone
          who actually writes validator code.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Frankendancer is on mainnet, and the wins compound with DoubleZero.</strong>{' '}
          Frankendancer — the production hybrid where Firedancer&apos;s networking and block-packing
          replace Agave&apos;s, then Agave&apos;s runtime executes — has been on mainnet since September
          2024. It posts roughly <strong style={strong}>~22% faster shredding without Merkle trees and
          almost 2× faster with Merkle trees</strong> vs Agave&apos;s path on the same hardware. That&apos;s
          pure CPU-side improvement; the wire is still the same wire.
        </p>
        <p style={bodyStyle}>
          Drop Frankendancer on a DoubleZero port and the two improvements stack. Frankendancer takes
          less time to <em>produce</em> the shreds; DoubleZero takes less wall-clock and far less jitter
          to <em>deliver</em> them. Inside a 400ms slot, the leader gets back time on both ends — more
          time to keep the tx ingress open, less time spent waiting for the previous block&apos;s shreds
          to fully arrive before building.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The integration shape is the <code style={codeStyle}>net_tile</code>.</strong>{' '}
          Firedancer&apos;s{' '}
          <a href="https://docs.firedancer.io/guide/internals/net_tile.html" target="_blank" rel="noopener noreferrer" style={inlineLink}>net_tile</a>{' '}
          is the per-CPU thread that owns one NIC. The natural integration point with DoubleZero is binding
          a specific <code style={codeStyle}>net_tile</code> to the <code style={codeStyle}>doublezero0</code> interface —
          consensus traffic to peers also on the mesh routes through that tile; everything else routes
          through a separate <code style={codeStyle}>net_tile</code> bound to the regular uplink. Tile-level
          affinity means you can pin DoubleZero traffic to the cores closest to its NIC&apos;s PCIe slot,
          with no contention from public-internet traffic on the same thread.
        </p>
        <p style={bodyStyle}>
          The upstream <code style={codeStyle}>net_tile</code> patch that ties Firedancer&apos;s userspace
          directly to <code style={codeStyle}>doublezero0</code> isn&apos;t public yet — but pieces of
          the integration are already shipping. Three workspaces to watch:
        </p>

        <CardGrid cards={[
          {
            num: '01',
            tag: 'Kernel',
            title: 'cavemanloverboy/agave-xdp-rx-ebpf',
            href: 'https://github.com/cavemanloverboy/agave-xdp-rx-ebpf',
            body: <>XDP/eBPF program for Solana traffic that does <strong style={strong}>GRE tunnel decapsulation</strong> — strip the protocol-47 outer header in kernel, hand the inner packet to Agave or an AF_XDP-backed Firedancer <code style={codeStyle}>net_tile</code>. This is the layer <em>below</em> <code style={codeStyle}>net_tile</code>, and it already ships.</>,
          },
          {
            num: '02',
            tag: 'Tile glue',
            title: 'cavemanloverboy/firedancer + agave-pr',
            href: 'https://github.com/cavemanloverboy',
            body: <>Active workspace landing upstream Firedancer PRs (recent: #8218, <em>resolv: use exact block height check</em>). The likely site for the userspace tile-side glue — subscription, group membership, reconciliation between unicast and multicast paths.</>,
          },
          {
            num: '03',
            tag: 'MEV client',
            title: 'jito-foundation/jito-solana',
            href: 'https://github.com/jito-foundation/jito-solana',
            body: <>Jito&apos;s Agave fork with block engine + bundle relayer hooks. The client most MEV-active validators run today. Inherits Agave&apos;s network stack, so any DZ integration lands via the same kernel-side hooks as on stock Agave. A packaged Jito-shipped DZ variant is unannounced.</>,
          },
        ]} />

        <p style={bodyStyle}>
          The kernel-side plumbing is already shipping. The tile-side glue and a Jito-Foundation-packaged
          variant are the two missing pieces — both are mechanically obvious, neither is published yet.
        </p>

        <div style={calloutInfo}>
          <p style={calloutTitle}>MULTICAST SUBSCRIBE AT THE TILE LEVEL</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            DoubleZero&apos;s multicast pub/sub model maps onto Firedancer&apos;s tile model unusually well.
            A <code style={codeStyle}>shred</code> tile that subscribes to a DoubleZero multicast group —
            instead of receiving unicast Turbine shreds and re-publishing — collapses one full hop of the
            Turbine tree. For deep Turbine fanouts that&apos;s compound savings. The integration work is
            heavier here (the shred tile has to understand DZ group semantics and reconciliation between
            multicast and unicast paths) but this is where the 16+ms-per-shred Frankfurt number from §3
            comes from, and it&apos;s where most of the latency upside lives.
          </p>
        </div>

        <SectionLabel>08 — What developers can build on top</SectionLabel>
        <p style={bodyStyle}>
          The{' '}
          <a href="https://github.com/doublezerofoundation/" target="_blank" rel="noopener noreferrer" style={inlineLink}>DoubleZero Foundation GitHub org</a>{' '}
          is the entry point. The interesting pieces published as of mainnet-beta:
        </p>

        <ul style={listStyle}>
          <li><strong style={strong}><code style={codeStyle}>doublezero-solana</code> Rust crate</strong> (v0.3.0 as of late 2025) — primary client integration. If you&apos;re writing a Solana service that wants to be DZ-aware, this is what you depend on.</li>
          <li><strong style={strong}><code style={codeStyle}>doublezero-edge-solana</code> shred receiver example</strong> — a minimal program that subscribes to shreds over DoubleZero and prints throughput. The shortest possible &quot;hello world&quot; for the multicast subscription API.</li>
          <li><strong style={strong}>Package sidecar</strong> — polls Cloudsmith for new <code style={codeStyle}>doublezero</code> releases and runs <code style={codeStyle}>apt-update</code>. Boring infra, but the kind of thing you want pinned and audited if you&apos;re running validators at scale.</li>
          <li><strong style={strong}>On-chain DZ ledger program</strong> — telemetry and serviceability state are written to a Solana program. Anyone can build a third-party telemetry consumer without permission from Malbec, just RPC access.</li>
          <li><strong style={strong}>TWAMP telemetry feed</strong> via <a href="https://data.malbeclabs.com/" target="_blank" rel="noopener noreferrer" style={inlineLink}>data.malbeclabs.com</a> — the same data that drives contributor payouts. Public, structured, queryable.</li>
        </ul>

        <p style={bodyStyle}>
          Concretely, the things a competent dev can build this quarter without asking permission:
        </p>

        <CardGrid cards={[
          {
            num: '01',
            tag: 'RPC',
            title: 'Jitter-aware RPC router',
            body: <>Read live TWAMP telemetry, route reads/writes to the validator with the best path-quality for the requesting region. Useful for any RPC provider that wants to undercut Helius/Triton on tail latency without owning fiber.</>,
          },
          {
            num: '02',
            tag: 'Feed',
            title: 'Multicast data feed',
            body: <>Publish a custom data stream (oracle prices, orderbook events) into a DZ multicast group. Subscribers receive at near-line-rate with sub-ms jitter. Pyth-style feeds are the obvious early case; private MM feeds are the spicier one.</>,
          },
          {
            num: '03',
            tag: 'Alert',
            title: 'Skip-rate alerting',
            body: <>Validators on DZ should post measurably better skip rates than identical hardware off DZ. Build the diff, alert when the gap collapses — suggests DZ degradation or a routing misconfig.</>,
          },
          {
            num: '04',
            tag: 'Relayer',
            title: 'Thin bundle relayer',
            body: <>Bundle semantics still need a coordinator; lowest-latency-to-leader does not, on DZ. A focused relayer that handles tip routing but assumes DZ for transport is a meaningfully smaller piece of software than Jito&apos;s full stack.</>,
          },
          {
            num: '05',
            tag: 'Fork',
            title: 'Firedancer × DZ fork',
            body: <>The clean architectural fit described in §7 is open work — net_tile bound to <code style={codeStyle}>doublezero0</code>, shred tile subscribing to multicast groups. Someone will publish it.</>,
          },
        ]} />

        <p style={bodyStyle}>
          <strong style={strong}>Target dev audience.</strong> Mostly Solana validator operators, MEV
          searchers, oracle providers, and RPC providers — people whose business is denominated in
          tail-latency reduction. Secondary audience: anyone running a private financial protocol with
          latency-sensitive participants (perp DEXes with their own market-maker programs, orderbook
          venues with non-validator participants who still care about tx submission speed). Tertiary:
          blockchain projects beyond Solana — DZ&apos;s transport layer is chain-agnostic, and Malbec has
          been explicit that the network isn&apos;t Solana-exclusive in principle.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>THE UNUSUAL PROPERTY</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            The source-of-truth telemetry is <strong style={strong}>public</strong>, the integration
            crate is published, and the example code runs. You don&apos;t have to take anyone&apos;s word
            for performance numbers — you can subscribe to the same TWAMP feed Malbec uses to pay
            contributors.
          </p>
        </div>

        <SectionLabel>09 — Performance, with real numbers where they exist</SectionLabel>
        <p style={bodyStyle}>
          Three things to measure, in order of how much they matter to participants:
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Worst-case tx land time.</strong> Malbec&apos;s published figure: ~500ms
          on DoubleZero vs &gt;1.5s on public internet at the tail. This is the headline number from the
          BP25 talk and the one most likely to move both validator skip rate and searcher inclusion rate.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Multicast vs unicast shred delivery.</strong> Frankfurt subscribers saw
          &gt;16ms improvement per delivery in published testing. For a leader sitting on a 400ms slot,
          that&apos;s ~4% of the entire window recovered, per shred, per hop. Compounded across Turbine
          depth, the slot window loosens meaningfully — and the leader can keep tx ingress open longer
          without risking a skip.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Real-time link-level telemetry.</strong> TWAMP measurements between
          every DZD pair are published to the on-chain ledger and visible on{' '}
          <a href="https://data.malbeclabs.com/" target="_blank" rel="noopener noreferrer" style={inlineLink}>data.malbeclabs.com</a>.
          This is unusual — most private networks publish nothing — and it&apos;s load-bearing for the
          economic model. Contributors get paid based on what TWAMP says, so the measurements are the asset.
        </p>
        <p style={bodyStyle}>
          For the <em>median</em> validator the win is less dramatic than the tail number suggests. The
          median validator&apos;s path on public internet is fine most of the time. The pitch for joining
          is the tail: P99 jitter and skip rate during congested hours, particularly when the leader
          schedule puts a Frankfurt validator next after a Tokyo validator and the trans-Pacific shred
          propagation has to land in 200ms.
        </p>

        <SectionLabel>10 — What this unlocks, and the counter-thesis</SectionLabel>
        <p style={bodyStyle}>If this works at scale, three things happen:</p>
        <ol style={{ paddingLeft: 24, margin: '24px 0 32px', lineHeight: 1.9, color: 'rgba(255,255,255,0.65)' }}>
          <li style={{ marginBottom: 12 }}>
            <strong style={strong}>Skip rate compresses geographically.</strong> A Tokyo validator and a
            Frankfurt validator stop paying a permanent tax for being far from the consensus center of
            mass. The leader schedule becomes location-agnostic in practice.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong style={strong}>The Jito relayer becomes one of several options.</strong> It still
            owns bundle semantics and tip routing. It stops owning &quot;lowest jitter to the leader&quot;
            because the underlying network already provides that.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong style={strong}>Programmable network primitives become possible.</strong> Native
            multicast is the first one shipped. In-network ordering, hardware-timestamped attestations,
            and deterministic shred reconstruction are all things that a private substrate can do and
            the public internet cannot.
          </li>
        </ol>
        <p style={bodyStyle}>
          The counter-thesis is worth saying out loud.{' '}
          <strong style={strong}>Maybe Solana ships protocol-level improvements that close the jitter
          gap without anyone needing private fiber.</strong> Async block production, better Turbine
          fanout, QUIC tuning, smarter repair — each chips at the same problem from inside the protocol.
          If the median validator&apos;s skip rate gets to 0.3% on plain internet, the marginal case for
          DoubleZero on the validator side weakens.
        </p>
        <p style={bodyStyle}>
          The MEV/searcher side is more durable. Tail-latency for tx submission is going to matter
          regardless of consensus internals, and the multicast primitive isn&apos;t reproducible at the
          protocol layer — it requires the network layer to cooperate.
        </p>
        <p style={bodyStyle}>
          The bet Malbec is making is that <em>both</em> fronts move — protocol improvements happen, AND
          a dedicated network is still worth it for the participants who care most. That&apos;s a
          reasonable bet because the participants who care most are the ones with the budget to pay for
          it. The network has a real two-sided business model: validators pay to capture skipped-slot
          APY, searchers pay to capture inclusion-rate edge, contributors get paid in proportion to
          measured quality.
        </p>

        <blockquote style={blockquoteStyle}>
          ~40% of Solana validators have already joined a six-month-old network. That is the strongest
          evidence the bet is paying.
        </blockquote>

        <SectionLabel>11 — What to watch over the next year</SectionLabel>
        <ul style={listStyle}>
          <li><strong style={strong}>Skip rate distribution by region.</strong> Tokyo/Singapore validators on DoubleZero converging with Frankfurt validators = thesis working. Track via standard validator leaderboards plus the <a href="https://data.malbeclabs.com/" target="_blank" rel="noopener noreferrer" style={inlineLink}>DZ telemetry dashboard</a>.</li>
          <li><strong style={strong}>Multicast group adoption.</strong> Visible directly at <a href="https://data.malbeclabs.com/dz/multicast-groups" target="_blank" rel="noopener noreferrer" style={inlineLink}>data.malbeclabs.com/dz/multicast-groups</a>. The interesting curve is how many validators move from unicast-over-DZ to multicast-over-DZ.</li>
          <li><strong style={strong}>Jito relayer&apos;s share of bundle flow.</strong> If it drops as searcher DZ ports proliferate, the unbundling is happening.</li>
          <li><strong style={strong}>Contributor growth and POP coverage.</strong> Each new DZX in a new metro pulls in the validators racked nearby. Network effects compound.</li>
          <li><strong style={strong}>Firedancer&apos;s net_tile integration.</strong> Clean tile-level integration with <code style={codeStyle}>doublezero0</code> is the obvious next milestone. First public patch is the signal to watch.</li>
        </ul>
        <p style={bodyStyle}>
          The simplest test: in twelve months, look at the top 50 validators by stake, count how many
          have a DoubleZero port. If most of them, the bet paid. If a handful, public internet was good
          enough after all. Right now the answer is somewhere in the middle and rapidly converging
          upward.
        </p>

        <SectionLabel>References</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <ol style={{ paddingLeft: 28, margin: 0 }}>
            {[
              { label: 'DoubleZero Foundation — GitHub org', href: 'https://github.com/doublezerofoundation/' },
              { label: 'Malbec Labs docs (root)', href: 'https://docs.malbeclabs.com/' },
              { label: 'DoubleZero architecture', href: 'https://docs.malbeclabs.com/architecture/' },
              { label: 'Setup procedure for clients', href: 'https://docs.malbeclabs.com/setup/' },
              { label: 'Contributor requirements (hardware specs)', href: 'https://docs.malbeclabs.com/contribute/' },
              { label: 'Glossary — DZD, DZX, IBRL, TWAMP', href: 'https://docs.malbeclabs.com/glossary/' },
              { label: 'DoubleZero Whitepaper (Dec 2024)', href: 'https://malbeclabs.com/whitepaper.pdf' },
              { label: 'Breakpoint 25 tech talk — Malbec Labs (Solana Compass writeup)', href: 'https://solanacompass.com/learn/breakpoint-25/tech-talk-malbec-labs' },
              { label: 'Live telemetry dashboard', href: 'https://data.malbeclabs.com/' },
              { label: 'Multicast groups — live', href: 'https://data.malbeclabs.com/dz/multicast-groups' },
              { label: 'Firedancer net_tile internals', href: 'https://docs.firedancer.io/guide/internals/net_tile.html' },
              { label: 'Firedancer (Jump Crypto)', href: 'https://github.com/firedancer-io/firedancer' },
              { label: 'cavemanloverboy/agave-xdp-rx-ebpf — XDP+GRE decap for Solana traffic', href: 'https://github.com/cavemanloverboy/agave-xdp-rx-ebpf' },
              { label: 'cavemanloverboy GitHub profile (firedancer + agave-pr workspaces)', href: 'https://github.com/cavemanloverboy' },
              { label: 'jito-foundation/jito-solana — MEV Solana client (third candidate for DZ integration)', href: 'https://github.com/jito-foundation/jito-solana' },
              { label: 'Jito Foundation GitHub org', href: 'https://github.com/jito-foundation' },
              { label: 'Solana at Wire Speed — validator architecture (companion piece)', href: '/blog/wire' },
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
                >
                  {ref.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

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

const listStyle: React.CSSProperties = {
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
            fontFamily: 'monospace', fontSize: '0.5rem', letterSpacing: '0.4em',
            color: 'rgba(0,255,234,0.55)', textTransform: 'uppercase',
          }}>
            {String(i + 1).padStart(2, '0')}
          </span>
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

/* ── Card grid for integration candidates / dev build ideas ── */
function CardGrid({ cards, columns = 3 }: {
  cards: { num: string; tag: string; title: string; href?: string; body: React.ReactNode }[];
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
              <span style={{
                fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.3em',
                color: 'rgba(0,255,234,0.55)',
              }}>
                {c.num}
              </span>
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

/* ── Pull quote (big inline quote, less heavy than blockquote) ── */
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

/* ── Diagram frame (wraps ASCII/code as a visual figure) ── */
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
