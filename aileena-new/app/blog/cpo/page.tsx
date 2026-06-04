'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function CpoArticle() {
  return (
    <SubstackShell
      category="Markets"
      date="2026.06.02"
      tags="CPO · Nvidia · TSMC · Optical · Packaging · Yield · AI Hardware"
      title="How CPO Actually Gets Built"
      dek="CPO (co-packaged optics) is the technology that would erase the pluggable optical-module empire — the EMLs, the DSPs, the cages, all of it. NVIDIA Rubin Ultra needs it. TSMC is doing the bonding. The problem is the yield: 75% in May 2026, against a 90–95% break-even target. This piece walks what's actually being packaged, the six-step flow, where it's breaking, who's positioned in the supply chain after the dust settles."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          The headline version of CPO is short: the optical engine moves onto the same substrate
          as the switch ASIC; the pluggable module disappears; everyone who sells EML laser chips,
          DSP chips, cages, and faceplate optics has a worse 2028. The headline version is
          correct, and it&rsquo;s also useless for understanding why CPO keeps slipping.
        </p>
        <p style={bodyStyle}>
          The real story is a manufacturing problem. NVIDIA&rsquo;s next-generation Rubin Ultra
          rack needs CPO &mdash; with <strong style={strong}>576 GPUs</strong> and{' '}
          <strong style={strong}>115.2 T</strong> of interconnect bandwidth per rack, pluggable
          optics physically cannot keep up. So TSMC is doing the packaging, NVIDIA has prepaid the
          supply, and as of May 2026 the package&rsquo;s yield is{' '}
          <strong style={strong}>~75%</strong> against a break-even target of{' '}
          <strong style={strong}>90&ndash;95%</strong>. Every quarter the gap closes a few points
          slower than the prior plan said it would.
        </p>
        <p style={bodyStyle}>
          This piece is the inside of that gap: what&rsquo;s actually inside the package, the six
          steps to assemble it, where each step is losing yield, and who&rsquo;s positioned around
          the bottleneck. Companion pieces in the cluster:{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running
          Out Of</Link>,{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>,{' '}
          <Link href="/blog/marvell" style={linkStyle}>Where Marvell Sits</Link>,{' '}
          <Link href="/blog/broadcom" style={linkStyle}>Where Broadcom Sits</Link>.
        </p>

        <SectionLabel>What's actually being packaged — the optical engine</SectionLabel>
        <p style={bodyStyle}>
          The thing called an &ldquo;optical engine&rdquo; (OE) is not a single chip. It&rsquo;s a
          tightly integrated stack of three layers, every one of which carries a yield risk.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>The chips.</strong>{' '}
            A <strong style={strong}>PIC</strong> (photonic integrated circuit) is the optical
            substrate &mdash; the circuit that emits, modulates, and receives light. It&rsquo;s
            silicon photonics, typically on a <strong style={strong}>65 nm</strong> process. Bonded
            to it is the <strong style={strong}>EIC</strong> (electronic integrated circuit),
            which drives the lasers and amplifies the received signal: TIA (transimpedance
            amplifier), driver, and modulator (micro-ring or Mach&ndash;Zehnder). The EIC sits at
            the leading edge &mdash; <strong style={strong}>6 nm</strong> or lower.
          </li>
          <li>
            <strong style={strong}>The optical glue.</strong> The{' '}
            <strong style={strong}>FAU</strong> (fibre-array unit) holds the multi-fibre array
            that physically couples to the PIC&rsquo;s waveguides. For CPO it&rsquo;s a{' '}
            <strong style={strong}>three-dimensional</strong> design with channel pitch under{' '}
            <strong style={strong}>100 &micro;m</strong>, demanding{' '}
            <strong style={strong}>sub-micron alignment precision</strong> &mdash; orders of
            magnitude tighter than the 2-D FAUs used in pluggable modules. Microlenses condition
            the beam between fibre and PIC. The CW (continuous-wave) laser source sits{' '}
            <em>outside</em> the package, feeding light in over fibre at{' '}
            <strong style={strong}>&ge; 300 mW</strong> per channel.
          </li>
          <li>
            <strong style={strong}>The plumbing.</strong> Optical isolators (to keep reflected
            light from killing the laser), polarisation-maintaining fibre, and a{' '}
            <strong style={strong}>shuffle box</strong> that handles the complex port-to-fibre
            mapping. Cheap individually; collectively, the integration is what makes the package
            painful.
          </li>
        </ul>
        <p style={bodyStyle}>
          The CW source &mdash; the &ldquo;light supply&rdquo; outside the package &mdash; is also
          where the supply concentrates: Lumentum dominates the &ge;300 mW high-power CW laser
          market, with Coherent the only credible second.{' '}
          <em>That&rsquo;s a separate bottleneck. See</em>{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>the scarcity map</Link>.
        </p>

        <SectionLabel>The six steps — and where the yield breaks</SectionLabel>

        <p style={bodyStyle}>
          <strong style={strong}>Step 1 — PIC + EIC hybrid bonding.</strong> At the wafer level,
          the PIC and EIC are aligned face-to-face and hybrid-bonded with sub-micron precision.
          This is the hardest step in the entire flow and the largest single yield loss &mdash;{' '}
          <strong style={strong}>~10%</strong> of CPO units die here. The dedicated coupling /
          alignment equipment is sold by a small list of vendors (ROR / Robotechnik is the most
          named); units run{' '}
          <strong style={strong}>$1&ndash;2 M</strong> with{' '}
          <strong style={strong}>5&ndash;7 month</strong> lead times. Two industries&rsquo; manufacturing
          tolerances meet here for the first time, and one of them isn&rsquo;t used to losing.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Step 2 &mdash; wafer dicing.</strong> Cut the bonded PIC + EIC
          wafer into individual optical-engine die. Standard process; small yield impact.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Step 3 &mdash; substrate flip-chip.</strong> Mount the OE die
          onto an ABF (Ajinomoto Build-up Film) IC substrate. Standard advanced-packaging
          plumbing; well understood; the yield here is fine.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Step 4 &mdash; FAU active coupling.</strong> The second-biggest
          yield-loss step. The FAU&rsquo;s fibres have to be actively aligned to the
          PIC&rsquo;s waveguides &mdash; alignment tolerance is{' '}
          <strong style={strong}>0.5&ndash;0.6 &micro;m</strong>. This is not a robot problem you
          can buy your way out of: it needs experienced process engineers, and the training cycle
          for one is <strong style={strong}>over six months</strong>. A fully-automated FAU
          packaging line costs <strong style={strong}>&yen;10 M+</strong> ($1.4M+). After
          coupling, the die runs through burn-in, FT (functional test) and SLT
          (system-level test), each of which adds yield loss and adds cycle time.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Step 5 &mdash; system integration.</strong> The packaged OE
          module gets co-mounted with the switch ASIC on one very large carrier substrate &mdash;
          projected to reach <strong style={strong}>150 mm &times; 200 mm</strong>, bigger than a
          phone. This step is done by <strong style={strong}>ASE</strong> (and other OSATs in
          rotation); the OE-and-ASIC carrier is the visible &ldquo;CPO module.&rdquo;
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Step 6 &mdash; external CW source attachment.</strong> The
          off-package CW laser is connected via fibre to the CPO module&rsquo;s FAU mate. TSMC
          notably abandoned the traditional active-coupling alignment for this connector and went
          to a <strong style={strong}>blind-mate</strong> design &mdash; a small, expensive
          process upgrade that takes a meaningful chunk of cycle time and yield risk out of the
          end-of-line.
        </p>

        <SectionLabel>Why yield is stuck at 75%</SectionLabel>
        <p style={bodyStyle}>
          Three structural reasons, not one.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The DNA mismatch.</strong> Semiconductor manufacturing
          (sub-nanometre, defect-driven yield curves) and optical manufacturing (alignment-driven,
          hand-tuned, batch-scaled) have never been forced to share a process line at this scale.
          Where they meet &mdash; PIC/EIC bond, FAU coupling &mdash; tolerances stack in both
          domains at once. The compounding is what makes the yield curve hard to flatten.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The thermal problem.</strong> The switch ASIC dissipates
          kilowatts of power. The optical engine sits millimetres away. Light is exquisitely
          sensitive to temperature: even small drifts walk the laser off-channel, raise the
          bit-error rate, and force re-tuning. Current liquid cooling (see{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>the cooling map</Link>) was designed for
          the older pluggable thermal envelope; the CPO geometry concentrates heat closer to optics
          than any liquid stack has had to manage before. Without a step change in the cold-plate
          design, thermal noise stays a meaningful yield drag.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The test floor.</strong> NVIDIA mandates 100% end-to-end test on
          every wafer &mdash; required for reliability at rack-level integration, but brutal for
          throughput. A wafer holding 200&ndash;300 channels takes{' '}
          <strong style={strong}>over twenty hours</strong> to fully test. Even with capacity in
          place, the test floor caps how fast a 90% yield translates to actual rack deliveries.
        </p>
        <p style={bodyStyle}>
          The combination is why every CPO ramp plan since 2024 has slipped by a quarter. The
          original 2026 Q2&ndash;Q3 ramp is now Q4. The original 2026 volume was a lot bigger than
          what&rsquo;s shipping.
        </p>

        <SectionLabel>The closed NVIDIA – TSMC alliance</SectionLabel>
        <p style={bodyStyle}>
          The other half of why CPO is hard isn&rsquo;t technical &mdash; it&rsquo;s ecosystem
          structure. The reference CPO main line is jointly owned by{' '}
          <strong style={strong}>NVIDIA and TSMC</strong>, and the line is{' '}
          <em>not open</em>. External optical-chip vendors, including Broadcom, AMD, and the
          large pluggable-module makers, are not co-packaging into the same substrate. They are
          second-tier customers of TSMC&rsquo;s packaging slots at best, and slot-priority inside
          TSMC clearly puts NVIDIA above everyone else &mdash; particularly when the CPO line is
          using up yield-limited bonding equipment that Apple, AMD, and Broadcom would also like.
        </p>
        <p style={bodyStyle}>
          The flip side is CSP resistance. Hyperscalers &mdash; Google, AWS, Meta &mdash; have
          three reasons not to adopt CPO quickly:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Loss of incremental scaling.</strong> A pluggable transceiver
            can be added one port at a time. A CPO rack is a single integrated unit; once it&rsquo;s
            designed in, you buy it as a block.
          </li>
          <li>
            <strong style={strong}>Pricing power evaporates.</strong> The CPO supplier list is
            essentially one alliance; the pluggable list is dozens. CSP procurement teams
            don&rsquo;t like supplier counts of one.
          </li>
          <li>
            <strong style={strong}>Ecosystem lock-in.</strong> Adopting NVIDIA-TSMC CPO is
            adopting the whole stack underneath it: the cold plate spec, the rack carrier, the
            specific switch ASIC family. CSPs that have spent five years building bespoke rack
            architectures aren&rsquo;t eager to outsource that to one vendor.
          </li>
        </ul>
        <p style={bodyStyle}>
          The actual CSP behaviour, as a result, is to wait for NPO (near-packaged optics &mdash;
          the bridge architecture between pluggable and full CPO) and to keep pluggable lines
          running on the side as insurance. The NPO route is also where Marvell and Broadcom
          retain a credible socket: SerDes IP under a DSP-less optical engine.
        </p>

        <SectionLabel>Unit economics</SectionLabel>
        <p style={bodyStyle}>
          A single CPO switch today carries a sticker price around{' '}
          <strong style={strong}>&yen;150,000</strong> versus the comparable electrical
          switch + pluggable module stack at about <strong style={strong}>&yen;80,000</strong>.
          The CPO price holds, but only because no one&rsquo;s ramped volume yet &mdash; full-year
          2026 CPO switch shipments are projected at about{' '}
          <strong style={strong}>15,000 units</strong>, based on the 75% yield. That is{' '}
          <em>nowhere near</em> volume-economic, which is part of why TSMC has slow-walked the
          ramp: a few hundred million dollars of annual revenue against tens of billions on
          competing leading-edge nodes is not a fight for resources TSMC wants to lose.
        </p>

        <SectionLabel>Who's where — orders and project status</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>NVIDIA.</strong> Ordered{' '}
            <strong style={strong}>20,000 PIC wafers</strong> from TSMC in February 2026 to secure
            supply. The first CPO switches (Rubin-class) are expected to ship{' '}
            <strong style={strong}>August / September 2026</strong>, with full-year 2026 shipments
            in the few-thousand to 15,000 range. To lock in raw optical inputs, NVIDIA placed a{' '}
            <strong style={strong}>$2 B equity investment</strong> into Coherent and put a
            multi-billion-dollar purchase commitment with Lumentum. The original Q2&ndash;Q3 2026
            ramp is now Q4.
          </li>
          <li>
            <strong style={strong}>Broadcom.</strong> Behind on every dimension. Its CPO approach
            is a <strong style={strong}>2.5-D</strong> packaging (vs TSMC&rsquo;s 3-D), and there
            is no 2026 volume target on the table. Volume is guided for{' '}
            <strong style={strong}>2H 2027 &rarr; 2028</strong> &mdash; not coincidentally, the
            same window in which Broadcom&rsquo;s own EML + DSP business has the most to lose.
            (See <Link href="/blog/broadcom" style={linkStyle}>the Broadcom catch-22</Link>.)
          </li>
          <li>
            <strong style={strong}>TFC Communication (天孚通信).</strong> NVIDIA&rsquo;s core
            optical-component supplier for the OE: FAU, microlens, lens caps, ferrules. Delivered a
            first <strong style={strong}>7,200-piece FAU order</strong> &mdash; demo + verification
            volume only, not production. Eight CPO lines stood up in Suzhou; target mass-production
            window <strong style={strong}>Q3&ndash;Q4 2026</strong>.
          </li>
          <li>
            <strong style={strong}>Foxconn Industrial Internet (工业富联).</strong> NVIDIA&rsquo;s{' '}
            <em>exclusive</em> CPO switch assembler. Currently small-batch testing alongside Rubin
            Super Pod; production-and-delivery window <strong style={strong}>Q4 2026</strong>.
            FY 2027 target <strong style={strong}>25,000 units</strong>, with realistic delivery
            expected around <strong style={strong}>10,000+ units</strong> given upstream constraints.
          </li>
          <li>
            <strong style={strong}>Innolight (中际旭创).</strong> Submitted an{' '}
            <strong style={strong}>NPO solution</strong> &mdash; not CPO &mdash; to NVIDIA.
            Running CPO pre-research with JCET on the side. Effectively: betting on the bridge
            generation while CPO sorts itself out.
          </li>
          <li>
            <strong style={strong}>USI / Universal Scientific (环旭电子).</strong> NPO samples in
            development; mid-2026 mock-up expected. Same bridge-tier bet.
          </li>
          <li>
            <strong style={strong}>Coherent (II-VI).</strong> Bagged a large CPO solution order
            from a top AI data-centre customer (effectively NVIDIA-side); CW source sample
            shipments already running. Coherent&rsquo;s diamond-particle SiC ceramic thermal-
            management material (see{' '}
            <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>the scarcity map</Link>)
            sits on the periphery of this story as the one materials piece that{' '}
            <em>doesn&rsquo;t</em> care which CPO route wins.
          </li>
        </ul>

        <SectionLabel>The shape</SectionLabel>
        <p style={bodyStyle}>
          Three stacked truths.
        </p>
        <ol style={listStyle}>
          <li>
            <strong style={strong}>The demand is real and not optional.</strong>{' '}
            Rubin Ultra&rsquo;s 115.2 T per-rack interconnect is physically beyond pluggable
            optics. NVIDIA has to ship CPO. So does anyone selling racks above ~600 GPUs.
          </li>
          <li>
            <strong style={strong}>The bottleneck is concrete.</strong> TSMC&rsquo;s PIC/EIC
            hybrid-bond + FAU active-coupling yield is 75%, target 90&ndash;95%, and the gap is
            closed by experienced engineers with six-month training cycles and bonder equipment
            with six-month lead times. Quarter slips compound.
          </li>
          <li>
            <strong style={strong}>The ecosystem is closed and that&rsquo;s on purpose.</strong>{' '}
            NVIDIA + TSMC&rsquo;s incentives align with shipping their joint CPO main line first;
            third parties wait. CSPs, also rationally, hedge into NPO and keep pluggables.
          </li>
        </ol>
        <p style={bodyStyle}>
          Net: <strong style={strong}>real volume on CPO is a 2027&ndash;2029 story</strong>,
          with the 2026 number staying inside five digits. The pluggable optical-module empire
          (EML, DSP, cage, faceplate) gets one more good year than the headline-CPO narrative
          implies. The NPO bridge generation is where the next twelve months of real engineering
          spending lands, and the supply chain has positioned itself accordingly:
          Innolight, USI, Marvell + Broadcom&rsquo;s SerDes-IP socket, and TFC&rsquo;s mass-
          production line in Suzhou are all set up for that bridge to be real.
        </p>
        <p style={bodyStyle}>
          The CPO disruption story isn&rsquo;t wrong &mdash; it&rsquo;s just two years further
          out than the slide-deck version, and on the way there it goes through the slowest
          packaging-yield curve the industry has tried to flatten in a decade.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          Figures here are drawn from current supply-chain research (industry Q&amp;A notes and
          sell-side reports through mid-2026) and stated as the thesis, not independently
          re-derived.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Cluster reading:{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link>,{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>,{' '}
          <Link href="/blog/marvell" style={linkStyle}>Where Marvell Sits</Link>,{' '}
          <Link href="/blog/broadcom" style={linkStyle}>Where Broadcom Sits</Link>.
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
const linkStyle: React.CSSProperties = { color: '#00ffea', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,234,0.3)' };
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
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
