'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const hangarRefs = {
  cailian: 'https://www.cls.cn/detail/2410558',
  xinhuaBayin: 'http://www.nmg.xinhuanet.com/20250718/70f1cc85c9c84743a203a8eb13d984eb/c.html',
  guangming: 'https://tech.gmw.cn/2026-05/25/content_38788826.htm',
  peopleZhangjiakou: 'http://he.people.com.cn/n2/2025/0713/c192235-41289615.html',
  peopleLingang: 'http://sh.people.com.cn/n2/2026/0714/c138654-41638450.html',
} as const;

const asiaRefs = {
  bmi: 'https://technode.global/2026/07/29/singapore-to-retain-top-southeast-asia-data-center-status-despite-capacity-constraints-bmi/',
  mondaq: 'https://www.mondaq.com/new-technology/1729734/singapores-second-data-centre-call-for-application-from-pilot-to-power-play',
  technodeCfa: 'https://technode.global/2026/07/31/singapore-tightens-data-center-growth-as-johor-bangkok-jakarta-race-ahead/',
  firmus: 'https://firmus.co/newsroom/firmus-to-build-170-000-gpu-ai-factor-y-campus-with-nvidia-for-global-ai-natives',
  dcd: 'https://www.datacenterdynamics.com/en/news/firmus-to-deploy-170000-gpu-cluster-in-batam-indonesia/',
  cnbc: 'https://www.cnbc.com/2025/10/10/singapore-us-investigate-nvidia-client-megaspeed-export-controls-violation.html',
  edge: 'https://theedgemalaysia.com/node/799045',
  softbank: 'https://www.softbank.jp/en/corp/news/press/sbkk/2026/20260525_01/',
  yotta: 'https://yotta.com/press-releases/yotta-to-deploy-20000-nvidia-blackwell-ultra-gpus/',
} as const;

const references: { label: string; href: string }[] = [
  { label: 'Cailian — Wulanchabu DC census (26 Jun 2026)', href: hangarRefs.cailian },
  { label: 'Xinhua — Zhongjin Bayin 220 kV / 38.74% year-1 renewable (18 Jul 2025)', href: hangarRefs.xinhuaBayin },
  { label: 'Guangming — Unicom Zhongwei, Qi Jun (25 May 2026)', href: hangarRefs.guangming },
  { label: 'People.cn / Hebei Daily — Zhangjiakou H1 2025 big-data kWh (13 Jul 2025)', href: hangarRefs.peopleZhangjiakou },
  { label: 'People.cn — SenseCore Lingang occupancy (14 Jul 2026)', href: hangarRefs.peopleLingang },
  { label: 'TechNode Global / BMI — Singapore DC capacity (29 Jul 2026)', href: asiaRefs.bmi },
  { label: 'Mondaq — Singapore DC-CFA2 (pilot to power play)', href: asiaRefs.mondaq },
  { label: 'TechNode — Singapore tightens DC growth vs Johor / Bangkok / Jakarta (31 Jul 2026)', href: asiaRefs.technodeCfa },
  { label: 'Firmus — 170,000-GPU Batam campus with NVIDIA', href: asiaRefs.firmus },
  { label: 'DCD — Firmus 170,000-GPU cluster in Batam', href: asiaRefs.dcd },
  { label: 'CNBC / NYT — Megaspeed NVIDIA export-control probe (10 Oct 2025)', href: asiaRefs.cnbc },
  { label: 'The Edge — Bridge reallocates 68.4 MW from Megaspeed to Zenlayer (8 Apr 2026)', href: asiaRefs.edge },
  { label: 'SoftBank — AI Data Center GPU Cloud (25 May 2026)', href: asiaRefs.softbank },
  { label: 'Yotta — 20,000 NVIDIA Blackwell Ultra GPUs (18 Feb 2026)', href: asiaRefs.yotta },
  { label: 'Teaser · 概念扫盲 — units, power, whose order (15 August)', href: '/blog/china-neocloud-teaser' },
  { label: 'Companion — Why Huawei\'s Bet Isn\'t on the Chip', href: '/blog/huawei-hbm' },
  { label: 'Companion — NVIDIA Is Buying Its Own Demand', href: '/blog/nvidia-flywheel' },
];

