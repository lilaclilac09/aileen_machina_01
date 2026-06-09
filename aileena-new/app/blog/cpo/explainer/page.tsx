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

      <CpoDiagram />

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

function CpoDiagram() {
  // six-step CPO assembly flow (vertical)
  const steps = [
    { label: 'SUBSTRATE PREP', fill: '#274c2e', y: 40 },
    { label: 'PIC BOND · 65 nm', fill: '#1f3a2a', y: 110 },
    { label: 'EIC BOND · 6 nm', fill: '#0f2a1a', y: 180 },
    { label: 'FAU ATTACH', fill: '#1c3a26', y: 250 },
    { label: 'HERMETIC SEAL', fill: '#3a2a16', y: 320 },
    { label: 'TEST · BURN-IN', fill: '#1a1612', y: 390 },
  ];

  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter
            id="ex-wobble-cpo"
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018"
              numOctaves={2}
              seed={5}
            />
            <feDisplacementMap in="SourceGraphic" scale={1.3} />
          </filter>
        </defs>
      </svg>

      <div className="explainer-rack-wrap">
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 360 480"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-cpo)"
        >
          <rect
            x={40}
            y={20}
            width={280}
            height={440}
            rx={4}
            fill="none"
            stroke="#1a1612"
            strokeWidth={1.6}
          />
          <rect
            x={40}
            y={20}
            width={280}
            height={440}
            rx={4}
            fill="none"
            stroke="rgba(26,22,18,0.22)"
            strokeWidth={3}
            transform="translate(2,2)"
          />

          {steps.map((s, i) => (
            <g key={s.label}>
              <rect
                x={70}
                y={s.y}
                width={220}
                height={48}
                fill={s.fill}
                stroke="#1a1612"
                strokeWidth={1}
              />
              <text
                x={180}
                y={s.y + 22}
                fontFamily="JetBrains Mono"
                fontSize={9}
                fill="#fff"
                textAnchor="middle"
                letterSpacing={2}
                style={{ textTransform: 'uppercase' }}
              >
                {s.label}
              </text>
              <text
                x={180}
                y={s.y + 36}
                fontFamily="JetBrains Mono"
                fontSize={7}
                fill={i === 5 ? '#d9a449' : 'rgba(255,255,255,0.55)'}
                textAnchor="middle"
                letterSpacing={1.5}
              >
                step {i + 1}
              </text>
              {i < steps.length - 1 && (
                <g stroke="#d9a449" strokeWidth={1.4} fill="none">
                  <path d={`M180 ${s.y + 48} L180 ${s.y + 62}`} />
                  <path
                    d={`M180 ${s.y + 62} L 176 ${s.y + 56} M180 ${s.y + 62} L 184 ${s.y + 56}`}
                  />
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* lilac overlay arrow at step 2 — "yield drops here" */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 360 480"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M340 134 Q 360 130 376 122" />
            <path d="M376 122 L 368 116 M376 122 L 370 130" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 40, left: -28 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 110, left: -28 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 178, left: -28 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 246, left: -28 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 316, left: -28 }}>
          5
        </div>
        <div className="explainer-num" style={{ top: 384, left: -28 }}>
          6
        </div>
      </div>

      <p className="explainer-cap">
        six steps · TSMC + NVIDIA · 2026 yield{' '}
        <span className="v">~75%</span>
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 38, right: -10, width: 142, transform: 'rotate(-3deg)' }}
      >
        <span className="h">① substrate</span>
        ABF carrier — Ajinomoto
        <br />build-up film
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 108, right: -22, width: 150, transform: 'rotate(2.6deg)' }}
      >
        <span className="h">② PIC · 65 nm</span>
        silicon photonics —
        <br /><b>~10%</b> die here
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 188, right: -16, width: 144, transform: 'rotate(-2.4deg)' }}
      >
        <span className="h">③ EIC · 6 nm</span>
        drives the laser,
        <br />face-to-face bond
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 258, right: -20, width: 158, transform: 'rotate(2.2deg)' }}
      >
        <span className="h">④ FAU</span>
        fibre alignment,
        <br />tol <b>0.5–0.6 µm</b>
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 392, right: -12, width: 152, transform: 'rotate(-3deg)' }}
      >
        <span className="h">⑥ yield</span>
        <b>~75%</b> vs target
        <br /><b>90–95%</b>
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 10,
          left: 20,
          fontSize: '1.05rem',
          transform: 'rotate(-7deg)',
        }}
      >
        ↑ each step compounds
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 430,
          left: 14,
          fontSize: '1rem',
          transform: 'rotate(-4deg)',
        }}
      >
        the gap closes slowly
      </div>
    </div>
  );
}
