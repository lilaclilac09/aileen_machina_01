'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function HuaweiSupplyArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.06.23"
      tags="Huawei · NVIDIA · PCB · Supply chain · HBM"
      title="Two Supply Chains, One Bottleneck"
      dek="Companion piece to David's stone. Put the chip down and look at the board: a single GB200 cabinet's PCB stack is worth $170,000. The real supply-chain divergence between Huawei and NVIDIA isn't on the GPU die — it's on the multilayer board, the copper-clad laminate, and who has the right to decide whose board to use. One side is closed and self-reliant; the other is open and tightly controlled. The two strategies are not symmetric — but they end on the same atom."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Put the chip down. Look at the board. The really expensive engineering inside an AI
          cabinet sits, in large part, on a twenty-something-layer multilayer{' '}
          <strong style={strong}>PCB</strong> (printed circuit board — the substrate that carries
          every trace between every chip in the box) packed with high-speed routing. By industry
          estimates, the PCB stack inside a single NVIDIA <strong style={strong}>GB200</strong>{' '}
          cabinet is worth on the order of <strong style={strong}>$170,000</strong>. The real
          supply-chain divergence between Huawei and NVIDIA doesn't live on the GPU die. It lives
          on that board, on its copper-clad laminate, and on who gets to decide whose board to use.
        </p>
        <p style={bodyStyle}>
          Huawei and NVIDIA take opposite paths at this layer. One is{' '}
          <strong style={strong}>closed and self-reliant</strong>. The other is{' '}
          <strong style={strong}>open but tightly controlled</strong>. The difference is deeper
          than "domestic vs imported."
        </p>

        <SectionLabel>Protocol is supply chain</SectionLabel>
        <p style={bodyStyle}>
          Start from the conclusion of the previous piece. Huawei replaced three protocol layers —
          PCIe + NVLink + InfiniBand — with a single in-house protocol, <strong style={strong}>UnifiedBus</strong>{' '}
          (UB). NVIDIA keeps the layered stack of NVLink + PCIe + CXL. This isn't only a technical
          choice. It directly shapes the supply chain.
        </p>
        <p style={bodyStyle}>
          Full-stack in-house means Huawei refuses to outsource even the interconnect protocol.
          Protocol, memory addressing, system software, board-level hardware — all of it sits on
          one vertical line under one roof. The cost: a closed ecosystem that only serves Ascend
          clusters, with no third-party way in. NVIDIA goes the other direction. NVLink is
          proprietary, but the CUDA + NVLink ecosystem is open — every major framework and vendor
          can plug in. NVIDIA gives up "one protocol to rule them all" and gets back "supported by
          everyone."
        </p>
        <p style={bodyStyle}>
          The closed side has tight control and few seams. The open side has wide reach and lots of
          dependencies. Almost every other difference downstream — vendor lists, control models,
          which suppliers get rich on which order — grows out of this one root choice.
        </p>

        <SectionLabel>Two boards, two almost non-overlapping vendor lists</SectionLabel>

        <p style={bodyStyle}>
          <strong style={strong}>NVIDIA's side: clean list, global.</strong> The lead HDI-board
          supplier is China's <strong style={strong}>Victory Giant (胜宏科技)</strong>, which
          builds the GB200 Compute Tray and Switch Tray and has become NVIDIA's largest GPU-PCB
          supplier — with global share of AI-server PCBs above{' '}
          <strong style={strong}>30%</strong>. High-layer-count boards are led by{' '}
          <strong style={strong}>WUS (沪电股份)</strong> in China and{' '}
          <strong style={strong}>TTM</strong> in the US. The copper-clad laminate
          (<strong style={strong}>CCL</strong> — the dielectric sheet that gives the PCB its
          insulating layers and its high-speed character) is migrating M8 → M9, supplied by Korea's
          <strong style={strong}> Doosan</strong>, Taiwan's{' '}
          <strong style={strong}>Taiwan Union Tech (台光电子)</strong>, and{' '}
          <strong style={strong}>Shengyi (生益科技)</strong>, which broke into NVIDIA's chain.
          Concretely: the GB200 Compute Tray is{' '}
          <strong style={strong}>22 layers of HDI</strong> (18 M8 + 4 M4). GB300 switches back to a
          UBB + OAM design — a <strong style={strong}>UBB</strong> (Universal Baseboard, the single
          full-cabinet baseboard) of <strong style={strong}>18 layers</strong> (14 M8 + 4 M4), ASP
          per UBB around <strong style={strong}>$750–800</strong>, supplied by WUS and TTM. The
          Switch Tray's CCL is sole-sourced from Taiwan Union Tech — unit price jumped from
          <strong style={strong}> ~$2,000+</strong> in the M7 era to{' '}
          <strong style={strong}>~$4,000+</strong> for M8U.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Huawei's side: short list, deep, local.</strong> The Ascend PCB
          anchor is <strong style={strong}>Shennan Circuits (深南电路)</strong> — share of Huawei
          AI-server PCBs above <strong style={strong}>30%</strong>. Ascend-related boards are
          mostly built at its No. 2 plant and its W8 plant in Wuxi. On N+M-class high-layer-count
          processes its technical capability stands out, and it's one of very few mainland firms
          producing 14-layer-and-above <strong style={strong}>FC-BGA</strong> (Flip-Chip Ball Grid
          Array — the chip-mounting package substrate) with <strong style={strong}>ABF</strong>{' '}
          (Ajinomoto Build-up Film — the high-end dielectric for advanced packaging) carrier-board
          capability. That ABF capability is the link that makes Ascend's dense interconnect
          possible. Around Shennan: <strong style={strong}>Huafeng Technology (华丰科技)</strong>{' '}
          for high-speed connectors. <strong style={strong}>Xinsen (兴森科技)</strong> for Ascend
          ABF carrier boards. <strong style={strong}>Shenling Environment (申菱环境)</strong> for
          liquid cooling — roughly <strong style={strong}>70%</strong> share. Brokerage estimates
          put Ascend's overall domesticization rate above{' '}
          <strong style={strong}>82%</strong>, and the per-card PCB value of the Ascend 910C is
          likely above the H100's roughly <strong style={strong}>$407</strong>.
        </p>

        <p style={bodyStyle}>
          Worth naming the asymmetry: Shennan has not made it into NVIDIA's core chain to this
          point, and its Google share is low. That's the real difference between Shennan and
          Victory Giant / WUS — the latter two are players inside the global chain. Shennan is the
          anchor of the domestic chain. The same high-end PCB capability serves two non-overlapping
          systems.
        </p>

        <SectionLabel>Two control models</SectionLabel>
        <p style={bodyStyle}>
          NVIDIA's "open + strongly controlled" model has structure. On the customer side, the
          hyperscalers (<strong style={strong}>CSPs</strong> — cloud service providers) get the
          <strong style={strong}> MGX</strong> modular spec, which lets them pick their own
          peripheral components — that's the open face. On the supply side, NVIDIA uses{' '}
          <strong style={strong}>"buy and consign"</strong> (NVIDIA designates and contracts the
          parts; the CSP / ODM accepts and pays) to tightly control PCB, cold plate, and other
          high-value materials. That control is selective: NVIDIA picks the high-value items
          itself, and lets the contract manufacturers (Foxconn et al.) buy commodity capacitors and
          resistors themselves. Upstream of that, NVIDIA is locked all the way through to TSMC —
          fabrication, CoWoS advanced packaging, and the future CPO roadmap — which is the
          foundation of both its technology lead and its supply stability, and exactly the path
          Huawei would take if it could. At the ODM tier it's bound to Hon Hai (Foxconn), Quanta,
          and Inventec, and it's been shifting parts of PCB / PCBA capacity out of Taiwan to Mexico
          and Thailand (WUS's Thai plant has become one of its share-winning edges) — a global
          footprint that hedges geopolitical risk, though overseas build-outs aren't easy
          (operations and talent shortages are real). NVIDIA's control over the supply chain comes
          from being the chain anchor that every supplier wants to win.
        </p>
        <p style={bodyStyle}>
          Huawei's "closed and self-reliant" model isn't designed; it's forced. Under export
          controls, "global diversification" is not on the menu. The only available move is to pull
          the chain inside the border as far as possible — deep partnerships with Shennan, Shengyi,
          Shenling — trading the certainty of domestic orders for supply-chain autonomy. Control
          comes from vertical integration and state industrial intent, not from chain-anchor
          status. That autonomy carries a cost: closed is a forced choice. While building the
          domestic chain, Huawei loses the global frontier — TSMC's manufacturing, EUV
          lithography, the most advanced packaging. The bill won't show up this quarter. It will
          show up in the iteration cadence over time.
        </p>

        <SectionLabel>The asymmetric landing: the one layer that can't be broken through is HBM</SectionLabel>

        <p style={bodyStyle}>
          Sort the chain layer by layer by "can this be domestically substituted." You get a clean
          answer.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Protocol layer</strong> — Huawei builds it. UnifiedBus is
          full-stack in-house. No external dependency.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Board level</strong> — Huawei is essentially self-sufficient.
          Shennan + Huafeng + Shenling cover the PCB, connectors, and liquid cooling of an Ascend
          server without going outside the border. Export controls don't bite here.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Copper-clad laminate (the layer above the board)</strong> — China
          is structurally strong here. Shengyi's high-speed CCL share went from{' '}
          <strong style={strong}>18% in 2023 to 27% in 2025</strong>, and it supplies both chains
          — main supplier of the Switch-Board CCL at NVIDIA (above{' '}
          <strong style={strong}>50%</strong> share), plus Huawei.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Logic die</strong> — SMIC is climbing. Yield trails TSMC, but with
          enough capacity, million-die Ascend volumes aren't the blocker.
        </p>
        <p style={bodyStyle}>
          Going up the stack box by box, Huawei finds a domestic answer at almost every cell, or
          will eventually find one. Until the last cell. <strong style={strong}>HBM</strong>.
          That cell can't be broken through.
        </p>

        <p style={bodyStyle}>
          Not "temporarily can't" — structurally can't. The reason isn't a single point, it's a
          stack of four:
        </p>
        <ol style={listStyle}>
          <li>
            HBM is not ordinary DRAM. It needs <strong style={strong}>TSV</strong> (Through-Silicon
            Via — vertical wires drilled through the silicon to stack dies) and advanced stacked
            packaging. <strong style={strong}>CXMT</strong> trails the leaders by only one to two
            years on commodity DRAM, but on HBM the gap is another order of magnitude. Best case
            next year: <strong style={strong}>~2 million HBM stacks</strong>, enough for{' '}
            <strong style={strong}>250–300K Ascend NPUs</strong>. A drop in the bucket.
          </li>
          <li>
            The foreign stockpile is one-off. The roughly <strong style={strong}>13 million
            stacks</strong> already smuggled in are enough for about{' '}
            <strong style={strong}>1.6 million 910Cs</strong>, and they burn down by year-end.
          </li>
          <li>
            There's no substitute. <strong style={strong}>GDDR</strong> and{' '}
            <strong style={strong}>LPDDR</strong> bandwidth can't sustain frontier-model training
            or large-scale inference. Downgrading is exiting the game.
          </li>
          <li>
            This layer is the precise target of export controls — it's exactly what's being
            blocked. And it's the only thing Beijing specifically asked for in negotiations, not
            TSMC capacity, not lithography equipment.
          </li>
        </ol>

        <p style={bodyStyle}>
          Stack the four together and what it means is: without foreign HBM, Huawei won't make
          even <strong style={strong}>1 million Ascend NPUs next year</strong>. SemiAnalysis runs
          the math to its sharp end — assume no smuggling, and China's Ascend production next year
          is lower than this year, not higher. Logic, process node, board, protocol — all of these
          are catching up. Only HBM is moving the other direction.
        </p>

        <p style={bodyStyle}>
          That's the real landing of the whole piece, and it lines up exactly with the system
          fight's conclusion. The protocol unification, Shennan's high-layer board, Shengyi's
          CCL — everything in the earlier sections exists to set up one contrast: those are layers
          Huawei <em>can</em> build. No matter how loud an article makes them sound, none of them
          gets around the one layer Huawei <em>can't</em> build. UnifiedBus can let 8,192 cards
          behave like one machine. Shennan can stack a board to forty layers. As long as those
          handful of HBM stacks on every card still get airlifted from Korea, the whole
          "ten-thousand-cards-as-one-machine" building has a borrowed foundation.
        </p>

        <p style={bodyStyle}>
          Huawei wins every layer it can build itself. What pins it is the one layer it can't
          build, can't buy, and can't substitute. How far closed self-reliance carries depends not
          on how tightly it's closed, but on how long those HBM stacks outside the wall hold up.
          That countdown isn't a switch Huawei has a hand on.
        </p>

        <SectionLabel>Source note</SectionLabel>
        <p style={bodyStyle}>
          PCB / CCL / packaging vendor mapping and the GB200 / GB300 layer-stack numbers come from
          industry teardown reports and brokerage research. The HBM math (~13M stacks smuggled,
          ~2M from CXMT next year, "no foreign HBM → &lt;1M Ascend next year") is drawn from{' '}
          <em>Huawei Ascend Production Ramp: Die Banks, TSMC Continued Production, HBM Is The
          Bottleneck</em> (SemiAnalysis, 2025-09). UnifiedBus / system-architecture facts trace to
          Xu Zhijun's Huawei Connect 2025 keynote and the MWC Barcelona 2026 debut. The previous
          piece — <Link href="/blog/huawei-hbm" style={linkStyle}>Why Huawei's Bet Isn't on the
          Chip</Link> — covers the system-side argument this piece extends.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#dispatch" style={{
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
const linkStyle: React.CSSProperties = {
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
