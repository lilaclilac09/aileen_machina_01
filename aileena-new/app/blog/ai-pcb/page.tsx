'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function AiPcbArticle() {
  return (
    <SubstackShell
      category="Markets"
      date="2026.06.02"
      tags="PCB · HDI · Substrate-like · NVIDIA · Google TPU · AI Hardware"
      title="The PCB Stack Inside an AI Rack"
      dek="An AI rack ships with five distinct PCBs stacked through it — HDI compute, switch, mid plane, orthogonal backplane, and the substrate-like board that decides 2027. Taiwan held the high-layer-board market for two decades. Mainland China overtook them on fifth-order 22-layer HDI in 2025 (Victory Giant ~90% yield against Unimicron's ~80%) and the next mark — substrate-like PCB at 10 µm line widths — decides who supplies NVIDIA Rubin and Google's TPU buildout."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Five PCBs sit inside a current-generation AI rack. The fight to supply each is a
          different fight, and the share map is moving fast enough that two consecutive Rubin
          generations could ship with completely different vendor lists. This piece walks what the
          five boards are, why they exist at all, the three technical barriers that decide who
          gets to make them, and where the live battle lines sit between mainland-Chinese and
          Taiwanese suppliers.
        </p>
        <p style={bodyStyle}>
          Cluster: this is the PCB layer in the same AI-hardware build-out covered by{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link> (HVLP4 copper foil + Low-DK glass cloth, the inputs to these boards),{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>{' '}
          (the cages stacked above them), and{' '}
          <Link href="/blog/cpo" style={linkStyle}>How CPO Actually Gets Built</Link> (the
          576-rack architecture that makes the mid plane and the orthogonal backplane necessary in
          the first place).
        </p>

        <SectionLabel>The five boards inside the rack</SectionLabel>
        <p style={bodyStyle}>
          Reading top-down, you encounter each board at a different layer of the rack&rsquo;s
          architecture.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>HDI compute board.</strong> The board that carries the GPUs.
            HDI &mdash; high-density interconnect &mdash; uses microvias, fine line / space
            geometry (today around <strong style={strong}>50 &micro;m</strong> width and pitch,
            future targets <strong style={strong}>10 &micro;m</strong>), and multiple lamination
            passes to pack interconnect density. Current production on GB200 / GB300 uses{' '}
            <strong style={strong}>fifth-order 22-layer HDI</strong>: five HDI lamination passes
            in a 22-conductor-layer stack. The next-generation Rubin platform moves it to{' '}
            <strong style={strong}>seventh-order 26-layer HDI</strong>. Per-board value runs from{' '}
            <strong style={strong}>&yen;25,000</strong> (smaller OAM variant) to{' '}
            <strong style={strong}>&yen;40,000</strong> (full-size).
          </li>
          <li>
            <strong style={strong}>Switch board.</strong> Routes data between compute boards.
            Built on multi-high-layer through-hole stack, mainstream today is{' '}
            <strong style={strong}>32-layer</strong>, current consensus material is M9. The
            difficulty is not the design but plating uniformity and signal integrity across the
            very large board format. Suppliers today: Victory Giant, Wus Printed Circuit, TTM.
          </li>
          <li>
            <strong style={strong}>Mid plane.</strong> A new component for the 576-rack
            generation. Connects compute board to CPX board inside a single drawer, replacing the
            copper cables that were the GB200 / GB300 system. Built as a{' '}
            <strong style={strong}>44-layer</strong> small orthogonal backplane &mdash; two
            22-layer PCBs <strong style={strong}>copper-sintered</strong> together. Material: M9
            + Q-cloth (quartz glass cloth) + fourth-generation copper foil. A single 576-rack
            cabinet uses 18 mid planes, one per compute drawer.
          </li>
          <li>
            <strong style={strong}>Orthogonal backplane.</strong> The rack-level skeleton &mdash;
            a door-sized PCB connecting all compute drawers and switch drawers, forming the
            cabinet&rsquo;s data exchange bus. Stacks reach{' '}
            <strong style={strong}>78 to 104 layers</strong>, built by copper-sintering multiple
            22-layer or 16-layer sub-PCBs into one giant board. Difficulty is purely process
            yield: lamination of dozens of layers in large format with high-precision back-drill
            and plating, where defects compound geometrically.
          </li>
          <li>
            <strong style={strong}>Substrate-like PCB.</strong> Not in 2026 racks. The future
            board sitting between today&rsquo;s HDI and an IC substrate &mdash; line widths come
            down from 50 &micro;m to roughly <strong style={strong}>10 &micro;m</strong>, almost
            at chip-package density. This is the threshold that decides Rubin-generation supply
            share. More on this below.
          </li>
        </ul>

        <SectionLabel>Why the mid plane and backplane exist</SectionLabel>
        <p style={bodyStyle}>
          The current Blackwell generation racks &mdash; GB200 and GB300 &mdash; connect compute
          boards to switch boards through{' '}
          <strong style={strong}>over 5,000 copper cables</strong> per rack. Assembling that
          cable bundle is the named reason GB200 deliveries slipped: the manual operation is
          slow, error-prone, and produces a fault distribution that scales with cable count.
        </p>
        <p style={bodyStyle}>
          The 576-rack architecture that replaces it for Rubin and Rubin Ultra drops the cables
          for an <strong style={strong}>orthogonal backplane</strong> structure &mdash; instead of
          point-to-point cables, every drawer plugs into the same rigid PCB skeleton. The mid
          plane is the drawer-level expression of that same architectural shift: inside each
          compute drawer, what used to be cables connecting compute board to CPX board becomes one
          44-layer orthogonal mid plane.
        </p>
        <p style={bodyStyle}>
          The point isn&rsquo;t per-board performance &mdash; it&rsquo;s system-level reliability
          and assembly throughput. The mid plane / backplane stack replaces 5,000 manual cable
          terminations with a handful of standardised connectors, raising automation rate and
          throughput by something close to an order of magnitude.{' '}
          <strong style={strong}>That&rsquo;s the actual case for the architectural shift.</strong>
        </p>

        <SectionLabel>Barrier 1 — High-end HDI and substrate-like PCB</SectionLabel>
        <p style={bodyStyle}>
          The technical mark that already separates today&rsquo;s leaders from today&rsquo;s
          incumbents is yield on fifth-order 22-layer HDI. Taiwan&rsquo;s{' '}
          <strong style={strong}>Unimicron</strong>, the historical leader, runs this product at
          around <strong style={strong}>80%</strong> yield. Mainland China&rsquo;s{' '}
          <strong style={strong}>Victory Giant Technology</strong> runs it close to{' '}
          <strong style={strong}>90%</strong>. The reason isn&rsquo;t novel chemistry or proprietary
          IP &mdash; it&rsquo;s factory age. Unimicron&rsquo;s line was built in 2001&ndash;2002,
          with the automation, environmental control, and process telemetry of that era. Victory
          Giant&rsquo;s line is a 2024-onward greenfield with full-process automation.{' '}
          <strong style={strong}>Factory generation has become a real competitive variable in
          PCB.</strong>
        </p>
        <p style={bodyStyle}>
          The next mark is much harder. <strong style={strong}>Substrate-like PCB</strong>{' '}
          (sometimes &ldquo;SLP&rdquo;) sits between today&rsquo;s HDI and the ABF-based IC
          substrate stack used in chip packaging. Line widths and spaces come down from 50 &micro;m
          to about <strong style={strong}>10 &micro;m</strong>; tolerance budgets shrink toward
          chip-packaging discipline; and crucially, the entire production line has to run as a
          full-process clean room &mdash; not the &ldquo;clean at the critical steps&rdquo; pattern
          conventional HDI uses. <em>Retrofitting an existing HDI plant doesn&rsquo;t reach the
          required defect density.</em> Substrate-like PCB requires a new plant.
        </p>
        <p style={bodyStyle}>
          That makes substrate-like PCB the seventh-order 26-layer HDI&rsquo;s real prerequisite
          and the first board that will appear in Rubin-generation NVIDIA boxes. Two mainland
          companies enter the race with credible head starts:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Avary (鹏鼎).</strong> Has years of substrate-like PCB
            experience from flagship-iPhone production. The know-how transfers directly: same
            line-width regime, same clean-room discipline, same metrology stack. Avary&rsquo;s
            disadvantage is that it has historically been a consumer-electronics PCB house;
            making that pivot at AI-server volumes is the open question.
          </li>
          <li>
            <strong style={strong}>Victory Giant.</strong> Has the current HDI lead but has to
            build the new SLP-capable plant. Its track record on AI-server PCB execution speed
            (the &ldquo;Q4 certification → order → production&rdquo; cycle on the current generation)
            is the case for it doing it again. Capex is large; financing schedule is what gates it.
          </li>
        </ul>
        <p style={bodyStyle}>
          Unimicron, by contrast, has visibly tilted strategic priority toward{' '}
          <strong style={strong}>ABF substrate</strong> &mdash; the chip-package side of the
          packaging stack &mdash; and away from high-end HDI. That choice may turn out fine for
          its substrate business, but it leaves the AI-server PCB front under-resourced exactly
          as the substrate-like-PCB mark is being defined.
        </p>

        <SectionLabel>Barrier 2 — M9 / Q-cloth and PTFE: when materials retire equipment</SectionLabel>
        <p style={bodyStyle}>
          Two material transitions are also functioning as competitive resets.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Q-cloth</strong> (quartz glass cloth), the reinforcing fibre in
          top-grade Low-DK / M9 laminate, is so hard that conventional mechanical drilling
          can&rsquo;t process it economically &mdash; drill bits wear in single-board cycles and
          hole-wall quality is poor. That retires a generation of drilling equipment.{' '}
          <strong style={strong}>Han&rsquo;s Laser</strong> brought a laser-drill platform
          compatible with M9 + Q-cloth and is shipping it to Victory Giant; industry consensus has
          domestic Chinese laser-drill share heading <strong style={strong}>past 60%</strong> on
          the M9 product. This is the textbook case of a material transition becoming a
          mainland-equipment-vendor opening.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>PTFE</strong> (polytetrafluoroethylene &mdash; Teflon-class
          material) is at the other extreme: very soft, chemically nearly inert. It&rsquo;s wanted
          for ultra-low-loss radio-frequency-class boards, but processing it requires bespoke
          chemistry. NVIDIA initially courted multiple vendors; only{' '}
          <strong style={strong}>Avary and JWG (Joyfay / Jingwang)</strong> stayed in the R&amp;D
          loop &mdash; everyone else withdrew. Avary has since taken over the PTFE business
          previously held by Senke and submitted samples to NVIDIA. This is the kind of small,
          quiet supplier reshuffle that compounds into 2028 share lists.
        </p>

        <SectionLabel>Barrier 3 — Copper sintering: process yield at scale</SectionLabel>
        <p style={bodyStyle}>
          Mid plane and orthogonal backplane both rely on{' '}
          <strong style={strong}>copper sintering</strong> &mdash; bonding multiple multi-layer
          sub-PCBs into a single laminated stack at high precision. The problem is not chemistry
          or design. It&rsquo;s manufacturing physics: large, thick boards have to be heated and
          pressed uniformly without delamination, blistering, or sub-millimetre dimensional drift.
          Sintering precision drops geometrically with board size and layer count.
        </p>
        <p style={bodyStyle}>
          No one has years of head start here &mdash; copper-sintered orthogonal backplane in AI
          server form factors is essentially industry-first. The competitive variable is
          execution speed: who can run their first defect-quantified yield curve up the slope
          fastest. Mainland China&rsquo;s pattern has been to compress the certification →
          first-order → production cycle into a single quarter; Taiwanese counterparts move on a
          half-to-full-year cycle. <strong style={strong}>That speed differential, repeated over
          two generations, is the actual mechanism of share migration.</strong>
        </p>

        <SectionLabel>The supplier map by board</SectionLabel>
        <p style={bodyStyle}>
          Where each name stands today.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>HDI compute board (NVIDIA GB200 / GB300).</strong>{' '}
            <strong style={strong}>Victory Giant &gt; 70% share</strong>, Unimicron the remainder.
            The 70/30 split is the headline data point of mainland overtake.
          </li>
          <li>
            <strong style={strong}>Switch board.</strong> Victory Giant, Wus Printed Circuit, TTM.
            Multi-supplier today; M9 transition is reshuffling.
          </li>
          <li>
            <strong style={strong}>Mid plane (NVIDIA 576).</strong> Victory Giant &mdash; high
            probability lead. Wus and others still in qualification.
          </li>
          <li>
            <strong style={strong}>Orthogonal backplane.</strong> Multi-vendor qualification in
            progress: Victory Giant (first to pass sample), Unimicron, Jingwang, Avary, Wus.
          </li>
          <li>
            <strong style={strong}>Substrate-like PCB (Rubin generation).</strong> Avary on early
            substrate experience; Victory Giant on factory-build commitment. Open race.
          </li>
        </ul>

        <SectionLabel>The other customer — Google's TPU build-out</SectionLabel>
        <p style={bodyStyle}>
          Google&rsquo;s 2026 guidance walked its TPU shipment forecast from{' '}
          <strong style={strong}>2.5&ndash;3 million chips</strong> up to{' '}
          <strong style={strong}>~4 million chips</strong>. At roughly{' '}
          <strong style={strong}>$9,000 per TPU</strong> and 64 chips per rack (~{' '}
          <strong style={strong}>$1.9 M</strong> per rack), the implied chip line alone is in the
          tens of billions of dollars; the pull-through into PCB, optical, and cooling is a
          multi-tens-of-billion supply-chain expansion. This is the &ldquo;Google $10 B order&rdquo;
          headline in its actual form &mdash; a forecast revision that broadcasts demand
          downstream.
        </p>
        <p style={bodyStyle}>
          Two things change about the PCB market in Google&rsquo;s case relative to NVIDIA&rsquo;s.
        </p>
        <p style={bodyStyle}>
          First, <strong style={strong}>Google TPU boards use multi-high-layer PCB, not
          HDI</strong>. The architectural reason: NVIDIA GPU SerDes runs at a signal regime where
          HDI&rsquo;s low-loss interconnect is the right trade-off; the TPU&rsquo;s ASIC has higher
          link-level signal loss, which is compensated by a more conservative, higher-layer
          through-hole stack rather than denser HDI routing. The board is 22&ndash;24 layers on
          M8 / M9 material. Supplier map: <strong style={strong}>ISU, Wus Printed Circuit, ChaoYing</strong>{' '}
          (with Foxconn-affiliated ChaoYing the most volume-aggressive new entrant).
        </p>
        <p style={bodyStyle}>
          Second, Victory Giant is{' '}
          <strong style={strong}>trying to enter Google&rsquo;s supply chain, not yet in</strong>.
          The certification cycle for new vendors at Google runs around{' '}
          <strong style={strong}>six months</strong>, and the move slow. Its case for entry is the
          NVIDIA HDI track record (a credible 22-layer high-yield manufacturer), not its existing
          relationship at Google.
        </p>
        <p style={bodyStyle}>
          The other hyperscalers fill in the picture: <strong style={strong}>Meta</strong>{' '}
          consolidated on Wus Printed Circuit for its custom-accelerator PCB.{' '}
          <strong style={strong}>Amazon</strong> uses SCI Electronics and Kinwong on Trainium /
          Inferentia boards. The CSP side of the PCB market is less concentrated than the NVIDIA
          side, and more of it is going to mainland Chinese vendors with each new accelerator
          generation.
        </p>

        <SectionLabel>The shape</SectionLabel>
        <ol style={listStyle}>
          <li>
            <strong style={strong}>Mainland Chinese PCB houses already lead on the
            current-generation NVIDIA stack</strong>. Victory Giant&rsquo;s &gt;70% share of GB200 /
            GB300 HDI compute boards, at ~90% yield against Unimicron&rsquo;s ~80%, isn&rsquo;t a
            future prediction &mdash; it&rsquo;s 2026.
          </li>
          <li>
            <strong style={strong}>The next mark is substrate-like PCB</strong>. It needs a new
            full-process clean plant, not a retrofit. The credible candidates are Avary (Apple-side
            substrate-like experience) and Victory Giant (factory-build commitment). Unimicron has
            visibly shifted strategic priority toward ABF substrate instead.
          </li>
          <li>
            <strong style={strong}>Materials and equipment are reshuffling at the same time</strong>.
            M9 + Q-cloth retires an entire generation of mechanical drilling and opens the door
            for Han&rsquo;s Laser. PTFE consolidates onto Avary and Jingwang. Copper sintering for
            mid plane and backplane is an industry-first race where execution speed dominates.
          </li>
          <li>
            <strong style={strong}>Google&rsquo;s TPU buildout is a separate fight</strong> &mdash;
            multi-high-layer not HDI, ISU and Wus already incumbent, Victory Giant queueing for
            certification.
          </li>
        </ol>
        <p style={bodyStyle}>
          Net: the PCB layer of the AI build-out has the cleanest, most-measurable case for a
          structural mainland-China share gain in the entire AI hardware stack. The variable to
          watch over the next twelve months is which mainland house breaks ground on the first
          credible substrate-like PCB plant &mdash; that plant&rsquo;s commissioning date is when
          the Rubin-generation share map is decided.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          Figures here are drawn from current supply-chain research (industry Q&amp;A notes and
          sell-side reports through mid-2026) and stated as the thesis, not independently
          re-derived.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Cluster reading:{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link>,{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>,{' '}
          <Link href="/blog/marvell" style={linkStyle}>Where Marvell Sits</Link>,{' '}
          <Link href="/blog/broadcom" style={linkStyle}>Where Broadcom Sits</Link>,{' '}
          <Link href="/blog/cpo" style={linkStyle}>How CPO Actually Gets Built</Link>.
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
