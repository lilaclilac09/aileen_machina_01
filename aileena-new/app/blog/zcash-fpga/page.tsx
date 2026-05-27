'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function ZcashFpgaArticle() {
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
            ANALYSIS
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.05.27
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            Cryptography · FPGA · ZK · BLS12-381
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
          fontWeight: 700, letterSpacing: '0.04em',
          lineHeight: 1.08, marginBottom: 32, color: '#fff',
        }}>
          The Pairing VM<br /><span style={{ color: '#00ffea' }}>nobody inherited</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20, marginBottom: 0,
        }}>
          The Zcash Foundation funded an open-source FPGA accelerator in 2019. Inside it is a sixteen-opcode
          coprocessor for BLS12-381 pairings &mdash; an actual instruction set, with its own assembler types, sitting
          in <a href="https://github.com/ZcashFoundation/zcash-fpga" target="_blank" rel="noopener noreferrer" style={inlineLink}>ZcashFoundation/zcash-fpga</a>{' '}
          under GPL-3.0. Mainnet-tested on AWS F1 and Bittware VVH. Last meaningful commit in 2020. This is a
          read on what&apos;s in the repo, why it&apos;s strikingly good engineering, and why every team that needed
          this in 2024 wrote their own from scratch instead of forking it.
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The artifact</SectionLabel>
        <p style={bodyStyle}>
          A Zcash Foundation grant produced one repository, <a href="https://github.com/ZcashFoundation/zcash-fpga" target="_blank" rel="noopener noreferrer" style={inlineLink}>ZcashFoundation/zcash-fpga</a>,
          authored by Benjamin Devlin. It contains three independently-buildable hardware engines for FPGA targets:
          Equihash proof-of-work verification, secp256k1 ECDSA signature verification, and a BLS12-381 zk-SNARK
          coprocessor. Each engine is gated behind a build-time parameter so you can synthesise just the one you
          need. The whole thing is SystemVerilog with self-checking testbenches per module.
        </p>
        <p style={bodyStyle}>
          The Equihash engine and the secp256k1 engine are roughly what you&apos;d expect: fixed-function pipelines
          that ingest a transaction or block header and emit a verification result. The BLS12-381 engine is the
          unusual part. It is not a fixed pipeline. It is a small <strong style={strong}>microcoded processor</strong>
          with a 2&nbsp;KB instruction memory, a 12&nbsp;KB URAM data slot sized to the native 381-bit width of the
          curve, eight typed operand classes, and a sixteen-instruction opcode set that goes all the way up to{' '}
          <code style={code}>ATE_PAIRING</code>. You write SNARK verifier code as assembly. It executes on silicon.
        </p>
        <p style={bodyStyle}>
          The right comparison isn&apos;t &ldquo;another EC accelerator&rdquo; &mdash; it&apos;s a domain-specific
          ISA for a specific elliptic curve. The closest production analogue is the kind of GPU shader-style
          instruction packing used in zero-knowledge prover farms today, except this lives in fabric, runs at
          200&nbsp;MHz, and is freely licensed.
        </p>

        <SectionLabel>What zcash-fpga actually is</SectionLabel>
        <p style={bodyStyle}>
          Top-level: a SystemVerilog source tree with three optional engines, a shared <code style={code}>ip_cores/</code>{' '}
          library, and project files for two FPGA targets &mdash; AWS F1 (Xilinx VU9P + 64&nbsp;GB DDR4) and Bittware
          XUPVVH (VU37P + 8&nbsp;GB HBM + 16&nbsp;GB DDR4). The host-side library is a single C++ header that maps
          control over PCIe via an AXI4 / AXI4-Lite interface, with the BLS12-381 engine at offset{' '}
          <code style={code}>0x1000</code>.
        </p>
        <p style={bodyStyle}>
          Capability bits are exposed as a bitfield so the host can ask the FPGA which engines are compiled in:{' '}
          <code style={code}>ENB_BLS12_381</code>, <code style={code}>ENB_VERIFY_SECP256K1_SIG</code>,{' '}
          <code style={code}>ENB_VERIFY_EQUIHASH_144_5</code>, <code style={code}>ENB_VERIFY_EQUIHASH_200_9</code>.
          You can ship a slimmer image for one chain and a fuller image for another by flipping these at synthesis
          time. There is no runtime feature gate; FPGAs don&apos;t do that. The capability bitfield is the contract.
        </p>
        <p style={bodyStyle}>
          The <code style={code}>ip_cores/</code> tree is where most of the engineering value lives. It contains:
          Blake2b (single-clock hash @ 200&nbsp;MHz after a 52-clock fill via fully unrolled pipeline), SHA256 + SHA256d,
          parameterized Karatsuba multipliers, two flavours of Barret reduction (pipelined for speed, sequential for
          area), a fully-parallel modular multiplier with carry-save-adder tree and BRAM-backed reduction (3&times;
          throughput over Karatsuba+Barret), AXI4 and AXI4-Lite plumbing, FIFOs, a CRC-hashed hash map, and a complete
          Weierstrass elliptic curve module with point math up to Fp<sup>12</sup> in both affine and Jacobian.
        </p>
        <p style={bodyStyle}>
          That last sentence is doing a lot of work. Fp<sup>12</sup>-capable EC math, in hardware, with full towering
          (Fp &rarr; Fp<sup>2</sup> &rarr; Fp<sup>6</sup> &rarr; Fp<sup>12</sup>), is the entire backbone of modern
          pairing-based cryptography. Once you have it, BLS signature verification, KZG commitment opening, Groth16
          and PLONK verifier circuits, and ate pairings for BLS12-381 / BN254 / BLS12-377 are all the same problem
          with different constants.
        </p>

        <SectionLabel>The Equihash engine, briefly</SectionLabel>
        <p style={bodyStyle}>
          The Equihash 200,9 engine verifies a Zcash block header&apos;s proof-of-work solution and applies the
          difficulty filter. It exists because Zcash uses Equihash, Equihash is memory-hard by design, and
          memory-hard PoW chains were the original motivation for the entire FPGA-for-blockchain conversation.
          Verifying is cheap relative to mining, but at high block rates or for SPV clients it adds up.
        </p>
        <p style={bodyStyle}>
          By 2026 this is more archaeological than load-bearing. Zcash&apos;s long-term roadmap (NU5 onward) reduces
          Equihash&apos;s relevance as the chain transitions toward Halo 2 and validator-style consensus. The engine
          works, it&apos;s correct, and nobody is racing to integrate it.
        </p>

        <SectionLabel>The secp256k1 engine: the one that&apos;s actually useful</SectionLabel>
        <p style={bodyStyle}>
          Zcash supports both shielded (zk-SNARK) and transparent (Bitcoin-style) addresses. Transparent transactions
          use secp256k1 ECDSA, the same curve as Bitcoin and Ethereum. The FPGA engine verifies these signatures
          using two techniques that show up in any serious EC accelerator: <strong style={strong}>endomorphism-based
          scalar reduction</strong> (GLV decomposition splits a 256-bit scalar into two ~128-bit scalars that can be
          multiplied in parallel) and a <strong style={strong}>shared fully-pipelined Karatsuba multiplier</strong>
          {' '}backed by Barret reduction, so multiple point operations time-multiplex onto one big multiplier.
        </p>
        <p style={bodyStyle}>
          This is the engine you&apos;d actually deploy. ECDSA verification on secp256k1 is the single most-executed
          cryptographic operation in the world &mdash; every Bitcoin block, every Ethereum block, every transparent
          Zcash transaction. An FPGA that can do it at PCIe line rate is a real product, not a research toy. The
          fact that this engine exists, is open-source, and works with the same AXI4-Lite plumbing the rest of the
          repo uses, is the most underrated piece of the whole grant.
        </p>

        <SectionLabel>The Pairing VM in detail</SectionLabel>
        <p style={bodyStyle}>
          Now the interesting part. The BLS12-381 coprocessor is not built around &ldquo;one circuit per operation.&rdquo;
          It is built around an instruction set. You load a program into the 2&nbsp;KB instruction memory, point the
          host-side runtime at the entry address, and the engine executes. From <code style={code}>zcash_fpga.hpp</code>{' '}
          you can read the full opcode list directly:
        </p>

        <pre style={preStyle}>{`// Control flow
NOOP_WAIT        0x00
COPY_REG         0x01
JUMP             0x02
JUMP_IF_EQ       0x04
JUMP_NONZERO_SUB 0x05   // jump if nonzero, decrement counter — loops
SEND_INTERRUPT   0x06   // signal host via PCIe

// Field arithmetic (operate on typed slots)
SUB_ELEMENT      0x10
ADD_ELEMENT      0x11
MUL_ELEMENT      0x12
INV_ELEMENT      0x13

// Elliptic-curve and pairing primitives
POINT_MULT       0x20
MILLER_LOOP      0x21
FINAL_EXP        0x22
ATE_PAIRING      0x23`}</pre>

        <p style={bodyStyle}>
          Sixteen opcodes total. Notice that <code style={code}>MILLER_LOOP</code> and{' '}
          <code style={code}>FINAL_EXP</code> are exposed as separate instructions from{' '}
          <code style={code}>ATE_PAIRING</code>. That isn&apos;t aesthetic &mdash; it&apos;s deliberate.
          A single ate pairing is Miller loop followed by final exponentiation. But many real verifier circuits
          do a <strong style={strong}>multi-pairing check</strong>: you compute several Miller loops, accumulate
          their products in Fp<sup>12</sup>, and run final exponentiation only once at the end. By splitting the
          two phases into separate opcodes, you can write that loop in the assembler and save an entire final
          exponentiation per extra pairing. Groth16 and KZG verifiers both benefit immediately.
        </p>
        <p style={bodyStyle}>
          Operand types are also typed. Each data slot is tagged with one of eight classes:
        </p>

        <pre style={preStyle}>{`SCALAR  // integer multiplier
FE      // single Fp element
FE2     // Fp^2
FE12    // Fp^12 (target group)
FP_AF   // G1 point, affine
FP_JB   // G1 point, Jacobian
FP2_AF  // G2 point, affine
FP2_JB  // G2 point, Jacobian`}</pre>

        <p style={bodyStyle}>
          So <code style={code}>MUL_ELEMENT</code> dispatched on two <code style={code}>FE12</code> operands invokes
          the full Fp<sup>12</sup> multiplier circuit, while the same opcode on two <code style={code}>FE</code>{' '}
          operands routes to the base-field multiplier. The ISA encodes the cryptographic algebra directly. You don&apos;t
          marshal types &mdash; you declare them on the slot.
        </p>
        <p style={bodyStyle}>
          12&nbsp;KB of URAM, at 381 bits per slot, gives you ~256 native slots. A Groth16 verifier needs roughly
          twelve G1 points, two G2 points, two pairings of constants, plus scratch &mdash; comfortably inside the
          working set. PLONK and KZG verifiers fit too. You&apos;d only hit the data ceiling on recursive proof
          systems with many auxiliary commitments, and even then you can stream from DDR4.
        </p>

        <SectionLabel>Why an instruction set instead of a pipeline</SectionLabel>
        <p style={bodyStyle}>
          The default move for FPGA crypto accelerators is to bake one specific operation into one specific
          pipeline. Twelve stages of multiplication and reduction, optimised for exactly one curve, exactly one
          protocol, no branches. That&apos;s how you get raw throughput. The cost is that the resulting hardware
          does <strong style={strong}>one thing</strong>. Want to add a second curve? Re-synthesise. Want to verify
          a different SNARK? Re-synthesise. Want to batch differently? Re-synthesise.
        </p>
        <p style={bodyStyle}>
          A microcoded processor over the same base arithmetic loses some throughput per op but trades it for three
          things the fixed pipeline can&apos;t give you. First: <strong style={strong}>protocol flexibility</strong>.
          Groth16, PLONK, KZG, Marlin, IPA &mdash; same opcodes, different programs. Second:{' '}
          <strong style={strong}>multi-pairing batching</strong>, as above. Third:{' '}
          <strong style={strong}>operand reuse</strong>. The Karatsuba multiplier, the Barret reduction blocks, the
          Fp<sup>2</sup> tower &mdash; one copy in fabric, shared across every instruction. A pipeline duplicates
          those for each function unit.
        </p>
        <p style={bodyStyle}>
          The trade-off is sensible. For verifier workloads, you don&apos;t need 50&times; throughput on one operation.
          You need 5&times; throughput on a portfolio of operations whose mix changes per deployment. The Zcash repo
          chose the right point.
        </p>

        <SectionLabel>The IP cores: quietly excellent engineering</SectionLabel>
        <p style={bodyStyle}>
          Two design choices in <code style={code}>ip_cores/</code> are worth flagging.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Blake2b at single-clock hash @ 200&nbsp;MHz.</strong> The pipelined version unrolls
          the full Blake2b round function into 52 pipeline stages. Once filled, you get one full 1024-bit-block hash
          per cycle. That&apos;s the absolute limit of what Blake2b can do in dedicated silicon; the only way to go
          faster is to widen the data path. The same module has a single-pipe variant for area-constrained builds.
          You pick at synthesis time. Most teams ship one or the other and don&apos;t know the trade-off; this repo
          gives you both with a parameter.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Two modular reduction strategies, both shipped.</strong> Barret reduction is the
          textbook approach when your modulus doesn&apos;t admit fast reduction (e.g. BLS12-381&apos;s 381-bit
          prime). It needs two multiplications per reduction, which is expensive but predictable. The repo ships a
          pipelined high-performance Barret and a slower minimal-area Barret. Then it ships a{' '}
          <strong style={strong}>third</strong> path: a fully-parallel multiplier with a carry-save-adder tree and
          BRAM-backed reduction lookups, which gets ~3&times; the throughput of Karatsuba+Barret at the cost of more
          LUTs and RAM. Most projects pick one of these and live with it. The repo lets the integrator decide.
        </p>
        <p style={bodyStyle}>
          The hash map deserves a one-line mention: parameterised bit widths, CRC as the hash function, hardware
          implementation. That&apos;s a building block for nullifier sets, commitment trees, and any other
          on-chain-style lookup you might want to accelerate. Most people don&apos;t think of hash maps as IP
          cores. This one is.
        </p>

        <SectionLabel>Why nobody inherited it</SectionLabel>
        <p style={bodyStyle}>
          With the artifact described, the question is why it&apos;s not infrastructure today. Four reasons,
          ordered roughly by how decisive each was.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>One: Zcash adoption stayed small.</strong> The grant produced a verifier
          accelerator at a time when the network needed prover acceleration to grow. Sending a shielded transaction
          is gated on the user&apos;s ability to generate a SNARK proof locally; that&apos;s the user-facing
          bottleneck, not block validation. Halo 2 (deployed in NU5, 2022) attacked the prover side directly by
          eliminating trusted setup and improving proving cost, which mattered far more for the chain than verifier
          speed-ups.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Two: FPGA tooling is friction-shaped.</strong> Vivado 2018.3 / 2019.1 was the test
          matrix. AWS F1 deployment is non-trivial: you build an AGFI (Amazon FPGA Image), provision an{' '}
          <code style={code}>f1.2xlarge</code> or larger, run AWS-specific shell drivers. Bittware VVH is hardware
          you have to own. There is no &ldquo;<code style={code}>cargo run</code>&rdquo; for cryptographic
          accelerators. The crossover audience &mdash; people who can write SystemVerilog{' '}
          <em>and</em> care about BLS12-381 internals &mdash; is small.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Three: the cryptosystem moved.</strong> Halo 2 doesn&apos;t use pairings the way
          Groth16 does. Zcash&apos;s own roadmap after NU5 trended away from BLS12-381 and toward Pasta curves
          (Pallas / Vesta), which were not the curves this accelerator was built for. The IP cores generalise &mdash;
          parameterise the curve and the reductions, you can retarget &mdash; but nobody did, because by then the
          target audience was building Halo 2 provers, not BLS12-381 verifiers.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Four: GPU and ASIC ecosystems caught up.</strong> By 2023, prover-side acceleration
          on GPUs (Filecoin, Aleo, Ingonyama&apos;s ICICLE) and bespoke ASIC efforts (Cysic, Fabric Cryptography,
          Ulvetanna) were absorbing most of the &ldquo;ZK hardware&rdquo; mindshare and capital. FPGAs sit awkwardly
          in between: more flexible than ASIC, slower than ASIC, more annoying than GPU. The Zcash repo&apos;s
          window closed quietly.
        </p>

        <SectionLabel>What you&apos;d build with it today</SectionLabel>
        <p style={bodyStyle}>
          The repo is not dead, just dormant. If you wanted to lift pieces of it into 2026 infrastructure, three
          targets are obvious:
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Ethereum BLS aggregate signature verification.</strong> Ethereum&apos;s consensus
          (LMD-GHOST + Casper FFG) verifies BLS12-381 signatures every slot. A beacon node validating attestations
          spends real CPU on this. The Pairing VM&apos;s multi-pairing batching is exactly the operation you&apos;d
          want, and a separately-developed fork (<a href="https://github.com/bsdevlin/fpga_snark_prover" target="_blank" rel="noopener noreferrer" style={inlineLink}>bsdevlin/fpga_snark_prover</a>)
          already reuses these IP cores as a submodule for Eth 2.0 SNARK work.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>L2 rollup pairing verification at the bridge.</strong> Optimistic and zk-rollup
          bridges that verify pairing-based proofs on-chain or in trusted off-chain prover services would benefit
          from an FPGA-side verifier sitting in front of the Ethereum L1 contract, batching proofs before
          settlement. The ISA-style design makes it natural to support multiple rollup proof systems from one
          deployment.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Filecoin / Aleo / Mina verifier-side acceleration.</strong> All three have
          high-volume pairing-based verifier workloads (sealing proofs, transaction proofs, succinct-chain proofs).
          The IP cores would need to be parameterised for their respective curves, but the entire upper layer of the
          Pairing VM is curve-agnostic given the right base-field constants.
        </p>

        <SectionLabel>The takeaway</SectionLabel>
        <p style={bodyStyle}>
          The gap between published cryptography and deployed cryptography runs through a layer almost nobody
          writes about: production hardware. The Zcash Foundation funded one of the cleanest open-source examples
          of what that layer looks like &mdash; an actual ISA for an actual curve, with actual silicon validation
          on AWS &mdash; and almost no one picked it up.
        </p>
        <p style={bodyStyle}>
          That&apos;s not a verdict on the work. It&apos;s a verdict on the field: most teams building hardware
          accelerators in 2026 are doing it because they want to own the stack, not because they need to. The
          repo is still there, GPL-3.0, with self-checking testbenches and a 1.4.2 architecture doc. The next
          team that needs pairing acceleration without buying an ASIC could read it in a weekend.
        </p>

        {/* Pull quote */}
        <div style={{
          margin: '64px 0',
          padding: '36px 36px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '3px solid #00ffea',
        }}>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 600, letterSpacing: '0.06em',
            lineHeight: 1.6, color: 'rgba(255,255,255,0.88)',
            margin: 0,
          }}>
            Sixteen opcodes. A 12&nbsp;KB register file at 381-bit native width.<br />
            <span style={{ color: '#00ffea' }}>
              The first time someone wrote BLS12-381 pairings as assembly was 2019, and the source is still up.
            </span>
          </p>
          <p style={{
            marginTop: 20,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase',
          }}>
            &mdash; AILEENA MACHINA / 2026
          </p>
        </div>

        {/* ── References ── */}
        <div style={{ marginTop: 64 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: '0.52rem', letterSpacing: '0.45em',
            color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            marginBottom: 24,
          }}>References</p>
          <ol style={{
            paddingLeft: 20, margin: 0,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {[
              { label: 'ZcashFoundation/zcash-fpga — Source Repository', href: 'https://github.com/ZcashFoundation/zcash-fpga' },
              { label: 'zcash_fpga Design Document v1.4.2 (PDF in repo root)', href: 'https://github.com/ZcashFoundation/zcash-fpga/blob/master/zcash_fpga_design_doc_v1.4.2.pdf' },
              { label: 'Blockchain Acceleration Using FPGAs — Slides from Taipei Ethereum Meetup', href: 'https://github.com/ZcashFoundation/zcash-fpga/blob/master/Blockchain_Acceleration_Using_FPGAs_Elliptic_curves_zkSNARKs_and_VDFs_presentation.pdf' },
              { label: 'Taipei Ethereum Meetup Talk (YouTube)', href: 'https://www.youtube.com/watch?v=VNClWrMbhlg' },
              { label: 'Host-side Library: aws/cl_zcash/software/runtime/zcash_fpga.hpp', href: 'https://github.com/ZcashFoundation/zcash-fpga/blob/master/aws/cl_zcash/software/runtime/zcash_fpga.hpp' },
              { label: 'bsdevlin/fpga_snark_prover — Eth 2.0 SNARK accelerator reusing these IP cores', href: 'https://github.com/bsdevlin/fpga_snark_prover' },
              { label: 'BLS12-381 Curve Specification (zkcrypto)', href: 'https://github.com/zkcrypto/bls12_381' },
              { label: 'Pairing-Friendly Curves Draft (IETF CFRG)', href: 'https://datatracker.ietf.org/doc/draft-irtf-cfrg-pairing-friendly-curves/' },
              { label: 'GLV Endomorphism for secp256k1 (Galbraith / Smart)', href: 'https://www.iacr.org/archive/crypto2001/21390189.pdf' },
              { label: 'Halo 2 — Recursive Proof System without Trusted Setup', href: 'https://zcash.github.io/halo2/' },
              { label: 'Zcash NU5 Upgrade Notes — Orchard + Halo 2', href: 'https://zips.z.cash/zip-0252' },
              { label: 'AWS F1 — FPGA-Backed EC2 Instances', href: 'https://aws.amazon.com/ec2/instance-types/f1/' },
              { label: 'Bittware XUPVVH — VU37P FPGA Development Card', href: 'https://www.bittware.com/fpga/xup-vvh/' },
            ].map((ref, i) => (
              <li key={i} style={{
                fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.35)', lineHeight: 1.6,
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
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            &larr; Back to Archive
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

const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };

const inlineLink: React.CSSProperties = {
  color: 'rgba(0,255,234,0.85)', textDecoration: 'underline',
  textDecorationColor: 'rgba(0,255,234,0.3)', textUnderlineOffset: '3px',
};

const code: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.9em',
  color: '#00ffea',
  background: 'rgba(0,255,234,0.06)',
  padding: '1px 6px',
  borderRadius: 3,
  letterSpacing: 0,
};

const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.78rem',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.7)',
  background: 'rgba(0,255,234,0.04)',
  border: '1px solid rgba(0,255,234,0.18)',
  padding: '20px 24px',
  borderRadius: 4,
  marginBottom: 24,
  overflowX: 'auto',
  whiteSpace: 'pre',
  letterSpacing: '0.02em',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.45em',
      color: '#00ffea', textTransform: 'uppercase',
      marginBottom: 20, marginTop: 56, opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
