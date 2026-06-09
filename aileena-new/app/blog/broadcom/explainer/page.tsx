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

      <BroadcomDiagram />

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

function BroadcomDiagram() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble-broadcom" x="-2%" y="-2%" width="104%" height="104%">
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
          viewBox="0 0 360 500"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-broadcom)"
        >
          {/* outer empire frame */}
          <rect
            x={40}
            y={30}
            width={280}
            height={420}
            rx={4}
            fill="none"
            stroke="#1a1612"
            strokeWidth={1.6}
          />
          <rect
            x={40}
            y={30}
            width={280}
            height={420}
            rx={4}
            fill="none"
            stroke="rgba(26,22,18,0.22)"
            strokeWidth={3}
            transform="translate(2,2)"
          />
          <text
            x={180}
            y={22}
            fontFamily="JetBrains Mono"
            fontSize={8}
            fill="#1a1612"
            textAnchor="middle"
            letterSpacing={3}
            style={{ textTransform: 'uppercase' }}
          >
            broadcom · four pillars
          </text>

          {/* pillar 1 — TPU / Google (top-left) */}
          <g>
            <rect
              x={60}
              y={60}
              width={120}
              height={170}
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* mini icon — TPU dies */}
            <g fill="#d9a449">
              <rect x={80} y={90} width={28} height={18} />
              <rect x={132} y={90} width={28} height={18} />
              <rect x={80} y={120} width={28} height={18} />
              <rect x={132} y={120} width={28} height={18} />
            </g>
            <g stroke="#d9a449" strokeWidth={0.4} fill="none" opacity={0.6}>
              <path d="M108 99 L132 99" />
              <path d="M108 129 L132 129" />
              <path d="M94 108 L94 120" />
              <path d="M146 108 L146 120" />
            </g>
            <text
              x={120}
              y={170}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              TPU · GOOGLE
            </text>
            <text
              x={120}
              y={186}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              letterSpacing={1}
            >
              v7 · v8 training
            </text>
            <text
              x={120}
              y={212}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="rgba(255,255,255,0.45)"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              pillar 1
            </text>
          </g>

          {/* pillar 2 — Tomahawk 6 switch (top-right) */}
          <g>
            <rect
              x={180}
              y={60}
              width={120}
              height={170}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* mini icon — switch ports radiating */}
            <g stroke="#d9a449" strokeWidth={0.6} fill="none">
              <rect x={216} y={92} width={48} height={28} fill="#0f2a1a" />
              <path d="M210 106 L216 106" />
              <path d="M210 100 L216 100" />
              <path d="M210 112 L216 112" />
              <path d="M264 106 L270 106" />
              <path d="M264 100 L270 100" />
              <path d="M264 112 L270 112" />
              <path d="M240 92 L240 86" />
              <path d="M232 92 L232 86" />
              <path d="M248 92 L248 86" />
              <path d="M240 120 L240 126" />
              <path d="M232 120 L232 126" />
              <path d="M248 120 L248 126" />
            </g>
            <text
              x={240}
              y={110}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={1}
            >
              TH6
            </text>
            <text
              x={240}
              y={170}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              TOMAHAWK 6
            </text>
            <text
              x={240}
              y={186}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              letterSpacing={1}
            >
              1.2 T / port
            </text>
            <text
              x={240}
              y={212}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="rgba(255,255,255,0.45)"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              pillar 2
            </text>
          </g>

          {/* pillar 3 — EML laser (bottom-left) */}
          <g>
            <rect
              x={60}
              y={250}
              width={120}
              height={180}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* mini icon — laser beam */}
            <g>
              <rect x={78} y={290} width={26} height={14} fill="#3a2a16" stroke="#d9a449" strokeWidth={0.6} />
              <rect x={104} y={295} width={50} height={4} fill="#d9a449" opacity={0.85} />
              <circle cx={158} cy={297} r={3} fill="#ff8a4c" opacity={0.85} />
              <circle cx={158} cy={297} r={6} fill="none" stroke="#ff8a4c" strokeWidth={0.5} opacity={0.5} />
            </g>
            <text
              x={120}
              y={336}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              EML · ~50%
            </text>
            <text
              x={120}
              y={352}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              letterSpacing={1}
            >
              1 of 2 worldwide
            </text>
            <text
              x={120}
              y={412}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="rgba(255,255,255,0.45)"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              pillar 3
            </text>
          </g>

          {/* pillar 4 — DSP (bottom-right) */}
          <g>
            <rect
              x={180}
              y={250}
              width={120}
              height={180}
              fill="#1c3a26"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* mini icon — DSP die with traces */}
            <g>
              <rect x={210} y={285} width={60} height={36} fill="#0f2a1a" stroke="#d9a449" strokeWidth={0.6} />
              <g stroke="#d9a449" strokeWidth={0.4} fill="none" opacity={0.7}>
                <path d="M218 293 L262 293" />
                <path d="M218 299 L262 299" />
                <path d="M218 305 L262 305" />
                <path d="M218 311 L262 311" />
                <path d="M226 285 L226 321" />
                <path d="M240 285 L240 321" />
                <path d="M254 285 L254 321" />
              </g>
            </g>
            <text
              x={240}
              y={336}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              DSP · ~90%
            </text>
            <text
              x={240}
              y={352}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              letterSpacing={1}
            >
              non-Nvidia share
            </text>
            <text
              x={240}
              y={412}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="rgba(255,255,255,0.45)"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              pillar 4
            </text>
          </g>

          {/* center cross gap */}
          <line x1={180} y1={60} x2={180} y2={430} stroke="#1a1612" strokeWidth={1.6} />
          <line x1={60} y1={240} x2={300} y2={240} stroke="#1a1612" strokeWidth={1.6} />
        </svg>

        {/* hand-drawn lilac arrows — pressure vectors */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 360 500"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* MediaTek peel — from left into TPU pillar */}
            <path d="M8 130 Q 30 128 56 138" />
            <path d="M56 138 L 48 134 M56 138 L 50 144" />
            {/* Marvell — from right, split into TPU + DSP */}
            <path d="M348 200 Q 326 200 304 168" />
            <path d="M304 168 L 308 176 M304 168 L 312 170" />
            <path d="M348 200 Q 330 220 304 332" />
            <path d="M304 332 L 308 324 M304 332 L 314 332" />
            {/* CPO transition — from bottom up through both bottom pillars */}
            <path d="M120 472 Q 124 450 124 432" />
            <path d="M124 432 L 118 440 M124 432 L 130 440" />
            <path d="M240 472 Q 244 450 244 432" />
            <path d="M244 432 L 238 440 M244 432 L 250 440" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 60, left: -26 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 60, right: -26 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 252, left: -26 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 252, right: -26 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 430, left: 168 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        four pillars <span className="v">·</span> three pressure vectors
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 64, left: -22, width: 142, transform: 'rotate(-4deg)' }}
      >
        <span className="h">① TPU</span>
        Google&rsquo;s silicon
        <br />partner · <b>v7 + v8</b>
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 66, right: -22, width: 144, transform: 'rotate(3deg)' }}
      >
        <span className="h">② Tomahawk 6</span>
        switch king at
        <br /><b>1.2 T/port</b>
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 258, left: -22, width: 138, transform: 'rotate(-3deg)' }}
      >
        <span className="h">③ EML</span>
        one of <b>2</b>
        <br />worldwide
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 258, right: -22, width: 144, transform: 'rotate(2.6deg)' }}
      >
        <span className="h">④ DSP</span>
        ~<b>90%</b> of
        <br />non-Nvidia
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 446, left: 84, width: 196, transform: 'rotate(-2deg)' }}
      >
        <span className="h">⑤ CPO catch-22</span>
        would erase pillars <b>3 &amp; 4</b>
      </div>

      <div
        className="explainer-marg"
        style={{
          top: -4,
          right: 4,
          fontSize: '1rem',
          transform: 'rotate(-6deg)',
        }}
      >
        the three pressures ↘
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 488,
          right: 32,
          fontSize: '0.95rem',
          transform: 'rotate(-3deg)',
        }}
      >
        vs. Nvidia, this is everything
      </div>
    </div>
  );
}
