'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function HuaweiHbmArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.06.23"
      tags="Huawei · Ascend · HBM · CXMT · SemiAnalysis"
      title="Why Huawei's Bet Isn't on the Chip"
      dek="Inside Huawei, the Ascend 950 has a codename: David. Goliath is across the table. Everyone fixates on the chip (one process generation behind, a third of NVIDIA's per-card compute), but in a real datacenter silicon is less than 20% of cost. The system fight Huawei has already won. The software fight flipped half-way in 2026. The one variable that decides 2026–2027 isn't the logic Huawei makes — it's the HBM it can't."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Inside Huawei, the <strong style={strong}>Ascend 950</strong> has a codename:{' '}
          <strong style={strong}>David</strong>. Across the table is{' '}
          <strong style={strong}>Goliath</strong>.
        </p>
        <p style={bodyStyle}>
          That codename gives away how Huawei thinks about this — and where the real tension sits.
          David's stone takes down a giant, but only if the giant stands still long enough to be
          aimed at. NVIDIA does not stand still: it ships a new architecture every year, and never
          stops sharpening the one already in the field. Huawei has proven it can throw a precision
          stone on Day 0. Whether it can hit a Goliath that is still running is another question.
        </p>
        <p style={bodyStyle}>
          But staring at the stone is staring at the wrong thing. Most of the noise around{' '}
          <strong style={strong}>Atlas 950</strong> fixates on the chip — one process generation
          behind, a third of NVIDIA's per-card throughput — and draws a conclusion. In a real
          datacenter, the silicon is <strong style={strong}>less than 20%</strong> of the cost. The
          other 80% is interconnect, cooling, power, and the engineering that organizes ten thousand
          cards into one machine. The chip is the engine. This fight is about the chassis, the
          gearbox, and the entire drivetrain.
        </p>
        <p style={bodyStyle}>
          So start with the technical heart.
        </p>

        <SectionLabel>Unified memory — collapsing the cluster into a single machine</SectionLabel>
        <p style={bodyStyle}>
          The classic pain of a ten-thousand-card cluster is not compute. It is compute sitting idle.
          There are plenty of cards, but each one can only address its own slice of{' '}
          <strong style={strong}>HBM</strong> &mdash; High Bandwidth Memory, the on-package memory
          that feeds each accelerator. Talking to another card means copying, syncing, waiting. Add
          tensor parallelism and <strong style={strong}>MoE</strong> (Mixture of Experts — the
          routing trick that lets today's biggest models activate only a slice of their parameters
          per token) and communication overhead eats most of the useful throughput. The cards spin.
          The work does not move.
        </p>
        <p style={bodyStyle}>
          Unified memory addressing flips this from a cluster problem into a single-machine problem.
          A fully-loaded Atlas 950 SuperPoD packs <strong style={strong}>8,192 Ascend NPUs</strong>{' '}
          (Neural Processing Units — Huawei's GPU equivalent), stitched together by{' '}
          <strong style={strong}>UnifiedBus</strong> all-optical fabric into a shared memory pool of{' '}
          <strong style={strong}>1,152 TB</strong>, where every card lives in one address space. A
          card reading another card's HBM looks identical to reading its own. The physical boundary
          stays; the logical boundary disappears.
        </p>
        <p style={bodyStyle}>
          The physical layer holds it together with three hard numbers. Bandwidth: UB-Mesh's
          recursive direct topology pushes total fabric bandwidth to{' '}
          <strong style={strong}>16.3 PB/s — 62×</strong> the industry average. That is the
          foundation that actually kills the data-shipping bottleneck. Latency: round-trip time
          drops from <strong style={strong}>7 microseconds to 3</strong>. For gradient-sync on
          trillion-parameter models and <strong style={strong}>KV-cache</strong> (the conversation
          memory inference engines reuse across tokens) shuttled card-to-card, every microsecond
          shaved is effective compute gained.
        </p>
        <p style={bodyStyle}>
          That is what "compensating for the single card with the swarm" actually means. Do not
          fight 3 nm or 2 nm on one die. Take address-space unification plus all-optical
          interconnect, and erase the per-card disadvantage at the system layer.
        </p>

        <SectionLabel>"6.7×" is true — with a caveat</SectionLabel>
        <p style={bodyStyle}>
          Huawei's official comparison: against NVIDIA's same-window{' '}
          <strong style={strong}>NVL144</strong>, the Atlas 950 has{' '}
          <strong style={strong}>56.8×</strong> the card count,{' '}
          <strong style={strong}>6.7×</strong> total compute,{' '}
          <strong style={strong}>15×</strong> the memory, and{' '}
          <strong style={strong}>62×</strong> the interconnect bandwidth.
        </p>
        <p style={bodyStyle}>
          The numbers are not fake. There is a caveat worth saying out loud. The 6.7× is Huawei's{' '}
          <strong style={strong}>~160-cabinet, 8,192-card</strong> full-rack array compared to
          NVIDIA's <strong style={strong}>single 144-card cabinet</strong>. NVIDIA's SuperPods can
          also scale to hundreds of cabinets. A hundred people on a scale outweigh an elephant —
          that does not make one person heavier than an elephant.
        </p>
        <p style={bodyStyle}>
          The honest version: per-card behind. Like-for-like, not necessarily ahead. But on{' '}
          <em>the largest single coherent SuperPoD one vendor can organize</em> — the dimension
          trillion- and ten-trillion-parameter training is most sensitive to — Huawei is genuinely
          first. Said this way, the claim is both sharp and defensible.
        </p>

        <SectionLabel>Software — the narrative flipped half-way in 2026</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>CANN</strong> is to CUDA what{' '}
          <strong style={strong}>MindSpore</strong> is to PyTorch. In August 2025 Huawei
          open-sourced CANN, trying to crack the moat NVIDIA spent eighteen years building. Every
          bear case landed on the same line: the ecosystem gap is too wide, migration is too
          expensive, and the open-source community is probably 100% Huawei employees committing to
          themselves.
        </p>
        <p style={bodyStyle}>
          That line took a hit in 2026 with one data point. When{' '}
          <strong style={strong}>DeepSeek V4</strong> dropped, Ascend was a launch platform with
          first-class <strong style={strong}>Day 0</strong> support. Part of DeepSeek's official
          API runs on Huawei from day one. More striking: only two software stacks on the planet
          had Day 0 support for DeepSeek V4 — <strong style={strong}>CUDA</strong>, and{' '}
          <strong style={strong}>CANN</strong>. AMD's ROCm did not get there on launch day. A year
          earlier, when V3 / R1 launched, that list had one entry.
        </p>
        <p style={bodyStyle}>
          The hardware lineup is not a prop, either. The 950 splits into{' '}
          <strong style={strong}>950PR</strong> (Prefill / recommendation, cheaper,
          throughput-tuned) and <strong style={strong}>950DT</strong> (Decode / training,
          higher-bandwidth, higher-performance) — same die, dual-die UMA architecture. Independent
          matrix cores (AIC) and vector cores (AIV) run in dual-master mode. On-chip AI CPU.
          A dedicated <strong style={strong}>CCU</strong> communication engine that echoes TPU and
          Trainium's purpose-built designs. Plus <strong style={strong}>MC²</strong>{' '}
          (compute-communication fused operators), introduced back in 2024. The ecosystem gap still
          exists. The speed at which it is closing has outpaced its 2025 pricing.
        </p>

        <SectionLabel>The real ceiling — HBM</SectionLabel>
        <p style={bodyStyle}>
          If the story stopped here it would be a brochure.
        </p>
        <p style={bodyStyle}>
          The sharpest bear case does not come from the system layer. Even SemiAnalysis concedes
          that Huawei's chip is a process generation behind, but its scale-up system architecture
          is a generation ahead of NVIDIA's and AMD's shipping products — and that the system
          matters more than the microarchitecture. The doubt collapses onto one specific atom:{' '}
          <strong style={strong}>HBM</strong>.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>The system advantage is, fundamentally, a memory advantage.</strong>{' '}
          The whole Atlas 950 story — the 1,152 TB shared pool, the 15× memory capacity vs NVL144 —
          sits on a mountain of HBM. The previous-generation{' '}
          <strong style={strong}>CM384</strong> already had{' '}
          <strong style={strong}>3.6×</strong> the aggregate memory and{' '}
          <strong style={strong}>2.1×</strong> the bandwidth of GB200 NVL72. More cards means a
          bigger pool means more HBM, linearly. The "swarm compensates for the single card"
          strategy trades a dependency on cutting-edge logic process for a dependency on HBM supply.
          It routes around the lithography machines. It cannot route around the memory.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>China itself knows where the choke is.</strong> No need to guess
          Huawei's anxiety — look at what it asks for at the negotiating table. In US–China talks
          Beijing has specifically asked for <strong style={strong}>looser HBM controls</strong> —
          not for looser TSMC capacity, not for looser EUV equipment. The detail of what gets asked
          for, and what does not, is its own signal. The bottleneck is not logic process. It is
          memory.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>The stockpile was smuggled, and it is draining.</strong> The
          Ascend NPUs running today mostly run on memory from a one-off scramble. Samsung shipped{' '}
          <strong style={strong}>11.4 million HBM stacks</strong> specifically to China —{' '}
          <strong style={strong}>7 million</strong> of them inside the one-month window between
          when the December 2024 export restriction was announced and when it took effect. (The
          restriction had been pre-announced for months, which acted as a buffer.) After the
          restriction took effect, a smuggling channel kept things going for a while: companies
          like CoAsia and Faraday shipped HBM-bearing "non-functional" chips into China — technically
          compliant as long as the package did not exceed the FLOPS red line — then de-soldered the
          HBM domestically. Packages used low-temperature solder joints to make decap easier. That
          channel was reportedly shut down after public exposure. Across all routes,{' '}
          <strong style={strong}>~13 million HBM stacks total</strong>, enough to package about{' '}
          <strong style={strong}>1.6 million Ascend 910Cs</strong>. Foreign-sourced HBM is expected
          to run out by year-end, after which production hits the wall.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>It is not the logic that cannot be made — it is that there is no
          memory to pair it with.</strong> The most counterintuitive and most damaging point:
          capacity is not gated by lithography, it is gated by memory.{' '}
          <strong style={strong}>SMIC</strong> can fab about{' '}
          <strong style={strong}>1 million</strong> 910C dies and{' '}
          <strong style={strong}>~500,000</strong> 910B dies this year — and a lot of those dies
          will never become finished products because there is no HBM to attach. SemiAnalysis lays
          out the math cleanly: if every advanced-logic die could be paired with HBM, Huawei's
          Ascend production next year would jump from{' '}
          <strong style={strong}>300,000 to over 5 million units</strong>. That 16× gap — 300K vs
          5M — is entirely bound by HBM. Lithography and SMIC yield are not the blocker. The
          alternative — falling back to slower <strong style={strong}>GDDR</strong> or{' '}
          <strong style={strong}>LPDDR</strong> memory — cannot sustain frontier-model training
          that depends on modern reinforcement learning, and cannot sustain large-scale inference
          deployment either.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Domestic HBM cannot fill the gap.</strong>{' '}
          <strong style={strong}>CXMT</strong> is catching up fast — poaching from Samsung, SK
          Hynix, and Micron, already shipping DDR5, only a year or two behind the leaders. HBM is a
          different problem. SemiAnalysis estimates CXMT can produce{' '}
          <strong style={strong}>~2 million HBM stacks next year — enough for 250,000 to 300,000
          Ascend 910Cs</strong>. Yield ramps and line conversions take time. The money is not the
          problem: China's Big Fund Phase 3 injected{' '}
          <strong style={strong}>$2 billion</strong> into CXMT in May 2024. But money does not buy
          years.
        </p>

        <SectionLabel>The real bet</SectionLabel>
        <p style={bodyStyle}>
          Three things, side by side.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>System engineering</strong> — the result is in. Huawei won.
          </li>
          <li>
            <strong style={strong}>Software ecosystem catch-up</strong> — the evidence is
            documented. Day 0 DeepSeek V4 on Ascend is exhibit A.
          </li>
        </ul>
        <p style={bodyStyle}>
          Neither of these is a variable anymore.
        </p>
        <p style={bodyStyle}>
          The one asymmetric risk sits on a single input Huawei does not control: an HBM stack, one
          at a time, smuggled in from Korea, eventually burned through. UnifiedBus could be ten
          times better; unified addressing could be twice as elegant. None of that decides how many
          8,192-card SuperPods Huawei ships in 2026 and 2027. Two curves decide that — CXMT's yield
          climb, and how long the stockpile holds. The system architecture is "can it be
          designed." HBM is "can it be built." The first Huawei won. The second is locked in
          someone else's hands.
        </p>
        <p style={bodyStyle}>
          Back to the codename. David's stone aimed true. But this time the giant is not standing
          still, and David's ammunition — not his aim — is dropping one stack at a time.
        </p>
        <p style={bodyStyle}>
          The bet is not on UnifiedBus. The bet is on the not-yet-ramped CXMT line in Hefei, and on
          the day the stockpile hits zero — and which one gets there first.
        </p>

        <SectionLabel>Related technical repos</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>CANN open-source community</strong> —{' '}
            <a href="https://gitcode.com/cann/community" style={linkStyle} target="_blank" rel="noopener noreferrer">
              gitcode.com/cann/community
            </a>{' '}
            (includes the DeepSeek V4 Ascend Day-0 inference optimization slides)
          </li>
          <li>
            <strong style={strong}>cann-recipes-infer</strong> —{' '}
            <a href="https://gitcode.com/cann/cann-recipes-infer" style={linkStyle} target="_blank" rel="noopener noreferrer">
              gitcode.com/cann/cann-recipes-infer
            </a>{' '}
            (Ascend DeepSeek V4 inference recipe; MTP / decode-step timing implementation)
          </li>
          <li>
            <strong style={strong}>SemiAnalysis InferenceX</strong> —{' '}
            <a href="https://github.com/SemiAnalysisAI/InferenceX" style={linkStyle} target="_blank" rel="noopener noreferrer">
              github.com/SemiAnalysisAI/InferenceX
            </a>{' '}
            (cross-chip Day-0 inference performance tracker, including the 950DT)
          </li>
          <li>
            <strong style={strong}>SGLang DeepSeek V4 support</strong> —{' '}
            <a href="https://github.com/sgl-project/sglang/pull/23600" style={linkStyle} target="_blank" rel="noopener noreferrer">
              github.com/sgl-project/sglang/pull/23600
            </a>; performance-optimization tracker:{' '}
            <a href="https://github.com/sgl-project/sglang/issues/23666" style={linkStyle} target="_blank" rel="noopener noreferrer">
              issues/23666
            </a>
          </li>
          <li>
            <strong style={strong}>vLLM DeepSeek V4 roadmap</strong> —{' '}
            <a href="https://github.com/vllm-project/vllm/issues/40902" style={linkStyle} target="_blank" rel="noopener noreferrer">
              github.com/vllm-project/vllm/issues/40902
            </a>
          </li>
        </ul>

        <SectionLabel>Source note</SectionLabel>
        <p style={bodyStyle}>
          Data and judgements draw primarily from three SemiAnalysis reports plus Huawei's own
          disclosures:
        </p>
        <ol style={listStyle}>
          <li>
            <em>Huawei AI CloudMatrix 384 — China's Answer to Nvidia GB200 NVL72</em>, Dylan Patel
            et al., 2025-04 (system architecture, power, all-optical interconnect, TSMC / HBM
            external dependencies).
          </li>
          <li>
            <em>Huawei Ascend Production Ramp: Die Banks, TSMC Continued Production, HBM Is The
            Bottleneck</em>, 2025-09 (production volumes, die-bank accounting, the Samsung HBM
            scramble, CXMT capacity estimates).
          </li>
          <li>
            <em>DeepSeek V4 1.6T Day 0 to Day 43 Performance Over Time</em>, 2026-06 (950PR / 950DT
            architecture, CANN Day-0 inference, the David codename).
          </li>
        </ol>
        <p style={bodyStyle}>
          SuperPoD specs and the comparison multiples (8,192 cards / 1,152 TB / 16.3 PB/s / 6.7×,
          56.8×, 15×, 62×) come from Xu Zhijun's keynote at Huawei Connect 2025 and the overseas
          debut at MWC Barcelona 2026.
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
