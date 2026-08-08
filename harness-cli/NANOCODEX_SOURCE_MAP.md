# Nanocodex source map（扒皮读码路径）

> 上游：https://github.com/gakonst/nanocodex  
> 架构总览：[NANOCODEX_ARCHITECTURE.md](./NANOCODEX_ARCHITECTURE.md)  
> 本地镜像：本目录 `src/core/harness.ts` 等  

链接形如 `crates/...` 均相对上游 repo root（`master`）。

---

## 0. 不变量 checklist（读任何文件前先背）

1. `prompt()` = 接单；`result()` = 完成  
2. Driver 是可变状态的 **唯一** 所有者；handle clone ≠ 共享可变 session  
3. 只 commit **完成** turn；fork 只从 safe checkpoint  
4. Tools 默认 Code Mode only；应用策略（存盘、密钥）在 adapter  
5. `oai` / `tools` 可独立于 agent 使用  

---

## 1. Crate → 模块指针

### Facade

| Path | 读什么 |
|------|--------|
| `crates/nanocodex/` | Alloy-style reexport / prelude |

### Agent harness 心脏

| Path | 读什么 |
|------|--------|
| `crates/nanocodex-agent/README.md` | 生命周期语义、ExecutionEnvironment |
| `crates/nanocodex-agent/src/agent/handle.rs` | `Nanocodex` / `AgentHandle`：prompt、spawn、fork |
| `crates/nanocodex-agent/src/agent/turn.rs` | `Command`、`Turn`、`QueuedTurn`、steer/cancel |
| `crates/nanocodex-agent/src/agent/driver/mod.rs` | 私有 driver loop、排队、compact |
| `crates/nanocodex-agent/src/agent/driver/control.rs` | shutdown、idle command、cancel queued |
| `crates/nanocodex-agent/src/agent/driver/branch.rs` | `BranchSpawner` / `AgentOrigin` |
| `crates/nanocodex-agent/src/agent/builder.rs` | `NanocodexBuilder` |
| `crates/nanocodex-agent/src/agent/spawn.rs` | `build_agent` / `spawn_agent_driver` |
| `crates/nanocodex-agent/src/agent/executor/` | native vs wasm `spawn_driver` |
| `crates/nanocodex-agent/src/agent/context_source/` | AGENTS.md / ExecutionEnvironment |
| `crates/nanocodex-agent/src/agent/durability/` | 持久化策略挂钩 |
| `crates/nanocodex-agent/src/session.rs` | `SessionSnapshot` / resume types |
| `crates/nanocodex-agent/src/rollout/` | Codex-compatible rollout writer |
| `crates/nanocodex-agent/src/model/run/mod.rs` | `ModelRun` 入口 |
| `crates/nanocodex-agent/src/model/run/turn.rs` | 单 turn 状态机 |
| `crates/nanocodex-agent/src/model/run/tool_calls.rs` | tool 调用调度 |
| `crates/nanocodex-agent/src/model/run/responses.rs` | 对接 Responses |
| `crates/nanocodex-agent/src/model/run/lifecycle.rs` | checkpoint / compact 边界 |
| `crates/nanocodex-agent/src/prompt_cache.rs` | prompt-cache identity |

### Tools / Code Mode

| Path | 读什么 |
|------|--------|
| `crates/nanocodex-tools/README.md` | exposure、`#[tool]`、契约 |
| `crates/nanocodex-tools/WORKSPACE_RUNTIME.md` | guest 可拆 runtime |
| `crates/nanocodex-tools/src/lib.rs` | 公共出口 |
| `crates/nanocodex-tools/src/runtime/registry.rs` | registry |
| `crates/nanocodex-tools/src/runtime/selection.rs` | CodeModeOnly vs Direct |
| `crates/nanocodex-tools/src/code_mode/mod.rs` | cell 生命周期、fanout、yield |
| `crates/nanocodex-tools/src/code_mode/embedded.rs` | QuickJS host |
| `crates/nanocodex-tools/src/code_mode/bootstrap.js` | 细胞内 bootstrap |
| `crates/nanocodex-tools/src/apply_patch/` | lark grammar + streaming parser |
| `crates/nanocodex-tools/src/shell/` | process / exec_command |
| `crates/nanocodex-tools/src/mcp/` | HTTP / stdio / catalog / tool_search |
| `crates/nanocodex-tools/src/hosted/` | Code Mode 观察类型 |

### OAI protocol

| Path | 读什么 |
|------|--------|
| `crates/nanocodex-oai-api/src/lib.rs` | 出口 |
| `crates/nanocodex-oai-api/src/openai/` | `OpenAi` builder / platform |
| `crates/nanocodex-oai-api/src/auth/` | API key + ChatGPT |
| `crates/nanocodex-oai-api/src/responses/` | request / event / tool wire types |
| `crates/nanocodex-oai-api/src/session/` | Session / compaction / context |
| `crates/nanocodex-oai-api/src/events/` | AgentEvents envelope |
| `crates/nanocodex-oai-api/src/pricing/` | usage → USD estimate |
| `crates/nanocodex-oai-api/src/realtime/` | voice / Realtime |

### Experimental（按需）

| Path | 职责 |
|------|------|
| `crates/experimental/nanocodex-voice/` | Realtime 音频 ↔ agent steer |
| `crates/experimental/nanocodex-vm/` | libkrun guest + workspace tools |
| `crates/experimental/nanocodex-browser/` | Chromium tool |
| `crates/experimental/nanocodex-egress/` | secret proxy / EgressLease |
| `crates/experimental/nanocodex-eval/` | Harbor / differential vs stock Codex |

---

## 2. 关键调用链（读码顺序）

### 2.1 一次 prompt 怎么进 driver

