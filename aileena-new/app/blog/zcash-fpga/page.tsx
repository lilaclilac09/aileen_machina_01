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
      dek="The Zcash Foundation once funded an open-source hardware project almost nobody has heard of. Buried inside is something rare: a tiny purpose-built computer that runs advanced cryptography as if it were assembly code. It worked, it ran on real chips — and then the whole field walked past it. Here's what it is, in plain terms, and why it got left behind."
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>What got funded</SectionLabel>
        <p style={bodyStyle}>
          Years back the Zcash Foundation handed out a grant, and what came back was a single code repository that
          has been sitting quietly ever since. It targets <strong style={strong}>FPGAs</strong> &mdash; chips you can
          rewire after they&apos;re built, a halfway point between ordinary software and a fixed, hard-wired circuit.
          Inside are three separate hardware engines, and you compile only the one you need: one checks Zcash&apos;s
          proof-of-work, one checks ordinary Bitcoin-style signatures, and one does the heavy zero-knowledge math. The
          first two are exactly what you&apos;d expect &mdash; circuits wired to do a single job and answer yes or no.
          The third is the strange and interesting one.
        </p>
        <p style={bodyStyle}>
          That third engine isn&apos;t a fixed circuit at all. It&apos;s a <strong style={strong}>tiny
          processor</strong> &mdash; a little computer with its own instructions &mdash; built for exactly one kind of
          cryptography: the &ldquo;pairing&rdquo; math behind modern zero-knowledge proofs, on a specific curve called
          BLS12-381. (A curve here is just the particular math object the cryptography runs on; you don&apos;t need to
          know more than that.) You write your proof-checker as a short program in the engine&apos;s own instruction
          set, load it in, and the chip runs it. Someone, in other words, designed an assembly language whose entire
          purpose is verifying zero-knowledge proofs &mdash; and then built the silicon that speaks it.
        </p>
        <p style={bodyStyle}>
          That&apos;s the part worth slowing down on. The obvious way to build crypto hardware is to hard-wire one
          operation and make it scream. This did the opposite: it built a small, programmable machine that trades a
          little raw speed for the ability to run many different proof systems from the same chip. The closest thing
          in production today is the way zero-knowledge prover farms pack work onto GPUs &mdash; except this lives in
          the reconfigurable fabric of the chip itself, and it&apos;s free to use.
        </p>

        <SectionLabel>How it&apos;s put together</SectionLabel>
        <p style={bodyStyle}>
          Underneath, it&apos;s a tree of hardware source code: the three engines, a shared library of reusable
          building blocks, and project files for two real FPGA cards it was tested on &mdash; one you rent from
          Amazon&apos;s cloud, one you buy and bolt into a machine. A small program on the host computer talks to the
          card over the standard bus that chips use to talk to each other. When the card boots, it reports which
          engines were actually compiled into it, so the software knows what it&apos;s holding &mdash; you can ship a
          slim build with one engine or a fuller one with several. What you can&apos;t do is switch features on at
          runtime; with an FPGA, the feature set is frozen the moment you compile the image.
        </p>
        <p style={bodyStyle}>
          The shared library is where a lot of the quiet craftsmanship lives: fast hash functions, big-number
          multipliers, and a couple of different tricks for doing arithmetic &ldquo;modulo a big prime&rdquo; &mdash;
          the workhorse operation all of this cryptography leans on. The load-bearing piece is a full
          elliptic-curve math unit that can climb the whole stack of number systems that pairing-based cryptography
          is built on.
        </p>
        <p style={bodyStyle}>
          That last piece is what everything else stands on. A <strong style={strong}>pairing</strong> is the special
          operation that fuses two points on the curve into a single number &mdash; and it&apos;s exactly what makes a
          zero-knowledge proof checkable in the first place. Once you can do pairings in hardware, a whole family of
          things collapse into the same problem with different constants plugged in: BLS signature checks, the
          proof-verification circuits behind Groth16 and PLONK, and the pairings themselves across several related
          curves.
        </p>

        <SectionLabel>The proof-of-work engine, briefly</SectionLabel>
        <p style={bodyStyle}>
          The first engine checks the proof-of-work puzzle in a Zcash block header. It&apos;s here for historical
          reasons: Zcash&apos;s proof-of-work is deliberately memory-hungry &mdash; it leans on memory rather than raw
          compute &mdash; and memory-hungry chains were what kicked off the whole &ldquo;put blockchain work on
          FPGAs&rdquo; conversation in the first place.
        </p>
        <p style={bodyStyle}>
          By now it&apos;s more of a museum piece. Zcash keeps shrinking the role of proof-of-work as it drifts toward
          newer cryptography and validator-style consensus. The engine works and it&apos;s correct &mdash; nobody is
          just in a hurry to wire it into anything.
        </p>

        <SectionLabel>The signature engine: the genuinely useful one</SectionLabel>
        <p style={bodyStyle}>
          Zcash has two kinds of addresses: the private, shielded kind, and transparent ones that work just like
          Bitcoin&apos;s. The transparent ones use the exact same signature scheme as Bitcoin and Ethereum &mdash; and
          this engine checks those signatures, using the standard speed tricks any serious accelerator would (split
          the work in half so two halves run side by side, and let several operations share one big multiplier
          instead of each demanding its own).
        </p>
        <p style={bodyStyle}>
          This is the part you&apos;d genuinely want to deploy. Verifying that one signature type is about the
          most-run cryptographic operation on Earth &mdash; every Bitcoin block, every Ethereum block, every
          transparent Zcash transaction does it. A chip that does it at full bus speed is a real product, not a
          research toy. That it exists, is open-source, and snaps into the same plumbing as everything else makes it
          the most underrated piece of the whole grant.
        </p>

        <SectionLabel>The pairing computer, up close</SectionLabel>
        <p style={bodyStyle}>
          Now the interesting part. Instead of one circuit per operation, the pairing engine is built around an
          instruction set. You load a small program, point the runtime at the start, and it runs. The full list of
          instructions is short enough to read in one sitting &mdash; here it is, straight out of the host program:
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
          Sixteen instructions in all. The detail that gives the game away: a pairing is really two steps &mdash; a
          loop (<code style={code}>MILLER_LOOP</code>), then a final cleanup step (<code style={code}>FINAL_EXP</code>)
          &mdash; and the engine gives each step its own instruction instead of bundling them into one. Why bother?
          Because real proof-checkers often run several pairings at once. If the two steps are separate, you can run
          all the loops, combine them, and do the expensive cleanup step only <em>once</em> at the very end instead of
          once per pairing. That&apos;s a direct, free speed-up for the most common verifiers (Groth16, KZG).
        </p>
        <p style={bodyStyle}>
          The data the program works on is typed, too. Every value carries a tag saying what kind of mathematical
          object it is:
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
          The clever bit: the same &ldquo;multiply&rdquo; instruction does the right thing for whatever types you hand
          it. Multiply two of the big heavyweight values (<code style={code}>FE12</code>) and it fires up the full
          heavyweight multiplier; run the very same instruction on two plain numbers (<code style={code}>FE</code>)
          and it quietly routes to the small one. The cryptographic algebra is baked into the instruction set &mdash;
          you declare what a value <em>is</em>, and the hardware figures out which circuit to use. You never do that
          bookkeeping by hand.
        </p>
        <p style={bodyStyle}>
          There&apos;s enough fast on-chip memory to hold everything a typical verifier juggles at once &mdash; a
          Groth16, PLONK, or KZG verifier all fit comfortably. The only programs that overflow it are exotic recursive
          ones hauling around piles of extra data, and even those can spill the overflow into the card&apos;s larger
          memory.
        </p>

        <SectionLabel>Why an instruction set instead of a pipeline</SectionLabel>
        <p style={bodyStyle}>
          The usual move is to bake one operation into one fixed assembly line, tuned for exactly one curve and one
          protocol. It&apos;s fast &mdash; but it then does <strong style={strong}>one thing</strong>, and any change
          (a second curve, a different proof system, a new batching trick) means recompiling the whole chip from
          scratch.
        </p>
        <p style={bodyStyle}>
          A small programmable processor gives up a little speed per operation and gets three things back a fixed
          assembly line can&apos;t. It runs <strong style={strong}>many proof systems</strong> from the same
          instructions &mdash; just load a different program. It can <strong style={strong}>batch pairings</strong>,
          as we just saw. And it keeps <strong style={strong}>one shared copy</strong> of each expensive building
          block in the chip, used by every instruction, instead of duplicating them for each operation.
        </p>
        <p style={bodyStyle}>
          And the trade-off is the right one for this job. Verifying proofs doesn&apos;t need one operation to be
          wildly fast; it needs a whole shifting mix of operations to be solidly fast, with the mix changing from one
          deployment to the next. The repo picked the right spot to stand.
        </p>

        <SectionLabel>The craftsmanship, briefly</SectionLabel>
        <p style={bodyStyle}>
          A few details show the care that went in. The hash unit is built two ways in the same codebase &mdash; a
          big, fast version and a small, thrifty one &mdash; and you pick at compile time; most projects ship one and
          never learn the trade-off. That &ldquo;modulo a big prime&rdquo; workhorse from earlier ships in three
          flavours, from compact-and-slow to large-and-fast, so whoever integrates it can choose what to spend chip
          space on. And there&apos;s even a hardware <strong style={strong}>hash map</strong> &mdash; the kind of
          fast-lookup structure you&apos;d normally only meet in software &mdash; which happens to be exactly the
          building block you&apos;d want for the bookkeeping inside a privacy chain. Small things, but they&apos;re
          the difference between a research dump and something an engineer can actually build on.
        </p>

        <SectionLabel>Why nobody inherited it</SectionLabel>
        <p style={bodyStyle}>
          So if the thing is this good, why isn&apos;t it infrastructure today? Four reasons, ordered roughly by how
          decisive each one was.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>One: it solved the wrong half of the problem.</strong> The grant produced a tool
          that <em>checks</em> proofs fast, at exactly the moment Zcash&apos;s real bottleneck was <em>creating</em>
          them fast. Sending a private transaction means your own device has to generate a heavy proof &mdash;
          that&apos;s the pain users actually feel, not block-checking. The big upgrade that followed went straight at
          the proof-creation side and made it cheaper, which mattered far more to the chain than any speed-up to
          checking.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Two: FPGAs are painful to work with.</strong> Getting one of these images onto a
          cloud FPGA, or owning the physical card, is a slog &mdash; there&apos;s no one-command &ldquo;just run
          it&rdquo; the way there is for ordinary software. And the people who can both write hardware code{' '}
          <em>and</em> care about the guts of this particular cryptography are a tiny crowd.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Three: the cryptography moved on.</strong> Zcash&apos;s newer proof system
          doesn&apos;t lean on pairings the way the old one did, and the chain drifted toward different curves than
          the one this engine was built for. The building blocks could be retargeted in principle &mdash; but by the
          time anyone might have, the audience had already moved to the new system.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Four: GPUs and ASICs ate the attention.</strong> By the time &ldquo;ZK
          hardware&rdquo; became a hot category, the money and mindshare went to GPU acceleration and custom-ASIC
          startups. FPGAs sit awkwardly in between: more flexible than an ASIC but slower, and more annoying to deal
          with than a GPU. The window quietly closed.
        </p>

        <SectionLabel>What you&apos;d build with it today</SectionLabel>
        <p style={bodyStyle}>
          The repo isn&apos;t dead, just dormant. If you wanted to drag pieces of it into 2026 infrastructure, three
          targets jump out:
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Ethereum signature checking.</strong> Ethereum&apos;s consensus verifies enormous
          numbers of the same pairing-based signatures every twelve-second slot, and it burns real CPU doing it. The
          batching trick above is exactly what you&apos;d reach for &mdash; and in fact a separate downstream project
          already reuses these building blocks for that job.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Rollup proof checking at the bridge.</strong> Systems that verify proofs before
          settling onto Ethereum could put an FPGA verifier in front and batch proofs first. The programmable design
          makes it easy to support several proof systems from a single deployment.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Filecoin / Aleo / Mina verification.</strong> All three carry heavy pairing-based
          verification work. You&apos;d retarget the building blocks to their particular curves, but the whole upper
          layer is curve-agnostic once you feed it the right constants.
        </p>

        <SectionLabel>The takeaway</SectionLabel>
        <p style={bodyStyle}>
          The gap between cryptography that&apos;s published and cryptography that&apos;s actually deployed runs
          through a layer almost nobody writes about: real hardware. The Zcash Foundation funded one of the cleanest
          open examples of what that layer looks like &mdash; a real instruction set for a real curve, validated on
          real chips &mdash; and almost no one picked it up.
        </p>
        <p style={bodyStyle}>
          That&apos;s not a knock on the work. It&apos;s a comment on the field: most teams building crypto hardware
          today do it because they want to own their stack, not because they have to. The repo is still sitting
          there &mdash; open-source, with tests that check themselves. The next team that needs to speed up pairings
          without building an ASIC could read the whole thing in a weekend.
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
            Sixteen instructions. A tiny computer whose only language is zero-knowledge cryptography &mdash;<br />
            <span style={{ color: '#00ffea' }}>
              and the whole field walked straight past it. The source has been sitting there for years.
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
