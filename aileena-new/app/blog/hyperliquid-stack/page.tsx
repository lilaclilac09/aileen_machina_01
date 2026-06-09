'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function HyperliquidStackArticle() {
  return (
    <SubstackShell
      category="Markets"
      date="2026.06.01"
      tags="Hyperliquid · Jito · Liquid Staking · MEV · DeFi"
      title="What Hyperliquid Borrowed From Solana"
      dek="Every trading venue eventually needs three things: a place to trade, a way to stake, and a meme. Solana spent five years growing its versions — orderbook DEXs, Jito, the LST flywheel, the Bonk moment. Hyperliquid is recapitulating the whole stack in one chain. KNTQ, kHYPE, and PURR are how."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Hyperliquid is a perpetual-futures (perp) DEX that runs on its own Layer-1 blockchain.
          In early 2026 it does about <strong style={strong}>$2.36 billion</strong> of perp volume a
          day, holds <strong style={strong}>$1.5 billion</strong> in TVL on its native L1, and captures
          roughly <strong style={strong}>38%</strong> of the on-chain perpetuals market. Twenty-five
          validators secure the chain.
        </p>

        <p style={bodyStyle}>
          For comparison: Solana spent five years and roughly <strong style={strong}>1,400</strong>{' '}
          validators growing into a comparable trading ecosystem. Hyperliquid is doing it from
          scratch with two dozen.
        </p>

        <p style={bodyStyle}>
          What&rsquo;s interesting isn&rsquo;t just the speed. It&rsquo;s that every primitive Solana
          built bottom-up &mdash; the orderbook DEX, Jito&rsquo;s MEV / liquid-staking complex, the
          memecoin moment &mdash; Hyperliquid is now reassembling. The same stack, just built twice.
        </p>

        <p style={bodyStyle}>
          A trading venue feels like a chain when it has three pieces: the <strong style={strong}>orderbook</strong>{' '}
          itself, a <strong style={strong}>liquid-staking layer</strong> that turns deposit into yield,
          and a <strong style={strong}>native token + spot market</strong> that gives the place a
          culture. Hyperliquid&rsquo;s versions are the chain itself (HyperBFT + the native orderbook),{' '}
          <strong style={strong}>Kinetiq</strong> with its <strong style={strong}>KNTQ</strong>{' '}
          governance token and <strong style={strong}>kHYPE</strong> liquid-staked token, and{' '}
          <strong style={strong}>PURR</strong> &mdash; the first HIP-1 native token. They&rsquo;re named
          by their tickers here because that&rsquo;s how they show up on screens.
        </p>

        <SectionLabel>The chain — orderbook in the state machine</SectionLabel>
        <p style={bodyStyle}>
          The most distinctive thing about Hyperliquid is structural: <strong style={strong}>the
          orderbook is in the state machine</strong>. There&rsquo;s no &ldquo;perp DEX smart
          contract.&rdquo; Placing an order, matching a fill, triggering a liquidation &mdash; those
          aren&rsquo;t user-land transactions against a contract; they&rsquo;re protocol-level state
          transitions, the same way a Bitcoin transaction is a state transition. The chain{' '}
          <em>is</em> the exchange.
        </p>
        <p style={bodyStyle}>
          Consensus underneath is <strong style={strong}>HyperBFT</strong>, a Tendermint-style
          proof-of-stake Byzantine-Fault-Tolerant protocol (BFT &mdash; the chain stays consistent
          even if a minority of validators are malicious). About <strong style={strong}>25</strong>{' '}
          validators secure it as of May 2026, with a roadmap target of <strong style={strong}>50+</strong>{' '}
          by year-end. Validator weight is staked HYPE, the chain&rsquo;s native token.
        </p>
        <p style={bodyStyle}>
          HYPE plays three roles at once:
        </p>
        <ul style={listStyle}>
          <li>Gas on HyperEVM, the EVM-compatible execution layer attached to the same security.</li>
          <li>The staked asset that secures HyperBFT.</li>
          <li>The governance token.</li>
        </ul>
        <p style={bodyStyle}>
          Stakers earn <strong style={strong}>2&ndash;4%</strong> annualised from network rewards.
        </p>
        <p style={bodyStyle}>
          That&rsquo;s the venue. The interesting layers sit on top of it.
        </p>

        <SectionLabel>Take two — Kinetiq, KNTQ, kHYPE</SectionLabel>
        <p style={bodyStyle}>
          On Solana, <strong style={strong}>Jito</strong> is what happens when liquid staking and MEV
          (Maximal Extractable Value &mdash; the profit a block producer can capture by reordering
          transactions) collapse into one company. It does three things at once.
        </p>
        <ol style={listStyle}>
          <li>
            <strong style={strong}>JitoSOL.</strong> A liquid-staking token (LST): you deposit SOL,
            you get JitoSOL back, and the exchange rate against SOL drifts upward as rewards accrue.
            Your deposit stays liquid.
          </li>
          <li>
            <strong style={strong}>Block Engine.</strong> An off-chain auction where bots bid for
            inclusion of transaction <em>bundles</em> (atomic, ordered groups of transactions). The
            winning bid &mdash; the &ldquo;tip&rdquo; &mdash; pays the validator that includes it.
          </li>
          <li>
            <strong style={strong}>MEV-to-stakers.</strong> Tips run through a router that sends a
            share back to JitoSOL holders, so the LST&rsquo;s yield includes a slice of network MEV
            on top of inflation rewards.
          </li>
        </ol>
        <p style={bodyStyle}>
          It worked. The Jito-Solana validator client is now run by more than <strong style={strong}>95%</strong>{' '}
          of Solana&rsquo;s active stake. Jito tips account for more than <strong style={strong}>60%</strong>{' '}
          of all priority-fee volume on the network. Validators running the Jito client earn an extra{' '}
          <strong style={strong}>1&ndash;2 percentage points</strong> of yield versus those that
          don&rsquo;t. The TipRouter takes a <strong style={strong}>6%</strong> cut of each tip:{' '}
          <strong style={strong}>5.7%</strong> to the Jito DAO, <strong style={strong}>0.15%</strong>{' '}
          to JitoSOL stakers, <strong style={strong}>0.15%</strong> to JTO stakers; the remaining{' '}
          <strong style={strong}>94%</strong> goes to validators (who route a portion to their
          delegators). JitoSOL itself sits around <strong style={strong}>$938.7M</strong> TVL on{' '}
          <strong style={strong}>14.5 million</strong> SOL staked.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Kinetiq</strong> is what that playbook looks like inside Hyperliquid.
        </p>
        <p style={bodyStyle}>
          Stake <strong style={strong}>HYPE</strong>, get <strong style={strong}>kHYPE</strong> back.
          The LST&rsquo;s exchange rate against HYPE drifts upward with staking rewards &mdash; no
          claim transaction, the receipt just gets fatter. A component called{' '}
          <strong style={strong}>StakeHub</strong> automatically distributes pooled HYPE across the
          top-performing validators, so depositors don&rsquo;t have to pick.
        </p>
        <p style={bodyStyle}>
          The governance and revenue token is <strong style={strong}>KNTQ</strong>, which is{' '}
          <em>not</em> kHYPE. The split is intentional, and it&rsquo;s the same architectural move
          Jito made:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>kHYPE</strong> is the yield receipt &mdash; you hold it because you
            want HYPE exposure plus staking yield, redeemable at the running exchange rate. Clean
            instrument.
          </li>
          <li>
            <strong style={strong}>KNTQ</strong> is the equity. The protocol routes{' '}
            <strong style={strong}>100%</strong> of revenue &mdash; from staking, from Kinetiq&rsquo;s
            own perp / RWA venue <strong style={strong}>Markets.xyz</strong>, and from launches
            &mdash; into <strong style={strong}>KNTQ buybacks</strong>, with proceeds distributed to{' '}
            <strong style={strong}>sKNTQ</strong> (staked-KNTQ) holders.
          </li>
        </ul>
        <p style={bodyStyle}>
          The reception was unsubtle. Founded in late 2024 on <strong style={strong}>$1.75M</strong>{' '}
          raised, Kinetiq pulled over <strong style={strong}>$460 million</strong> in deposits
          across just <strong style={strong}>2,800</strong> holders in the first 24 hours after the
          KNTQ launch &mdash; roughly <strong style={strong}>$164,000</strong> per holder. That&rsquo;s
          concentrated, sophisticated capital betting that this protocol becomes Hyperliquid&rsquo;s
          Jito.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Markets.xyz</strong> is what makes the bet plausible. It&rsquo;s a
          24/7 perp venue for real-world assets &mdash; equities, indices, commodities &mdash; running
          on <strong style={strong}>HIP-3</strong> (the third Hyperliquid Improvement Proposal, the
          primitive for permissioned-issuer perp markets). If Kinetiq becomes the place where HYPE
          stakers also trade Apple and gold, the revenue per kHYPE holder stops being
          &ldquo;validator rewards&rdquo; and starts being a real fee stack.
        </p>

        <SectionLabel>The meme — PURR</SectionLabel>
        <p style={bodyStyle}>
          Every chain has the moment when its first joke token becomes a financial event. Solana had
          Bonk, then Wif, then a year of memecoin Cambrian explosion. Hyperliquid had{' '}
          <strong style={strong}>PURR</strong>.
        </p>
        <p style={bodyStyle}>
          PURR launched on <strong style={strong}>April 16, 2024</strong> as the{' '}
          <strong style={strong}>first HIP-1 native token</strong> on Hyperliquid L1. HIP-1 is the
          standard for deploying a native spot token <em>with its own on-chain orderbook</em>{' '}
          &mdash; no AMM (automated market maker, Uniswap-style swap pool), no token-sale contract,
          just a spot orderbook where USDC is the quote token. It&rsquo;s the cleanest possible
          token primitive: spin up an asset, get an orderbook for it on the same machine that runs
          the perps.
        </p>
        <p style={bodyStyle}>
          The numbers, exactly:
        </p>
        <ul style={listStyle}>
          <li>Max supply <strong style={strong}>1,000,000,000</strong> PURR.</li>
          <li>
            <strong style={strong}>500,000,000</strong> distributed proportionally to early
            Hyperliquid points holders.
          </li>
          <li>
            <strong style={strong}>400,000,000</strong> committed to <strong style={strong}>HIP-2
            &ldquo;Hyperliquidity&rdquo;</strong> (a mechanism that permanently commits liquidity to
            a spot orderbook), then <strong style={strong}>burned</strong>.
          </li>
          <li>Trading fees paid in PURR are burned, so supply is structurally deflationary.</li>
        </ul>
        <p style={bodyStyle}>
          There was no presale, no team allocation framed as &ldquo;utility,&rdquo; no contrived
          purpose. That was the point. PURR is the test specimen for Hyperliquid&rsquo;s native token
          + orderbook + liquidity stack &mdash; and the fact that it&rsquo;s a memecoin is precisely
          why it works. The only place memes get tested first is in memecoins.
        </p>

        <SectionLabel>The shape</SectionLabel>
        <p style={bodyStyle}>
          Pull back and the three layers form a recognizable shape:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>A venue.</strong> Solana &rarr; many AMM/orderbook DEXs spread
            across the chain. Hyperliquid &rarr; a single L1 whose state machine{' '}
            <em>is</em> an orderbook.
          </li>
          <li>
            <strong style={strong}>A liquid-staking economy that captures MEV / yield.</strong>{' '}
            Solana &rarr; Jito, JitoSOL, JTO, TipRouter. Hyperliquid &rarr; Kinetiq, kHYPE, KNTQ,
            sKNTQ.
          </li>
          <li>
            <strong style={strong}>A native token + spot venue + cultural anchor.</strong>{' '}
            Solana &rarr; SPL tokens and the memecoin year. Hyperliquid &rarr; HIP-1 and PURR.
          </li>
        </ul>
        <p style={bodyStyle}>
          The same primitives, one chain at a time. Solana grew them by accretion; Hyperliquid
          scoped them in advance and built them into the platform.
        </p>
        <p style={bodyStyle}>
          That has two consequences.
        </p>
        <p style={bodyStyle}>
          First, <strong style={strong}>leverage concentrates fast on a new chain</strong>. Kinetiq
          pulled $460M in 24 hours because there isn&rsquo;t a serious competitor yet. On Solana,
          Jito had to grow JitoSOL against half a dozen rivals and still ended up dominant &mdash;
          but it took years. On Hyperliquid, a single early mover is already at Jito-like share
          before the chain has its second cycle. If Kinetiq holds even half of the eventual HYPE-LST
          market, it owns a structural position you can&rsquo;t easily compete away.
        </p>
        <p style={bodyStyle}>
          Second, <strong style={strong}>concentration cuts the other way too</strong>. Twenty-five
          validators is not many. Hyperliquid&rsquo;s roadmap to 50+ is the right direction, but the
          chain&rsquo;s whole pitch &mdash; orderbook in the state machine, instant finality, no MEV
          at the protocol level &mdash; only stays clean if the validator set is plural and
          adversarial enough to keep the operators honest. The next thing to watch is whether
          Hyperliquid hits 50 with real geographic and stake diversity, or whether it stays a small,
          fast, slightly-too-cozy validator set.
        </p>
        <p style={bodyStyle}>
          PURR is the bellwether for none of that. PURR is just there &mdash; the meme that proves
          the venue is alive. But whether KNTQ ends up the second Jito, and whether Hyperliquid ends
          up the next Solana, will be decided in the layers above and below it.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          Figures here are drawn from current protocol disclosures, on-chain dashboards (DefiLlama,
          public validator data), and ecosystem reporting through May/June 2026. They are stated as
          the thesis, not independently re-derived.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: 32 }}>
          Adjacent reading on this site: the broader case for orderbook DEXs in{' '}
          <Link href="/blog/clob" style={linkStyle}>The Order Book That Doesn&rsquo;t Break</Link>;
          how MEV plays out in practice in{' '}
          <Link href="/blog/cex-dex-arb" style={linkStyle}>The Darkest Trade</Link>.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
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
const linkStyle: React.CSSProperties = { color: '#00ffea', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,234,0.3)' };
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
