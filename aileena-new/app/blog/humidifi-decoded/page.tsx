'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function HumidifiDecodedArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.05.24"
      tags="Solana · Prop AMM · Reverse Engineering"
      title="Humidifi, Decoded"
      dek={<>Part II of <Link href="/blog/prop-amm-dict">The Pool That Wasn&apos;t a Pool</Link>. Part I established that humidifi&apos;s 1728-byte accounts don&apos;t store mints. Part II goes back in to map what <em>is</em> living in those bytes — six narrow ranges, ~57 bytes total, including a u16 that looks like a price tick.</>}
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The dead-pool problem</SectionLabel>
        <p style={bodyStyle}>
          Part I picked one humidifi pool more or less at random &mdash; <code style={codeStyle}>41cK…duRN</code>
          &mdash; and, off the 50-sigs-in-one-slot pattern, called humidifi a price-tick registry. That
          conclusion holds. But the sampling was wrong: the pool I picked stopped being touched 166 days ago.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`$ python3 - <<'PY'
import urllib.request, json
… getSignaturesForAddress("41cK7v1uJYpQ69xP31kU75hzxBHmvpZUeDnopsL2duRN")
PY
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago`}
          </pre>
        </div>

        <p style={bodyStyle}>
          The humidifi program itself, meanwhile, is extremely alive &mdash; every recent slot fires a
          handful of invocations against it. Pull the latest 10 program-level signatures and you get 10
          events, all in the current slot, none in error. So the program is hot, but only a handful of pools
          are. The other 80-plus accounts allocated at 1728 bytes are leftovers from earlier epochs of
          activity. Sample at random and you just get noise.
        </p>

        <p style={bodyStyle}>
          The fix is to sample by traffic, not by index. Walk the last <code style={codeStyle}>N</code> program-level
          signatures, take each transaction&apos;s first humidifi instruction, and count how many times each
          pool address shows up. The winners are the active accounts. Two of mine: <code style={codeStyle}>Fksff…qVuH</code>
          and <code style={codeStyle}>DB3s…RoRwW</code>.
        </p>

        <SectionLabel>Polling the live bytes</SectionLabel>
        <p style={bodyStyle}>
          The recording loop is dull. Every two seconds, batch-fetch the pool account plus a handful of Pyth
          price feeds (SOL, BTC, ETH, USDC, USDT, BONK) in one <code style={codeStyle}>getMultipleAccounts</code> call &mdash; Pyth being a
          popular on-chain price oracle. Save each snapshot as a line in a JSONL file. Sixty ticks at two
          seconds each gives you two minutes of wall time, 90 of pool data, and a clean dataset for byte-level
          diffing.
        </p>

        <p style={bodyStyle}>
          The Pyth feeds turned out to be inert during the window &mdash; all six were constant across all
          sixty ticks. The legacy v2 push receivers on mainnet don&apos;t get refreshed much any more; Pyth&apos;s
          pull oracle has eaten that path. That&apos;s a useful negative result: humidifi doesn&apos;t source its
          price from on-chain Pyth, because if it did, its bytes would be locked to those constants. They&apos;re
          not. So whatever humidifi is pricing against lives off chain.
        </p>

        <SectionLabel>The byte map</SectionLabel>
        <p style={bodyStyle}>
          Diff every consecutive pair of snapshots, then group the changed byte positions into contiguous
          runs, and six ranges fall out:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`## 6 hot ranges (bytes that ever changed across 60 snapshots)

  range          width   change/snap
  [ 576– 580]       5         0.814
  [ 600– 603]       4         0.780
  [ 616– 617]       2         0.517
  [ 624– 660]      37         0.366
  [ 672– 676]       5         0.346
  [ 680– 683]       4         0.398

  total bytes ever changing: 57 / 1728  (3.3%)`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Three percent. The other 97% of the account is static configuration &mdash; a struct header, a
          program-version field, padding, a discriminator (the leading bytes that tag an account&apos;s type),
          maybe a vault pubkey or two. Whatever the live part is, it&apos;s 57 bytes wide and laid out in six
          neat clusters.
        </p>

        <SectionLabel>What the live bytes do</SectionLabel>
        <p style={bodyStyle}>
          For each hot range, try the four reasonable unsigned-integer encodings &mdash; u8, u16-LE, u32-LE,
          u64-LE, the standard little-endian widths &mdash; at every offset inside it, then classify the
          resulting time series. A value that only ever climbs is probably a sequence or slot counter. A
          value that wobbles by small amounts is probably a price tick or EMA. A value that&apos;s noisy and
          all over the place is either a hash or a packed multi-field record read at the wrong width.
        </p>

        <p style={bodyStyle}>
          Two of them are unambiguous wins:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`bytes [616–617]   u16-LE @ off 616   smooth, range ~26000
  examples: [26416, 26423, 26376, 26381, 26374, …]
  consecutive deltas: -7, -47, +5, -7, +13, …    → looks like a price tick

bytes [672–676]   u16-LE @ off 675   smooth, range ~28000
  examples: [28110, 28099, 28037, 28037, 28064, …]
  consecutive deltas: -11, -62, 0, +27, +13, …   → second price tick

bytes [624–660]   u64-LE @ off 653   monotonic ↑, e18 range
  examples: [6703401462834817804, 6757756443098909634, 6766458476050285304, …]
  → cumulative counter or nanosecond timestamp

bytes [624–660]   u32-LE @ off 657   monotonic ↑
  examples: [1560757277, 1573412782, 1575438882, 1576758264, …]
  → sequence number embedded inside the same 37-byte block`}
          </pre>
        </div>

        <p style={bodyStyle}>
          The two u16 ticks &mdash; two-byte unsigned values &mdash; aren&apos;t the bid and ask of the same
          pair. Their ranges are different orders of magnitude (~26k and ~28k of whatever the unit is), which
          rules out the &quot;narrow spread&quot; reading. They&apos;re much more likely to be:
        </p>
        <ul style={listStyle}>
          <li>Two scaled prices in different reference frames (one quote per side of the pool)</li>
          <li>A spot tick and a TWAP tick for the same instrument</li>
          <li>A price tick and a depth tick — one says &quot;where&quot;, the other &quot;how much&quot;</li>
        </ul>
        <p style={bodyStyle}>
          Telling those three apart is the next step. The honest answer right now is &quot;we have the field
          boundaries; we don&apos;t yet have the meaning.&quot; But that&apos;s already enough to build on, because the
          field <em>changes</em> are themselves the signal: whatever those numbers mean, the moment they move
          is the moment humidifi&apos;s quote changed.
        </p>

        <SectionLabel>The constants tell you something too</SectionLabel>
        <p style={bodyStyle}>
          Inside the active range, two bytes are nearly invariant across all sixty snapshots:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`off=660   u8   examples: [93, 93, 93, 93, 93, …]
off=676   u8   examples: [109, 109, 109, 109, 109, …]`}
          </pre>
        </div>

        <p style={bodyStyle}>
          93 and 109 don&apos;t look like discriminators &mdash; those usually sit at the front of an account.
          They&apos;re probably static flags (instrument type, fee tier, side) or sentinel bytes the program
          checks before applying an update. Either way, they&apos;re a handy fingerprint: any other humidifi
          pool holding <code style={codeStyle}>93</code> at byte 660 and <code style={codeStyle}>109</code> at byte 676
          is almost certainly the same instrument class as <code style={codeStyle}>Fksff…qVuH</code>.
        </p>

        <SectionLabel>What this is good for</SectionLabel>
        <p style={bodyStyle}>
          Humidifi quoted <a href="https://www.helius.dev/blog/solanas-proprietary-amm-revolution" target="_blank" rel="noopener noreferrer" style={inlineLink}>$8.55B in a single week</a> in
          late 2025 and was, briefly, Solana&apos;s top DEX by volume. And here&apos;s why Part I&apos;s finding
          matters &mdash; that the mints aren&apos;t on chain and settlement happens elsewhere: humidifi&apos;s
          entire competitive moat is the off-chain pricing engine. The on-chain account is a public-facing
          snapshot, not a venue.
        </p>

        <p style={bodyStyle}>
          With the byte map from Part II, four things become buildable without any cooperation from humidifi
          at all:
        </p>

        <ul style={listStyle}>
          <li><strong style={strong}>Account-change firehose.</strong> Subscribe to <code style={codeStyle}>accountSubscribe</code> on every
            active humidifi pool. Every notification is a quote update. Even before you&apos;ve decoded the
            exact price field, the <em>timing</em> of updates is itself a leading indicator &mdash;
            humidifi only pings when it wants to re-quote.</li>
          <li><strong style={strong}>Per-pool fingerprinting.</strong> Cluster pools by their constant-byte signature (93, 109, …)
            and you can group accounts by instrument class without ever knowing the pair. Pair that
            with the active-pool sampling trick and you get a clean catalogue of what humidifi is
            actively making markets in right now.</li>
          <li><strong style={strong}>Price-tick correlation.</strong> Re-run the recording against a much wider Pyth-equivalent
            set &mdash; Switchboard, the actual Pyth pull oracle, the Binance WebSocket &mdash; and the u16 ticks
            at offsets 616 and 675 will resolve to a real instrument.</li>
          <li><strong style={strong}>Quote-firehose product.</strong> Once the u16 ticks are pinned to instruments, a 200-line
            TypeScript service can subscribe to the active pool set and emit a real-time humidifi
            quote feed to anyone who wants one. Right now the only way to get a humidifi quote
            is to ask humidifi.</li>
        </ul>

        <SectionLabel>Reproducing</SectionLabel>
        <p style={bodyStyle}>
          Two reproduction scripts ship alongside this work, so anyone can re-run the analysis on a
          public RPC &mdash; the open node endpoints anyone can query:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`# 1) Record 120s of pool snapshots + Pyth feeds
python3 scripts/humidifi-watch.py --mode record \\
  --pool FksffEqnBRixYGR791Qw2MgdU7zNCpHVFYBL4Fa4qVuH \\
  --duration 120 --interval 2.0 \\
  --out trace.jsonl

# 2) Quick analysis — byte change frequency + Pyth correlation
python3 scripts/humidifi-watch.py --mode analyze --input trace.jsonl

# 3) Deep structural decode — width=1,2,4,8 classification per hot range
python3 scripts/humidifi-decode.py --input trace.jsonl`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Total wall time: about three minutes. No API key. The only RPC call that needs any care is
          <code style={codeStyle}>getProgramAccounts</code>, which enumerates the humidifi pools; everything else is per-account.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/blog/prop-amm-dict" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s', marginRight: 32,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            ← Part I
          </Link>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Styles (shared with the prop-amm-dict article) ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9, color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em', marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '0.85em',
  background: 'rgba(0,255,234,0.08)', padding: '1px 6px',
  border: '1px solid rgba(0,255,234,0.18)', borderRadius: 2,
  color: 'rgba(0,255,234,0.9)',
};
const inlineLink: React.CSSProperties = {
  color: 'rgba(0,255,234,0.85)', textDecoration: 'underline',
  textDecorationColor: 'rgba(0,255,234,0.3)', textUnderlineOffset: '3px',
};
const preStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.6,
  color: 'rgba(255,255,255,0.75)', background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px', overflowX: 'auto', letterSpacing: '0.01em', margin: 0,
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9, color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em', marginBottom: 24, paddingLeft: 22,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.45em',
      color: '#00ffea', textTransform: 'uppercase',
      marginBottom: 20, marginTop: 56, opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
