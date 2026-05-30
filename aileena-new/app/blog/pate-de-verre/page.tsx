'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function PateDeVerreArticle() {
  return (
    <SubstackShell
      category="Craft"
      date="2026.05.30"
      tags="Glass · Pâte de Verre · Kiln · Density"
      title="Glass, Measured by Density"
      dek="Pâte de verre means 'paste of glass' — you pack colored glass powder into a mold, grain by grain, and let the kiln decide how much of it survives as a solid. The whole craft turns on one number almost nobody thinks about: density. Why a piece weighs what it weighs, where the bubbles come from, and how powder becomes that matte, sugar-lit surface. Notes from the kiln."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Start with the name, because it tells you almost everything.{' '}
          <strong style={strong}>Pâte de verre</strong> is French for <em>&ldquo;paste of glass.&rdquo;</em>{' '}
          You don&rsquo;t pour molten glass and you don&rsquo;t blow it &mdash; you take ground glass,
          somewhere between powder and fine sand, mix it with a little binder into a paste, and{' '}
          <em>pack</em> it by hand into a mold, color by color, grain by grain. Then the kiln does the
          one thing you can&rsquo;t: it heats the packed powder until the grains soften and fuse into a
          single solid body. The piece you pull out the next day is the negative of your mold and the
          record of how well you packed it.
        </p>
        <p style={bodyStyle}>
          Everyone talks about color and form. But the quiet variable running underneath the whole craft
          &mdash; the one that decides whether a piece comes out solid and luminous or chalky and full
          of holes &mdash; is <strong style={strong}>density</strong>.
        </p>

        <SectionLabel>What density actually is here</SectionLabel>
        <p style={bodyStyle}>
          Solid glass &mdash; ordinary soda-lime glass, the kind most colored fusing glass is &mdash; has
          a density of about <strong style={strong}>2.5 grams per cubic centimeter</strong> (the family
          runs roughly 2.4&ndash;2.8 depending on what oxides are in it). That is the number for glass
          with no air in it: a clean, fully-fused solid.
        </p>
        <p style={bodyStyle}>
          But you don&rsquo;t start with a solid. You start with <em>powder</em>, and powder is mostly
          air. When you pack frit into a mold, the grains touch at points and leave voids everywhere
          between them &mdash; a loose powder might be only half as dense as the solid it will become.
          So the entire firing is, in one sentence, <strong style={strong}>the controlled collapse of
          air out of a powder until what&rsquo;s left approaches the density of solid glass.</strong>{' '}
          How much air you trap on the way determines everything: the weight in your hand, the clarity,
          and whether the surface reads as sugar or as stone.
        </p>

        <SectionLabel>The grain size is a dial, not a detail</SectionLabel>
        <p style={bodyStyle}>
          Frit is sold by grade, and the grade is really a choice about density and light:
        </p>
        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Grade</th>
                <th style={thStyle}>Roughly</th>
                <th style={thStyle}>What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Powder</td><td style={tdStyle}>flour-fine</td><td style={tdStyle}>traps the most air → the matte, opaque, sugar-lit pâte-de-verre look; holds crisp color borders</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Fine frit</td><td style={tdStyle}>fine sand</td><td style={tdStyle}>packs denser, a little more translucent, still controllable by hand</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Medium / coarse</td><td style={tdStyle}>sugar → rice</td><td style={tdStyle}>fewer, larger voids → more glassy and clear, but harder to place precisely</td></tr>
            </tbody>
          </table>
        </div>
        <p style={bodyStyle}>
          The paradox of powder: it gives the <em>most</em> air and therefore the <em>least</em>
          transparency, and that is exactly why it&rsquo;s prized. Fine powder fuses into a skin of tiny
          unburst bubbles that scatter light instead of passing it &mdash; the characteristic soft,
          waxy, almost ceramic surface. You&rsquo;re not failing to remove the air; you&rsquo;re{' '}
          <em>using</em> it.
        </p>

        <SectionLabel>The paste, the mold, and packing</SectionLabel>
        <p style={bodyStyle}>
          To make the powder behave, you wet it into a paste with a dilute binder &mdash; classically{' '}
          <strong style={strong}>gum arabic</strong> in water, just enough to make the grains hold a
          shape against the mold wall without slumping. The binder is temporary scaffolding: it burns
          off cleanly long before the glass fuses, so it leaves no color and no residue, only the
          arrangement of grains it helped you set.
        </p>
        <p style={bodyStyle}>
          Packing is where density is won or lost. Press the paste into every corner; tamp it; build the
          colors in the order you want them to read, because in a mold you are working{' '}
          <em>in reverse</em> &mdash; the first powder you lay against the mold face is the surface the
          viewer eventually sees. Pack loose and you get a light, porous, fragile piece riddled with
          voids. Pack well and the same powder comes out heavier, denser, and stronger.
        </p>

        <SectionLabel>The firing — where powder becomes glass</SectionLabel>
        <p style={bodyStyle}>
          The kiln schedule is a negotiation between two enemies: you need enough heat and time for the
          grains to soften and knit, but not so much that the whole thing flows flat and loses the
          texture you packed in. A pâte-de-verre firing is essentially:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Ramp up,</strong> gently &mdash; rush it and trapped moisture or
            binder gas expands and cracks the piece.
          </li>
          <li>
            <strong style={strong}>Hold at casting heat,</strong> in the rough range of{' '}
            <strong style={strong}>1400&ndash;1550&deg;F (≈760&ndash;845&deg;C)</strong>, long enough
            for the grains to fuse and fill the mold &mdash; but a <em>sintering</em> hold (just enough
            to make grains stick, keeping texture and opacity) rather than a full melt is what preserves
            the powder character.
          </li>
          <li>
            <strong style={strong}>Anneal,</strong> the non-negotiable step: a soak around the annealing
            point followed by a <em>slow</em> cool so the whole mass releases its internal stress
            evenly. Skip it and the piece carries locked-in stress that cracks it days or weeks later,
            for no visible reason.
          </li>
        </ul>
        <p style={bodyStyle}>
          Hotter and longer drives more air out → denser, glossier, more translucent. Cooler and shorter
          keeps more air in → lighter, matte, more opaque. The dial between those is the whole
          expressive range of the medium, and it is, again, just <strong style={strong}>density</strong>.
        </p>

        <SectionLabel>Why COE is the rule you don&rsquo;t break</SectionLabel>
        <p style={bodyStyle}>
          One number governs which glasses you&rsquo;re allowed to mix: <strong style={strong}>COE</strong>,
          the coefficient of expansion &mdash; how much a glass swells when heated and shrinks when
          cooled. Fusing glass is sold in compatible families, most commonly{' '}
          <strong style={strong}>COE 90</strong> and <strong style={strong}>COE 96</strong>. Mix two
          glasses with different expansion and they cool at different rates, fight each other along
          every shared boundary, and the piece cracks &mdash; sometimes in the kiln, sometimes a month
          later on a shelf. (COE is the headline, but viscosity matters nearly as much; that&rsquo;s why
          you stay inside a single tested, compatible line rather than trusting the number alone.) It is
          the one place in this otherwise forgiving, hand-built craft where the chemistry simply will
          not negotiate.
        </p>

        <SectionLabel>Reading the pieces</SectionLabel>
        <p style={bodyStyle}>
          You can see all of this in a set of small tiles. A <strong style={strong}>Mondrian</strong>{' '}
          square &mdash; red, blue, yellow blocks caged in grey lines &mdash; only holds its crisp
          borders because powder, not coarse frit, was packed color-against-color so the grains
          wouldn&rsquo;t migrate and blur. The matte, sugary surface is unburst micro-bubbles doing their
          job. A deep <strong style={strong}>maroon</strong> tile carries a herringbone texture pressed
          in from the mold and survives the firing precisely because it was sintered, not fully melted
          &mdash; enough heat to fuse, not enough to flow the relief flat. The little air left inside is
          why it reads as a solid colored stone rather than a clear glass chip.
        </p>

        <SectionLabel>The bottom line</SectionLabel>
        <p style={bodyStyle}>
          Pâte de verre is a strange, slow medium: you build in powder and reverse, you can&rsquo;t see
          the result until the kiln cools, and the difference between a jewel and a crumb is mostly{' '}
          <em>how much air you let stay inside the glass</em>. Solid glass wants to be 2.5 grams per cc;
          your job is to decide how close to that you push it, grain by grain, degree by degree. After
          years of making things out of code &mdash; weightless, instantly undoable &mdash; there is
          something clarifying about a material whose entire character is its density, and which only
          tells you whether you got it right a full day after it&rsquo;s already too late to change.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          A craft note: temperatures and grades are stated as working ranges, not a recipe &mdash; every
          kiln, mold, and glass line behaves a little differently, and the real schedule is the one your
          own kiln teaches you.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#visual" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Visual
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
