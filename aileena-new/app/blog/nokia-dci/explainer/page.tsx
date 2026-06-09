'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function NokiaDciExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · may"
      title={
        <>
          Why bet on{' '}
          <em>
            Nokia.
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
      dek="The market for the optical gear that links data centers is sold out. In a supply crunch, capacity is the moat — and after buying Infinera, Nokia is the one vendor with idle lines to sell."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            DCI lead times went from <b>1–1.5</b> years to <b>2–2.5</b>. Ciena&rsquo;s{' '}
            <b>$3.5B/yr</b> is sold out through 2027. Nokia inherited{' '}
            <b>~$2.5B</b> of idle US capacity — and won <b>50–60%</b> of Google&rsquo;s tender.
          </p>
        </>
      }
      denseHref="/blog/nokia-dci"
      prevHref="/blog/let-there-be-light"
      prevLabel="optical isolators"
      nextHref="/blog/nvidia-flywheel"
      nextLabel="nvidia, the flywheel"
      footerMeta="markets · 2026.05.30"
    >
      <p>
        You can&rsquo;t buy enough <span className="v">DCI</span> gear right now. The AI build-out
        has turned the long-haul optical equipment that stitches data centers together into one of
        the hardest-to-get items in the whole infrastructure stack.
      </p>

      <div className="explainer-row">
        <p>
          Lead times that used to run <b>1 to 1.5 years</b> have stretched to{' '}
          <b>2 to 2.5</b>. Ciena, the long-time leader, runs about{' '}
          <b>$3.5 billion a year</b> of capacity — and 2027 is already booked.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">DCI in plain words</span>
            data-center interconnect — the boxes that carry traffic between buildings on light.
          </div>
        </div>
      </div>

      <p>
        Google, Microsoft and Meta have all raised budgets and tendered early to lock supply. When
        demand runs that far ahead of supply, the question stops being whose roadmap is prettier —
        it becomes <b>who can actually deliver.</b>
      </p>

      <div className="explainer-flow-arrow">↓ edge by edge ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>edge 1 — idle capacity nobody else has
      </h2>

      <NokiaDciDiagram />

      <div className="explainer-row">
        <p>
          When Nokia bought <b>Infinera</b>, it inherited Infinera&rsquo;s North American lines —
          centered in San Jose — sitting largely unused. Roughly <b>$2.5 billion a year</b> of
          capacity dark, up to <b>$4 billion</b> with overtime.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">in plain words</span>
            everyone else is booked. nokia has empty factories it can <b>turn on.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          That&rsquo;s the reason Google handed Nokia the biggest slice of its DCI tender — on the
          order of <b>50–60%</b>. Not because the product won a feature shootout, but because the
          boxes would actually arrive.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">google tender</span>
            <b>50–60%</b> to nokia.
            <br />delivery, not specs.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>edge 2 — it owns its own supply chain
      </h2>

      <div className="explainer-row">
        <p>
          Nokia designs its own <b>DSP</b> — the chip that encodes data onto the light — now at{' '}
          <b>1.2 terabits</b> per wavelength on a <b>5-nanometer</b> process. Most rivals buy this
          chip from Broadcom or Marvell.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">DSP in plain words</span>
            the brain of an optical link. nokia makes its own; others queue for it.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Nokia also runs its own <b>indium-phosphide</b> (InP) wafer fab — the semiconductor lasers
          are built from — plus packaging and test. The single scarcest part in DCI today is the DSP;
          a vendor that makes its own is not exposed to the shortage.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">InP in plain words</span>
            the material the lasers are made of. nokia&rsquo;s own fab, no waiting in line.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Building in North America runs <b>70–150% more expensive</b> than Asia. In this window,
          Nokia trades margin for speed — and is expanding InP capacity <b>tenfold</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">the trade</span>
            spend more, ship now,
            <br />take share. optimize later.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>edge 3 — no tech gap, share map flipped
      </h2>

      <div className="explainer-row">
        <p>
          There is <b>no meaningful technology gap</b> between Nokia and Ciena. The standards that
          matter — <b>400G and 800G</b> per wavelength — are settled, and Nokia has already shown a
          full <b>1.6-terabit</b> DCI solution.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">parity is enough</span>
            in a sold-out market the tiebreaker is <b>delivery,</b> not the spec sheet.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Ciena was <b>~90%</b> of DCI in 2025 — a near-monopoly. In 2026 it is capacity-capped and
          ceding the increment. Nokia jumped from minor player to <b>&gt;55%</b> of Google&rsquo;s
          tender, the year&rsquo;s main growth story.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">Q4 2025</span>
            nokia&rsquo;s ex-China optical revenue passed ciena&rsquo;s for the <b>first time.</b>
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ where the lines sit ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>where the capacity actually sits
      </h2>

      <div className="explainer-row">
        <p>
          <b>San Jose (Infinera core)</b> is the main DCI assembly line — the <b>$2.5B</b> idle, up
          to <b>$4B</b> with overtime. Plus an InP fab and DSP R&amp;D nearby — the
          vertical-integration core, capacity planned to grow <b>10×</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">San Jose</span>
            the engine of the surge. assembly + lasers + chips.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          A Mexico line for companion boards was once slated to close, kept alive by data-center
          demand. And a Chinese partner (德科立) co-developed and supplied early OEM orders.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">the wrinkle</span>
            big NA orders ship from San Jose — trade friction + hyperscaler paperwork.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>the risks
      </h2>

      <div className="explainer-row">
        <p>
          The capacity dividend is <b>finite</b> — once the backlog is consumed, the scarcity
          premium fades. North American cost is high. And absorbing Infinera is a multi-year
          integration job.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">bear case</span>
            golden window, not forever. then ordinary terms.
          </div>
        </div>
      </div>

      <p>
        The case isn&rsquo;t that Nokia built a better box. It&rsquo;s that, in the narrow window
        where DCI demand is exploding and Ciena is sold out, Nokia grabbed the one resource nobody
        else has — and converted it into the majority of the year&rsquo;s biggest orders.
      </p>
    </ExplainerShell>
  );
}

