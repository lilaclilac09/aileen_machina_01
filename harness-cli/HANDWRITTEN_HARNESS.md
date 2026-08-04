# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# 手写 Harness — 拆解步骤

> 跟做指南。每一节对应 `harness-cli/src` 里一块代码。  
> 原则：**先 loop，后产品；先 core，后 CLI。**

---

## S0 — 边界（先写清楚再写码）

**Harness 拥有：** turns、history、tools、provider、cancel、checkpoint  
**Adapter 拥有：** argv、TUI、JSONL 打印、IDE RPC、云调度  
**不算 harness：** 编辑器 Apply UI、Tab 补全、计费、索引服务

验收：能在白板上画出 Amp 图——多个 CLI 箭头指向一个 core。

---

## S1 — 类型与不变量

文件：`src/core/types.ts`

手写这些类型（不要先写框架）：

1. `Message` — user / assistant / tool  
2. `ToolDefinition` — name + schema + `execute`  
3. `Provider` — `complete({ system, messages, tools, signal })`  
4. `Snapshot` / `Checkpoint` — 可序列化会话边界  

不变量写进注释：

- 只 commit **完成**的 turn  
- `prompt()` ≠ 完成；`result()` 才是  
- fork 只从 completed checkpoint 取样  

验收：`tsc`/`strip-types` 能 import types，零运行时。

---

## S2 — Provider（可替换的模型口）

文件：`src/providers/{mock,openai,index}.ts`

1. 先做 **mock**：把自然语言映射成 tool_calls（无网络也能测 loop）  
2. 再做 **openai-compatible** chat completions + tools  
3. `createProvider(name)` 工厂  

验收：

```sh
node --experimental-strip-types bin/hx.ts -x "list files" --provider mock
```

---

## S3 — Tool registry + 本地工具

文件：`src/tools/builtin.ts` · `src/core/registry.ts`

手写最小集合：

| Tool | 用途 |
|------|------|
| `list_dir` / `read_file` / `grep` | 读世界 |
| `apply_patch` | 改世界（unified diff） |
| `write_file` / `shell` | 危险，默认关 |
| `code_mode` | 一细胞内组合 tools |

规则：

- 路径必须锁在 `cwd`  
- 输出有字节上限  
- `execute` 吃 `AbortSignal`  

验收：单独 `await tool.execute(...)` 不经过模型也能跑。

---

## S4 — Driver loop（harness 心脏）

文件：`src/core/harness.ts`

手写伪代码必须长这样：

```text
prompt(text) → enqueue
  push user message
  loop ≤ N:
    response = provider.complete(...)
    if message: commit assistant; break
    if tool_calls:
      commit assistant+calls
      for each call: execute → commit tool result
  return TurnResult + Checkpoint
```

同时手写：

- `steer`（进队前附加；v0 可简化）  
- `cancel` → `AbortController`  
- `fork` / `snapshot` / `resume`  

验收：`test/smoke.ts` 绿。

---

## S5 — Events / JSONL（给所有 CLI 用的旁路）

文件：`src/core/events.ts`

事件流（Amp `--stream-json` 同类）：

```text
turn.start → tool.start → tool.end → message.delta? → turn.end
```

Adapter 只 subscribe，不改 history。

验收：

```sh
hx -x "list files" --jsonl
# 每行一个 JSON event
```

---

## S6 — Rules（L3 入口）

文件：`src/core/rules.ts`

加载顺序拼进 system：

1. 内置 system  
2. `AGENTS.md`（cwd）  
3. `.hx/rules/*.md`  

验收：放一个 `AGENTS.md` 写 “always mention TOKEN-HX”，mock/openai 回复里能看到策略被注入（system 长度变了即可）。

---

## S7 — 专用 CLI = preset，不是第二套 agent

文件：`src/adapters/cli/*`

| CLI | 只改什么 |
|-----|----------|
| `hx run` / `-x` | oneshot prompt |
| `hx repl` | 循环 prompt |
| `hx review` | system preset + 只读 tools |
| `hx tools` | dump registry |
| `hx mcp …` | 把 MCP 描述 **注册进同一 registry** |
| `hx session` | 读写 snapshot 文件 |

验收：`review` 与 `run` 共用 `Harness` class，零复制 loop。

---

## S8 — MCP（同一 registry，不要平行宇宙）

文件：`src/mcp/config.ts`

v0：

- `hx mcp add|list|remove` 持久化 `~/.hx/mcp.json`  
- 启动 harness 时把配置的 server **投影成 placeholder tools**（或 stdio client）  
- tool 名：`mcp__<server>__<tool>`  

v1 再接真 stdio。先保证 **注册路径** 与 builtin 相同。

---

## 推荐动手顺序（日历无关，按依赖）

```text
S0 边界
 → S1 types
 → S2 mock provider
 → S3 list/read/grep
 → S4 driver loop          ← 此刻你就有 harness
 → S5 events/jsonl
 → S6 rules
 → S3b apply_patch
 → S7 review / mcp CLIs
 → S8 real MCP transport
 → IDE adapter（最后）
```

**不要**在 S4 之前开 VS Code extension。

---

## 完成定义（手写 harness v0）

- [x] 一个 `Harness` 类拥有全部可变状态  
- [x] 多个 CLI adapter 零复制 loop  
- [x] mock 离线可测  
- [x] checkpoint 可 resume  
- [x] code_mode 可组合 tools  
- [x] apply_patch / rules / jsonl / review / mcp config  
- [ ] 真 MCP stdio（下一步）  
- [ ] IDE JSON-RPC（下一步）  

对照实现：本目录源码。对照架构：`AMP_STYLE.md` · `CURSOR_REWRITE.md`。
