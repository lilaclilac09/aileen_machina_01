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

      <CoolingDiagram />

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

function CoolingDiagram() {
  // four cooling generations, horizontal racks
  const gens = [
    { x: 30, fill: '#3a2a16', label: 'AIR', sub: 'GEN 1', heat: 'pre-AI' },
    { x: 115, fill: '#1c3a26', label: 'COLD PLATE', sub: 'GEN 2', heat: '20 W' },
    { x: 200, fill: '#0f2a1a', label: 'IMMERSION', sub: 'GEN 3', heat: '70 W+' },
    { x: 285, fill: '#274c2e', label: 'CPO', sub: 'GEN 4', heat: '150 W+' },
  ];

  return (
    <div className="explainer-diagram">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter
            id="ex-wobble-cooling"
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
          >
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
          viewBox="0 0 380 360"
          xmlns="http://www.w3.org/2000/svg"
          filter="url(#ex-wobble-cooling)"
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

          {gens.map((g, i) => (
            <g key={g.label}>
              {/* rack cross-section, 70×170 */}
              <rect
                x={g.x}
                y={50}
                width={70}
                height={170}
                fill={g.fill}
                stroke="#1a1612"
                strokeWidth={1}
              />
              {/* chips inside */}
              <g fill="#d9a449">
                <rect x={g.x + 10} y={70} width={50} height={6} />
                <rect x={g.x + 10} y={100} width={50} height={6} />
                <rect x={g.x + 10} y={130} width={50} height={6} />
                <rect x={g.x + 10} y={160} width={50} height={6} />
                <rect x={g.x + 10} y={190} width={50} height={6} />
              </g>

              {/* per-gen overlay */}
              {i === 0 && (
                <g
                  stroke="#d9a449"
                  strokeWidth={0.7}
                  fill="none"
                  strokeDasharray="2 2"
                >
                  <path d={`M${g.x + 8} 86 L${g.x + 62} 86`} />
                  <path d={`M${g.x + 8} 116 L${g.x + 62} 116`} />
                  <path d={`M${g.x + 8} 146 L${g.x + 62} 146`} />
                  <path d={`M${g.x + 8} 176 L${g.x + 62} 176`} />
                </g>
              )}
              {i === 1 && (
                <g stroke="#7aa6d8" strokeWidth={1.2} fill="none">
                  <path d={`M${g.x + 6} 80 L${g.x + 64} 80`} />
                  <path d={`M${g.x + 6} 110 L${g.x + 64} 110`} />
                  <path d={`M${g.x + 6} 140 L${g.x + 64} 140`} />
                  <path d={`M${g.x + 6} 170 L${g.x + 64} 170`} />
                  <path d={`M${g.x + 6} 200 L${g.x + 64} 200`} />
                </g>
              )}
              {i === 2 && (
                <rect
                  x={g.x + 4}
                  y={56}
                  width={62}
                  height={158}
                  fill="rgba(122,166,216,0.32)"
                  stroke="#7aa6d8"
                  strokeWidth={0.8}
                />
              )}
              {i === 3 && (
                <g stroke="#7c5cc4" strokeWidth={1.2} fill="none">
                  <path d={`M${g.x + 6} 80 L${g.x + 64} 80`} />
                  <path d={`M${g.x + 6} 110 L${g.x + 64} 110`} />
                  <path d={`M${g.x + 6} 140 L${g.x + 64} 140`} />
                  <path d={`M${g.x + 6} 170 L${g.x + 64} 170`} />
                  <path d={`M${g.x + 6} 200 L${g.x + 64} 200`} />
                </g>
              )}

              {/* gen label */}
              <text
                x={g.x + 35}
                y={40}
                fontFamily="JetBrains Mono"
                fontSize={7}
                fill="rgba(26,22,18,0.6)"
                textAnchor="middle"
                letterSpacing={1.2}
              >
                {g.sub}
              </text>
              <text
                x={g.x + 35}
                y={238}
                fontFamily="JetBrains Mono"
                fontSize={7.5}
                fill="#1a1612"
                textAnchor="middle"
                letterSpacing={1.2}
                style={{ textTransform: 'uppercase' }}
              >
                {g.label}
              </text>
              <text
                x={g.x + 35}
                y={258}
                fontFamily="JetBrains Mono"
                fontSize={8.5}
                fill="#1a1612"
                textAnchor="middle"
                fontWeight="bold"
                letterSpacing={1}
              >
                {g.heat}
              </text>
            </g>
          ))}
        </svg>

        {/* lilac progression arrows */}
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
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M102 135 Q 110 132 113 135" />
            <path d="M113 135 L 108 131 M113 135 L 108 139" />
            <path d="M187 135 Q 195 132 198 135" />
            <path d="M198 135 L 193 131 M198 135 L 193 139" />
            <path d="M272 135 Q 280 132 283 135" />
            <path d="M283 135 L 278 131 M283 135 L 278 139" />
          </g>
        </svg>

        <div className="explainer-num" style={{ top: 28, left: 50 }}>
          1
        </div>
        <div className="explainer-num" style={{ top: 28, left: 135 }}>
          2
        </div>
        <div className="explainer-num" style={{ top: 28, left: 220 }}>
          3
        </div>
        <div className="explainer-num" style={{ top: 28, left: 305 }}>
          4
        </div>
      </div>

      <p className="explainer-cap">
        cooling has had to evolve{' '}
        <span className="v">three times</span> — the fourth is coming
      </p>

      <div
        className="explainer-sticky yellow"
        style={{ top: 290, left: -18, width: 148, transform: 'rotate(-3deg)' }}
      >
        <span className="h">gen 1 — air</span>
        the old way,
        <br /><b>can&rsquo;t keep up</b>
      </div>
      <div
        className="explainer-sticky pink"
        style={{ top: 300, left: 150, width: 156, transform: 'rotate(2deg)' }}
      >
        <span className="h">gen 2 — cold plate</span>
        <b>72 GPUs/rack</b>,
        <br /><b>$250</b> a cage
      </div>
      <div
        className="explainer-sticky blue"
        style={{ bottom: -10, right: 150, width: 144, transform: 'rotate(-2deg)' }}
      >
        <span className="h">gen 3 — immersion</span>
        full fluid,
        <br />no fans
      </div>
      <div
        className="explainer-sticky green"
        style={{ bottom: -10, right: -16, width: 138, transform: 'rotate(3deg)' }}
      >
        <span className="h">gen 4 — CPO</span>
        photonics fused
        <br />to the chip
      </div>
      <div
        className="explainer-sticky lilac"
        style={{ top: -8, right: 24, width: 180, transform: 'rotate(-2.4deg)' }}
      >
        <span className="h">the cliff</span>
        air fails past <b>20 W</b> —
        <br />each generation pulls more
      </div>

      <div
        className="explainer-marg"
        style={{
          top: 70,
          left: 12,
          fontSize: '0.95rem',
          transform: 'rotate(-8deg)',
        }}
      >
        ← heat we can pull
      </div>
      <div
        className="explainer-marg"
        style={{
          top: 220,
          left: 145,
          fontSize: '0.9rem',
          transform: 'rotate(-3deg)',
        }}
      >
        $250 / ¥1,800
      </div>
    </div>
  );
}
