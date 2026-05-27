'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

/* ── Tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:      '#0e0e0e',
  panel:   '#161616',
  panelBd: '#222222',
  text:    'rgba(255,255,255,0.88)',
  muted:   'rgba(255,255,255,0.52)',
  faint:   'rgba(255,255,255,0.32)',
  rule:    'rgba(255,255,255,0.08)',
  accent:  '#00ffea',
  sans:    "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace",
};

export default function HumidifiDecodedArticle() {
  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.text,
      fontFamily: T.sans,
      WebkitFontSmoothing: 'antialiased',
      overflowY: 'auto',
    }}>
      <ScrollUnlock />

      {/* ── Top rail ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        background: 'rgba(14,14,14,0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.rule}`,
      }}>
        <Link href="/#blog" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: T.muted, textDecoration: 'none',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
          Archive
        </Link>
        <span style={{ fontSize: 12, color: T.faint }}>
          Aileena Machina
        </span>
      </header>

      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <section style={{
        maxWidth: 720, margin: '0 auto', padding: '88px 28px 36px',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          fontSize: 13, color: T.muted, marginBottom: 32,
        }}>
          <span>Analysis</span>
          <Dot />
          <span>2026.05.24</span>
          <Dot />
          <span>Solana · Prop AMM · Reverse engineering</span>
        </div>

        <h1 style={{
          fontFamily: T.sans,
          fontSize: 'clamp(2rem, 5vw, 2.875rem)',
          fontWeight: 600,
          letterSpacing: '-0.015em',
          lineHeight: 1.08,
          color: 'rgba(255,255,255,0.96)',
          margin: '0 0 22px',
        }}>
          Humidifi, Decoded
        </h1>

        <p style={{
          fontSize: 17, lineHeight: 1.6, color: T.muted,
          margin: 0,
        }}>
          Part II of <Link href="/blog/prop-amm-dict" style={inlineLink}>
          The Pool That Wasn&apos;t a Pool</Link>. A 1728-byte account.
          Six live ranges. Fifty-seven moving bytes.
        </p>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '24px 28px 96px' }}>

        <Section n={1} title="The dead-pool problem" />
        <p style={bodyStyle}>
          Part I picked one humidifi pool more or less at random
          — <code style={codeInline}>41cK…duRN</code> — and concluded humidifi was a
          price-tick registry based on the 50-sigs-in-one-slot pattern. That conclusion
          holds, but the sampling was wrong. The pool I picked stopped being touched
          166 days ago.
        </p>

        <Pre>{`$ python3 - <<'PY'
import urllib.request, json
… getSignaturesForAddress("41cK7v1uJYpQ69xP31kU75hzxBHmvpZUeDnopsL2duRN")
PY
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago
slot=385921704  age=166.2 days ago`}</Pre>

        <p style={bodyStyle}>
          The humidifi program is, meanwhile, extremely alive — every recent slot fires
          a handful of invocations against it. Pulling the latest 10 program-level
          signatures returns 10 events all in the current slot, none in error. So the
          program is hot but only a handful of pools are. The other 80-plus accounts
          allocated at 1728 bytes are residue from prior epochs of activity. Sample at
          random and you get noise.
        </p>

        <p style={bodyStyle}>
          The fix is to sample by traffic, not by index. Walk the last{' '}
          <code style={codeInline}>N</code> program-level signatures, take each tx&apos;s
          first humidifi instruction, count how many times each pool address appears.
          The winners are the active accounts. Two of mine:{' '}
          <code style={codeInline}>Fksff…qVuH</code> and{' '}
          <code style={codeInline}>DB3s…RoRwW</code>.
        </p>

        <Section n={2} title="Polling the live bytes" />
        <p style={bodyStyle}>
          The recording loop is dull. Every two seconds, batch-fetch the pool account
          and a handful of Pyth price feeds (SOL, BTC, ETH, USDC, USDT, BONK) in one{' '}
          <code style={codeInline}>getMultipleAccounts</code> call. Persist each
          snapshot as a line in a JSONL file. Sixty ticks at two seconds each is two
          minutes of wall time, 90 of pool data, and a clean dataset for byte-level
          diffing.
        </p>

        <p style={bodyStyle}>
          The Pyth feeds turned out to be inert during the window — all six were
          constant across all sixty ticks. The legacy v2 push receivers on mainnet
          aren&apos;t being refreshed often any more; Pyth&apos;s pull oracle has eaten
          that path. Useful negative result: humidifi doesn&apos;t source price from
          on-chain Pyth, because if it did, its bytes would be locked to those
          constants. They&apos;re not. Whatever humidifi is pricing against lives off
          chain.
        </p>

        <Section n={3} title="The byte map" />
        <p style={bodyStyle}>
          Diffing every consecutive pair of snapshots and grouping the changed byte
          positions into contiguous runs produces six ranges:
        </p>

        {/* ── Quiet data block ─────────────────────────────────────── */}
        <div style={{
          margin: '24px 0 28px',
          fontFamily: T.mono, fontSize: 13, lineHeight: 1.9,
          color: T.text,
        }}>
          {[
            ['576 – 580',  '5',  '0.814'],
            ['600 – 603',  '4',  '0.780'],
            ['616 – 617',  '2',  '0.517'],
            ['624 – 660',  '37', '0.366'],
            ['672 – 676',  '5',  '0.346'],
            ['680 – 683',  '4',  '0.398'],
          ].map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '160px 80px 1fr',
              padding: '2px 0',
              borderBottom: i === 5 ? 'none' : `1px solid ${T.rule}`,
            }}>
              <span style={{ color: T.muted }}>{row[0]}</span>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
            </div>
          ))}
          <div style={{
            marginTop: 10, fontSize: 12, color: T.faint,
          }}>
            57 / 1728 bytes ever change · 3.3%
          </div>
        </div>

        <p style={bodyStyle}>
          Three percent. The other 97% of the account is static configuration — a
          struct header, a program-version field, padding, a discriminator, maybe a
          vault pubkey or two. Whatever the live part is, it&apos;s 57 bytes wide and
          laid out in six neat clusters.
        </p>

        <Section n={4} title="What the live bytes do" />
        <p style={bodyStyle}>
          For each hot range, try the four reasonable u-encodings — u8, u16-LE, u32-LE,
          u64-LE — at every offset inside it, and classify the resulting time series.
          A monotonically increasing value is probably a sequence or slot counter. A
          bounded small-delta value is probably a price tick or EMA. A wide-spread
          noisy value is either a hash or a packed multi-field record read at the
          wrong width.
        </p>

        <p style={bodyStyle}>The two unambiguous wins:</p>

        <Pre>{`bytes [616–617]   u16-LE @ off 616   smooth, range ~26000
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
  → sequence number embedded inside the same 37-byte block`}</Pre>

        <p style={bodyStyle}>
          The two u16 ticks aren&apos;t bid and ask of the same pair. Their ranges are
          different orders of magnitude (~26k and ~28k of whatever unit), which rules
          out the &ldquo;narrow spread&rdquo; interpretation. They&apos;re much more
          likely to be:
        </p>

        <ul style={listStyle}>
          <li style={listItem}>Two scaled prices in different reference frames (one quote per side of the pool).</li>
          <li style={listItem}>A spot tick and a TWAP tick for the same instrument.</li>
          <li style={listItem}>A price tick and a depth tick — one says &ldquo;where&rdquo;, the other &ldquo;how much&rdquo;.</li>
        </ul>

        <p style={bodyStyle}>
          Disambiguating between those three is the next step. The honest answer right
          now is &ldquo;we have the field boundaries; we don&apos;t yet have the
          meaning.&rdquo; That&apos;s already enough to build on, though, because the
          field <em>changes</em> are themselves the signal: whatever those numbers
          mean, the moment they move is the moment humidifi&apos;s quote changed.
        </p>

        <Section n={5} title="The constants tell you something too" />
        <p style={bodyStyle}>
          Inside the active range, two bytes are nearly invariant across all sixty
          snapshots:
        </p>

        <Pre>{`off=660   u8   examples: [93, 93, 93, 93, 93, …]
off=676   u8   examples: [109, 109, 109, 109, 109, …]`}</Pre>

        <p style={bodyStyle}>
          93 and 109 don&apos;t look like discriminators (those usually appear at the
          front of an account). They&apos;re probably static flags — instrument type,
          fee tier, side — or sentinel bytes the program checks before applying an
          update. Either way, they&apos;re a useful fingerprint: any other humidifi
          pool that holds <code style={codeInline}>93</code> at byte 660 and{' '}
          <code style={codeInline}>109</code> at byte 676 is almost certainly the same
          instrument class as <code style={codeInline}>Fksff…qVuH</code>.
        </p>

        <Section n={6} title="What this is good for" />
        <p style={bodyStyle}>
          Humidifi quoted{' '}
          <a
            href="https://www.helius.dev/blog/solanas-proprietary-amm-revolution"
            target="_blank" rel="noopener noreferrer"
            style={inlineLink}
          >$8.55B in a single week</a>{' '}
          in late 2025 and was, briefly, Solana&apos;s top DEX by volume. The
          interesting thing about Part I&apos;s finding — that mints aren&apos;t on
          chain and settlement happens elsewhere — is that humidifi&apos;s entire
          competitive moat is the off-chain pricing engine. The on-chain account is a
          public-facing snapshot, not a venue.
        </p>

        <p style={bodyStyle}>
          With the byte map, four things become buildable without any cooperation from
          humidifi:
        </p>

        <dl style={{ margin: '24px 0 8px' }}>
          <Buildable title="Account-change firehose">
            Subscribe to <code style={codeInline}>accountSubscribe</code> on every
            active humidifi pool. Every notification is a quote update. Even without
            decoding the exact price field, the <em>timing</em> of updates is itself a
            leading indicator — humidifi only pings when it wants to re-quote.
          </Buildable>
          <Buildable title="Per-pool fingerprinting">
            Cluster pools by their constant-byte signature (93, 109, …) and you can
            group accounts by instrument class without ever knowing the pair. Combined
            with the active-pool sampling trick, you get a clean catalogue of what
            humidifi is actively making markets in right now.
          </Buildable>
          <Buildable title="Price-tick correlation">
            Re-run the recording with a much wider Pyth-equivalent set — Switchboard,
            the actual Pyth pull oracle, Binance WebSocket — and the u16 ticks at
            offsets 616 and 675 will resolve to a real instrument.
          </Buildable>
          <Buildable title="Quote-firehose product">
            Once the u16 ticks are pinned to instruments, a 200-line TypeScript service
            can subscribe to the active pool set and emit a real-time humidifi quote
            feed to any consumer that wants one. Currently the only way to get a
            humidifi quote is to ask humidifi.
          </Buildable>
        </dl>

        <Section n={7} title="Reproducing" />
        <p style={bodyStyle}>
          Two scripts in{' '}
          <Link href="https://github.com/lilaclilac09/pamm-a" style={inlineLink}>pamm-a</Link>{' '}
          reproduce everything in this post on a public RPC:
        </p>

        <Pre>{`# 1) Record 120s of pool snapshots + Pyth feeds
python3 scripts/humidifi-watch.py --mode record \\
  --pool FksffEqnBRixYGR791Qw2MgdU7zNCpHVFYBL4Fa4qVuH \\
  --duration 120 --interval 2.0 \\
  --out trace.jsonl

# 2) Quick analysis — byte change frequency + Pyth correlation
python3 scripts/humidifi-watch.py --mode analyze --input trace.jsonl

# 3) Deep structural decode — width=1,2,4,8 classification per hot range
python3 scripts/humidifi-decode.py --input trace.jsonl`}</Pre>

        <p style={bodyStyle}>
          Total wall time: about three minutes. No API key. The only RPC call that
          needs care is <code style={codeInline}>getProgramAccounts</code> to
          enumerate humidifi pools; everything else is per-account.
        </p>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{
          marginTop: 72, paddingTop: 24,
          borderTop: `1px solid ${T.rule}`,
          display: 'flex', gap: 28, flexWrap: 'wrap',
          fontSize: 13,
        }}>
          <Link href="/blog/prop-amm-dict" style={footerLink}>← Part I</Link>
          <Link href="/#blog" style={footerLink}>← Back to archive</Link>
        </div>

      </article>
    </div>
  );
}

