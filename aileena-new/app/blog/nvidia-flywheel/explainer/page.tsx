'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function NvidiaFlywheelExplainer() {
  return (
    <ExplainerShell
      metaScript="markets · 2026 · may"
      title={
        <>
          NVIDIA is buying its own{' '}
          <em>
            demand.
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
      dek="An $18B public book that reads like a map of the AI stack, plus $100B+ of private commitments routed back into GPU orders. Here&rsquo;s the flywheel — and where it breaks."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            equity out, revenue back, stake up, repeat. <b>$18.4B</b> public, <b>$40B+</b>{' '}
            private in 2026, plus up to <b>$100B</b> into OpenAI. cleanest vendor-financing
            critique you&rsquo;ll ever see.
          </p>
        </>
      }
      denseHref="/blog/nvidia-flywheel"
      prevHref="/blog/nokia-dci"
      prevLabel="nokia, the dci edge"
      nextHref="/blog/dell-nvidia-flywheel"
      nextLabel="dell, the hands"
      footerMeta="markets · 2026.05.29"
    >
      <p>
        NVIDIA sells the shovels. It also now owns equity in the miners, the toll roads, and the
        company that makes the shovel&rsquo;s steel. The thing it invests in, over and over, is{' '}
        <span className="v">its own demand.</span>
      </p>

      <div className="explainer-row">
        <p>
          NVIDIA writes a check into a company; the company uses it to buy GPUs; the order lands on
          NVIDIA&rsquo;s income statement; the company&rsquo;s valuation rises; NVIDIA&rsquo;s stake
          appreciates. Then it does it again, with more money.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">the loop</span>
            equity out → revenue back → stake up → <b>repeat.</b>
          </div>
        </div>
      </div>

      <p>
        It comes in two books — the <b>public</b> one in a 13F, and the <b>private</b> one in
        strategic commitments. They are very different sizes.
      </p>

      <div className="explainer-flow-arrow">↓ book one ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>book 1 — the public 13F
      </h2>

      <NvidiaFlywheelDiagram />

      <div className="explainer-row">
        <p>
          As of <b>March 31, 2026</b>, NVIDIA&rsquo;s disclosed equity book was worth about{' '}
          <b>$18.4 billion</b>, up from <b>$13.1B</b> a quarter earlier. The holdings aren&rsquo;t
          random tech names — they are the <span className="v">layers of the AI stack.</span>
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">13F in plain words</span>
            the public filing where big funds disclose what stocks they own.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Intel</b> at <b>~51.6%</b> — the foundry + x86 hedge. The position went from <b>$5B</b>{' '}
          in to <b>$25B+</b> out.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">foundry</span>
            the factory that makes chips. owning intel = a manufacturing hedge.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>CoreWeave</b> sits at #2, around <b>$3.66B</b>. Share count grew <b>95%</b> to{' '}
          <b>47.2M</b>; the position appreciated <b>+110%</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">neocloud</span>
            a new-style GPU cloud that rents compute. coreweave is the biggest.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Synopsys ~10.4%</b> (EDA — the software you design every chip with).{' '}
          <b>Coherent #4 ~$1.86B</b> (optics/photonics, 7.79M shares, new position).{' '}
          <b>Nokia ~7.3%</b> (optical transport + networking).
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">EDA</span>
            electronic design automation — chip-design software. synopsys is one of two.
          </div>
        </div>
      </div>

      <p>
        Read that list as a thesis, not a portfolio. <b>Compute</b> (CoreWeave),{' '}
        <b>manufacturing</b> (Intel), <b>design tools</b> (Synopsys), <b>optics</b> (Coherent), and{' '}
        <b>networking</b> (Nokia). NVIDIA is buying a toll booth on every road its chips travel.
      </p>

      <div className="explainer-flow-arrow">↓ book two — the bigger one ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>book 2 — the private commitments
      </h2>

      <div className="explainer-row">
        <p>
          The 13F is the tip. The body is the strategic book — over <b>$40 billion</b> committed in
          2026 alone, on top of ~<b>$17.5B</b> into private companies and infra funds the prior
          fiscal year.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">scale</span>
            public <b>$18.4B.</b> private <b>$40B+</b> this year. very different sizes.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          The anchor: <b>OpenAI — up to $100B, ~10GW of systems.</b> OpenAI&rsquo;s own CFO said
          the quiet part out loud: <em>&ldquo;most of the money will go back to Nvidia.&rdquo;</em>
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">staged</span>
            conditional, slow to deploy — but the intent is unambiguous.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Nebius — $2B</b> in pre-funded warrants, earmarked to deploy <b>5+ gigawatts</b> by
          2030. <b>CoreWeave — ~$6.3B backstop</b> to buy unsold compute, plus ~<b>$860M</b>{' '}
          data-center lease guarantee. <b>Lambda — ~$1.5B,</b> plus seats in <b>xAI</b> and{' '}
          <b>Anthropic</b> mega-rounds.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">backstop</span>
            NVIDIA promises to buy compute the neocloud can&rsquo;t sell. floor under demand.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>why it&rsquo;s rational
      </h2>

      <div className="explainer-row">
        <p>
          <b>It turns a chip sale into a compounder.</b> Sell a GPU once, book the margin once. Own
          equity in the buyer and you also capture the value the GPU <em>creates</em>. Intel:{' '}
          <b>$5B → $25B+</b>. CoreWeave: more than doubled.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">compounder</span>
            same dollar, two payoffs — margin on the sale + appreciation on the stake.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>It allocates scarce supply to real builders.</b> When GPUs are rationed, an equity check
          steers chips toward customers who will deploy at scale — and locks in CUDA + NVLink as the
          default.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">CUDA / NVLink</span>
            NVIDIA&rsquo;s software + interconnect. the moat that keeps customers stuck.
          </div>
        </div>
      </div>

      <p>
        It also <b>hedges the whole stack</b> — foundry, EDA, optics, transport — and{' '}
        <b>seeds its own ecosystem</b>, so every funded neocloud is a distribution channel that
        isn&rsquo;t a hyperscaler trying to build its own chips.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>the risk — round-tripping
      </h2>

      <div className="explainer-row">
        <p>
          The same dollar can travel in a circle — NVIDIA → OpenAI → NVIDIA — and on each lap{' '}
          <em>everyone&rsquo;s</em> numbers go up, even though no new outside money entered the
          loop. That&rsquo;s <b>vendor financing</b>, and at <b>$100B</b> scale it&rsquo;s
          unprecedented.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">vendor financing</span>
            you lend the buyer the money they use to buy from you. lucent &amp; nortel did this.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          The equity book and the core business are the <b>same bet</b> — in an AI-capex downturn,
          revenue <em>and</em> the portfolio fall together. The reflexive loop deflates on the way
          down, faster.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">reflexivity</span>
            prices that go up because prices went up. works both ways.
          </div>
        </div>
      </div>

      <p>
        Critics put it bluntly: the math only works if the returns arrive before the money runs out.
        A large slice of the market is now a leveraged bet that AI scaling continues —{' '}
        <span className="v">with NVIDIA&rsquo;s balance sheet as the axle.</span>
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>the bottom line
      </h2>
      <p>
        NVIDIA became the <b>central bank of the AI economy</b> — it prints capacity, lends it to
        its colonies, and takes equity in return. The flywheel is the bull case and the bear case
        wearing the same coat. The only real question is how long the music plays.
      </p>
    </ExplainerShell>
  );
}

