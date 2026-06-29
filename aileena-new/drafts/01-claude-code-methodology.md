# 用 Claude Code 做大型项目的完整方法论

大多数人用 AI 写代码的方式：开一个聊天窗口，粘贴需求，复制输出，跑一下看报错，再粘回去。

这能处理小任务。遇到真实项目——几千行代码、多个模块、跨周的迭代——这套方式会在某个时间点彻底失控。Context 越来越长，AI 开始忘之前的决定，你花越来越多时间重复解释，最终不如自己写。

这篇文章整理的是我在实际项目中跑通的一套方法，从语言选型到 context 管理都有。不是理论，是从踩坑里提炼出来的。

八个章节，每个解决一个具体问题。可以按顺序读，也可以直接跳到你当前卡住的地方。

---

## 1. 反直觉发现：Rust 比 Python 更适合 AI 编程

第一次听到这个说法的人通常会反驳：Python 语法简单，AI 写 Python 错误少。

maxlv.net 上有一篇文章拆解了这个问题。结论反过来：AI 在 Rust 上的表现更可靠，不是因为它不犯错，而是因为错误会被编译器在几秒内捕获。

Python 的问题不是 AI 写出语法错误——语法错误很容易发现。问题是逻辑错误藏在运行时的边界情况里：某个分支在测试时永远不走，某个 None 只在生产数据下出现，某个异步竞争只在高并发时触发。AI 生成了代码，你跑了测试，一切正常，部署上线，两周后爆炸。

Rust 的类型系统和借用检查器提前把这些问题暴露出来。AI 写出错误代码，`cargo check` 十秒内报错，AI 读错误信息，自己修正，不需要人介入。整个修正循环在几分钟内跑完。

具体来说：

- `match` 表达式必须覆盖所有枚举变量，忘掉一个就编译失败
- 借用检查器会抓住跨 `tokio::spawn` 边界传递非 `Send` 类型
- `Result` 强制处理错误，不能静默忽略
- 类型系统让错误的函数签名在编译时暴露，不是在运行时

Python 的 fallback 是沉默的。Rust 的 fallback 是拒绝编译。

还有一个实际的速度差异。Python 里让 AI debug 一个并发 bug，可能需要你描述症状、AI 猜原因、写测试、跑测试、看结果，来回几轮。Rust 里 AI 写出有问题的 async 代码，编译器直接指出哪一行、哪个类型、违反了什么规则。AI 读一条错误信息就能定向修复，不需要你介入。

这不是在说 Python 不好用。Python 做数据处理、脚本、胶水代码很合适。但如果你在用 AI 构建一个需要长期维护的服务，Rust 给你的反馈循环更紧。

---

## 2. 三方协作模型：人 + AI + 编译器

传统软件开发是两方：人写代码，机器跑代码。AI 编程引入了第三方，但很多人没有把角色分清楚。

清晰的分工是：

- **人 (Human)** — What & Why：定义需求，解释领域约束，做架构决策
- **AI (Claude)** — How：生成实现代码，写 tokio 异步服务器，实现 SOCKS5 状态机，写 DNS 解析器
- **编译器 (Compiler)** — Correctness：类型系统验证契约，借用检查器证明并发安全，穷举 match 消灭遗漏分支

人不应该盯着 AI 输出逐行 review——那等于把验证工作从编译器移到了人脑，是降级。人的工作是告诉 AI 要做什么、为什么这样做。编译器负责检查它做对了没有。

一个实际例子。AI 实现代理协议分发时必须处理所有类型：

```rust
// AI must handle ALL variants or compiler fails
match &proxy.protocol {
    ProxyProtocol::HttpConnect => { /* HTTP CONNECT tunnel */ }
    ProxyProtocol::Socks5(auth) => { /* SOCKS5 handshake */ }
}
```

如果项目后来加了 `ProxyProtocol::Vmess`，AI 在 `match` 里忘掉新变量，编译器立刻报错。不需要测试，不需要人工 review，在下一次 `cargo check` 时就失败。

这个模型成立的前提是语言本身有足够强的静态保证。Python 提供不了这个保证，所以三方模型在 Python 上退化成两方。

