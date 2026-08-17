---
id: 2026-08-china-terrestrial-neocloud
type: research
date: 2026-08-14
title: Is a Terrestrial Neocloud Possible in China? — Part 2
source: Aileena dispatch (own synthesis)
topics: [china, neocloud, aidc, nvidia, coreweave, nebius, gds, vnet, runze, kingsoft, ucloud, bis, export-controls]
confidence: public
url: https://aileena.xyz/blog/china-neocloud
---

# Is a Terrestrial Neocloud Possible in China? — Part 2

**The megawatts are there. The company is not.** 14 August 2026. Site: `/blog/china-neocloud`. Part 1 (15 August primer): `/blog/china-neocloud-teaser`. Magazine: `/research/china-neocloud` (redirects to long-form).

A neocloud is a specialist that rents reserved, leading-edge GPU cluster time to third parties, financed like a fleet. Four tests, all required: leading-edge GPUs; 万卡-scale IB/Ethernet fabric; third-party reserved ACV (not captive Xiaomi, not a national supercomputer login); residual-value risk on the balance sheet.

# Takeaway

China can already stand up terrestrial AI MW at CoreWeave / Nebius scale. It does not have, and will not have under current GPU / customer / capital rules, a listed NVIDIA-native third-party GPU cloud. Runze, VNET, GDS are airframes. A neocloud is an airline. China nationalized the airline.

If you want "China NBIS" as a stock, it does not exist. If you want "China AI MW," it trades as Runze 300442, GDS, and VNET.

# MW vs GPU airline

| Name | Live | 2026 target | Product |
|------|------|-------------|---------|
| CRWV | 1.5 GW active (30 Jun 2026) | >1.85 GW YE; contracted ~4.2 GW (11 Aug) | GPU cloud. Q2 rev ~$2.6B. Backlog $104.2B. 51 DCs |
| NBIS | ~170 MW active YE 2025 | 800 MW–1 GW connected; 5 GW contracted | GPU cloud. Q2 group $582.3m, AI cloud $574.9m. ARR $3.0bn. ACV >$20m/MW. NVIDIA $2B equity + Exemplar GB300 NVL72 |
| Runze 300442 | ~750 MW operating | ~6 GW planned | AIDC landlord |
| VNET | 907 MW wholesale in-service (31 Mar 2026) | 450–500 MW 2026 delivery | Wholesale colo. Wulanchabu AI workhorse |
| GDS | ~1.56 GW designed IT (derived) | 1 GW FY 2026 sales; H1 bookings 470 MW | Mix ~50% CPU / 50% GPU. Hyperscaler/wholesale |
| Kingsoft Cloud | not disclosed as MW | AI gross billing ~RMB 1.0bn Q1 2026 | GPU cloud, heavily captive. Xiaomi ~31% total rev |
| UCloud | 24,131 cards; Wulanchabu A/B/C 61.7 MW | 定增 ≤RMB 1.5B | GPU 91.29% sold. 2025 AI-related rev ~RMB 685m |

CAICT 2025: 3.8B 智算 card-hours supplied, 1.4B used (36.8%). Some 国产 pools 70–80% idle.

# GPU — Federal Register

NVIDIA China DC Hopper: $4.6B Q1 FY26 → $0 Q1 FY27. FY2026 10-K: "effectively foreclosed" from China DC compute. Q2 FY27 guide assumes $0.

BIS FR 2026-00789, effective 15 Jan 2026: case-by-case for *direct US exports* only if TPP <21,000 and DRAM bandwidth <6,500 GB/s, plus 50% of US-end-use quantity cap, plus US-HQ lab testing. Reexports: presumption of denial.

| SKU | To a PRC independent, Aug 2026 |
|-----|-------------------------------|
| H100 / A100 / H800 / A800 | Banned |
| H20 | License since 9 Apr 2025. ~$60m licensed revenue after a $4.5bn charge. Beijing informal "avoid H20" Aug 2025 |
| H200 | Case-by-case US only. Kessler House 14 Jul 2026: "very few, very small quantity." Reuters 14 May: ~10 firms (Ali, Tencent, ByteDance, JD). Independents not on list. $0 H200 program revenue at FY2026 10-K. 25% Section 232 on US-test path |
| B200 / GB200 / GB300 / Vera Rubin | Presumption of denial |
| B30A / B20 | Never confirmed licensed or shipping as of Aug 2026 |

