'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const references = [
  {
    label: 'Advantest IR — investors hub',
    href: 'https://www.advantest.com/en/investors/',
  },
  {
    label: 'Advantest — Revision of Earnings Forecast (2026-07-29 PDF)',
    href: 'https://www.advantest.com/en/news/2026/qnpuno0000000cqk-att/E_Info_20260729.pdf',
  },
  {
    label: 'The Elec — Advantest CY2026 tester TAM $13–14.5B / SoC / Memory bands',
    href: 'https://www.thelec.net/news/articleView.html?idxno=12645',
  },
  {
    label: 'Teradyne — Q2 FY2026 results EX-99.1 (SEC)',
    href: 'https://www.sec.gov/Archives/edgar/data/97210/000119312526321933/ter-ex99_1.htm',
  },
  {
    label: 'Teradyne — Q2 FY2026 earnings call transcript',
    href: 'https://www.roic.ai/quote/TER/transcripts/2026-year/2-quarter',
  },
  {
    label: 'ASE Technology — Q2 2026 Form 6-K (SEC)',
    href: 'https://www.sec.gov/Archives/edgar/data/1122411/000095010326011351/dp250868_6k.htm',
  },
  {
    label: 'ASE — Q2 2026 earnings call transcript ($1.7B equip / $804M test)',
    href: 'https://www.fool.com/earnings/call-transcripts/2026/08/07/ase-asx-q2-2026-earnings-call-transcript/',
  },
  {
    label: 'SemiAnalysis X — Taiwan test consumables / ATE / ASE thread cluster (2026-08-06)',
    href: 'https://pulseaugur.com/cluster/186361-semiconductor-test-demand-surges-suppliers-revise-market-estimates-upwards-6',
  },
  {
    label: 'Companion — The Memory Tax Moves',
    href: '/blog/memory-tax',
  },
  {
    label: "Companion — Why Huawei's Bet Isn't on the Chip",
    href: '/blog/huawei-hbm',
  },
  {
    label: 'Companion — Concepts You Think You Know (memory / PCB / GPU basics)',
    href: '/blog/semi-basics-review',
  },
  {
    label: 'Companion — Test Tape (price patterns; not advice)',
    href: '/blog/test-tape',
  },
];

