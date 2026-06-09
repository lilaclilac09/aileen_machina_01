'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function AiPcbExplainer() {
  return (
    <ExplainerShell
      metaScript="investing · 2026 · jun"
      title={
        <>
          Five PCBs sit inside a current-generation{' '}
          <em>
            AI rack.
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
      dek="Why mainland China is winning the board fight in 2026 — and which one decides 2027."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            five boards. mainland China leads on <b>three</b>. the fight that matters
            is <b>SLP at 10 µm</b> — new clean-room plants only, no retrofits.
          </p>
        </>
      }
      denseHref="/blog/ai-pcb"
      prevHref="/blog/cpo"
      prevLabel="cpo, six steps"
      nextHref="/blog/broadcom"
      nextLabel="broadcom, four pillars"
      footerMeta="investing · 2026.06.02"
    >
      <p>
        An AI rack is a sandwich of five PCBs stacked together. Each one has its own
        supplier fight. The map is moving fast enough that two consecutive Rubin
        generations could ship with completely different vendor lists.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>the five boards
      </h2>

      <DiagramBlock />

      <h2 className="explainer-section-h">
        <span className="arr">→</span>why the mid plane exists
      </h2>

      <div className="explainer-row">
        <p>
          Blackwell racks connect compute boards to switch boards through{' '}
          <b>5,000+ copper cables</b>. Assembling the bundle is the named reason GB200
          deliveries slipped.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">in plain words</span>
            too many wires. they replaced them with <b>one rigid skeleton.</b>
          </div>
        </div>
      </div>

      <p>
        The 576-rack architecture drops the cables for an orthogonal backplane — every
        drawer plugs into the same rigid PCB skeleton. The mid plane is the
        drawer-level version of the same shift.
      </p>

      <div className="explainer-flow-arrow">↓ the fight today ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>three barriers
      </h2>

      <div className="explainer-row">
        <p>
          <b>SLP at 10 µm.</b> Needs new clean-room plants. Avary has Apple SLP DNA;
          Victory Giant is committing capex.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">barrier 1</span>
            new factory, not
            <br />a retrofit. capex bet.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>M9 + Q-cloth.</b> Retires mechanical drilling. Han&rsquo;s Laser opens
          to <b>&gt;60%</b> domestic share.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">barrier 2</span>
            old drill <b>retires.</b>
            <br />laser takes over.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Copper sintering</b> for mid plane + backplane is industry-first,
          execution-speed-led.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">barrier 3</span>
            first to ship
            <br />at yield <b>wins.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>the google sidebar
      </h2>
      <p>
        Forecast revised <b>2.5–3M → 4M</b> TPU chips at ~$9k each. Uses 22–24 layer
        multi-high, not HDI. ISU / Wus / ChaoYing incumbent. Victory Giant queuing
        for ~6 month certification.
      </p>
    </ExplainerShell>
  );
}

