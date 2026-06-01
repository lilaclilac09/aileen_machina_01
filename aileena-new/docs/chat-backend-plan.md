# Chat Backend Plan — 暂存，不部署

记录 2026-06-01 的分析。不动代码，不改 Vercel env。等流量/账单触发再执行。

---

## 现状

- `app/api/chat/route.ts` 当前生产用 `claude-sonnet-4-6`（Anthropic）
- 已经写好的 fallback 链：`AGENT_BASE_URL` → `DEEPSEEK_API_KEY` → `ANTHROPIC_API_KEY`
- 每访客每天 20 条上限，最近 20 turns 截断
- prompt caching 已开（ephemeral）

## Privacy & Data Handling

每次切换 backend 都改变 chat 数据的法律归属、处理方、训练用途默认值。任何后端切换之前必须先决定这一步。

### Per-provider 数据流

| Provider | 数据所在地 | 默认拿数据训练？ | 备注 |
|---|---|---|---|
| Anthropic | 美国 | 否（消费 API 默认不训练，30 天保留） | 现状 |
| DeepSeek | 中国大陆 | **是**（默认开，可在 platform 关） | 切换前必须先关训练开关 |
| SiliconFlow | 中国大陆 | 取决于具体模型条款，需逐个确认 | 同上 |
| Modal + 自部署 vLLM | 美国（Modal IDC） | 否（自部署，无第三方模型供应商） | 数据只在 Modal pod 内存里 |
| 本地 (M4 Air / Mac mini) | 私有 | 否 | 但邮件收集行为不变 |

### 访客侧风险（不因 backend 改变）

- 访客在 chat 里粘贴的代码、PII、个人陈述都进入选定 provider 的日志
- `/api/chat/forward` 把每条 transcript 自动转发到站长邮箱（已经在做了）
- chat 在 2 条消息后强制收 email（已经在做了）
- 以上两个行为在切 backend 时**不变**，所以隐私政策的"我们会收集你的对话"语句不需要重写

### 任何 backend 切换的 3 项前置

1. **UI disclaimer**：chat 入口贴一句话——"Chat content is processed by [provider name]. Don't paste anything you wouldn't share publicly."（EN+DE 都要，参考 `lib/translations.ts` 现有 i18n 结构）
2. **隐私政策页**：如果还没有专门页面，加一页说明：当前 provider、数据保留期、视情况列 sub-processors。Vercel + Resend + 选定的 LLM provider 都算
3. **关训练开关**（DeepSeek / SiliconFlow 专项）：在 platform 后台把"允许用于模型改进"关掉，截图存档

### 文档自审清单（每次更新本文都跑一遍）

- 不写站长邮箱、真名、电话、住址
- 不写 API key、token、secret 值（用 env var 名指代）
- 不写访客 email 样本、transcript 片段
- 不写 Resend / Vercel / Modal / DeepSeek 账户 ID
- 提到品牌只用公开域名 `aileena.xyz` 或公开品牌名 `AILEENA`，不用任何能反查到自然人的字符串

本文档当前符合以上清单 — 可安全入仓。

---

## 单条消息成本（~2k 输入 + 400 输出 + 1k cached system）

| 提供方 | 模型 | $/条 | ¥/条 |
|---|---|---|---|
| Anthropic | Claude Sonnet 4.6 | 0.013 | 0.09 |
| DeepSeek | deepseek-chat (V3) | 0.001 | 0.007 |
| SiliconFlow | Qwen3-30B-A3B | 0.0008 | 0.006 |
| 本地 Qwen3-4B (M4 Air) | — | 0 | 电费 0.001 |

DeepSeek 比 Anthropic 便宜 ~13×，质量约 Sonnet 4.6 的 85-90%。

## 年成本对照

| 流量档 | DAU | Anthropic ¥/年 | DeepSeek ¥/年 | 省 |
|---|---|---|---|---|
| 低（现状） | 50 | 420 | 32 | 388 |
| 中 | 500 | 2,640 | 200 | 2,440 |
| 高 | 2,000 | 5,280 | 400 | 4,880 |
| 爆 | 10,000 | 13,200 | 1,000 | 12,200 |

---

## 推荐路径

### Phase 1 — DeepSeek key（触发条件：Anthropic 月账单 > ¥50）

5 分钟操作，零代码：

```
1. https://platform.deepseek.com/ 注册（有 ¥10 免费额度）
2. 创建 API key
3. Vercel → aileena-xyz → Settings → Environment Variables：
     DEEPSEEK_API_KEY = sk-xxxxxxxxxx
     （可选）AGENT_MODEL = deepseek-reasoner   # R1 推理版
4. Redeploy
```

