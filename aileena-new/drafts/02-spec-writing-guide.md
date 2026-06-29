# 写一份真正有用的 Spec：以 KeyShield 为例

Spec 是什么？不是文档，不是 README，不是设计稿。

Spec 是"用户体验"和"代码行为"之间的合同。一个 AI agent 读完 spec 之后，应该能够独立写出这个功能——不多，不少，刚好。

这篇文章用 KeyShield 项目里的真实 spec 来展示：什么叫写好了，什么叫写坏了，以及一个可以直接复制的模板。

---

## 1. 最常见的错误：从技术层开始

先看一个坏的 spec，这是 KeyShield 早期的 Spec 01（vault 文件格式）：

```markdown
# 01 — Vault file format

## On-disk layout
offset  len  field
   0    16   salt
  16    12   nonce
  28    n    ciphertext (n = plaintext_len + 16, last 16 bytes are GCM tag)

## KDF
key = PBKDF2-HMAC-SHA256(password.utf8, salt, iters=100_000, dklen=32)

## Cipher
plaintext = AES-256-GCM-Decrypt(key, nonce, ciphertext, aad=empty)

## Rust API
pub fn load(vault: &VaultPath, user_id: &str, upstream: &str, password: &str) -> Result<String, VaultError>;
```

字节布局写清楚了，加密算法写清楚了。看起来很完整。

问题在于，任何一个读这份 spec 的人（包括 AI agent），都不知道：

- 什么用户操作会触发这个 load 调用？
- 如果 decrypt 失败，用户看到什么？
- 这是唯一的存储路径吗，还是有 Path B？
- Python 那边也在写文件吗？

KeyShield 的 Stage 1 就踩了这个坑。spec 全部按技术层组织，导致 agent 读完之后得出结论"agents 不是产品功能"，因为 agents 都在 Python 里实现，没有出现在 UI 的 spec 里。它们其实是核心功能，只是代码在另一层。

**根本问题**：spec 锚定在技术实现层，而不是用户功能层。

---

## 2. 正确结构：用户在上，字节在下

再看 Spec 16（Path A 设备金库），这是一个写得比较好的例子。

开头不是技术细节，是用户做了什么：

```markdown
# Spec 16 — Path A: Device Vault (WebAuthn PRF)

## What the user does
1. User clicks "Add API Key" in the dashboard
2. Browser prompts WebAuthn gesture (Touch ID / Windows Hello)
3. PRF output is derived client-side; no secret leaves the device
4. Key is encrypted with the derived master key and written to R2 via edge worker
5. On next load, same gesture decrypts and injects the key into the agent runtime
```

用户故事先行，五步之内说清楚发生了什么。然后才是实现细节。

### "Where it lives" 表格

这个表格解决了一个高频问题：这段逻辑该放哪一层？

```markdown
## Where it lives
| Layer      | Code                              | What it does              |
|------------|-----------------------------------|---------------------------|
| Browser    | components/VaultSetup.tsx         | WebAuthn gesture + PRF    |
| Edge worker| workers/vault-write.ts            | CAS write to R2           |
| Python     | none on this path                 |                           |
| Rust       | none on this path                 |                           |
| Storage    | R2: vault/{user_id}/{vault_id}.enc| AES-256-GCM blob          |
| On-chain   | none                              |                           |
```

"none on this path" 这几个字很重要。它告诉 agent：不是漏写了，是真的没有。

### 写清楚"为什么"，不只是"是什么"

技术选型部分，Spec 16 有一个 "Why these choices" 小节，举两个例子：

```markdown
## Why these choices

**Why extractable: false on the CryptoKey**
Prevents heap-dump exfiltration. If the key were extractable, any XSS
or compromised wasm module could call exportKey() and ship it out.
With extractable: false, the key can only be used for encrypt/decrypt
operations within the same origin's SubtleCrypto context.

**Why static HKDF salt**
PRF output already mixes in a per-session challenge from the server.
The salt doesn't need to add entropy; it's a domain separator.
Using a fixed label string keeps the derivation reproducible across
browser restarts without storing extra state.
```

这种写法让 agent 不会"优化"掉你的安全决策。如果只写 `extractable: false`，agent 在重构时可能改成 `true` 以方便测试。写了原因就不会了。

