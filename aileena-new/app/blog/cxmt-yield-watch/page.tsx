'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const references = [
  {
    label: 'SemiAnalysis — Huawei Ascend Production Ramp (HBM bottleneck, 2025-09)',
    href: '/blog/huawei-hbm',
  },
  {
    label: 'SemiAnalysis X — CXMT deep + supercycle (2026-06-30)',
    href: 'https://x.com/SemiAnalysis_/status/2071767487662768547',
  },
  {
    label: 'TechNews — CXMT HBM push may be weaker than rumored (2026-07-09)',
    href: 'https://technews.tw/2026/07/09/rumors-of-chinas-changxin-memorys-aggressive-push-into-the-hbm-market-may-not-be-as-strong-as-expected/',
  },
  {
    label: 'CNBC — CXMT debut vs memory giants (2026-07-31)',
    href: 'https://www.cnbc.com/2026/07/31/cxmts-sk-hynix-samsung-micron-memory-chip.html',
  },
  {
    label: 'Tom\'s Hardware — CXMT HBM3 samples / end-2026 mass-production target',
    href: 'https://www.tomshardware.com/pc-components/dram/chinese-semiconductor-industry-gears-up-for-domestic-hbm3-production-by-the-end-of-2026-cxmt-to-produce-chips-while-naura-maxwell-and-u-preseason-design-tools-for-assembly',
  },
  {
    label: 'Companion — The Memory Tax Moves',
    href: '/blog/memory-tax',
  },
];

