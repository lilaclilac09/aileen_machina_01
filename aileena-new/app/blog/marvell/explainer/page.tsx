'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function MarvellExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · jun"
      title={
        <>
          Marvell owns one chip in the{' '}
          <em>
            optical stack.
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
      dek="The TIA. 80% of 800G single-mode, the only 1.6T volume player today. Above it: a DSP slugfest with Broadcom."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            owns <b>TIA</b>. fights Broadcom on <b>DSP</b>. absent from{' '}
            Google&rsquo;s <b>2.4T coherent</b> and the Nvidia–TSMC{' '}
            <b>3.2T CPO</b> main line.
          </p>
        </>
      }
      denseHref="/blog/marvell"
      prevHref="/blog/broadcom"
      prevLabel="broadcom, four pillars"
      nextHref="/blog/cpo"
      nextLabel="cpo, the six steps"
      footerMeta="markets · 2026.06.01"
    >
      <p>
        Marvell&rsquo;s AI story is one specific layer of the optical supply chain —
        the chips between the photon and the data path — and how it owns, shares, or
        has been locked out of each box at that layer.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>what a TIA is
      </h2>

      <div className="explainer-row">
        <p>
          The fiber drops light onto a <b>PD</b> (photodetector); the PD turns it into
          microamps. The <b>TIA</b> (transimpedance amplifier) boosts that signal and
          hands voltage to the <b>DSP</b>. <b>PD → TIA → DSP.</b>
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">in plain words</span>
            tiny preamp
            <br />between the
            <br />photodetector
            <br />and the brain.
          </div>
        </div>
      </div>

      <p>
        Small, deeply embedded, hard to second-source. That&rsquo;s why winning the TIA
        socket is sticky — and Marvell has won it.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">→</span>the TIA monopoly
      </h2>

      <div className="explainer-row">
        <p>
          <b>800G single-mode TIA:</b> Marvell <b>~80%</b>, Semtech <b>~20%</b>.{' '}
          <b>800G multi-mode TIA:</b> Macom <b>~50%</b>, Marvell + Semtech split the
          rest. Almost all of the 800G TIA growth is single-mode — where Marvell is{' '}
          <b>4×</b> the nearest competitor.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">800g share</span>
            single-mode is
            <br />the dollar that
            <br />grows. Marvell
            <br />takes <b>most</b> of it.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>1.6T TIA:</b> Marvell is the <span className="v">only</span> company in
          volume today. Macom and Semtech are still sampling; ramp expected{' '}
          <b>1H 2027</b> at the earliest. Every 1.6T module shipped in 2026 carries a
          Marvell TIA by default.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">1.6t cliff</span>
            year-plus lead.
            <br />the strongest
            <br />competitive seat
            <br />in the whole
            <br />AI build-out.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ one step down the receive path ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>the DSP slugfest
      </h2>

      <div className="explainer-row">
        <p>
          The <b>DSP</b> is the brain of the module: equalisation, FEC (forward error
          correction), framing. At 800G and 1.6T it&rsquo;s leading-edge silicon —{' '}
          <b>TSMC 3 nm</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">dsp</span>
            decodes the
            <br />light. Fixes
            <br />bit errors.
            <br />Frames the data.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Outside Nvidia, <b>Broadcom holds ~90%</b> of the pluggable DSP market.
          Marvell is the credible challenger but materially smaller. The fight today
          isn&rsquo;t design — it&rsquo;s the same overbooked <b>3 nm</b> capacity gating
          both sides.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">3 nm allocation</span>
            whoever pulls
            <br />more wafers
            <br /><b>wins.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>white-box switches
      </h2>

      <div className="explainer-row">
        <p>
          <b>Camp 1 — Nvidia:</b> closed bundle, CSPs can&rsquo;t customise.{' '}
          <b>Camp 2 — Broadcom + Marvell:</b> sell switch silicon to hyperscalers,
          which build customised white-box switches via JDM/ODM partners.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">analogy</span>
            white-box switch
            <br />= bare-metal PC.
            <br />Marvell + Broadcom
            <br />are <b>the CPU.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>where Marvell is absent
      </h2>

      <div className="explainer-row">
        <p>
          <b>Google&rsquo;s 2.4T coherent module.</b> Core DSP is Google&rsquo;s own —
          built by an in-house team assembled out of former Inphi engineers. Marvell
          is not the supplier.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">absence 1</span>
            Google built its
            <br />own DSP. Marvell
            <br /><b>out.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>The Nvidia–TSMC 3.2T CPO main line.</b> The optical-engine package on the
          substrate is controlled by Nvidia and TSMC. Third-party module specialists,
          Marvell included, have no direct seat at this layer.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">absence 2</span>
            the densest
            <br />Nvidia CPO box
            <br />has <b>no Marvell.</b>
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ the bridge generation ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>NPO — Marvell as co-architect
      </h2>

      <div className="explainer-row">
        <p>
          <b>NPO</b> (near-packaged optics) is the bridge between today&rsquo;s
          pluggables and full CPO. The optical engine moves closer to the switch ASIC
          but doesn&rsquo;t fully integrate onto the substrate.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">npo</span>
            optics gets <b>close</b>
            <br />to the chip —
            <br />but not <b>inside</b>
            <br />the package.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          NPO is <b>DSP-less</b>. Signal recovery moves to <b>SerDes</b> blocks paired
          with enhanced drivers and TIAs. The dominant SerDes-IP suppliers are{' '}
          <b>Marvell and Broadcom</b>. Among overseas players, Marvell and Amazon lead
          the NPO push.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">silver lining</span>
            no DSP socket?
            <br />Marvell still
            <br />owns the <b>SerDes</b>
            <br />underneath.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>one-line read
      </h2>
      <p>
        Technology lead in TIA, structural pressure in DSP, co-architect in NPO. The
        TIA monopoly buys time; the DSP fight resolves next; NPO decides whether the{' '}
        <b>SerDes-IP</b> socket replaces what the DSP socket used to be.
      </p>
    </ExplainerShell>
  );
}