function DiagramBlock() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018"
              numOctaves={2}
              seed={3}
            />
            <feDisplacementMap in="SourceGraphic" scale={1.3} />
          </filter>
        </defs>
      </svg>

      <div className="explainer-rack-wrap">
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 360 530"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble)"
        >
          <rect
            x={40}
            y={20}
            width={280}
            height={490}
            rx={4}
            fill="none"
            stroke="#1a1612"
            strokeWidth={1.6}
          />
          <rect
            x={40}
            y={20}
            width={280}
            height={490}
            rx={4}
            fill="none"
            stroke="rgba(26,22,18,0.22)"
            strokeWidth={3}
            transform="translate(2,2)"
          />

          {/* compute */}
          <g>
            <rect
              x={60}
              y={50}
              width={240}
              height={62}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g fill="#d9a449">
              <rect x={68} y={58} width={40} height={4} />
              <rect x={120} y={58} width={40} height={4} />
              <rect x={172} y={58} width={40} height={4} />
              <rect x={224} y={58} width={40} height={4} />
            </g>
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M70 80 L290 80" />
              <path d="M70 88 L290 88" />
              <path d="M70 96 L290 96" />
            </g>
            <text
              x={180}
              y={80}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              HDI · compute
            </text>
          </g>

          {/* switch */}
          <g>
            <rect
              x={60}
              y={130}
              width={240}
              height={44}
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M70 155 L290 155" />
              <path d="M70 163 L290 163" />
            </g>
            <text
              x={180}
              y={153}
              fontFamily="JetBrains Mono"
              fontSize={8.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              switch
            </text>
          </g>

          {/* mid plane */}
          <g>
            <rect
              x={60}
              y={200}
              width={240}
              height={110}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="rgba(217,164,73,0.5)" strokeWidth={0.4} fill="none">
              <path d="M70 215 L290 215" />
              <path d="M70 223 L290 223" />
              <path d="M70 231 L290 231" />
              <path d="M70 239 L290 239" />
              <path d="M70 247 L290 247" />
              <path d="M70 255 L290 255" />
              <path d="M70 263 L290 263" />
              <path d="M70 271 L290 271" />
              <path d="M70 279 L290 279" />
              <path d="M70 287 L290 287" />
              <path d="M70 295 L290 295" />
              <path d="M70 303 L290 303" />
              <path d="M90 210 L90 305" />
              <path d="M120 210 L120 305" />
              <path d="M150 210 L150 305" />
              <path d="M180 210 L180 305" />
              <path d="M210 210 L210 305" />
              <path d="M240 210 L240 305" />
              <path d="M270 210 L270 305" />
            </g>
            <text
              x={180}
              y={252}
              fontFamily="JetBrains Mono"
              fontSize={9.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.5}
              style={{ textTransform: 'uppercase' }}
            >
              mid plane
            </text>
            <text
              x={180}
              y={266}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              letterSpacing={1}
            >
              44-layer · orthogonal
            </text>
          </g>

          {/* backplane */}
          <g>
            <rect
              x={60}
              y={330}
              width={240}
              height={54}
              fill="#1c3a26"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.5} fill="none">
              <path d="M70 348 L290 348" />
              <path d="M70 358 L290 358" />
              <path d="M70 368 L290 368" />
            </g>
            <text
              x={180}
              y={355}
              fontFamily="JetBrains Mono"
              fontSize={8.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              orth. backplane
            </text>
          </g>

          {/* SLP */}
          <g>
            <rect
              x={60}
              y={405}
              width={240}
              height={48}
              fill="#3a2a16"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <g stroke="#d9a449" strokeWidth={0.3} fill="none" opacity={0.85}>
              <path d="M70 415 L290 415" />
              <path d="M70 420 L290 420" />
              <path d="M70 425 L290 425" />
              <path d="M70 430 L290 430" />
              <path d="M70 435 L290 435" />
              <path d="M70 440 L290 440" />
            </g>
            <text
              x={180}
              y={432}
              fontFamily="JetBrains Mono"
              fontSize={8.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              SLP · 10 µm
            </text>
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
          viewBox="0 0 360 530"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M340 82 Q 360 78 376 70" />
            <path d="M376 70 L 368 64 M376 70 L 370 78" />
            <path d="M20 152 Q 38 150 50 152" />
            <path d="M20 152 L 28 146 M20 152 L 28 158" />
            <path d="M340 355 Q 360 354 376 348" />
            <path d="M376 348 L 368 342 M376 348 L 370 356" />
            <path d="M60 467 Q 180 478 300 467" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 28, left: -28 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 110, right: -28 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 200, left: -28 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 332, right: -28 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 408, left: -28 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        the rack, opened up <span className="v">·</span> five boards, top to bottom
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 36, right: -8, width: 138, transform: 'rotate(-4deg)' }}
      >
        <span className="h">① compute</span>
        Victory Giant <b>~90%</b>
        <br />· GB200 / GB300
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 180, right: -22, width: 148, transform: 'rotate(2.4deg)' }}
      >
        <span className="h">② switch</span>
        32-layer
        <br />M9 consensus
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 252, left: -22, width: 138, transform: 'rotate(-3deg)' }}
      >
        <span className="h">③ mid plane</span>
        replaces <b>5,000+</b>
        <br />copper cables
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 348, right: -16, width: 146, transform: 'rotate(3deg)' }}
      >
        <span className="h">④ backplane</span>
        copper-sintered
        <br />
        <b>78–104</b> layers
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 430, left: -28, width: 154, transform: 'rotate(-3.4deg)' }}
      >
        <span className="h">⑤ SLP · 2027</span>
        <b>10 µm</b> = new
        <br />clean-room plants
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 130,
          left: 10,
          fontSize: '1.05rem',
          transform: 'rotate(-7deg)',
        }}
      >
        ↘ GB200 row
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 470,
          right: 105,
          fontSize: '1rem',
          transform: 'rotate(-3deg)',
        }}
      >
        2027 decider
      </div>
    </div>
  );
}
