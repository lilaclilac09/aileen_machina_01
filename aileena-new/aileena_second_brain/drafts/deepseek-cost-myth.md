# Draft — DeepSeek 的 $6M 神话：SemiAnalysis 成本框架拆解

**Status:** draft · not published  
**Memory network (agent):** `memories/semantic/semianalysis-memory-network.md`  
**Canonical numbers:** `memories/semantic/semianalysis-deepseek-numbers.md`  
**Method:** `memories/semantic/semianalysis-method-4step.md`  
**Primary:** *DeepSeek Debates* — https://newsletter.semianalysis.com/p/deepseek-debates  
**Paper:** arXiv:2412.19437

---

## Dek

论文里的 **`$5.576M`**（媒体常写 **`~$6M`**）是真的——但它量的是 **V3 官方最终训练的 GPU 小时 × `$2`/hr 假设租价**，不是 DeepSeek 把模型做出来的 **公司 TCO**。SemiAnalysis 的四步法：论文拆解 → Accelerator Industry Model → Full TCO → 多源交叉验证。

---

## 0. Breakdown 图 ↔ 记忆节点

| 图区块 | 数字（锁定格式） | Memory node |
|--------|------------------|-------------|
| 左上 Paper Claim | **`$5.576M`** = **`2.788M`** H800-hr × **`$2`** | numbers §A |
| 右上 Semi 估算 | GPU **`>$500M`** · CapEx **`~$1.6B`** · OpEx **`~$944M`** | numbers §B |
| 中间 Included | pre **`2664K`** + ctx **`119K`** + post **`5K`** | method Step 1 |
| 中间 Excluded | R&D/ablations · data · CapEx · OpEx · talent · shared load | method Step 3 |
| 底部 Cluster | **`~50,000` Hopper**（≈10k H800 + ≈10k H100 + H20）· High-Flyer 共享 | method Step 2 |
| 右侧 Process | 4 steps | `semianalysis-method-4step` |

---

## 1. 四步分析法（正文可直接用）

### Step 1 — Paper dissection
- 读 V3 报告 → 抽出 **2.788M** H800 GPU hours  
- × **`$2`/hr** → **`$5.576M`**  
- 阶段表：`$5.328M` + `$0.238M` + `$0.01M`  
- 论文自己写明：**不含** prior research / ablations  

### Step 2 — Accelerator Industry Model
- 从「租用发票」换成「可及集群」  
- 交叉：出货、出口管制、High-Flyer、**2021 年 10,000 A100**  
- 结论：**`~50,000` Hopper 混合卡**，用途含交易/推理/训练/研究  
- 禁止写成「5 万张 H100」  

### Step 3 — Full TCO
- CapEx **`~$1.6B`** · OpEx **`~$944M`** · GPU **`>$500M`**  
- 加上 MLA 等实验、数据、高薪、共享负载  

### Step 4 — Cross-verify
- 供应链 · 招聘文案 · 同行融资现实 · benchmark 时间戳  
- 延伸：*DeepSeek Debrief* 的 tokenomics（便宜 API ≠ 便宜 CapEx）  

**核心洞见：** `$5.576M` 是 **narrow efficiency metric**（总装线某一行），不是全经济图景。

---

## 2. Benchmark 卫生（Debates）

| 对比 | 陷阱 |
|------|------|
| V3 vs GPT-4o | 4o = **2024-05**；算法进步 ~**4×/年**（Dario 可至 **10×**） |
| R1 vs o1 | 选择性披露；**o3** 更高；R1 **不报 compute** |
| R1 vs Gemini Flash 2.0 Thinking | 更早更便宜、hype 更少 |
| MLA ~**93.3%** KV 削减 | 解释 **推理** 单价，不推翻训练 CapEx |

---

## 3. 数据来源地图

见 `semianalysis-report-index.md`（A 论文 · B Semi 系列 · C 第三方 · D 站内记忆）。

写作纪律：
1. 论文美元 → 写 **`$5.576M`** + `$2/hr` assumption  
2. Semi CapEx → 写 **`~$1.6B`** 并归因 Debates  
3. 混合 GPU → 永远写 Hopper mix  
4. 二级博主（如 Alberto ~$95–120M）必须 **分开署名**，不并入 Semi `$1.6B`  

---

## 4. 英文发表大纲

1. Hook — The `$5.576M` is real; the question is wrong.  
2. Paper Table 1 — hours × $2; exclusions.  
3. Fleet — 50k Hopper / High-Flyer / 10k A100.  
4. TCO — $1.6B / $944M / >$500M.  
5. Method — four steps.  
6. Benchmark hygiene + tokenomics bridge.  
7. Sources table.

---

## Open questions

- [ ] 付费墙全文核对 `$944M` 是否明确为 lifetime OpEx vs annualized  
- [ ] 是否单开附录对比 Alberto 独立估算  
- [ ] 系列第二篇：Debrief tokenomics  
