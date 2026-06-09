'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function BroadcomExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · jun"
      title={
        <>
          Where Broadcom sits in the{' '}
          <em>
            AI stack.
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
      dek="The most dominant non-Nvidia silicon vendor — and the one facing the most credible disruption stack against it."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            <b>four</b> pillars: ASIC, switch, optical, CPO. <b>three</b> live pressures:
            MediaTek, Marvell, OpenAI. CPO is the catch-22 — every win eats Broadcom&rsquo;s
            own EML + DSP book.
          </p>
        </>
      }
      denseHref="/blog/broadcom"
      prevHref="/blog/marvell"
      prevLabel="marvell, the TIA monopoly"
      nextHref="/blog/cpo"
      nextLabel="cpo, the six steps"
      footerMeta="markets · 2026.06.01"
    >
      <p>
        Broadcom is the AI silicon company with the deepest dominance after Nvidia.
        Four pillars hold up the empire. Three pressure vectors are denting it at the
        same time.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>pillar 1 — custom ASIC
      </h2>

      <div className="explainer-row">
        <p>
          <b>Google.</b> Broadcom is still the design partner on{' '}
          <b>TPU v7</b> (training) and the <b>TPU v8</b> family (training + inference).
          Broadcom owns the physical design and SerDes; TSMC owns the fab; Google keeps
          the architecture in-house.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">in plain words</span>
            Broadcom turns Google&rsquo;s
            <br />blueprint into <b>real silicon.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>OpenAI.</b> Exclusive design partner on OpenAI&rsquo;s in-house training
          ASIC. Program size: <b>~2,000 racks</b>, <b>$3 M</b> per rack, total{' '}
          <b>$6–8 B</b>. NPI today; volume ramps <b>2H 2026</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">npi</span>
            new product intro —
            <br />the chip <b>before</b>
            <br />volume ships.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ pillar 2 ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">→</span>switch silicon
      </h2>

      <div className="explainer-row">
        <p>
          <b>Tomahawk</b> and <b>Trident</b> are inside almost every brand-name switch —
          Cisco, Arista, Huawei, H3C. Current generation: <b>Tomahawk 6</b> at{' '}
          <b>1.2 T per port</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">switch chip</span>
            the traffic cop
            <br />inside every
            <br />data-centre box.
          </div>
        </div>
      </div>

      <p>
        Of the four pillars this is the one that looks most secure on a{' '}
        <b>2–3 year</b> horizon. Marvell is the credible challenger but the share gap is
        wide.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>pillar 3 — optical chips
      </h2>

      <div className="explainer-row">
        <p>
          <b>EML</b> (electro-absorption laser). The light source inside 800G / 1.6T
          modules. Only two real suppliers worldwide: <b>Lumentum</b> and{' '}
          <b>Broadcom</b>. <b>200 G EML</b> lead times stretch a year. Eoptolink alone
          has booked <b>&gt;50%</b> of Broadcom&rsquo;s capacity.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">eml</span>
            tiny laser that
            <br />blinks <b>200 G</b> of
            <br />data into fiber.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>DSP</b> (digital signal processor). The brain of an optical module.
          Outside Nvidia, Broadcom holds <b>~90%</b>. The cap is TSMC&rsquo;s{' '}
          <b>3 nm</b> allocation — Broadcom and Marvell compete for the same overbooked
          wafers.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">dsp</span>
            the chip that
            <br />reads the blinks
            <br />and turns them
            <br />back into <b>1s and 0s.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>pillar 4 — CPO, the catch-22
      </h2>

      <div className="explainer-row">
        <p>
          <b>CPO</b> (co-packaged optics) collapses the optical engine onto the switch
          ASIC. Broadcom&rsquo;s bet is a <b>Mach–Zehnder</b> route inside an{' '}
          <span className="v">open</span> ecosystem — the opposite of Nvidia&rsquo;s
          closed stack.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">cpo</span>
            the module
            <br />moves <b>inside</b>
            <br />the chip package.
          </div>
        </div>
      </div>

      <p>
        Volume window: <b>2H 2027 to 2028</b> — about <b>6–12 months</b> behind Nvidia.
        Today: prototype and pilot only, no shipments.
      </p>

      <div className="explainer-row">
        <p>
          The deeper problem is structural. Broadcom is the EML and DSP supplier whose
          products CPO is built to replace. Push CPO hard, cannibalise the legacy book.
          Push it slow, cede the next generation to Nvidia.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">catch-22</span>
            every CPO win
            <br />kills a Broadcom
            <br /><b>EML + DSP</b> sale.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ the three pressures ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>three pressure vectors
      </h2>

      <div className="explainer-row">
        <p>
          <b>MediaTek peels off Google inference.</b> Google has shifted the{' '}
          <b>V8E</b> inference TPU work to MediaTek. Training (v7, v8) still Broadcom;
          inference partly MediaTek. The Broadcom premium is what Google wants to stop
          paying.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">pressure 1</span>
            first dent in the
            <br />TPU monopoly.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Marvell takes Trainium and a Google FFN socket.</b> Marvell now owns
          AWS&rsquo;s Trainium 2/3 design-service contract — direct loss to Broadcom.
          Google also brought Marvell in as a strategic backup for FFN
          (feed-forward network) workloads.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">pressure 2</span>
            the ASIC market
            <br />is now <b>two firms</b>,
            <br />not one.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>OpenAI conservative on 2026.</b> The Broadcom program is <b>$6–8 B</b>{' '}
          total. OpenAI&rsquo;s Nvidia spend runs <b>~$30 B/yr</b>. Broadcom is one
          line in a portfolio — pricing power is bounded.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">pressure 3</span>
            OpenAI multi-vendors
            <br />— Nvidia, AMD, Arm,
            <br />Broadcom.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>one-line read
      </h2>
      <p>
        Still the most-dominant non-Nvidia silicon vendor with the deepest customer
        base — and the most credible disruption stack against it on a{' '}
        <b>12–18 month</b> horizon. The empire is intact; the dent count is rising.
      </p>
    </ExplainerShell>
  );
}
