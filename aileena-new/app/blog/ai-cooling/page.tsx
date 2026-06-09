'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function AiCoolingArticle() {
  return (
    <SubstackShell
      category="Markets"
      date="2026.06.01"
      tags="AI Hardware · Cooling · Optical · Supply Chain · Semis"
      title="What's Cooling the AI Build-Out"
      dek="Optical modules hit a thermal cliff at 20 watts. Above it, only liquid cooling works — and one company has the patents. Here's the path of heat through a 1.6T module, the suppliers who profit at each layer, and the one ceramic that could rewrite the whole market."
      explainerHref="/blog/ai-cooling/explainer"
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          A 1.6 terabit-per-second optical module &mdash; the part that turns electrical bits into
          light bouncing through a fiber inside an AI server &mdash; dissipates{' '}
          <strong style={strong}>about 20 watts</strong> of waste heat into a metal cage roughly
          the size of a USB stick. Above that threshold, air can&rsquo;t carry the heat off fast
          enough. Below it, air is fine. <strong style={strong}>One number, 20 W, bisects the
          entire cooling industry.</strong>
        </p>
        <p style={bodyStyle}>
          This piece is the path of that 20 watts: what the two cooling architectures actually do,
          which AI buyer picked which one and why, the supplier list at each layer, and the one
          materials story that could turn the whole stack upside down by 2H 2027.
        </p>
        <p style={bodyStyle}>
          Companion piece to{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running
          Out Of</Link> &mdash; same supply chain, different layer.
        </p>

        <SectionLabel>The thermal cliff at 20 watts</SectionLabel>
        <p style={bodyStyle}>
          Optical modules have used <strong style={strong}>air cooling</strong> forever. A copper
          heat sink, a small fan, ambient airflow across the module&rsquo;s cage &mdash; done. It
          works up to roughly <strong style={strong}>16 W</strong> of dissipation, where the heat
          sink&rsquo;s surface area can shed enough heat into the airstream.
        </p>
        <p style={bodyStyle}>
          Between 16 and 20 W you&rsquo;re in the gray zone. The module&rsquo;s still running, but
          the laser is operating outside its thermal sweet spot, the bit-error rate creeps up, and
          the effective line rate drops. In a 1.6T-spec module on air, the haircut shows up as
          roughly <strong style={strong}>1.4T</strong> of useful throughput &mdash; a{' '}
          <strong style={strong}>12.5%</strong> efficiency loss you pay for cooling you can&rsquo;t
          actually do.
        </p>
        <p style={bodyStyle}>
          Past 20 W there is no gray zone. The laser drifts off-channel, error rates spike, the
          link doesn&rsquo;t come up. So a 1.6T module at full rate{' '}
          <strong style={strong}>must</strong> be liquid-cooled.
        </p>
        <p style={bodyStyle}>
          &ldquo;Liquid cooling&rdquo; here isn&rsquo;t water sloshing around the optics. It&rsquo;s
          a precision assembly: a metal <strong style={strong}>cage</strong> machined to mate to the
          module&rsquo;s hot top surface, a <strong style={strong}>cold plate</strong> with internal
          microchannels, and quick-disconnect couplers routing a dielectric coolant in and out. Same
          module, full <strong style={strong}>1.6T</strong> rate. That&rsquo;s the cliff. That&rsquo;s
          the entire cooling story.
        </p>

        <SectionLabel>Who picked what, and why density decided it</SectionLabel>
        <p style={bodyStyle}>
          Two buyer archetypes, two answers.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Nvidia &mdash; 100% liquid.</strong> The Rubin platform shipping
            through 2026 and into 2027 is built around extreme rack density: Nvidia&rsquo;s
            reference design packs <strong style={strong}>72 GPUs per rack</strong>, sometimes more.
            The optical layer connecting them is correspondingly dense. At that density the
            rack-level photon-side dissipation is into the kilowatts &mdash; air doesn&rsquo;t even
            try. Nvidia spec&rsquo;d liquid end-to-end, and the entire vendor stack lined up because
            Nvidia is the volume buyer.
          </li>
          <li>
            <strong style={strong}>CSPs (Google, Amazon, Meta) &mdash; mixed.</strong> Hyperscalers
            run their own rack designs. They cluster around{' '}
            <strong style={strong}>32 GPUs (or custom accelerator count) per rack</strong> &mdash;
            about half Nvidia&rsquo;s density &mdash; so the per-module thermal envelope can sit in
            the 14&ndash;18 W band and a lot of their 1.6T deployments stay on air.{' '}
            <strong style={strong}>Google&rsquo;s 1.6T liquid-cooling penetration is around 20%</strong>:
            liquid only where they&rsquo;re pushing density on a specific workload; the rest is air.
          </li>
        </ul>
        <p style={bodyStyle}>
          The generalization is clean.{' '}
          <strong style={strong}>Whoever owns their own rack design picks &agrave; la carte;
          whoever buys Nvidia gets liquid.</strong> And as Nvidia takes a larger share of AI
          accelerator shipments, the liquid-cooling supply chain drags the broader market with it.
        </p>

        <SectionLabel>Where the cage gets built — the Amphenol monopoly</SectionLabel>
        <p style={bodyStyle}>
          The liquid-cooling cage is the part of the assembly that touches the optical module
          itself &mdash; machined metal, internal coolant channels, integrated couplers and seals.
          It is mechanically critical and patented heavily.
        </p>
        <p style={bodyStyle}>
          In 2026, <strong style={strong}>Amphenol</strong> holds dominant share of the
          switch-side liquid-cooling cage market &mdash; close to monopoly, driven by a portfolio
          of core patents on the cage geometry and the coupler interface. Nvidia&rsquo;s reference
          designs ship Amphenol cages by default. Google&rsquo;s liquid deployments use a slim
          shortlist &mdash; Amphenol, TE, and Molex &mdash; with Amphenol the senior partner.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>TE Connectivity</strong> is the credible second. It&rsquo;s been
          ramping liquid-cage capacity through 2025 and 2026, and the consensus through-2027
          projection has it reaching <strong style={strong}>parity with Amphenol</strong> in
          switch-side liquid cooling. That&rsquo;s a real structural move: a market that today
          looks like a monopoly resolves into a duopoly inside eighteen months. It is the single
          most-interesting power shift in this layer of the stack.
        </p>

        <SectionLabel>Where the parts get stamped — the tier-2 beneficiaries</SectionLabel>
        <p style={bodyStyle}>
          Behind Amphenol and TE sits a layer of contract manufacturers that actually produce the
          cold plates, the cage bodies, and the assembled subcomponents. This is where the supply
          chain quietly redistributes upside.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Dintech (鼎通科技)</strong> is the largest single beneficiary
            today. It&rsquo;s the core structural-parts supplier to <em>both</em> Amphenol and TE
            &mdash; meaning whichever side of the looming duopoly wins, Dintech gets paid. Its
            1.6T-driven order book has expanded rapidly through 2026.
          </li>
          <li>
            <strong style={strong}>Sunway Communication (硕贝德)</strong> supplies cold plates and
            other structural parts to TE. Smaller share than Dintech, but growing into the TE-side
            build-out.
          </li>
          <li>
            <strong style={strong}>Yidong Electronics (奕东电子)</strong> is currently a minor TE
            supplier, expected to be qualified into the broader supply chain through{' '}
            <strong style={strong}>2027</strong>.
          </li>
        </ul>
        <p style={bodyStyle}>
          The thing to notice:{' '}
          <strong style={strong}>the tier-1 connector makers own the IP and the customer
          relationship; the tier-2 contract manufacturers own the actual capacity.</strong> When
          demand spikes &mdash; as it did when 1.6T deployments started cliff-jumping into liquid
          cooling in 2026 &mdash; it&rsquo;s the tier-2 manufacturers whose revenue moves first and
          biggest, because the tier-1s can&rsquo;t physically expand their own production fast
          enough.
        </p>

        <SectionLabel>Unit economics</SectionLabel>
        <p style={bodyStyle}>
          A single <strong style={strong}>2 &times; 8 liquid-cooling cage assembly</strong>{' '}
          &mdash; eight columns wide, two rows deep, sixteen module slots &mdash; sells at up to{' '}
          <strong style={strong}>&yen;1,800</strong> (roughly{' '}
          <strong style={strong}>$250</strong> at current FX). That&rsquo;s the assembly price; the
          raw structural parts going into it cost a fraction of that, which is where Amphenol and
          TE keep their gross-margin headroom.
        </p>
        <p style={bodyStyle}>
          The per-rack arithmetic isn&rsquo;t small. Multiply by the number of cage assemblies in a
          Nvidia Rubin-class rack and by the number of racks compounding through the Rubin
          generation &mdash; and that&rsquo;s before any of the higher-priced components above the
          cage (CDUs, manifolds, rack-level plumbing). The cooling stack&rsquo;s revenue line moves
          with rack count, and rack count is exactly what is compounding right now.
        </p>

        <SectionLabel>The CPO threat — what could erase this whole market</SectionLabel>
        <p style={bodyStyle}>
          The clean threat to everything above is{' '}
          <strong style={strong}>CPO</strong> (co-packaged optics). The pluggable module
          disappears; the optical engine moves onto the same substrate as the switch ASIC. No cage,
          no faceplate, no swappable transceiver &mdash; the optical layer becomes part of the
          switch chip.
        </p>
        <p style={bodyStyle}>
          If CPO ships at scale, the entire pluggable-module liquid-cooling stack &mdash;
          Amphenol&rsquo;s near-monopoly, TE&rsquo;s catch-up, Dintech&rsquo;s order book &mdash;{' '}
          <em>goes to zero</em>. The optical heat moves onto the ASIC and gets cooled by the same
          cold plate that&rsquo;s already there for the switch silicon. Everyone above suddenly has
          no line item.
        </p>
        <p style={bodyStyle}>
          The current consensus is that CPO is a <strong style={strong}>2027&ndash;2028</strong>{' '}
          commercial story rather than a 2026 one. Nvidia&rsquo;s roadmap has CPO surfacing on
          specific high-density links before the end of the decade, not as a wholesale replacement
          yet. But it is the one shift that <em>erases</em> rather than reshuffles the cooling-stack
          winners &mdash; which makes it the single most-watched variable in this market.
        </p>

        <SectionLabel>The wildcard — Coherent's diamond-particle ceramic</SectionLabel>
        <p style={bodyStyle}>
          A very different lever sits at <strong style={strong}>Coherent</strong> &mdash; the
          materials company best known on this site for its near-monopoly on Faraday rotators in
          the optical isolator market (covered in{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running Out
          Of</Link>). Its quieter <strong style={strong}>Engineered Materials</strong> division has
          developed a <strong style={strong}>diamond-particle composite silicon-carbide ceramic</strong>{' '}
          with two stand-out numbers:
        </p>
        <ul style={listStyle}>
          <li>
            Thermal conductivity is roughly <strong style={strong}>2&times;</strong> that of copper.
          </li>
          <li>
            Weight is around <strong style={strong}>60%</strong> of copper.
          </li>
        </ul>
        <p style={bodyStyle}>
          Used as a heat spreader, baseplate, or custom cold plate, it drops the{' '}
          <em>chip&rsquo;s</em> operating temperature by about <strong style={strong}>15&deg;C</strong>{' '}
          at fixed dissipation. That is a huge thermal headroom in an industry that prices
          throughput in single-digit-celsius margins.
        </p>
        <p style={bodyStyle}>
          It is independent of the cage / cold-plate stack above. It is independent of CPO. It
          bolts onto whichever cooling architecture wins. Coherent expects meaningful revenue
          contribution to begin in <strong style={strong}>the second half of 2027</strong>{' '}
          &mdash; entirely incremental, no displacement risk, owned end-to-end by Coherent.
        </p>
        <p style={bodyStyle}>
          It is worth tracking specifically because it is one of very few stories in
          cooling-adjacent hardware that doesn&rsquo;t get unmade by the CPO transition. Whoever
          ends up cooling the chip will want better materials; this is the better material.
        </p>

        <SectionLabel>The shape</SectionLabel>
        <p style={bodyStyle}>
          Pull back, and the cooling stack today is a four-layer Pareto:
        </p>
        <ol style={listStyle}>
          <li>
            <strong style={strong}>The buyer.</strong> Air or liquid by rack density. Nvidia:
            liquid. CSPs: mixed.
          </li>
          <li>
            <strong style={strong}>The cage maker.</strong> Near-monopoly in 2026 (Amphenol),
            credibly turning into a duopoly by 2027 (Amphenol + TE).
          </li>
          <li>
            <strong style={strong}>The structural-parts contractor.</strong> Sees demand first and
            captures upside hardest (Dintech, then Sunway, then Yidong).
          </li>
          <li>
            <strong style={strong}>The wildcards.</strong> Coherent&rsquo;s diamond ceramic
            (additive, 2H 2027) and CPO (subtractive, 2027&ndash;2028).
          </li>
        </ol>
        <p style={bodyStyle}>
          The most interesting question isn&rsquo;t who wins the cage market &mdash; it&rsquo;s
          whether the cage market still exists in three years. If CPO ships at scale, Amphenol, TE,
          and Dintech all lose their best line item simultaneously. If it doesn&rsquo;t, the current
          Pareto holds for another hardware cycle and the tier-2 contractors keep compounding.
          Either way, the people paying $250 a cage today aren&rsquo;t pricing in the binary risk
          above them &mdash; which is why the story is worth tracking on its own.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          Figures here are drawn from current supply-chain research (industry Q&amp;A notes and
          sell-side reports through mid-2026) and stated as the thesis, not independently
          re-derived.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Adjacent reading:{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>What AI Hardware Is Running
          Out Of</Link> (the broader scarcity map &mdash; Coherent&rsquo;s Faraday rotators and
          the 200G EML cliff are in there);{' '}
          <Link href="/blog/nokia-dci" style={linkStyle}>Nokia / DCI</Link> (the inter-data-center
          link layer that feeds these modules).
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
