'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const references = [
  {
    label: 'Companion — The Second Leg Is Memory Test (filing receipts)',
    href: '/blog/test-second-leg',
  },
  {
    label: 'Teradyne YTD return (~96% through 2026-08-07)',
    href: 'https://www.ytdreturn.com/teradyne/',
  },
  {
    label: 'Teradyne — MacroTrends price history (ATH / recent close)',
    href: 'https://www.macrotrends.net/stocks/charts/TER/teradyne/stock-price-history',
  },
  {
    label: 'Advantest (6857.T) — price & consensus targets (stockanalysis)',
    href: 'https://stockanalysis.com/quote/tyo/6857/forecast/',
  },
  {
    label: 'ASE Technology — Q2 2026 Form 6-K (capex context for tape reactions)',
    href: 'https://www.sec.gov/Archives/edgar/data/1122411/000095010326011351/dp250868_6k.htm',
  },
  {
    label: 'SemiAnalysis cluster — Taiwan test consumables / ATE / ASE (2026-08-06)',
    href: 'https://pulseaugur.com/cluster/186361-semiconductor-test-demand-surges-suppliers-revise-market-estimates-upwards-6',
  },
];

export default function TestTapeArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.08.09"
      tags="tape · TER · Advantest · ASE · FormFactor · MPI · WinWay · CHPT · volatility · not advice"
      title="Test Tape"
      dek={
        <>
          Six-month price shape for the AI test stack — Teradyne, Advantest, ASE, FormFactor, and
          Taiwan&apos;s interface names. Patterns and verification order only.{' '}
          <strong>Not investment advice.</strong> Filings live in{' '}
          <em>The Second Leg Is Memory Test</em>.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          <Link href="/blog/test-second-leg" style={inlineLink}>
            The Second Leg Is Memory Test
          </Link>{' '}
          owns Advantest TAM, Teradyne memory dollars, and ASE test capex. This page owns something
          noisier: how those names have <strong style={strong}>traded</strong> roughly from
          February through early August 2026 — the tape theater around the receipts.
        </p>
        <p style={bodyStyle}>
          One line: the group behaved like high-beta AI picks-and-shovels — large year-to-date
          gains, violent air-pockets after good news, and a pattern of spike → fade → re-accel when
          the next print confirms.
        </p>

        <SectionLabel>What this owns — and what it does not</SectionLabel>
        <Table
          headers={['Piece', 'Owns', 'Does not own']}
          rows={[
            [
              'Second Leg (receipts)',
              'ATE TAM · memory B/B · ASE test $ / # testers',
              'Price paths or analyst targets',
            ],
            [
              'This tape memo',
              'Six-month shape · volatility pattern · how to read tape vs receipts',
              'Buy/sell calls · position size · a live quote feed',
            ],
          ]}
        />

        <Callout>
          <strong style={strong}>Not investment advice.</strong> Levels below are snapshots
          around early August 2026 and go stale within days — especially the Taiwan names. Re-check
          Yahoo Finance, TWSE / broker terminals, or your own data before you treat any number as
          current. We do not recommend trades.
        </Callout>

        <SectionLabel>Six-month shape (≈ Feb – early Aug 2026)</SectionLabel>
        <p style={bodyStyle}>
          Broad feature: strong advances versus the broad market, often{' '}
          <strong style={strong}>50–300%+</strong> year-to-date bands depending on name, with
          one-year moves commonly measured in multiplies. Drivers on the tape match the receipt
          story — SoC test acceleration, HBM / memory re-accel, record OSAT test spend — but the
          market prices them with leverage and lag.
        </p>
        <Table
          headers={['Name', 'Tape band (early Aug snapshot)', 'Read']}
          rows={[
            [
              'Teradyne (TER)',
              'YTD ~96% to ~Aug 7; 52w high ~$488 (6/30); recent ~$365–380',
              'Beta ~1.8 class; single-day ±10%+ common around prints',
            ],
            [
              'Advantest (6857.T)',
              'Recent ~¥32,190; consensus 12m targets ~¥37–38k band',
              'Targets are Street consensus, not ours; same spike/fade rhythm',
            ],
            [
              'ASE (ASX / 3711.TW)',
              'One-year multi-bagger shape; sharp pullbacks after capex / raise news',
              'Q2 test $804M is the receipt; tape often sells the raise first',
            ],
            [
              'FormFactor (FORM)',
              'One-year multi-bagger shape; mid-year high then consolidation',
              'Memory / HBM probe exposure; moves with ATE cycle narrative',
            ],
            [
              'TW trio — MPI 6223 · WinWay 6515 · CHPT 6510',
              'Highest elasticity; half-year doubles and deep corrections both normal',
              'Do not pin a single NT$ print — check TWSE the day you care',
            ],
          ]}
        />
        <p style={bodyStyle}>
          Taiwan interface names sit closest to consumable burn. That is why they often lead
          elasticity — and why a week-old screenshot of NT$ levels is already a lie. Name the
          tickers; refresh the quote.
        </p>

        <SectionLabel>Outlook framing — structural, not a target</SectionLabel>
        <p style={bodyStyle}>
          Near term (next few months): chop with an upward bias is the base case{' '}
          <em>if</em> the memory second leg and ASE-class installs stay elevated — the conditions
          spelled out in the receipts essay. That is a conditional frame, not a price path.
        </p>
        <p style={bodyStyle}>
          Into late 2026–2027: the structural bet is still{' '}
          <strong style={strong}>test intensity</strong> — longer cycles, higher pin / power /
          SI bars on AI packages and HBM — not a one-quarter SoC spike. Street target means for
          TER / Advantest / ASE / FORM often sit above early-August spots; we cite that only as
          context that consensus is not priced for immediate collapse. We do not adopt those
          targets.
        </p>
        <Callout>
          <strong style={strong}>Risk on the tape.</strong> Multiples are already rich. Order
          lumpiness, AI capex timing, rates, or geopolitics can still open{' '}
          <strong style={strong}>20–40%</strong> air-pockets without killing the multi-year test
          story. Trend can stay up while the path stays violent.
        </Callout>

        <SectionLabel>Volatility pattern</SectionLabel>
        <Table
          headers={['Phase', 'What you see', 'What it is not']}
          rows={[
            [
              'Spike',
              'TAM raise / beat / capex confirmation → gap up',
              'A permanent re-rating certificate',
            ],
            [
              'Fade',
              'Valuation anxiety or profit-taking → sharp drawdown',
              'Proof the receipts were fake',
            ],
            [
              'Re-accel',
              'Next ATE / OSAT print re-validates → bounce',
              'A signal to size like a utility stock',
            ],
          ]}
        />
        <p style={bodyStyle}>
          Expect beta in the <strong style={strong}>1.5–2.0+</strong> neighborhood for the liquid
          US/JP names, and still higher day-to-day percentage moves in the Taiwan interface
          complex. These are high-elasticity beneficiaries of rising test intensity — not smooth
          compounders.
        </p>

        <SectionLabel>How to use tape with receipts</SectionLabel>
        <p style={bodyStyle}>
          Keep the order from the filings page. Tape is lagging theater.
        </p>
        <Table
          headers={['Order', 'Watch', 'Why first']}
          rows={[
            ['1', 'Advantest TAM · Teradyne memory B/B + $', 'ATE temperature'],
            ['2', 'ASE test equip. $ · # testers', 'Install confirmation'],
            ['3', 'TW monthly rev (6223 / 6515 / 6510 / 6683)', 'Consumable burn proxy'],
            ['4', 'This tape', 'Whether the market is ahead of or behind (1)–(3)'],
          ]}
        />
        <p style={bodyStyle}>
          If receipts stay hot and the tape sells off hard, that is usually a valuation fight —
          not an automatic falsification of the stack. If receipts cool and the tape still rips,
          that is the dangerous lag. Start with{' '}
          <Link href="/blog/test-second-leg" style={inlineLink}>
            the receipts
          </Link>
          .
        </p>

        <SectionLabel>Bottom line</SectionLabel>
        <p style={bodyStyle}>
          Past half-year: classic AI-driven surge plus high volatility. Ahead: still supported by
          test demand if the second leg and OSAT installs hold — but the volatility does not
          graduate away. Read prices last. Read Advantest, Teradyne, and ASE first.
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
