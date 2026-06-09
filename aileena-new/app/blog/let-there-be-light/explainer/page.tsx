'use client';
import ExplainerShell from '../../_substack/ExplainerShell';

export default function LetThereBeLightExplainer() {
  return (
    <ExplainerShell
      metaScript="investing · 2026 · may"
      title={
        <>
          The optical module is the{' '}
          <em>
            nerve of AI.
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
      dek="Turns electricity into light, sends it down a fiber, turns it back. The whole AI build-out is gated by who can make the light."
      tldr={
        <>
          <span className="explainer-tldr-h">— tldr —</span>
          <p>
            GPUs are islands without the optical module. <b>Six</b> tech routes
            race to make the light. The bottleneck is the optical chip — booked
            to <b>2028</b>, gap over <b>30%</b>.
          </p>
        </>
      }
      denseHref="/blog/let-there-be-light"
      prevHref="/blog/ai-hardware-scarcity"
      prevLabel="scarcity map"
      nextHref="/blog/ai-cooling"
      nextLabel="cooling the build-out"
      footerMeta="investing · 2026.05.31"
    >
      <p>
        A GPU on its own is an island. To make thousands of them act as one
        machine, every chip has to talk &mdash; faster than copper wire allows.
        So the signal leaves the electrical world and travels as light.
      </p>

      <h2 className="explainer-section-h">
        <span className="arr">↓</span>how the light gets made
      </h2>

      <LightDiagram />

      <div className="explainer-row">
        <p>
          <b>Transmit.</b> An <b>EML</b> chip modulates electricity into a beam
          of light carrying the same information.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">in plain words</span>
            EML = electro-absorption modulated laser. <b>makes the light.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Travel.</b> The light runs down an optical fiber &mdash; fast, far,
          very little loss.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">analogy</span>
            a lighthouse blinking morse,
            <br />
            but <b>unimaginably faster.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Receive.</b> A <b>PD</b> (photodetector) chip at the far end turns
          the light back into electricity.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">in plain words</span>
            PD = photodetector. <b>reads the light.</b>
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ six routes, racing ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">→</span>the routes
      </h2>

      <div className="explainer-row">
        <p>
          <b>EML.</b> Mature, reliable, mainstream beyond <b>2 km</b>. The chip
          supply is the bottleneck.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">route 1</span>
            today&rsquo;s default.
            <br />
            chip is short.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Silicon photonics.</b> Optics built in silicon &mdash; dense,
          cheap, low-power; needs an external CW laser. <b>2025</b> was called
          the &ldquo;year of silicon photonics.&rdquo;
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">route 2</span>
            mainstream at
            <br />
            <b>500 m / 2 km.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>LPO.</b> Linear-drive pluggable. Drop the DSP, drive the laser
          directly &mdash; cuts power roughly <b>50%</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">route 3</span>
            silicon photonics + LPO =
            <br />
            short-reach standard.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>CPO.</b> Co-packaged optics. Put the optical engine right next to
          the switch chip &mdash; the signal travels mm, not cm.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">route 4</span>
            the <b>endgame.</b>
            <br />
            volume not before <b>~2027.</b>
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Micro LED.</b> Use Micro LEDs as the emitter, wide-and-slow across
          many channels. Cost could fall below <b>&yen;50</b> a module.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">route 5</span>
            cheap, emerging,
            <br />
            feasible.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>OCS.</b> Optical circuit switch &mdash; tiny MEMS mirrors switch
          data in the light domain, skipping the electrical conversion. Core to
          Google&rsquo;s TPU clusters.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">route 6</span>
            not a module &mdash;
            <br />
            reshapes how many you need.
          </div>
        </div>
      </div>

      <div className="explainer-flow-arrow">↓ where the light gets stuck ↓</div>

      <h2 className="explainer-section-h">
        <span className="arr">⚡</span>the bottlenecks
      </h2>

      <div className="explainer-row">
        <p>
          <b>Optical chips (EML / CW / pump).</b> Dominated by Lumentum &amp;
          Coherent. Orders booked into <b>2028</b>. Supply gap over <b>30%</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">choke 1</span>
            the <b>core</b> bottleneck.
            <br />
            two foreign giants.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>The optical engine.</b> The assembled light-making heart. T&amp;S
          Communications (天孚) supplies it into module makers like Fabrinet
          and Innolight (旭创).
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">choke 2</span>
            the <b>value core.</b>
            <br />
            T&amp;S is the supplier.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>FAU (fiber array unit).</b> Aligns fiber to optical chip. Precision
          is so high it&rsquo;s still <b>built by hand</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk pink">
            <span className="h">choke 3</span>
            a quiet,
            <br />
            <b>severe</b> choke point.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Faraday rotators / isolators.</b> Stop stray light reflecting back
          into the laser. Effectively a Coherent monopoly.
        </p>
        <div className="pin">
          <div className="explainer-stk blue">
            <span className="h">choke 4</span>
            kept tight on
            <br />
            <b>purpose.</b>
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">⌖</span>where it goes to work
      </h2>

      <div className="explainer-row">
        <p>
          <b>Inside the data center.</b> GPU to switch &mdash; iterating fast
          from <b>800G toward 1.6T</b>.
        </p>
        <div className="pin">
          <div className="explainer-stk green">
            <span className="h">today</span>
            the main use.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Between data centers (DCI).</b> Tens to thousands of km. Demand
          exploding, high prices, high margins.
        </p>
        <div className="pin">
          <div className="explainer-stk lilac">
            <span className="h">long-haul</span>
            the <b>Nokia/DCI</b>
            <br />
            world.
          </div>
        </div>
      </div>

      <div className="explainer-row">
        <p>
          <b>Inside the rack (CPO / NPO).</b> Pull the optics off the faceplate
          and in next to the chip.
        </p>
        <div className="pin">
          <div className="explainer-stk yellow">
            <span className="h">tomorrow</span>
            Nvidia &amp; Google
            <br />
            are pushing it.
          </div>
        </div>
      </div>

      <h2 className="explainer-section-h">
        <span className="arr">※</span>the bottom line
      </h2>
      <p>
        The GPU is the brain. The optical module is the <span className="v">nerve</span>{' '}
        that lets the brains talk. All routes race toward one horizon: pull the
        light closer and closer to the chip until the chip simply emits its
        own. The edge isn&rsquo;t the cleverest design &mdash; it&rsquo;s
        owning the part of the light nobody else can make.
      </p>
    </ExplainerShell>
  );
}

function LightDiagram() {
  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ex-wobble-light" x="-2%" y="-2%" width="104%" height="104%">
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
          viewBox="0 0 360 460"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-light)"
        >
          {/* module outer body */}
          <rect
            x={20}
            y={120}
            width={320}
            height={220}
            rx={6}
            fill="none"
            stroke="#1a1612"
            strokeWidth={1.6}
          />
          <rect
            x={20}
            y={120}
            width={320}
            height={220}
            rx={6}
            fill="none"
            stroke="rgba(26,22,18,0.22)"
            strokeWidth={3}
            transform="translate(2,2)"
          />
          <text
            x={180}
            y={108}
            fontFamily="JetBrains Mono"
            fontSize={8}
            fill="#1a1612"
            textAnchor="middle"
            letterSpacing={3}
            style={{ textTransform: 'uppercase' }}
          >
            optical module · cross-section
          </text>

          {/* incoming fibers (left side) */}
          <g stroke="#d9a449" strokeWidth={1} fill="none" strokeLinecap="round">
            <path d="M2 200 Q 16 200 24 208" />
            <path d="M2 220 Q 16 220 24 224" />
            <path d="M2 240 Q 16 240 24 240" />
            <path d="M2 260 Q 16 260 24 256" />
          </g>

          {/* FAU block */}
          <g>
            <rect
              x={30}
              y={180}
              width={56}
              height={100}
              fill="#3a2a16"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* v-groove fiber array */}
            <g stroke="#d9a449" strokeWidth={0.6} fill="none">
              <path d="M30 200 L86 208" />
              <path d="M30 220 L86 222" />
              <path d="M30 240 L86 240" />
              <path d="M30 260 L86 256" />
            </g>
            <text
              x={58}
              y={300}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              FAU
            </text>
            <text
              x={58}
              y={314}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="rgba(255,255,255,0.55)"
              textAnchor="middle"
              letterSpacing={1}
            >
              fiber array
            </text>
          </g>

          {/* PIC block — silicon photonics */}
          <g>
            <rect
              x={92}
              y={150}
              width={108}
              height={160}
              fill="#1f3a2a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* waveguide grid */}
            <g stroke="#d9a449" strokeWidth={0.4} fill="none" opacity={0.7}>
              <path d="M98 170 L194 170" />
              <path d="M98 184 L194 184" />
              <path d="M98 198 L194 198" />
              <path d="M98 212 L194 212" />
              <path d="M98 226 L194 226" />
              <path d="M98 240 L194 240" />
              <path d="M98 254 L194 254" />
              <path d="M98 268 L194 268" />
              <path d="M110 158 L110 280" />
              <path d="M128 158 L128 280" />
              <path d="M146 158 L146 280" />
              <path d="M164 158 L164 280" />
              <path d="M182 158 L182 280" />
            </g>
            {/* curved waveguide highlight */}
            <path d="M98 224 Q 140 224 160 200 Q 180 176 194 176" stroke="#d9a449" strokeWidth={0.8} fill="none" opacity={0.95} />
            <text
              x={146}
              y={300}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              PIC
            </text>
            <text
              x={146}
              y={314}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="rgba(255,255,255,0.55)"
              textAnchor="middle"
              letterSpacing={1}
            >
              silicon photonics
            </text>
          </g>

          {/* EIC block — electronic IC */}
          <g>
            <rect
              x={206}
              y={150}
              width={84}
              height={160}
              fill="#0f2a1a"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* fine trace pattern */}
            <g stroke="#d9a449" strokeWidth={0.3} fill="none" opacity={0.7}>
              <path d="M212 164 L284 164" />
              <path d="M212 172 L284 172" />
              <path d="M212 180 L284 180" />
              <path d="M212 188 L284 188" />
              <path d="M212 196 L284 196" />
              <path d="M212 204 L284 204" />
              <path d="M212 212 L284 212" />
              <path d="M212 220 L284 220" />
              <path d="M212 228 L284 228" />
              <path d="M212 236 L284 236" />
              <path d="M212 244 L284 244" />
              <path d="M212 252 L284 252" />
              <path d="M212 260 L284 260" />
              <path d="M212 268 L284 268" />
              <path d="M222 158 L222 280" />
              <path d="M238 158 L238 280" />
              <path d="M254 158 L254 280" />
              <path d="M270 158 L270 280" />
            </g>
            <text
              x={248}
              y={300}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              EIC
            </text>
            <text
              x={248}
              y={314}
              fontFamily="JetBrains Mono"
              fontSize={5.5}
              fill="rgba(255,255,255,0.55)"
              textAnchor="middle"
              letterSpacing={1}
            >
              electronic IC
            </text>
          </g>

          {/* EML laser block */}
          <g>
            <rect
              x={296}
              y={180}
              width={42}
              height={100}
              fill="#274c2e"
              stroke="#1a1612"
              strokeWidth={1}
            />
            {/* laser stripe glowing */}
            <rect x={304} y={224} width={26} height={6} fill="#ff5040" />
            <rect x={302} y={222} width={30} height={10} fill="none" stroke="#ff8a4c" strokeWidth={0.6} opacity={0.6} />
            <rect x={300} y={220} width={34} height={14} fill="none" stroke="#ff8a4c" strokeWidth={0.4} opacity={0.35} />
            {/* bond pads */}
            <g fill="#d9a449">
              <rect x={302} y={196} width={6} height={3} />
              <rect x={314} y={196} width={6} height={3} />
              <rect x={326} y={196} width={6} height={3} />
              <rect x={302} y={252} width={6} height={3} />
              <rect x={314} y={252} width={6} height={3} />
              <rect x={326} y={252} width={6} height={3} />
            </g>
            <text
              x={317}
              y={300}
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill="#fff"
              textAnchor="middle"
              letterSpacing={2}
              style={{ textTransform: 'uppercase' }}
            >
              EML
            </text>
          </g>

          {/* bond wires PIC↔EIC */}
          <g stroke="#d9a449" strokeWidth={0.6} fill="none" opacity={0.85}>
            <path d="M198 168 Q 202 162 208 168" />
            <path d="M198 188 Q 202 182 208 188" />
            <path d="M198 208 Q 202 202 208 208" />
            <path d="M198 228 Q 202 222 208 228" />
            <path d="M198 248 Q 202 242 208 248" />
            <path d="M198 268 Q 202 262 208 268" />
          </g>
          {/* bond wires EIC↔EML */}
          <g stroke="#d9a449" strokeWidth={0.6} fill="none" opacity={0.85}>
            <path d="M286 198 Q 292 192 302 198" />
            <path d="M286 254 Q 292 248 302 254" />
          </g>
          {/* waveguide PIC→EML coupling */}
          <path d="M194 230 Q 240 230 296 230" stroke="#d9a449" strokeWidth={1} fill="none" opacity={0.9} strokeDasharray="3 2" />
        </svg>

        {/* hand-drawn lilac arrows — the photon path */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 360 460"
          preserveAspectRatio="none"
        >
          <g
            stroke="#7c5cc4"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* fiber → FAU arc */}
            <path d="M4 360 Q 30 348 56 350" />
            <path d="M56 350 L 48 346 M56 350 L 50 356" />
            {/* FAU → PIC */}
            <path d="M88 380 Q 110 372 138 376" />
            <path d="M138 376 L 130 372 M138 376 L 132 380" />
            {/* PIC → EIC bond wires (top) */}
            <path d="M170 410 Q 200 400 232 408" />
            <path d="M232 408 L 224 404 M232 408 L 226 412" />
            {/* EIC → EML drive */}
            <path d="M260 380 Q 290 376 316 380" />
            <path d="M316 380 L 308 376 M316 380 L 310 384" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 184, left: -22 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 154, left: 96 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 154, left: 220 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 184, right: -22 }}>
          4
        </div>
        <div className="explainer-num" style={{ top: 304, left: 160 }}>
          5
        </div>
      </div>

      <p className="explainer-cap">
        cross-section <span className="v">·</span> where photons meet electrons
      </p>

      <div
        className="explainer-sticky green"
        style={{ top: 200, left: -32, width: 138, transform: 'rotate(-4deg)' }}
      >
        <span className="h">④ FAU</span>
        fibre coupling —
        <br />still built <b>by hand</b>
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 36, left: 56, width: 148, transform: 'rotate(-3deg)' }}
      >
        <span className="h">② PIC</span>
        silicon photonics —
        <br />the waveguide highway
      </div>
      <div
        className="explainer-sticky blue"
        style={{ top: 36, left: 218, width: 148, transform: 'rotate(3deg)' }}
      >
        <span className="h">③ EIC</span>
        drives the laser —
        <br />Marvell vs Broadcom
      </div>
      <div
        className="explainer-sticky yellow"
        style={{ top: 200, right: -28, width: 144, transform: 'rotate(4deg)' }}
      >
        <span className="h">① EML</span>
        laser source —
        <br />only <b>2</b> suppliers
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: 352, left: 84, width: 198, transform: 'rotate(-2deg)' }}
      >
        <span className="h">⑤ power floor</span>
        <b>≥300 mW</b> EML for <b>1.6T+</b>
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 90,
          left: 10,
          fontSize: '1rem',
          transform: 'rotate(-6deg)',
        }}
      >
        the optical engine ↘
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 414,
          right: 24,
          fontSize: '0.95rem',
          transform: 'rotate(-3deg)',
        }}
      >
        photons → electrons
      </div>
    </div>
  );
}
