'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function AiCoolingExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · jun"
      title={
        <>
          A thermal cliff at{' '}
          <em>
            20 watts.
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
      dek="Above it, only liquid cooling works — and one company has the patents. Here's the path of the heat."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            1.6T optical modules dissipate <b>~20 W</b>. Past that, air fails
            and liquid wins. <b>Amphenol</b> owns the cage today; <b>TE</b>{' '}
            catches up by <b>2027</b>; <b>CPO</b> could erase the whole market.
          </p>
        </>
      }
      denseHref="/blog/ai-cooling"
      prevHref="/blog/ai-hardware-scarcity"
      prevLabel="scarcity map"
      nextHref="/blog/let-there-be-light"
      nextLabel="optical modules"
      footerMeta="markets · 2026.06.01"
    >
      <p>
        A 1.6 terabit-per-second optical module dissipates{' '}
        <b>about 20 watts</b> of waste heat inside a cage roughly the size of a
        USB stick. Above that threshold, air can&rsquo;t carry it off fast
        enough. <span className="v">One number bisects the entire cooling industry.</span>
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>the cliff
      </h2>

      <div className="explainer-row">
        <p>
          Air cooling works up to <b>16 W</b>. A copper heat sink, a small fan,
          ambient airflow &mdash; done.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">air zone</span>
            heat sink + fan.
            <br />
            <b>cheap.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Between <b>16 and 20 W</b>: gray zone. The laser drifts off its
          sweet spot, error rates creep up &mdash; a 1.6T module gives only{' '}
          <b>1.4T</b> of useful throughput. A <b>12.5%</b> efficiency hit.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">gray zone</span>
            you pay for cooling
            <br />
            you can&rsquo;t actually do.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Past <b>20 W</b>: no gray zone. The laser drifts off-channel, the
          link doesn&rsquo;t come up. Full-rate 1.6T <b>must</b> be
          liquid-cooled.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">liquid zone</span>
            cage + cold plate +
            <br />
            dielectric coolant.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ who picked what ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">→</span>two buyers, two answers
      </h2>

      <div className="explainer-row">
        <p>
          <b>Nvidia &mdash; 100% liquid.</b> Rubin packs <b>72 GPUs per rack</b>.
          At that density rack-level dissipation is kilowatts. Air doesn&rsquo;t
          even try.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">nvidia</span>
            <b>liquid end-to-end.</b>
            <br />
            volume buyer rules.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>CSPs &mdash; mixed.</b> Google, Amazon, Meta run their own racks at{' '}
          <b>32 GPUs each</b> &mdash; about half Nvidia&rsquo;s density. Google&rsquo;s
          1.6T liquid penetration is around <b>20%</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">csps</span>
            own your rack →
            <br />
            <b>&agrave; la carte.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>amphenol monopoly
      </h2>

      <div className="explainer-row">
        <p>
          The liquid cage is mechanically critical and patented heavily. In
          2026, <b>Amphenol</b> holds dominant share &mdash; close to monopoly
          &mdash; driven by core patents on the cage geometry.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">tier 1 today</span>
            Amphenol = <b>cages</b>
            <br />
            by default.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>TE Connectivity</b> is the credible second. Consensus has it
          reaching <b>parity with Amphenol</b> through 2027 &mdash; a market
          that looks like a monopoly resolves into a duopoly in eighteen months.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">2027 shift</span>
            monopoly →
            <br />
            <b>duopoly.</b>
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ tier-2 beneficiaries ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>where the parts get stamped
      </h2>

      <div className="explainer-row">
        <p>
          <b>Dintech (鼎通科技).</b> Largest single beneficiary &mdash; supplies
          structural parts to <em>both</em> Amphenol and TE. Whichever side of
          the duopoly wins, Dintech gets paid.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">tier-2 #1</span>
            sells to <b>both</b>
            <br />
            sides of the fight.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Sunway Communication (硕贝德).</b> Cold plates &amp; structural
          parts to TE. Growing into the TE-side build-out.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">tier-2 #2</span>
            TE-side, smaller,
            <br />
            growing.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Yidong Electronics (奕东电子).</b> Minor TE supplier, expected to be
          qualified into the broader chain through <b>2027</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">tier-2 #3</span>
            queuing for
            <br />
            <b>2027</b> qualification.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>unit economics
      </h2>

      <div className="explainer-row">
        <p>
          A single <b>2&times;8 liquid-cooling cage</b> (eight columns wide, two
          rows deep, sixteen module slots) sells at up to <b>&yen;1,800</b>{' '}
          &mdash; roughly <b>$250</b> at current FX.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">price</span>
            <b>$250</b> a cage.
            <br />
            raw parts cost less.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>the cpo threat
      </h2>

      <div className="explainer-row">
        <p>
          <b>CPO</b> (co-packaged optics) puts the optical engine onto the
          switch ASIC. No cage, no pluggable transceiver. The whole
          liquid-cooling stack <em>goes to zero</em>.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">in plain words</span>
            optics fuse to the chip.
            <br />
            <b>cage business dies.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Consensus has CPO as a <b>2027&ndash;2028</b> story, not a 2026 one.
          Specific high-density links first, not a wholesale replacement.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">timing</span>
            slow burn, but
            <br />
            <b>erases</b> the stack.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>the wildcard
      </h2>

      <div className="explainer-row">
        <p>
          <b>Coherent&rsquo;s diamond-particle silicon-carbide ceramic.</b>{' '}
          Thermal conductivity ~<b>2&times;</b> copper. Weight ~<b>60%</b> of
          copper. Drops chip temperature by about <b>15&deg;C</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">in plain words</span>
            better ceramic than copper.
            <br />
            bolts on <b>anywhere.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Independent of the cage stack. Independent of CPO. Revenue begins in{' '}
          <b>2H 2027</b> &mdash; entirely incremental, owned end-to-end by
          Coherent.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">why it matters</span>
            doesn&rsquo;t get unmade
            <br />
            by <b>CPO.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>the shape
      </h2>
      <p>
        Four layers, one Pareto: <b>buyer</b> (Nvidia = liquid, CSPs = mixed),{' '}
        <b>cage maker</b> (Amphenol monopoly → Amphenol + TE duopoly by{' '}
        <b>2027</b>), <b>structural-parts contractor</b> (Dintech, Sunway,
        Yidong), <b>wildcards</b> (Coherent ceramic in <b>2H 2027</b>; CPO in{' '}
        <b>2027&ndash;2028</b>). The most interesting question isn&rsquo;t who
        wins the cage market &mdash; it&rsquo;s whether the cage market still
        <span className="v"> exists </span>in three years.
      </p>
    </ExplainerShell>
  );
}
