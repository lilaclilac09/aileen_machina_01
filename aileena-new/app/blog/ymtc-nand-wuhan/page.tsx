'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const references = [
  {
    label: 'SemiAnalysis — The Impending Chinese NAND Apocalypse (YMTC 128L)',
    href: 'https://newsletter.semianalysis.com/p/the-impending-chinese-nand-apocalypse-e01',
  },
  {
    label: 'SemiAnalysis — 2022 NAND Process Technology Comparison (YMTC densest 1Tb TLC)',
    href: 'https://newsletter.semianalysis.com/p/2022-nand-process-technology-comparison',
  },
  {
    label: 'SemiAnalysis — China and USA Are Officially At Economic War (YMTC / Lam ~7%)',
    href: 'https://newsletter.semianalysis.com/p/china-and-usa-are-officially-at-economic',
  },
  {
    label: 'AP — CXMT Shanghai IPO debut (Jul 2026)',
    href: 'https://apnews.com/article/cxmt-china-memory-chips-debut-shares-9cd8b79866cf4bd5ef7c1cb81215e796',
  },
  {
    label: 'Companion — Why Huawei\'s Bet Isn\'t on the Chip (CXMT as HBM variable)',
    href: '/blog/huawei-hbm',
  },
  {
    label: 'Companion — Two Supply Chains, One Bottleneck',
    href: '/blog/huawei-supply',
  },
];