31 May 2026 BIS: license required for advanced chips to any entity whose ultimate parent is HQ'd in China/Macau, wherever located. Killed Singapore/Malaysia Blackwell backdoor. Remote rental of overseas NVIDIA still legal, under review.

国产: DeepSeek V4 inference co-designed with Ascend 950DT (SemiAnalysis via Pandaily, 15 Jun 2026); V4 training still NVIDIA (ChinaTalk). Huawei Cloud 昇腾云 2,663 customers YE2025. China Mobile 2026–27 超节点集采 6,208 CANN cards, bids ~RMB 2.06B. 曙光8000 登峰 live 10 Jul 2026 Zhengzhou: first all-domestic 10万卡. 联通中卫 >14,000 GPUs in ground; >300 MW / >10万卡 on plan.

# Customer

ByteDance 2026 domestic IDC demand ~1.4–1.5 GW; Q1 already ~1 GW tendered; self-build ~10–15%; 85–90% leased halls. Alibaba 2026 IDC plan ~2 GW. Tencent trains on Tencent metal. DeepSeek recruiting 2026 Ulanqab 智算 campus.

智谱 2025 R&D RMB 3.18B, >70% compute; compute share of R&D 17.3% (2022) → 71.8% (2025H1). MiniMax same squeeze. Inference/token shaped, not Microsoft $60bn reserved-IB offtake.

Kingsoft Q1 2026 AI gross billing ~RMB 1.0bn, 50.1% of public cloud. Xiaomi ecosystem RMB 838m, 31.0% of total revenue. Related-party cap RMB 14.2bn (2025–27). Jiemian 2 Jul 2026, unverified: Ali 5-year lease for 3,000+ 8-GPU servers; Xiaomi GPU budget on Kingsoft ~RMB 4bn → >RMB 10bn.

# Capital

| | CRWV | NBIS | Kingsoft | UCloud | SenseTime |
|--|------|------|----------|--------|-----------|
| 2026 spend | FY capex $35–39B; Q2 $9.4B | Q1 raised $6.3B (NVIDIA $2.0B equity + $4.3B converts); Jul 2026 first ABS $775m | FY capex+leases RMB 15–20B; Q1 RMB 3.0B | 定增 ≤RMB 1.5B; project IRR 8.49% | 2025 capex RMB 1.129B |
| NVIDIA | Largest non-founder shareholder; Exemplar; B300/Rubin first wave | $2B equity; Exemplar GB300 | None. Cannot buy Blackwell | None | None |
| Offtake | Backlog $104B | Meta up to $27B; MSFT up to $19.4B | Xiaomi 31% of rev | 22,030 / 24,131 GPUs sold (91.29%) | Mix. Not IG take-or-pay |

# Power product

Finland 2025 mix (kWh): nuclear 37%, wind 26%, hydro 14.5%. NBIS 2025 ops 95% low-carbon; 2026 100% renewable contracts. Mäntsälä PUE as low as 1.13.

蒙西 2025 new-energy *generation* 32% (capacity 53%). Sichuan 2025 ~76% hydro. Ningxia 2024 ~76% thermal. Gansu 2024 ~52% thermal. Zhangjiakou city generation can be ~80% renewable; DC consumption green share about one-third H1 2025. 80% 绿电, for a large share of the claimed figure, is 绿证.

刘烈宏, China Development Forum 23 Mar 2026: hub-node new compute 80% green-power share. NDRC weights; enforcement 1 Aug 2026. PUE ≤1.2 at hubs (行动计划, Jul 2024). Freeze on new large DCs where existing DCs >1 year old and utilization <50%. IREN Horizon 1: Microsoft acceptance 13 Aug 2026 for 50 MW vs 480 MW AI Cloud YE target.

# Closest-to-neocloud

