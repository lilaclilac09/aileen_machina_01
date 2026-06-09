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

      <ScarcityDiagram />

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

function ScarcityDiagram() {
  // upstream materials → bottleneck → product fan-out
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter
            id="ex-wobble-scarcity"
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018"
              numOctaves={2}
              seed={9}
            />
            <feDisplacementMap in="SourceGraphic" scale={1.3} />
          </filter>
        </defs>
      </svg>

      <div className="explainer-rack-wrap">
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 380 360"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-scarcity)"
        >
          <rect
            x={10}
            y={20}
            width={360}
            height={310}
            rx={4}
            fill="none"
            stroke="#1a1612"
            strokeWidth={1.6}
          />

          {/* upstream materials, left column */}
          <g>
            <rect
              x={30}
              y={70}
              width={90}
              height={62}
              fill="#3a2a16"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M38 90 L112 90" />
              <path d="M38 100 L112 100" />
              <path d="M38 110 L112 110" />
              <path d="M38 120 L112 120" />
            </g>
            <text
              x={75}
              y={94}
              fontFamily="JetBrains Mono"
              fontSize={8}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              HVLP4
            </text>
            <text
              x={75}
              y={108}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="rgba(255,255,255,0.7)"
              textAnchor="middle"
              letterSpacing={1}
            >
              copper foil
            </text>
            <text
              x={75}
              y={124}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={1}
            >
              -48% gap
            </text>
          </g>

          <g>
            <rect
              x={30}
              y={205}
              width={90}
              height={62}
              fill="#1c3a26"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M38 220 L112 220" />
              <path d="M38 232 L112 232" />
              <path d="M38 244 L112 244" />
              <path d="M38 256 L112 256" />
              <path d="M50 213 L50 264" />
              <path d="M75 213 L75 264" />
              <path d="M100 213 L100 264" />
            </g>
            <text
              x={75}
              y={230}
              fontFamily="JetBrains Mono"
              fontSize={8}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              LOW-DK
            </text>
            <text
              x={75}
              y={243}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="rgba(255,255,255,0.7)"
              textAnchor="middle"
              letterSpacing={1}
            >
              glass cloth
            </text>
            <text
              x={75}
              y={259}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={1}
            >
              Q-cloth sold out
            </text>
          </g>

          {/* bottleneck funnel (lilac outline) */}
          <g>
            <path
              d="M155 90 L235 150 L235 210 L155 270 Z"
              fill="rgba(124,92,196,0.08)"
              stroke="#7c5cc4"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            <text
              x={195}
              y={175}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#1a1612"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              avail-
            </text>
            <text
              x={195}
              y={190}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#1a1612"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              ability
            </text>
          </g>

          {/* feed arrows: materials → bottleneck */}
          <g stroke="#d9a449" strokeWidth={1.3} fill="none">
            <path d="M120 100 L 152 120" />
            <path d="M152 120 L 145 117 M152 120 L 149 113" />
            <path d="M120 236 L 152 218" />
            <path d="M152 218 L 145 217 M152 218 L 148 224" />
          </g>

          {/* three product outputs, right column */}
          <g>
            <rect
              x={270}
              y={50}
              width={86}
              height={56}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M278 68 L348 68" />
              <path d="M278 78 L348 78" />
              <path d="M278 88 L348 88" />
            </g>
            <text
              x={313}
              y={84}
              fontFamily="JetBrains Mono"
              fontSize={10}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              PCB
            </text>
          </g>

          <g>
            <rect
              x={270}
              y={142}
              width={86}
              height={56}
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M278 160 L348 160" />
              <path d="M278 170 L348 170" />
              <path d="M278 180 L348 180" />
            </g>
            <text
              x={313}
              y={176}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              OPTICAL
            </text>
          </g>

          <g>
            <rect
              x={270}
              y={234}
              width={86}
              height={56}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M278 252 L348 252" />
              <path d="M278 262 L348 262" />
              <path d="M278 272 L348 272" />
            </g>
            <text
              x={313}
              y={268}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              COOLING
            </text>
          </g>

          {/* fan-out arrows: bottleneck → products */}
          <g stroke="#d9a449" strokeWidth={1.3} fill="none">
            <path d="M236 150 Q 250 100 268 78" />
            <path d="M268 78 L 264 84 M268 78 L 261 80" />
            <path d="M236 180 L 268 170" />
            <path d="M268 170 L 261 168 M268 170 L 263 174" />
            <path d="M236 210 Q 250 240 268 260" />
            <path d="M268 260 L 261 256 M268 260 L 264 252" />
          </g>
        </svg>

        {/* lilac highlight overlay */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 380 360"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M155 80 Q 195 55 235 80" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 70, left: -28 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 205, left: -28 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 152, left: 175 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 142, right: -28 }}>
          4
        </div>
      </div>

      <p className="explainer-cap">
        two materials hold up{' '}
        <span className="v">the entire AI build</span>
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 56, left: -10, width: 138, transform: 'rotate(-3deg)' }}
      >
        <span className="h">HVLP4 foil</span>
        Mitsui +
        <br />the lead supplier
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 252, left: -16, width: 144, transform: 'rotate(2.4deg)' }}
      >
        <span className="h">low-DK cloth</span>
        Q-cloth nearly all
        <br />locked to Rubin
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 36, right: -18, width: 138, transform: 'rotate(2.4deg)' }}
      >
        <span className="h">PCB</span>
        M9 + Q-cloth
        <br />retires drilling
      </div>
      <div
        className="explainer-sticky green"
        style={{ bottom: 24, right: -22, width: 144, transform: 'rotate(-2.4deg)' }}
      >
        <span className="h">downstream</span>
        every stack needs
        <br />the <b>same</b> two
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 158, left: 130, width: 130, transform: 'rotate(-2deg)' }}
      >
        <span className="h">choke point</span>
        <b>two materials</b>
        <br />upstream of all
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 28,
          left: 145,
          fontSize: '1rem',
          transform: 'rotate(-6deg)',
        }}
      >
        ↓ the choke point
      </div>
      <div
        className="explainer-marg"
        style={{
          bottom: 60,
          left: 150,
          fontSize: '0.95rem',
          transform: 'rotate(-3deg)',
        }}
      >
        everyone needs both
      </div>
    </div>
  );
}
