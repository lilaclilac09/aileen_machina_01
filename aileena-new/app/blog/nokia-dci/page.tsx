'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function NokiaDciArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.05.30"
      tags="Nokia · DCI · Optical · Infinera"
      explainerHref="/blog/nokia-dci/explainer"
      title="Why Bet on Nokia"
      dek="The market for the optical gear that links data centers together is sold out. Delivery times have doubled, the incumbent's lines are booked through 2027, and the hyperscalers are tendering a year early. In a supply crunch, capacity is the moat — and after buying Infinera, Nokia is the one vendor sitting on idle lines it can sell tomorrow. Here's the case, edge by edge."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Start with the thing everyone in the room already knows but nobody can fix: you cannot buy
          enough <strong style={strong}>DCI</strong> gear right now. DCI &mdash; data-center
          interconnect &mdash; is the long-haul optical equipment that stitches data centers together,
          carrying traffic between buildings and across cities on light over fiber. The AI build-out
          has turned it into one of the hardest-to-get items in the whole infrastructure stack.
        </p>
        <p style={bodyStyle}>
          How tight is it? Lead times that used to run one to one-and-a-half years have stretched to{' '}
          <strong style={strong}>two to two-and-a-half</strong>. <strong style={strong}>Ciena</strong>,
          the long-time market leader, runs about <strong style={strong}>$3.5 billion a year</strong> of
          capacity &mdash; and it is effectively sold out, with 2027 already booked. Meanwhile Google,
          Microsoft and Meta have all raised their budgets and started tendering early to lock supply
          in. When demand runs that far ahead of supply, the usual questions (whose product is a hair
          faster? whose roadmap is prettier?) stop mattering. One question takes over:{' '}
          <strong style={strong}>who can actually deliver?</strong> That is the lens for everything
          below.
        </p>

        <SectionLabel>Edge 1 — the idle capacity nobody else has</SectionLabel>
        <p style={bodyStyle}>
          This is the decisive one. When Nokia bought <strong style={strong}>Infinera</strong> &mdash;
          a US optical-systems maker &mdash; it inherited something priceless in a sold-out market:
          large, ready-to-run, <em>idle</em> production capacity. Infinera's North American lines,
          centered in San Jose, were sitting largely unused: on the order of{' '}
          <strong style={strong}>$2.5 billion a year</strong> of capacity dark, and up to roughly{' '}
          <strong style={strong}>$4 billion</strong> if you run them hard with overtime.
        </p>
        <p style={bodyStyle}>
          In a market where everyone else is booked solid, that makes Nokia the only supplier who can
          say yes to a giant new order and ship it on a normal timeline. That is not a small
          advantage &mdash; it is <em>the</em> advantage. It is the reason Google handed Nokia the
          single biggest slice of its DCI tender, on the order of{' '}
          <strong style={strong}>50&ndash;60%</strong>. Not because the product won a feature shootout,
          but because Nokia was the one vendor that could promise the boxes would actually arrive.
        </p>

        <SectionLabel>Edge 2 — it owns its own supply chain</SectionLabel>
        <p style={bodyStyle}>
          Capacity gets you in the door; owning your inputs keeps you there. Nokia is unusually{' '}
          <strong style={strong}>vertically integrated</strong> &mdash; it makes its own critical
          parts instead of buying them. Two pieces matter most:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Its own DSP.</strong> The <strong style={strong}>DSP</strong> (digital
            signal processor) is the chip that encodes data onto the light and decodes it at the other
            end &mdash; the brain of an optical link. Nokia designs its own, now at{' '}
            <strong style={strong}>1.2 terabits</strong> per wavelength on a{' '}
            <strong style={strong}>5-nanometer</strong> process. Most rivals buy this chip from
            merchant suppliers like Broadcom or Marvell.
          </li>
          <li>
            <strong style={strong}>Its own indium-phosphide fab.</strong> Indium phosphide (InP) is the
            semiconductor the lasers themselves are built from. Nokia runs its own InP wafer fab plus
            packaging and test &mdash; so it isn't waiting in line for the photonics that go inside
            every transponder.
          </li>
        </ul>
        <p style={bodyStyle}>
          Why it matters: the single scarcest part in a DCI system right now is the DSP chip. A vendor
          that buys it on the open market is exposed to the same shortage as everyone else; a vendor
          that makes its own is not. That is a genuine supply-chain wall that Ciena and most others
          &mdash; who outsource much of their manufacturing &mdash; simply don't have. There's a real
          cost to doing it in North America: building there runs{' '}
          <strong style={strong}>70&ndash;150% more expensive</strong> than building in Asia. But in
          this window, Nokia is happy to trade margin for speed &mdash; spend more, ship now, take
          share &mdash; and optimize cost later once it has the customers. It's backing the bet with
          money, too: InP capacity is slated to expand <strong style={strong}>tenfold</strong>.
        </p>

        <SectionLabel>Edge 3 — no tech gap, and the share map just flipped</SectionLabel>
        <p style={bodyStyle}>
          A capacity story only works if the product is good enough, and here the honest read is that
          it is. There's <strong style={strong}>no meaningful technology gap</strong> between Nokia and
          Ciena. The DCI standards that matter &mdash; 400G and 800G (gigabits per second per
          wavelength) &mdash; are well settled, so any product that meets the spec is interchangeable
          on the wire. Nokia has already shown a full <strong style={strong}>1.6-terabit</strong> DCI
          solution. Parity is enough; in a sold-out market, the tiebreaker isn't the spec sheet, it's
          delivery.
        </p>
        <p style={bodyStyle}>
          And the scoreboard is already moving:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>&nbsp;</th>
                <th style={thStyle}>2025</th>
                <th style={thStyle}>2026</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Ciena</td><td style={tdStyle}>~90% of DCI &mdash; a near-monopoly</td><td style={tdStyle}>capacity-capped, ceding the increment</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Nokia</td><td style={tdStyle}>a minor player</td><td style={tdStyle}>&gt;55% of Google's DCI tender; the year's main growth story</td></tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The clearest signal came at the top line: in <strong style={strong}>Q4 2025</strong>,
          Nokia's worldwide optical-transport revenue excluding China passed Ciena's{' '}
          <em>for the first time</em>. A market that was a near-monopoly a year ago now has a second
          structural winner &mdash; and it's the one with the spare factory.
        </p>

        <SectionLabel>Where the capacity actually sits</SectionLabel>
        <p style={bodyStyle}>
          The whole thesis rests on physical lines in physical buildings, so it's worth being concrete
          about where they are:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Site</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Scale / note</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>San Jose (Infinera core)</td><td style={tdStyle}>main DCI assembly</td><td style={tdStyle}>~$2.5B/yr idle, up to ~$4B with overtime &mdash; the engine of the surge</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Mexico</td><td style={tdStyle}>companion boards</td><td style={tdStyle}>a low-end line once slated to close, kept alive by data-center demand</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>San Jose (InP fab + DSP R&amp;D)</td><td style={tdStyle}>in-house lasers + chips</td><td style={tdStyle}>the vertical-integration core; InP capacity planned to grow 10&times;</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>德科立 (China partner)</td><td style={tdStyle}>co-development + early foundry</td><td style={tdStyle}>a Chinese optical contract manufacturer; supplied the early OEM orders</td></tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          That last row carries a wrinkle worth spelling out. Nokia co-developed its DCI solution with
          a Chinese contract-manufacturing partner (德科立), which exclusively supplied the early
          foundry orders &mdash; a way to lean on Asian cost and know-how. But for the big{' '}
          <em>whole-box</em> orders going into North America, two forces push the work back to San Jose:
          US&ndash;China trade friction, and hyperscaler customers who want a <em>pure</em> North
          American supplier on the paperwork. So the marquee orders get built on Infinera's San Jose
          lines, not shipped in from China &mdash; which is exactly why the idle US capacity is the
          asset it is.
        </p>

        <SectionLabel>The risks</SectionLabel>
        <p style={bodyStyle}>
          None of this is free of catches, and the bear case writes itself from the same facts:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>The capacity dividend is finite.</strong> The whole edge is the idle
            line. Once that backlog is consumed, the scarcity premium fades and Nokia competes on more
            ordinary terms.
          </li>
          <li>
            <strong style={strong}>North American cost.</strong> Building at home costs far more than
            Asia. The premium is fine while customers will pay for delivery; if competition heats up or
            buyers push on price, margins get squeezed.
          </li>
          <li>
            <strong style={strong}>Integration risk.</strong> Absorbing Infinera &mdash; its people,
            culture and technology &mdash; is a multi-year job. Botch it and the very advantage being
            bought erodes from the inside.
          </li>
        </ul>

        <SectionLabel>The bottom line</SectionLabel>
        <p style={bodyStyle}>
          The case for Nokia isn't that it built a better box. It's that, in the narrow golden window
          where DCI demand is exploding and the incumbent is sold out, Nokia grabbed the one resource
          nobody else has &mdash; idle North American capacity, backed by a supply chain it owns
          end-to-end &mdash; and converted it straight into the majority of the year's biggest orders.
          It isn't just a new entrant in the DCI market. Under these exact conditions, it's the single
          largest structural beneficiary of the boom.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          An analysis piece: the figures here are drawn from research on the DCI supply situation and
          stated as the thesis, not independently re-derived.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#dispatch" style={{
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