---

## 3. 复杂功能怎么写：多 Use Case + Phase 拆分

Spec 16 是单一功能，Spec 10（嵌入式钱包）要复杂得多。它有五个 use case：

```
A — Give wallet (create + fund new user wallet)
B — Top up (user deposits SOL)
C — Agent pays per-call via x402
D — MPP streaming micropayments
E — Revoke + reclaim (user takes back funds)
```

每个 use case 都是独立的用户故事，但它们共享底层的钱包基础设施。

### Use case 编号从用户动作开始

```markdown
## Use Case C — Agent pays per-call (x402)

1. User enables "auto-pay" toggle for a specific upstream API
2. Agent runtime calls upstream, receives 402 Payment Required
3. Runtime calls EphemeralSignerProvider::sign_payment(invoice)
4. Signed payment forwarded; upstream processes and returns 200
5. User sees micro-debit in session activity log
```

注意第一步永远是用户做了什么，不是系统做了什么。

### Phase 拆分表格

复杂功能需要 Phase 拆分，带 eng-days 估算：

```markdown
## Implementation phases

| Phase | Slice                          | Eng-days | Depends on |
|-------|--------------------------------|----------|------------|
| 10.1  | EphemeralSignerProvider trait  | 2        | —          |
| 10.2  | Wallet create + fund (Use A)   | 3        | 10.1       |
| 10.3  | Top-up flow (Use B)            | 2        | 10.2       |
| 10.4  | x402 per-call payment (Use C)  | 3        | 10.2       |
| 10.5  | MPP streaming (Use D)          | 4        | 10.4       |
| 10.6  | Revoke + reclaim (Use E)       | 2        | 10.2       |
```

然后是并行分析，这一段在排期时价值很高：

```markdown
## Parallelism

10.1 and 10.2 are sequential. After 10.2 lands, tracks A/B/C/D can run
in parallel across engineers. 10.5 (MPP) depends on 10.4 (x402) but
not on 10.3 or 10.6. The critical path is 10.1 → 10.2 → 10.4 → 10.5.
```

### "What this spec doesn't cover"

Spec 10 结尾有一个明确的排除列表：

```markdown
## What this spec doesn't cover
- Refund mechanics if upstream returns 200 but service fails
- Multi-asset payments (USDC, other SPL tokens)
- Per-upstream rate caps (spend limit per API provider)
- Cross-chain (EVM, etc.)
```

为什么要写这个？因为 agent 会合理地"补全"它认为缺失的部分。如果你不写 refund 不在范围内，agent 可能会自作主张加进去。

---

## 4. 代码放哪里：决策树

这个决策树用了四道门，按顺序问：

```
1. 需要 Solana 链上状态？
   → 是：programs/ (mandatory，Anchor/BPF)
   → 否：继续

2. 用户能看到和点击的 UI？
   → 是：frontend/ React 组件
   → 否：继续

3. 热路径？（≥100×/session，或 bug 会泄漏密钥，或会加 >10ms 延迟）
   → 是：Rust
   → 否：继续

4. 其他所有情况 → Python FastAPI
```

Python 是默认值，不是退而求其次。原因是库的可用性：

- WebAuthn 验证：`fido2` 库，Python 生态最成熟
- Solana RPC 调用：`solana-py`，功能完整
- x402 payment 验证：Python 实现稳定，文档齐全

另一个原因是迭代成本。控制面逻辑（权限管理、配置、用户设置）每周都在变。热路径逻辑（加解密、签名）每月才动一次。让高变化频率的代码在 Python 里，让低变化频率的代码在 Rust 里，是合理的分工。

如果一段逻辑你说不清楚它是不是热路径，它就不是热路径，用 Python。

---

## 5. "Out of scope" 的三种写法

"Out of scope" 是 spec 里最容易写坏的部分。有三种情况，写法完全不同：

**情况一：这份 spec 不覆盖，但其他 spec 有**

```markdown
## Out of scope
- Key rotation: covered by Spec 22 (Vault Rotation Protocol)
- Multi-device sync: covered by Spec 18 (Cross-Device Vault)
```

必须有链接或引用。写 "covered elsewhere" 没有用，agent 找不到"elsewhere"在哪里。

