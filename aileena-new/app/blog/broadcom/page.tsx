'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function BroadcomArticle() {
  return (
    <SubstackShell
      category="Markets"
      date="2026.06.01"
      tags="Broadcom · Marvell · MediaTek · ASIC · TPU · CPO · OpenAI · AI Hardware"
      title="Where Broadcom Sits in the AI Stack"
      dek="Broadcom is the most dominant AI silicon vendor not named Nvidia — Google's TPU partner, the switch-chip king, half of the EML supply, ~90% of the non-Nvidia DSP market. It also has the most credible incumbent-disruption pressure in the sector: MediaTek peeling off Google's inference TPU, Marvell taking AWS Trainium and a Google FFN socket, and a CPO transition that would cannibalize Broadcom's own pluggable-module empire. Four pillars and three pressures."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Two facts to hold side-by-side. Broadcom is the AI silicon company with the deepest
          dominance after Nvidia &mdash; Google&rsquo;s TPU partner, the dominant data-centre switch
          chip (Tomahawk 6 at <strong style={strong}>1.2 T per port</strong>), one of two real EML
          (electro-absorption laser) suppliers worldwide, and roughly{' '}
          <strong style={strong}>90%</strong> of the high-speed pluggable-DSP market outside the
          Nvidia ecosystem. By volume and by surface area, no one else is close.
        </p>
        <p style={bodyStyle}>
          And: Broadcom is also the company facing the most credible incumbent-disruption pressure
          in the sector right now. Three vectors at once &mdash; MediaTek peeling off a slice of
          Google&rsquo;s TPU work, Marvell winning AWS Trainium and a Google FFN socket back from
          Broadcom, and a CPO (co-packaged optics) transition that would erase a meaningful share
          of Broadcom&rsquo;s own pluggable-module business.
        </p>
        <p style={bodyStyle}>
          This piece walks both halves: the four-pillar empire as it stands, then the three
          pressure vectors against it.
        </p>
        <p style={bodyStyle}>
          Companion pieces:{' '}
          <Link href="/blog/marvell" style={linkStyle}>Where Marvell Sits in the AI Optical Stack</Link>{' '}
          (the chips just upstream of these),{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>{' '}
          (the cage layer that holds them), and{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link> (the broader scarcity map).
        </p>

        <SectionLabel>Pillar 1 — Custom ASIC: the Google base, the OpenAI bet</SectionLabel>
        <p style={bodyStyle}>
          The fastest-growing slice of Broadcom&rsquo;s AI revenue today is{' '}
          <strong style={strong}>custom ASIC design</strong> &mdash; building bespoke accelerators
          for one hyperscaler at a time. Two customers carry it.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Google.</strong> Broadcom has been Google&rsquo;s TPU design
          partner across generations and is still the partner on the current{' '}
          <strong style={strong}>TPU v7</strong> (training) and the{' '}
          <strong style={strong}>TPU v8</strong> family (training + inference variants). The
          division of labour is: Broadcom owns the front-end and back-end physical design, including
          the high-speed SerDes; TSMC owns the fab and the package; Google keeps a large portion of
          architectural design in-house. It&rsquo;s the most stable revenue stream Broadcom has in
          AI &mdash; the base under everything else.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>OpenAI.</strong> The newer, louder line item. Broadcom is the
          exclusive design partner for OpenAI&rsquo;s in-house training ASIC &mdash; OpenAI&rsquo;s
          attempt to build silicon supply independent of Nvidia. Program scale, as currently
          guided: about <strong style={strong}>2,000 racks</strong>, with rack-level cost around{' '}
          <strong style={strong}>$3 M</strong>, putting the total project somewhere in the{' '}
          <strong style={strong}>$6&ndash;8 B</strong> range. The chip is currently in NPI (new
          product introduction); volume ramp starts <strong style={strong}>2H 2026</strong>.
        </p>
        <p style={bodyStyle}>
          The OpenAI line is what the market is repricing right now &mdash; more on that below.
        </p>

        <SectionLabel>Pillar 2 — Switch silicon: the moat that still holds</SectionLabel>
        <p style={bodyStyle}>
          Broadcom&rsquo;s <strong style={strong}>Tomahawk</strong> and{' '}
          <strong style={strong}>Trident</strong> families are the data-centre Ethernet switch
          chips. They&rsquo;re inside almost every brand-name switch the industry buys &mdash;
          Cisco, Arista, Huawei, H3C. The current generation, <strong style={strong}>Tomahawk 6</strong>,
          delivers up to <strong style={strong}>1.2 T per port</strong> and is the hardware
          backbone that makes 1.6T and 3.2T optical-module deployments economic.
        </p>
        <p style={bodyStyle}>
          Marvell is the credible challenger here too, but Broadcom&rsquo;s first-mover share and
          incumbent vendor relationships keep the lead large. Of the four pillars, this is the one
          where Broadcom&rsquo;s position looks most secure on a 2&ndash;3 year horizon.
        </p>

        <SectionLabel>Pillar 3 — Optical chips: EML and DSP, the bottleneck duopoly</SectionLabel>
        <p style={bodyStyle}>
          On the optical-module side, Broadcom sits at the two most-strained points in the supply
          chain.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>EML (electro-absorption modulated laser) chips</strong> are the
          light source inside 800G/1.6T modules. Globally, the two real volume suppliers are{' '}
          <strong style={strong}>Lumentum</strong> and <strong style={strong}>Broadcom</strong>.
          Broadcom&rsquo;s EML production is stuck on a mix of{' '}
          <strong style={strong}>2- and 3-inch wafers</strong> &mdash; the metro of capacity
          extension is small and slow. The{' '}
          <strong style={strong}>200 G EML grade</strong> (the part 1.6T modules need eight of each)
          is the sharpest shortage, with lead times that stretch to a year. Eoptolink (新易盛) alone
          has booked <strong style={strong}>more than half</strong> of Broadcom&rsquo;s EML
          capacity; Innolight and other top module makers take the rest.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>DSP (digital signal processor) chips</strong> &mdash; the brain of
          a high-speed optical module &mdash; are the other socket. Outside the Nvidia ecosystem
          (i.e. CSP-spec pluggables and the broader long tail), Broadcom holds approximately{' '}
          <strong style={strong}>90%</strong> share. Marvell is the live competitor, but the
          consensus on both power consumption and link performance leans toward Broadcom at the
          current generation. The bottleneck on this socket is{' '}
          <strong style={strong}>TSMC&rsquo;s 3 nm capacity</strong>, not design &mdash; Broadcom
          and Marvell compete for the same overbooked allocation, and what each can ship at 1.6T is
          mostly a function of how much 3 nm wafer-start they pulled.
        </p>

        <SectionLabel>Pillar 4 — CPO: the catch-22</SectionLabel>
        <p style={bodyStyle}>
          The fourth pillar is the one Broadcom is publicly pushing hardest and quietly making the
          slowest progress on. <strong style={strong}>CPO</strong> (co-packaged optics) collapses
          the optical engine onto the same substrate as the switch ASIC &mdash; no pluggable
          module, no cage. Broadcom&rsquo;s technical bet is a{' '}
          <strong style={strong}>Mach&ndash;Zehnder modulator</strong> route inside an{' '}
          <em>open</em> ecosystem &mdash; the architectural opposite of Nvidia&rsquo;s closed,
          vertically integrated CPO stack.
        </p>
        <p style={bodyStyle}>
          The publicly indicated volume window is{' '}
          <strong style={strong}>2H 2027 to 2028</strong>, which is{' '}
          <strong style={strong}>six to twelve months behind</strong> Nvidia&rsquo;s plan. Today
          the work is at prototype and pilot scale, no formal shipments. The pacing problem is
          partly capacity: CPO at the latest node needs the same TSMC packaging slots Nvidia is
          consuming first, and Broadcom&rsquo;s priority inside TSMC is materially below
          Nvidia&rsquo;s.
        </p>
        <p style={bodyStyle}>
          The deeper problem isn&rsquo;t timing &mdash; it&rsquo;s structural.{' '}
          <strong style={strong}>Broadcom is the EML and DSP supplier whose products CPO is built
          to replace.</strong> Every successful CPO deployment is one fewer pluggable module with a
          Broadcom EML inside and a Broadcom DSP next to it. Push CPO hard, you cannibalize your
          most-profitable legacy product. Push it slow, you cede the next generation to Nvidia. The
          observable behaviour is closer to follower-with-hedge than to disruptor-with-conviction
          &mdash; which is exactly what the financial conflict predicts.
        </p>

        <SectionLabel>Pressure 1 — MediaTek peels off Google inference</SectionLabel>
        <p style={bodyStyle}>
          For most of the TPU&rsquo;s history Broadcom was, in practice, the only design partner
          Google considered. That ended in 2025&ndash;2026. Google is actively diversifying its TPU
          supply chain and has shifted part of its{' '}
          <strong style={strong}>inference-class TPU work &mdash; specifically the V8E series</strong>{' '}
          &mdash; to <strong style={strong}>MediaTek</strong>.
        </p>
        <p style={bodyStyle}>
          MediaTek&rsquo;s case is the textbook one: lower price, more flexible customisation
          service. Google&rsquo;s case is also textbook: it wants to stop paying what its
          procurement team calls the &ldquo;Broadcom premium,&rdquo; and it wants to be optionable
          across vendors. The market read the news as exactly what it is &mdash; the first dent in
          the assumption that Broadcom&rsquo;s position inside Google&rsquo;s TPU program was
          structurally unassailable. Training (v7, v8) is still Broadcom; inference (v8E) is
          partially MediaTek. The question for 2027 is whether the next TPU&rsquo;s training tier
          stays with Broadcom or whether the MediaTek wedge widens.
        </p>

        <SectionLabel>Pressure 2 — Marvell takes Trainium and a Google FFN socket</SectionLabel>
        <p style={bodyStyle}>
          The second pressure vector is from the company you&rsquo;d most expect.
        </p>
        <p style={bodyStyle}>
          On the AWS side, <strong style={strong}>Marvell has won the Trainium 2/3 ASIC design
          service contract from Broadcom.</strong> AWS&rsquo;s in-house accelerator program now
          flows through Marvell, not Broadcom &mdash; a direct head-to-head loss in the same
          design-services market Broadcom has used as its growth proxy.
        </p>
        <p style={bodyStyle}>
          On the Google side, Google has hedged by bringing Marvell in as the designer of a chip
          targeted at a <strong style={strong}>specific compute pattern</strong> &mdash; the FFN
          (feed-forward network) workloads at the centre of modern inference graphs. Marvell here
          is &ldquo;strategic backup,&rdquo; not lead, but the pattern is identical to the
          MediaTek arrangement above: Google is making sure no single design partner can hold its
          roadmap hostage.
        </p>
        <p style={bodyStyle}>
          The two news items together rewrite the AI ASIC design-services market from
          &ldquo;Broadcom and everybody else&rdquo; to &ldquo;Broadcom and Marvell, with MediaTek
          on the inference flank.&rdquo;
        </p>

        <SectionLabel>Pressure 3 — OpenAI's conservative 2026 guidance</SectionLabel>
        <p style={bodyStyle}>
          The most immediate financial pressure is OpenAI itself. Broadcom flagged OpenAI as a
          top-five customer; the market priced in a steep ramp on the back of the in-house ASIC
          program. The 2026 unit guidance the program is currently carrying has come in well below
          that expectation &mdash; conservative enough that consensus near-term revenue estimates
          for Broadcom were pulled down on the same news cycle.
        </p>
        <p style={bodyStyle}>
          Two things behind the guidance number.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Scale relative to Nvidia is small.</strong> OpenAI&rsquo;s
          Broadcom program is <strong style={strong}>$6&ndash;8 B</strong> total. OpenAI&rsquo;s
          Nvidia spend is reported on the order of <strong style={strong}>$30 B per year</strong>.
          Broadcom is one supplier in a portfolio, not the centre of it.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>OpenAI is deliberately multi-vendoring.</strong> Its compute
          buildout now spans Nvidia, AMD, Broadcom, and Arm-based options, plus its own custom
          ASIC. That diversification is sensible product strategy and it also{' '}
          <em>directly weakens Broadcom&rsquo;s pricing power</em> &mdash; OpenAI can credibly
          shift any single line. Broadcom&rsquo;s upside on the program is bounded by how much of
          OpenAI&rsquo;s aggregate compute it can plausibly capture, and the answer is currently
          &ldquo;a slice, not the whole.&rdquo;
        </p>

        <SectionLabel>The shape</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Strengths.</strong> Switch-chip dominance (Tomahawk 6, 1.2 T/port);
            the deep TSMC manufacturing relationship; EML + DSP near-bottleneck position; the
            Google TPU base.
          </li>
          <li>
            <strong style={strong}>Live pressures.</strong> MediaTek on inference TPU (V8E); Marvell
            on AWS Trainium + Google FFN; OpenAI conservative on 2026 ASIC volumes; multi-vendor
            sourcing reducing pricing power across the board.
          </li>
          <li>
            <strong style={strong}>The catch-22.</strong> CPO progress is materially behind Nvidia,
            partly because of TSMC priority and partly because every CPO win erodes Broadcom&rsquo;s
            own EML + DSP + pluggable-module book.
          </li>
        </ul>
        <p style={bodyStyle}>
          What to watch over the next two quarters:
        </p>
        <ol style={listStyle}>
          <li>
            <strong style={strong}>CPO execution.</strong> Any 2H 2026 milestone on the Mach&ndash;
            Zehnder open-CPO route would change the catch-22 calculus &mdash; or, if missed,
            cement the &ldquo;follower&rdquo; reading.
          </li>
          <li>
            <strong style={strong}>Google TPU retention.</strong> Does Google&rsquo;s next training
            generation stay with Broadcom, or does the MediaTek wedge widen from inference into
            training?
          </li>
          <li>
            <strong style={strong}>OpenAI iteration.</strong> If real demand for the in-house
            training ASIC outruns the conservative current guidance, that single line item can
            move the entire near-term P&amp;L print.
          </li>
        </ol>
        <p style={bodyStyle}>
          One-line read on Broadcom&rsquo;s AI position:{' '}
          <strong style={strong}>still the most-dominant non-Nvidia silicon vendor, with the
          deepest customer base in the sector &mdash; and the most credible disruption stack
          against it on a 12&ndash;18 month horizon.</strong>{' '}
          The empire is intact; the dent count is rising.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          Figures here are drawn from current supply-chain research (industry Q&amp;A notes and
          sell-side reports through mid-2026) and stated as the thesis, not independently
          re-derived.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Adjacent reading:{' '}
          <Link href="/blog/marvell" style={linkStyle}>Where Marvell Sits in the AI Optical Stack</Link>{' '}
          (the other half of the duopoly);{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>{' '}
          (the cage layer above the EML / DSP sockets);{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link> (the broader scarcity map &mdash; including the 200G EML cliff and Coherent /
          Faraday rotator monopoly Broadcom doesn&rsquo;t touch).
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Shared inline styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const linkStyle: React.CSSProperties = { color: '#00ffea', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,234,0.3)' };
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace',
      fontSize: '0.6rem',
      letterSpacing: '0.45em',
      color: '#00ffea',
      textTransform: 'uppercase',
      marginBottom: 20,
      marginTop: 56,
      opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
