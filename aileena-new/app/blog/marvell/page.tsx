'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function MarvellArticle() {
  return (
    <SubstackShell
      category="Markets"
      date="2026.06.01"
      tags="Marvell · Optical · TIA · DSP · NPO · CPO · AI Hardware"
      title="Where Marvell Sits in the AI Optical Stack"
      dek="Marvell owns one chip in the AI optical supply chain — the TIA — and it nearly owns it alone. 80% of 800G single-mode, the only 1.6T volume player today. Above that it fights Broadcom for the DSP market and joins Amazon on NPO; below it, two of the highest-profile AI optical projects don't ship a Marvell chip at all."
      explainerHref="/blog/marvell/explainer"
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Marvell&rsquo;s entire AI story is a story about one specific layer of the optical supply
          chain &mdash; the chips between the photon and the data path &mdash; and how it owns,
          shares, or has been locked out of each box at that layer.
        </p>
        <p style={bodyStyle}>
          The simplest summary the rest of this piece backs up: <strong style={strong}>Marvell
          owns the TIA layer almost outright</strong>, especially at 1.6T. It fights Broadcom for
          the DSP market and is currently losing the non-Nvidia tranche of it. It co-supplies the
          white-box switch silicon CSPs use to dodge Nvidia. It is a co-architect of the next-gen
          NPO route. And it is conspicuously{' '}
          <em>absent</em> from two of the highest-profile AI optical builds &mdash; Google&rsquo;s
          2.4T coherent program and the Nvidia&ndash;TSMC 3.2T CPO main line. Walking through each:
        </p>
        <p style={bodyStyle}>
          Companion pieces:{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>{' '}
          (the cage layer above this one) and{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link> (the broader scarcity map).
        </p>

        <SectionLabel>What a TIA is, in one paragraph</SectionLabel>
        <p style={bodyStyle}>
          A <strong style={strong}>TIA</strong> &mdash; transimpedance amplifier &mdash; is a small
          electrical chip sitting between two larger ones inside the receive path of an optical
          module. The fiber drops light onto a{' '}
          <strong style={strong}>PD</strong> (photodetector); the PD turns that light into a tiny
          current measured in microamps, way too weak for anything downstream to read. The TIA
          amplifies that current and converts it to a voltage signal that the{' '}
          <strong style={strong}>DSP</strong> (digital signal processor) can decode. PD &rarr; TIA
          &rarr; DSP. The TIA is the amplifier between the photon and the brain.
        </p>
        <p style={bodyStyle}>
          That position &mdash; small, deeply embedded, hard to qualify a second source for &mdash;
          is why winning the TIA socket is sticky. And it is the socket Marvell has won.
        </p>

        <SectionLabel>The TIA monopoly, by speed and by fiber type</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>800G single-mode TIA:</strong> Marvell holds about{' '}
            <strong style={strong}>80%</strong> share; Semtech the remaining <strong style={strong}>~20%</strong>.
          </li>
          <li>
            <strong style={strong}>800G multi-mode TIA:</strong> Macom holds about{' '}
            <strong style={strong}>50%</strong>; Marvell and Semtech split the other half.
          </li>
          <li>
            <strong style={strong}>1.6T TIA (current generation):</strong>{' '}
            <strong style={strong}>Marvell is the only company in volume production today.</strong>{' '}
            Macom and Semtech are still in sampling/qualification; their volume ramp is expected{' '}
            <strong style={strong}>1H 2027</strong> at the earliest.
          </li>
        </ul>
        <p style={bodyStyle}>
          Two observations land hard out of that table. First,{' '}
          <strong style={strong}>almost all of the 800G TIA growth is single-mode</strong> &mdash;
          which is exactly where Marvell is 4&times; the size of its nearest competitor. The
          incremental dollar in 800G TIA goes to Marvell. Second, the 1.6T cliff has currently
          turned into a year-plus lead: every 1.6T module that ships in 2026 ships with a Marvell
          TIA, by default. That&rsquo;s the strongest single competitive position the company has
          in the entire AI build-out.
        </p>

        <SectionLabel>The DSP slugfest with Broadcom</SectionLabel>
        <p style={bodyStyle}>
          One step down the receive path is the high-speed{' '}
          <strong style={strong}>DSP</strong>, the brain of the module: it does the equalisation,
          the FEC (forward error correction), the data conversion, the framing &mdash; everything
          the TIA hands it. At 800G and 1.6T, the DSP is a leading-edge silicon part, and the
          market for it is a two-firm contest.
        </p>
        <p style={bodyStyle}>
          Marvell and <strong style={strong}>Broadcom</strong> are the two giants. The split is not
          even. In the pluggable optical-module DSP market <em>outside</em> the Nvidia ecosystem
          (i.e. everywhere else &mdash; CSP-spec switches, white-box transceivers, the long tail),
          Broadcom holds something like <strong style={strong}>~90%</strong>. Marvell is the
          credible challenger but is materially smaller in this slice.
        </p>
        <p style={bodyStyle}>
          Both firms fight the same upstream bottleneck. The latest-generation DSPs
          (1.6T-class, leading-edge nodes) are essentially{' '}
          <strong style={strong}>TSMC 3 nm</strong> parts. Marvell and Broadcom are both squeezing
          into the same overbooked 3 nm capacity, and that capacity &mdash; not engineering &mdash;
          is what gates how many 1.6T DSPs each can ship in 2026 and 2027. The fight isn&rsquo;t
          design; it&rsquo;s allocation.
        </p>

        <SectionLabel>White-box switches — where Marvell and Broadcom both win</SectionLabel>
        <p style={bodyStyle}>
          Two competing camps are shipping the next-generation switching gear that will sit at the
          heart of CPO-class racks.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Camp 1 &mdash; Nvidia.</strong> Closed, vertically integrated,
            software-plus-hardware bundle. CSPs cannot customise it.
          </li>
          <li>
            <strong style={strong}>Camp 2 &mdash; Broadcom and Marvell.</strong> Sell{' '}
            <em>chips</em> (switch silicon plus core IP) to hyperscalers (Google, Amazon, Microsoft),
            which then build heavily customised &ldquo;white-box&rdquo; switches via JDM
            (joint-design manufacturing) and ODM (original-design manufacturing) partners.
          </li>
        </ul>
        <p style={bodyStyle}>
          The mental model:{' '}
          <strong style={strong}>a white-box switch is a bare-metal PC and Marvell/Broadcom are the
          CPU.</strong> The CSP picks the box vendor, the OS, the cabling, the cooling &mdash; but
          the switch silicon underneath has two credible suppliers, and Marvell is one of them.
          Whichever way the CSPs jump within Camp 2, the switch-chip socket is jointly defended.
          That&rsquo;s a structurally stickier position than the DSP fight upstream of it.
        </p>

        <SectionLabel>Where Marvell is absent</SectionLabel>
        <p style={bodyStyle}>
          Two named programs do not ship Marvell silicon. They&rsquo;re the two highest-profile
          builds in AI optics over the next eighteen months.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Google&rsquo;s 2.4T coherent optical module.</strong>{' '}
          A scale-across program (data-centre-to-data-centre, coherent modulation) Google is
          building for its next-generation footprint. The core DSP in this program is{' '}
          <strong style={strong}>Google&rsquo;s own</strong> &mdash; built by an in-house team
          assembled out of former Inphi engineers. Marvell is{' '}
          <em>not</em> the DSP supplier. The standard read is &ldquo;not ruled out as a second
          source later,&rdquo; which translates to: today, Marvell isn&rsquo;t in.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The Nvidia&ndash;TSMC 3.2T CPO main line.</strong>{' '}
          Nvidia is jointly developing its next-generation 3.2T CPO solution directly with TSMC.
          The reference design&rsquo;s most-integrated layers &mdash; the optical-engine package on
          the substrate &mdash; are controlled by Nvidia and TSMC. Third-party module specialists,
          Marvell included, have essentially{' '}
          <strong style={strong}>no direct seat at this layer of the main line</strong>. That
          doesn&rsquo;t kill them in CPO broadly &mdash; the rest of the ecosystem (camp 2 above)
          is the alternative &mdash; but it does mean the highest-density Nvidia CPO box is one
          where Marvell&rsquo;s native sockets (TIA, DSP) are absent or absorbed into the package.
        </p>

        <SectionLabel>NPO — Marvell as a co-architect</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>NPO</strong> (near-packaged optics) is the practical, near-term
          architecture sitting between today&rsquo;s pluggable modules and tomorrow&rsquo;s fully
          co-packaged CPO. The optical engine moves closer to the switch ASIC but doesn&rsquo;t
          fully integrate onto its substrate. It&rsquo;s the route most hyperscalers are betting on
          for the bridge generation.
        </p>
        <p style={bodyStyle}>
          NPO&rsquo;s architecture is{' '}
          <strong style={strong}>DSP-less</strong> at the optical engine. Signal recovery and
          equalisation get done instead by <strong style={strong}>SerDes</strong> (serialiser /
          deserialiser) blocks paired with enhanced drivers and TIAs. The dominant{' '}
          <strong style={strong}>SerDes-IP suppliers in the industry are Marvell and
          Broadcom.</strong> So the NPO route, even though it removes the DSP socket Marvell was
          contesting, hands Marvell a different, more deeply-embedded socket &mdash; the SerDes IP
          underneath the optical engine.
        </p>
        <p style={bodyStyle}>
          Among overseas players (i.e. excluding Alibaba, which is the most aggressive Chinese
          mover on NPO), <strong style={strong}>Marvell and Amazon</strong> are the two leading the
          NPO push. That positions Marvell on the right side of the architecture transition even if
          DSP-less designs win the next generation.
        </p>

        <SectionLabel>The shape</SectionLabel>
        <p style={bodyStyle}>
          Stacked together, the Marvell map looks like this:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Strengths:</strong> the 1.6T TIA monopoly, the 80%-share of
            800G single-mode TIA, and the SerDes-IP socket underneath NPO.
          </li>
          <li>
            <strong style={strong}>Live fights:</strong> the DSP market against Broadcom
            (with Broadcom currently dominant in non-Nvidia at ~90%) and the joint scramble for
            TSMC 3 nm capacity that gates both sides.
          </li>
          <li>
            <strong style={strong}>Conspicuous absences:</strong> Google&rsquo;s 2.4T coherent
            (Google&rsquo;s in-house DSP) and the Nvidia&ndash;TSMC 3.2T CPO main line.
          </li>
        </ul>
        <p style={bodyStyle}>
          The one-line read on Marvell&rsquo;s AI position:{' '}
          <strong style={strong}>technology lead in TIA, structural pressure in DSP, co-architect
          in NPO.</strong> The TIA monopoly buys time; the DSP fight is what gets resolved next;
          the NPO architecture decides whether the SerDes-IP socket replaces what the DSP socket
          used to be.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          Figures here are drawn from current supply-chain research (industry Q&amp;A notes and
          sell-side reports through mid-2026) and stated as the thesis, not independently
          re-derived.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Adjacent reading:{' '}
          <Link href="/blog/ai-cooling" style={linkStyle}>What&rsquo;s Cooling the AI Build-Out</Link>{' '}
          (the cage layer above this one);{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link> (broader scarcity map &mdash; including the 200G EML cliff Marvell&rsquo;s TIA
          rides on);{' '}
          <Link href="/blog/nokia-dci" style={linkStyle}>Why Bet on Nokia</Link> (the DCI layer
          Marvell&rsquo;s coherent DSP would have served).
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
