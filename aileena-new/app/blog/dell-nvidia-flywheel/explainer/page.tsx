'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function DellNvidiaFlywheelExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · may"
      title={
        <>
          Why bet on{' '}
          <em>
            Dell.
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
      dek="NVIDIA finances the demand. Someone has to bolt 72 GPUs into a liquid-cooled rack and ship it first. That someone is Dell — and the moat is thinner than Nokia&rsquo;s."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            FY26: <b>$64.1B</b> orders, <b>$25.2B</b> shipped, <b>$43B</b> backlog. FY27 guide:{' '}
            <b>~$50B</b>. first to ship GB200, then GB300. but margins are <b>~5–6%.</b>
          </p>
        </>
      }
      denseHref="/blog/dell-nvidia-flywheel"
      prevHref="/blog/nvidia-flywheel"
      prevLabel="nvidia, the flywheel"
      nextHref="/blog/nokia-dci"
      nextLabel="nokia, the dci edge"
      footerMeta="markets · 2026.05.29"
    >
      <p>
        NVIDIA stopped being only a chipmaker. It put roughly <b>$17.5 billion</b> into private
        companies and infrastructure funds last fiscal year, and in 2026 went vertical — past{' '}
        <b>$40 billion</b> of equity commitments.
      </p>

      <div className="explainer-row">
        <p>
          A <b>$30B</b> bet on OpenAI. A <b>$5B</b> stake in Intel now worth over <b>$25B</b>. Two
          billion each into <b>CoreWeave</b> and <b>Nebius</b>, a <b>$1.5B</b> deal with{' '}
          <b>Lambda</b>, plus seats in the <b>xAI</b> and Anthropic mega-rounds.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">flywheel</span>
            NVIDIA writes a check → neocloud orders GPUs → revenue lands back on NVIDIA.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          But silicon and equity don&rsquo;t deploy themselves. A GB300 chip is not a data center.
          Somebody has to take <b>72</b> Blackwell-Ultra GPUs, <b>36</b> Grace CPUs and <b>36</b>{' '}
          BlueField DPUs, integrate them into a liquid-cooled rack, and ship — <b>first,</b> at
          volume.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">in plain words</span>
            chips are not racks. <b>somebody bolts them in.</b>
          </div>
        </div>
      </div>

      <p>That somebody, on every generation so far, has been <span className="v">Dell.</span></p>

      <div className="explainer-flow-arrow">↓ edge by edge ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>edge 1 — the deployment arm of the flywheel
      </h2>

      <DellFlywheelDiagram />

      <div className="explainer-row">
        <p>
          NVIDIA&rsquo;s investments create <em>orders</em>, not finished compute. When Microsoft
          layers <b>$33 billion</b> of neocloud deals on top — a <b>$19.4B</b> Nebius pact alone
          securing ~<b>100,000</b> GB300 chips — all that capital converges on rack-scale
          integration.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">rack-scale integration</span>
            assembling racks where GPUs, CPUs &amp; networking work as one system.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Dell was <b>first to ship the GB200 NVL72</b>, then — just <b>seven months</b> later —{' '}
          <b>first to deliver the GB300 NVL72</b>, to CoreWeave (alongside Switch and Vertiv).
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">the proof</span>
            NVIDIA invested in coreweave. dell put the chips on coreweave&rsquo;s floor first.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>edge 2 — first-to-ship is a real skill
      </h2>

      <div className="explainer-row">
        <p>
          A GB300 NVL72 is a <b>liquid-cooled</b> rack unifying <b>72</b> GPUs into one system. The
          power, thermals and serviceability are genuinely hard, and getting them right at volume
          on a brand-new architecture is the differentiator.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">liquid cooling</span>
            water through the rack, not air. needed because the chips run too hot to fan-cool.
          </div>
        </div>
      </div>

      <p>
        Dell&rsquo;s repeated speed-to-market (GB200, then GB300) is what makes hyperscalers route
        the first, largest tranches of new-generation demand through it. <b>Ship the newest rack
        soonest, win the increment.</b>
      </p>

      <div className="explainer-flow-arrow">↓ the order book ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>edge 3 — the backlog is real
      </h2>

      <div className="explainer-row">
        <p>
          For fiscal 2026 Dell booked <b>$64.1 billion</b> in AI orders, shipped <b>$25.2 billion</b>{' '}
          of AI servers (up ~<b>150%</b> year over year), and closed with a record <b>$43 billion</b>{' '}
          AI backlog.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">FY26</span>
            orders <b>$64.1B</b>
            <br />shipped <b>$25.2B</b>
            <br />backlog <b>$43B</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Management then guided to roughly <b>$50 billion</b> of AI revenue for fiscal 2027. Q4 ISG
          revenue hit <b>$19.6B</b> (+<b>73%</b> YoY); Q4 AI-optimized servers <b>$9.0B</b>{' '}
          (+<b>342%</b> YoY).
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">Q4 detail</span>
            ISG <b>$19.6B</b> (+73%)
            <br />AI servers <b>$9.0B</b> (+342%)
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Demand is broadening past the neoclouds: Dell&rsquo;s pipeline now spans <b>sovereigns
          and enterprises</b>. That matters for backlog durability when the pure-financing trades
          cool.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">sovereigns</span>
            country-level AI buyers (UAE, Saudi, etc) — not levered to the flywheel.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>edge 4 — the balance sheet to float it
      </h2>

      <div className="explainer-row">
        <p>
          Multibillion-dollar rack builds eat enormous working capital — you buy the GPUs, assemble
          the systems, and carry them before the customer pays. Few vendors can finance that at this
          scale.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">working capital</span>
            cash tied up between buying parts and getting paid. dell has muscle here.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ now the catch ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>the risks — moat thinner than nokia&rsquo;s
      </h2>

      <div className="explainer-row">
        <p>
          With Nokia, the edge was scarce <b>capacity</b> nobody else had. Dell&rsquo;s edge is{' '}
          <b>execution</b> — and execution is more contestable.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">the contrast</span>
            capacity moat = hard to copy. execution moat = catchable.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          AI servers run at <b>mid-single-digit operating margins (~5–6%)</b> — Dell prices
          aggressively to win contracts. The revenue beats are already priced in; the margin is the
          risk.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">razor-thin</span>
            high-volume passthrough. <b>not a franchise.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          Part of demand is NVIDIA financing its own customers — if capex cools, a backlog built on
          that flywheel can soften fast. Plus heavy concentration (CoreWeave, xAI-class buyers) and
          commodity competition from Supermicro, HPE and ODMs.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">ODM</span>
            original design manufacturer — the asia-based builders who make the same boxes.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>the bottom line
      </h2>
      <p>
        Dell isn&rsquo;t the brain of this boom (NVIDIA&rsquo;s silicon) and isn&rsquo;t the capital
        (NVIDIA&rsquo;s <b>$40B+</b> flywheel). Dell is the <b>hands</b> — the integrator that turns
        chips-plus-equity into liquid-cooled racks on the floor, first and at scale, with a{' '}
        <b>$43B</b> backlog to prove the orders are real. Bet on Dell if you can live with{' '}
        <span className="v">5 cents on the dollar</span> while NVIDIA keeps the rest.
      </p>
    </ExplainerShell>
  );
}