**情况二：这个阶段不做，后续阶段会做**

```markdown
## Out of scope for Stage 2
- Break-glass recovery (Stage 3 backlog — requires hardware key support)
- Offline mode (Stage 3 backlog — requires local cache layer)
```

必须说明是哪个阶段，以及为什么推迟。

**情况三：产品里就没有这个功能**

```markdown
## Not in product
- Plaintext key export (intentional: would defeat the security model)
```

这种情况要直接删除所有相关代码和引用，不能留"zombie references"——就是代码里还有这个功能的痕迹，但 spec 说不做。zombie reference 会让 agent 困惑。

---

## 6. 验收标准：没有 e2e 测试就不算完

一份 spec 如果没有 e2e 测试定义，就没有写完。

验收标准分四层：

```markdown
## Acceptance criteria

### E2E (required)
tests/e2e/add_key.spec.ts
- Opens dashboard, signs in with test account
- Clicks "Add API Key", fills upstream=openai, key=sk-test-xxx
- Asserts new card appears in vault list with masked key display
- Refreshes page, asserts card persists

### Integration
tests/integration/vault_roundtrip.test.ts
- encrypt → store → load → decrypt roundtrip with known plaintext
- Tests R2 mock, not real R2

### Unit
tests/unit/crypto/hkdf.test.ts
- PRF output → HKDF derivation matches test vector
- Wrong PRF output → decryption fails with VaultError::DecryptFailed

### Oracle parity (if porting crypto from another language)
tests/oracle/vault_compat.py
- Python reference implementation produces same ciphertext as Rust
- Cross-language test vectors
```

Oracle parity 这一层只在你有跨语言实现同一个加密协议时才需要。

E2E 测试描述要写到 "opens dashboard, signs in, clicks Add Key" 这个粒度，不是"测试 vault 功能"。粒度不够，agent 写出来的测试也没法验证用户流程。

---

## 7. 模板

下面是可以直接复制的模板，带注释说明每个部分的作用：

```markdown
# Spec NN — <用户可见的功能名>
# 注意：标题是功能名，不是技术模块名

## What the user does
# 从用户动作开始，5-8 步，结尾是可观测的结果
1. User clicks "..." in frontend/components/X.tsx
2. ...
3. Observable outcome (what changes on screen or in state)

## Where it lives
# 每一层都要填，没有的写 "none"
| Layer    | Code                        | What it does                  |
|----------|-----------------------------|-------------------------------|
| Frontend | components/X.tsx            | UI + fetch                    |
| Rust     | none — Python handles this  |                               |
| Python   | src/backend/server.py:679   | validates + encrypts + writes |
| Storage  | backend/vault/{user}/*.enc  | AES-256-GCM file              |
| On-chain | none                        |                               |

## Wire shape
# 具体到 HTTP method、path、body schema、response code
POST /manage/store  (Bearer auth required)
Body:    {"upstream": str, "apiKey": str}
200:     {"ok": true}
400:     upstream not in allowlist
401:     missing or expired bearer

## [Technical sections]
# Crypto contract, byte layout, state machine, etc.
# 每个非显而易见的选择都要写 "why"

## Why these choices
# 解释关键决策，防止 agent 在重构时改掉它们

## Acceptance criteria

### E2E (required)
tests/e2e/add_key.spec.ts — opens dashboard, signs in, clicks Add Key,
fills upstream + key, asserts new card appears in vault list.

### Integration
...

### Unit
...

## Out of scope
# 必须分类写清楚
- This spec: key rotation (→ Spec 22)
- This stage: multi-device sync (Stage 3 backlog)
- Not in product: plaintext key export
```

---

## 总结

写 spec 只有一条核心原则：读你 spec 的人（或 agent）能否在不问任何问题的情况下独立实现这个功能？

检验方法很简单：把 spec 给一个没有参与这个项目的工程师看十分钟，然后问他：用户做了什么？代码在哪里？怎么确认做完了？

如果他能回答，spec 写完了。如果他在问"这段逻辑是在前端还是后端"，回去补 "Where it lives" 表格。如果他在问"怎么测"，回去补 acceptance criteria。

技术细节可以后补，但用户故事必须是第一行。
