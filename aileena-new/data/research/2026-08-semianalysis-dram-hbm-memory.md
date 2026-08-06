---
id: 2026-08-semianalysis-dram-hbm-memory
type: research
date: 2026-08-06
title: SemiAnalysis Memory corpus — DRAM / HBM / CXMT / YMTC (Grok + site cross-links)
source: Grok extract of SemiAnalysis public notes + aileena research/blog cross-links
topics: [semianalysis, dram, hbm, hbm4, memory-wall, cxmt, ymtc, sk-hynix, samsung, micron, nvidia]
confidence: mixed
url: https://semianalysis.com/2024/09/03/the-memory-wall/
---

# Hub — SemiAnalysis × Memory (as of 2026-08)

Grok-organized map of SemiAnalysis **DRAM / HBM** public writing, plus **长鑫 CXMT** and **长江存储 YMTC** supplements from Semi X + Aileena research.

**Not** the site’s agent “second brain / Dreaming” stack — that lives in `memories/semantic/hardware-memory-wall.md` (inference KV / retrieval). This file is **semiconductor memory industry**.

# Priority reading

| Priority | Piece | Why |
|----------|-------|-----|
| Highest | [Scaling the Memory Wall — HBM rise & roadmap](https://newsletter.semianalysis.com/p/scaling-the-memory-wall-the-rise-and-roadmap-of-hbm) (2025-08-12) | Best public HBM4 architecture + supply chain |
| Highest | [The Memory Wall — DRAM past/present/future](https://semianalysis.com/2024/09/03/the-memory-wall/) (2024-09-03) | DRAM fundamentals + long-term tech path |
| High | [Memory Model](https://semianalysis.com/memory-model/) (paid) | Bottoms-up wafer → spot; HBM pricing |
| High | [Accelerator & HBM Model](https://semianalysis.com/accelerator-hbm-model/) (paid) | SKU×HBM config through ~2030 |
| Mid | [ISSCC 2026](https://newsletter.semianalysis.com/p/isscc-2026-nvidia-and-broadcom-cpo) (2026-04) | Device-level HBM4 / LPDDR6 / GDDR7 |
| Mid | SPHBM4 X (2026-07-03) | JESD330-4 · ~1/5 pins · 32 Gbps · organic substrate |

# 1. Core long reports

## 1.1 The Memory Wall (2024-09-03)

URL: https://semianalysis.com/2024/09/03/the-memory-wall/

- DRAM architecture + scaling history (density: ~2×/18mo → ~1× per decade recently)
- **Memory Wall**: compute progress >> bandwidth / capacity / $/bit improvement
- Near-term: **4F²** + **Vertical Channel Transistor (VCT)**
- HBM status + roadmap (primer era)
- Emerging: FeRAM, MRAM
- Compute-in-Memory (bank-level BW underused)
- **3D DRAM** as long-run reset

## 1.2 Scaling the Memory Wall — HBM (2025-08-12)

URL: https://newsletter.semianalysis.com/p/scaling-the-memory-wall-the-rise-and-roadmap-of-hbm

- Why HBM is the AI-accelerator default
- Process flow: front-end TSV; back-end **MR-MUF vs TC-NCF**; yield; bonding (Hanmi episode)
- Vendors: **SK Hynix** lead; **Samsung** qualification/yield lag; **Micron** TSV/PDN jump
- China: **CXMT**, Huawei-related
- **HBM4**: Custom Base Die (logic process), Shoreline/Beachfront, memory controller sink, LPDDR+HBM hybrid, Repeater PHY
- Inference: KV-cache offload
- Bit demand explosion; Nvidia system share

# 2. Paid models (quant)

| Model | URL | Scope |
|-------|-----|--------|
| Memory Model | https://semianalysis.com/memory-model/ | Fab floor → spot: capacity, node migration (1α/1β/1γ…, NAND layers), die/yield, bit supply, HBM pricing multi-gen/vendor, inventory, CapEx. Samsung / SK Hynix / Micron + **CXMT, YMTC, Nanya, Winbond, JHICC** |
| Accelerator & HBM | https://semianalysis.com/accelerator-hbm-model/ | Per-SKU AI accelerator + HBM type/Hi/stacks/GB/BW/vendor/price; TSV; wafer starts → ~2030; Nvidia/AMD/Google/AWS/Meta/MSFT/CN hyperscalers |

# 3. Other Semi threads

## ISSCC 2026 (memory slice)

URL: https://newsletter.semianalysis.com/p/isscc-2026-nvidia-and-broadcom-cpo

Cited device points (public framing):

| Item | Claim |
|------|--------|
| Samsung HBM4 | 1c DRAM core + SF4 logic base die; **36 GB** 12-Hi; **~3.3 TB/s** |
| SK Hynix | LPDDR6 + GDDR7 coverage |
| DRAM cell | 4F² progress notes |

## SPHBM4 (Standard Package HBM4)

Root: [`2073036634094784720`](https://x.com/SemiAnalysis_/status/2073036634094784720) — `@SemiAnalysis_` **2026-07-03** (6/6). Full extract → §3c.

| Claim | Detail |
|-------|--------|
| Spec | JEDEC **JESD330-4** — Standard Package HBM |
| DRAM | **Same HBM4 stacks**; **different buffer die** |
| Pins / rate | Pins ~**1/5**; rate **4× → 32 Gbps** → HBM-class BW on **standard substrate** |
| Reach | Link distance up to **~20 mm** (vs mm-scale next to GPU) → thermal + more stacks/package |
| Substrate | Forces **20–28+ layer** premium ABF (+ glass later); bigger package footprint |
| Demand | “Democratizes” HBM beyond CoWoS-class foundries → mid AI / networking / even consumer GPUs |
| Bottom line | Complexity shifts chip→**substrate**; substrate boom thesis |

# 3b. Semi X accounts + Memory threads

## Core handles

| Handle | Role | Memory focus |
|--------|------|--------------|
| `@SemiAnalysis_` | Official | Report teasers, deep threads, model updates |
| `@dylan522p` | Dylan Patel | Cycle calls, HBM/DRAM takes, industry spitball |
| `@SKundojjala` | Sravan Kundojjala | Earnings, WFE / Memory CapEx, HBM–DRAM detail |

Watchlist includes `@SKundojjala`. Other affiliated analysts skew network/DC — less memory.

## Three core Memory threads (filed 2026-08-06)

| # | Topic | Date | Root status | N |
|---|--------|------|-------------|---|
| 1 | HBM wafer capacity vs DDR | 2026-03-04 | [`2029286002745819255`](https://x.com/SemiAnalysis_/status/2029286002745819255) | 3 |
| 2 | SPHBM4 / JESD330-4 | 2026-07-03 | [`2073036634094784720`](https://x.com/SemiAnalysis_/status/2073036634094784720) | 6 |
| 3a | CXMT IPO | 2026-07-27 | [`2081749011745137090`](https://x.com/SemiAnalysis_/status/2081749011745137090) | 2 |
| 3b | CXMT deep + supercycle | 2026-06-30 | [`2071767487662768547`](https://x.com/SemiAnalysis_/status/2071767487662768547) | 6 |

### 结构化对比（三线程）

| 维度 | **HBM Wafer Capacity**<br>2026-03-04 · `2029286…` | **SPHBM4**<br>2026-07-03 · `2073036…` | **CXMT**<br>2026-06-30 + 07-27 · `2071767…` / `2081749…` |
|------|-----------------------------------------------|---------------------------------------|------------------------------------------------------|
| **核心问题** | 为什么 HBM 会严重挤占普通 DRAM 产能？ | 如何打破先进封装（CoWoS）瓶颈？ | CXMT 崛起会不会破坏 Memory Supercycle？ |
| **核心结论** | HBM 每 bit 消耗的 wafer capacity 是 DDR 的**数倍**，且随层数增加差距扩大 | 串行接口 + 标准封装 → 复杂度转移到 **substrate** | **短期不会**破坏周期；长期结构性竞争者 |
| **关键机制** | ① Die↑（TSV KOZ）② 前端 sort yield↓ ③ TSV / thinning / backside ④ stacking compounding（12Hi@99%≈**87%**） | ① pin ~**1/5** ② **32 Gbps** ③ 距离 ~**20 mm** ④ 强制 **20–28+** 层 ABF / glass | ① 设备出口管制限先进节点 & HBM ② 工艺落后几代 ③ 全球份额极低、主国内 ④ CN 本地定价跟全球暴涨 |
| **对产业链** | 解释 commodity DRAM 紧供给、价格强势 | **明确利好 Substrate**（面积↑、层数↑、材料↑） | Big-3（SK Hynix / Samsung / Micron）短期仍吃短缺红利 |
| **对 HBM 本身** | 为何贵、供给弹性低 | 降低使用门槛 → 可能渗到中端/消费级 | CXMT HBM 仍弱，短期难成有效供给 |
| **对 Memory Cycle** | 支撑 supercycle 的**核心证据** | 间接↑ HBM 总需求（民主化） | 明确：**不是 cycle-killer** |
| **信息密度** | 技术硬核；yield 数学清晰 | 产业链推演完整；substrate 逻辑最强 | 供需 + 竞争格局判断 |

### 一句话版

| Thread | One-liner |
|--------|-----------|
| **HBM Wafer Capacity** | 制造端：为什么 HBM 把 DRAM 产能吃掉了这么多。 |
| **SPHBM4** | 封装端：怎么把 HBM 从 CoWoS 瓶颈里解放出来；**substrate 最大受益**。 |
| **CXMT** | 竞争端：中国新玩家会不会终结本轮短缺 → **短期不会**。 |

### 3d. 核心数据点清单（仅来自已入库线程 / hub）

#### Wafer intensity · `2029286002745819255`

| ID | Datapoint | Value |
|----|-----------|-------|
| W1 | HBM vs DDR bit wafer intensity | **数倍**（hub  shorthand **~3–4×** from other Semi framing） |
| W2 | Stack height trend | **8Hi → 12Hi → 16Hi**（差距扩大） |
| W3 | Extra process vs DDR | TSV · thin **sub-50μm** · backside |
| W4 | Stack yield @99%/layer | 8Hi ~**92%** · 12Hi ~**87%** |
| W5 | Stack yield @98%/layer | 8Hi ~**85%** · 12Hi ~**78%** |
| W6 | Die drivers | TSV keep-out zones · BW-not-density |

#### SPHBM4 · `2073036634094784720`

| ID | Datapoint | Value |
|----|-----------|-------|
| S1 | Spec | JEDEC **JESD330-4** |
| S2 | Architecture | Same HBM4 stacks + **new buffer die** |
| S3 | Pin count | ~**1/5** of classic path |
| S4 | Signal rate | **4× → 32 Gbps** |
| S5 | Reach | ~**20 mm**（vs mm-scale next to GPU） |
| S6 | Substrate layers | **20–28+** premium ABF（+ glass later） |
| S7 | Demand side | Mid AI / networking / consumer GPU path opens |

#### CXMT · `2071767487662768547` + `2081749011745137090`

| ID | Datapoint | Value |
|----|-----------|-------|
| C1 | IPO price / open / close | ¥**8.66** → ¥**49.50** → **+466%** ¥**49** |
| C2 | Debut mcap | ~**$488B**（>Intel framing） |
| C3 | Rank | World **#4** DRAM |
| C4 | Equipment bind | EUV / advanced etch / **TSV tools** export controls |
| C5 | Domestic tools | AMEC / NAURA — **asymmetric** help |
| C6 | Tech gap | Several DRAM gens behind；**HBM gap larger** |
| C7 | Geography | Mostly China；global share tiny |
| C8 | Pricing | CN local ASP **rises with global**（not cheap dump） |
| C9 | Cycle call | **Not** cycle-killer near-term |
| C10 | Huawei-path (Aileena) | ~**2M** HBM stacks/yr thesis；monthly yield **待填** |

### 3e. 影响矩阵（对谁有利 / 不利）

| Actor | Wafer intensity thread | SPHBM4 thread | CXMT thread |
|-------|------------------------|---------------|-------------|
| **SK Hynix / Samsung / Micron (Big-3)** | **+** HBM 吃产能 → commodity ASP 强；HBM 稀缺溢价 | **±** 需求面扩大；但 CoWoS 锁客护城河变薄 | **+ short** 短缺仍在；**− long** #4 结构性压力 |
| **Commodity DDR buyers** | **−** 供给更紧、价更硬 | 弱相关 | **±** CXMT 增量不够救市；CN 价也不便宜 |
| **HBM buyers (Nvidia 等)** | **−** 贵、弹性低 | **+** 更多封装路径 / 可能更多 stack/package | 弱相关（CXMT HBM 仍弱） |
| **TSMC CoWoS / 先进封装** | 间接绑 HBM | **−** 瓶颈被绕开叙事；超高端仍在 | 弱相关 |
| **Standard OSAT** | 弱相关 | **+** 可接线 HBM | 弱相关 |
| **Substrate / ABF / glass** | 弱相关 | **++ 最大受益**（面积↑ 层数↑ 材料↑） | 弱相关 |
| **CXMT** | 解释为何进 HBM 难（wafer 强度） | 长期或受益于「民主化」封装，但先卡在设备/工艺 | **+** IPO 定价权；**−** 设备/节点/HBM 仍绑 |
| **Huawei Ascend** | 解释 HBM 稀缺为何致命 | 若 SPHBM4 普及或缓解封装，**不**等于 CXMT 有 stack | **关键** — stockpile vs CXMT yield（§4） |
| **YMTC** | 不在本线程 | 不在本线程 | 勿混用；补 memory-complex / 制裁轴（§4） |

**读表规则：** `+`/`−` 是 Semi 公开线程方向，不是交易建议；`--` 空位不要脑补数字。

### 3f. SPHBM4 → Substrate 逻辑展开

```
Classic HBM path
  GPU ←[mm, wide parallel]→ HBM stacks
  needs: silicon interposer + scarce advanced pack (CoWoS-class)
  bottleneck: packaging capacity, not only DRAM bits

SPHBM4 path (JESD330-4)
  same HBM4 DRAM stacks
  + new buffer die
  → pins ÷5 , rate ×4 (32 Gbps)
  → serial link OK out to ~20 mm
  → standard organic substrate / OSAT-capable assembly
```

**Why substrate wins (causal chain from thread 2/6–6/6）：**

1. **Distance unlock** — memory no longer glued mm-scale to the GPU → room for **more stacks per package** → **package footprint ↑** → **substrate area per chip ↑**.
2. **Electrical tax** — 32 Gbps on organic needs shielding / power-ground discipline → **not** low-layer ABF → **20–28+ layer** premium ABF（glass later）→ **more material per panel, fewer units** → fab utilization + pricing power.
3. **Bottleneck shift** — complexity leaves “buy CoWoS + interposer” and lands on “buy **huge high-layer substrate**”.
4. **Demand multiplier** — mid AI / NIC / consumer GPU can attach HBM → HBM **units** demand may rise faster than memory suppliers ramp → still tight memory, **plus** substrate boom.
5. **Not a free lunch for buyers** — democratizes *who can assemble*; does **not** cancel Thread-1 wafer intensity (HBM bits still expensive in wafer terms).

**Bottom line:** SPHBM4 is an **advanced-packaging relief valve** that **transfers the tax** onto the substrate layer — Semi’s punchline: substrate boom just starting.

# 3c. Full thread extracts (Grok CN paraphrase of Semi EN)

## Thread 1 — HBM wafer capacity (2026-03-04)

**Root:** https://x.com/SemiAnalysis_/status/2029286002745819255

**1/3 — Die size first.** HBM bit wafer use is **multiples of** commodity DDR: larger die + stage-stacked yield loss; gap widens **8Hi → 12Hi → 16Hi**. TSV **keep-out zones** eat array area → bigger die. HBM dies optimize **bandwidth not density** → fewer dies/wafer *before* yield.

**2/3 — Electrical bar + extra process.** Front-end wafer-sort yield drops hard — dies that pass DDR get **binned** under HBM electricals. Then steps commodity DRAM lacks: **TSV formation**, wafer thin to **sub-50μm**, backside processing — each adds yield loss on top of already-worse sort. New manufacturing stack bolted onto hard DRAM.

**3/3 — Stacking compounding (killer).** Simplified: per-layer **99%** → 8Hi ~**92%**, 12Hi ~**87%**; per-layer **98%** → ~**85%** / ~**78%**. Why HBM demand eats large share of global DRAM bit supply — core reason for **memory supercycle**.

## Thread 2 — SPHBM4 (2026-07-03)

**Root:** https://x.com/SemiAnalysis_/status/2073036634094784720

**1/6** JEDEC **SPHBM4** = Standard Package HBM (**JESD330-4**). Same HBM4 DRAM stacks, **different buffer die**. Goal: assemble HBM in **standard packaging** → break AI advanced-packaging bottleneck.

**2/6** Keep HBM4-class performance; cut dependence on scarce advanced packaging. Pins → **~1/5**; rate → **4× / 32 Gbps**; reach → **~20 mm** on standard substrate; thermal better. **Huge substrate-chain positive.**

**3/6** Packages get **physically larger**. Classic HBM must sit mm-scale next to GPU (wide parallel attenuates). SPHBM4 high-speed serial → memory **20 mm** away → room for more HBM/package → bigger packaging footprint → more substrate area/chip.

**4/6** Layer counts explode. 32 Gbps on organic is an electrical nightmare → not low-layer ABF; forces **20–28+ layer** premium ABF (+ upcoming **glass**): complex routing, power/ground shielding. Higher-layer substrates use more material, lower units/panel → demand + price up at substrate fabs.

**5/6** “Democratizes” HBM. Today locked behind few advanced-pack foundries (e.g. TSMC CoWoS) → ultra-high-end AI only. SPHBM4: standard OSAT can wire HBM → mid AI, networking, even consumer GPUs. HBM demand still outruns supplier ramp.

**6/6 Bottom line.** Shifts complexity off proprietary silicon-interposer+ABF combo onto **very large, high-layer ABF** (and pulls glass forward). Performance burden lands on **substrate layer**. Substrate boom just starting.

## Thread 3 — CXMT IPO + deep (2026-07-27 / 2026-06-30)

### 3A IPO (2026-07-27)

**Root:** https://x.com/SemiAnalysis_/status/2081749011745137090

**1/2** Absurd debut: price ¥8.66 → open ¥49.50 → close **+466%** ¥49; mcap ~**$488B** (>Intel). DRAM maker that didn’t exist ten years ago.

**2/2** Flagged early: prior deep dive — Qimonda ashes → Hefei patient capital → world **#4** DRAM. Link: https://newsletter.semianalysis.com/p/chinas-cxmt-is-set-to-challenge-dram

### 3B Deep + supercycle (2026-06-30)

**Root:** https://x.com/SemiAnalysis_/status/2071767487662768547

**1/6** Clear **#4** DRAM; pressure on SK Hynix / Samsung / Micron rising. Still expanding / cash for more capacity — but key challenges remain.

**2/6 Equipment.** Broad advanced-tool export controls (EUV, advanced etch, **TSV-related**, …) = biggest block to advanced nodes + high-end products. Domestic (AMEC, NAURA, …) helps but **asymmetric** — one step ≠ unlocks all; tool availability, process variance, yield risk remain.

**3/6 Technology.** Trails leaders by **several generations** on DRAM nodes; **HBM gap larger**. As advanced tools matter more for next scaling, gap may harden.

**4/6 Market.** Still mostly China. Some overseas PC/phone/consumer brands, but global share tiny. International expansion needs price+supply **and** quality, qualification, geopolitics, customer willingness to divert from incumbents.

**5/6 vs Memory Supercycle.** Misread: CXMT research ≠ bearish for memory. Core of cycle = **severe shortage**. Even with CXMT wafer/bit adds, tight DRAM still supports all suppliers. CXMT may not even cover **China domestic** demand — not a cheap dump. CXMT memory **isn’t cheap**; local CN pricing spikes **with** global — enjoys same shortage ASP, not a deflationary force. **Not a cycle-killer**, not immediate threat to leaders → long-run structural competitor. Near-term shortage too large for CXMT to materially relieve market. Supercycle = supply constraint + memory content + **HBM wafer absorption** + AI demand.

**6/6** Full CXMT vs incumbents → paid **Memory Model**.

### Client HBM configs (Accelerator Model surface)

| Config | Claim | Source framing |
|--------|-------|----------------|
| Meta custom AMD **MI400-series** (2026-07) | **6× HBM4 8Hi** ≈ **144 GB** vs standard **12× 12Hi** ≈ **432 GB** | Recsys: optimize memory **$/BW**; trade LLM peak |
| Nvidia **Rubin Ultra** | Clients knew **16Hi → 12Hi** cut early (Hybrid Bonding yield one driver) | Dylan: model clients knew by **Mar**; tweet `2068043256634683409` |

### Prices / LTA / cycle

- Podcast **Ep.022**: Memory prices, LTAs, market cycles  
- Thesis: HBM mix-shift + AI content → commodity DRAM stays tight; **supercycle not over** (see Thread 1 + 3B)  
- **Jevons**: linear-attn / efficiency gains eventually **raise** total HBM/DRAM/networking demand  

### Equipment & CapEx (`@SKundojjala` heavy)

- DRAM/NAND system revenue mix in tool earnings; WFE upward revisions (esp. **2027**)  
- Memory CapEx up (new fab + AI + advanced R&D)  
- Framing: **HBM4E** samples shipping; **2027** supply deals signed; shortage narrative into **2028**

### X output taxonomy

1. **Hard tech threads** — wafer intensity, SPHBM4 (§3c)  
2. **Supply / cycle calls** — CXMT supercycle (§3c-3B)  
3. **Customer configs** — Meta / Nvidia Rubin SKUs  

## Recurring Semi theses (multi-note)

| Thesis | Direction |
|--------|-----------|
| HBM share of Nvidia system cost | Rising — cited path **>30% by end-2026**, **>40% in 2027** (Semi framing; treat as thesis not audited GL) |
| Wafer intensity | Multiples of DDR bit wafer use — die/KOZ + sort + TSV/thin + stack compound (§3c-1); hub shorthand **~3–4×** |
| Mix shift | Commodity DRAM → HBM conversion **tightens** vanilla DRAM |
| Vendor score | SK Hynix leads; Samsung HBM3E/HBM4 qual/yield lag |
| CXMT vs supercycle | **Not** cycle-killer near-term (§3c-3B) |
| SPHBM4 | Substrate / ABF / glass boom; democratizes HBM (§3c-2) |
| Naming firewall | **SPHBM4** (JEDEC) ≠ Google **SP-HBM** / CXL pool — `2026-08-huawei-nvidia-supply-factcheck.md` |

# 4. 长鑫 CXMT + 长江存储 YMTC (supplements)

Cross-links — Semi China memory coverage + Aileena corpus (not a substitute for Memory Model paywall).

## 一句话对照

| | CXMT 长鑫 | YMTC 长江 |
|--|-----------|-----------|
| **标志 =** | 华为能不能继续造卡（**HBM stacks / yield / stockpile**） | 中国 NAND 是否仍「技术上真能打」+ 武汉能不能 list（**层数、WPM、Entity List、IPO**） |
| **不要** | — | **用 YMTC 补 HBM 缺口** |
| **要用它补** | Ascend 量产曲线 | **memory complex / 资本与制裁** 那一半 |

## 4.1 CXMT 长鑫存储 (DRAM / HBM aspirant)

| Fact | Value | Confidence / source |
|------|-------|---------------------|
| Role in Semi models | China DRAM vendor in Memory Model peer set | quoted (model page) |
| Scaling the Memory Wall | Named in China progress section | Grok/Semi summary |
| STEEL teardown sample | Some 16GB with **CXMT** DRAM (alongside Samsung LPDDR5X) | `data/research/2026-steel-lab-semianalysis.md` |
| IPO debut (Semi X) | Priced ¥8.66 → open ¥49.5 → close **+466%** ¥49; mcap ~**$488B** (>Intel framing) | §3c-3A · `2081749011745137090` |
| Deep dive (newsletter + X) | Qimonda → Hefei capital → world **#4** DRAM; X challenges: **equipment / tech / market** | §3c-3B · `2071767487662768547` · [newsletter](https://newsletter.semianalysis.com/p/chinas-cxmt-is-set-to-challenge-dram) |
| Equipment bottleneck | Export controls on EUV / advanced etch / **TSV tools**; domestic AMEC/NAURA asymmetric | §3c-3B 2/6 |
| Tech gap | Trails several DRAM gens; **HBM gap larger** | §3c-3B 3/6 |
| Market | Mostly China; global share tiny; diversion hard | §3c-3B 4/6 |
| **vs supercycle** | **Not** cycle-killer; shortage too large; CN ASP rises with world; may not cover domestic demand | §3c-3B 5/6 |
| Big Fund Phase 3 | **~$2B** to CXMT (May 2024) | Aileena `research/huawei-hbm` |
| Trailing Big-3 DRAM | **~1–2 years** on standard DRAM (Huawei note); X says **several gens** + larger HBM gap | mixed — both thesis |
| HBM ramp thesis | ~**2M stacks**/yr class → ~250–300K Ascend 910C equiv (÷8) | same — **watch variable** |
| Strategic read | Huawei stockpile burn vs CXMT HBM yield = 2026–27 lever | `aileena.xyz/research/huawei-hbm` |

### CXMT 可补充标志（watch）

按「一变就改结论」排序。**月度 yield = 最高杠杆空位。**

| 标志 | 为什么盯 | Status / 待填 |
|------|----------|---------------|
| **HBM 月度良率 / stack 出货** | Huawei note: *single most-leveraged* | **待填：月度 yield** `_YYYY-MM: ___ % / ___ stacks_` |
| 2M → **5M+** stacks | 出现则 HBM-bottleneck thesis 压缩 | 仅反事实；无时间序列 |
| **Stockpile 余量**（~13M / 烧到何时） | 与 CXMT ramp 赛跑 | 定性有；缺更新点 |
| HBM gen（3 / 3E）+ **是否进 Ascend 量产 BOM** | 「能做」≠「能配」 | hub 几乎空 |
| TSV / 封装（MR-MUF vs TC-NCF 国内版） | 对齐 Semi HBM 工艺轴 | 未补 |
| DDR5 份额 / 节点 | commodity 能追 ≠ HBM | 仅「落后 1–2 年」 |
| IPO 后 CapEx / wafer starts | Memory Model bottoms-up | 付费外几乎空 |
| Semi CXMT 专文表格（Jun 2026） | 链接已有；X 6/6 已提炼挑战轴 | ✓ §3c-3B；Memory Model tables still paywall |
| vs supercycle（已入库） | 扩张 ≠ 砸周期 | ✓ §3c-3B |
| Equipment / TSV tool ban | 限制进高端 + HBM | ✓ named in §3c-3B — track tool news |

## 4.2 YMTC 长江存储 (3D NAND)

| Fact | Value | Confidence / source |
|------|-------|---------------------|
| Role in Semi models | China NAND vendor in Memory Model peer set | quoted (model page) |
| Aileena essay | [Next IPO Is Wuhan — YMTC](https://aileena.xyz/blog/ymtc-nand-wuhan) (2026-07-28) | site |
| Framing | After CXMT Hefei IPO → Wuhan / Optics Valley / YMTC as next capital-markets story | site + content sync |
| Relation to HBM | **NAND ≠ HBM** — does **not** fill Ascend HBM gap; sits in **memory complex** CapEx / geopolitics / Big Fund | synthesis — **do not misuse** |

### YMTC 可补充标志（watch）

| 标志 | 为什么盯 | Status / 待填 |
|------|----------|---------------|
| **STAR IPO 进度**（招股 / 估值类） | 「Next IPO Is Wuhan」落地时钟 | 报道级；无跟踪表 → **待填：listing date / file status** |
| **层数 / Xtacking 代数**（128→232+） | Semi 技术竞争力主轴 | essay 有；hub 薄 → **待填：current L / Xtacking gen** |
| **WPM / wafer starts** vs Entity List 工具约束 | 产能是否真扩张 | 2021–22 vs 2026 未对齐 → **待填：WPM** |
| Global share / ASP（ChipBook / export） | 「NAND apocalypse」是否仍成立 | essay 提；hub 未钉 |
| **Observability gap** vs CXMT | CXMT 有 public tape；YMTC 仍难观测 | 可作对照标志 |
| 明确边界 | **不救 Ascend HBM** | ✓ 本表 + 上表 Relation row |

## 4.3 填表模板（CXMT yield — 复制行）

```
| YYYY-MM | HBM gen | Yield % | Stacks shipped (est.) | Source | Notes |
|---------|---------|---------|------------------------|--------|-------|
|         |         | 待填    |                        |        |       |
```

# 5. Agent / ops pointers

| Artifact | Path |
|----------|------|
| This hub | `data/research/2026-08-semianalysis-dram-hbm-memory.md` |
| Huawei×Nvidia supply fact-check | `data/research/2026-08-huawei-nvidia-supply-factcheck.md`（PCB/HBM survey；**≠ SPHBM4**） |
| Site Memory Wall (inference) | `aileena_second_brain/memories/semantic/hardware-memory-wall.md` |
| Huawei × HBM × CXMT | `lib/research/huawei-hbm.ts` / `/research/huawei-hbm` |
| YMTC Wuhan | `/blog/ymtc-nand-wuhan` |
| **Public essay (own)** | `/blog/memory-tax` — tax moves wafer→substrate→cycle; SPHBM4≠SP-HBM |
| Social numbers / RSS | `data/social/` + Dreaming `social-changelog-*.md` |
| Teachers dossier | `memories/semantic/analysts-dylan-aaron.md` |

# Open follow-ups

1. Paywall Memory Model / Accelerator-HBM: extract tables only if user pastes Grok/subscriber export (do not invent).
2. ~~SPHBM4 + HBM wafer + CXMT deep threads~~ → **filed §3c** (roots `2029286…` / `2073036…` / `2071767…` / `2081749…`).
3. **Fill §4.3** CXMT HBM monthly yield — single most leveraged China variable.
4. Meta MI400 6×8Hi vs 12×12Hi: confirm against Accelerator Model SKU row when pasted.
5. `@SKundojjala` first RSS/Grok backfill for WFE / Memory CapEx numbers.
6. YMTC: fill §4.2 watch row blanks (IPO / layers / WPM) from next Semi or Caproasia hit.
7. Ingest remaining SPHBM4 / wafer thread reply IDs into `tweets.jsonl` if FxTwitter returns full thread.
8. ~~Optional deepenings~~ → **filed §3d/3e/3f** (datapoints · impact matrix · SPHBM4→substrate).