export default function ChinaNeocloudArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.08.14"
      tags="China · Singapore · Neocloud · AIDC · NVIDIA · CoreWeave · Firmus · GDS · VNET · Runze"
      title="Is a Terrestrial Neocloud Possible in China?"
      dek="The megawatts are there. The company is not."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          <Link href="/blog/china-neocloud-teaser" style={linkStyle}>
            Teaser · 概念扫盲
          </Link>
          {' '}(15 August) — what a neocloud is, how a number is verified, whose order bought
          the megawatts.
        </p>

        <p style={bodyStyle}>
          China can already stand up terrestrial AI megawatts at{' '}
          <strong style={strong}>CoreWeave</strong> and{' '}
          <strong style={strong}>Nebius</strong> scale. What it does not have, and will not have
          under current GPU, customer, and capital rules, is a listed{' '}
          <strong style={strong}>NVIDIA-native third-party GPU cloud</strong> with CoreWeave&rsquo;s
          demand stack, allocation stack, and capital stack. People keep comparing{' '}
          <strong style={strong}>GDS</strong> to <strong style={strong}>NBIS</strong> because both
          have buildings and both have watts. That comparison is how you confuse a landlord with
          an airline. <strong style={strong}>Runze</strong>, <strong style={strong}>VNET</strong>,
          and GDS are airframes. A <strong style={strong}>neocloud</strong> (a specialist that
          rents reserved, leading-edge GPU cluster time to third parties, financed like a
          fleet) is an airline. China nationalized the airline.
        </p>

        <ul style={listStyle}>
          <li>
            <strong style={strong}>The MW bar is already cleared.</strong> Runze is operating
            ~750 MW with ~6 GW planned. VNET wholesale in-service is 907 MW. GDS designed IT is
            an estimated ~1.56 GW. CoreWeave is at 1.5 GW active. Nebius is targeting 800 MW–1 GW
            connected by year-end 2026. China is not short of halls.
          </li>
          <li>
            <strong style={strong}>The GPU bar is not.</strong> NVIDIA China DC Hopper shipments
            went from $4.6B in Q1 FY26 to $0 in Q1 FY27. The FY2026 10-K says the company is
            &ldquo;effectively foreclosed&rdquo; from China DC compute. Q2 FY27 guide assumes $0.
            Independents do not sit on the H100 / H200 / B200 / GB200 / GB300 allocation stack.{' '}
            <strong style={strong}>国产万卡</strong> (a domestic 10,000-card cluster on a
            non-CUDA compiler) is a different product.{' '}
            <strong style={strong}>曙光8000</strong> is a national supercomputer, not a checkout
            page.
          </li>
          <li>
            <strong style={strong}>The customer bar is not.</strong> US overflow from Microsoft,
            OpenAI, Meta, and Anthropic created CoreWeave. In China the overflow stays inside
            ByteDance, Alibaba, Tencent, or <strong style={strong}>国家超算</strong> (the national
            supercompute internet). ByteDance&rsquo;s 2026 domestic{' '}
            <strong style={strong}>IDC</strong> (internet data-center) demand is ~1.4–1.5 GW, and
            85–90% of that is leased halls, not rented GPU hours. DeepSeek building captive DCs
            is the tell. Kingsoft&rsquo;s Xiaomi line is a captive, not a demand stack.
          </li>
          <li>
            <strong style={strong}>The capital bar is not.</strong> CoreWeave FY2026 capex is
            $35–39B. Kingsoft, the high-water mark for a listed Chinese independent, is guiding
            RMB 15–20B (~$2–3B) and 31% of revenue is Xiaomi. UCloud&rsquo;s{' '}
            <strong style={strong}>定增</strong> (a follow-on / private placement) is ≤RMB 1.5B.
            There is no RMB GPU-<strong style={strong}>ABS</strong> (asset-backed securities)
            market.
          </li>
          <li>
            <strong style={strong}>If you want &ldquo;China NBIS&rdquo; as a stock, it does not
            exist. If you want &ldquo;China AI MW,&rdquo; it trades as Runze 300442, GDS, and
            VNET.</strong> A terrestrial GPU factory in China is possible and is arguably
            overbuilt versus independent demand. A terrestrial neocloud in the CRWV / NBIS sense
            is blocked on GPUs and customers, not on land or power.
          </li>
        </ul>

        <SectionLabel>1. Define the object</SectionLabel>
        <p style={bodyStyle}>
          A neocloud is not a <strong style={strong}>colo</strong> (colocation: you rent the hall
          and bring your own kit) with a GPU SKU bolted on. It is not a hyperscaler renting you
          an A100 for an afternoon. It is not a token API wrapper sitting on someone else&rsquo;s
          cluster. The Western neocloud debate has been about power and NVIDIA allocation. The
          China debate is about whether the renter exists.
        </p>
        <p style={bodyStyle}>Four tests, all required:</p>
        <ol style={listStyle}>
          <li>
            Gets leading-edge GPUs. Not last-gen remnants. Not a 国产 substitute on a different
            compiler.
          </li>
          <li>
            Builds 万卡-scale <strong style={strong}>IB</strong> (InfiniBand) or Ethernet fabrics.
          </li>
          <li>
            Sells reserved cluster time to third parties at high{' '}
            <strong style={strong}>ACV</strong> (annual contract value). Captive Xiaomi load is
            not this. A national supercomputer login is not this.
          </li>
          <li>
            Finances GPUs like aircraft. Residual-value risk (what the card is worth when the
            lease ends) sits on the balance sheet.
          </li>
        </ol>
        <p style={bodyStyle}>
          Fail any one and you are something else. Fail all four and you are a landlord with a
          liquid-cooling brochure.
        </p>
        <p style={bodyStyle}>
          CoreWeave is the reference recipe. Q2 2026 (11 August PR): 1.5 GW active at 30 June.
          Contracted ~3.7 GW at quarter-end, ~4.2 GW as of 11 August. Year-end 2026 active target
          above 1.85 GW. 51 data centers. Q2 revenue ~$2.6B. Revenue backlog cited at $104.2B.
          That is a GPU airline with a hyperscaler frequent-flyer program, an NVIDIA allocation
          window, and a debt market that treats Blackwell the way aircraft lessors treat a 737.
        </p>
        <p style={bodyStyle}>
          Nebius is the other recipe. Active power YE 2025 ~170 MW. Connected-power target YE
          2026: 800 MW–1 GW. Contracted-power target YE 2026: 5 GW. Q2 2026 group revenue
          $582.3m, AI cloud $574.9m. <strong style={strong}>ARR</strong> (annual recurring
          revenue) $3.0bn at end-June. Q2 capex ~$5.7bn. Cash $8.0bn at 30 June. ACV on Q2 core
          deals above $20m per MW. Mäntsälä 75 MW live. NVIDIA put $2B of equity in and gave it{' '}
          <strong style={strong}>Exemplar</strong> status on GB300 NVL72.
        </p>
        <p style={bodyStyle}>
          MW is an input. The product is reserved, leading-edge, third-party cluster time,
          financed like a fleet. China has the hangar. It does not have the carrier certificate.
        </p>

        <SectionLabel>2. China already cleared the MW bar</SectionLabel>
        <p style={bodyStyle}>
          Stop pretending the constraint is land, power, or a liquid-cooled building in Langfang.
          The constraint is not the building.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Live MW or GPUs</th>
                <th style={thStyle}>2026 target</th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>GPU gen disclosed?</th>
                <th style={thStyle}>Third-party demand?</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>CRWV</td>
                <td style={tdStyle}>1.5 GW active (30 Jun 2026)</td>
                <td style={tdStyle}>&gt;1.85 GW active YE; contracted ~4.2 GW</td>
                <td style={tdStyle}>GPU cloud</td>
                <td style={tdStyle}>Yes. NVIDIA allocation</td>
                <td style={tdStyle}>Yes. MSFT / OpenAI / Meta-class overflow</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>NBIS</td>
                <td style={tdStyle}>~170 MW active YE 2025</td>
                <td style={tdStyle}>800 MW–1 GW connected; 5 GW contracted</td>
                <td style={tdStyle}>GPU cloud</td>
                <td style={tdStyle}>Yes. NVIDIA</td>
                <td style={tdStyle}>Yes. &gt;$20m/MW ACV</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Runze 300442</td>
                <td style={tdStyle}>~750 MW operating</td>
                <td style={tdStyle}>~6 GW planned</td>
                <td style={tdStyle}>AIDC landlord</td>
                <td style={tdStyle}>No</td>
                <td style={tdStyle}>Landlord demand, not reserved GPU ACV</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>VNET</td>
                <td style={tdStyle}>907 MW wholesale in-service (31 Mar 2026)</td>
                <td style={tdStyle}>450–500 MW 2026 delivery</td>
                <td style={tdStyle}>AIDC landlord</td>
                <td style={tdStyle}>No</td>
                <td style={tdStyle}>Wholesale colo. Wulanchabu is the AI workhorse</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>GDS</td>
                <td style={tdStyle}>~1.56 GW designed IT (derived)</td>
                <td style={tdStyle}>1 GW FY 2026 sales; H1 bookings 470 MW</td>
                <td style={tdStyle}>AIDC landlord</td>
                <td style={tdStyle}>Mix ~50% CPU / 50% GPU</td>
                <td style={tdStyle}>Hyperscaler / wholesale, not a GPU catalog</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Kingsoft Cloud</td>
                <td style={tdStyle}>Not disclosed as MW</td>
                <td style={tdStyle}>AI gross billing ~RMB 1.0bn in Q1 2026</td>
                <td style={tdStyle}>GPU cloud, heavily captive</td>
                <td style={tdStyle}>Not as an NVIDIA SKU catalog</td>
                <td style={tdStyle}>Xiaomi ~31% of total rev; &gt;50% of 智算</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>UCloud</td>
                <td style={tdStyle}>24,131 cards; Wulanchabu A/B/C 61.7 MW</td>
                <td style={tdStyle}>定增 ≤RMB 1.5B</td>
                <td style={tdStyle}>GPU cloud, small</td>
                <td style={tdStyle}>Card count disclosed, not generation</td>
                <td style={tdStyle}>GPU 91.29% sold. 2025 AI-related rev ~RMB 685m</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          Read the table left to right. CRWV and NBIS sell cluster-hours. Runze, VNET, and GDS
          sell halls. Kingsoft and UCloud sell some GPU time, at a scale that does not print a
          $5bn quarter of capex and does not produce a $104bn backlog.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>These are airframes. Neoclouds are airlines. China
          nationalized the airline.</strong> The buildings are listed. The fleet is not for sale
          to third parties on a CoreWeave contract. ByteDance, Alibaba, and Tencent fly their own
          metal. 国家超算 flies the rest. CAICT 2025: 3.8B 智算 card-hours supplied, 1.4B used
          (36.8%). Some 国产 pools 70–80% idle. China overbuilt generic 智算 (intelligent
          compute) and underbuilt rentable CUDA 万卡. That is the opposite of the US neocloud
          shortage.
        </p>
        <p style={bodyStyle}>
          A 6 GW Runze plan against a UCloud that did ~RMB 685m of AI-related revenue in 2025 is
          not a tight market. It is a hall looking for a tenant who already has a hall.
        </p>

        <SectionLabel>3. Four missing ingredients</SectionLabel>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
          A. The GPU
        </p>
        <p style={bodyStyle}>
          This is no longer a vibe. It is a Federal Register.
        </p>
        <p style={bodyStyle}>
          BIS final rule <strong style={strong}>FR 2026-00789</strong>, effective 15 January 2026:
          case-by-case for <em>direct US exports</em> only if{' '}
          <strong style={strong}>TPP</strong> (Total Processing Performance, the BIS compute
          metric) &lt;21,000 and DRAM bandwidth &lt;6,500 GB/s, plus a 50% of US-end-use quantity
          cap, plus US-HQ lab testing of each shipment. Reexports from third countries remain
          presumption of denial. The 8 December 2025 &ldquo;opening&rdquo; is a trapdoor.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>To a PRC independent, Aug 2026</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>H100 / A100 / H800 / A800</td>
                <td style={tdStyle}>Banned</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>H20</td>
                <td style={tdStyle}>
                  License since 9 Apr 2025. ~$60m of licensed revenue after a $4.5bn charge.
                  Beijing informal &ldquo;avoid H20&rdquo; Aug 2025. Residual stock, not a
                  build-out SKU
                </td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>H200</td>
                <td style={tdStyle}>
                  Case-by-case from the US only. Kessler (BIS) told the House on 14 Jul 2026
                  shipments are &ldquo;very few, very small quantity.&rdquo; Reuters 14 May: ~10
                  firms cleared (Ali, Tencent, ByteDance, JD). Independents are not on the list.
                  $0 H200 program revenue at the FY2026 10-K date. 25% Section 232 tariff on the
                  US-test path
                </td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>B200 / GB200 / GB300 / Vera Rubin</td>
                <td style={tdStyle}>
                  Presumption of denial. This is the CoreWeave / NBIS / Lambda allocation class.
                  Closed
                </td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>B30A / B20</td>
                <td style={tdStyle}>
                  Never confirmed licensed or shipping as of Aug 2026. Do not model it
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          CoreWeave had HGX B300 <strong style={strong}>GA</strong> (general availability) in
          March 2026 and is first-wave Vera Rubin NVL72 in 2H2026. Nebius took $2bn of NVIDIA
          equity and Exemplar on GB300 NVL72. That channel is jurisdictionally closed to a PRC
          entity.
        </p>
        <p style={bodyStyle}>
          31 May 2026 BIS: license required for advanced chips to any entity whose ultimate
          parent is HQ&rsquo;d in China / Macau, wherever located. That killed the Singapore /
          Malaysia &ldquo;offshore neocloud&rdquo; as a Blackwell backdoor. Remote rental of
          overseas NVIDIA is still legal and under BIS review. Different product: workloads
          cross the border, cards do not.
        </p>
        <p style={bodyStyle}>
          国产万卡 is a different product. DeepSeek V4 <em>inference</em> was co-designed with
          Ascend 950DT (SemiAnalysis via Pandaily, 15 Jun 2026). V4 <em>training</em> still ran
          on NVIDIA (ChinaTalk). Huawei Cloud 昇腾云 had 2,663 customers by YE2025. China
          Mobile&rsquo;s 2026–27 超节点集采 is 6,208 CANN cards, bids ~RMB 2.06B. That is the
          real China GPU cloud at training-relevant scale, and it is a stack owner plus SOE, not
          a merchant neocloud.
        </p>
        <p style={bodyStyle}>
          曙光8000 登峰 went live 10 July 2026 in Zhengzhou: first all-domestic 10万卡 cluster,
          Haiguang, national supercompute internet. Genuine industrial achievement. Not a store.
          联通中卫 has &gt;14,000 GPUs in the ground and &gt;300 MW / &gt;10万卡 on the plan.
          Watch it. Do not re-rate it as CRWV.
        </p>
        <p style={bodyStyle}>
          Without the GPU, the 200 MW Langfang building is a spa. (The HBM / Ascend pairing
          ceiling that sits behind 国产 silicon is the companion argument in{' '}
          <Link href="/blog/huawei-hbm" style={linkStyle}>Why Huawei&rsquo;s Bet Isn&rsquo;t on
          the Chip</Link>.)
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          B. The customer
        </p>
        <p style={bodyStyle}>
          CoreWeave was not created by cheap Oklahoma power. CoreWeave was created by overflow.
          Microsoft, OpenAI, Meta, Anthropic: the labs that could not wait for Azure and GCP
          spilled demand onto a specialist that already had the NVIDIA relationship and the
          willingness to lever GPUs like aircraft. That is why CRWV can cite a $104.2bn backlog
          and why NBIS can print ACV above $20m per MW. (NVIDIA writing checks into those same
          names is the{' '}
          <Link href="/blog/nvidia-flywheel" style={linkStyle}>flywheel</Link>.)
        </p>
        <p style={bodyStyle}>
          In China the overflow never leaves the building. ByteDance 2026 domestic IDC demand is
          ~1.4–1.5 GW, Q1 already ~1 GW tendered. Self-build is only ~10–15%. The rest is leased
          IDC from the landlords in the table. That is megawatt leasing, not GPU-hour ACV.
          Alibaba&rsquo;s 2026 IDC plan is ~2 GW on the same pattern. Tencent trains on Tencent
          metal.
        </p>
        <p style={bodyStyle}>
          The Chinese Anthropic <em>is</em> the hyperscaler, or it is a lab the state would
          prefer inside the national supercompute internet. DeepSeek is the tell: V4 inference
          on Ascend, V4 training still NVIDIA, and 2026 recruiting for a Ulanqab 智算 campus. The
          one Chinese lab the West actually watches is not becoming a CoreWeave customer. It is
          becoming a landlord of its own.
        </p>
        <p style={bodyStyle}>
          The mid-tier labs that should be the TAM do rent. 智谱 2025 R&amp;D was RMB 3.18B, more
          than 70% compute; compute as a share of R&amp;D went from 17.3% (2022) to 71.8% in
          2025H1. MiniMax is in the same squeeze. That demand is real, and it is
          inference / token shaped. It is not a Microsoft $60bn reserved-IB offtake.
        </p>
        <p style={bodyStyle}>
          Kingsoft is the listed name people want to be the exception. Q1 2026 AI gross billing
          ~RMB 1.0bn, 50.1% of public cloud. Xiaomi ecosystem RMB 838m, 31.0% of total revenue.
          Related-party cap raised to RMB 14.2bn (2025–27). Captives are real revenue. Captives
          are not a neocloud demand stack.
        </p>
        <p style={bodyStyle}>
          Jiemian, 2 July 2026, unverified by the companies: Alibaba on a 5-year lease for 3,000+
          8-GPU servers, Xiaomi GPU budget on Kingsoft from ~RMB 4bn to &gt;RMB 10bn. Even if
          every word is true, a hyperscaler using a smaller cloud as a buffer is the opposite of
          the US pattern. In the US the hyperscaler is the <em>source</em> of overflow onto the
          neocloud. In this telling the hyperscaler is the <em>tenant</em> of the smaller cloud.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>No third-party foundation-model overflow, no neocloud.</strong>
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          C. The capital
        </p>
        <p style={bodyStyle}>
          A neocloud is a capital-markets vehicle that turns NVIDIA allocation plus hyperscaler
          offtake into levered cluster-hours.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>CRWV</th>
                <th style={thStyle}>NBIS</th>
                <th style={thStyle}>Kingsoft</th>
                <th style={thStyle}>UCloud</th>
                <th style={thStyle}>SenseTime</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>2026 spend</td>
                <td style={tdStyle}>FY capex $35–39B; Q2 $9.4B</td>
                <td style={tdStyle}>Q1 raised $6.3B (NVIDIA $2.0B equity + $4.3B converts); Jul 2026 first ABS $775m</td>
                <td style={tdStyle}>FY capex+leases RMB 15–20B; Q1 already RMB 3.0B</td>
                <td style={tdStyle}>定增 ≤RMB 1.5B; project IRR 8.49%</td>
                <td style={tdStyle}>2025 capex RMB 1.129B</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>NVIDIA</td>
                <td style={tdStyle}>Largest non-founder shareholder; Exemplar; B300 / Rubin first wave</td>
                <td style={tdStyle}>$2B equity; Exemplar GB300</td>
                <td style={tdStyle}>None. Cannot buy Blackwell</td>
                <td style={tdStyle}>None</td>
                <td style={tdStyle}>None</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Offtake</td>
                <td style={tdStyle}>Backlog $104B</td>
                <td style={tdStyle}>Meta up to $27B; MSFT up to $19.4B</td>
                <td style={tdStyle}>Xiaomi 31% of rev; Ali 5-yr unverified</td>
                <td style={tdStyle}>22,030 / 24,131 GPUs sold (91.29%)</td>
                <td style={tdStyle}>Mix. Not IG take-or-pay</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          On 2025–26 evidence a Chinese independent cannot raise $5B+/year of GPU capex without
          being an SOE or a hyperscaler captive. There is no GPU residual market in RMB, no
          NVIDIA rent-back floor, no <strong style={strong}>IG</strong> (investment-grade)
          offtake. STAR / HK 定增 is RMB 1–6B, not $10B HY GPU ABS. Policy banks fund buildings
          and 绿电, not $30k–$40k accelerators at CoreWeave velocity. Kingsoft at RMB 15–20B is
          the high-water mark, and 31% of revenue is Xiaomi. That is a captive cloud with a
          public listing, not a neocloud.
        </p>
        <p style={bodyStyle}>
          If the card is 昇腾, the secondary market is other domestic inference shops and the
          state. If the card is a legal NVIDIA SKU two generations behind what CoreWeave is
          racking, the Western renter will not show up. There is no China equivalent of the
          used-GPU bid that makes the aircraft-lease model close. Concrete is a REIT. China
          already has those. They are called GDS, VNET, and Runze.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          D. The power product
        </p>
        <p style={bodyStyle}>
          Nebius is in Mäntsälä, not Zhangjiakou, for a reason that is not &ldquo;Finland has
          empty land.&rdquo;
        </p>

        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Finland (NBIS home grid)</th>
                <th style={thStyle}>蒙西 / Inner Mongolia</th>
                <th style={thStyle}>四川</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Generation mix (kWh, not 绿证)</td>
                <td style={tdStyle}>2025: nuclear 37%, wind 26%, hydro 14.5%, fossils negligible</td>
                <td style={tdStyle}>2025 new-energy <em>generation</em> 32% (capacity 53%)</td>
                <td style={tdStyle}>2025 ~76% hydro</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>What the DC actually consumes</td>
                <td style={tdStyle}>2025 ops 95% low-carbon; 2026 100% renewable contracts, hydro-backed PPAs</td>
                <td style={tdStyle}>Policy target 80% = certificates + 交易</td>
                <td style={tdStyle}>Hydro is real kWh</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>PUE / heat</td>
                <td style={tdStyle}>Mäntsälä PUE as low as 1.13; heat to district heating</td>
                <td style={tdStyle}>Not disclosed as a NBIS-class product</td>
                <td style={tdStyle}>Not disclosed as a NBIS-class product</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Who cares</td>
                <td style={tdStyle}>Global labs writing training contracts</td>
                <td style={tdStyle}>Domestic labs, mostly</td>
                <td style={tdStyle}>Anyone who can actually get the hydro MW</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          Finland is a power <em>product</em>. A Western lab&rsquo;s sustainability team can take
          it to a board. China&rsquo;s AI MW is in 蒙西, 宁夏, 甘肃, 河北. Ningxia 2024 ~76%
          thermal. Gansu 2024 ~52% thermal. Zhangjiakou city generation can be ~80% renewable; DC
          consumption green share was about one-third in H1 2025, official.{' '}
          <strong style={strong}>80% 绿电, for a large share of the claimed figure, is
          绿证</strong> (green certificates — paper, not the kWh in the hall).
        </p>
        <p style={bodyStyle}>
          Domestic labs do not care. Global labs do. They will not put a multi-month pretraining
          run in a coal-majority grid dressed up with certificates. Sichuan is the honest
          exception on kWh, and it is not where the 6 GW of planned AIDC is clustering.
        </p>
        <p style={bodyStyle}>
          The Western analogy on power is also the wrong one. NDA director 刘烈宏, China
          Development Forum 23 March 2026: hub-node new compute facilities must hit 80%
          green-power share. NDRC weights; enforcement from 1 August 2026. Combined with{' '}
          <strong style={strong}>PUE</strong> (power usage effectiveness) ≤1.2 at hubs (行动计划,
          July 2024) and a freeze on new large DCs in cities where existing DCs are &gt;1 year
          old and utilization is &lt;50%. A CoreWeave-speed greenfield by a nobody is a planning
          violation, not a construction problem. 中卫 110 kV in ~3 months is what a telco gets.
          Power in China is permissioning. In Texas it is a queue. Different. Both bind.
        </p>
        <p style={bodyStyle}>
          IREN Horizon 1 getting Microsoft acceptance on 13 August 2026 for 50 MW, against a 480
          MW AI Cloud year-end target, is the Western version of this point. The offtaker is
          buying a power product and a GPU product together. China can sell the power. It cannot
          sell the bundled product to the offtaker that would make the equity story work.
        </p>

        <SectionLabel>4. What actually exists</SectionLabel>
        <p style={bodyStyle}>
          Three products get collapsed into one conversation. They are not one conversation.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>(i) The AIDC landlord.</strong> Runze, Chindata, VNET, GDS,
          数据港, 奥飞. Combined they already clear CoreWeave&rsquo;s live GW and are planning
          past it. The product is space, power, cooling. The tenant brings its own cards. GDS at
          a derived ~1.56 GW designed IT, 50/50 CPU/GPU, is the cleanest large-cap expression of
          &ldquo;China has the halls.&rdquo; A neocloud does not have a 50% CPU business. A
          neocloud&rsquo;s CPU business is the login node. Buy these if you want China AI MW. Do
          not buy these if you want residual-value leverage to NVIDIA. There is no NVIDIA. There
          is a REIT with a GPU-shaped tenant mix.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>(ii) GPU 零售 / 调度.</strong> AutoDL: ~30,000 cards, owned plus
          scheduled. The right product for a researcher who needs a handful of GPUs this weekend.
          The wrong product for a 万卡 reserved training run. SiliconFlow and the rest of the 调度
          layer improve utilization of a fragmented fleet. They do not build the fleet and do not
          sit on NVIDIA&rsquo;s allocation stack. CoreWeave is not a better AutoDL. CoreWeave
          eats foundation-model overflow.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>(iii) Closest-to-neocloud.</strong> SenseCore is the closest
          listed AI-native stack: 40,400 PFLOPS FP16 at YE2025, GenAI revenue RMB 3.63B (72% of
          2025 sales), WAIC 2026 plan of at least five domestic 万卡 clusters. Plan, not census.
          ACV is model plus token, not reserved IB. Kingsoft is the listed name with actual AI
          billing and a Xiaomi-shaped P&amp;L. UCloud is the only name with a public card census
          worth using: 24,131 cards, GPU 91.29% sold, max single cluster ~16,000, Wulanchabu 61.7 MW
          usable. 24,131 cards is Voltage Park&rsquo;s neighborhood on count (36k) and nowhere
          near Lambda&rsquo;s 10k+ GB300 in one factory on generation. 61.7 MW is a rounding
          error on Runze&rsquo;s 750 MW and on Nebius&rsquo;s 800 MW–1 GW connected target.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The tell is 基流.</strong> 36Kr frames it against CRWV / NBIS as
          cluster EPC, a 包工头 (a general contractor). Revenue RMB 32m / 325m / 520m (2023–25).
          More than 90,000 GPUs delivered across 66 projects, two 万卡. China professionalized{' '}
          <em>building</em> 万卡. The US professionalized <em>renting</em> them against IG paper.
        </p>
        <p style={bodyStyle}>
          Huawei Cloud 昇腾云 is the actual China GPU cloud at training-relevant scale. It is a
          stack owner. It is not an independent. Allocation of 950s goes to ByteDance, Alibaba,
          Tencent first.
        </p>

        <SectionLabel>5. The only doors that open</SectionLabel>
        <p style={bodyStyle}>
          Four doors. The MW door is already open and it does not get you a neocloud.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Door 1.</strong> 国产 chips become good enough for the median
          renter, not the frontier lab. If that median renter is most of the market by
          card-hours, a China-native GPU cloud can exist as a 国产 product. It will still not be
          CRWV. Watch 昇腾 rental GMV, not 万卡 ribbon-cuttings.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Door 2.</strong> A telco SOE runs a commercial 万卡 catalog at
          CRWV SLAs. 联通中卫 is the prototype. If a third party can reserve a 万卡 fabric at a
          published SLA without a ministry letter, China has a neocloud-shaped <em>service</em>.
          The equity lives inside a telco, not a NBIS ticker.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Door 3.</strong> Export controls reverse and NVIDIA needs a
          China channel. Not a one-quarter H200 headline. A repeating specialist allocation the
          way CoreWeave gets Blackwell. Until a specialist is actually receiving that contracted
          allocation, model zero.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Door 4.</strong> Global customers accept 绿证. They will not, for
          training. Sichuan hydro is the only generation mix in the hub set that looks like a
          Nordic PPA on kWh rather than on paper. The 6 GW of planned halls are not clustering
          there.
        </p>
        <p style={bodyStyle}>
          What does not open a door: another 200 MW liquid-cooled building, another 东数西算
          subsidy, another 定增, another WAIC 万卡 announcement. Those are landlord prints. They
          confirm the MW table. They do not move the four missing ingredients.
        </p>

        <SectionLabel>6. Net net</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>
            A terrestrial GPU factory in China: possible, and on the MW evidence arguably
            overbuilt versus independent demand. A terrestrial neocloud in the CRWV / NBIS sense:
            blocked on GPUs and customers, not on land or power. If you want &ldquo;China
            NBIS&rdquo; as a stock, it does not exist. If you want &ldquo;China AI MW,&rdquo; it
            trades as Runze 300442, GDS, and VNET.
          </strong>
        </p>
        <p style={bodyStyle}>
          The airline is missing because the four ingredients are missing together. NVIDIA China
          DC compute is at $0 and Blackwell is presumption of denial. No US-style overflow:
          ByteDance / Alibaba / Tencent keep the demand, Kingsoft is a Xiaomi captive, DeepSeek
          is building its own halls. No GPU-as-aircraft capital stack: Kingsoft&rsquo;s $2–3B is
          the ceiling, UCloud&rsquo;s 定增 is RMB 1.5B, there is no residual-value bid for 昇腾
          that a private-credit fund will lever. No power product a global lab will buy for
          training: 蒙西 / 宁夏 / 甘肃 generation is still thermal-majority in kWh, 80% 绿电 is
          绿证, and that is why NBIS is in Mäntsälä.
        </p>
        <p style={bodyStyle}>
          Confusing landlords with neoclouds is how people compare GDS to NBIS. Stop doing it.
          GDS is a very good way to own China AI MW. NBIS is a way to own a Nordic-plus-global
          GPU airline with $3.0bn of ARR, $5.7bn of quarterly capex, and ACV above $20m per MW.
          Those are different cash-flow identities. They will not converge because a building in
          Langfang learned to spell &ldquo;GB200.&rdquo;
        </p>
        <p style={bodyStyle}>
          The median outcome is the one already on the ground: SOE and hyperscaler captive
          clusters behind landlord MW, a retail / 调度 layer for the long tail, Huawei Cloud as
          the stack-owner cloud, and one or two listed GPU clouds that look like Kingsoft and
          UCloud. Real, growing, captive-heavy, 国产-tilted, and not CoreWeave. The bull outcome
          is Door 1 plus Door 2: 国产 chips good enough for the median renter, and a telco SOE
          that actually sells 万卡 by the hour. That is a China-native 智算 utility. It is still
          not NVIDIA-native third-party overflow. Do not pay CRWV multiples for it.
        </p>

        <p style={bodyStyle}>Watch:</p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Kingsoft 智算 mix.</strong> Does Xiaomi stay above 50% of 智算,
            or does third-party reserved ACV show up as a disclosed line with a customer count
            that is not two names?
          </li>
          <li>
            <strong style={strong}>UCloud card census.</strong> Next print: count, generation mix,
            Wulanchabu MW, AI revenue versus the 2025 ~RMB 685m. If cards 3x and revenue does
            not, it is a 国产 ASP problem, not a neocloud ramp.
          </li>
          <li>
            <strong style={strong}>H200 units actually landed</strong> after Kessler&rsquo;s
            &ldquo;very few&rdquo; (14 Jul 2026), and whether any independent (not Ali / Tencent /
            ByteDance / JD) ever appears on a license list. One SKU, one quarter, one exception
            is not an allocation stack.
          </li>
          <li>
            <strong style={strong}>昇腾 rental GMV.</strong> Ribbon-cuttings are theater. GMV,
            utilization, and repeat third-party reserved hours on 国产 silicon would say the
            median renter has moved.
          </li>
          <li>
            <strong style={strong}>联通中卫 commercial catalog.</strong> The question is whether a
            third party can reserve a 万卡 fabric at a published SLA without being the state.
          </li>
          <li>
            <strong style={strong}>BIS remote-rental of overseas NVIDIA.</strong> Still legal,
            under review. If banned, even the Singapore workaround for <em>workloads</em> dies.
          </li>
          <li>
            <strong style={strong}>Firmus Batam rack date.</strong> Q1 2027 campus; 170,000
            accelerators through 2027–28. Watch whether the $25–30bn offtake shows up as signed
            ACV, not a Bloomberg sentence.
          </li>
          <li>
            <strong style={strong}>Yotta D2 / SoftBank GPU Cloud.</strong> Yotta 20,736 B300
            targeted live August 2026. SoftBank &ldquo;AI Data Center GPU Cloud&rdquo; October
            2026. Legal NVIDIA. Sovereign Lambda, not CoreWeave, until someone other than a
            telco or a state mission writes ten-billion take-or-pay to an independent.
          </li>
        </ul>
        <p style={bodyStyle}>
          The megawatts were never the question. The company is.
        </p>

        <SectionLabel>The hangar tour</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>Wulanchabu.</strong> Year-end 2025: 84 signed DC projects, capex
          about RMB 39.975bn. Signed racks: more than 4 million. Built: 500,000. In operation:
          330,000. Occupancy: 66% (<ExtLink href={hangarRefs.cailian}>Cailian</ExtLink>, 26 Jun
          2026). UCloud cabinets above 95% at 30 June 2026; GPU 91.29%. Building D is 75% intent
          kilowatts, not signed leases. Zhongjin Bayin: dedicated 220 kV, own wind and PV, year-1
          renewable replacement <strong style={strong}>38.74%</strong> (<ExtLink href={hangarRefs.xinhuaBayin}>Xinhua</ExtLink>, 18 Jul 2025). Alibaba&rsquo;s GM
          claims 90% local green. Compare Zhongjin. DeepSeek is hiring civil engineers.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Zhongwei.</strong> Unicom buildings 1–2 storage, 3–4 training.
          Monthly power bill RMB 10–13 million (Qi Jun, <ExtLink href={hangarRefs.guangming}>Guangming</ExtLink>, 25 May 2026). Dec 2025: 14k
          GPUs / 85% / 98 MW IT. Apr 2026 visit: &gt;70k cards. Datang 500 MW PV is physical; 1.5
          GW wind is a virtual PPA. China Mobile Ningxia bought 78% green kWh in 2025.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Qingyang.</strong> Securities Times walked off Xifeng airport
          past a &ldquo;China Computing Valley&rdquo; sign. Mobile park: Kingsoft, Ali, MiniMax,
          Kimi, Suiyuan; immersion tanks, almost no fan noise. Telecom phase-1 occupancy ~97%.
          Kingsoft 2025 capex &gt;RMB 5bn, cluster light-up 18 May 2026. Tariff 0.398 via
          aggregation. Grid company: wind / solar &ldquo;don&rsquo;t obey,&rdquo; halls want 7×24.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Zhangjiakou.</strong> Sun Jun, Hebei Daily: H1 2025 big-data use
          4.071 TWh, green share about <strong style={strong}>one-third</strong> (<ExtLink href={hangarRefs.peopleZhangjiakou}>People.cn</ExtLink>, 13 Jul 2025). Do not
          confuse with 82.88% green <em>transaction</em> share. Chindata Huailai HQ &gt;200 MW IT.
          Runze Langfang 200 MW all-liquid: sold out, still commissioning as of April 2026 IR. No
          August site photo of live IT.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Lingang.</strong> Gu Ruoyu drives 60 km / one hour every morning.
          Buildings 1 and 3 have not been below 90% occupancy since Sep 2023 (<ExtLink href={hangarRefs.peopleLingang}>People.cn</ExtLink>, 14 Jul 2026). Customers who
          will not train in Qingyang. Latency is the product.
        </p>
        <p style={bodyStyle}>
          The idle is real, and it is not on this tour. CAICT: 3.8bn card-hours supplied, 1.4bn
          used, 36.8%. Shi Ke&rsquo;s &ldquo;digital unfinished buildings&rdquo; is 2025 CPPCC. Hub
          cities do not have named idle MW-class halls in 2026 visitor copy.
        </p>

        <SectionLabel>Can Singapore — or Asia — have a neocloud?</SectionLabel>
        <p style={bodyStyle}>
          Southeast Asia is not blocked on NVIDIA. Singapore island is blocked on power.
          China-parented vehicles in Singapore and Malaysia are blocked on BIS. Those three
          sentences are different businesses. Mixing them is how &ldquo;SEA has so many
          cards&rdquo; becomes a neocloud thesis.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          Singapore the island cannot host a training neocloud
        </p>
        <p style={bodyStyle}>
          Live IT capacity is about 1.1 GW, with BMI putting 2026 live capacity around 1.46 GW,
          still the largest in Southeast Asia (<ExtLink href={asiaRefs.bmi}>TechNode Global / BMI</ExtLink>, 29 Jul 2026). Data centres already use about 7% of national electricity,
          heading toward 12%. Land is 745 km². After the 2019 moratorium, new MW is rationed.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>DC-CFA1</strong> (2023, the first Data Centre Call for
          Applications) awarded <strong style={strong}>80 MW</strong> to four names: Equinix, GDS,
          Microsoft, and an AirTrunk–ByteDance consortium.{' '}
          <strong style={strong}>DC-CFA2</strong>, launched 1 Dec 2025, closed 31 Mar 2026,
          allocates <strong style={strong}>at least 200 MW</strong>,{' '}
          <strong style={strong}>PUE</strong> 1.25 or better, Green Mark Platinum, ≥50% eligible
          green energy (<ExtLink href={asiaRefs.mondaq}>Mondaq</ExtLink>;{' '}
          <ExtLink href={asiaRefs.technodeCfa}>TechNode</ExtLink>, 31 Jul 2026). BMI notes only
          ~20 MW under construction against ~980 MW in the development pipeline. Jurong Island has
          been earmarked 20 hectares for a low-carbon park that could take{' '}
          <strong style={strong}>up to 700 MW</strong> if built. That is a planning envelope, not
          a 2026 hall.
        </p>
        <p style={bodyStyle}>
          What Singapore is good for: low-latency inference, interconnect, banking and model-API
          front ends, a corporate HQ that can sign NVIDIA paper. What it is not good for: a 1 GW
          training factory. A CoreWeave-class campus is a power product. Singapore sells scarcity.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          The MW is across the causeway and across the strait
        </p>
        <p style={bodyStyle}>
          Johor is the spillover. Operational capacity is often cited around 1–2 GW in 2025–26;
          committed and planned pipelines are talked about at 5 GW or more, with some consultants
          stretching to 8–12 GW by 2030. Treat the high end as pipeline, not live IT. Clusters:
          Sedenak, Kulai, Nusajaya / Iskandar Puteri.
        </p>
        <p style={bodyStyle}>Named campuses (announced, mixed live/pipeline):</p>
        <ul style={listStyle}>
          <li>
            YTL + NVIDIA, YTL Green Data Center Park, Kulai: up to ~500 MW phased; first
            NVIDIA-powered hall about <strong style={strong}>20 MW</strong>, live Oct 2025.
          </li>
          <li>
            Vantage JHB1, Sedenak: 300 MW campus potential, Phase 1 go-live Jan 2026,
            liquid-cooled, 100 kW/rack class.
          </li>
          <li>
            Princeton Digital Group JH1, Sedenak: ~150 MW AI-ready.
          </li>
          <li>
            AirTrunk Johor ~150 MW early phase; Yondr 200–300 MW class; GDS Nusajaya / Kulai
            phased toward ~280 MW.
          </li>
          <li>
            ByteDance / TikTok Johor: reported 1–2 GW pipeline, RM10 bn. Pipeline.
          </li>
          <li>
            AWS, Microsoft, Google Malaysia regions: hyperscaler cloud, not a specialist GPU
            cloud.
          </li>
          <li>
            Equinix JH1/JH2: carrier-neutral, tens of MW.
          </li>
        </ul>
        <p style={bodyStyle}>
          Batam is the other lung. Firmus (Australia, Coatue round at $5.5bn, NVIDIA-backed) +
          Singapore-headquartered DayOne: <strong style={strong}>360 MW</strong> NVIDIA DSX AI
          Factory, up to{' '}
          <strong style={strong}>170,000</strong> Grace-Blackwell / Vera-Rubin / Vera accelerators
          through 2027–28, campus targeted Q1 2027 (<ExtLink href={asiaRefs.firmus}>Firmus</ExtLink>;{' '}
          <ExtLink href={asiaRefs.dcd}>DCD</ExtLink>). NVIDIA takes product revenue plus a share of
          cloud revenue. Firmus has talked $25–30bn offtake over six years. That is a target, not
          a backlog print like CoreWeave&rsquo;s $104bn. DayOne is already building; it has a 450
          MW PPA at Kabil Tech Park. Runze&rsquo;s planned Batam ~360 MW is a Chinese landlord
          going overseas. The tenant still brings the cards.
        </p>
        <p style={bodyStyle}>
          This is the actual &ldquo;Singapore neocloud&rdquo; geography:{' '}
          <strong style={strong}>company and network in Singapore, factory in Johor or
          Batam.</strong> Same latency band, different power politics.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          &ldquo;SEA has so many cards&rdquo; is three inventories mixed together
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Inventory A:</strong> hyperscaler and landlord MW. AWS /
          Microsoft / Google / ByteDance halls, GDS / AirTrunk / Vantage shells. Cards belong to
          the hyperscaler. Not a rental catalog.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Inventory B:</strong> the China cutout, now being unwound.
          Megaspeed (Singapore, spun out of a Chinese gaming company in 2023) bought nearly{' '}
          <strong style={strong}>$2bn</strong> of advanced NVIDIA product through a Malaysian
          subsidiary, into Malaysia and Indonesia DCs that appeared to remotely serve Chinese
          clients (<ExtLink href={asiaRefs.cnbc}>CNBC / NYT</ExtLink>, 10 Oct 2025). Bridge Data
          Centres (Bain) had allocated <strong style={strong}>68.4 MW</strong> to Megaspeed in
          Malaysia; by Feb 2026 that capacity was given to Zenlayer (
          <ExtLink href={asiaRefs.edge}>Bloomberg via Edge</ExtLink>, 8 Apr 2026). NVIDIA did
          spot checks. Megaspeed denies illegal transfers. BIS, 31 May 2026: a license is required
          for advanced chips to <strong style={strong}>any entity whose ultimate parent is
          headquartered in China or Macau, wherever located</strong>. Reexports stay presumption
          of denial. NVIDIA also tightened SG / MY / JP approved-buyer lists. Malaysia started
          NVIDIA export permits in 2025.
        </p>
        <p style={bodyStyle}>
          That inventory was real cards. It was not a local neocloud TAM. It was China demand
          sitting in Johor and Batam. The parent-HQ rule is designed to kill it. Remote rental of
          remaining SEA Blackwell by PRC labs is still legally grey and under BIS review.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Inventory C:</strong> genuine non-China GPU cloud, mostly not
          live yet. Firmus Batam (Q1 2027). YTL Kulai first 20 MW (live, small). Yotta in India
          (below). SoftBank in Japan (Oct 2026). These can buy Blackwell because the parent is
          Australian, Malaysian-listed, Indian, or Japanese.
        </p>
        <p style={bodyStyle}>
          If you add A+B+C and call it &ldquo;SEA neocloud capacity,&rdquo; you have counted
          shells, a closing loophole, and press releases. Only C is the object. C is still small,
          and a lot of it is 2027.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          Japan: sovereign neocloud, Lambda-scale, legal NVIDIA
        </p>
        <p style={bodyStyle}>
          SoftBank will launch &ldquo;AI Data Center GPU Cloud&rdquo; on GB200 NVL72 plus its
          Infrinia OS in October 2026, and uses the word neocloud in the press release (
          <ExtLink href={asiaRefs.softbank}>SoftBank</ExtLink>, 25 May 2026). Sakura Internet:
          Koukaryoku expanding toward ~10,800 GPUs, including HGX B200 at Ishikari, targeting 100%
          renewable by 2027. GMO GPU Cloud on H200; KDDI planning GB200 NVL72; Highreso Kagawa;
          Rutilea &gt;1,000 Hopper. METI-aligned. Cards are legal. Customers are domestic
          enterprises, robotics, telco, healthcare. Power is expensive; nuclear restart helps.
          This is a <strong style={strong}>sovereign Lambda</strong>, not CoreWeave. There is no
          Microsoft $60bn overflow onto an independent Japanese specialist. SoftBank is the
          telco-conglomerate doing it itself.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          India: the other legal NVIDIA pool
        </p>
        <p style={bodyStyle}>
          Yotta: 20,736 liquid-cooled Blackwell Ultra (HGX B300) at the 60 MW D2 hall in Greater
          Noida, targeted live August 2026, &gt;$2bn, Quantum-X800 InfiniBand (
          <ExtLink href={asiaRefs.yotta}>Yotta PR</ExtLink>, 18 Feb 2026). More than 10,000 of
          those B300s committed to the IndiaAI Mission. Separate four-year, &gt;$1bn NVIDIA DGX
          Cloud engagement, billed as one of APAC&rsquo;s largest. Yotta says &gt;10,000 NVIDIA
          GPUs already live, another 8,000 near-term, roadmap &gt;80,000 by FY27. Navi Mumbai
          campus scalable to 2 GW. Treat the million-GPU long-term line as marketing.
        </p>
        <p style={bodyStyle}>
          This is closer to a national AI factory with a commercial window than to CoreWeave. A
          large slice is sovereign. The commercial slice is real NVIDIA, legal, liquid-cooled, IB.
          Capital is Indian + NVIDIA engagement, not GPU-ABS against Meta / Microsoft paper.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          Korea and the rest
        </p>
        <p style={bodyStyle}>
          Korea: SK Telecom in the telco-neocloud club (with NTT, Deutsche Telekom, Orange).
          National AI Computing Center broken ground 2026, target 15,000 AI semiconductors by
          2028. Captive and sovereign. Taiwan: TSMC already fights for power; a specialist GPU
          cloud is politically and electrically crowded. Australia: Firmus&rsquo;s home, CDC,
          plenty of MW on paper, far from Asian users. UAE / Saudi (G42, Humain) are the non-US
          sovereign GPU clouds that actually look like a state-backed CoreWeave. They are not
          Southeast Asia, but they are the template &ldquo;Asia-Pacific&rdquo; bulls keep reaching
          for.
        </p>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          Mapping onto the three Western products
        </p>
        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Western object</th>
                <th style={thStyle}>Asia analog that actually exists</th>
                <th style={thStyle}>What is missing</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>CoreWeave (reserved IB, IG offtake, NVIDIA allocation, GPU debt)</td>
                <td style={tdStyle}>Not yet. Firmus offtake <em>target</em> $25–30bn is the closest press line. SoftBank is doing it inside the telco.</td>
                <td style={tdStyle}>Microsoft / Meta-style overflow onto an independent; GPU residual market in Asia</td>
              </tr>
              <tr style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Lambda / developer GPU cloud</td>
                <td style={tdStyle}>Sakura, GMO, Highreso, bits of Yotta commercial, YTL&rsquo;s first 20 MW</td>
                <td style={tdStyle}>Scale and a self-serve catalog at US prices</td>
              </tr>
              <tr style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Crusoe factory (single-tenant GW)</td>
                <td style={tdStyle}>Johor ByteDance pipeline, AWS / MSFT / Google Malaysia regions, DayOne shells</td>
                <td style={tdStyle}>That is the hyperscaler, not a ticker</td>
              </tr>
              <tr style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Landlord (APLD / GDS)</td>
                <td style={tdStyle}>GDS Nusajaya, AirTrunk, Vantage, DayOne, Runze Batam plan</td>
                <td style={tdStyle}>Already here</td>
              </tr>
              <tr style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>China cutout &ldquo;neocloud&rdquo;</td>
                <td style={tdStyle}>Megaspeed 68.4 MW at Bridge, $2bn Malaysian buy</td>
                <td style={tdStyle}>Being unwound by BIS parent-HQ rule</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          So can Singapore have one? Can Asia?
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Singapore-the-island:</strong> no, not at training scale. 80+200
          MW of new approvals against a 1 GW+ live base, 7–12% of national power, is a boutique.
          Inference, yes. Training factory, no.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Singapore-the-company:</strong> yes, if the parent is not China.
          Firmus+DayOne is the working drawing. HQ, contracting, NVIDIA relationship in Singapore;
          360 MW and 170k GPUs in Batam. That can be a neocloud in the Lambda-to-small-CRWV sense{' '}
          <strong style={strong}>if</strong> the $25–30bn offtake shows up as signed ACV, not a
          Bloomberg sentence, and <strong style={strong}>if</strong> the GPUs actually rack in
          2027.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Southeast Asia:</strong> not blocked on NVIDIA for non-China
          parents. Blocked on confusing three inventories. Johor&rsquo;s GW pipeline is mostly
          colo and hyperscaler. The China-linked racks are a shrinking stock. The new legal GPU
          clouds are 20 MW live (YTL), 170k GPUs promised (Firmus, 2027), plus whatever honest
          local clouds remain after whitelist cuts.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Asia as a whole:</strong> Japan and India can and are building
          legal NVIDIA GPU clouds. They look like sovereign Lambdas and national factories. They
          do not look like CoreWeave until someone other than a telco or a state mission writes a
          ten-billion-dollar take-or-pay to an independent. Firmus is the only name in the
          Singapore orbit even claiming that offtake. Watch the 2027 rack date and whether those
          contracts are real.
        </p>
        <p style={bodyStyle}>
          The China question does not get a Singapore escape hatch. BIS parent-HQ closed it. A
          Wulanchabu training run cannot legally sit on Batam Blackwell through a Singapore shell
          anymore. Remote rental is the leftover grey. That is a workload path, not a campus path,
          and it is on the BIS watch list.
        </p>
        <p style={bodyStyle}>
          Cards in Southeast Asia were never the scarce object. Clean title to those cards was.
        </p>

        <SectionLabel>References</SectionLabel>
        <ul style={listStyle}>
          {references.map((r) => (
            <li key={r.href} style={{ marginBottom: 10 }}>
              {r.href.startsWith('/') ? (
                <Link href={r.href} style={linkStyle}>
                  {r.label}
                </Link>
              ) : (
                <a href={r.href} style={linkStyle} target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 56 }}>
          <Link href="/dispatch" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Dispatch
          </Link>
        </div>

      </article>
    </SubstackShell>
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
const linkStyle: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(0,255,234,0.35)',
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px 10px 0',
  fontFamily: 'monospace',
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
};
const trStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };
const tdLabelStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 600,
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.7)',
  verticalAlign: 'top',
  lineHeight: 1.55,
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={linkStyle} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

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