function NvidiaFlywheelDiagram() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble-nflywheel" x="-2%" y="-2%" width="104%" height="104%">
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

      <div className="explainer-rack-wrap" style={{ maxWidth: 400 }}>
        <svg
          className="explainer-rack-svg"
          viewBox="0 0 400 480"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-nflywheel)"
        >
          {/* TOP — NVIDIA */}
          <g>
            <rect
              x={140}
              y={30}
              width={120}
              height={62}
              fill="#274c2e"
              stroke="#7c5cc4"
              strokeWidth={1.8}
            />
            <rect
              x={140}
              y={30}
              width={120}
              height={62}
              fill="none"
              stroke="rgba(124,92,196,0.35)"
              strokeWidth={3}
              transform="translate(2,2)"
            />
            <text
              x={200}
              y={56}
              fontFamily="JetBrains Mono"
              fontSize={11}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2.5}
              style={{ textTransform: 'uppercase' }}
            >
              NVIDIA
            </text>
            <text
              x={200}
              y={72}
              fontFamily="JetBrains Mono"
              fontSize={6.5}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={1.2}
              style={{ textTransform: 'uppercase' }}
            >
              the axle
            </text>
            <text
              x={200}
              y={84}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={1}
            >
              equity + chips
            </text>
          </g>

          {/* RIGHT — HYPERSCALERS */}
          <g>
            <rect
              x={258}
              y={196}
              width={130}
              height={68}
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={323}
              y={220}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.6}
              style={{ textTransform: 'uppercase' }}
            >
              hyperscalers
            </text>
            <text
              x={323}
              y={234}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.8}
            >
              OpenAI · MSFT
            </text>
            <text
              x={323}
              y={246}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.8}
            >
              Anthropic · xAI
            </text>
            <text
              x={323}
              y={258}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              neoclouds
            </text>
          </g>

          {/* BOTTOM — CAPEX */}
          <g>
            <rect
              x={140}
              y={376}
              width={120}
              height={62}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={200}
              y={400}
              fontFamily="JetBrains Mono"
              fontSize={9.5}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.6}
              style={{ textTransform: 'uppercase' }}
            >
              capex spend
            </text>
            <text
              x={200}
              y={415}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.8}
            >
              datacenters · power
            </text>
            <text
              x={200}
              y={428}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              7 month build
            </text>
          </g>

          {/* LEFT — GPU ORDERS */}
          <g>
            <rect
              x={12}
              y={196}
              width={130}
              height={68}
              fill="#1c3a26"
              stroke="#1a1612"
              strokeWidth={1.4}
            />
            <text
              x={77}
              y={220}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={1.6}
              style={{ textTransform: 'uppercase' }}
            >
              GPU orders
            </text>
            <text
              x={77}
              y={236}
              fontFamily="JetBrains Mono"
              fontSize={7}
              fill="#d9a449"
              textAnchor="middle"
              letterSpacing={1}
            >
              100k chips
            </text>
            <text
              x={77}
              y={250}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="rgba(255,255,255,0.65)"
              textAnchor="middle"
              letterSpacing={0.7}
            >
              back to Jensen
            </text>
          </g>

          {/* gold curved arrows clockwise — NVIDIA → HYPERS → CAPEX → GPU → NVIDIA */}
          <g
            stroke="#d9a449"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* NVIDIA → HYPERSCALERS */}
            <path d="M258 86 Q 310 130 318 192" />
            <path d="M318 192 L 312 184 M318 192 L 324 184" />
            {/* HYPERSCALERS → CAPEX */}
            <path d="M320 266 Q 308 332 258 374" />
            <path d="M258 374 L 268 372 M258 374 L 262 364" />
            {/* CAPEX → GPU ORDERS */}
            <path d="M142 392 Q 90 348 78 268" />
            <path d="M78 268 L 84 276 M78 268 L 72 276" />
            {/* GPU ORDERS → NVIDIA */}
            <path d="M82 192 Q 96 130 140 86" />
            <path d="M140 86 L 130 88 M140 86 L 136 96" />
          </g>

          {/* arrow labels */}
          <text
            x={306}
            y={140}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.6}
          >
            $30B OpenAI
          </text>
          <text
            x={310}
            y={150}
            fontFamily="JetBrains Mono"
            fontSize={6}
            fill="rgba(255,255,255,0.6)"
            textAnchor="middle"
            letterSpacing={0.5}
          >
            $5B→$25B+ Intel
          </text>
          <text
            x={310}
            y={332}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.6}
          >
            $19.4B Nebius
          </text>
          <text
            x={90}
            y={332}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.6}
          >
            ~100k chips
          </text>
          <text
            x={90}
            y={140}
            fontFamily="JetBrains Mono"
            fontSize={6.5}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            letterSpacing={0.6}
          >
            revenue back
          </text>

          {/* CENTER — the loop */}
          <g>
            <circle
              cx={200}
              cy={230}
              r={32}
              fill="rgba(124,92,196,0.08)"
              stroke="#7c5cc4"
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <text
              x={200}
              y={226}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#7c5cc4"
              textAnchor="middle"
              letterSpacing={1.2}
              style={{ textTransform: 'uppercase' }}
            >
              the loop
            </text>
            <text
              x={200}
              y={240}
              fontFamily="JetBrains Mono"
              fontSize={11}
              fill="#7c5cc4"
              textAnchor="middle"
              letterSpacing={1.2}
            >
              $ $ $
            </text>
            <text
              x={200}
              y={252}
              fontFamily="JetBrains Mono"
              fontSize={6}
              fill="rgba(124,92,196,0.7)"
              textAnchor="middle"
              letterSpacing={0.5}
            >
              equity → revenue
            </text>
          </g>
        </svg>

        {/* hand-drawn lilac arrows overlay — outer flywheel arc */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 400 480"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* outer clockwise arc top-right */}
            <path d="M280 8 Q 360 30 384 110" />
            <path d="M384 110 L 378 102 M384 110 L 388 100" />
            {/* outer arc bottom-left to suggest rotation */}
            <path d="M16 350 Q 30 420 120 462" />
            <path d="M120 462 L 112 458 M120 462 L 114 454" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 30, left: 116 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 200, right: 240 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 200, left: 240 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 376, left: 116 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 220, left: 184 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        the loop that keeps spinning <span className="v">until it doesn&rsquo;t</span>
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 4, left: -10, width: 150, transform: 'rotate(-4deg)' }}
      >
        <span className="h">① NVIDIA</span>
        public 13F · <b>$18.4B</b>
        <br />Q1 2026 book
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 196, right: -14, width: 144, transform: 'rotate(3deg)' }}
      >
        <span className="h">② hyperscalers</span>
        OpenAI up to <b>$100B</b>
        <br />~10 GW systems
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 376, left: -8, width: 154, transform: 'rotate(-3deg)' }}
      >
        <span className="h">④ capex</span>
        <b>$19.4B</b> Nebius pact
        <br />~100k GB300 chips
      </div>
      <div
        className="explainer-sticky green"
        style={{ top: 196, left: -10, width: 138, transform: 'rotate(-2.4deg)' }}
      >
        <span className="h">③ gpu orders</span>
        CoreWeave
        <br />stake <b>+110%</b>
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 396, right: -10, width: 150, transform: 'rotate(2deg)' }}
      >
        <span className="h">⑤ private book</span>
        <b>$40B+</b> committed
        <br />in 2026 alone
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 12,
          right: 30,
          fontSize: '1.05rem',
          transform: 'rotate(8deg)',
        }}
      >
        ↻ spins faster
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 452,
          left: 110,
          fontSize: '0.95rem',
          transform: 'rotate(-3deg)',
        }}
      >
        where does the money REALLY come from?
      </div>
    </div>
  );
}