function DellFlywheelDiagram() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble-dflywheel" x="-2%" y="-2%" width="104%" height="104%">
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

      <div className="explainer-rack-wrap" style={{ maxWidth: 420 }}>
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 420 500"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-dflywheel)"
        >
          {/* TOP — NVIDIA */}
          <g>
            <rect
              x={155}
              y={26}
              width={110}
              height={56}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={210}
              y={50}
              fontFamily="JetBrains Mono"
              fontSize={10.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.2}
              style={{ textTransform: 'uppercase' }}
            >
              NVIDIA
            </text>
            <text
              x={210}
              y={64}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              letterSpacing={0.8}
              style={{ textTransform: 'uppercase' }}
            >
              silicon · capital
            </text>
            <text
              x={210}
              y={75}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.6}
            >
              ~73% gross
            </text>
          </g>

          {/* TOP-RIGHT — DELL */}
          <g>
            <rect
              x={306}
              y={130}
              width={104}
              height={62}
              fill="#1f3a2a"
              stroke="#7c5cc4"
              strokeWidth={1.8}
            />
            <rect
              x={306}
              y={130}
              width={104}
              height={62}
              fill="none"
              stroke="rgba(124,92,196,0.35)"
              strokeWidth={3}
              transform="translate(2,2)"
            />
            <text
              x={358}
              y={156}
              fontFamily="JetBrains Mono"
              fontSize={11}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.4}
              style={{ textTransform: 'uppercase' }}
            >
              DELL
            </text>
            <text
              x={358}
              y={170}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.8}
              style={{ textTransform: 'uppercase' }}
            >
              integrator
            </text>
            <text
              x={358}
              y={182}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.5}
            >
              72/36/36 NVL72
            </text>
          </g>

          {/* BOTTOM-RIGHT — CSP / NEOCLOUD */}
          <g>
            <rect
              x={296}
              y={314}
              width={114}
              height={66}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={353}
              y={336}
              fontFamily="JetBrains Mono"
              fontSize={8.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              CSP · neocloud
            </text>
            <text
              x={353}
              y={350}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              CoreWeave · Nebius
            </text>
            <text
              x={353}
              y={364}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              Switch · Vertiv
            </text>
          </g>

          {/* BOTTOM-LEFT — END USERS */}
          <g>
            <rect
              x={10}
              y={314}
              width={114}
              height={66}
              fill="#1c3a26"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={67}
              y={336}
              fontFamily="JetBrains Mono"
              fontSize={8.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.5}
              style={{ textTransform: 'uppercase' }}
            >
              end users
            </text>
            <text
              x={67}
              y={350}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              OpenAI · startups
            </text>
            <text
              x={67}
              y={364}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              sovereigns
            </text>
          </g>

          {/* TOP-LEFT — CASH BACK */}
          <g>
            <rect
              x={10}
              y={130}
              width={104}
              height={62}
              fill="#3a2a16"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={62}
              y={154}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.6}
              style={{ textTransform: 'uppercase' }}
            >
              cash back
            </text>
            <text
              x={62}
              y={168}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              margin · equity
            </text>
            <text
              x={62}
              y={180}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.5}
            >
              captured upstream
            </text>
          </g>

          {/* gold curved arrows clockwise */}
          <g
            stroke="#d9a449"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* NVIDIA → DELL */}
            <path d="M265 70 Q 320 90 322 128" />
            <path d="M322 128 L 316 122 M322 128 L 328 122" />
            {/* DELL → CSP */}
            <path d="M358 194 Q 358 250 353 312" />
            <path d="M353 312 L 348 306 M353 312 L 358 306" />
            {/* CSP → END USERS */}
            <path d="M296 350 Q 210 370 124 350" />
            <path d="M124 350 L 132 346 M124 350 L 132 354" />
            {/* END USERS → CASH BACK */}
            <path d="M62 314 Q 62 252 62 194" />
            <path d="M62 194 L 56 200 M62 194 L 68 200" />
            {/* CASH BACK → NVIDIA */}
            <path d="M114 138 Q 158 90 155 70" />
            <path d="M155 70 L 156 80 M155 70 L 162 78" />
          </g>

          {/* arrow labels */}
          <text
            x={306}
            y={104}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.5}
          >
            GPUs in
          </text>
          <text
            x={386}
            y={258}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.5}
          >
            rack-int.
          </text>
          <text
            x={386}
            y={268}
            fontFamily="JetBrains Mono"
            fontSize={5.5}
            fill="rgba(255,255,255,0.55)"
            textAnchor="middle"
          >
            GB200/GB300
          </text>
          <text
            x={210}
            y={392}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.5}
          >
            compute leased
          </text>
          <text
            x={36}
            y={258}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.5}
          >
            $ ecosystem
          </text>
          <text
            x={118}
            y={104}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.5}
          >
            upstream $
          </text>

          {/* CENTER — DELL margin callout */}
          <g>
            <rect
              x={158}
              y={228}
              width={104}
              height={48}
              rx={4}
              fill="rgba(124,92,196,0.08)"
              stroke="#7c5cc4"
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <text
              x={210}
              y={246}
              fontFamily="JetBrains Mono"
              fontSize={7.5}
              fill="#7c5cc4"
              textAnchor="middle"
              letterSpacing={1.2}
              style={{ textTransform: 'uppercase' }}
            >
              DELL margin
            </text>
            <text
              x={210}
              y={262}
              fontFamily="JetBrains Mono"
              fontSize={11.5}
              fill="#7c5cc4"
              textAnchor="middle"
              letterSpacing={1}
            >
              5 – 6%
            </text>
            <text
              x={210}
              y={272}
              fontFamily="JetBrains Mono"
              fontSize={5}
              fill="rgba(124,92,196,0.7)"
              textAnchor="middle"
            >
              thin but huge
            </text>
          </g>
        </svg>

        {/* hand-drawn lilac outer arc — cycle */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 420 500"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* outer arc top */}
            <path d="M50 14 Q 210 -2 384 24" />
            <path d="M384 24 L 376 20 M384 24 L 378 30" />
            {/* outer arc bottom-left */}
            <path d="M14 440 Q 8 470 60 488" />
            <path d="M60 488 L 52 484 M60 488 L 54 480" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 26, left: 130 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 130, right: 0 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 314, right: 6 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 314, left: 6 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 130, left: 6 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        Dell takes a thin slice <span className="v">of an enormous pie</span>
      </p>

      <div
        className="explainer-sticky lilac"
        style={{ top: 4, left: -12, width: 156, transform: 'rotate(-3.5deg)' }}
      >
        <span className="h">① NVIDIA</span>
        Dell&rsquo;s Q4 ISG <b>$19.6B</b>
        <br />gross <b>~73%</b>
      </div>
      <div
        className="explainer-sticky yellow"
        style={{ top: 120, right: -16, width: 158, transform: 'rotate(3deg)' }}
      >
        <span className="h">② Dell · FY26</span>
        backlog <b>$25.2B</b> shipped
        <br />orders <b>$64.1B</b>
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 306, right: -10, width: 158, transform: 'rotate(2.6deg)' }}
      >
        <span className="h">③ CSPs</span>
        <b>$43B</b> AI backlog ·
        <br />~150% YoY
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 392, left: -10, width: 156, transform: 'rotate(-2.6deg)' }}
      >
        <span className="h">④ end users</span>
        ~10 GW NVIDIA →
        <br />
        <b>$50B+</b> systems
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 134, left: -12, width: 150, transform: 'rotate(-3deg)' }}
      >
        <span className="h">⑤ cash back</span>
        operating margin
        <br />
        <b>5 – 6%</b>
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 248,
          left: -4,
          fontSize: '0.95rem',
          transform: 'rotate(-6deg)',
        }}
      >
        ← integration =
        <br />thin but huge
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 458,
          right: 30,
          fontSize: '0.95rem',
          transform: 'rotate(2deg)',
        }}
      >
        neocloud = new TSMC →
      </div>
    </div>
  );
}