function NokiaDciDiagram() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble-dci" x="-2%" y="-2%" width="104%" height="104%">
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

      <div className="explainer-rack-wrap" style={{ maxWidth: 420 }}>
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 420 360"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-dci)"
        >
          {/* DATA CENTER A (left) */}
          <g>
            <rect
              x={20}
              y={90}
              width={92}
              height={180}
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            {/* roof line */}
            <path
              d="M16 90 L66 64 L116 90"
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            {/* servers stacked */}
            <g fill="#0f2a1a" stroke="#d9a449" strokeWidth={0.5}>
              <rect x={30} y={108} width={72} height={14} />
              <rect x={30} y={128} width={72} height={14} />
              <rect x={30} y={148} width={72} height={14} />
              <rect x={30} y={168} width={72} height={14} />
              <rect x={30} y={188} width={72} height={14} />
              <rect x={30} y={208} width={72} height={14} />
            </g>
            {/* server LEDs */}
            <g fill="#d9a449">
              <circle cx={38} cy={115} r={1.2} />
              <circle cx={38} cy={135} r={1.2} />
              <circle cx={38} cy={155} r={1.2} />
              <circle cx={38} cy={175} r={1.2} />
              <circle cx={38} cy={195} r={1.2} />
              <circle cx={38} cy={215} r={1.2} />
            </g>
            <text
              x={66}
              y={250}
              fontFamily="JetBrains Mono"
              fontSize={8}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.6}
              style={{ textTransform: 'uppercase' }}
            >
              data center A
            </text>
          </g>

          {/* DATA CENTER B (right) */}
          <g>
            <rect
              x={308}
              y={90}
              width={92}
              height={180}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <path
              d="M304 90 L354 64 L404 90"
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <g fill="#0f2a1a" stroke="#d9a449" strokeWidth={0.5}>
              <rect x={318} y={108} width={72} height={14} />
              <rect x={318} y={128} width={72} height={14} />
              <rect x={318} y={148} width={72} height={14} />
              <rect x={318} y={168} width={72} height={14} />
              <rect x={318} y={188} width={72} height={14} />
              <rect x={318} y={208} width={72} height={14} />
            </g>
            <g fill="#d9a449">
              <circle cx={326} cy={115} r={1.2} />
              <circle cx={326} cy={135} r={1.2} />
              <circle cx={326} cy={155} r={1.2} />
              <circle cx={326} cy={175} r={1.2} />
              <circle cx={326} cy={195} r={1.2} />
              <circle cx={326} cy={215} r={1.2} />
            </g>
            <text
              x={354}
              y={250}
              fontFamily="JetBrains Mono"
              fontSize={8}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.6}
              style={{ textTransform: 'uppercase' }}
            >
              data center B
            </text>
          </g>

          {/* DCI BOX — left (between A and fiber) */}
          <g>
            <rect
              x={112}
              y={158}
              width={48}
              height={44}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <text
              x={136}
              y={175}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={0.8}
              style={{ textTransform: 'uppercase' }}
            >
              DCI box
            </text>
            <text
              x={136}
              y={184}
              fontFamily="JetBrains Mono"
              fontSize={5}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.6}
              style={{ textTransform: 'uppercase' }}
            >
              coherent
            </text>
            <text
              x={136}
              y={195}
              fontFamily="JetBrains Mono"
              fontSize={4.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.4}
            >
              DSP · 5 nm
            </text>
          </g>

          {/* DCI BOX — right */}
          <g>
            <rect
              x={260}
              y={158}
              width={48}
              height={44}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            <text
              x={284}
              y={175}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={0.8}
              style={{ textTransform: 'uppercase' }}
            >
              DCI box
            </text>
            <text
              x={284}
              y={184}
              fontFamily="JetBrains Mono"
              fontSize={5}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.6}
              style={{ textTransform: 'uppercase' }}
            >
              coherent
            </text>
            <text
              x={284}
              y={195}
              fontFamily="JetBrains Mono"
              fontSize={4.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.4}
            >
              DSP · 5 nm
            </text>
          </g>

          {/* FIBER — wavy gold line between DCI boxes */}
          <g stroke="#d9a449" strokeWidth={1.6} fill="none" strokeLinecap="round">
            <path d="M160 180 Q 175 168 190 180 T 220 180 T 250 180 T 260 180" />
          </g>
          <g stroke="rgba(217,164,73,0.45)" strokeWidth={0.6} fill="none">
            <path d="M160 184 Q 175 172 190 184 T 220 184 T 250 184 T 260 184" />
          </g>

          {/* distance markers */}
          <text
            x={185}
            y={222}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.78)"
            textAnchor="middle"
            letterSpacing={0.6}
            style={{ textTransform: 'uppercase' }}
          >
            500 m – 2 km
          </text>
          <text
            x={185}
            y={232}
            fontFamily="JetBrains Mono"
            fontSize={5.5}
            fill="rgba(255,255,255,0.55)"
            textAnchor="middle"
            letterSpacing={0.5}
            style={{ textTransform: 'uppercase' }}
          >
            short-haul
          </text>
          <text
            x={235}
            y={222}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.78)"
            textAnchor="middle"
            letterSpacing={0.6}
            style={{ textTransform: 'uppercase' }}
          >
            metro · 80+ km
          </text>
          <text
            x={235}
            y={232}
            fontFamily="JetBrains Mono"
            fontSize={5.5}
            fill="rgba(255,255,255,0.55)"
            textAnchor="middle"
            letterSpacing={0.5}
            style={{ textTransform: 'uppercase' }}
          >
            long-haul
          </text>

          {/* FIBER label */}
          <text
            x={210}
            y={158}
            fontFamily="JetBrains Mono"
            fontSize={7}
            fill="rgba(255,255,255,0.7)"
            textAnchor="middle"
            letterSpacing={2}
            style={{ textTransform: 'uppercase' }}
          >
            fiber
          </text>
        </svg>

        {/* hand-drawn lilac arrows overlay — bi-directional flow */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 420 360"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* east arrow above fiber */}
            <path d="M170 142 Q 210 134 252 142" />
            <path d="M252 142 L 244 137 M252 142 L 246 148" />
            {/* west arrow below fiber */}
            <path d="M250 252 Q 210 260 168 252" />
            <path d="M168 252 L 176 247 M168 252 L 174 258" />
            {/* small arrow into left DCI */}
            <path d="M96 180 Q 102 178 110 180" />
            <path d="M110 180 L 104 176 M110 180 L 104 184" />
            {/* small arrow out of right DCI */}
            <path d="M310 180 Q 318 178 326 180" />
            <path d="M326 180 L 320 176 M326 180 L 320 184" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 70, left: -10 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 150, left: 110 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 196, left: 200 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 150, right: 110 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 70, right: -10 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        two data centers · one fiber <span className="v">·</span> coherent everywhere
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 16, left: -8, width: 150, transform: 'rotate(-4deg)' }}
      >
        <span className="h">① Infinera</span>
        Nokia + Ciena rivalry
        <br />idle US lines <b>~$2.5B</b>
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 26, right: -10, width: 144, transform: 'rotate(3deg)' }}
      >
        <span className="h">⑤ DSP</span>
        <b>5 nm</b> in-house ·
        <br />
        <b>1.2 Tb</b> per port
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 260, left: -14, width: 150, transform: 'rotate(-2.2deg)' }}
      >
        <span className="h">② google tender</span>
        Nokia takes <b>50-60%</b>
        <br />delivery, not specs
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 268, right: -8, width: 146, transform: 'rotate(2.6deg)' }}
      >
        <span className="h">④ InP fab</span>
        capacity grows
        <br />
        <b>10×</b> — own lasers
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 134, left: 156, width: 110, transform: 'rotate(-1.6deg)' }}
      >
        <span className="h">③ NA cost</span>
        <b>70-150%</b> premium
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 198,
          left: 78,
          fontSize: '0.95rem',
          transform: 'rotate(-6deg)',
        }}
      >
        ← coherent magic
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 6,
          left: '40%',
          fontSize: '1.05rem',
          transform: 'rotate(-2deg)',
        }}
      >
        ↘ the inter-DC fight
      </div>
    </div>
  );
}
