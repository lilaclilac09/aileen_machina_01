'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const references = [
  {
    label: 'SemiAnalysis X — HBM wafer capacity (2026-03-04)',
    href: 'https://x.com/SemiAnalysis_/status/2029286002745819255',
  },
  {
    label: 'SemiAnalysis X — SPHBM4 / JESD330-4 (2026-07-03)',
    href: 'https://x.com/SemiAnalysis_/status/2073036634094784720',
  },
  {
    label: 'SemiAnalysis X — CXMT deep + supercycle (2026-06-30)',
    href: 'https://x.com/SemiAnalysis_/status/2071767487662768547',
  },
  {
    label: 'SemiAnalysis X — CXMT IPO (2026-07-27)',
    href: 'https://x.com/SemiAnalysis_/status/2081749011745137090',
  },
  {
    label: 'SemiAnalysis — China’s CXMT Is Set to Challenge DRAM Incumbents',
    href: 'https://newsletter.semianalysis.com/p/chinas-cxmt-is-set-to-challenge-dram',
  },
  {
    label: 'Companion — Why Huawei\'s Bet Isn\'t on the Chip',
    href: '/blog/huawei-hbm',
  },
  {
    label: 'Companion — Two Supply Chains, One Bottleneck',
    href: '/blog/huawei-supply',
  },
  {
    label: 'Companion — Next IPO Is Wuhan (YMTC)',
    href: '/blog/ymtc-nand-wuhan',
  },
];

