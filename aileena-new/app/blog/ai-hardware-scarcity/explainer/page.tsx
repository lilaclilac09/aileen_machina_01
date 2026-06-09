'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function AiHardwareScarcityExplainer() {
  return (
    <ExplainerShell
      metaScript="investing · 2026 · may"
      title={
        <>
          What AI hardware is{' '}
          <em>
            running out of.
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
      dek="Everyone watches the GPU. But the build-out is gated by a dozen unglamorous materials — almost none with spare capacity."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            <b>Four</b> layers, <b>twelve</b> choke points. Laser chips booked
            to <b>2028</b>, copper foil short <b>48%</b>, PMIC lead times{' '}
            <b>30&ndash;40 weeks</b>. The winners <em>own</em> the scarce input.
          </p>
        </>
      }
      denseHref="/blog/ai-hardware-scarcity"
      prevHref="/blog/let-there-be-light"
      prevLabel="optical modules"
      nextHref="/blog/ai-cooling"
      nextLabel="cooling the build-out"
      footerMeta="investing · 2026.05.30"
    >
      <p>
        The story everyone tells about AI is a chip story. But walk down the
        supply chain and the real constraints aren&rsquo;t the famous chips
        &mdash; they&rsquo;re the boring inputs underneath. This is the map of
        the choke points, layer by layer.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>layer 1 — moving the light
      </h2>

      <div className="explainer-row">
        <p>
          <b>EML chips.</b> The core light-making chip in optical modules.
          Sumitomo ships ~<b>20 million</b>, demand leaves a <b>30% gap</b>.
          Prices up <b>40&ndash;50%</b>, up to <b>80%</b> on some parts.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">in plain words</span>
            EML = the laser chip. <b>short.</b>
            <br />
            Lumentum &amp; Coherent dominate.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>200G EML</b> is the sharpest version &mdash; each 1.6T module needs{' '}
          <b>eight</b> of them. 2026 supply of ~<b>50 million</b> chips covers
          only ~<b>7 million</b> modules against demand north of <b>25 million</b>.
          Silicon photonics fills <b>&gt;70%</b> of the gap.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">the math</span>
            50M chips ÷ 8 per module
            <br />
            = <b>7M</b> vs <b>25M</b> demand.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>CW light sources.</b> A continuous-wave DFB laser feeds silicon
          photonics &amp; CPO. Lumentum&rsquo;s capacity is locked through{' '}
          <b>2028</b>. Price crept from <b>&yen;3.5</b> a unit to{' '}
          <b>&yen;4&ndash;5</b>. Tight for <b>three to five years</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">in plain words</span>
            steady beam laser.
            <br />
            <b>booked to 2028.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Pump lasers.</b> Drive the EDFA amplifier inside DCI links.
          Lumentum + Coherent hold <b>over 90%</b>. Booked through 1H{' '}
          <b>2027</b>; customers now locking <b>2027&ndash;2029</b>. Expansion
          of <b>70&ndash;100%</b> still trails demand. Gap over <b>30%</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">duopoly</span>
            Lumentum + Coherent.
            <br />
            <b>volume up ~80%.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Faraday rotators.</b> Magnetic crystal at the heart of an optical
          isolator &mdash; stops back-reflected light destabilizing the laser.
          Coherent: ~<b>50%</b> (~<b>50,000</b>/month). Japanese JV: ~
          <b>30,000</b>/month. Price: <b>$120</b> (2023) → <b>$175</b> (2025),{' '}
          <b>+40%</b>, at <b>70&ndash;80%</b> gross margin.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">weaponized</span>
            Coherent treats module makers
            <br />
            as <b>rivals.</b> resource-swap only.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ down to the boards ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">→</span>layer 2 — the boards
      </h2>

      <div className="explainer-row">
        <p>
          <b>Low-DK glass cloth.</b> Reinforcing fabric inside high-end
          laminate. (Low-DK = loses less signal at high frequency.) Top grade
          &mdash; &ldquo;Q-cloth&rdquo; &mdash; nearly <b>100%</b> of 2026
          output earmarked for Nvidia Rubin. Even Gen-2 cloth: demand ~
          <b>3 million</b> m/month vs <b>1.2&ndash;1.3 million</b> capacity.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">in plain words</span>
            the fabric inside the PCB.
            <br />
            <b>Rubin took it all.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>HVLP4 copper foil.</b> Ultra-low-profile copper &mdash; very
          smooth, so high-frequency signals lose less energy. Gap: <b>48% in
          2026, 43% in 2027</b>. 2026 demand <b>&gt;1,200 tons/month</b> vs{' '}
          <b>300&ndash;400 tons/month</b> yield-adjusted capacity. Mitsui line
          conversion cuts output by <b>30%+</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">the gap</span>
            <b>48%</b> short in 2026.
            <br />
            yield is unstable.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>M8 / M9 CCL.</b> Copper-clad laminate &mdash; the base of the
          motherboard. M8 = 800G/1.6T, M9 = Rubin. Worse, its inputs (Low-DK
          cloth + HVLP foil above) are themselves short. Monthly M9 demand in
          2027 is projected at <b>5&ndash;6&times;</b> 2026&rsquo;s M8.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">stacked scarcity</span>
            the board is short
            <br />
            because its <b>parts</b> are short.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ feeding the watts ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>layer 3 — the power
      </h2>

      <div className="explainer-row">
        <p>
          <b>GaN &amp; SiC power devices.</b> Gallium-nitride / silicon-carbide
          chips switch power more efficiently than silicon &mdash; the parts in
          HVDC, PSUs, VRMs. Substrate-gated (slow crystal growth, slow yield
          gains).
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">in plain words</span>
            better power switches.
            <br />
            <b>crystal grows slow.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>High-cap MLCC + IC substrates.</b> AI servers use several times the
          capacitors a normal one does. IC substrates have taken{' '}
          <b>two rounds</b> of price increases since the start of <b>2026</b>;
          high-end carriers up a cumulative <b>40%</b>, another round under
          discussion.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">the trend</span>
            usage up sharply,
            <br />
            expansion <b>slow.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Power-management ICs.</b> TI, Infineon, MPS &mdash; mature chips
          shared with cars and industrial. AI grabs capacity off an existing
          market. Lead times: <b>10&ndash;12 weeks</b> →{' '}
          <b>30&ndash;40 weeks</b> (8&ndash;9 months).
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">weakest plank</span>
            board can&rsquo;t ship
            <br />
            even when exotic parts arrive.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>layer 4 — beneath the chips
      </h2>

      <div className="explainer-row">
        <p>
          <b>Indium-phosphide substrate.</b> The wafer the EML &amp; CW chips
          are grown on. Upstream indium is restricted by China&rsquo;s export
          to Japan &mdash; caps Sumitomo. Sumitomo holds ~<b>40%</b> of the
          global market.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">in plain words</span>
            you can&rsquo;t make EML
            <br />
            without <b>InP wafers.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Tungsten hexafluoride (WF6).</b> Gas used to fill tiny vertical
          holes in advanced chips &mdash; especially HBM (stacked memory beside
          AI accelerators) and 3D NAND. Contract price up{' '}
          <b>six quarters in a row</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">in plain words</span>
            scales with HBM &amp; NAND height.
            <br />
            <b>Kanto Denka, SK, Merck.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>the pattern
      </h2>
      <p>
        Same shape at every layer: a part only a few firms can make, a process
        slow to scale, AI demand arriving faster than anyone can add capacity.
        In a build-out gated by supply, the winners aren&rsquo;t whoever has
        the cleverest design &mdash; they&rsquo;re whoever <em>owns</em> the
        scarce input or <span className="v">locked</span> it first.
      </p>
    </ExplainerShell>
  );
}