值得注意的是，这个分工要求人真的只做 What & Why，不要掉入"帮 AI 想 How"的陷阱。一旦你开始想"它应该用哪个 crate 来实现这个"，你就在做 AI 的工作。让它去选，让编译器去判断，你只管需求是否正确。

---

## 3. Spec-First 开发

在写任何代码之前，先写 spec。

这不是新理念，但在 AI 编程里变得更重要：AI 需要 spec 来定向，没有 spec 它会补全出看起来合理但方向错误的东西。

### 坏的 spec 是什么样的

```markdown
# 01 — Vault file format

## On-disk layout
offset  len  field
   0    16   salt
  16    12   nonce
  28    n    ciphertext

## KDF
key = PBKDF2-HMAC-SHA256(password.utf8, salt, iters=100_000, dklen=32)
```

这是技术层面的 spec。它告诉你文件格式，但不告诉你这个功能对用户意味着什么。AI 拿到这个 spec 能写出符合格式的代码，但没办法做权衡，没办法判断某个设计决策是否符合产品目标。

### 好的 spec 以用户行为开始

```markdown
# 16 — Path A Device Vault

## What the user does
1. First device: enroll a passkey (WebAuthn). Browser generates credential,
   PRF extension produces 32-byte secret.
2. Click "Unlock vault". Browser performs WebAuthn assertion, derives:
   - Master key — AES-256-GCM, extractable: false
   - Vault ID — 16-byte hex, used as URL path
3. Dashboard pulls /vault/:id, decrypts, renders entries.
4. User adds/edits/deletes keys. Each mutation re-encrypts with fresh IV, PUTs back.

## Where it lives
| Layer | File | What runs here |
|---|---|---|
| Browser | lib/vault.ts | deriveMasterKey(), encryptVault(), decryptVault() |
| Browser | lib/sync.ts | pull(), push() — opaque cipher transport |
| Edge worker | index.ts | /auth/challenge, /auth/exchange, GET/PUT/DELETE /vault/:id |

## Why extractable: false
crypto.subtle.importKey with extractable=false means the JS heap can't read
the raw bytes. A heap dump from a malicious extension can't exfiltrate the key.
This turns the user's secure element (TPM, Secure Enclave) into the project's TEE.
```

这个 spec 给了 AI 三件事：用户做什么、代码在哪里跑、为什么这样设计。AI 在写实现时能基于这些做判断。

### 复杂 spec 的结构

功能越复杂，spec 需要覆盖的维度越多。一个嵌入式钱包模块的 spec 结构示例：

- **5 个用例 (A-E)**，每个从用户行为出发，不从技术操作出发
- **"Where it lives" 表格**，标注 ✅ 已上线 / 📋 本次 spec 范围
- **实现分阶段**，每阶段带工程师天数估算
- **并行分析**：Phase 10.2 之后哪些工作可以四路并行（Track A/B/C/D）
- **每阶段验收标准**，AI 自测用
- **"What this spec doesn't cover" 小节**，明确排除项

最后一条很重要。AI 会主动填充它认为"应该有"的东西，排除项告诉它哪些地方不要动。

Spec 文件放在 `spec/` 目录下，用编号命名：`spec/16-vault.md`。CLAUDE.md 里只放一个 spec 索引，不放内容。AI 需要细节时自己去读那个文件。这样 CLAUDE.md 保持精简，spec 文件可以任意扩展。

写 spec 有一个检验标准：把 spec 给一个不了解技术细节的人读，他应该能说出这个功能对用户的价值。如果他只能说"这个功能存储了什么格式的数据"，这个 spec 还不够好。

---

## 4. CLAUDE.md：给 agent 的 context bootstrap

每个项目根目录放一个 `CLAUDE.md`。这是 AI 启动时读的第一个文件，决定了它对这个项目的基本理解。

CLAUDE.md 不是 README。README 是给人类新成员看的。CLAUDE.md 是给 AI 看的，目标是用最少的 token 传递最关键的约束。

### 什么应该进 CLAUDE.md

**不可违反的模式 (Non-negotiable patterns)**：

