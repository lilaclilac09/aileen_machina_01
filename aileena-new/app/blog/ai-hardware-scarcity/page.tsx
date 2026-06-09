'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function AiHardwareScarcityArticle() {
  return (
    <SubstackShell
      category="Investing"
      date="2026.05.30"
      tags="AI Hardware · Supply Chain · Optical · Semis"
      title="What AI Hardware Is Running Out Of"
      dek="Everyone watches the GPU. But the AI build-out is gated by a dozen unglamorous materials — the laser chips, the glass cloth, the copper foil, the specialty gases feeding the racks — and almost none of them have spare capacity. Here's the map of the choke points, layer by layer, and why each one is stuck."
      explainerHref="/blog/ai-hardware-scarcity/explainer"
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          The story everyone tells about AI hardware is a chip story: more GPUs, faster GPUs, who gets
          them. But walk down the supply chain and the real constraints aren't the famous chips &mdash;
          they're the boring inputs underneath, the materials that feed the racks. Most of them are
          made by a handful of companies, on lines that are already sold out, and the AI build-out is
          pulling on all of them at once. This is a map of those choke points, organized by layer, with
          the one number that matters for each.
        </p>

        <SectionLabel>Layer 1 — the parts that move the light</SectionLabel>
        <p style={bodyStyle}>
          Inside a data center, data between machines increasingly travels as light over fiber, through
          optical modules. Four of the parts that make and protect that light are badly supply-constrained.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>EML chips.</strong> An EML (electro-absorption modulated laser) is
            the core light-making chip in a high-speed optical module &mdash; it sets the speed, and
            it's what 800G and 1.6T (gigabit/terabit-per-second) modules are built around. Supply is
            concentrated in a few foreign players (Lumentum, Coherent), the process is hard to scale,
            and demand has run away from it: Sumitomo's EML output is on the order of{' '}
            <strong style={strong}>20 million chips</strong>, against demand that leaves roughly a{' '}
            <strong style={strong}>30% gap</strong>. Prices have moved accordingly &mdash;{' '}
            <strong style={strong}>40&ndash;50%</strong> on many parts, up to <strong style={strong}>80%</strong>{' '}
            on some. The sharpest version is <strong style={strong}>200G EML</strong>, the grade 1.6T
            modules are built from: each module needs at least <strong style={strong}>eight</strong> of
            them, and 2026 supply of roughly <strong style={strong}>50 million</strong> 200G chips covers
            only about <strong style={strong}>7 million</strong> 1.6T modules against demand north of{' '}
            <strong style={strong}>25 million</strong> &mdash; so silicon photonics has to fill more than{' '}
            <strong style={strong}>70%</strong> of the gap. China's Source Photonics is the only domestic
            maker into a top North-American cloud supply chain, but still runs{' '}
            <strong style={strong}>2-inch</strong> wafers while the leaders move to{' '}
            <strong style={strong}>4/6-inch</strong>.
          </li>
          <li>
            <strong style={strong}>CW light sources.</strong> A CW (continuous-wave) laser &mdash; a
            high-power DFB laser that emits a steady beam &mdash; is the light supply for silicon-
            photonics modules and CPO (co-packaged optics, where the optics sit right next to the
            switch chip). As silicon photonics becomes the mainstream design, demand is rigid and
            rising, and the leaders' capacity is locked: Lumentum's is spoken for by core customers
            (including Nvidia) out to <strong style={strong}>2028</strong>. The price crept from about{' '}
            <strong style={strong}>¥3.5</strong> a unit to <strong style={strong}>¥4&ndash;5</strong>,
            and the market is expected to stay tight for <strong style={strong}>three to five years</strong>.
          </li>
          <li>
            <strong style={strong}>Pump lasers.</strong> A pump laser drives the optical amplifier
            (EDFA) that boosts a signal for long-distance hops &mdash; the heart of a DCI
            (data-center-interconnect) link. Lumentum and Coherent together hold{' '}
            <strong style={strong}>over 90%</strong> of the market, a clean duopoly. Their lines were
            booked through the first half of <strong style={strong}>2027</strong> by late 2025, with
            customers now trying to lock <strong style={strong}>2027&ndash;2029</strong>; planned
            expansion of <strong style={strong}>70&ndash;100%</strong> still trails demand. The gap runs
            over <strong style={strong}>30%</strong>, and pump-laser volume has grown around{' '}
            <strong style={strong}>80%</strong>.
          </li>
          <li>
            <strong style={strong}>Faraday rotators.</strong> The magnetic crystal at the heart of an
            optical isolator &mdash; the part that stops back-reflected light from destabilizing the
            laser, so every module needs one. Supply is concentrated and, unusually, weaponized:
            Coherent holds about <strong style={strong}>50%</strong> (~<strong style={strong}>50,000</strong>{' '}
            pieces/month), a Japanese joint venture is next (~<strong style={strong}>30,000</strong>/month),
            and Chinese makers are far smaller. Coherent treats the big module makers (Innolight,
            Eoptolink) as direct rivals and sells rotators on a &ldquo;resource-swap&rdquo; basis &mdash;
            mostly to firms that can trade something back, like EML chips. Price ran from about{' '}
            <strong style={strong}>$120</strong> a piece in 2023 to <strong style={strong}>$175</strong>{' '}
            in 2025 (<strong style={strong}>+40%</strong>) at a <strong style={strong}>70&ndash;80%</strong>{' '}
            gross margin, and global capacity only climbs from ~<strong style={strong}>100,000</strong> to{' '}
            <strong style={strong}>160&ndash;180,000</strong>/month in the second half of{' '}
            <strong style={strong}>2026</strong> at the earliest.
          </li>
        </ul>

        <SectionLabel>Layer 2 — the boards everything sits on</SectionLabel>
        <p style={bodyStyle}>
          Under the chips is the printed circuit board, and the laminate it's pressed from. At AI
          signal speeds the board itself becomes a bottleneck, and its raw materials are short.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Low-DK glass cloth.</strong> The reinforcing fabric inside high-end
            copper-clad laminate. ("Low-DK" = low dielectric constant &mdash; it loses less signal at
            high frequency.) AI servers need it, so the big fiberglass makers shifted capacity to these
            high-end grades, squeezing everything else. The second-generation cloth (the kind that goes
            into M8-class material) has been tight since <strong style={strong}>January 2026</strong> and
            stays tight all year. The real chokepoint is the top grade &mdash; &ldquo;Q-cloth&rdquo;
            (third-generation quartz cloth) for M8/M9 laminate, where nearly{' '}
            <strong style={strong}>100%</strong> of 2026 output is earmarked for Nvidia&rsquo;s Rubin
            high-end and supply comes from a handful of makers (Feilihua, Sinoma / Taishan). Even the
            second-generation cloth feeding Google and Meta servers runs short: ~<strong style={strong}>3
            million</strong> meters/month of 2026 demand against roughly{' '}
            <strong style={strong}>1.2&ndash;1.3 million</strong> meters/month of Chinese capacity.
          </li>
          <li>
            <strong style={strong}>HVLP4 copper foil.</strong> An ultra-low-profile copper foil &mdash;
            very smooth, so high-frequency signals lose less energy crossing it. It's hard to make, yields
            are unstable, and only AI-class boards need it. The projected supply gap is{' '}
            <strong style={strong}>48% in 2026 and 43% in 2027</strong>. In raw tonnage: 2026 demand
            tops <strong style={strong}>1,200 tons/month</strong> (driven by Nvidia Rubin and AWS
            Trainium) against only ~<strong style={strong}>300&ndash;400 tons/month</strong> of
            yield-adjusted capacity; lead supplier Mitsui (~<strong style={strong}>300 tons/month</strong>)
            hit a quality stumble, and converting a line to HVLP4 cuts its output by at least{' '}
            <strong style={strong}>30%</strong>.
          </li>
          <li>
            <strong style={strong}>M8 / M9 CCL.</strong> Copper-clad laminate is the base material of
            the motherboard; M8 grade serves 800G/1.6T, M9 the next-generation (Rubin-class) platforms.
            It's hard to make &mdash; and worse, its two key inputs (the Low-DK cloth and HVLP foil above)
            are themselves short. Demand keeps climbing: monthly M9 demand in 2027 is projected at{' '}
            <strong style={strong}>5&ndash;6&times;</strong> 2026's M8 shipments.
          </li>
        </ul>

        <SectionLabel>Layer 3 — feeding the watts</SectionLabel>
        <p style={bodyStyle}>
          AI racks draw enormous power, and the components that condition that power are getting squeezed.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>GaN and SiC power devices.</strong> Gallium-nitride and
            silicon-carbide chips switch power far more efficiently than ordinary silicon &mdash; they're
            what high-efficiency server power supplies (HVDC, PSU) and on-board voltage regulators (VRM)
            increasingly use. As chip power climbs, demand climbs with it, but capacity is gated by the
            substrate underneath (slow crystal growth, slow yield gains), and the devices still cost
            well above plain silicon.
          </li>
          <li>
            <strong style={strong}>High-cap MLCC and IC substrates.</strong> MLCCs (multilayer ceramic
            capacitors) and IC substrates (the rigid carriers a chip is mounted on) do the filtering and
            power delivery around GPUs, CPUs and power modules. An AI server uses several times the
            capacitors a normal one does, high-end capacity is short, and expansion is slow. IC
            substrates have already taken two rounds of price increases since the start of{' '}
            <strong style={strong}>2026</strong>, with some high-end carriers up a cumulative{' '}
            <strong style={strong}>40%</strong> and another round under discussion.
          </li>
          <li>
            <strong style={strong}>Power-management ICs.</strong> The unglamorous converters and drivers
            (Texas Instruments, Infineon, MPS) that regulate voltage across the server board. They
            aren&rsquo;t AI parts at all &mdash; they&rsquo;re mature chips shared with cars and
            industrial gear &mdash; which is exactly the problem: the AI surge is grabbing capacity off
            an existing market, so lead times have stretched from a normal{' '}
            <strong style={strong}>10&ndash;12 weeks</strong> to <strong style={strong}>30&ndash;40 weeks</strong>{' '}
            (eight to nine months), with no mature domestic second source to fall back on. It&rsquo;s the
            weakest-plank bottleneck: the board can&rsquo;t ship even when every exotic part has arrived.
          </li>
        </ul>

        <SectionLabel>Layer 4 — the materials beneath the chips</SectionLabel>
        <p style={bodyStyle}>
          Go one layer deeper than the chips themselves and you hit raw materials with their own, harder
          bottlenecks.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Indium-phosphide substrate.</strong> InP wafers are the base the
            optical chips above (EML, CW lasers) are grown on. The bottleneck is upstream: high-purity
            indium is a strategic metal, and China has restricted its export to Japan &mdash; which caps
            output at major suppliers like Sumitomo. The bar on purity and uniformity is high, so few
            firms can mass-produce it. Sumitomo holds about <strong style={strong}>40%</strong> of the
            global market, AXT is second, and Chinese producers (Yunnan Germanium among them) are
            expanding.
          </li>
          <li>
            <strong style={strong}>Tungsten hexafluoride (WF6).</strong> A gas used to fill the tiny
            vertical holes and contacts in advanced chips &mdash; especially HBM (the stacked memory
            beside AI accelerators) and 3D NAND. Its demand scales directly with how tall the HBM stack
            and how many layers the NAND, supply sits with a few firms (Kanto Denka, SK Materials,
            Merck), and the contract price has climbed <strong style={strong}>six quarters in a row</strong>.
          </li>
        </ul>

        <SectionLabel>The map</SectionLabel>
        <p style={bodyStyle}>
          One table, the whole picture &mdash; the scarce inputs, where they go, and why they're stuck:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Material</th>
                <th style={thStyle}>Used in</th>
                <th style={thStyle}>Why it's scarce</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>EML chip</td><td style={tdStyle}>high-speed optical modules</td><td style={tdStyle}>few suppliers, high tech barrier, demand boom (~30% gap)</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>CW light source</td><td style={tdStyle}>silicon photonics, CPO</td><td style={tdStyle}>capacity locked to 2028; tight 3&ndash;5 years</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Pump laser</td><td style={tdStyle}>DCI links, optical amps</td><td style={tdStyle}>&gt;90% duopoly; booked toward 2029</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Faraday rotator</td><td style={tdStyle}>optical isolators</td><td style={tdStyle}>~50% one supplier; a competitive weapon; 70&ndash;80% margin</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Low-DK glass cloth</td><td style={tdStyle}>high-end PCB laminate</td><td style={tdStyle}>capacity shifted to high grades; sold out</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>HVLP4 copper foil</td><td style={tdStyle}>AI/switch PCB layers</td><td style={tdStyle}>unstable yield; 48% / 43% gap (2026 / 2027)</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>M8 / M9 CCL</td><td style={tdStyle}>AI server motherboards</td><td style={tdStyle}>process barrier + its own inputs are short</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>GaN / SiC devices</td><td style={tdStyle}>server power, VRM</td><td style={tdStyle}>substrate-limited; demand tracks chip power</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>MLCC / IC substrate</td><td style={tdStyle}>board + power filtering, packaging</td><td style={tdStyle}>usage up sharply; slow to expand</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Power-management IC</td><td style={tdStyle}>server boards (PCBA)</td><td style={tdStyle}>AI grabbing mature capacity; lead times 10&ndash;12 &rarr; 30&ndash;40 wks</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>InP substrate</td><td style={tdStyle}>EML / CW laser chips</td><td style={tdStyle}>upstream indium restricted; high purity bar</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>WF6 gas</td><td style={tdStyle}>HBM, advanced process</td><td style={tdStyle}>scales with HBM/NAND layers; concentrated supply</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>The pattern</SectionLabel>
        <p style={bodyStyle}>
          Read the table top to bottom and the same shape repeats at every layer: a part only a few
          firms can make, a process that's slow to scale, and AI demand arriving faster than anyone can
          add capacity. That's why this connects straight to the{' '}
          <Link href="/blog/nokia-dci" style={linkStyle}>Nokia / DCI</Link> story &mdash; pump lasers and
          InP substrate show up on both maps. In a build-out gated by supply, the winners aren't
          whoever has the cleverest design; they're whoever <em>owns</em> the scarce input or{' '}
          <em>locked</em> it first. Each row above is a place where that's true right now.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          An analysis piece: figures are drawn from supply-chain research (industry Q&amp;A notes and
          sell-side reports through mid-2026) and stated as the thesis, not independently re-derived.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#investing" style={{
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
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px 10px 0',
  fontFamily: 'monospace',
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
};
const trStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };
const tdLabelStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 600,
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.7)',
  verticalAlign: 'top',
  lineHeight: 1.55,
};
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
