'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function ValidatorClientsArticle() {
  return (
    <SubstackShell
      category="Infrastructure"
      date="2026.05.27"
      tags="Solana · Validator · Firedancer · FPGA · Architecture"
      title="Five Validator Clients, One Pipeline, No Full-FPGA"
      dek={<>Agave, Jito-Solana, Frankendancer, Firedancer, Sig — five clients, one pipeline. Jump has a working FPGA verify engine doing 1M signatures per second. They still didn&apos;t ship a full-FPGA validator. Here&apos;s why the math doesn&apos;t close, and where FPGA actually wins.</>}
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Five validator implementations target the Solana protocol in 2026. Three are running real stake on mainnet today, one is partial-production, one is testnet. Each one is a different bet about which part of the validator was the bottleneck. The interesting question is not which one is fastest — it is what each team chose <em>not</em> to do, and what that tells you about where the next 10× actually lives.
        </p>

        <SectionLabel>The 2026 client landscape</SectionLabel>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Team</th>
                <th style={thStyle}>Language</th>
                <th style={thStyle}>Status (2026)</th>
                <th style={thStyle}>What it bets on</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Agave</td>
                <td style={tdStyle}>Anza (ex-Solana Labs)</td>
                <td style={tdStyle}>Rust</td>
                <td style={tdStyle}>Reference. Majority stake.</td>
                <td style={tdStyle}>Correctness, runtime stability</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Jito-Solana</td>
                <td style={tdStyle}>Jito Labs</td>
                <td style={tdStyle}>Rust (Agave fork)</td>
                <td style={tdStyle}>~80% of validators run it</td>
                <td style={tdStyle}>MEV: bundles, block-engine, ShredStream</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Frankendancer</td>
                <td style={tdStyle}>Jump / Firedancer team</td>
                <td style={tdStyle}>C + Rust (hybrid)</td>
                <td style={tdStyle}>Production on mainnet, growing stake</td>
                <td style={tdStyle}>Firedancer network + Agave runtime</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Firedancer (full)</td>
                <td style={tdStyle}>Jump / Firedancer team</td>
                <td style={tdStyle}>C, from scratch</td>
                <td style={tdStyle}>Testnet, partial mainnet</td>
                <td style={tdStyle}>Total rewrite, tile architecture</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Sig</td>
                <td style={tdStyle}>Syndica</td>
                <td style={tdStyle}>Zig</td>
                <td style={tdStyle}>RPC node + partial validator (testnet)</td>
                <td style={tdStyle}>Read path, indexer-grade RPC</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The split that matters: <strong style={strong}>Agave and its fork Jito-Solana</strong> share one codebase and ~98% of mainnet stake. <strong style={strong}>Frankendancer</strong> is the Jump team&apos;s production stepping stone — their networking and block-production tiles bolted onto the Agave runtime. <strong style={strong}>Firedancer</strong> is the full Jump rewrite, still finishing its execution layer. <strong style={strong}>Sig</strong> is the Syndica bet that the read-side (RPC, indexing) was always the misallocated half of the validator.
        </p>

        <SectionLabel>What a validator client actually is</SectionLabel>

        <p style={bodyStyle}>
          Strip away the marketing and a Solana validator is a single linear pipeline. A transaction enters at the network card and leaves as bytes in the ledger, having passed through nine distinct stages. Every client implements the same stages; the differences are which stages they fuse, which they parallelize, and where they spend their CPU budget.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`NIC → net → quic → verify → dedup → pack → bank → poh → shred → store
       └─────┬─────┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘ └─┬─┘  └─┬─┘
       packet in     dup    ord   exec   PoH   FEC   disk
       sig check     drop   pack  txn    hash  out   write`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Agave runs this pipeline as one process with threads. Firedancer runs each stage as a dedicated <em>tile</em> — a single-purpose process pinned to a single CPU core, communicating with neighbours only through shared-memory ring buffers, never blocking, never sleeping, busy-polling the input ring at every cycle. The tile model is what makes Firedancer fast. It is also what makes the FPGA question interesting.
        </p>

        <SectionLabel>Firedancer&apos;s tile architecture, in five rules</SectionLabel>

        <p style={bodyStyle}>
          The architecture reads like an FPGA design document translated to userspace C. Five rules govern every tile:
        </p>

        <ul style={listStyle}>
          <li>
            <strong style={strong}>One job per tile.</strong> A verify tile only verifies signatures. A pack tile only orders transactions. There is no general-purpose scheduler — no thread pool, no work-stealing queue. Each tile is a fixed-function module.
          </li>
          <li>
            <strong style={strong}>Memory is preallocated, never freed.</strong> Tiles allocate all working memory at startup using huge pages. No <code style={codeStyle}>malloc</code> in the hot path. The arena allocator is the only memory primitive.
          </li>
          <li>
            <strong style={strong}>Tiles never sleep.</strong> Busy-polling, every tile, always. The cost is one core fully consumed per tile; the benefit is zero scheduler jitter.
          </li>
          <li>
            <strong style={strong}>Kernel bypass on the network path.</strong> <code style={codeStyle}>net</code> tile uses Linux <code style={codeStyle}>AF_XDP</code> in <code style={codeStyle}>drv</code> mode where the NIC supports it — DMA straight to userspace, no syscall per packet, no kernel routing.
          </li>
          <li>
            <strong style={strong}>Zero syscalls in the hot tiles.</strong> Verify, dedup, pack, poh make zero system calls during normal operation. <code style={codeStyle}>seccomp</code> enforces it: each tile ships with an explicit syscall blacklist.
          </li>
        </ul>

        <p style={bodyStyle}>
          Substitute &quot;tile&quot; with &quot;module&quot; and &quot;ring buffer&quot; with &quot;wire&quot; and this is verbatim how a modern FPGA validator would be described. Jump did not reinvent FPGA design as a metaphor — they built the FPGA architecture in C, on commodity CPUs, because the FPGA card was the part they could remove.
        </p>

        <SectionLabel>The three pieces that make the architecture work</SectionLabel>

        <p style={bodyStyle}>
          <strong style={strong}>AF_XDP, in <code style={codeStyle}>drv</code> mode.</strong> The <code style={codeStyle}>net</code> tile binds the NIC&apos;s receive queues directly into userspace memory using Linux&apos;s <code style={codeStyle}>AF_XDP</code> socket family. In <code style={codeStyle}>drv</code> mode the NIC writes packets straight into a userspace ring buffer with DMA, skipping the kernel routing stack, the per-packet syscall, and the copy that a normal Linux socket would force. The tile busy-polls the ring on its dedicated core and wakes the kernel only about 20,000 times per second to batch RX/TX completions — small enough to be free, large enough to keep packets flowing. The <code style={codeStyle}>skb</code> fallback exists for NICs without driver-mode support, at the cost of giving up the zero-copy.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>SIMD-vectorised Ed25519.</strong> The <code style={codeStyle}>verify</code> tile runs signature verification in batches of eight using AVX-512 lanes. One AVX-512 instruction does the work of eight scalar instructions; one verify tile does the work of eight scalar cores. Tile count is a runtime parameter — spin up four verify tiles and you get 32× scalar throughput on a single socket. The horizontal scaling is what makes a pure-CPU verify path competitive with the FPGA path on workloads the network actually sees.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>fd_quic, custom QUIC.</strong> Jump couldn&apos;t find a C QUIC library that met their licence + performance + reliability bar, so they wrote one. On a single CPU core the custom stack pushes <strong style={strong}>5.8 Gbps</strong>, hits <strong style={strong}>270k TPS</strong> on large-transaction workloads and <strong style={strong}>1.4M TPS</strong> on small-transaction workloads. The library is conservative about allocation — every datastructure pre-sized at startup, no growth in the hot path — which is the same memory discipline you would see in any production FPGA pipeline.
        </p>

        <SectionLabel>Security as a side effect</SectionLabel>

        <p style={bodyStyle}>
          The tile model produces an attack-surface reduction almost incidentally. Linux exposes more than 200 syscalls; every one is an entry point for a kernel exploit reachable from validator code. By design the hot tiles — quic, verify, dedup, pack, poh — issue <em>zero</em> syscalls during steady-state operation. Firedancer enforces this with a <code style={codeStyle}>seccomp</code> blacklist generated per tile, so a tile that tries to call <code style={codeStyle}>execve</code> or <code style={codeStyle}>open</code> gets killed by the kernel before it can do damage. The architecture chose performance and got security included.
        </p>

        <SectionLabel>The FPGA temptation Jump actually tested</SectionLabel>

        <p style={bodyStyle}>
          In a 2023 live demo, the Firedancer team showed a single FPGA verifying <strong style={strong}>1 million Ed25519 signatures per second</strong>. Eight FPGAs scaled linearly to <strong style={strong}>8 million/sec</strong>. For reference, peak mainnet signature throughput today rarely exceeds 200k/sec. One FPGA card has five times the headroom of the entire network.
        </p>

        <p style={bodyStyle}>
          So why is the production verify tile written in C with AVX-512 intrinsics, not running on an FPGA? Because signature verification is the easy case. It is a pure stream, no state, embarrassingly parallel, identical 32-byte payloads. <em>Of course</em> an FPGA wins. The interesting question is what FPGA does on the other eight tiles.
        </p>

        <SectionLabel>Where the pipeline stops being FPGA-friendly</SectionLabel>

        <p style={bodyStyle}>
          Run through the tiles one at a time and the FPGA story collapses:
        </p>

        <ul style={listStyle}>
          <li>
            <strong style={strong}>net / quic.</strong> Packet I/O, congestion-window arithmetic, retransmission timers. Borderline FPGA territory — SmartNICs already do most of this, with DPU products from Nvidia (BlueField), AMD (Pensando), Intel (IPU). FPGA-on-PCIe loses to SmartNIC-on-NIC because the NIC is one PCIe hop closer.
          </li>
          <li>
            <strong style={strong}>verify.</strong> The clean win. Ed25519 is a fixed instruction sequence on opaque 32-byte inputs. FPGA at 1M sigs/sec/card, easily justified <em>at scale</em>, hard to justify at 200k sigs/sec network-wide.
          </li>
          <li>
            <strong style={strong}>dedup.</strong> Hash-table membership test. Memory-bandwidth-bound on the CPU side. FPGA can win on lookup latency, loses on the cost of getting transactions into FPGA memory and back.
          </li>
          <li>
            <strong style={strong}>pack.</strong> Scheduling. <em>This</em> is where Firedancer&apos;s actual edge lives — picking which transactions to include, in what order, given account-conflict constraints and fee-priority. It is irregular, state-dependent, branchy. FPGAs are bad at branchy code. CPUs with branch predictors are good at it.
          </li>
          <li>
            <strong style={strong}>bank.</strong> Transaction execution. Loads accounts from RocksDB, runs SVM bytecode, writes accounts back. Every instruction can read or write arbitrary state. The compute is unpredictable, the data dependencies are unpredictable, the I/O is unpredictable. FPGAs need predictability. CPUs eat unpredictability for breakfast.
          </li>
          <li>
            <strong style={strong}>poh.</strong> A tight SHA-256 chain. FPGA wins on raw hash rate by a large margin, but poh is already so fast on CPU that it is not the bottleneck — adding FPGA here saves nothing in practice.
          </li>
          <li>
            <strong style={strong}>shred.</strong> Reed-Solomon FEC encoding. Pure stream, no state, fixed math. <em>This</em> is the second FPGA-friendly tile after verify. SmartNICs increasingly include FEC offload in hardware.
          </li>
          <li>
            <strong style={strong}>store.</strong> RocksDB writes to NVMe. Storage hardware, not compute. FPGA is not the question; the question is what storage engine to use.
          </li>
        </ul>

        <p style={bodyStyle}>
          Two clean wins (verify, shred). Two borderline (net, quic — better served by SmartNICs). One actively bad fit (bank). One bottleneck that isn&apos;t one (poh). One that isn&apos;t compute (store).
        </p>

        <p style={bodyStyle}>
          A full-FPGA validator would replace two-and-a-half tiles. The rest would still need a CPU. So would the operating system, the monitoring, the snapshot machinery, the RPC layer, the catchup logic, the fork-choice rule. The FPGA card becomes an accelerator card, not a validator. Which is exactly the design Jump shipped, with the accelerator implemented in C+AVX-512 instead of Verilog.
        </p>

        <SectionLabel>Why the economics close against FPGA</SectionLabel>

        <p style={bodyStyle}>
          Pretend the engineering closed. The economics still do not. A Xilinx Alveo U250 is a ~$15k card. A serious validator-grade server CPU (Epyc Genoa-X, 96 cores, AVX-512) lands around $8k. The CPU does the entire pipeline including verify and shred. The FPGA replaces one tile and demands the same CPU sit next to it as host. You are paying $23k for the FPGA build versus $8k for the pure-CPU build, to win on a tile that is not currently the bottleneck on any production validator.
        </p>

        <p style={bodyStyle}>
          Then there is the talent moat. A senior systems engineer who can read Firedancer&apos;s C tile code and ship is a $300k–$500k hire and there are maybe a few hundred globally who could do it. An FPGA engineer who can ship a production Ed25519 core, debug it on Alveo silicon, and maintain it across protocol upgrades is a $500k+ hire and there are maybe a few dozen globally. The talent pool for the FPGA path is an order of magnitude smaller, the salaries an order of magnitude higher, and the bus factor of any team running FPGA validators is approximately one.
        </p>

        <SectionLabel>The hidden constraint: protocol velocity</SectionLabel>

        <p style={bodyStyle}>
          Even if the cost penciled out, the timing wouldn&apos;t. Solana ships protocol-affecting changes roughly monthly: new SIMD-numbered proposals, new transaction formats, new system program features, new commitment levels, new gossip primitives. Agave and Firedancer absorb these in days — recompile, test, push. An FPGA bitstream takes <em>weeks</em> to lay out, synthesize, place-and-route, and verify against silicon. A protocol change that touches signature batching or shred layout invalidates the bitstream and starts the clock over.
        </p>

        <p style={bodyStyle}>
          The CPU + SIMD answer absorbs protocol churn by recompiling. The FPGA answer absorbs it by lagging. In a chain whose competitive edge is fast iteration, lagging is the disqualifying property.
        </p>

        <SectionLabel>Where FPGA still wins</SectionLabel>

        <p style={bodyStyle}>
          None of this argues against FPGA for the parts that <em>are</em> stream-friendly. The honest answer is narrow and specific:
        </p>

        <ul style={listStyle}>
          <li>
            <strong style={strong}>Off-validator co-processors</strong> — searchers running their own simulation farms, RPC providers offering signature-verify-as-a-service, ShredStream operators encoding FEC at line rate. Jump&apos;s 1M-sig demo lives here naturally.
          </li>
          <li>
            <strong style={strong}>Cryptographic primitives one layer up</strong> — BLS pairings for proof verification (see <Link href="/blog/zcash-fpga">the Zcash Foundation Pairing VM</Link>), proof generation for ZK rollups settling to Solana, custom oracle aggregation circuits.
          </li>
          <li>
            <strong style={strong}>SmartNIC + DPU offload</strong> — the practical path. AF_XDP today, SmartNIC offload tomorrow, FPGA-on-NIC where the workload justifies it. This keeps the FPGA on the network side of PCIe where it actually saves a round trip.
          </li>
        </ul>

        <SectionLabel>Production numbers from a real switchover</SectionLabel>

        <p style={bodyStyle}>
          Figment cut their primary Solana validator over to Frankendancer at <strong style={strong}>epoch 871</strong> on October 30, 2025. Early performance numbers were unambiguously positive:
        </p>

        <ul style={listStyle}>
          <li>
            Gross stake-weighted reward rate (SRR) up <strong style={strong}>+18 basis points</strong> immediately after the switch, climbing to <strong style={strong}>+28 bps</strong> in some later epochs.
          </li>
          <li>
            Median block production time up <strong style={strong}>18%</strong> — from <strong style={strong}>355.7 ms</strong> to <strong style={strong}>398.4 ms</strong>. Counter-intuitively this is the point. The pack tile&apos;s smarter scheduling lets each block absorb more high-priority transactions and more MEV before it has to close.
          </li>
          <li>
            Client diversity arrived as a side effect. Before Frankendancer, the Jito-Solana fork ran on <strong style={strong}>~78% of validators</strong>, with a single critical vulnerability potentially exposing <strong style={strong}>~88% of total stake</strong>. An independent codebase decorrelates that risk the way multiple aircraft-engine manufacturers do.
          </li>
        </ul>

        <p style={bodyStyle}>
          The interpretation: Frankendancer ships measurable rewards <em>today</em>, on commodity hardware, with no FPGA in the loop. The pack-tile scheduling — which is the part that is most aggressively un-FPGA-friendly — is doing most of the work.
        </p>

        <SectionLabel>What Firedancer actually proves</SectionLabel>

        <p style={bodyStyle}>
          Jump&apos;s contribution is not that they considered FPGA. It is that they showed the FPGA-shaped solution does not need FPGA silicon. The tile architecture, busy polling, kernel bypass, preallocated arenas, SIMD verification, seccomp lockdown — every one of these is an FPGA design constraint implemented in software. Frankendancer is in production today running this architecture on commodity Epyc and Genoa boxes, with the +18-to-+28 bps SRR delta over plain Agave to prove it.
        </p>

        <p style={bodyStyle}>
          The validator client question for 2026 is not <em>which one is fastest</em> — it is <em>which architecture absorbs the next protocol change without a rewrite</em>. Agave and Firedancer both clear that bar; Sig is betting it can do so for the read path. FPGA validators, in the &quot;replace the whole machine with silicon&quot; sense, do not. The math has not changed since Jump first ran the numbers, and they are the team most qualified to know.
        </p>

        <SectionLabel>The honest roadmap, if you still want hardware</SectionLabel>

        <p style={bodyStyle}>
          If a team or shop wants to ride the curve from &quot;CPU validator&quot; toward &quot;hardware-accelerated&quot;, the order matters. Each step has a fundamentally different cost/benefit profile, and the cheap wins come first:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Horizon</th>
                <th style={thStyle}>Move</th>
                <th style={thStyle}>What you get</th>
                <th style={thStyle}>Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Now</td>
                <td style={tdStyle}>Switch to Frankendancer on Epyc/Genoa</td>
                <td style={tdStyle}>+18 to +28 bps SRR, client diversity</td>
                <td style={tdStyle}>Low — production-validated</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Near</td>
                <td style={tdStyle}>Read the Firedancer tile source, build mental model</td>
                <td style={tdStyle}>Knowing where the actual seams are</td>
                <td style={tdStyle}>Zero — it&apos;s reading</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Mid</td>
                <td style={tdStyle}>SmartNIC / DPU offload for the net tile (Nvidia BlueField, AMD Pensando)</td>
                <td style={tdStyle}>Network-layer latency cut without bespoke silicon</td>
                <td style={tdStyle}>Medium — driver-level work</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Mid</td>
                <td style={tdStyle}>Replace AF_XDP with DPDK underneath the net tile</td>
                <td style={tdStyle}>Slightly more aggressive bypass, marginal gain</td>
                <td style={tdStyle}>Medium — divergence from Firedancer mainline</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Long</td>
                <td style={tdStyle}>FPGA verify tile on Xilinx Alveo U250 — Ed25519 as lookup tables</td>
                <td style={tdStyle}>Up to 1M sigs/sec/card, validated by Jump&apos;s demo</td>
                <td style={tdStyle}>High — bitstream churn, talent scarcity</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Long</td>
                <td style={tdStyle}>FPGA shred tile — Reed-Solomon FEC in hardware</td>
                <td style={tdStyle}>Line-rate FEC, useful for ShredStream operators</td>
                <td style={tdStyle}>High — narrow audience justifies the build</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The pattern is the same across rows: every step keeps the rest of the CPU validator intact. Even the long-horizon FPGA work is a <em>tile replacement</em>, not a re-platforming. That is exactly what the tile architecture was designed to allow.
        </p>

        <SectionLabel>The takeaway</SectionLabel>

        <p style={bodyStyle}>
          Five clients, one pipeline. Two clients (Agave, Jito-Solana) hold the stake. One (Frankendancer) is the practical performance upgrade. One (Firedancer) is the long bet. One (Sig) is the read-side outlier. The shared trajectory is more concurrency, more kernel bypass, more SIMD, more cores — not more silicon. Solana is not an FPGA chain. It is a CPU chain that learned to think like an FPGA, and the only honest FPGA use cases are tile-shaped: one stream, one function, one card.
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
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.88em',
  background: 'rgba(255,255,255,0.06)',
  padding: '1px 6px',
  borderRadius: 3,
  color: '#fff',
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
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px 10px 0',
  fontFamily: 'monospace',
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
};
const trStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };
const tdLabelStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 600,
  verticalAlign: 'top',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.7)',
  verticalAlign: 'top',
  lineHeight: 1.55,
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
