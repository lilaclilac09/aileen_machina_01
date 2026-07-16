# SemiAnalysis method — 4-step DeepSeek cost breakdown

**Hub:** `semianalysis-memory-network.md` · **Numbers:** `semianalysis-deepseek-numbers.md`  
**Primary:** *DeepSeek Debates* — https://newsletter.semianalysis.com/p/deepseek-debates

> **写法：** 步骤拆细，每格短句。细在**结构**，不在散文。数字只抄 ledger，不在此重算。

---

## Spine（30 秒）

| Step | 一句话 | 产出 |
|------|--------|------|
| **1 Paper** | 论文算对了什么 | 窄指标 `$5.576M` |
| **2 Fleet** | 公司实际摸得到多少卡 | `~50k` Hopper mix |
| **3 TCO** | 舰队 + 隐藏成本值多少 | CapEx / OpEx / GPU spend |
| **4 X-check** | 别源会不会打脸 | 置信：数字真且不全 |

可复用口令：`窄指标 → 舰队 → TCO → 交叉验证`

---

## Step 1 — Paper dissection（官方公开数据）

### 1.0 Goal
把媒体「$6M 训练成本」还原成论文**自己定义**的口径。

### 1.1 Inputs
- DeepSeek-V3 Technical Report（arXiv:2412.19437）Table 1
- 论文写明的假设：`$2` / H800 GPU-hr（**租价假设**，非 Semi 市价调研）

### 1.2 Sub-steps

| # | 动作 | 记下什么 |
|---|------|----------|
| 1.2.1 | 定位 Training Costs 表 | 阶段名 + 小时 + USD |
| 1.2.2 | 抄总小时 | **`2.788M`** = **`2788K`** H800-hr |
| 1.2.3 | 按阶段拆 | 见下表 |
| 1.2.4 | 验算 | 小时相加 = 总；美元相加 = `$5.576M` |
| 1.2.5 | 找 exclusion 句 | 「仅 official training；不含 prior research / ablations」 |
| 1.2.6 | 记附属事实 | `671B`/`37B` · `14.8T` tokens · train cluster **`2,048` H800** |

### 1.3 Stage table（锁定）

| Stage | Hours | USD @ $2/hr |
|-------|------:|------------:|
| Pre-training | 2,664,000 (`2664K`) | `$5.328M` |
| Context extension | 119,000 (`119K`) | `$0.238M` |
| Post-training | 5,000 (`5K`) | `$0.01M` |
| **Total** | **2,788,000 (`2.788M`)** | **`$5.576M`** |

### 1.4 Gate（过关才进 Step 2）
- [ ] 能复述：这是 **final / official run** 的 GPU-hr×假设租价  
- [ ] 未把 `$5.576M` 说成「公司总成本」  
- [ ] 媒体 `~$6M` 仅作圆整，先报精确值  

### 1.5 Output / Don’t
- **Out:** 窄指标 + exclusion 边界  
- **Don’t:** 在此步猜 CapEx；改论文小时数  

---

## Step 2 — Accelerator Industry Model（硬件 / 集群）

### 2.0 Goal
把单位从「一张租用发票」换成「可及舰队」。

### 2.1 Inputs
- Semi **Accelerator Industry Model**（出货 / ASP / 中国 SKU）
- 出口管制时间线；High-Flyer 组织史；公开招聘 / 早期采购传闻

### 2.2 Sub-steps

| # | 动作 | 记下什么 |
|---|------|----------|
| 2.2.1 | 换问题 | 「这 run 租多少？」→「历史上摸得到多少加速器？」 |
| 2.2.2 | 定实体 | High-Flyer（交易）↔ DeepSeek（**May 2023** spin-out）**共享**算力与人 |
| 2.2.3 | 定时间锚 | **2021：`10,000` A100**（管制前） |
| 2.2.4 | 定 SKU 路径 | A100 → H800 / H100 → **H20**（对华可售形态） |
| 2.2.5 | 估舰队规模 | Semi：约 **`~50,000` Hopper**（信念值） |
| 2.2.6 | 拆 mix | ≈**`10,000` H800** + ≈**`10,000` H100** + 额外 **H20** |
| 2.2.7 | 定用途 | 同池：**trading · inference · training · research** |
| 2.2.8 | 对比 paper cluster | Official run：**`2,048` H800** ≠ 全舰队 |

### 2.3 Gate
- [ ] 未写成「50,000 **H100**」  
- [ ] 说清 **shared**（非专供一次 V3）  
- [ ] 能区分 **run size** vs **fleet size**  

### 2.4 Output / Don’t
- **Out:** 舰队规模 + mix + 共享叙事  
- **Don’t:** 把 `2,048` 当成公司全部卡；发明精确 SKU 表外数字  

---

## Step 3 — Full TCO（总拥有成本）