```
- Hot path calls go through cached_client only — never call upstream directly (key leak risk)
- Rust/Python cache keys must be byte-identical (shared namespace)
- Class A errors hard-fail, Class B retry (consistent error semantics)
- No catch_panic middleware — panics on hot path must crash the process
- Decrypt per-request, drop key at handler end — no long-lived plaintext keys in memory
```

这些是真实项目里的规则。每条规则背后都有一个血泪教训，不写进去 AI 就会犯同样的错。

**技术决策记录 (ADR)**：

```
- Disk-cache backend is redb (not sled, not sqlite)
- Python is the oracle — Rust may fix Python bugs but must ADR the divergence
- tokio::time::pause() does not affect real socket IO — integration tests need wiremock or a real port
```

这类事情如果不写下来，AI 在做相关修改时会基于它的训练数据做判断，而不是基于你项目的实际选型。

**当前里程碑状态**：

```
## Current Milestone: M1 — Cache Layer
Status: in progress
Completed: M0 (auth handshake)
Next: M2 (billing)
```

AI 需要知道自己在哪个阶段，不然它可能去碰还没到的东西。

### 什么不应该进 CLAUDE.md

- 能从代码读出来的信息（函数签名、文件结构）
- 不影响 AI 决策的背景故事
- 细节文档（放到 spec 文件里，CLAUDE.md 只放链接）

原则：每一行 CLAUDE.md 都应该改变 AI 的某个行为。改变不了任何行为的内容就是浪费 token。

---

## 5. 自主执行模式

和 AI 协作有两种模式：手把手确认模式和自主执行模式。

手把手模式：每一步都问你要不要继续。适合探索性工作，代价是需要你全程在场。

自主执行模式：AI 自己跑完整个流程，commit + push + 跑 CI，不打断你。适合你要去开会或者睡觉的时候。

自主模式需要在 CLAUDE.md 里明确授权范围和硬限制：

```
## Autonomous Execution
Authorized: commit, push feature branches, run tests, create PRs
Hard limits:
  - No secrets in commits
  - No DB migrations without explicit approval
  - No force push to main
  - No dependency upgrades without approval
```

没有硬限制的自主模式是危险的。AI 会做它认为"对"的事，但它的判断标准不总是和你的一致。有一次我没写 DB migrations 限制，AI 在修复一个 bug 时顺手跑了一个 schema 变更，在测试环境没问题，但如果这发生在生产上就是事故。

硬限制要写具体，不要写"谨慎操作"这种没有执行标准的话。"No DB migrations without explicit approval" 是可执行的，AI 遇到需要 migration 的情况会停下来问你。"be careful with databases" 没有任何约束力。

### Wakeup Memo

如果你在任务中途要离开，在项目根目录留一个未提交的 `WAKEUP.md`：

```markdown
# WAKEUP

Stopped at: implementing rate limiter middleware
Next step: wire RateLimiter into axum router in src/main.rs
Blocked by: nothing
Context: using governor crate, config in config.toml [rate_limit] section
```

这不是给自己看的备忘，是给下一个 AI 会话看的。新会话启动时 AI 读这个文件，知道从哪里接续，不需要重新解释一遍。

---

## 6. Milestone = Context 边界

长 context 会漂移。

一个 Claude 会话跑了几个小时之后，早期的指令权重下降，AI 开始在细节上犯一些"明明说过"的错。这不是 bug，是 transformer 架构的特性。

解决方案是把里程碑当作 context 边界：M0 完成时，关掉这个会话，开一个新会话，从 CLAUDE.md 重新 bootstrap。

里程碑切换时做两件事：

1. 更新 CLAUDE.md 的里程碑状态和 Memory Rules
2. 关闭当前会话，开新会话

不要让一个会话跑完整个项目。里程碑之间的自然间隔正好是 context reset 的时机。

里程碑粒度的参考：能在一两天内完成的功能单元，有清晰的完成标准，不跨越多个架构层。太小的里程碑让 context reset 变成负担，太大的里程碑让漂移问题重新出现。

