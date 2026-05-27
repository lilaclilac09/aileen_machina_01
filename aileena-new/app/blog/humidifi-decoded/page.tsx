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
          Part I picked one humidifi pool more or less at random — <code style={codeStyle}>41cK…duRN</code>
          — and concluded humidifi was a price-tick registry based on the 50-sigs-in-one-slot pattern.
          That conclusion holds, but the sampling was wrong. The pool I picked stopped being touched
          166 days ago.
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
          The humidifi program is, meanwhile, extremely alive — every recent slot fires a handful
          of invocations against it. Pulling the latest 10 program-level signatures returns 10 events
          all in the current slot, none in error. So the program is hot but only a handful of pools
          are. The other 80-plus accounts allocated at 1728 bytes are residue from prior epochs of
          activity. Sample at random and you get noise.
        </p>

        <p style={bodyStyle}>
          The fix is to sample by traffic, not by index. Walk the last <code style={codeStyle}>N</code> program-level
          signatures, take each tx&apos;s first humidifi instruction, count how many times each pool address
          appears. The winners are the active accounts. Two of mine: <code style={codeStyle}>Fksff…qVuH</code>
          and <code style={codeStyle}>DB3s…RoRwW</code>.
        </p>

        <SectionLabel>Polling the live bytes</SectionLabel>
        <p style={bodyStyle}>
          The recording loop is dull. Every two seconds, batch-fetch the pool account and a handful
          of Pyth price feeds (SOL, BTC, ETH, USDC, USDT, BONK) in one <code style={codeStyle}>getMultipleAccounts</code> call.
          Persist each snapshot as a line in a JSONL file. Sixty ticks at two seconds each is two minutes
          of wall time, 90 of pool data, and a clean dataset for byte-level diffing.
        </p>

        <p style={bodyStyle}>
          The Pyth feeds turned out to be inert during the window — all six were constant across all
          sixty ticks. The legacy v2 push receivers on mainnet aren&apos;t being refreshed often any more;
          Pyth&apos;s pull oracle has eaten that path. Useful negative result: humidifi doesn&apos;t source price
          from on-chain Pyth, because if it did, its bytes would be locked to those constants. They&apos;re
          not. Whatever humidifi is pricing against lives off chain.
        </p>

        <SectionLabel>The byte map</SectionLabel>
        <p style={bodyStyle}>
          Diffing every consecutive pair of snapshots and grouping the changed byte positions into
          contiguous runs produces six ranges:
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
          Three percent. The other 97% of the account is static configuration — a struct header, a
          program-version field, padding, a discriminator, maybe a vault pubkey or two. Whatever the
          live part is, it&apos;s 57 bytes wide and laid out in six neat clusters.
        </p>

        <SectionLabel>What the live bytes do</SectionLabel>
        <p style={bodyStyle}>
          For each hot range, try the four reasonable u-encodings — u8, u16-LE, u32-LE, u64-LE — at
          every offset inside it, and classify the resulting time series. A monotonically increasing
          value is probably a sequence or slot counter. A bounded small-delta value is probably a
          price tick or EMA. A wide-spread noisy value is either a hash or a packed multi-field record
          read at the wrong width.
        </p>

        <p style={bodyStyle}>
          The two unambiguous wins:
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
          The two u16 ticks aren&apos;t bid and ask of the same pair. Their ranges are different orders
          of magnitude (~26k and ~28k of whatever unit), which rules out the &quot;narrow spread&quot;
          interpretation. They&apos;re much more likely to be:
        </p>
        <ul style={listStyle}>
          <li>Two scaled prices in different reference frames (one quote per side of the pool)</li>
          <li>A spot tick and a TWAP tick for the same instrument</li>
          <li>A price tick and a depth tick — one says &quot;where&quot;, the other &quot;how much&quot;</li>
        </ul>
        <p style={bodyStyle}>
          Disambiguating between those three is the next step. The honest answer right now is &quot;we
          have the field boundaries; we don&apos;t yet have the meaning.&quot; That&apos;s already enough to build
          on, though, because the field <em>changes</em> are themselves the signal: whatever those
          numbers mean, the moment they move is the moment humidifi&apos;s quote changed.
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
          93 and 109 don&apos;t look like discriminators (those usually appear at the front of an account).
          They&apos;re probably static flags — instrument type, fee tier, side — or sentinel bytes the
          program checks before applying an update. Either way, they&apos;re a useful fingerprint: any
          other humidifi pool that holds <code style={codeStyle}>93</code> at byte 660 and <code style={codeStyle}>109</code> at byte 676
          is almost certainly the same instrument class as <code style={codeStyle}>Fksff…qVuH</code>.
        </p>

        <SectionLabel>What this is good for</SectionLabel>
        <p style={bodyStyle}>
          Humidifi quoted <a href="https://www.helius.dev/blog/solanas-proprietary-amm-revolution" target="_blank" rel="noopener noreferrer" style={inlineLink}>$8.55B in a single week</a> in
          late 2025 and was, briefly, Solana&apos;s top DEX by volume. The interesting thing about Part
          I&apos;s finding — that mints aren&apos;t on chain and settlement happens elsewhere — is that
          humidifi&apos;s entire competitive moat is the off-chain pricing engine. The on-chain account
          is a public-facing snapshot, not a venue.
        </p>

        <p style={bodyStyle}>
          With the byte map from Part II, four things become buildable without any cooperation from
          humidifi:
        </p>

        <ul style={listStyle}>
          <li><strong style={strong}>Account-change firehose.</strong> Subscribe to <code style={codeStyle}>accountSubscribe</code> on every
            active humidifi pool. Every notification is a quote update. Even without decoding the
            exact price field yet, the <em>timing</em> of updates is itself a leading indicator —
            humidifi only pings when it wants to re-quote.</li>
          <li><strong style={strong}>Per-pool fingerprinting.</strong> Cluster pools by their constant-byte signature (93, 109, …)
            and you can group accounts by instrument class without ever knowing the pair. Combined
            with the active-pool sampling trick, you get a clean catalogue of what humidifi is
            actively making markets in right now.</li>
          <li><strong style={strong}>Price-tick correlation.</strong> Re-run the recording with a much wider Pyth-equivalent
            set — Switchboard, the actual Pyth pull oracle, Binance WebSocket — and the u16 ticks
            at offsets 616 and 675 will resolve to a real instrument.</li>
          <li><strong style={strong}>Quote-firehose product.</strong> Once the u16 ticks are pinned to instruments, a 200-line
            TypeScript service can subscribe to the active pool set and emit a real-time humidifi
            quote feed to any consumer that wants one. Currently the only way to get a humidifi quote
            is to ask humidifi.</li>
        </ul>

        <SectionLabel>Reproducing</SectionLabel>
        <p style={bodyStyle}>
          Two scripts in <Link href="https://github.com/lilaclilac09/pamm-a" style={inlineLink}>pamm-a</Link> reproduce
          everything in this post on a public RPC:
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
          Total wall time: about three minutes. No API key. The only RPC call that needs care is
          <code style={codeStyle}>getProgramAccounts</code> to enumerate humidifi pools; everything else is per-account.
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
