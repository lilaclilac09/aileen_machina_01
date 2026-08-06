---
id: 2026-08-huawei-nvidia-supply-factcheck
type: research
date: 2026-08-06
title: 封闭自主 vs 全球掌控 — 华为与英伟达供应链分野（事实核查稿）
source: industry survey fact-check draft (pdf_11 / word_32 / word_48 / word_53 / word_54 cites); pasted incomplete through §4.1
topics: [huawei, nvidia, pcb, hbm, dram, substrate, shennan, victory-giant, cxmt, fact-check]
confidence: mixed
url: https://aileena.xyz/blog/huawei-supply
---

# 封闭自主 vs 全球掌控：华为与英伟达的供应链分野

**状态：事实核查稿 / incomplete paste。** 发布措辞建议降级为「据行业调研信息显示」。  
原文截断于 **§4.1 三层解耦架构：** — 后文待用户补全。

**不要与 Semi `SPHBM4`（JESD330-4）混淆。** 本稿 §4 的「谷歌 SP-HBM / 内存池化」是 **CXL+OCS 远端内存池** 叙事，机制不同。

# 0. Corpus cross-check（对本站已发文）

| 本稿主张 | 站内 / Semi hub | Verdict |
|----------|-----------------|---------|
| 深南 36 层 / M8 / HVLP — **谷歌 TPU V8**，非华为自有芯片 | `/blog/huawei-supply`：深南是 **Ascend PCB 锚**（>30%），未写 36L=华为 | **采纳核查**：36L/V8 勿挂华为芯；Ascend 深南叙事另立 |
| 「三代铜箔」→ 改为 **HVLP2/4** | `/blog/ai-hardware-scarcity` 用 HVLP4 | **采纳** |
| 胜宏 B300 PCB **50–60%**；揖斐电载板 **80–90%** | supply 文：胜宏 GB200 / AI-server PCB **>30%**（口径不同代） | **并存** — 标 B300 专属份额 vs 全球 AI-server 份额 |
| HVLP4 缺口 **48% / 43%**（2026/2027）；ABF **26%/46%**（2027–28） | scarcity 文 HVLP4 **48%/43%** 一致 | **对齐** scarcity |
| HBM die **+35–45%**、良率 **−20–30%**、同容量价 **≥6× DDR**、毛利 ~**70%** | Semi X：数倍 wafer、stack yield 92/87…；**无** 35–45 / 6× / 70% | **industry survey only** — 勿并入 Semi §3d 数字 |
| DDR4 涨幅倒挂 DDR5 | Memory hub 有 mix-shift / supercycle，无倒挂数 | survey |
| 长协覆盖 DRAM **30–40%** | Semi podcast LTA 叙事，无此区间 | survey |
| HBM4 量产降价 **−15–20%**（2026Q3–27） | Semi：短缺进 2028 / HBM4E 叙事 | **张力** — 标调研假设 |
| 谷歌 SP-HBM = CXL+OCS 池化 | Semi **SPHBM4** = 标准封装 HBM4 | **必须分名** |

