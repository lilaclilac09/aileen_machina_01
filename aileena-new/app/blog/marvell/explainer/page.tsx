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

      <MarvellDiagram />

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

function MarvellDiagram() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble-marvell" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018"
              numOctaves={2}
              seed={7}
            />
            <feDisplacementMap in="SourceGraphic" scale={1.3} />
          </filter>
        </defs>
      </svg>

      <div className="explainer-rack-wrap">
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 360 540"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-marvell)"
        >
          {/* outer chain frame */}
          <rect
            x={60}
            y={20}
            width={240}
            height={500}
            rx={4}
            fill="none"
            stroke="#1a1612"
            strokeWidth={1.6}
          />
          <rect
            x={60}
            y={20}
            width={240}
            height={500}
            rx={4}
            fill="none"
            stroke="rgba(26,22,18,0.22)"
            strokeWidth={3}
            transform="translate(2,2)"
          />

          {/* FIBER — top band */}
          <g>
            <rect
              x={80}
              y={40}
              width={200}
              height={50}
              fill="#1a1612"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.6} fill="none">
              <path d="M88 56 L272 56" />
              <path d="M88 66 L272 66" />
              <path d="M88 76 L272 76" />
            </g>
            <text
              x={180}
              y={70}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={3}
              style={{ textTransform: 'uppercase' }}
            >
              fiber
            </text>
          </g>

          {/* LASER · EML */}
          <g>
            <rect
              x={80}
              y={120}
              width={200}
              height={62}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* laser bar icon */}
            <g>
              <rect x={108} y={140} width={28} height={10} fill="#3a2a16" stroke="#d9a449" strokeWidth={0.5} />
              <rect x={136} y={143} width={36} height={4} fill="#d9a449" opacity={0.85} />
              <circle cx={176} cy={145} r={3} fill="#ff8a4c" />
            </g>
            <text
              x={180}
              y={170}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.5}
              style={{ textTransform: 'uppercase' }}
            >
              laser · EML
            </text>
          </g>

          {/* TIA — Marvell (highlighted lilac) */}
          <g>
            <rect
              x={70}
              y={210}
              width={220}
              height={76}
              fill="#1f3a2a"
              stroke="#7c5cc4"
              strokeWidth={3}
            />
            {/* PD → TIA → DSP mini icon */}
            <g>
              <circle cx={104} cy={236} r={6} fill="#d9a449" opacity={0.85} />
              <text
                x={104}
                y={252}
                fontFamily="JetBrains Mono"
                fontSize={5.5}
                fill="rgba(255,255,255,0.55)"
                textAnchor="middle"
              >
                PD
              </text>
              <rect x={144} y={228} width={70} height={20} fill="#7c5cc4" opacity={0.85} stroke="#fff" strokeWidth={0.5} />
              <text
                x={179}
                y={242}
                fontFamily="JetBrains Mono"
                fontSize={7}
                fill="#1a1612"
                textAnchor="middle"
                letterSpacing={1}
                style={{ textTransform: 'uppercase' }}
              >
                TIA
              </text>
              <path d="M110 236 L 144 236" stroke="#d9a449" strokeWidth={0.6} fill="none" />
              <path d="M144 236 L 138 232 M144 236 L 138 240" stroke="#d9a449" strokeWidth={0.6} fill="none" />
              <path d="M214 238 L 248 238" stroke="#d9a449" strokeWidth={0.6} fill="none" />
              <path d="M248 238 L 242 234 M248 238 L 242 242" stroke="#d9a449" strokeWidth={0.6} fill="none" />
              <text
                x={252}
                y={252}
                fontFamily="JetBrains Mono"
                fontSize={5.5}
                fill="rgba(255,255,255,0.55)"
                textAnchor="middle"
              >
                DSP→
              </text>
            </g>
            <text
              x={180}
              y={274}
              fontFamily="JetBrains Mono"
              fontSize={9.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.5}
              style={{ textTransform: 'uppercase' }}
            >
              TIA — Marvell
            </text>
          </g>

          {/* DSP */}
          <g>
            <rect
              x={80}
              y={314}
              width={200}
              height={62}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.4} fill="none" opacity={0.7}>
              <path d="M96 332 L264 332" />
              <path d="M96 340 L264 340" />
              <path d="M96 348 L264 348" />
              <path d="M120 320 L120 370" />
              <path d="M180 320 L180 370" />
              <path d="M240 320 L240 370" />
            </g>
            <text
              x={180}
              y={362}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={3}
              style={{ textTransform: 'uppercase' }}
            >
              DSP
            </text>
          </g>

          {/* SWITCH ASIC */}
          <g>
            <rect
              x={80}
              y={406}
              width={200}
              height={86}
              fill="#1c3a26"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <rect x={120} y={420} width={120} height={36} fill="#0f2a1a" />
              <path d="M108 432 L120 432" />
              <path d="M108 438 L120 438" />
              <path d="M108 444 L120 444" />
              <path d="M240 432 L252 432" />
              <path d="M240 438 L252 438" />
              <path d="M240 444 L252 444" />
            </g>
            <text
              x={180}
              y={442}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={1}
            >
              ASIC
            </text>
            <text
              x={180}
              y={476}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.5}
              style={{ textTransform: 'uppercase' }}
            >
              switch ASIC
            </text>
          </g>

          {/* signal-direction arrows between layers */}
          <g stroke="#d9a449" strokeWidth={0.7} fill="none" opacity={0.85}>
            <path d="M180 92 L180 116" />
            <path d="M180 116 L 175 110 M180 116 L 185 110" />
            <path d="M180 184 L180 206" />
            <path d="M180 206 L 175 200 M180 206 L 185 200" />
            <path d="M180 288 L180 310" />
            <path d="M180 310 L 175 304 M180 310 L 185 304" />
            <path d="M180 378 L180 402" />
            <path d="M180 402 L 175 396 M180 402 L 185 396" />
          </g>
        </svg>

        {/* hand-drawn lilac arrows overlay */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 360 540"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* highlight TIA pillar — squiggle around it */}
            <path d="M52 248 Q 48 270 56 290" />
            <path d="M56 290 L 52 282 M56 290 L 60 284" />
            {/* DSP fight arrow */}
            <path d="M306 344 Q 326 344 344 340" />
            <path d="M344 340 L 336 336 M344 340 L 336 344" />
            {/* absences — two strikes on the bottom right */}
            <path d="M50 408 Q 44 420 48 440" />
            <path d="M48 440 L 44 432 M48 440 L 52 434" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 38, right: -26 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 124, left: -26 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 222, right: -26 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 320, left: -26 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 416, right: -26 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        the optical receive path <span className="v">·</span> top to bottom
      </p>

      <div
        className="explainer-sticky pink"
        style={{ top: 44, left: -26, width: 138, transform: 'rotate(-3deg)' }}
      >
        <span className="h">① fiber</span>
        absent from <b>2.4T</b>
        <br />Google coherent
      </div>
      <div
        className="explainer-sticky yellow"
        style={{ top: 132, right: -22, width: 144, transform: 'rotate(3deg)' }}
      >
        <span className="h">② laser · EML</span>
        the upstream
        <br />choke point
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 226, left: -28, width: 156, transform: 'rotate(-4deg)' }}
      >
        <span className="h">③ Marvell owns this</span>
        <b>80%</b> 800G single-mode ·
        only <b>1.6T</b> volume player
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 326, right: -22, width: 146, transform: 'rotate(2.6deg)' }}
      >
        <span className="h">④ DSP fight</span>
        Broadcom holds
        <br /><b>~90%</b> non-Nvidia
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 428, left: -26, width: 148, transform: 'rotate(-3deg)' }}
      >
        <span className="h">⑤ switch ASIC</span>
        absent from NVIDIA-TSMC
        <br /><b>3.2T CPO</b>
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 240,
          left: 16,
          fontSize: '1rem',
          transform: 'rotate(-90deg)',
        }}
      >
        ↓ direction of light
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 510,
          right: 30,
          fontSize: '0.95rem',
          transform: 'rotate(-3deg)',
        }}
      >
        co-architects NPO w/ AWS ↗
      </div>
    </div>
  );
}
