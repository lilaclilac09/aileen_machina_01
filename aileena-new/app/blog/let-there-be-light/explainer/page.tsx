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
