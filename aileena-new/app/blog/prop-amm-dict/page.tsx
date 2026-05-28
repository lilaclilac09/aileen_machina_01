'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function PropAmmDictArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.05.23"
      tags="Solana · Prop AMM · Reverse Engineering"
      title="The Pool That Wasn't a Pool"
      dek={<>Ten closed-source proprietary AMMs are doing most of the quiet flow on Solana mainnet. Eight have their byte-level pool layouts in a single public gist. The other two — humidifi and aquifier — were blank. I tried to finish the table.</>}
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>The Question Behind The Question</SectionLabel>
        <p style={bodyStyle}>
          Prop AMMs &mdash; proprietary, closed-source automated market makers &mdash; are where a lot of
          Solana&apos;s flow actually clears, quietly, off Jupiter&apos;s headline screen. HumidiFi alone{' '}
          <a href="https://www.helius.dev/blog/solanas-proprietary-amm-revolution" target="_blank" rel="noopener noreferrer" style={inlineLink}>hit $8.55B weekly volume in late 2025</a>.
          And whether you&apos;re running a market-making bot, building an aggregator, or doing competitor
          intel, the first thing you want to know is the same: <em>which pairs are they trading right now?</em>
        </p>
        <p style={bodyStyle}>
          That question comes down to three steps. List the program IDs. For each one, call <code style={codeStyle}>getProgramAccounts</code> with
          a <code style={codeStyle}>dataSize</code> filter (a query that asks the RPC node for every account of a fixed size) to enumerate the
          pool accounts. Then, for each pool, decode the two mint pubkeys &mdash; the on-chain IDs of the two
          tokens &mdash; at known byte offsets, the fixed positions where those values live in the account
          data. Steps one and three are pure static knowledge. Once someone publishes them, anyone can reuse
          them.
        </p>
        <p style={bodyStyle}>
          The heavy lifting was done last year by another reverser: ten program IDs, eight pairs of offsets,
          one bash script, all freely published. Two rows were left blank &mdash; aquifier and humidifi. This
          post is what happened when I tried to fill them in.
        </p>

        <SectionLabel>The Ten Programs</SectionLabel>
        <p style={bodyStyle}>
          All ten are owner-controlled: no public IDLs (the interface files that normally tell you how to
          read a program&apos;s accounts), no LP tokens, no external liquidity providers. The <code style={codeStyle}>dataSize</code> column
          is the fixed account size you use to enumerate the pool accounts under each program.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`humidifi   9H6tua7jkLhdm3w8BvgpTn5LZNU7g4ZynDmCiNN3q6Rp     1728
solfi      SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe      2800
solfiv2    SV2EYYJyRz2YhfXwXnhNAevDEui5Q6yrfyo13WtupPF      1728
zerofi     ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY      7456
bisonfi    BiSoNHVpsVZW2F7rx2eQ59yQwKxzU5NvBcmKshCSUypi     2048
obricv2    obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y       666
goonfiv2   goonuddtQRrWqqn5nFyczVKaie28f3kDkHWkHtURSLE      2048
aquifier   AQU1FRd7papthgdrwPTTq5JacJh8YtwEXaBfKU3bTz45     1056
alphaQ     ALPHAQmeA7bjrVuccPsYPiCvsi428SNwte66Srvs4pHA      672
tessera    TessVdML9pBGgG9yGks7o4HewRaXVAMuoVj4x83GLQH      1264`}
          </pre>
        </div>

        <p style={bodyStyle}>
          The published offsets &mdash; the ones I already had &mdash; look like this. They give you <code style={codeStyle}>mint1</code> and <code style={codeStyle}>mint2</code> as
          byte positions into the raw account data. base58-encode the 32 bytes sitting at each position and
          you have the pair.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`bisonfi    mint1=184    mint2=216
tessera    mint1=56     mint2=24
alphaQ     mint1=272    mint2=240
solfi      mint1=2696   mint2=2664
solfiv2    mint1=88     mint2=56
goonfiv2   mint1=112    mint2=80
zerofi     mint1=104    mint2=72
obricv2    mint1=202    mint2=234
aquifier   ???
humidifi   ???`}
          </pre>
        </div>

        <SectionLabel>Aquifier — 90 Seconds, No API Key</SectionLabel>
        <p style={bodyStyle}>
          I didn&apos;t want to look up a known aquifier pool on Birdeye and feed it into a search. I wanted
          the whole thing to be automatic: hand it a program ID and an account size, walk away with the
          offsets.
        </p>
        <p style={bodyStyle}>
          Here&apos;s the trick. <strong style={strong}>Every SPL Mint on Solana is owned by the Token Program</strong> (or
          Token-2022 — a newer version of Solana&apos;s token standard) &mdash; a mint being the account that defines a token, owned by the standard program
          that manages all of them. That gives you a one-shot oracle. Take a pool account, scan every
          8-byte-aligned 32-byte window, base58-encode each one as a candidate pubkey, and batch-check them
          via <code style={codeStyle}>getMultipleAccounts</code>. Anything owned by the Token Program with ≥ 82 bytes of data (82 bytes being the fixed size of a mint account) <em>is</em> a
          Mint. Repeat across three pools. The two offsets that turn up a Mint <em>every time</em> are mint1 and
          mint2.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`$ python3 scripts/auto-reverse.py \\
    --program AQU1FRd7papthgdrwPTTq5JacJh8YtwEXaBfKU3bTz45 \\
    --size 1056 --pools 3

# listing pools for AQU1... (size=1056)
#   got 35 pools
# scanning GtwzYxBQcPFNFQcYbdELuaKzb4DGJpGVU2ehLhzbffCw…
#   2 mint hits at offsets [952, 984]
# scanning AwtZZUJsRGLje9c5wE9q7zMNjA9ZkEuxTk8awBza14kr…
#   2 mint hits at offsets [952, 984]
# scanning 2rB2YghwLMsScpTrs4fAA6H6tEYoMxp835oTRi5YwY9U…
#   2 mint hits at offsets [952, 984]

{
  "mint1_offset": 952,
  "mint2_offset": 984,
  "samples": [
    { "pool": "Gtwz…", "at_952": "EPjFWd…TDt1v"  (USDC),
                       "at_984": "7ULN1Y…wvkW" },
    { "pool": "Awtz…", "at_952": "So111111111…11112" (SOL),
                       "at_984": "ErA4DH…uZBt" },
    { "pool": "2rB2…", "at_952": "Dz9mQ9…Mbonk"   (Bonk),
                       "at_984": "8MZUyF…tGax" }
  ]
}`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Offsets <code style={codeStyle}>952</code> and <code style={codeStyle}>984</code> sit 32 bytes apart, both 8-byte aligned, right at
          the tail of a 1056-byte struct. That&apos;s a classic Anchor layout &mdash; Anchor being the
          dominant Solana program framework &mdash; where the last two fields of the <code style={codeStyle}>Pool</code> struct
          are <code style={codeStyle}>(mint_a: Pubkey, mint_b: Pubkey)</code>. Aquifier solved. Nine of ten down.
        </p>
        <p style={bodyStyle}>
          Then I ran the same script on humidifi.
        </p>

        <SectionLabel>Humidifi — Same Script, Zero Hits</SectionLabel>
        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`$ python3 scripts/auto-reverse.py \\
    --program 9H6tua7jkLhdm3w8BvgpTn5LZNU7g4ZynDmCiNN3q6Rp \\
    --size 1728 --pools 3

# scanning 41cK7v1uJYpQ69xP31kU75hzxBHmvpZUeDnopsL2duRN…
#   0 mint hits at offsets []
# scanning 55TtvfGVd8mXdVJTL3ZyQ6e5g146rNHN6LV41bSyCCTt…
#   0 mint hits at offsets []
# scanning BtDQz6LSEj24VRNU4qCnxngdPZVNAWHdERsMb1tRYfv5…
#   0 mint hits at offsets []

not enough candidate offsets`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Not a single 32-byte window in any humidifi pool resolves to a Token Program-owned account. Not a
          mint, not a vault, nothing. The data is densely packed &mdash; 492 of 512 bytes nonzero in the first
          half &mdash; but it isn&apos;t pubkeys. The first 256 bytes of one humidifi pool look like this:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`[   0] 538e3432d790d169 2c5a137c386f2f96 2d5a107c3b6f2c16 2e5a117c3a6f2d96
[  32] 2c5a167c3d6f2a96 285a177c3c6f2b96 a971cdcd2e6f2896 2a5a157c3e6f2996
[  64] 2b5a1a7c316f2696 dba5e483cf90d8e9 265a187c336f2496 265a197c326f2596
[  96] 275a1e7c356f2296 205a1f7c346f2396 dea5e383c890dfe9 dda5e283c990dee9
[ 128] 205a027c296f3e96 3c5a037c286f3f96 46f8acff2bb603bf b9075200d549fd40`}
          </pre>
        </div>

        <p style={bodyStyle}>
          That repeating 8-byte motif <code style={codeStyle}>XX5a XX7c XX6f XX96</code> is a packed binary record &mdash;
          almost certainly something like <code style={codeStyle}>(price_tick, size_tick, side, flags)</code> quadruples in
          a heap or order-book-shaped structure. Not pool reserves. Not anything that names a token.
        </p>

        <p style={bodyStyle}>
          Two more probes confirmed it. First, <code style={codeStyle}>getProgramAccounts</code> with no size filter
          comes back with 89 accounts, <em>all</em> at 1728 bytes. No metadata class, no registry account, no
          pool config. Just 89 of these tick records.
        </p>

        <p style={bodyStyle}>
          Second &mdash; and this is the punchline &mdash; recent transactions touching one humidifi pool
          don&apos;t move any tokens. The last 50 signatures all sit in the same slot, each transaction
          touching exactly three accounts (the pool, a signer, and <code style={codeStyle}>SysvarC1ock</code> — the on-chain clock account; the &apos;1&apos; is part of its address, not a typo), with zero <code style={codeStyle}>preTokenBalances</code> and
          zero <code style={codeStyle}>postTokenBalances</code>.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`2pqoeipJ5eeP2BLuNYXpgdVaFPMHSeoio4qwkCAS9HUTfTs3F7Z7Req5vB5N6b4fS9AXWv3yGU17sE52sF8o6u6J  slot=385921704
2XgTsBh5TqzhB7SjLy5jXANHPsvBLCDhpTEY4GyrfkwJnLrThxGw8cyDXvX91rrDQnhxtnSo5ggDPVsoMbUXMvYu  slot=385921704
5wLuGLZHK1MP75SfvrfhYNiT9rZZwRZFgrhWbV6oxKWUBg3xzZjkCs7ijePecZxdxQ4GFFss7ea1keH4CQd9JjUV  slot=385921704
58g8XHjtwEZHnkxtV6WvScg5X8oNyqXPeSCGDcmjf43JzrSBkyaT69BjT5JcxPm1rr6GehS2kCvDPHX7Xkmv9peu  slot=385921704
4rwEoJi4cjkQe5nJrftEajQZwDpAUTvBZKM4sE9kMNe6ZKXrv88AjNtYjMs5rn8FNo74rWPG1bABNCqz2nTs3Rn4  slot=385921704
…                                                                                          slot=385921704`}
          </pre>
        </div>

        <p style={bodyStyle}>
          50 transactions, one slot, no token movement. This isn&apos;t a swap. This is <strong style={strong}>the operator pinging
          every pool every slot to push a fresh price update</strong>. Humidifi&apos;s on-chain account is a price oracle
          and a quote registry. Token settlement happens through a completely separate path &mdash; likely a
          Jupiter integration that asks humidifi for a quote and then settles between the trader and
          humidifi&apos;s vault wallets, never through the pool account.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>WHY THE GIST LEFT IT BLANK</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            The earlier gist didn&apos;t publish humidifi&apos;s offsets because they don&apos;t exist. There&apos;s nowhere
            in the pool account for a mint pubkey to live. The mint pair for a given humidifi pool sits in
            humidifi&apos;s own off-chain registry, not on chain. So the blank row in the gist wasn&apos;t laziness
            &mdash; it was the correct entry.
          </p>
        </div>

        <SectionLabel>What This Unlocks</SectionLabel>
        <p style={bodyStyle}>
          With aquifier added, nine of ten prop AMMs are now enumerable end-to-end with public RPC &mdash;
          the open node endpoints anyone can query &mdash; and a short Python script. The dictionary
          is complete enough to drive a live radar across the whole competitive set, with humidifi handled
          separately via its quote API. That last part is honestly <em>more</em> interesting, because it means
          humidifi&apos;s moat is the off-chain pricing, not the on-chain venue.
        </p>

        <figure style={{ margin: '40px 0 12px' }}>
          <img
            src="/research/prop-amm-radar.png"
            alt="Prop AMM Radar — 10 AMMs, 7 contested pairs, USDC/SOL on 7 of them"
            style={{
              width: '100%',
              borderRadius: 4,
              border: '1px solid rgba(0,255,234,0.18)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
          />
          <figcaption style={{
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em',
            marginTop: 12,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            PAMM Terminal — RADAR drawer rendering live competitor coverage across 10 prop AMMs.
          </figcaption>
        </figure>

        <p style={bodyStyle}>
          Here&apos;s what you can build on top of the dictionary, in roughly increasing order of how much it
          costs to ignore:
        </p>

        <ul style={listStyle}>
          <li><strong style={strong}>Competitive radar.</strong> Scan every 30 seconds, diff against yesterday &mdash; &quot;humidifi just added BONK/SOL&quot; &mdash; and you&apos;ve got an early-warning channel for shifts in who&apos;s willing to make markets in what.</li>
          <li><strong style={strong}>Flow-aware fees.</strong> Count how many AMMs hold a pool on a given pair. When five or more pile in, the pair is hot, the flow is concentrated, and you should be charging more for the privilege. Bake that signal into the dynamic-fee curve.</li>
          <li><strong style={strong}>Quote benchmarking.</strong> For each pair you swap, pull every prop AMM&apos;s quote at the same instant. The tightest quote tells you who&apos;s currently setting the price; how spread out the quotes are tells you how confident the market is.</li>
          <li><strong style={strong}>TVL leaderboard.</strong> The same reversal trick works on reserve fields &mdash; just search for known u64 reserve amounts instead of pubkey bytes. Out of scope for this post, but trivially additive.</li>
          <li><strong style={strong}>Humidifi-specific.</strong> Subscribe to changes on the 1728-byte account class and decode the tick format above. The repeating <code style={codeStyle}>XX5a XX7c XX6f XX96</code> pattern is enough of a foothold to back out what each field encodes, slot by slot.</li>
        </ul>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            textTransform: 'uppercase',
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

/* ── Styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};

const strong: React.CSSProperties = {
  color: 'rgba(255,255,255,0.95)',
  fontWeight: 600,
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.85em',
  background: 'rgba(0,255,234,0.08)',
  padding: '1px 6px',
  border: '1px solid rgba(0,255,234,0.18)',
  borderRadius: 2,
  color: 'rgba(0,255,234,0.9)',
};

const inlineLink: React.CSSProperties = {
  color: 'rgba(0,255,234,0.85)',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(0,255,234,0.3)',
  textUnderlineOffset: '3px',
};

const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.78rem',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.75)',
  background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px',
  overflowX: 'auto',
  letterSpacing: '0.01em',
  margin: 0,
};

const calloutAccent: React.CSSProperties = {
  margin: '32px 0',
  padding: '22px 26px',
  background: 'rgba(0,255,234,0.04)',
  border: '1px solid rgba(0,255,234,0.18)',
};

const calloutTitle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.55rem',
  letterSpacing: '0.4em',
  color: 'rgba(0,255,234,0.8)',
  textTransform: 'uppercase',
  margin: '0 0 14px',
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
