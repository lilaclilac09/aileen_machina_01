'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function CpoExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · jun"
      title={
        <>
          How CPO actually{' '}
          <em>
            gets built.
            <svg viewBox="0 0 220 11" preserveAspectRatio="none">
              <path
                d="M2 7 Q 55 1 120 6 T 218 8"
                stroke="#7c5cc4"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </em>
        </>
      }
      dek="Nvidia Rubin Ultra needs it. TSMC is doing the bonding. The yield is stuck at 75%, target 90–95%."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            <b>576 GPUs</b>, <b>115.2 T</b> per rack — pluggables physically can&rsquo;t
            keep up. yield <b>75%</b>, target <b>90–95%</b>. real volume is a{' '}
            <b>2027–2029</b> story.
          </p>
        </>
      }
      denseHref="/blog/cpo"
      prevHref="/blog/broadcom"
      prevLabel="broadcom, four pillars"
      nextHref="/blog/marvell"
      nextLabel="marvell, the TIA monopoly"
      footerMeta="markets · 2026.06.02"
    >
      <p>
        Headline version: the optical engine moves onto the same substrate as the
        switch ASIC; the pluggable module disappears. Correct, and useless for
        understanding why CPO keeps slipping. The real story is a manufacturing
        problem.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>what&rsquo;s in the package
      </h2>

      <div className="explainer-row">
        <p>
          The <b>optical engine</b> is a stack of three layers. The <b>PIC</b>{' '}
          (photonic integrated circuit) emits, modulates and receives light — silicon
          photonics on a <b>65 nm</b> process. Bonded to it: the <b>EIC</b> (electronic
          integrated circuit) at <b>6 nm</b> or lower.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">pic + eic</span>
            two chips face-
            <br />to-face. one for
            <br /><b>light</b>, one for
            <br /><b>electrons.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          The <b>FAU</b> (fibre-array unit) holds the fibre that couples to the
          PIC&rsquo;s waveguides. CPO needs a <b>3-D</b> design with channel pitch
          under <b>100 µm</b> and <b>sub-micron</b> alignment. The CW (continuous-wave)
          laser sits outside the package at <b>≥ 300 mW</b> per channel.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">fau</span>
            the fibre plug.
            <br />must line up
            <br />to <b>under a
            micron.</b>
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ now assemble it ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>the six steps
      </h2>

      <div className="explainer-row">
        <p>
          <b>1. PIC + EIC hybrid bonding.</b> Wafer-level, face-to-face, sub-micron.
          The hardest step in the flow — <b>~10%</b> of CPO units die here.
          Specialist bonder equipment runs <b>$1–2 M</b> with <b>5–7 month</b> lead
          times.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">step 1</span>
            biggest yield
            <br />sink. <b>1 in 10</b>
            <br />dies right here.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>2. Wafer dicing.</b> Cut into individual OE die. Standard process.{' '}
          <b>3. Substrate flip-chip.</b> Mount the OE die onto an ABF (Ajinomoto
          Build-up Film) substrate. Standard advanced-packaging plumbing.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">steps 2 + 3</span>
            the easy ones.
            <br />yield is <b>fine.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>4. FAU active coupling.</b> Second-biggest yield sink. Tolerance is{' '}
          <b>0.5–0.6 µm</b>. Not a robot problem — needs experienced engineers, training
          cycle <b>over six months</b>. Full automation line: <b>¥10 M+</b> ($1.4M+).
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">step 4</span>
            humans, not
            <br />robots. <b>6-month</b>
            <br />training cycle.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>5. System integration.</b> Co-mount the OE module with the switch ASIC
          on a single carrier — projected to reach <b>150 mm × 200 mm</b>, bigger than
          a phone. Done by <b>ASE</b> (and other OSATs).
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">step 5</span>
            the visible
            <br /><b>CPO module.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>6. External CW source attachment.</b> Off-package laser plugs in via
          fibre. TSMC went to a <b>blind-mate</b> design — skips the slow active
          alignment, saves cycle time and yield risk at end-of-line.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">step 6</span>
            plug it in.
            <br /><b>no alignment.</b>
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ why it&rsquo;s stuck ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>why yield is stuck at 75%
      </h2>

      <div className="explainer-row">
        <p>
          <b>DNA mismatch.</b> Semiconductor (sub-nanometre, defect-driven) and optics
          (alignment-driven, hand-tuned) have never shared a process line at this
          scale. Tolerances compound at the meeting points.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">reason 1</span>
            two industries.
            <br />neither used to
            <br />the other&rsquo;s
            <br /><b>tolerances.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Thermal.</b> The switch ASIC dissipates kilowatts. The optical engine sits
          millimetres away. Light walks off-channel with the smallest temperature
          drift. Current cold plates weren&rsquo;t designed for this geometry.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">reason 2</span>
            lasers <b>hate</b>
            <br />sitting next to
            <br />kilowatt chips.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Test floor.</b> Nvidia mandates 100% end-to-end test on every wafer. A
          wafer with 200–300 channels takes <b>over twenty hours</b> to fully test —
          throughput cap, not yield cap.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">reason 3</span>
            <b>20+ hours</b> per
            <br />wafer. the test
            <br />floor is the
            <br />slowest step.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>the closed NVIDIA – TSMC alliance
      </h2>

      <div className="explainer-row">
        <p>
          The reference CPO main line is jointly owned by <b>NVIDIA and TSMC</b>, and
          the line is <span className="v">not open</span>. Broadcom, AMD and the large
          module makers are second-tier customers of TSMC&rsquo;s packaging slots.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">closed line</span>
            you&rsquo;re either
            <br />in the alliance
            <br />or you <b>wait.</b>
          </div>
        </div>
      </div>

      <p>
        CSP resistance is the flip side. Hyperscalers don&rsquo;t want a supplier list
        of one, can&rsquo;t scale CPO one port at a time, and don&rsquo;t want to lock
        in the whole NVIDIA-TSMC stack underneath it. Their hedge: wait for NPO, keep
        pluggables.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>unit economics
      </h2>

      <div className="explainer-row">
        <p>
          CPO switch sticker: <b>¥150,000</b> versus electrical switch + pluggable
          stack at <b>¥80,000</b>. Full-year 2026 CPO switch shipments: <b>~15,000
          units</b> at the 75% yield. Nowhere near volume-economic.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">2026 volume</span>
            <b>15k</b> units, a
            <br />few hundred
            <br />million. TSMC
            <br />slow-walks for
            <br />a reason.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ who&rsquo;s where ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">→</span>orders and project status
      </h2>

      <div className="explainer-row">
        <p>
          <b>NVIDIA.</b> Ordered <b>20,000 PIC wafers</b> from TSMC in Feb 2026. First
          CPO switches ship <b>Aug / Sep 2026</b>. Put <b>$2 B</b> equity into Coherent
          and a multi-billion buy commitment with Lumentum. Original Q2–Q3 ramp is now
          Q4.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">nvidia</span>
            prepaid the
            <br />supply chain.
            <br />still slipped
            <br /><b>a quarter.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Broadcom.</b> Behind on every dimension. Approach is <b>2.5-D</b>{' '}
          packaging (vs TSMC&rsquo;s 3-D). Volume guided <b>2H 2027 → 2028</b> — the
          same window in which its own EML + DSP business has the most to lose.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">broadcom</span>
            slow on purpose?
            <br />the <b>catch-22.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>TFC Communication (天孚通信).</b> NVIDIA&rsquo;s core OE component supplier
          — FAU, microlens, ferrules. Delivered a first <b>7,200-piece FAU order</b>{' '}
          (demo / verification only). Eight CPO lines in Suzhou; mass production{' '}
          <b>Q3–Q4 2026</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">tfc</span>
            the optical glue
            <br />supplier. <b>real</b>
            <br />production this
            <br />year.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Foxconn Industrial Internet (工业富联).</b> NVIDIA&rsquo;s{' '}
          <span className="v">exclusive</span> CPO switch assembler. Small-batch
          testing alongside Rubin Super Pod. Production <b>Q4 2026</b>. FY 2027 target{' '}
          <b>25,000 units</b>; realistic <b>~10,000+</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">foxconn</span>
            the only one
            <br />Nvidia ships
            <br />CPO switches
            <br /><b>through.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Innolight (中际旭创).</b> Submitted an <b>NPO solution</b> — not CPO — to
          NVIDIA. Running CPO pre-research with JCET on the side. Betting on the
          bridge. <b>USI / Universal Scientific (环旭电子).</b> Same bridge-tier bet,
          NPO samples mid-2026.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">innolight + usi</span>
            skipping CPO,
            <br />betting <b>NPO.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Coherent (II-VI).</b> Large CPO order from a top AI customer
          (effectively NVIDIA-side). CW source sample shipments running. Its
          diamond-particle SiC ceramic thermal material doesn&rsquo;t care which CPO
          route wins.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">coherent</span>
            the cw laser
            <br />and the cooling
            <br />material — both
            <br /><b>route-neutral.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>one-line read
      </h2>
      <p>
        Real volume on CPO is a <b>2027–2029</b> story. 2026 stays inside five digits.
        The pluggable empire (EML, DSP, cage) gets one more good year than the
        headline narrative implies. NPO is where the next twelve months of real
        engineering spend lands.
      </p>
    </ExplainerShell>
  );
}
