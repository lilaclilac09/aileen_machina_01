/**
 * Magazine-rack data for the China terrestrial-neocloud issue.
 * Numbers preserved exactly from /blog/china-neocloud.
 */

import type { MagazineIssue } from './types';

export const CHINA_NEOCLOUD: MagazineIssue = {
  slug: 'china-neocloud',
  issueNumber: 'Issue 02',
  longFormHref: '/blog/china-neocloud',
  coverScene:
    'Wulanchabu at year-end 2025: 84 signed DC projects, more than 4 million racks signed, 330,000 in operation, occupancy 66%. DeepSeek is hiring civil engineers. Hub cities do not have named idle MW-class halls in 2026 visitor copy. The hangar is full. The airline is missing.',
  coverTitle: 'The Company Is Not',
  coverQuestion: 'Is a terrestrial neocloud possible in China?',

  whyThisIssue:
    'Because people keep comparing GDS to NBIS: both have buildings, both have watts. That comparison is how you confuse a landlord with an airline. We made this issue to separate China AI megawatts — already cleared, listed, overbuilt versus independent demand — from a CoreWeave/Nebius-class GPU airline, which is blocked on GPUs, customers, and capital, not on land or power.',

  columns: [
    {
      id: 'cover-story',
      label: 'Cover Story',
      tagline: 'The thesis behind the issue',
      cards: [
        {
          id: 'landlord-airline',
          title: 'Airframes, not airlines',
          scene: 'A sold-out Langfang hall with a liquid-cooling brochure and no checkout page',
          judgment:
            'Runze, VNET, and GDS are airframes. A neocloud is an airline. China nationalized the airline.',
          points: [
            'A neocloud rents reserved, leading-edge cluster time to third parties, financed like a fleet',
            'A colo with a GPU SKU bolted on is still a landlord',
            'If you want China NBIS as a stock, it does not exist',
          ],
          impact: 'reinforces',
          impactNote: 'Defines the object so GDS ≠ NBIS',
        },
        {
          id: 'four-tests',
          title: 'Four tests, all required',
          scene: 'A boarding pass that needs GPU, fabric, third-party ACV, and aircraft finance',
          judgment:
            'Fail any one and you are something else. Fail all four and you are a landlord with a liquid-cooling brochure.',
          points: [
            'Leading-edge GPUs — not last-gen remnants, not a 国产 substitute on a different compiler',
            '万卡-scale IB or Ethernet fabric, sold as reserved cluster time at high ACV',
            'Residual-value risk sits on the balance sheet, the way aircraft lessors treat a 737',
          ],
          impact: 'reinforces',
          impactNote: 'The China debate is whether the renter exists',
        },
        {
          id: 'mw-cleared',
          title: 'The MW bar is already cleared',
          scene: '750 MW live at Runze, 6 GW on the plan, halls looking for a tenant who already has a hall',
          judgment:
            'China is not short of halls. The constraint is not the building.',
          points: [
            'Runze ~750 MW operating / ~6 GW planned; VNET 907 MW wholesale; GDS ~1.56 GW designed IT',
            'CoreWeave 1.5 GW active; Nebius targeting 800 MW–1 GW connected by YE 2026',
            'A 6 GW Runze plan against UCloud ~RMB 685m of 2025 AI revenue is not a tight market',
          ],
          impact: 'reinforces',
          impactNote: 'Clears the wrong bottleneck so the right one is visible',
        },
      ],
    },

    {
      id: 'data',
      label: 'Data',
      tagline: 'The numbers that decide it',
      cards: [
        {
          id: 'gpu-zero',
          title: 'NVIDIA China DC compute is $0',
          scene: 'Hopper shipments from $4.6B in Q1 FY26 to $0 in Q1 FY27',
          judgment:
            'Independents do not sit on the H100/H200/B200/GB200/GB300 allocation stack. The FY2026 10-K says NVIDIA is effectively foreclosed from China DC compute.',
          points: [
            'BIS FR 2026-00789: case-by-case for direct US exports only if TPP <21,000 and DRAM bandwidth <6,500 GB/s',
            'H200: Kessler told the House 14 Jul 2026 shipments are “very few, very small quantity”; independents not on the ~10-firm list',
            'B200 / GB200 / GB300 / Vera Rubin: presumption of denial — the CoreWeave/NBIS/Lambda class, closed',
          ],
          impact: 'reinforces',
          impactNote: 'The GPU bar is a Federal Register, not a vibe',
          drawer: {
            sources: [
              'NVIDIA FY2026 10-K',
              'BIS final rule FR 2026-00789, effective 15 January 2026',
              'Kessler (BIS) House testimony, 14 Jul 2026',
              'Reuters, 14 May 2026 (~10 firms cleared for H200)',
            ],
          },
        },
        {
          id: 'capital-gap',
          title: '$35–39B versus RMB 15–20B',
          scene: 'CoreWeave printing a $9.4B quarter of capex; Kingsoft guiding the Chinese independent ceiling',
          judgment:
            'A Chinese independent cannot raise $5B+/year of GPU capex without being an SOE or a hyperscaler captive.',
          points: [
            'CRWV FY2026 capex $35–39B, Q2 $9.4B, backlog $104.2B',
            'Kingsoft FY capex+leases RMB 15–20B (~$2–3B); 31% of revenue is Xiaomi',
            'UCloud 定增 ≤RMB 1.5B; SenseTime 2025 capex RMB 1.129B; no RMB GPU-ABS market',
          ],
          impact: 'reinforces',
          impactNote: 'STAR/HK 定增 is RMB 1–6B, not $10B HY GPU ABS',
          drawer: {
            math: 'Kingsoft RMB 15–20B ≈ $2–3B. CoreWeave FY capex $35–39B is an order of magnitude above the listed Chinese independent ceiling.',
          },
        },
        {
          id: 'idle-hours',
          title: '3.8B supplied, 1.4B used',
          scene: 'CAICT 2025: 36.8% of 智算 card-hours used; some 国产 pools 70–80% idle',
          judgment:
            'China overbuilt generic 智算 and underbuilt rentable CUDA 万卡 — the opposite of the US neocloud shortage.',
          points: [
            'CAICT 2025: 3.8B 智算 card-hours supplied, 1.4B used (36.8%)',
            'ByteDance 2026 domestic IDC demand ~1.4–1.5 GW, 85–90% leased halls not rented GPU hours',
            'UCloud 24,131 cards, GPU 91.29% sold, 2025 AI-related rev ~RMB 685m — Voltage Park neighborhood on count, not Lambda on generation',
          ],
          impact: 'reinforces',
          impactNote: 'Halls looking for a tenant who already has a hall',
        },
        {
          id: 'acv-gap',
          title: 'NBIS ACV above $20m per MW',
          scene: 'Nebius Q2: ARR $3.0bn, capex ~$5.7bn, cash $8.0bn, Exemplar on GB300 NVL72',
          judgment:
            'MW is an input. The product is reserved, leading-edge, third-party cluster time, financed like a fleet.',
          points: [
            'NBIS YE 2026: 800 MW–1 GW connected, 5 GW contracted; Q2 group revenue $582.3m',
            'CRWV: 1.5 GW active 30 Jun 2026, contracted ~4.2 GW as of 11 August, Q2 revenue ~$2.6B',
            'Kingsoft Q1 2026 AI gross billing ~RMB 1.0bn; Xiaomi ecosystem RMB 838m, 31.0% of total revenue',
          ],
          impact: 'reinforces',
          impactNote: 'Different cash-flow identities will not converge on a Langfang GB200 sticker',
        },
      ],
    },

    {
      id: 'ground',
      label: 'On the Ground',
      tagline: 'What’s actually happening in the field',
      cards: [
        {
          id: 'wulanchabu',
          title: 'Wulanchabu is full',
          scene: '84 signed DC projects, >4 million racks signed, 330,000 in operation, occupancy 66%',
          judgment:
            'The hangar is occupied by hyperscalers and landlords, not by a third-party GPU catalog. Building D is intent kilowatts, not signed leases.',
          points: [
            'YE 2025: 84 signed DC projects, capex about RMB 39.975bn; built 500,000 racks (Cailian, 26 Jun 2026)',
            'UCloud cabinets above 95% at 30 June 2026; GPU 91.29%; Building D 75% intent kW',
            'Zhongjin Bayin: dedicated 220 kV, year-1 renewable replacement 38.74% (Xinhua, 18 Jul 2025). Alibaba GM claims 90% local green. Compare Zhongjin. DeepSeek is hiring civil engineers',
          ],
          impact: 'reinforces',
          impactNote: 'Live MW ≠ rentable CUDA 万卡',
          drawer: {
            sources: [
              'https://www.cls.cn/detail/2410558',
              'http://www.nmg.xinhuanet.com/20250718/70f1cc85c9c84743a203a8eb13d984eb/c.html',
            ],
          },
        },
        {
          id: 'zhongwei',
          title: '联通中卫 is a telco campus',
          scene: 'Storage in buildings 1–2, training in 3–4, RMB 10–13 million electricity per month',
          judgment:
            'Watch it. Do not re-rate it as CRWV. The equity, if a catalog ever appears, lives inside a telco.',
          points: [
            'Dec 2025: 14k GPUs / 85% / 98 MW IT. Apr 2026 visit: >70k cards',
            'Datang 500 MW PV is physical; 1.5 GW wind is a virtual PPA',
            'China Mobile Ningxia bought 78% green kWh in 2025 (Qi Jun, Guangming, 25 May 2026)',
          ],
          impact: 'uncertain',
          impactNote: 'Door 2 prototype — service, not a NBIS ticker',
          drawer: {
            sources: ['https://tech.gmw.cn/2026-05/25/content_38788826.htm'],
          },
        },
        {
          id: 'qingyang',
          title: 'Qingyang wants 7×24; the wind does not obey',
          scene: 'Securities Times off Xifeng airport, past a China Computing Valley sign, almost no fan noise',
          judgment:
            'Kingsoft is a real tenant-operator here, not a CoreWeave offtake story.',
          points: [
            'Mobile park: Kingsoft, Ali, MiniMax, Kimi, Suiyuan; Telecom phase-1 occupancy ~97%',
            'Kingsoft 2025 capex >RMB 5bn, cluster light-up 18 May 2026, tariff 0.398 via aggregation',
            'Grid company: wind/solar “don’t obey,” halls want 7×24',
          ],
          impact: 'reinforces',
          impactNote: 'Power is permissioning plus intermittency, not a Nordic PPA product',
        },
        {
          id: 'lingang',
          title: 'Lingang will not train in Qingyang',
          scene: 'Gu Ruoyu drives 60 km / one hour every morning. Latency is the product.',
          judgment:
            'Customers who will not train in Qingyang. Opposite of a western neocloud.',
          points: [
            'Buildings 1 and 3 have not been below 90% occupancy since Sep 2023',
            'Zhangjiakou H1 2025 big-data use 4.071 TWh, green share about one-third — not 82.88% transaction share',
            'Runze Langfang 200 MW all-liquid: sold out, still commissioning as of April 2026 IR. No August site photo of live IT',
          ],
          impact: 'weakens',
          impactNote: 'Real third-party demand exists — coastal latency, not reserved IB overflow',
          drawer: {
            sources: [
              'http://sh.people.com.cn/n2/2026/0714/c138654-41638450.html',
              'http://he.people.com.cn/n2/2025/0713/c192235-41289615.html',
            ],
          },
        },
        {
          id: 'idle-elsewhere',
          title: 'The idle is not on this tour',
          scene: 'Hub cities do not have named idle MW-class halls in 2026 visitor copy',
          judgment:
            'The idle is real. Shi Ke’s “digital unfinished buildings” is 2025 CPPCC. It is not the hangar tour.',
          points: [
            'CAICT: 3.8bn card-hours supplied, 1.4bn used, 36.8%',
            'Some 国产 pools 70–80% idle — generic 智算, not named hub halls',
            'Visitor copy in Wulanchabu / Zhongwei / Qingyang / Lingang describes occupancy, not empty hyperscale',
          ],
          impact: 'uncertain',
          impactNote: 'Overbuilt 智算 hours ≠ empty MW-class halls on the tour',
        },
      ],
    },

    {
      id: 'people',
      label: 'People',
      tagline: 'Who is saying what, and why',
      cards: [
        {
          id: 'kessler',
          title: 'Kessler to the House: very few, very small',
          scene: '14 July 2026, BIS on H200 shipments',
          judgment:
            'One SKU, one quarter, one exception is not an allocation stack. Independents are not on the list.',
          points: [
            'H200 case-by-case from the US only; $0 H200 program revenue at the FY2026 10-K date',
            'Reuters 14 May: ~10 firms cleared — Ali, Tencent, ByteDance, JD',
            '31 May 2026 BIS: license required if the ultimate parent is HQ’d in China/Macau, wherever located',
          ],
          impact: 'reinforces',
          impactNote: 'Killed the Singapore/Malaysia Blackwell backdoor',
        },
        {
          id: 'deepseek',
          title: 'DeepSeek is becoming a landlord',
          scene: 'V4 inference on Ascend 950DT; V4 training still NVIDIA; 2026 recruiting for a Ulanqab 智算 campus',
          judgment:
            'The one Chinese lab the West actually watches is not becoming a CoreWeave customer.',
          points: [
            'Inference co-designed with Ascend 950DT (SemiAnalysis via Pandaily, 15 Jun 2026)',
            'Training still NVIDIA (ChinaTalk)',
            'Captive DC is the tell: overflow never leaves the building',
          ],
          impact: 'reinforces',
          impactNote: 'No third-party foundation-model overflow, no neocloud',
        },
        {
          id: 'kingsoft-xiaomi',
          title: 'Kingsoft’s Xiaomi line',
          scene: 'Q1 2026: AI gross billing ~RMB 1.0bn; Xiaomi ecosystem RMB 838m',
          judgment:
            'Captives are real revenue. Captives are not a neocloud demand stack.',
          points: [
            'Xiaomi 31.0% of total revenue; related-party cap raised to RMB 14.2bn (2025–27)',
            'Jiemian 2 Jul 2026 (unverified): Ali 5-year lease for 3,000+ 8-GPU servers; Xiaomi GPU budget ~RMB 4bn → >RMB 10bn',
            'In the US the hyperscaler is the source of overflow; in this telling the hyperscaler is the tenant',
          ],
          impact: 'uncertain',
          impactNote: 'The listed name people want to be the exception is still captive-shaped',
        },
        {
          id: 'liu-liehong',
          title: '刘烈宏 at the China Development Forum',
          scene: '23 March 2026: hub-node new compute facilities must hit 80% green-power share',
          judgment:
            'A CoreWeave-speed greenfield by a nobody is a planning violation, not a construction problem.',
          points: [
            'NDRC weights; enforcement from 1 August 2026',
            'PUE ≤1.2 at hubs (行动计划, July 2024); freeze where existing DCs are >1 year old and utilization <50%',
            '中卫 110 kV in ~3 months is what a telco gets. Power in China is permissioning',
          ],
          impact: 'reinforces',
          impactNote: 'Texas is a queue. China is a permit. Both bind',
        },
      ],
    },

    {
      id: 'counter',
      label: 'Counter',
      tagline: 'The other side of the call',
      cards: [
        {
          id: 'door-1',
          title: 'Door 1 — 国产 good enough for the median renter',
          scene: 'Huawei Cloud 昇腾云: 2,663 customers by YE2025; China Mobile 超节点集采 6,208 CANN cards, bids ~RMB 2.06B',
          judgment:
            'A China-native GPU cloud can exist as a 国产 product. It will still not be CRWV.',
          points: [
            'Watch 昇腾 rental GMV, utilization, and repeat third-party reserved hours — not 万卡 ribbon-cuttings',
            '曙光8000 登峰 went live 10 July 2026 in Zhengzhou: first all-domestic 10万卡 cluster — genuine, not a store',
            'Do not pay CRWV multiples for a 智算 utility',
          ],
          impact: 'weakens',
          impactNote: 'Opens a China-native cloud. Does not open NVIDIA-native third-party overflow',
        },
        {
          id: 'door-2',
          title: 'Door 2 — a telco SOE with CRWV SLAs',
          scene: '联通中卫: >14,000 GPUs in the ground, >300 MW / >10万卡 on the plan',
          judgment:
            'If a third party can reserve a 万卡 fabric at a published SLA without a ministry letter, China has a neocloud-shaped service.',
          points: [
            'The equity lives inside a telco, not a NBIS ticker',
            'Huawei Cloud 昇腾云 is the actual training-relevant GPU cloud — a stack owner, not an independent',
            'Allocation of 950s goes to ByteDance, Alibaba, Tencent first',
          ],
          impact: 'uncertain',
          impactNote: 'The prototype is real. The catalog is not yet a checkout page',
        },
        {
          id: 'door-3',
          title: 'Door 3 — export controls reverse',
          scene: 'Not a one-quarter H200 headline. A repeating specialist allocation the way CoreWeave gets Blackwell',
          judgment:
            'Until a specialist is actually receiving that contracted allocation, model zero.',
          points: [
            'H20: ~$60m licensed revenue after a $4.5bn charge; Beijing informal “avoid H20” Aug 2025',
            'B30A / B20 never confirmed licensed or shipping as of Aug 2026',
            'Remote rental of overseas NVIDIA is still legal and under BIS review — workloads cross the border, cards do not',
          ],
          impact: 'uncertain',
          impactNote: 'The 8 December 2025 opening is a trapdoor',
        },
        {
          id: 'singapore-hatch',
          title: 'Singapore is not an escape hatch',
          scene: 'Company and network in Singapore, factory in Johor or Batam — until BIS parent-HQ closed the China cutout',
          judgment:
            'A Wulanchabu training run cannot legally sit on Batam Blackwell through a Singapore shell anymore.',
          points: [
            'Singapore island: ~1.1 GW live IT, BMI 2026 ~1.46 GW; DC-CFA1 80 MW; DC-CFA2 ≥200 MW; 7–12% of national power. Inference boutique, not a 1 GW training factory',
            'Megaspeed: nearly $2bn NVIDIA via a Malaysian subsidiary; Bridge 68.4 MW given to Zenlayer by Feb 2026. Inventory B is being unwound',
            'Remote rental of remaining SEA Blackwell by PRC labs is still legally grey and under BIS review — a workload path, not a campus path',
          ],
          impact: 'reinforces',
          impactNote: 'The China question does not get a Singapore campus',
          drawer: {
            sources: [
              'https://technode.global/2026/07/29/singapore-to-retain-top-southeast-asia-data-center-status-despite-capacity-constraints-bmi/',
              'https://www.cnbc.com/2025/10/10/singapore-us-investigate-nvidia-client-megaspeed-export-controls-violation.html',
              'https://theedgemalaysia.com/node/799045',
            ],
          },
        },
        {
          id: 'firmus-yotta',
          title: 'Firmus 2027, Yotta August, SoftBank October',
          scene: 'Inventory C: legal NVIDIA, mostly not live yet, parent not China',
          judgment:
            'Japan and India look like sovereign Lambdas and national factories. They do not look like CoreWeave until someone other than a telco or a state mission writes ten-billion take-or-pay to an independent.',
          points: [
            'Firmus + DayOne Batam: 360 MW, up to 170,000 accelerators through 2027–28, Q1 2027 campus; $25–30bn offtake is a target, not a $104bn backlog',
            'Yotta: 20,736 HGX B300 at 60 MW D2 Greater Noida, targeted live August 2026; >10,000 committed to IndiaAI Mission',
            'SoftBank AI Data Center GPU Cloud on GB200 NVL72, October 2026. YTL Kulai first NVIDIA hall about 20 MW, live Oct 2025',
          ],
          impact: 'uncertain',
          impactNote: 'Watch the 2027 rack date and whether Firmus contracts are signed ACV',
          drawer: {
            sources: [
              'https://firmus.co/newsroom/firmus-to-build-170-000-gpu-ai-factor-y-campus-with-nvidia-for-global-ai-natives',
              'https://yotta.com/press-releases/yotta-to-deploy-20000-nvidia-blackwell-ultra-gpus/',
              'https://www.softbank.jp/en/corp/news/press/sbkk/2026/20260525_01/',
            ],
          },
        },
        {
          id: 'mid-tier-tam',
          title: '智谱 and MiniMax do rent',
          scene: '智谱 2025 R&D RMB 3.18B, more than 70% compute; compute share of R&D 17.3% (2022) → 71.8% (2025H1)',
          judgment:
            'Mid-tier demand is real. It is inference/token shaped. It is not a Microsoft $60bn reserved-IB offtake.',
          points: [
            'AutoDL ~30,000 cards is the right product for a weekend handful of GPUs',
            'SenseCore: 40,400 PFLOPS FP16 YE2025, GenAI revenue RMB 3.63B (72% of 2025 sales)',
            'ACV is model plus token, not reserved IB',
          ],
          impact: 'weakens',
          impactNote: 'A TAM exists. It does not print a $104bn backlog',
        },
      ],
    },

    {
      id: 'archive',
      label: 'Archive',
      tagline: 'Sources and field notes',
      cards: [
        {
          id: 'crwv-nbis-prints',
          title: 'The Western recipes, dated',
          scene: 'CoreWeave 11 August PR; Nebius Q2 2026',
          judgment:
            'These are GPU airlines with allocation windows and a debt market that treats Blackwell like a 737.',
          points: [
            'CRWV: 1.5 GW active 30 Jun, contracted ~3.7 GW q/e / ~4.2 GW 11 Aug, YE target >1.85 GW, 51 DCs, Q2 ~$2.6B, backlog $104.2B',
            'NBIS: YE 2025 ~170 MW active; YE 2026 800 MW–1 GW connected / 5 GW contracted; ARR $3.0bn; NVIDIA $2B equity + Exemplar GB300 NVL72',
            'IREN Horizon 1: Microsoft acceptance 13 Aug 2026 for 50 MW, against a 480 MW AI Cloud YE target',
          ],
          impact: 'reinforces',
          impactNote: 'The reference objects, not the China comps',
        },
        {
          id: 'bis-register',
          title: 'The Federal Register',
          scene: 'FR 2026-00789 effective 15 January 2026',
          judgment:
            'Reexports remain presumption of denial. The Singapore/Malaysia offshore neocloud is closed as a Blackwell backdoor.',
          points: [
            'Direct US exports: case-by-case only if TPP <21,000 and DRAM bandwidth <6,500 GB/s, plus 50% US-end-use cap, plus US-HQ lab testing',
            '31 May 2026: license required if ultimate parent HQ’d in China/Macau, wherever located',
            'H20 residual stock after a $4.5bn charge is not a build-out SKU',
          ],
          impact: 'reinforces',
          impactNote: 'Jurisdiction, not marketing',
        },
        {
          id: 'green-certificates',
          title: '80% 绿电 is often 绿证',
          scene: 'Zhangjiakou city generation ~80% renewable; DC consumption green share about one-third in H1 2025',
          judgment:
            'Finland is a power product a Western lab can take to a board. 蒙西 is certificates plus 交易.',
          points: [
            'Finland 2025: nuclear 37%, wind 26%, hydro 14.5%; Mäntsälä PUE as low as 1.13; 2026 100% renewable contracts',
            '蒙西 2025 new-energy generation 32% (capacity 53%); Ningxia 2024 ~76% thermal; Gansu 2024 ~52% thermal',
            'Hebei Daily / People.cn 13 Jul 2025: H1 big-data use 4.071 TWh, green share about one-third — do not confuse with 82.88% transaction share',
          ],
          impact: 'reinforces',
          impactNote: 'Door 4 does not open for training',
          drawer: {
            sources: [
              'http://he.people.com.cn/n2/2025/0713/c192235-41289615.html',
            ],
          },
        },
        {
          id: 'jiliu',
          title: 'The tell is 基流',
          scene: '36Kr frames it against CRWV/NBIS as cluster EPC, a 包工头',
          judgment:
            'China professionalized building 万卡. The US professionalized renting them against IG paper.',
          points: [
            'Revenue RMB 32m / 325m / 520m (2023–25)',
            'More than 90,000 GPUs delivered across 66 projects, two 万卡',
            'Another 200 MW liquid-cooled building, 东数西算 subsidy, 定增, or WAIC 万卡 announcement does not open a door',
          ],
          impact: 'reinforces',
          impactNote: 'Landlord prints confirm section 3. They do not move section 4',
        },
      ],
    },
  ],

  verdict: {
    stance: 'bearish',
    stanceText:
      'A terrestrial neocloud in the CRWV/NBIS sense is not possible in China under current GPU, customer, and capital rules. China AI MW is real and already listed. Do not pay airline multiples for a hangar.',
    confidence: 'high',
    confidenceNote:
      'High on the missing airline (GPU $0, no overflow, no GPU-ABS). Medium on how far Door 1 + Door 2 get as a 国产 智算 utility — watch GMV and catalogs, not ribbon-cuttings.',
    reasons: [
      'NVIDIA China DC compute is at $0; Blackwell is presumption of denial; independents are not on the H200 list.',
      'No US-style overflow: ByteDance/Alibaba/Tencent keep the demand; Kingsoft is Xiaomi-captive; DeepSeek is building its own halls.',
      'No GPU-as-aircraft capital stack: Kingsoft’s $2–3B is the ceiling; UCloud 定增 is RMB 1.5B; there is no residual-value bid for 昇腾 a private-credit fund will lever.',
    ],
    biggestCounter:
      'Door 1 plus Door 2: 国产 chips good enough for the median renter, and a telco SOE that actually sells 万卡 by the hour. That is a China-native 智算 utility. It is still not NVIDIA-native third-party overflow.',
    indicators: [
      'Kingsoft 智算 mix: Xiaomi stays above 50% of 智算, or third-party reserved ACV shows up as a disclosed line with a customer count that is not two names.',
      'UCloud card census next print: count, generation mix, Wulanchabu MW, AI revenue versus 2025 ~RMB 685m. Cards 3x and revenue flat = 国产 ASP problem, not a neocloud ramp.',
      'H200 units actually landed after Kessler’s “very few”; any independent (not Ali/Tencent/ByteDance/JD) on a license list; 昇腾 rental GMV; 联通中卫 commercial catalog at a published SLA; Firmus Batam 2027 rack date and whether $25–30bn offtake is signed ACV.',
    ],
    timeWindow: '2026–2027 under current BIS rules and the captive/SOE demand structure. Revisit if a specialist actually receives repeating NVIDIA allocation, or if 昇腾 reserved-hour GMV becomes the median renter.',
  },

  nextIssueTracks:
    'Kingsoft 智算 mix, UCloud generation census, H200 units actually landed, 昇腾 rental GMV, 联通中卫 commercial catalog, BIS remote-rental, and Firmus Batam 2027 rack / signed ACV.',
};