export default function YmtcNandWuhanArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.07.28"
      tags="CXMT · YMTC · NAND · Wuhan · SemiAnalysis · IPO"
      title="After CXMT's IPO — Look at Wuhan"
      dek={
        <>
          Hefei just priced China&apos;s DRAM champion into the public market. The other memory city —
          Wuhan — already had a NAND story SemiAnalysis was modeling years before the Entity List.
          YMTC, Xtacking, 128L → densest 1Tb TLC, fab scale, and what sanctions changed.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          On <strong style={strong}>27 July 2026</strong>,{' '}
          <strong style={strong}>ChangXin Memory Technologies (CXMT)</strong> — China&apos;s DRAM
          champion, based in <strong style={strong}>Hefei</strong> — debuted on the Shanghai STAR
          Market. First-day trading printed a blockbuster: shares up on the order of{' '}
          <strong style={strong}>~466%</strong>, a mainland market cap that briefly made CXMT the
          most valuable China-listed company, after raising on the order of{' '}
          <strong style={strong}>$8.6B+</strong> in the IPO itself. That is a capital-markets event.
          It is also a map event.
        </p>
        <p style={bodyStyle}>
          If Hefei is where China lists <em>DRAM</em>, <strong style={strong}>Wuhan</strong> is where
          China built the other half of the memory stack: <strong style={strong}>NAND flash</strong>,
          under <strong style={strong}>Yangtze Memory Technologies Co. (YMTC)</strong>. The IPO
          headlines will keep saying &ldquo;memory.&rdquo; The useful follow-up is: which memory,
          which city, and which analyst already treated that city as a structural variable — not a
          footnote.
        </p>
        <p style={bodyStyle}>
          Short answer: <strong style={strong}>SemiAnalysis did</strong> — repeatedly, and in depth —
          from 2021 onward. This piece is the Wuhan / YMTC companion to the CXMT listing week, with
          the SemiAnalysis trail named so you can go read the primary notes.
        </p>

        <SectionLabel>Two cities, two memory products</SectionLabel>
        <p style={bodyStyle}>
          Memory is not one ticker. <strong style={strong}>DRAM</strong> (what CXMT sells) is the
          working memory of servers and phones — dense, fast, refreshed constantly.{' '}
          <strong style={strong}>NAND</strong> (what YMTC sells) is persistent storage — SSDs, phone
          flash, the cheap bits that hold the model weights and the photo library. AI pulls on both:
          HBM / DRAM near the accelerator, NAND in the storage hierarchy behind it. China&apos;s
          industrial policy built champions for each, in different provincial capitals, with
          different tool dependencies and different sanction clocks.
        </p>
        <Table
          headers={['', 'CXMT', 'YMTC']}
          rows={[
            ['City', 'Hefei (Anhui)', 'Wuhan (Hubei)'],
            ['Product', 'DRAM (DDR / LPDDR path; HBM as the open question)', '3D NAND (Xtacking)'],
            ['2026 headline', 'STAR Market IPO — public capital', 'Entity-listed since Dec 2022 — tool access'],
            ['Prior deep read here', 'Huawei HBM bottleneck variable', 'This essay + SemiAnalysis trail'],
          ]}
        />
        <p style={bodyStyle}>
          We already put CXMT inside the Ascend story: the stockpile burns down;{' '}
          <Link href="/blog/huawei-hbm" style={inlineLink}>
            Huawei&apos;s bet isn&apos;t only the chip
          </Link>
          ; domestic HBM from CXMT is the curve that decides whether the SuperPod story stays
          solvent. The IPO does not finish that curve — it finances and prices it. Wuhan is the
          parallel question for <em>bits that persist</em>.
        </p>

        <SectionLabel>What SemiAnalysis actually said about YMTC</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis (Dylan Patel&apos;s shop) did not &ldquo;mention&rdquo; YMTC in passing. From
          2021 they treated it as China&apos;s first semiconductor product that was{' '}
          <strong style={strong}>technologically competitive</strong> with the global NAND leaders —
          and then as a capacity + sanctions variable that could reprice the whole industry.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>2021 — the &ldquo;NAND apocalypse&rdquo; note.</strong>{' '}
          <em>The Impending Chinese NAND Apocalypse – YMTC 128 Layer NAND Is The First Semiconductor
          Where China Is Technologically Competitive</em> argued that YMTC&apos;s shipping 128-layer
          TLC was not a press-release layer count. TechInsights-style tear-downs, in SemiAnalysis&apos;s
          telling, showed competitive (and in some dimensions superior) density and array efficiency
          at similar layer counts. Capacity framing in that era: on the order of{' '}
          <strong style={strong}>~80k → ~100k wafers/month</strong> of competitive NAND by early
          2022, with a second fab of similar scale under construction — enough, depending on mix and
          yield, for mid-single-digit global share. The word they used for the incumbents&apos;
          problem was not &ldquo;copycat.&rdquo; It was structural.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/the-impending-chinese-nand-apocalypse-e01"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: Chinese NAND Apocalypse (SemiAnalysis)
          </a>
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>2022 — process comparison, densest shipping TLC.</strong>{' '}
          <em>2022 NAND – Process Technology Comparison, China&apos;s YMTC Shipping Densest NAND…</em>{' '}
          put YMTC in the same table as Samsung, SK Hynix, Micron, Solidigm, Kioxia, and Western
          Digital. The highlight SemiAnalysis and Angstronomics published: YMTC&apos;s{' '}
          <strong style={strong}>Xtacking 3.0</strong> was shipping the densest commercial{' '}
          <strong style={strong}>1Tb TLC</strong> at about{' '}
          <strong style={strong}>15.2 Gbit/mm²</strong>, with layer count described as &ldquo;more
          than 230&rdquo; — SemiAnalysis&apos;s belief:{' '}
          <strong style={strong}>232 layers</strong> — comparable in their write-up to Micron&apos;s
          232L class on a 6-plane / ~2.4 Gbps style architecture, and already shipping to partners.
          YMTC was coy on official layer counts; SemiAnalysis treated that coyness as sanction-aware
          disclosure management, the same genre as SMIC not advertising 7 nm.
        </p>
        <p style={bodyStyle}>
          Fab scale in that report: second fab nearly full of tools; third under construction;
          funding talk for a fourth;{' '}
          <strong style={strong}>~100k WPM per fab</strong> as the unit of expansion. Line from the
          piece that still matters after the Entity List:{' '}
          <em>they will structurally change the NAND industry</em> — if yields catch cost, and if
          tools keep arriving.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/2022-nand-process-technology-comparison"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: 2022 NAND Process Technology Comparison (SemiAnalysis)
          </a>
        </p>

        <SectionLabel>Xtacking — why the architecture mattered</SectionLabel>
        <p style={bodyStyle}>
          Conventional 3D NAND builds the peripheral CMOS and the memory array on related process
          paths that fight each other for area and thermal budget. YMTC&apos;s{' '}
          <strong style={strong}>Xtacking</strong> (hybrid bonding / wafer-to-wafer: CMOS wafer bonded
          to array wafer) is the reason SemiAnalysis kept calling the product{' '}
          <em>innovative</em>, not merely subsidized. Separate wafers → more array efficiency on the
          die → higher bit density at a given layer count. That is the mechanical reason a 128L or
          232L YMTC die could look denser than &ldquo;same layer count&rdquo; peers in the
          comparison tables.
        </p>
        <p style={bodyStyle}>
          SemiAnalysis also named the tool and IP dependencies honestly: heavy use of{' '}
          <strong style={strong}>Lam Research</strong>-class etch/deposition productivity, and
          licensed hybrid-bonding IP in the Adeia / Xperi lineage. Homegrown architecture + imported
          tool chain + state capital is the Wuhan recipe — until the import half breaks.
        </p>

        <SectionLabel>Sanctions — the other half of the model</SectionLabel>
        <p style={bodyStyle}>
          December 2022 put YMTC on the U.S. Commerce <strong style={strong}>Entity List</strong>.
          SemiAnalysis had already been writing the prequel: tool bans as the lever that stops YMTC
          expansions <em>and</em> complicates Samsung / SK Hynix NAND fabs inside China. In{' '}
          <em>China and USA Are Officially At Economic War</em>, they flagged YMTC as the biggest
          memory name on the unverified / Entity-list path and stated the equipment hit explicitly:{' '}
          <strong style={strong}>Lam Research ~7% of revenue</strong> at risk from the YMTC ban —
          the sharpest single-name equipment exposure in that write-up.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/china-and-usa-are-officially-at-economic"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: China / USA economic war overview (SemiAnalysis)
          </a>
        </p>
        <p style={bodyStyle}>
          So the 2021–2022 SemiAnalysis YMTC file has two chapters that still trade against each
          other: <strong style={strong}>(1)</strong> density and fab-scale optimism when tools flow;{' '}
          <strong style={strong}>(2)</strong> a hard stop on advanced U.S. equipment when they
          don&apos;t. Post-Entity-List YMTC is still a NAND variable — domestic SSD, handset flash,
          export share where channels remain — but the &ldquo;structurally change the industry&rdquo;
          path is now conditional on domestic tools, yield under constraint, and how much of the
          pre-ban process lead survives without Lam-class upgrades.
        </p>

        <SectionLabel>ChipBook and the tracker habit</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis&apos;s later data products (ChipBook and related trackers) kept a{' '}
          <strong style={strong}>YMTC Global Market Share Tracker</strong> in the product surface —
          export volumes and share as a living series, not a one-off apocalypse essay. That matters
          for how you read Wuhan after Hefei&apos;s IPO: CXMT is now a public equity with daily
          price discovery; YMTC remains a private / sanctioned industrial object you mostly see
          through teardown, customs, and third-party share trackers. Same memory complex. Different
          observability.
        </p>

        <SectionLabel>How to read CXMT IPO week without collapsing the map</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Do not say &ldquo;China memory&rdquo; as one bet.</strong> Hefei
            DRAM ≠ Wuhan NAND. Different process, different tools, different sanction status, different
            customer stacks.
          </li>
          <li>
            <strong style={strong}>CXMT IPO prices the DRAM / HBM ambition.</strong> It does not
            automatically fund or unlock YMTC&apos;s next etch tool. The Ascend HBM essay still
            hinges on CXMT yield — see{' '}
            <Link href="/blog/huawei-hbm" style={inlineLink}>
              David&apos;s stockpile
            </Link>
            .
          </li>
          <li>
            <strong style={strong}>YMTC&apos;s peak density story is real in the SemiAnalysis record</strong>{' '}
            — 128L competitive, then Xtacking 3.0 as densest shipping 1Tb TLC at ~15.2 Gbit/mm² /
            ~232L. Treat that as a <em>pre-ban process achievement</em>, then ask what survives
            under Entity List constraints.
          </li>
          <li>
            <strong style={strong}>Equipment is the coupling term.</strong> SemiAnalysis&apos;s Lam
            ~7% line is the reminder that Wuhan was never &ldquo;just a Chinese fab story&rdquo; —
            it was a U.S. tool P&amp;L line item until it wasn&apos;t.
          </li>
        </ul>

        <SectionLabel>Closing</SectionLabel>
        <p style={bodyStyle}>
          CXMT&apos;s listing week will dominate Chinese financial media because public markets love
          a first-day print. The analytical habit SemiAnalysis already trained for Wuhan is the one
          worth keeping: <strong style={strong}>name the process</strong>,{' '}
          <strong style={strong}>name the density</strong>, <strong style={strong}>name the WPM</strong>,{' '}
          <strong style={strong}>name the tool exposure</strong>, then update the sanctions
          boundary. Hefei went public. Wuhan still has to answer whether Xtacking-class NAND can keep
          scaling when the Lam-shaped part of the recipe is on the Entity List.
        </p>
        <p style={bodyStyle}>
          That is the map after the IPO — not a second ticker, a second city.
        </p>

        <SectionLabel>References</SectionLabel>
        <ul style={listStyle}>
          {references.map((r) => (
            <li key={r.href}>
              {r.href.startsWith('/') ? (
                <Link href={r.href} style={inlineLink}>
                  {r.label}
                </Link>
              ) : (
                <a href={r.href} target="_blank" rel="noopener noreferrer" style={inlineLink}>
                  {r.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p style={{ ...bodyStyle, marginTop: 32, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          <Link href="/dispatch" style={inlineLink}>
            Back to Dispatch
          </Link>
        </p>
      </article>
    </SubstackShell>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div style={{ margin: '28px 0 36px', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(0,255,234,0.75)',
                  borderBottom: '1px solid rgba(0,255,234,0.25)',
                  padding: '8px 12px 10px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '12px 14px 12px 0',
                    verticalAlign: 'top',
                    color: j === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    fontWeight: j === 0 ? 500 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.45em',
        color: '#00ffea',
        textTransform: 'uppercase',
        marginBottom: 20,
        marginTop: 56,
        opacity: 0.8,
      }}
    >
      {children}
    </p>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