export default function TestSecondLegArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.08.09"
      tags="ATE · OSAT · HBM · probe cards · Advantest · Teradyne · ASE · SemiAnalysis · Taiwan"
      title="The Second Leg Is Memory Test"
      dek={
        <>
          SemiAnalysis says Taiwan test consumables are roaring — and that sustainability lives one
          layer up. July–August prints from Advantest, Teradyne, and ASE give that claim receipts.
          SoC is the first leg. Memory (HBM-heavy) is the stack.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          This site already tracks the memory wall from the Huawei and wafer side:{' '}
          <Link href="/blog/huawei-hbm" style={inlineLink}>
            the bet isn&apos;t the chip
          </Link>
          ,{' '}
          <Link href="/blog/memory-tax" style={inlineLink}>
            the memory tax moves
          </Link>
          , and{' '}
          <Link href="/blog/cxmt-yield-watch" style={inlineLink}>
            CXMT HBM yield
          </Link>
          . This piece is not a rewrite of those clocks. It is the{' '}
          <strong style={strong}>test-stack layer</strong> — who sells the machines, who installs
          them, and who burns the probe cards and sockets when AI and HBM make every insertion
          longer and more expensive.
        </p>
        <p style={bodyStyle}>
          The claim in one line: consumable heat is real; it is durable only if{' '}
          <strong style={strong}>ATE TAM</strong> and <strong style={strong}>OSAT test installs</strong>{' '}
          stay hot — and the latest filings say they are.
        </p>

        <SectionLabel>What is already ours — and what is new</SectionLabel>
        <Table
          headers={['Piece', 'Owns', 'Does not own']}
          rows={[
            [
              'Huawei HBM',
              'Stockpile burn vs CXMT stacks',
              'ATE / OSAT / probe-card receipts',
            ],
            [
              'Memory Tax',
              'Wafer → substrate → cycle (Semi threads)',
              'Who pays for longer HBM / AI test time',
            ],
            [
              'CXMT Yield Watch',
              'Dated yield / stack ledger',
              'Taiwan consumable sustainability',
            ],
            [
              'This piece',
              'ATE + OSAT receipts → second-leg logic',
              'A TW monthly revenue time series (method only)',
            ],
          ]}
        />

        <SectionLabel>Public vs proprietary</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis&apos;s August 2026 thread starts from their{' '}
          <strong style={strong}>Taiwan test consumable trackers</strong> — probe cards, load
          boards, final-test sockets. Those trackers are supply-chain work product. We do not
          pretend to have their spreadsheet.
        </p>
        <p style={bodyStyle}>
          What we can do — and what Semi themselves tell you to do — is look{' '}
          <strong style={strong}>one layer up</strong>. Official Advantest TAM bands, Teradyne
          memory dollars and book-to-bill, ASE test equipment capex and tester count. On the open
          Taiwan side, monthly revenue for MPI (6223), WinWay (6515), CHPT (6510), and Yongzhi
          (6683) is the proxy for whether consumable heat is still printing in public.
        </p>
        <Callout>
          <strong style={strong}>Discipline.</strong> SemiAnalysis midpoints ($2.75B memory /
          $11B SoC) are a paraphrase of Advantest&apos;s official ranges. We cite the ranges
          first. Their “~2× prior peak” framing of ASE test spend is consistent with the $804M
          print — it is not a separate line on the 6-K.
        </Callout>

        <SectionLabel>Receipt 1 — Advantest CY2026 tester TAM</SectionLabel>
        <p style={bodyStyle}>
          Late July 2026: Advantest raised the calendar-year 2026 semiconductor tester market to
          its largest-ever band — driven by rising volumes and complexity in AI-related devices,
          with inference demand running ahead of the April view.
        </p>
        <Table
          headers={['Bucket', 'Official Jul range', 'SemiAnalysis midpoint', 'Vs April']}
          rows={[
            [
              'Total tester TAM',
              '$13.0–14.5B',
              '—',
              '~+19% at mid vs $10.9–12.2B',
            ],
            [
              'SoC testers',
              '$10.5–11.5B',
              '$9.1B → $11.0B (+21%)',
              'Mid sits inside the official band',
            ],
            [
              'Memory testers',
              '$2.5–3.0B',
              '$2.45B → $2.75B (+12%)',
              'Mid $2.75B inside $2.5–3.0B',
            ],
          ]}
        />
        <p style={bodyStyle}>
          SoC is still roughly four times memory. That ratio is the point of the second-leg
          story: memory does not need to overtake SoC to matter — it needs to{' '}
          <strong style={strong}>stack</strong> on top of an already elevated SoC install base.
        </p>

        <SectionLabel>Receipt 2 — Teradyne Q2 FY2026</SectionLabel>
        <p style={bodyStyle}>
          Teradyne&apos;s Semiconductor Test print is the other thermometer. Q2 Semi Test revenue{' '}
          <strong style={strong}>$1.122B</strong> (+128% YoY): SoC{' '}
          <strong style={strong}>$843M</strong>, memory <strong style={strong}>$212M</strong>, IST{' '}
          <strong style={strong}>$67M</strong>. Memory is a third consecutive quarter above{' '}
          <strong style={strong}>$200M</strong>, with HBM and DRAM strength plus a NAND final-test
          rebound. Management: memory book-to-bill <strong style={strong}>&gt;2</strong>; 2026
          memory TAM <strong style={strong}>&gt;40%</strong> larger than 2025, weighted to the
          second half.
        </p>
        <Table
          headers={['Line', 'Print', 'Note']}
          rows={[
            ['Company revenue', '$1.329B', '+104% YoY'],
            ['Semi Test', '$1.122B', '+128% YoY'],
            ['SoC / Memory / IST', '$843M / $212M / $67M', 'Inside Semi Test'],
            ['Compute share of SoC', '~70%', 'AI accelerators / CPU / networking'],
            ['Memory B/B', '>2', 'Capacity adds further out in time'],
            ['2026 memory TAM view', '>40% vs 2025', 'Mgmt; H2 weighted'],
          ]}
        />
        <Callout>
          <strong style={strong}>Nuance that matters.</strong> Recent ATE revenue acceleration is
          still mostly SoC / compute-driven. SemiAnalysis&apos;s punchline: a memory up-leg would
          not replace that SoC wave — it would stack a second demand pulse onto probe cards,
          boards, and sockets already busy on AI logic.
        </Callout>

        <SectionLabel>Receipt 3 — ASE Q2 test capex and installs</SectionLabel>
        <p style={bodyStyle}>
          Semi calls ASE the cleanest OSAT tell. The filing backs the dollar level. Q2 machinery
          and equipment capital expenditures about <strong style={strong}>$1.7B</strong>, of which{' '}
          <strong style={strong}>$804M</strong> in testing (packaging ~$840M). Tester count{' '}
          <strong style={strong}>8,348</strong> at quarter-end — up from{' '}
          <strong style={strong}>7,585</strong> in Q1 and <strong style={strong}>6,797</strong> a
          year earlier. Full-year 2026 capex raised again to{' '}
          <strong style={strong}>$10.5B</strong> from $8.5B.
        </p>
        <Table
          headers={['Metric', '2Q26', '1Q26', '2Q25']}
          rows={[
            ['Test equipment capex', '$804M', '—', '—'],
            ['# Testers', '8,348', '7,585', '6,797'],
            ['2026 total capex guide', '$10.5B', 'was $8.5B', '—'],
          ]}
        />
        <p style={bodyStyle}>
          Secondary OSAT context (not the Semi thread&apos;s primary chart): ASE, Powertech, and
          KYEC sit in a record Taiwan OSAT capex band for 2026; KYEC and Powertech each raised
          toward NT$50B paths focused on AI test / advanced packaging. Those names confirm the
          install wave is not ASE-only — ASE remains the cleanest single tell.
        </p>

        <SectionLabel>Three-layer stack</SectionLabel>
        <p style={bodyStyle}>
          Capital goods → install base → high-turn consumables. Watch upstream first. Trade
          (or trust) downstream last.
        </p>
        <Table
          headers={['Layer', 'Who', 'What you watch']}
          rows={[
            [
              'Upstream — ATE',
              'Advantest · Teradyne',
              'TAM bands, memory B/B, SoC vs memory mix',
            ],
            [
              'Mid — OSAT',
              'ASE (primary) · KYEC · Powertech',
              'Test equipment $ · # testers · capacity language',
            ],
            [
              'Downstream — consumables',
              'Probe cards · load/DUT boards · sockets',
              'TW monthly rev + capacity / order visibility',
            ],
          ]}
        />
        <Table
          headers={['Consumable', 'Global / memory-heavy', 'Taiwan AI interface']}
          rows={[
            [
              'Probe cards',
              'FormFactor · Technoprobe · MJC · JEM',
              'MPI (6223) · CHPT (6510) · WinWay probe',
            ],
            [
              'Load / DUT boards',
              'Specialist PCB houses',
              'CHPT · Yongzhi (6683)',
            ],
            [
              'Final-test sockets',
              'Yamaichi · LEENO · Enplas · ISC',
              'WinWay (6515) — HyperSocket / SLT',
            ],
          ]}
        />

        <SectionLabel>HBM overlay — two pins, one cycle</SectionLabel>
        <p style={bodyStyle}>
          HBM stack and base-die wafer test lean on <strong style={strong}>memory ATE</strong>{' '}
          and memory-oriented probe (FormFactor SmartMatrix-class, MJC, JEM). GPU / ASIC packages
          with HBM on CoWoS pull <strong style={strong}>logic probe cards</strong>, high-power
          sockets, and high-layer boards — the Taiwan interface complex next to TSMC and ASE.
        </p>
        <p style={bodyStyle}>
          Same capex cycle. Different pin. That is why Semi can say Taiwan consumables are hot
          while Advantest still shows SoC TAM several times memory: the SoC leg buys the
          machines and burns logic interfaces; the memory leg, if it keeps printing, adds HBM
          intensity on top.
        </p>
        <p style={bodyStyle}>
          For the vocabulary under those words — cache vs DRAM vs HBM, PCB as factory object,
          GPU as parallel machine — see{' '}
          <Link href="/blog/semi-basics-review" style={inlineLink}>
            Concepts You Think You Know
          </Link>
          .
        </p>

        <SectionLabel>How to re-test</SectionLabel>
        <Table
          headers={['Step', 'Source', 'Fail condition']}
          rows={[
            [
              '1. ATE still hot',
              'Next Advantest TAM / Teradyne memory B/B',
              'Memory cools while SoC rolls over',
            ],
            [
              '2. OSAT still installing',
              'ASE test equip. $ and # testers',
              'Test capex normalizes while LEAP-only stays loud',
            ],
            [
              '3. Then consumables',
              '6223 / 6515 / 6510 / 6683 monthly + util',
              'ATE/OSAT stay hot but TW interfaces stall (share loss / overbuild)',
            ],
          ]}
        />
        <Callout>
          <strong style={strong}>Risk.</strong> If SoC demand digests before the memory second
          leg arrives — or if Taiwan capacity overshoots — consumable utilization can dip even
          while the long structural story (longer AI / HBM test time, higher ASP, faster tip
          wear) remains intact. This is a structural watch, not a two-week trade memo. For how
          these names have traded around the receipts — spike, fade, re-accel — see{' '}
          <Link href="/blog/test-tape" style={inlineLink}>
            Test Tape
          </Link>{' '}
          (not advice).
        </Callout>

        <SectionLabel>Bottom line</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis said look up the chain. The chain answered. Advantest raised the tester
          market into the teens of billions. Teradyne&apos;s memory book is over two with a
          record $212M quarter. ASE spent about $804M on test equipment in a single quarter and
          added hundreds of testers. The second leg is memory test — not instead of SoC, on top
          of it.
        </p>
        <p style={bodyStyle}>
          If you only remember one firewall:{' '}
          <strong style={strong}>tracker heat ≠ filing receipt</strong>. Verify ATE and ASE
          first. If you only remember one open cell: Taiwan monthly revenue for the interface
          names — method stated, series not invented here.
        </p>

        <SectionLabel>References</SectionLabel>
        <ul style={listStyle}>
          {references.map((r) => (
            <li key={r.href} style={{ marginBottom: 10 }}>
              <a
                href={r.href}
                style={inlineLink}
                target={r.href.startsWith('http') ? '_blank' : undefined}
                rel={r.href.startsWith('http') ? 'noreferrer' : undefined}
              >
                {r.label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 56 }}>
          <Link
            href="/#dispatch"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.35em',
              color: 'rgba(255,255,255,0.35)',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            ← Back to Archive
          </Link>
        </div>
      </article>
    </SubstackShell>
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

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderLeft: '2px solid rgba(0,255,234,0.45)',
        padding: '16px 20px',
        marginBottom: 28,
        background: 'rgba(0,255,234,0.04)',
      }}
    >
      <p style={{ ...bodyStyle, marginBottom: 0 }}>{children}</p>
    </div>
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
    <div style={{ overflowX: 'auto', marginBottom: 28 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
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
                    padding: '12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: j === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    verticalAlign: 'top',
                    lineHeight: 1.55,
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

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(0,255,234,0.35)',
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