export default function CxmtYieldWatchArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.08.06"
      tags="CXMT · HBM · yield · Huawei · Ascend · watch · SemiAnalysis"
      title="CXMT HBM Yield Watch"
      dek={
        <>
          Semi publishes the threads. We publish the <strong>empty cell</strong>: CXMT HBM yield and
          stack output, dated, sourced, and left ugly when the sources disagree. This is the
          variable that decides Huawei&apos;s card count — not SPHBM4, not a Wuhan NAND IPO.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          Everyone can read SemiAnalysis on X. Almost nobody maintains a public, revisioned ledger
          of <strong style={strong}>CXMT HBM monthly yield / stacks</strong> against the Huawei
          stockpile clock. That cell was blank in our Memory hub on purpose. Today we open it — with
          anchors we can defend, and months we still mark <em>待填</em>.
        </p>
        <p style={bodyStyle}>
          This is not a claim that we have factory telemetry they lack. It is a claim that we{' '}
          <strong style={strong}>own the tracking product</strong>: two clocks, conflicting public
          estimates kept in separate columns, and a standing invitation to overwrite a row when a
          better source lands.
        </p>

        <SectionLabel>Why this cell</SectionLabel>
        <p style={bodyStyle}>
          From{' '}
          <Link href="/blog/huawei-hbm" style={inlineLink}>
            David&apos;s Stockpile
          </Link>
          : foreign HBM burns down; CXMT is the domestic ramp. Best-case framing we already
          published — ~<strong style={strong}>2M stacks / year</strong> ≈{' '}
          <strong style={strong}>250–300K</strong> Ascend 910C-class cards (÷8). From Semi&apos;s
          June CXMT thread: equipment bans, multi-gen DRAM lag,{' '}
          <strong style={strong}>larger HBM gap</strong>, and still{' '}
          <strong style={strong}>not a near-term cycle-killer</strong> for Big-3. Same company. Two
          clocks. Yield is the hinge.
        </p>
        <Callout>
          <strong style={strong}>Discipline.</strong> We do not invent a monthly yield %. If a row
          has no dated source, it stays empty. Survey rumors that conflict stay{' '}
          <em>side by side</em> — not averaged into false precision.
        </Callout>

        <SectionLabel>Anchor ledger (public sources only)</SectionLabel>
        <Table
          headers={['As-of', 'Metric', 'Value', 'Source', 'Confidence']}
          rows={[
            [
              '2025-09',
              'CXMT HBM stacks (annual thesis)',
              '~2M / yr → ~250–300K 910C',
              'Semi Ascend ramp → Aileena huawei-hbm',
              'site ← Semi',
            ],
            [
              '2025-09',
              'Foreign stockpile',
              '~13M stacks → ~1.6M 910C; burns by year-end framing',
              'Semi Ascend ramp → Aileena huawei-hbm',
              'site ← Semi',
            ],
            [
              '2025 YE (est.)',
              'CXMT HBM wafer starts',
              '~5,000 WPM (~<2% of ~265k total)',
              'TechNews / market est. on IPO filing read',
              'secondary',
            ],
            [
              '2026 YE (est.)',
              'CXMT HBM wafer starts',
              '~30,000 WPM',
              'TechNews path (→ ~55k by 2027 YE)',
              'secondary',
            ],
            [
              '2026 (alternate)',
              'CXMT HBM wafer allocation',
              '~60,000 WPM / ~20% of ~300k total',
              'DigitalToday / foreign-media chain',
              'secondary — conflicts with TechNews path',
            ],
            [
              '~2026 mid',
              'HBM3 8Hi package yield (est.)',
              '~25% comprehensive',
              'TechNews market-person estimate',
              'rumor / secondary',
            ],
            [
              '~2026',
              'HBM3 initial yield (alt. band)',
              '<60% vs leaders >80%',
              'LavX / industry write-up',
              'secondary — different band',
            ],
            [
              '2026',
              'Mass-production target',
              'HBM3 by end-2026; samples to Huawei et al.',
              'Tom\'s Hardware / CNBC / Counterpoint via CNBC',
              'quoted-secondary',
            ],
            [
              '2026-07',
              'IPO proceeds use',
              'Filing read: funds → commodity DRAM, not HBM line',
              'TechNews on STAR filing',
              'secondary',
            ],
            [
              '2026-06',
              'Cycle stance',
              'CXMT expansion ≠ near-term supercycle killer',
              'Semi X 2071767487662768547',
              'quoted',
            ],
            [
              '2026-08',
              'Monthly yield %',
              '待填',
              '—',
              'open',
            ],
            [
              '2026-08',
              'Monthly stacks shipped',
              '待填',
              '—',
              'open',
            ],
          ]}
        />

        <SectionLabel>Conflicts we refuse to flatten</SectionLabel>
        <ul style={listStyle}>
          <li style={{ marginBottom: 10 }}>
            <strong style={strong}>5k → 30k → 55k WPM</strong> (TechNews path) vs{' '}
            <strong style={strong}>~60k WPM / 20%</strong> HBM allocation rumors — both secondary;
            we keep both rows.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong style={strong}>~25% 8Hi yield</strong> vs looser &ldquo;&lt;60% / near Samsung&rdquo;
            headlines — do not average.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong style={strong}>WPM ≠ stacks.</strong> Wafer starts are not finished HBM stacks.
            Converting without die-per-wafer + package yield is fanfic. We will not ship that
            conversion until we have an explicit source for the bridge.
          </li>
          <li style={{ marginBottom: 10 }}>
            Semi&apos;s <strong style={strong}>~2M stacks / yr</strong> remains the Huawei-path
            working thesis on this site until a better primary replaces it — labeled{' '}
            <em>site ← Semi</em>, not &ldquo;measured August output.&rdquo;
          </li>
        </ul>

        <SectionLabel>Open months (copy forward)</SectionLabel>
        <Table
          headers={['YYYY-MM', 'HBM gen', 'Yield %', 'Stacks shipped (est.)', 'Source', 'Notes']}
          rows={[
            ['2026-08', 'HBM3?', '待填', '待填', '—', 'Watch opened'],
            ['2026-09', '', '待填', '待填', '', ''],
            ['2026-10', '', '待填', '待填', '', ''],
            ['2026-11', '', '待填', '待填', '', ''],
            ['2026-12', '', '待填', '待填', '', 'End-2026 MP target check'],
          ]}
        />

        <SectionLabel>How this is &ldquo;ours&rdquo;</SectionLabel>
        <p style={bodyStyle}>
          Semi knows its own model. What they do not ship as a public product is this:{' '}
          <strong style={strong}>a dated, conflict-preserving yield watch</strong> wired to the
          Ascend stockpile essay, the{' '}
          <Link href="/blog/memory-tax" style={inlineLink}>
            memory-tax
          </Link>{' '}
          naming firewall (SPHBM4 ≠ Google SP-HBM), and the rule that{' '}
          <Link href="/blog/ymtc-nand-wuhan" style={inlineLink}>
            YMTC does not fill HBM
          </Link>
          . The edge is the <em>ledger + discipline</em>, updated when sources move — not a
          pretended private yield number.
        </p>
        <p style={bodyStyle}>
          Next overwrite wins. If you have a primary (filing footnote, teardown, Semi paywall
          paste), we replace a row and bump the date.
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

        <p style={{ ...bodyStyle, marginTop: 40, opacity: 0.75, fontSize: '0.9rem' }}>
          Internal twin:{' '}
          <code style={{ color: 'rgba(255,255,255,0.5)' }}>
            data/research/2026-08-semianalysis-dram-hbm-memory.md §4.3
          </code>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
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
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
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
                    padding: '11px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: j === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    verticalAlign: 'top',
                    lineHeight: 1.5,
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