站点主文：[`/blog/memory-tax`](https://aileena.xyz/blog/memory-tax)（own synthesis）· [`/blog/huawei-supply`](https://aileena.xyz/blog/huawei-supply) · [`/blog/huawei-hbm`](https://aileena.xyz/blog/huawei-hbm) · Memory hub `2026-08-semianalysis-dram-hbm-memory.md`

# 一、引言（稿）

AI 算力竞争的核心，正从芯片本身向供应链纵深转移。华为与英伟达两条路径——**封闭自主**与**全球掌控**——正在重塑半导体产业权力版图。本稿从 **PCB、存储、封装** 三维梳理关键事实与数据。

# 二、PCB：深南电路 vs 胜宏科技

## 2.1 华为侧锚点：深南 — 但规格核查要拆场景

| 项 | 核查稿 | 发布建议 |
|----|--------|----------|
| PCB 层数 | 36 层 | 可写，但须绑定场景 |
| 板材 | M8（二代布 + HVLP 铜箔） | OK |
| 铜箔 | 勿写「三代铜箔」 | → **HVLP2/4 等级铜箔** |
| 应用 | **谷歌 TPU V8**，非华为自有芯片 | **强制限定** |
| 「V8 版」39 层 | V8 方案规格 | → 「谷歌 TPU V8 方案」 |

深南地位（稿）：一阶 PCB 供应商；泰国厂扩产 HLC+HDI，产能约 **1–2 万 m²/月**（cite pdf_11）。

**与站内 supply 文关系：** Ascend 侧深南 >30% AI-server PCB、无锡厂、14L+ FC-BGA/ABF — **仍有效**；不要把 TPU V8 36L 写成「华为板」。

## 2.2 英伟达侧：胜宏等

**B300（稿）：**

| 环节 | 厂商 | 份额（调研） |
|------|------|--------------|
| PCB | 胜宏科技 | **50–60%** |
| 载板 | 揖斐电 IBIDEN | **80–90%** |

**缺料背景（稿 ≈ scarcity）：** 2026H1 PCB/载板缺料加剧；HVLP4 铜箔 2026H2–2027 吃紧；供需缺口 **2026: 48%** · **2027: 43%**；ABF 载板缺口 **2027/2028: 26% / 46%**（pdf_11）。

# 三、存储：HBM 为何吃掉 DRAM 产能

## 3.1 经济杠杆（industry survey — 非 Semi 线程）

HBM 与 DDR 共享 DRAM 晶圆产线，调研差异：

| 指标 | HBM vs DDR（稿） | 影响 |
|------|------------------|------|
| Die size | **大 35–45%** | TSV 占面积 → 同 wafer 产出↓ |
| 良率 | **低 20–30%** | TSV / 3D / 键合 |
| 售价 | 同容量 DDR **≥6×**；毛利叙事 ~**70%** | 原厂优先配产能给 HBM |

**结果（稿）：** 一片产能 DDR→HBM → 市场总 bit **净减少**；DDR4 供给收缩 → DDR4 涨幅倒挂 DDR5（word_32）。

**对照 Semi wafer 线程：** 机制同向（die↑、sort↓、TSV/thin、stack compound），**量化口径不同** — 发布时分栏，勿合并成一个「事实表」。

## 3.2 存储周期四阶段（2023–2027，稿）

| 阶段 | 时间 | 涨价驱动 | 降价压力 |
|------|------|----------|----------|
| 触底企稳 | 2023 | 服务器重建库存 | — |
| AI 涨价潮 | 2024Q1–2025Q2 | HBM3E；DDR5 渗透 **>30%** | — |
| 高位震荡 | 2025Q3–2026Q2 | HBM 紧；原厂产能占比升至 **~40%** | 消费级 DDR4 库存 |
| 分化再平衡 | 2026Q3–2027 | 企业级仍坚挺 | HBM4 量产降价叙事 **−15–20%**；消费级下行 |

稿称：HBM 最紧物料；产线满载；产能排到 **2027**（word_54 / word_53）。与 Semi「短缺叙事进 2028」并置时标注来源。

## 3.3 长协（稿）

服务器 DRAM 长协预计覆盖整个 DRAM 供应量 **30–40%**；原厂服务器相关需求基本纳入长协（word_48）。

# 四、封装突围：CoWoS → 内存池化（**截断**）

## 4.1 谷歌 SP-HBM（内存池化）— 稿开头

核心逻辑（稿）：经 **CXL + OCS**，将 HBM 从 CoWoS 中解放，以远端 DRAM 内存池替代部分 HBM → 降本 + 扩容。

三层解耦架构：

> **【原文在此截断 — 待补】**

### 命名防火墙

| 名 | 是什么 | 不是什么 |
|----|--------|----------|
| **SPHBM4**（Semi / JEDEC JESD330-4） | 同 HBM4 stacks + 新 buffer；标准封装；substrate 受益 | 不是 CXL 内存池 |
| **SP-HBM / 谷歌池化**（本稿） | CXL+OCS 远端 DRAM 替部分近端 HBM | 不是 JESD330-4 |

# 5. 与 Memory hub / Huawei 笔记的接法

| 问题 | 用哪份 |
|------|--------|
| 为什么 HBM 吃 DRAM wafer | Semi thread §3c-1 + 本稿 §3.1（分栏数字） |
| 怎么绕开 CoWoS | Semi **SPHBM4** §3c-2 / 3f **或** 本稿谷歌池化（机制不同） |
| CXMT 是否砸周期 | Semi §3c-3B |
| 华为能不能造卡 | `/blog/huawei-hbm` + §4 CXMT yield 待填 |
| PCB 封闭 vs 全球 | `/blog/huawei-supply` + 本稿 §2（注意 V8≠Ascend） |

# Open

1. 用户补全 §4.1 三层解耦及后文。  
2. 发布前统一「据行业调研」措辞；Semi 数字与 survey 数字分表。  
3. ~~可选：B300 胜宏 50–60% / IBIDEN 80–90% 写入 supply 文~~ → **filed** in `/blog/huawei-supply` (survey framing).
