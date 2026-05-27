'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const mono = "'SF Mono', 'Fira Code', 'Courier New', monospace";
const sans = "'Barlow Condensed', system-ui, sans-serif";

export default function DegenArticle() {
  return (
    <SubstackShell
      category="Field Guide"
      date="2026.05.18"
      tags="Solana · DeFi · On-Chain Research"
      title="The SF Degen Playbook"
      dek="In SF, the best traders are the ones who write their own tools. Wallet tracking, MEV exposure mapping, liquidity skew detection — not alpha you buy, alpha you build."
    >
      {/* Body */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 100px' }}>

        {/* Section 1 */}
        <Section label="01" title="The Builder-Trader Overlap">
          <P>
            There&apos;s a specific archetype in the SF crypto scene that doesn&apos;t exist anywhere else
            in the same density: the engineer who degens their own infrastructure. They run the protocol,
            they LP in it, they front-run the inefficiencies they noticed while debugging it at 2am.
          </P>
          <P>
            This isn&apos;t a moral judgment. It&apos;s an observation about information asymmetry.
            The person who built the matching engine knows which tick sizes get skipped.
            The person who wrote the AMM knows at what reserve ratio the pool goes parabolic on slippage.
            That knowledge has value, and the SF scene has normalized building systems that
            systematically extract it.
          </P>
          <P>
            The playbook is roughly: build a tool to understand something on-chain, run it long enough
            to develop an intuition, then use that intuition to trade. Not HFT. Not quant. Just
            compounding research into edge.
          </P>
        </Section>

        <Divider />

        {/* Section 2 */}
        <Section label="02" title="Wallet Tracking as a Research Method">
          <P>
            The first primitive everyone learns is wallet tracking. Pick a protocol, find the top 20 wallets
            by realized P&L, and watch what they do for 30 days. The signal-to-noise ratio is terrible.
            Most of them will be bots, arbitrageurs, or insiders hedging known catalysts. But the ones
            who aren&apos;t — the ones who are just consistently right — teach you something about
            market structure that no paper does.
          </P>
          <P>
            Helius gRPC makes this tractable on Solana. You can stream account state changes at
            sub-100ms latency, filter by program, and reconstruct position deltas in real time.
            The RPCsol P&L project came out of exactly this workflow: pulling Helius RPC, computing
            balance deltas per block, running 15 iterations of optimization across BO, CMA-ES, DE,
            and TPE to find the attribution algorithm that best explained realized P&L from raw on-chain data.
          </P>
          <Callout>
            TPE converged at iter 12 with score 0.924. The key insight: most balance algorithms
            overfit to token-denominated gains and miss SOL-denominated fee extraction.
            The winning attribution weights fee rebates at 1.4x.
          </Callout>
          <P>
            The meta-lesson: on-chain data is messy. Every wallet balance is a superposition of
            trades, fees, rebates, and protocol incentives. The interesting research is in
            the attribution, not the raw numbers.
          </P>
        </Section>

        <Divider />

        {/* Section 3 */}
        <Section label="03" title="MEV Exposure Mapping">
          <P>
            Once you understand where wallets are making money, the next question is: how much of that
            is alpha, and how much is someone else&apos;s loss? This is the MEV question, and it&apos;s
            more nuanced on Solana than Ethereum because Solana doesn&apos;t have mempool MEV in the same form.
          </P>
          <P>
            The attack surface is different. PAMM pools are vulnerable to oracle manipulation: if you know
            the oracle update is coming before the AMM reprices, you can sandwich the repricing.
            Binary options and concentrated liquidity pools amplify this because the payoff curves
            are nonlinear — a 0.5% oracle move can flip a position.
          </P>
          <P>
            The PAMM MEV analysis ran Monte Carlo simulations across 10,000 attack scenarios to map
            how contagion spreads through interconnected AMM pools. The finding that surprised me most:
            adversarial trades spread furthest through pools with high inventory concentration,
            not high TVL. A pool with $50M TVL but 80% of liquidity from two wallets is more
            vulnerable than a $10M pool with broad distribution.
          </P>
          <Callout>
            Inventory concentration ratio is a better MEV exposure metric than TVL.
            Build a dashboard that tracks this across the pools you LP in.
          </Callout>
        </Section>

        <Divider />

        {/* Section 4 */}
        <Section label="04" title="Liquidity Skew and the PMM Edge">
          <P>
            The most underexplored area for builder-traders is proactive market making. CLOBs on Solana
            are competitive — Phoenix, Openbook, the perp DEXes — and the off-chain market makers
            have significant infrastructure advantages. But AMMs with oracle-based pricing are
            different. Here, the edge is in the skew mechanics.
          </P>
          <P>
            A PMM (Proactive Market Maker) adjusts its bid-ask spread dynamically based on
            inventory position and oracle price. When inventory skews toward Token A, the PMM
            widens the ask and narrows the bid to attract Token B inflow. The formula is roughly:
          </P>

          <div style={{
            background: '#050505', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '20px 24px', margin: '28px 0',
            fontFamily: mono, fontSize: '0.8rem', lineHeight: 1.8,
            color: 'rgba(255,255,255,0.6)',
            overflowX: 'auto',
          }}>
            <span style={{ color: '#00ffea' }}>eff</span> = base + vol_adj{'\n'}<br />
            <span style={{ color: '#00ffea' }}>skew</span> = (dev² / 8000).min(eff){'\n'}<br />
            <span style={{ color: '#00ffea' }}>ask</span> = eff + skew &nbsp;&nbsp;
            <span style={{ color: '#00ffea' }}>bid</span> = eff − skew<br />
            <br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}># A→B: out = in × 1e9 / (P × (1+ask))</span><br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}># B→A: out = in × P × (1−bid) / 1e9</span>
          </div>

          <P>
            The PMM dashboard in the Prop AMM project tracks effective spread, inventory ratio,
            and oracle cycles in real time. The research question: can you predict the optimal
            base spread parameter given current volatility and liquidity depth?
            Spoiler: CMA-ES on a rolling 4-hour window converges to a better steady-state
            than any static parameter.
          </P>
        </Section>

        <Divider />

        {/* Section 5 */}
        <Section label="05" title="The Field Manual">
          <P>
            If you&apos;re building this stack from scratch, here&apos;s the order that makes sense:
          </P>
          <ol style={{ paddingLeft: 24, lineHeight: 2.2, color: 'rgba(255,255,255,0.65)', fontSize: '1rem', letterSpacing: '0.02em' }}>
            <li>
              <strong style={{ color: '#fff' }}>Stream first.</strong> Set up Helius gRPC or equivalent.
              Everything else depends on low-latency account state.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Build a P&L ledger.</strong> Track every wallet you care about.
              Attribution is harder than it looks — iterate on the algorithm, not just the data source.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Map MEV exposure.</strong> For every pool you LP in,
              compute inventory concentration and oracle update frequency. These predict your bleed rate.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Parameterize your PMM.</strong> Static spreads are suboptimal
              in every market regime except the one you designed them for. Run optimization loops.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Dashboard everything.</strong> Not for aesthetics.
              Because the thing you don&apos;t monitor is the thing that kills you at 3am.
            </li>
          </ol>
          <P>
            The SF degen edge isn&apos;t secret information. It&apos;s information processing at speed,
            with tooling you built yourself, applied to markets you understand at a protocol level.
            The moat is the compounding. Every week you run this, the model gets sharper.
          </P>
        </Section>

        {/* Footer nav */}
        <div style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Link href="/#blog" style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            ← Back to Research Dispatch
          </Link>
          <span style={{ fontFamily: mono, fontSize: '0.52rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
            EST 2026 · AILEENA · MACHINA
          </span>
        </div>
      </article>
    </SubstackShell>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <span style={{ fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.4em', color: 'rgba(0,255,234,0.5)', textTransform: 'uppercase' }}>
          {label}
        </span>
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>
          {title}
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', lineHeight: 1.85, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
      {children}
    </p>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: '2px solid rgba(0,255,234,0.5)', paddingLeft: 20, margin: '28px 0',
      color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
      lineHeight: 1.75, letterSpacing: '0.02em', fontStyle: 'italic',
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '56px 0' }} />;
}