export default function MemoryTaxArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.08.06"
      tags="HBM · DRAM · SPHBM4 · CXMT · substrate · SemiAnalysis · Memory Wall · Huawei"
      title="The Memory Tax Moves"
      dek={
        <>
          Three SemiAnalysis threads. One naming trap. The tax on AI memory does not stay on the
          GPU — it moves from <strong>wafer</strong> to <strong>substrate</strong> to{' '}
          <strong>who still cannot print stacks</strong>. None of that resets Huawei&apos;s
          countdown.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          This site already has the Huawei chapters:{' '}
          <Link href="/blog/huawei-hbm" style={inlineLink}>
            the bet isn&apos;t the chip
          </Link>
          , and{' '}
          <Link href="/blog/huawei-supply" style={inlineLink}>
            two supply chains meet at HBM
          </Link>
          . This piece is not a rewrite of either. It is the{' '}
          <strong style={strong}>memory-industry layer</strong> those pieces assume — filed from
          SemiAnalysis public X threads we ingested in August 2026, plus a naming firewall the
          industry keeps collapsing.
        </p>
        <p style={bodyStyle}>
          The claim in one line: <strong style={strong}>the memory tax moves</strong>. It does not
          disappear. Follow where it lands, and you stop mixing three different escapes into one
          headline.
        </p>

        <SectionLabel>What is already ours — and what is new</SectionLabel>
        <Table
          headers={['Piece', 'Owns', 'Does not own']}
          rows={[
            [
              'Huawei HBM',
              'Stockpile burn vs CXMT ~2M stacks',
              'Wafer math / SPHBM4 / substrate boom',
            ],
            [
              'Huawei supply',
              'PCB closed vs open; B300 survey shares',
              'Why HBM bits cost so many wafers',
            ],
            [
              'YMTC Wuhan',
              'NAND / capital / stigma',
              'HBM supply for Ascend',
            ],
            [
              'This piece',
              'Tax moves: wafer → substrate → cycle',
              'A new CXMT monthly yield series (still open)',
            ],
          ]}
        />

        <SectionLabel>Tax 1 — Wafer: why HBM eats commodity DRAM</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis&apos;s March 2026 thread is the clearest public explanation we have filed
          for why HBM demand tightens vanilla DRAM. HBM and DDR share DRAM wafer lines. HBM does
          not share DDR economics.
        </p>
        <p style={bodyStyle}>
          Start with die size. TSV keep-out zones steal array area. The die is tuned for{' '}
          <em>bandwidth</em>, not density — so even before yield, each wafer yields fewer dies.
          Then the electrical bar: dies that would pass commodity DDR get binned under HBM sort.
          Then process steps DDR never sees — TSV formation, wafer thin to{' '}
          <strong style={strong}>sub-50μm</strong>, backside processing — each stacking more yield
          loss on an already harder front end.
        </p>
        <p style={bodyStyle}>
          The killer is compounding. Semi&apos;s simplified stack math:{' '}
          <strong style={strong}>99%</strong> per layer → 8Hi ~<strong style={strong}>92%</strong>,
          12Hi ~<strong style={strong}>87%</strong>; drop to <strong style={strong}>98%</strong>{' '}
          per layer → ~<strong style={strong}>85%</strong> / ~<strong style={strong}>78%</strong>.
          Climb 8Hi → 12Hi → 16Hi and the gap versus DDR widens. That is why HBM can absorb a
          disproportionate share of global DRAM bit supply — and why the{' '}
          <strong style={strong}>memory supercycle</strong> story has a manufacturing spine, not
          only an AI-demand slogan.
        </p>
        <p style={bodyStyle}>
          Industry survey decks sometimes quote die <strong style={strong}>+35–45%</strong>, yield{' '}
          <strong style={strong}>−20–30%</strong>, ASP <strong style={strong}>≥6×</strong> same-capacity
          DDR. Same direction. Different scorecard. We keep them in separate columns — see below.
        </p>

        <SectionLabel>Tax 2 — Substrate: SPHBM4 moves the bill (not Google SP-HBM)</SectionLabel>
        <p style={bodyStyle}>
          July 2026: JEDEC <strong style={strong}>SPHBM4</strong> (Standard Package HBM,{' '}
          <strong style={strong}>JESD330-4</strong>). Same HBM4 DRAM stacks. New buffer die. Pins
          cut to roughly <strong style={strong}>1/5</strong>; rate up{' '}
          <strong style={strong}>4× to 32 Gbps</strong>; reach out to ~{' '}
          <strong style={strong}>20 mm</strong> on standard organic substrate — versus millimeter
          glue-distance classic HBM next to the GPU.
        </p>
        <p style={bodyStyle}>
          The point is not &ldquo;HBM gets cheaper forever.&rdquo; The point is{' '}
          <strong style={strong}>where the tax moves</strong>. Packages get larger. More stacks can
          sit farther from the GPU. Running 32 Gbps on organic forces{' '}
          <strong style={strong}>20–28+ layer</strong> premium ABF (and pulls glass forward). Material
          per panel up, units per panel down. Semi&apos;s punchline: the complexity leaves the
          proprietary silicon-interposer + advanced-pack combo and lands on{' '}
          <strong style={strong}>huge high-layer substrate</strong>. Substrate boom starts here.
        </p>
        <p style={bodyStyle}>
          It also &ldquo;democratizes&rdquo; who can assemble HBM — mid AI, networking, even
          consumer GPUs — which can{' '}
          <em>raise</em> HBM unit demand faster than suppliers ramp. Escape from CoWoS scarcity is
          not escape from wafer intensity.
        </p>
        <Callout>
          <strong style={strong}>Naming firewall.</strong> Semi&apos;s{' '}
          <strong style={strong}>SPHBM4</strong> ≠ Google&apos;s{' '}
          <strong style={strong}>SP-HBM / memory pooling</strong> (CXL + OCS remote DRAM pools in
          some industry decks). One is a JEDEC package path. The other is a system memory
          architecture. Collapsing the names is how people invent a free lunch.
        </Callout>

        <SectionLabel>Tax 3 — Competition: CXMT is #4, not a cycle-killer</SectionLabel>
        <p style={bodyStyle}>
          July 27, 2026: CXMT&apos;s STAR debut — priced ¥8.66, open ¥49.50, close{' '}
          <strong style={strong}>+466%</strong>, mcap framing ~<strong style={strong}>$488B</strong>.
          Semi had already written the deep dive: Qimonda ashes → Hefei patient capital → world{' '}
          <strong style={strong}>#4</strong> DRAM.
        </p>
        <p style={bodyStyle}>
          The June 30 thread is the judgment call people misread. Equipment export controls (EUV,
          advanced etch, TSV tools) still bind. Domestic tools help asymmetrically. Process trails
          leaders by generations; the <strong style={strong}>HBM gap is larger</strong>. Market is
          still mostly China. And yet: CXMT expansion does{' '}
          <strong style={strong}>not</strong> break the memory supercycle near-term. Shortage is
          too large. CXMT may not even cover domestic China demand. Local Chinese pricing spikes{' '}
          <em>with</em> the global ASP — not a cheap dump. Long-run structural competitor. Not an
          immediate Big-3 killer.
        </p>
        <p style={bodyStyle}>
          Hold that next to our Huawei chapter without blending them. CXMT-as-supercycle-non-event
          for SK Hynix / Samsung / Micron is compatible with CXMT-as-Ascend-lifeline being the only
          domestic HBM path that matters for Huawei volume. Same company. Two clocks.
        </p>

        <SectionLabel>What does not move — Huawei&apos;s stack countdown</SectionLabel>
        <p style={bodyStyle}>
          SPHBM4 does not print CXMT stacks. Google-style pooling (when real) does not erase export
          controls on HBM into China. A CXMT IPO prices the domestic DRAM champion; it does not fill{' '}
          <Link href="/blog/huawei-hbm" style={inlineLink}>
            the ~2M stacks / year thesis
          </Link>{' '}
          that still decides whether Ascend dies sit in banks or become cards.
        </p>
        <p style={bodyStyle}>
          So the three Semi threads answer three different questions:
        </p>
        <Table
          headers={['Thread', 'Question', 'Landing']}
          rows={[
            ['Wafer intensity', 'Why is commodity DRAM so tight?', 'HBM bit wafer tax + compounding Hi'],
            ['SPHBM4', 'How do you unstick CoWoS?', 'Tax moves to substrate / ABF / glass'],
            ['CXMT', 'Does China DRAM end the cycle?', 'No near-term — structural later'],
          ]}
        />
        <p style={bodyStyle}>
          Huawei&apos;s question remains the fourth column we already wrote:{' '}
          <strong style={strong}>stockpile burn versus CXMT HBM yield</strong>. That cell is still{' '}
          <em>待填</em> month-by-month.
        </p>

        <SectionLabel>Two scorecards — do not merge</SectionLabel>
        <Table
          headers={['Lens', 'Numbers we use', 'Confidence']}
          rows={[
            [
              'Semi X (filed)',
              'Stack yield 92/87/85/78 · sub-50μm · pins 1/5 · 32 Gbps · 20 mm · 20–28+ ABF · CXMT +466% / ~$488B',
              'Public threads / quoted',
            ],
            [
              'Industry survey (fact-check)',
              'Die +35–45% · yield −20–30% · ASP ≥6× · B300 Victory Giant 50–60% PCB · IBIDEN 80–90% substrate · LTA 30–40%',
              'Survey — label as such',
            ],
          ]}
        />
        <p style={bodyStyle}>
          Same physics, different measurement language. Merging them into one &ldquo;fact table&rdquo;
          is how research decks get laundered into false precision.
        </p>

        <SectionLabel>PCB footnote — Shennan is not one board</SectionLabel>
        <p style={bodyStyle}>
          Fact-check decks sometimes cite a <strong style={strong}>36-layer</strong> Shennan board
          on <strong style={strong}>Google TPU V8</strong> (M8 / HVLP2–4). That is not an Ascend
          board, and it is not a license to say &ldquo;Huawei already has the board.&rdquo; Our
          supply piece already treats Shennan as the Ascend PCB anchor (&gt;30%) and Victory Giant
          as NVIDIA&apos;s global AI-server PCB weight — with B300 survey shares called out
          separately. Keep the customers separate. Same vendor, different chains, different
          meanings.
        </p>
        <p style={bodyStyle}>
          And keep <Link href="/blog/ymtc-nand-wuhan" style={inlineLink}>YMTC</Link> out of the
          HBM hole. NAND is the other half of the memory complex — capital, sanctions, Wuhan list —
          not a substitute stack for Ascend.
        </p>

        <SectionLabel>Bottom line</SectionLabel>
        <p style={bodyStyle}>
          The memory tax moves. Wafer intensity explains the supercycle&apos;s manufacturing
          core. SPHBM4 relocates packaging scarcity onto substrate. CXMT prices a long structural
          competitor without ending the shortage. Huawei still lives on a clock none of those three
          threads can stop by themselves.
        </p>
        <p style={bodyStyle}>
          If you only remember one firewall:{' '}
          <strong style={strong}>SPHBM4 ≠ SP-HBM</strong>. If you only remember one open cell:{' '}
          <strong style={strong}>CXMT HBM monthly yield</strong>.
        </p>

        <SectionLabel>References</SectionLabel>
        <ul style={listStyle}>
          {references.map((r) => (
            <li key={r.href} style={{ marginBottom: 10 }}>
              <a href={r.href} style={inlineLink} target={r.href.startsWith('http') ? '_blank' : undefined} rel={r.href.startsWith('http') ? 'noreferrer' : undefined}>
                {r.label}
              </a>
            </li>
          ))}
        </ul>

        <p style={{ ...bodyStyle, marginTop: 40, opacity: 0.75, fontSize: '0.9rem' }}>
          Internal ledger: <code style={{ color: 'rgba(255,255,255,0.5)' }}>data/research/2026-08-semianalysis-dram-hbm-memory.md</code> · fact-check{' '}
          <code style={{ color: 'rgba(255,255,255,0.5)' }}>2026-08-huawei-nvidia-supply-factcheck.md</code>
        </p>

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