SenseCore: 40,400 PFLOPS FP16 YE2025; GenAI revenue RMB 3.63B (72% of 2025 sales); WAIC 2026 plan ≥5 domestic 万卡. AutoDL ~30,000 cards. 基流: RMB 32m / 325m / 520m (2023–25); >90,000 GPUs across 66 projects, two 万卡.

# Doors that open

1. 国产 chips good enough for the median renter — watch 昇腾 rental GMV.
2. Telco SOE commercial 万卡 catalog at CRWV SLAs (联通中卫 prototype). Equity inside a telco.
3. Export controls reverse + repeating specialist NVIDIA allocation. Until then, model zero.
4. Global customers accept 绿证 — they will not, for training. Sichuan hydro is the honest kWh exception; 6 GW of planned halls are not clustering there.

# Hangar tour

- **Wulanchabu.** YE 2025: 84 signed DC projects, capex about RMB 39.975bn. Signed racks >4 million. Built 500,000. In operation 330,000. Occupancy 66% ([Cailian](https://www.cls.cn/detail/2410558), 26 Jun 2026). UCloud cabinets above 95% at 30 June 2026; GPU 91.29%. Building D is 75% intent kilowatts, not signed leases. Zhongjin Bayin: dedicated 220 kV, year-1 renewable replacement **38.74%** ([Xinhua](http://www.nmg.xinhuanet.com/20250718/70f1cc85c9c84743a203a8eb13d984eb/c.html), 18 Jul 2025). Alibaba GM claims 90% local green. Compare Zhongjin. DeepSeek is hiring civil engineers.
- **Zhongwei.** Unicom 1–2 storage, 3–4 training. Monthly power RMB 10–13 million (Qi Jun, [Guangming](https://tech.gmw.cn/2026-05/25/content_38788826.htm), 25 May 2026). Dec 2025: 14k GPUs / 85% / 98 MW IT. Apr 2026 visit: >70k cards. Datang 500 MW PV physical; 1.5 GW wind virtual PPA. China Mobile Ningxia 78% green kWh in 2025.
- **Qingyang.** Securities Times off Xifeng airport. Mobile park: Kingsoft, Ali, MiniMax, Kimi, Suiyuan. Telecom phase-1 occupancy ~97%. Kingsoft 2025 capex >RMB 5bn, cluster light-up 18 May 2026. Tariff 0.398 via aggregation. Grid: wind/solar "don't obey," halls want 7×24.
- **Zhangjiakou.** Sun Jun, Hebei Daily: H1 2025 big-data use 4.071 TWh, green share about **one-third** ([People.cn](http://he.people.com.cn/n2/2025/0713/c192235-41289615.html), 13 Jul 2025). Do not confuse with 82.88% green *transaction* share. Chindata Huailai HQ >200 MW IT. Runze Langfang 200 MW all-liquid: sold out, still commissioning as of April 2026 IR. No August site photo of live IT.
- **Lingang.** Gu Ruoyu 60 km / one hour. Buildings 1 and 3 not below 90% occupancy since Sep 2023 ([People.cn](http://sh.people.com.cn/n2/2026/0714/c138654-41638450.html), 14 Jul 2026). Customers who will not train in Qingyang. Latency is the product.

The idle is real, and it is not on this tour. CAICT: 3.8bn card-hours supplied, 1.4bn used, 36.8%. Shi Ke's "digital unfinished buildings" is 2025 CPPCC. Hub cities do not have named idle MW-class halls in 2026 visitor copy.

# Singapore / Asia — not a China escape hatch

Southeast Asia is not blocked on NVIDIA. Singapore island is blocked on power. China-parented vehicles in SG/MY are blocked on BIS. Mixing those three is how "SEA has so many cards" becomes a neocloud thesis.

- **Singapore island.** Live IT ~1.1 GW; BMI 2026 ~1.46 GW ([TechNode / BMI](https://technode.global/2026/07/29/singapore-to-retain-top-southeast-asia-data-center-status-despite-capacity-constraints-bmi/), 29 Jul 2026). DCs ~7% of national electricity, heading toward 12%. Land 745 km². DC-CFA1 (2023) **80 MW** to Equinix, GDS, Microsoft, AirTrunk–ByteDance. DC-CFA2 (closed 31 Mar 2026) **≥200 MW**, PUE 1.25, Green Mark Platinum, ≥50% eligible green ([Mondaq](https://www.mondaq.com/new-technology/1729734/singapores-second-data-centre-call-for-application-from-pilot-to-power-play); [TechNode](https://technode.global/2026/07/31/singapore-tightens-data-center-growth-as-johor-bangkok-jakarta-race-ahead/), 31 Jul 2026). BMI: ~20 MW under construction vs ~980 MW pipeline. Jurong Island envelope **up to 700 MW** — planning, not a 2026 hall. Inference / HQ yes. 1 GW training factory no.
- **Johor.** Operational often cited 1–2 GW 2025–26; pipelines 5 GW+ / some 8–12 GW by 2030 = pipeline. YTL Kulai first NVIDIA hall ~**20 MW** live Oct 2025; Vantage JHB1 300 MW potential, Phase 1 Jan 2026; PDG JH1 ~150 MW; AirTrunk ~150 MW early; Yondr 200–300 MW class; GDS Nusajaya/Kulai ~280 MW phased; ByteDance/TikTok 1–2 GW pipeline, RM10 bn.
- **Batam.** Firmus + DayOne: **360 MW** NVIDIA DSX AI Factory, up to **170,000** Grace-Blackwell / Vera-Rubin / Vera through 2027–28, campus Q1 2027 ([Firmus](https://firmus.co/newsroom/firmus-to-build-170-000-gpu-ai-factor-y-campus-with-nvidia-for-global-ai-natives); [DCD](https://www.datacenterdynamics.com/en/news/firmus-to-deploy-170000-gpu-cluster-in-batam-indonesia/)). Coatue round $5.5bn. Offtake talk $25–30bn over six years = target, not CRWV $104bn backlog. DayOne 450 MW PPA at Kabil. Runze Batam ~360 MW = Chinese landlord overseas; tenant brings cards.
- **Inventory A.** Hyperscaler/landlord MW. Cards belong to the hyperscaler.
- **Inventory B.** China cutout, unwinding. Megaspeed nearly **$2bn** NVIDIA via Malaysian sub ([CNBC](https://www.cnbc.com/2025/10/10/singapore-us-investigate-nvidia-client-megaspeed-export-controls-violation.html), 10 Oct 2025). Bridge allocated **68.4 MW**; given to Zenlayer by Feb 2026 ([Edge](https://theedgemalaysia.com/node/799045), 8 Apr 2026). BIS 31 May 2026 parent-HQ rule. Remote rental still grey.
- **Inventory C.** Legal non-China GPU cloud, mostly 2027. Firmus, YTL 20 MW live, Yotta, SoftBank Oct 2026.
- **Japan.** SoftBank "AI Data Center GPU Cloud" GB200 NVL72 + Infrinia, Oct 2026 ([SoftBank](https://www.softbank.jp/en/corp/news/press/sbkk/2026/20260525_01/), 25 May 2026). Sakura Koukaryoku ~10,800 GPUs. Sovereign Lambda, not CoreWeave.
- **India.** Yotta 20,736 HGX B300 at 60 MW D2 Greater Noida, targeted live Aug 2026, >$2bn, Quantum-X800 IB ([Yotta](https://yotta.com/press-releases/yotta-to-deploy-20000-nvidia-blackwell-ultra-gpus/), 18 Feb 2026). >10,000 to IndiaAI Mission. National factory with a commercial window.

Cards in SEA were never the scarce object. Clean title to those cards was.

# Watch

- Kingsoft 智算 mix (Xiaomi vs third-party reserved ACV)
- UCloud card census / generation / Wulanchabu MW / AI rev vs 2025 ~RMB 685m
- H200 units landed after Kessler "very few"; any independent on a license list
- 昇腾 rental GMV, utilization, repeat third-party reserved hours
- 联通中卫 commercial catalog at a published SLA
- BIS remote-rental of overseas NVIDIA (still legal, under review)
- Firmus Batam 2027 rack date / whether $25–30bn offtake is signed ACV
- Yotta D2 August 2026 live; SoftBank GPU Cloud October 2026