`route.ts:25-37` 会自动切换 base URL 到 `https://api.deepseek.com`。

回滚：删除 env var → 自动回到 Anthropic。

### Phase 2 — 本地 Qwen3-4B 作为 dev/测试（触发条件：想做 persona fine-tune 或 SFP dogfood）

不上生产，只在 M4 Air 上跑：

```
brew install ollama
ollama pull qwen3:4b              # 2.5GB
ollama serve
# 自测：curl localhost:11434/v1/chat/completions ...
```

M4 Air 16GB / Qwen3-4B Q4_K_M：~3GB 占用，25-30 t/s。

### Phase 3 — 生产替换（触发条件：流量稳定在 DAU > 2000，DeepSeek 年账单 > ¥3000）

二选一：

- **Modal serverless vLLM**：复用 SFP 项目的 Modal 账号，部署 `vllm serve Qwen3-Coder-30B`。闲时 0 成本，30s 冷启动。
- **Mac mini M4 16GB**（¥4,499，base 款而不是 Pro）：M4 Air 当不了 7×24 server，但 mini 可以。Cloudflare Tunnel 出去。

**不要**为了 aileena.xyz 单独买 Mac mini M4 Pro 24GB（¥10,499）—— 数学不支持，回本要 4+ 年。

---

## 记忆优化（不动现状，等本地化再做）

### 硬件层（仅本地推理时相关）

| 优化 | 效果 | 何时做 |
|---|---|---|
| GGUF Q4_K_M 量化 | 权重缩到 31% | Ollama 默认就是 |
| KV cache int8 | KV 缩到 50% | llama.cpp `-ctk q8_0` |
| PagedAttention | 碎片化 -60% | vLLM 默认 |
| `--num_ctx 4096`（别用默认 32k） | 立刻不 swap | 起 server 时设 |

### 对话层（route.ts 改造，可独立于本地化先做）

当前 `route.ts:154` 是粗暴 `messages.slice(-20)`。三级升级：

**L1 token-budget truncation（~30 分钟工作量）**  
按 token 数砍而不是 turn 数。系统块 + 装满 4k token 的最近 turns。
用 `tiktoken` 或 Qwen tokenizer 计数。

**L2 摘要 + 滚动窗口（~半天工作量）**  
context > 阈值时，最老 N turns 喂给 1.5B 模型压成 200-token 摘要挂在 system 末尾。  
本地化后才有意义（云 API 算摘要也要钱）。

**L3 SFP-style persona anchoring（研究级，~一周工作量）**  
LoRA 在 Qwen3-7B 上 fine-tune AILEENA persona（blog 文章 + 写作风格），用 SFP loss（`sfp/methods.py`）锚定关键激活防止遗忘 general capability。  
把 `lib/agentContext.ts` 的 SYSTEM_PROMPT 从运行时注入变成权重内化，每次推理省 1-2k input token。  
**这是 SFP paper 的真实下游 demo，研究价值 > 工程价值。**

---

## 路由策略（生产升级后再做）

`route.ts:157` 之前加一层 classifier：

| 触发条件 | 路由到 |
|---|---|
| 寒暄 / FAQ | 本地/便宜模型 |
| 涉及代码、长推理、外部知识 | Anthropic |
| 本地 health check 失败 | DeepSeek 兜底 |
| 当日 Anthropic 预算超阈值 | 强制便宜模型 |

最简实现：~30 行 regex 或 0.6B classifier prompt 在 edge runtime 里跑，<5ms 决策。

---

## 其他用途（顺带，决策不影响 aileena.xyz）

DeepSeek key 配到本地工具一次性两用：

- Claude Code（设 `ANTHROPIC_BASE_URL`）
- Cursor / Continue / Aider
- 自己写代码的 70% boilerplate 任务

不需要单独再付 OpenAI / Anthropic 一次。

---

## 决策门槛速查

| 触发 | 动作 |
|---|---|
| Anthropic 月账单 > ¥50 | 上 DeepSeek key（Phase 1） |
| 想做 SFP persona demo | 装 Ollama + Qwen3-4B 试（Phase 2） |
| DAU > 2000，DeepSeek 年账 > ¥3000 | 评估 Modal vs Mac mini base（Phase 3） |
| SFP 研究 wrap-up + 不打算商业化 | 永远停在 DeepSeek key |