```text
Nanocodex::builder(openai).…build()
  → spawn_agent_driver / spawn_driver
  → AgentDriver::run  (commands mpsc)
Nanocodex::prompt(text)
  → mpsc Command::Prompt { …, result oneshot, events }
  → returns Turn (accepted)
AgentDriver
  → dequeue / start ModelRun turn
  → on complete: oneshot TurnResult + update fork checkpoint
```

**先读：** `handle.rs` → `turn.rs` → `driver/mod.rs` → `spawn.rs`

### 2.2 ModelRun 内层

```text
ModelRun::new | from_checkpoint
  → responses attempt (oai-api Tower client)
  → stream events → tool_calls
  → Tools dispatch (often Code Mode exec)
  → CompletedModelTurn / HistoryCheckpoint
  → optional compact
```

**先读：** `model/run/mod.rs` → `turn.rs` → `tool_calls.rs` → `responses.rs` → `lifecycle.rs`

### 2.3 Code Mode cell

```text
model tool_call → exec / code_mode entry
  → CodeModeRuntime cell
  → EmbeddedHost (QuickJS)
  → tools.* nested calls (semaphore-limited)
  → ToolOutput (+ notifications / wait)
```

**先读：** `code_mode/mod.rs` → `embedded.rs` → `hosted/types.rs` → `runtime/selection.rs`

---

## 3. Examples 进阶路径（oneshot 之后）

`oneshot` / `minimal.rs` 只证明 builder + 单 prompt。按这个梯子：

| 阶 | Binary / dir | 学什么 |
|----|--------------|--------|
| 1 | `minimal` | builder + `prompt` + `result` |
| 2 | `follow_on` | 多轮、保留 history、改 thinking、events |
| 3 | `custom_tool` | `#[tool]` + Code Mode 调 `tools.multiply` |
| 4 | `lifecycle` | SessionId、Tower timeout、observer |
| 5 | `resume` | `SessionSnapshot` 序列化 → `resume` |
| 6 | `mcp` | MCP server + `tool_search` |
| 7 | `subagents` | `spawn_agent` / `fork_agent` / `prompt_agent` + `tools_factory` |
| 8 | `fork_conversations` | 多分支 ledger、checkpoint 隔离 |
| 9 | `browser_agent` | BrowserTool provider |
| 10 | `secret_egress` | 密钥不进模型；可选 VM |
| 11 | `voice` / `realtime_pipe` | steer 进行中的 coding turn |
| 12 | `node/` · `python/` · `react-vite/` | 跨语言同一 harness |
| 13 | `rivet-actors` · `cloudflare-workers` · `vercel-workflows` | durable 宿主 |

跑法（上游 repo root）：

```sh
cargo run -p nanocodex-examples --bin follow_on
cargo run -p nanocodex-examples --bin custom_tool
cargo run -p nanocodex-examples --bin subagents
NANOCODEX_SUBAGENT_JSONL=1 cargo run -p nanocodex-examples --bin subagents
```

---

## 4. Nanocodex ↔ `hx` 差距表

| 老师概念 | `hx` 现状 | 缺口 |
|---------|-----------|------|
| private Driver + mpsc `Command` | [`src/core/harness.ts`](./src/core/harness.ts) 单进程 Promise 队列 | 无多 clone handle 真异步 command bus |
| `Turn` steer / cancel / queued | `Turn.steer` / `cancel` 雏形 + AbortSignal | 无 mid-turn safe-boundary steer；排队语义弱 |
| `SessionSnapshot` / `fork_from` | checkpoint + `~/.hx/session.json` | 缺 Codex 级 history checkpoint / lineage |
| Code Mode QuickJS + yield/wait | [`src/tools/codeMode.ts`](./src/tools/codeMode.ts) `AsyncFunction` | 非隔离；无 nested observer / wait 协议 |
| `ToolExposure` / MCP / apply_patch | builtin + 简版 patch + MCP **config** | 无真 MCP stdio；无 Codex exposure 语义 |
| prompt_cache / compaction / rollout | 无 | 未实现 |
| `tools_factory` subagents | 无 | 未实现 |
| Tower Responses WS | openai-compatible chat completions | 协议层不同（教学够用，非 Codex 对齐） |

### 下一刀若要改 `hx`（仅建议，本轮不改码）

1. **Turn 队列 + cancel** — 对齐 `QueuedTurn` / 不 commit 半截  
2. **snapshot / fork** — completed checkpoint only  
3. **Code Mode yield 语义** — 再考虑隔离 runtime  

站内 `aileena-new/app/api/chat` **不在** 本差距表改造范围内（另一套产品 ReAct）。

---

## 5. 与手写指南的对应

| 手写步骤 ([HANDWRITTEN_HARNESS.md](./HANDWRITTEN_HARNESS.md)) | 上游对照 |
|--------------------------------------------------------------|----------|
| S0 边界 | Architecture §2–3 |
| S1 types | `oai-api` responses + agent `Turn`/`TurnResult` |
| S2 provider | `nanocodex-oai-api` OpenAi / Session |
| S3 tools | `nanocodex-tools` registry + apply_patch + shell |
| S4 driver loop | `agent/driver` + `model/run` |
| S5 events | `oai-api/src/events` + `AgentEvents` |
| S6+ MCP / IDE | `tools/mcp` + adapters（bin / workers） |

---

## 6. 快速验证（本地文档）

```sh
# 本 repo：确认笔记在位
ls harness-cli/NANOCODEX_ARCHITECTURE.md harness-cli/NANOCODEX_SOURCE_MAP.md

# 上游（可选）：clone 后按 §3 跑 examples
# git clone https://github.com/gakonst/nanocodex && cd nanocodex
# cargo run -p nanocodex-examples --bin follow_on
```