### 3.0 Goal
把舰队变成钱：CapEx / OpEx / 历史 GPU 投入 + 论文未计软成本。

### 3.1 Hard buckets（Semi Debates）

| ID | Bucket | Write | Covers |
|----|--------|-------|--------|
| T1 | Server **CapEx** | **`~$1.6B`** | 服务器 · 网络 · 存储资本 |
| T2 | Cluster **OpEx** | **`~$944M`** | 电 · 冷 · 运维（Semi 对「此类集群」的 ops 量级） |
| T3 | GPU spend (hist.) | **`>$500M`** | 加速器历史投入（已考虑出口管制） |

### 3.2 Soft buckets（论文排除、Semi 强调）

| ID | Bucket | 要点 | 强度 |
|----|--------|------|------|
| S1 | Arch R&D / ablations | 如 **MLA** 数月 GPU+人力 | 定性必提 |
| S2 | Data | 采集 · 清洗 · 多轮实验 | 定性 |
| S3 | Talent | 校招；alleged **`>$1.3M`** 顶薪 | 标 alleged |
| S4 | Shared load | 非 train 工作抢同一池 | 链回 Step 2 |

### 3.3 Sub-steps

| # | 动作 |
|---|------|
| 3.3.1 | 列出 T1–T3，全部带 `~` / `>` |
| 3.3.2 | 并列 S1–S4，不假装有精确美元 |
| 3.3.3 | 一句 BOM：**`$5.576M` = 总装某一行，不是整车** |
| 3.3.4 | （可选）量级感：`$5.576M` vs `~$1.6B` ≈ **~287×** — 仅 illustrative，非 Semi 官方倍率标题 |

### 3.4 Gate
- [ ] CapEx / OpEx / GPU spend **三者分开**，不混成一个「总成本」黑箱  
- [ ] Soft cost 未伪造成财报行  
- [ ] 未把 API 低价并进本步当「训练很便宜」证据（→ tokenomics 文件）  

### 3.5 Output / Don’t
- **Out:** TCO 三硬桶 + 四软桶 + BOM 类比  
- **Don’t:** 把 Alberto 等二级估算并进 Semi `$1.6B`  

---

## Step 4 — Cross-verification（现实检验）

### 4.0 Goal
确认：`$5.576M` **真**，且作为公司成本 **不全**。

### 4.1 Check channels

| # | Channel | 问什么 |
|---|---------|--------|
| 4.1.1 | Supply / AIM | 出货与中国 SKU 是否撑得起 ~50k 叙事 |
| 4.1.2 | Recruiting | 广告是否吹「数万 GPU」；薪资传闻是否一致 |
| 4.1.3 | Peer labs | 为何 Anthropic/OpenAI 仍巨额融资（final-run ≠ 公司成本的存在证明） |
| 4.1.4 | Benchmark hygiene | 见下 |
| 4.1.5 | Tokenomics bridge | *Debrief*：低 `$/Mtok` 可来自 batching / 小 context，**不等于**低 CapEx |

### 4.2 Benchmark hygiene（短表）

| 对比 | 陷阱 |
|------|------|
| V3 vs GPT-4o | 4o = **2024-05**；算法进步 ~**4×/年**（Dario 可至 **10×**） |
| R1 vs o1 | 选择性披露；**o3** 更高；R1 **不报 compute** |
| R1 vs Flash Thinking | 更早更便宜、hype 更少 |
| MLA ~**93.3%** KV | 解释**推理**成本，不推翻训练 CapEx |

### 4.3 Gate
- [ ] 至少 2 条独立 channel 支持「不全」  
- [ ] Benchmark 未当「成本证明」  
- [ ] 置信表述：`paper real ∩ TCO larger`  

### 4.4 Output / Don’t
- **Out:** 交叉结论 + 可引用 channel 列表  
- **Don’t:** 因 API 便宜否定 Step 3  

---

## Agent cheat sheet

| 访客说 | 你走 | 打开 |
|--------|------|------|
| 「只要 $6M」 | Step 1 → 立刻切 3 | numbers + cost claim |
| 「50k 怎么来的」 | Step 2 | method §2 + numbers S4–S7 |
| 「真实花了多少」 | Step 3 | numbers §B |
| 「可靠吗」 | Step 4 | report-index + tokenomics |
| 「怎么复用到别的 lab」 | Spine 口令 | 本文件底部 template |

### Reusable template（任意 lab）

```
1 Paper   GPU-hr × stated $/hr → narrow metric + exclusions
2 Fleet   procurement / export / org → scale + SKU mix + sharing
3 TCO     CapEx + OpEx + hist GPU + soft exclusions
4 X-check supply · hiring · peers · benches · serving KPIs
```

### Core insight

**`$5.576M` / `~$6M`** = narrow efficiency metric（总装行项目）。  
**全图** = experimentation + infrastructure + shared fleet TCO。
