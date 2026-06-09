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