/* ── Subcomponents ─────────────────────────────────────────────────────── */
function Dot() {
  return <span aria-hidden style={{ color: T.faint }}>·</span>;
}

function Section({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ marginTop: 72, marginBottom: 16 }}>
      <h2 style={{
        fontFamily: T.sans, fontSize: 22, lineHeight: 1.35,
        fontWeight: 600, letterSpacing: '-0.005em',
        color: 'rgba(255,255,255,0.94)', margin: 0,
      }}>
        <span style={{ color: T.faint, fontWeight: 400, marginRight: 12 }}>
          {String(n).padStart(2, '0')}
        </span>
        {title}
      </h2>
    </div>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <div style={{ margin: '22px 0 26px', overflowX: 'auto' }}>
      <pre style={preStyle}>{children}</pre>
    </div>
  );
}

function Buildable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <dt style={{
        fontFamily: T.sans, fontSize: 16, fontWeight: 500,
        color: 'rgba(255,255,255,0.92)', marginBottom: 4,
      }}>
        {title}
      </dt>
      <dd style={{
        margin: 0, fontSize: 16, lineHeight: 1.75, color: T.muted,
      }}>
        {children}
      </dd>
    </div>
  );
}

/* ── Shared styles ─────────────────────────────────────────────────────── */
const bodyStyle: React.CSSProperties = {
  fontSize: 16, lineHeight: 1.75,
  color: T.text, margin: '0 0 20px',
};

const listStyle: React.CSSProperties = {
  fontSize: 16, lineHeight: 1.75, color: T.text,
  margin: '0 0 20px', paddingLeft: 20,
};

const listItem: React.CSSProperties = { marginBottom: 6 };

const codeInline: React.CSSProperties = {
  fontFamily: T.mono, fontSize: '0.86em',
  background: 'rgba(255,255,255,0.05)',
  padding: '1px 6px',
  borderRadius: 4,
  color: 'rgba(255,255,255,0.92)',
};

const inlineLink: React.CSSProperties = {
  color: T.accent,
  textDecoration: 'underline',
  textDecorationColor: 'rgba(0,255,234,0.3)',
  textUnderlineOffset: 3,
};

const preStyle: React.CSSProperties = {
  fontFamily: T.mono, fontSize: 13, lineHeight: 1.65,
  color: 'rgba(255,255,255,0.82)',
  background: T.panel,
  border: `1px solid ${T.panelBd}`,
  borderRadius: 8,
  padding: '16px 18px',
  overflowX: 'auto',
  margin: 0,
  whiteSpace: 'pre',
};

const footerLink: React.CSSProperties = {
  color: T.muted, textDecoration: 'none',
};