里程碑完成时的 checklist：
1. 所有 spec 文件更新，反映实际实现
2. CLAUDE.md 的 Memory Rules 里补上这个里程碑新发现的 gotcha
3. 里程碑状态更新为 completed，下一个里程碑标记为 in progress
4. 关闭当前会话

新会话第一件事是读 CLAUDE.md，然后读 WAKEUP.md（如果有）。不要在新会话里重新粘贴上个会话的对话——那会把你要隔离的 context 带回来。

---

## 7. Context 节省技巧

每个 token 都有成本，不只是钱，还有 AI 的注意力资源。

几个实用技巧：

**用链接不用粘贴**：CLAUDE.md 里写 `See spec/16-vault.md for vault implementation details`，不要把 spec 内容直接复制进来。AI 会在需要时读那个文件。

**事实用一行写完**：`redb for disk cache, not sled` 比三段话解释 redb 的优势更有效。一行事实比一段解释更节省 token，AI 需要的是结论不是论证过程。

**ADR 不是注释**：架构决策不要写在代码注释里，写成单独的 `adr/` 目录下的文件。CLAUDE.md 里只放指向 ADR 的链接。

**一个 PR 只做一件事**：不只是代码卫生问题。PR 太大意味着 AI 在一次会话里处理了太多上下文，中途漂移风险大。拆小 PR 也是拆小 context 窗口。

**错误信息直接粘**：让 AI debug 时，把完整的编译器错误或 panic 输出直接粘给它。不要总结，不要转述。AI 读原始错误比读你的描述快得多也准确得多。

**测试用例作为 spec 的补充**：对于行为边界模糊的功能，写几个测试用例放进 spec 里比写一大段文字描述更精确。AI 读 `assert_eq!(encrypt_then_decrypt(key, plaintext), plaintext)` 比读"加解密应该互为逆操作"理解得更清楚。

**不要在对话里纠错**：如果 AI 做错了什么，不要在当前会话里反复纠正，那会把对话上下文污染。把正确规则写进 CLAUDE.md 的 Non-negotiable patterns，然后开新会话。对话纠正只在当次有效，CLAUDE.md 纠正对所有后续会话有效。

---

## 8. 可复用模板

下面是一个 `CLAUDE.md` 模板，可以直接 fork 用于新项目。按实际情况填空：

```markdown
# CLAUDE.md — [Project Name]

## What this project is
[One sentence. What does this do for the user?]

## Current milestone
**M[N] — [Name]**
- Status: in progress
- Completed: [M0, M1...]
- Next: [MN+1]

## Stack
- [Language/runtime]
- [Key dependencies]
- [Deployment target]

## Non-negotiable patterns
- [Pattern 1] — [why it exists]
- [Pattern 2] — [why it exists]
- [Pattern 3] — [why it exists]

## Architecture decisions
- [Decision 1] — [what was chosen and what was rejected]
- [Decision 2]
- See adr/ for full decision records

## Known gotchas
- [Gotcha 1]: [what happens if you get it wrong]
- [Gotcha 2]

## Spec index
- spec/[N]-[name].md — [one line description]

## Autonomous execution
Authorized: commit, push feature branches, run tests, create draft PRs
Hard limits:
  - No secrets in commits
  - No DB migrations without explicit approval
  - No force push to main
  - No dependency version bumps without approval

## Memory rules
1. [Fact 1 that AI keeps forgetting]
2. [Fact 2]
3. [Fact 3]
```

这个模板的每一个 section 都对应 AI 需要知道的一类信息。填的时候的判断标准：如果这条信息缺失，AI 会做出什么错误的决定？如果答案是"没什么影响"，就不用写。

---

## 总结

整套方法论的核心逻辑是：**把 AI 放在它擅长的位置，把验证工作交给工具而不是人**。

Rust 编译器做正确性验证。Spec 做方向对齐。CLAUDE.md 做约束传递。Milestone 边界做 context 管理。

人的工作是定义要做什么、为什么这样做，以及在工具报错时决定下一步。其他的可以交给 AI 和编译器配合跑。

这套方法在 KeyShield 项目上跑通了。不保证适用所有场景，但作为起点可以 fork。
