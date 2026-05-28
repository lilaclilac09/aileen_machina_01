'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function ZcashFpgaArticle() {
  return (
    <SubstackShell
      category="Cryptography"
      date="2026.05.27"
      tags="Cryptography · FPGA · ZK · BLS12-381"
      title="The Pairing VM nobody inherited"
      dek="The Zcash Foundation funded an open-source FPGA accelerator in 2019. Inside it is a sixteen-opcode coprocessor for BLS12-381 pairings — an actual instruction set, with its own assembler types, under GPL-3.0. Mainnet-tested on AWS F1 and Bittware VVH. Last meaningful commit in 2020."
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The artifact</SectionLabel>
        <p style={bodyStyle}>
          The Zcash Foundation handed out a grant, and what came back was a single repository. Open it up and you
          find three hardware engines, each of which you can build on its own for FPGA targets &mdash; an FPGA being
          a chip you can rewire after it&apos;s manufactured, something halfway between software and a fixed circuit.
          The three engines are: Equihash proof-of-work verification, secp256k1 ECDSA signature verification, and a
          BLS12-381 zk-SNARK coprocessor. (BLS12-381 is just the name of a specific elliptic curve &mdash; the kind
          of math object a lot of zero-knowledge cryptography is built on.) Each engine sits behind a build-time
          switch, so you only synthesise the one you actually need. The whole thing is written in SystemVerilog &mdash;
          a language for describing hardware &mdash; and every module comes with a testbench that checks itself.
        </p>
        <p style={bodyStyle}>
          The Equihash and secp256k1 engines are about what you&apos;d expect. They&apos;re fixed-function pipelines
          &mdash; circuits wired to do exactly one job &mdash; that take in a transaction or a block header and hand
          back a yes-or-no verification result. The BLS12-381 engine is the odd one out. It isn&apos;t a fixed
          pipeline at all. It&apos;s a tiny <strong style={strong}>microcoded processor</strong> &mdash; a little
          computer that runs its own instructions &mdash; with a 2&nbsp;KB instruction memory, a 12&nbsp;KB URAM data
          slot sized to the curve&apos;s native 381-bit width, eight typed operand classes, and a sixteen-instruction
          opcode set (an opcode being one machine instruction) that climbs all the way up to{' '}
          <code style={code}>ATE_PAIRING</code>. You write your SNARK verifier as assembly. And it runs on silicon.
        </p>
        <p style={bodyStyle}>
          So the right way to think about it isn&apos;t &ldquo;yet another EC accelerator.&rdquo; It&apos;s a
          purpose-built instruction set &mdash; an ISA, which is really just the contract between software and
          hardware &mdash; for one specific elliptic curve. The nearest thing you&apos;ll see in production today is
          the GPU shader-style instruction packing inside zero-knowledge prover farms. Except this one lives in the
          chip&apos;s reconfigurable fabric, runs at 200&nbsp;MHz, and is free to use.
        </p>

        <SectionLabel>What zcash-fpga actually is</SectionLabel>
        <p style={bodyStyle}>
          At the top level it&apos;s a SystemVerilog source tree: three optional engines, a shared{' '}
          <code style={code}>ip_cores/</code> library, and project files for two FPGA targets &mdash; AWS F1 (Xilinx
          VU9P + 64&nbsp;GB DDR4) and Bittware XUPVVH (VU37P + 8&nbsp;GB HBM + 16&nbsp;GB DDR4). On the host side
          there&apos;s a single C++ header that talks to the card over PCIe through an AXI4 / AXI4-Lite interface
          (AXI is the standard bus protocol chips use to talk to one another), with the BLS12-381 engine parked at
          offset <code style={code}>0x1000</code>.
        </p>
        <p style={bodyStyle}>
          The card tells you what it can do through a bitfield &mdash; basically a row of on/off flags &mdash; so the
          host can ask which engines were actually compiled in:{' '}
          <code style={code}>ENB_BLS12_381</code>, <code style={code}>ENB_VERIFY_SECP256K1_SIG</code>,{' '}
          <code style={code}>ENB_VERIFY_EQUIHASH_144_5</code>, <code style={code}>ENB_VERIFY_EQUIHASH_200_9</code>.
          Flip these at synthesis time and you can ship a slim image for one chain and a fuller one for another. You
          can&apos;t turn features on at runtime &mdash; that&apos;s just not how FPGAs work. The bitfield is the
          contract.
        </p>
        <p style={bodyStyle}>
          The <code style={code}>ip_cores/</code> tree is where most of the engineering value hides. You get:
          Blake2b (a hash function that spits out one result per clock at 200&nbsp;MHz, once a 52-clock fill warms up
          its fully-unrolled pipeline), SHA256 + SHA256d, parameterized Karatsuba multipliers (a clever shortcut for
          multiplying big numbers fast), two flavours of Barret reduction &mdash; the trick for taking a result
          modulo a large prime &mdash; one pipelined for speed and one sequential to save space, a fully-parallel
          modular multiplier with a carry-save-adder tree and BRAM-backed reduction (3&times; the throughput of
          Karatsuba+Barret), AXI4 and AXI4-Lite plumbing, FIFOs, a hash map keyed by CRC, and a full Weierstrass
          elliptic-curve module that does point math all the way up to Fp<sup>12</sup>, in both affine and Jacobian
          coordinates.
        </p>
        <p style={bodyStyle}>
          That last item is pulling a lot of weight. Fp<sup>12</sup>-capable curve math in hardware, with the full
          tower of fields stacked up one layer at a time (Fp &rarr; Fp<sup>2</sup> &rarr; Fp<sup>6</sup> &rarr;
          Fp<sup>12</sup>), is the entire backbone of modern pairing-based cryptography &mdash; a pairing being the
          special operation that fuses two curve points into a single field element, which is what makes
          zero-knowledge proofs checkable in the first place. Once you have that, BLS signature verification, KZG
          commitment opening, Groth16 and PLONK verifier circuits, and ate pairings for BLS12-381 / BN254 / BLS12-377
          are all the same problem &mdash; just with different constants plugged in.
        </p>

        <SectionLabel>The Equihash engine, briefly</SectionLabel>
        <p style={bodyStyle}>
          The Equihash 200,9 engine checks the proof-of-work solution in a Zcash block header and applies the
          difficulty filter. It&apos;s here because Zcash uses Equihash, Equihash is deliberately memory-hard (it
          leans on memory rather than raw compute), and memory-hard proof-of-work chains were what kicked off the
          whole FPGA-for-blockchain conversation to begin with. Verifying is cheap compared to mining, but at high
          block rates &mdash; or on lightweight SPV clients &mdash; the cost adds up.
        </p>
        <p style={bodyStyle}>
          By 2026, though, this is more archaeology than anything you&apos;d lean on. Zcash&apos;s long-term roadmap
          (NU5 onward) keeps shrinking Equihash&apos;s role as the chain drifts toward Halo 2 and validator-style
          consensus. The engine works, it&apos;s correct, and nobody is in a hurry to wire it into anything.
        </p>

        <SectionLabel>The secp256k1 engine: the one that&apos;s actually useful</SectionLabel>
        <p style={bodyStyle}>
          Zcash has two kinds of addresses: shielded (zk-SNARK) and transparent (Bitcoin-style). The transparent ones
          use secp256k1 ECDSA &mdash; the same signature scheme and curve as Bitcoin and Ethereum. The FPGA engine
          checks those signatures using two tricks you&apos;ll find in any serious EC accelerator. First,{' '}
          <strong style={strong}>endomorphism-based scalar reduction</strong>: GLV decomposition splits one 256-bit
          scalar into two roughly 128-bit ones, which you can then multiply side by side. Second, a{' '}
          <strong style={strong}>shared fully-pipelined Karatsuba multiplier</strong> backed by Barret reduction, so
          several point operations take turns on one big multiplier instead of each demanding its own.
        </p>
        <p style={bodyStyle}>
          This is the engine you&apos;d genuinely want to deploy. ECDSA verification on secp256k1 is the single
          most-executed cryptographic operation on Earth &mdash; every Bitcoin block, every Ethereum block, every
          transparent Zcash transaction runs it. An FPGA that does it at PCIe line rate is a real product, not a
          research toy. The fact that this engine exists, is open-source, and snaps into the same AXI4-Lite plumbing
          as the rest of the repo makes it the most underrated piece of the whole grant.
        </p>

        <SectionLabel>The Pairing VM in detail</SectionLabel>
        <p style={bodyStyle}>
          Now the fun part. The BLS12-381 coprocessor isn&apos;t built as &ldquo;one circuit per operation.&rdquo;
          It&apos;s built around an instruction set. You load a program into the 2&nbsp;KB instruction memory, point
          the host-side runtime at the entry address, and the engine just runs it. You can read the full opcode list
          straight out of <code style={code}>zcash_fpga.hpp</code>:
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
          Sixteen opcodes in all. Notice that <code style={code}>MILLER_LOOP</code> and{' '}
          <code style={code}>FINAL_EXP</code> get their own instructions, separate from{' '}
          <code style={code}>ATE_PAIRING</code>. That&apos;s not just tidiness &mdash; it&apos;s deliberate. A single
          ate pairing is really just a Miller loop followed by a final exponentiation. But plenty of real verifier
          circuits do a <strong style={strong}>multi-pairing check</strong>: you run several Miller loops, multiply
          their results together in Fp<sup>12</sup>, and do the final exponentiation only once, right at the end.
          Because the two phases are separate opcodes, you can write that loop in the assembler and skip a whole final
          exponentiation for every extra pairing. Groth16 and KZG verifiers both win from this immediately.
        </p>
        <p style={bodyStyle}>
          The operands are typed, too. Each data slot carries a tag &mdash; one of eight classes:
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
          So run <code style={code}>MUL_ELEMENT</code> on two <code style={code}>FE12</code> operands and it fires up
          the full Fp<sup>12</sup> multiplier circuit; run the very same opcode on two <code style={code}>FE</code>{' '}
          operands and it quietly routes to the base-field multiplier instead. The ISA bakes the cryptographic algebra
          right in. You never convert types by hand &mdash; you just declare them on the slot and let the hardware
          sort it out.
        </p>
        <p style={bodyStyle}>
          12&nbsp;KB of URAM at 381 bits per slot gives you about 256 native slots. A Groth16 verifier needs roughly
          twelve G1 points, two G2 points, two constant pairings, plus a bit of scratch space &mdash; comfortably
          inside that working set. PLONK and KZG verifiers fit too. The only time you&apos;d bump into the ceiling is
          with recursive proof systems hauling around lots of auxiliary commitments, and even then you can stream the
          overflow in from DDR4.
        </p>

        <SectionLabel>Why an instruction set instead of a pipeline</SectionLabel>
        <p style={bodyStyle}>
          The usual move for an FPGA crypto accelerator is to bake one operation into one pipeline. Twelve stages of
          multiplication and reduction, tuned for exactly one curve and one protocol, no branches. That&apos;s how
          you squeeze out raw throughput. The catch is that the hardware then does <strong style={strong}>one
          thing</strong>. Want a second curve? Re-synthesise. A different SNARK? Re-synthesise. A different batching
          strategy? Re-synthesise.
        </p>
        <p style={bodyStyle}>
          A microcoded processor running on the same underlying arithmetic gives up a little throughput per
          operation, but you get three things back that a fixed pipeline simply can&apos;t. First,{' '}
          <strong style={strong}>protocol flexibility</strong>: Groth16, PLONK, KZG, Marlin, IPA &mdash; same opcodes,
          just different programs. Second, <strong style={strong}>multi-pairing batching</strong>, like we just saw.
          Third, <strong style={strong}>operand reuse</strong>: the Karatsuba multiplier, the Barret reduction
          blocks, the Fp<sup>2</sup> tower &mdash; one copy each in the fabric, shared by every instruction. A
          pipeline has to duplicate all of that for each function unit.
        </p>
        <p style={bodyStyle}>
          And the trade-off makes sense. For verifier work, you don&apos;t need 50&times; the speed on one operation.
          What you need is 5&times; the speed across a whole portfolio of operations whose mix shifts from one
          deployment to the next. The Zcash repo picked the right spot to stand.
        </p>

        <SectionLabel>The IP cores: quietly excellent engineering</SectionLabel>
        <p style={bodyStyle}>
          Two design choices in <code style={code}>ip_cores/</code> are worth pausing on.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Blake2b at single-clock hash @ 200&nbsp;MHz.</strong> The pipelined version unrolls
          the full Blake2b round function into 52 pipeline stages. Once it&apos;s filled, you get one full
          1024-bit-block hash per cycle. That&apos;s about the absolute limit of what Blake2b can do in dedicated
          silicon &mdash; the only way to go faster is to widen the data path. The same module also has a single-pipe
          variant for when you&apos;re tight on area. You pick at synthesis time. Most teams ship one or the other
          and never learn the trade-off; this repo just hands you both behind a parameter.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Two modular reduction strategies, both shipped.</strong> Barret reduction is the
          textbook approach when your modulus doesn&apos;t allow fast reduction (like BLS12-381&apos;s 381-bit
          prime). It costs two multiplications per reduction &mdash; expensive, but predictable. The repo ships a
          pipelined high-performance Barret and a slower minimal-area Barret. Then it ships a{' '}
          <strong style={strong}>third</strong> path: a fully-parallel multiplier with a carry-save-adder tree and
          BRAM-backed reduction lookups, which gets ~3&times; the throughput of Karatsuba+Barret in exchange for more
          LUTs and RAM. Most projects pick one of these and live with it. This repo lets the integrator decide.
        </p>
        <p style={bodyStyle}>
          The hash map earns a one-line shout-out: parameterised bit widths, CRC as the hash function, all in
          hardware. That&apos;s a building block for nullifier sets, commitment trees, and any other
          on-chain-style lookup you might want to speed up. Most people don&apos;t think of hash maps as IP cores.
          This one is.
        </p>

        <SectionLabel>Why nobody inherited it</SectionLabel>
        <p style={bodyStyle}>
          So if the thing is this good, why isn&apos;t it infrastructure today? Four reasons, ordered roughly by how
          decisive each one was.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>One: Zcash adoption stayed small.</strong> The grant produced a verifier
          accelerator at exactly the moment the network needed prover acceleration to grow. Sending a shielded
          transaction hinges on the user being able to generate a SNARK proof locally &mdash; that&apos;s the
          user-facing bottleneck, not block validation. Halo 2 (deployed in NU5, 2022) went straight at the prover
          side, killing the trusted setup and bringing down proving cost, which mattered far more to the chain than
          any verifier speed-up.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Two: FPGA tooling is all friction.</strong> Vivado 2018.3 / 2019.1 was the test
          matrix. AWS F1 deployment is a slog: you build an AGFI (Amazon FPGA Image), spin up an{' '}
          <code style={code}>f1.2xlarge</code> or bigger, and run AWS-specific shell drivers. Bittware VVH is
          hardware you have to physically own. There&apos;s no &ldquo;<code style={code}>cargo run</code>&rdquo; for
          cryptographic accelerators. And the crossover crowd &mdash; people who can write SystemVerilog{' '}
          <em>and</em> care about BLS12-381 internals &mdash; is tiny.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Three: the cryptosystem moved on.</strong> Halo 2 doesn&apos;t use pairings the way
          Groth16 does. Zcash&apos;s own roadmap after NU5 drifted away from BLS12-381 and toward the Pasta curves
          (Pallas / Vesta) &mdash; not the curves this accelerator was built for. The IP cores do generalise &mdash;
          parameterise the curve and the reductions and you can retarget &mdash; but nobody bothered, because by then
          the target audience was busy building Halo 2 provers, not BLS12-381 verifiers.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Four: GPU and ASIC ecosystems caught up.</strong> By 2023, prover-side acceleration
          on GPUs (Filecoin, Aleo, Ingonyama&apos;s ICICLE) and bespoke ASIC efforts (Cysic, Fabric Cryptography,
          Ulvetanna) were soaking up most of the &ldquo;ZK hardware&rdquo; mindshare and money. FPGAs sit awkwardly
          in the middle: more flexible than an ASIC, slower than an ASIC, more annoying to deal with than a GPU. The
          Zcash repo&apos;s window closed quietly.
        </p>

        <SectionLabel>What you&apos;d build with it today</SectionLabel>
        <p style={bodyStyle}>
          The repo isn&apos;t dead, just dormant. If you wanted to drag pieces of it into 2026 infrastructure, three
          targets jump out:
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Ethereum BLS aggregate signature verification.</strong> Ethereum&apos;s consensus
          (LMD-GHOST + Casper FFG) verifies BLS12-381 signatures every slot. A beacon node validating attestations
          burns real CPU on this. The Pairing VM&apos;s multi-pairing batching is exactly the operation you&apos;d
          reach for &mdash; and in fact a separate downstream FPGA SNARK prover project already pulls these IP cores
          in as a submodule for Eth 2.0 SNARK work.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>L2 rollup pairing verification at the bridge.</strong> Optimistic and zk-rollup
          bridges that verify pairing-based proofs on-chain, or in trusted off-chain prover services, would benefit
          from an FPGA-side verifier sitting in front of the Ethereum L1 contract and batching proofs before
          settlement. The ISA-style design makes it easy to support several rollup proof systems from a single
          deployment.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Filecoin / Aleo / Mina verifier-side acceleration.</strong> All three carry
          high-volume pairing-based verifier workloads (sealing proofs, transaction proofs, succinct-chain proofs).
          You&apos;d need to parameterise the IP cores for their respective curves, but the entire upper layer of the
          Pairing VM is curve-agnostic once you feed it the right base-field constants.
        </p>

        <SectionLabel>The takeaway</SectionLabel>
        <p style={bodyStyle}>
          The gap between published cryptography and deployed cryptography runs straight through a layer almost
          nobody writes about: production hardware. The Zcash Foundation funded one of the cleanest open-source
          examples of what that layer actually looks like &mdash; a real ISA for a real curve, with real silicon
          validation on AWS &mdash; and almost no one picked it up.
        </p>
        <p style={bodyStyle}>
          That&apos;s not a knock on the work. It&apos;s a comment on the field: most teams building hardware
          accelerators in 2026 are doing it because they want to own the stack, not because they have to. The repo
          is still sitting there &mdash; GPL-3.0, self-checking testbenches, a 1.4.2 architecture doc. The next team
          that needs pairing acceleration without buying an ASIC could read the whole thing in a weekend.
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
    </SubstackShell>
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
