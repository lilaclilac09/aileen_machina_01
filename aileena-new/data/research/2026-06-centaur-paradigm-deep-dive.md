---
id: 2026-06-centaur-paradigm-deep-dive
type: research
date: 2026-06-16
title: Centaur — what the open-source release confirmed (Rust control plane, REST-not-MCP, warm pool, default-deny)
source: aileena.xyz research notes
topics: [agents, runtime, paradigm, centaur, kubernetes, mcp-alternative, security, slack-bot]
confidence: public
url: https://github.com/paradigmxyz/centaur
---

# Adoption traction since launch

Paradigm + Tempo open-sourced Centaur on May 21, 2026. Twenty-five days later (mid-June 2026) the public repo at paradigmxyz/centaur is at **767 stars · 135 forks · 30 open issues · 17 open PRs**. The release cadence is **centaur-0.1.61** — sixty-one patch releases in twenty-five days, ~2.4 ships per day. That's an "owned by an active team, not a press-release dump" cadence — for context, most VC-released OSS projects ship four or five patches in their first month, not sixty.

# It's not pure FastAPI/Python — there's a Rust control plane

The launch summaries and most secondary coverage describe Centaur as a FastAPI + Postgres service. That's not quite right. The repo language breakdown is **43.6% Python, 26.7% Rust, 11.9% TypeScript, 11.5% Ruby, 2.3% HTML, 1.7% PL/pgSQL**.

The Rust quarter is the directory `services/api-rs/` — a Rust control plane covering agents, tools, workflows, auth, and durable state. The Python control plane (`services/api`) coexists. The split looks like: Rust where the hot path matters (the spawn protocol, permission checks, the iron-proxy bridge), Python where the plugin ecosystem lives (tools, workflows, harness adapters). The Ruby chunk is almost certainly the Slack bot — Slack's Ruby SDK is the most mature.

This is consistent with the broader Paradigm pattern: Reth (Rust Ethereum client), Foundry (Rust toolchain), now `api-rs` in Centaur. Rust on the control plane is the Paradigm tell.

The PL/pgSQL slice (1.7%) is Postgres stored procedures — confirming that Postgres isn't just a state store, it's a participant in the workflow checkpoint logic.

# REST, not MCP — the unfashionable choice

In the second half of 2025 most agent frameworks defaulted to MCP (Model Context Protocol — Anthropic's tool-calling spec) as the universal tool interface. Centaur did not. From the AGENTS.md doc in the repo:

> Sandbox → API (REST over Kubernetes services): Agents call tools via `curl $CENTAUR_API_URL/tools/<tool>/<method>` over the in-cluster service network.

It's REST. The harness in each sandbox calls back to the central API via plain HTTP, scoped to in-cluster Kubernetes service DNS. That's much dumber than MCP and much faster — no stdio handshake, no protocol negotiation, no SDK pinning. Just curl.

Why does this matter? **MCP carries a coordination cost.** Every tool needs an MCP server implementation, every harness needs an MCP client, and protocol-level upgrades ripple through both. REST means a new tool is literally a new Python file in `tools/` — the API picks it up and exposes a REST endpoint automatically via hot reload. The trade is portability (Centaur tools aren't drop-in MCP servers for other runtimes) for ergonomics inside the runtime.

This is a deliberate counter-bet against the "MCP everywhere" narrative. Centaur's authors think the agent runtime should own the tool interface, not borrow a vendor protocol.

# Warm pool — how the user-perceived latency disappears

Aileen's original article describes the Postgres-checkpoint memory architecture but doesn't cover the Kubernetes side. The key piece is `services/sandbox/warm_pool.py`, which maintains a pool of pre-spawned sandbox pods.

The three-step protocol is:

```
POST /agent/spawn   → pins one warm runtime to your Slack thread,
                       returns runtime_id + assignment_generation + state
POST /agent/message → enqueue a user turn into that thread
POST /agent/execute → run the next turn through the harness
```

The `assignment_generation` counter is the race-condition fix — when a Slack thread reconnects or the bot restarts, the counter prevents an old spawned runtime from accidentally servicing what's now a different turn. Runtime state values seen in the wild: `assigned_idle` and (inferable) `assigned_busy`.

User-perceived latency from "mention the bot" to "agent typing" is dominated by `/agent/spawn` if the pool is hot. If the pool is cold, the user waits on K8s pod creation — which is the multi-second hit warm pools are designed to absorb. Exact pool size + replenishment policy isn't documented in the public release; both are tunable per deployment.

# The security model is two layers, not one

The original article focuses on iron-proxy as the credential boundary. That's half the story. The other half is the **default-deny NetworkPolicy** applied to every sandbox pod.

Kubernetes NetworkPolicy is a CRD that, when set to default-deny on egress, blocks all outbound traffic from the pod unless explicitly allowed. In Centaur, the only allowed egress path is to the iron-proxy service. That means:

- A jailbroken harness can't directly DNS-resolve or TCP-connect to an external host.
- The iron-proxy isn't just "the thing that injects credentials" — it's the **only outbound path** that exists.
- Adding a new external API the agent should reach means updating the proxy's rule set, not the sandbox image.

The credential layer on top is **1Password + the `centaur-perms` Rust crate**. iron-proxy doesn't hold credentials directly; it fetches them from 1Password on demand at request time. `centaur-perms` (visible in the repo under `services/api-rs/crates/centaur-perms/`) is the RBAC layer between the Slack thread (the principal) and the 1Password secret (the grant).

The principal-derivation logic is: take the Slack thread key (`slack:<channel>:<thread>`), derive a canonical principal ID, look up the role-based grants. Tool permissions are declared in `pyproject.toml` — the same file the Python tool's dependencies live in.

This is meaningfully harder to break than "an agent that calls APIs with keys in env vars." A successful attack has to bypass:

1. The harness's own guardrails
2. The default-deny NetworkPolicy
3. The iron-proxy host/path allowlist
4. The centaur-perms RBAC check
5. The 1Password fetch

# AGENTS.md — the system prompt handoff

Underdocumented detail: `services/sandbox/SYSTEM_PROMPT.md` gets baked into the sandbox image at `~/AGENTS.md` at build time. On container startup the entrypoint script copies it into `workspace/AGENTS.md` — and that file becomes the system prompt that every harness (Amp, Claude Code, Codex, pi-mono) reads.

The `AGENTS.md` filename is the convergence point of a quiet 2025-2026 convention: Claude Code, Codex CLI, Amp, and Cursor all default to reading `AGENTS.md` in the working directory as the per-project system instruction. Centaur weaponises that convention — the chassis controls the brain's identity by controlling the file the brain reads at boot.

# Daily self-improvement loop

A line in the official launch summary that didn't make secondary coverage: "At the end of every day, it reflects on how it did and self improves." This is described as a scheduled workflow (cron) that runs on the Postgres history of the day's jobs, asks the agent to critique its own performance, and presumably edits skills/tools/workflows in response.

The mechanics aren't fully public yet. The implication is significant: if true, Centaur is the first OSS agent runtime that ships with an explicit **agent-as-its-own-PM** loop, not just an executor.

# What this changes about her original read

Aileen's article was published the week of the release. With twenty-five more days of receipts:

1. The "FastAPI control plane" framing should be amended — there's a Rust control plane too, and the heavy lifting moved there.
2. The "iron-proxy keeps keys out" framing should be amended — it's actually a five-layer model (harness → default-deny → iron-proxy → centaur-perms → 1Password).
3. The "tools are Python" framing should add: tools are REST, not MCP — and that's a deliberate bet.
4. The warm-pool plumbing is a meaningful piece of the user-perceived latency story that the original article doesn't mention.
5. The adoption numbers (767★ in 25 days, 61 patch releases) confirm the original article's call that this is a real product, not a press-release release.

# RFC dive — the loop, the sandbox, the session (June 17)

A day of digging into `services/api-rs/` produced a much sharper picture of what's actually in the Rust quarter of the codebase. It's not one file or one crate — it's **sixteen Rust crates** organised as a layered control plane.

## The crate inventory

```
services/api-rs/crates/
├── absurd-sdk
├── centaur-api-server
├── centaur-iron-control
├── centaur-iron-proxy
├── centaur-perms
├── centaur-sandbox-agent-k8s
├── centaur-sandbox-core
├── centaur-sandbox-e2e
├── centaur-sandbox-local
├── centaur-sandbox-manager
├── centaur-session-cli
├── centaur-session-core
├── centaur-session-runtime
├── centaur-session-sqlx
├── centaur-telemetry
└── centaur-workflows
```

Reading the names this is a multi-year codebase. The sandbox concern is split across 5 crates (core / local / agent-k8s / manager / e2e), the session concern across 4 (core / runtime / sqlx / cli), there's a separate `iron-control` higher-level orchestrator above `iron-proxy`, and a mysterious `absurd-sdk` whose purpose isn't documented in the repo's top-level docs.

## RFC 0001 — sandbox abstraction (the contract)

`services/api-rs/rfcs/0001-sandbox-abstraction.md` is explicit that the sandbox is an INTERNAL crate boundary, never exposed through public HTTP:

> "The sandbox layer should be an internal crate boundary. Higher-level concepts like thread keys, personas, harness choice, model selection, assignment generation, and durable execution rows belong in a later data model."

The traits live in `centaur-sandbox-core`: `SandboxBackend`, `SandboxSpec`, `SandboxStatus`, `SandboxIo`. Two backends implement them — `centaur-sandbox-local` (child processes for dev) and `centaur-sandbox-agent-k8s` (the Agent Sandbox CRD for prod).

The I/O contract is bytes-only:

> "The sandbox abstraction moves bytes. It does not know whether those bytes are: NDJSON harness events, an interactive shell stream, a future binary protocol, or framed messages produced by another layer."

State machine: `Created → Running ⇄ Suspended → Stopped`, plus a `Gone` state for the case where K8s evicts a pod and the manager finds out by polling.

Reconciliation: `centaur-sandbox-manager` compares desired state against the backend's observed state and issues corrective ops. Treating in-memory state as authoritative is explicitly forbidden — there's a load-bearing rule against caching what Postgres already knows.

## RFC 0002 — session control plane (the loop)

`0002-session-control-plane.md` is where the "agent loop" actually lives. The session is the durable thing; the sandbox is a replaceable execution attachment.

Session row fields:
- `thread_key` — public unique ID, also the DB primary key
- `sandbox_id` — current runtime assignment, replaceable if it dies
- `harness_type` and `harness_thread_id` — harness-specific persistence
- `status` ∈ {active, executing, idle, failed, archived}

Internal API (different from the public spawn/message/execute trio exposed to Slack):

1. `POST /api/session/{thread_key}` — idempotent create / get
2. `POST /api/session/{thread_key}/messages` — append durable input
3. `POST /api/session/{thread_key}/execute` — execution serialised per conversation
4. `GET /api/session/{thread_key}/events` — Server-Sent Events stream, supports replay or live tail from a stored offset

Storage model: four tables — `sessions`, `session_messages`, `session_executions`, `session_events`, all keyed by `thread_key`.

The architectural rule, verbatim:

> "The session row is authoritative."

In-memory state and live connections are caches. The implementation must recover from database state alone.

## Implications

What this design buys you that the launch-day article didn't fully surface:

- **The sandbox is interchangeable.** If a pod dies mid-conversation, the manager spawns a new one, updates `session_row.sandbox_id`, and the harness side picks up from the messages table. The conversation doesn't notice.
- **The control plane is restart-safe.** The entire api-rs service can be re-deployed mid-execution; recovery is one Postgres scan away.
- **The SSE stream replays.** A client that drops connection can reconnect, ask for events since offset N, and stitch back together what it missed. That's what makes Slack threads survive bot restarts cleanly.
- **The protocol is harness-agnostic at the storage layer.** Codex JSONL, Claude protocol, future formats — they're all opaque newline-delimited lines in `session_messages` and `session_events`. Adding a new harness is a centaur-sandbox-core SandboxBackend impl plus a parser for `harness_thread_id` semantics. The session control plane doesn't change.

## Open questions

- `absurd-sdk` — name implies a client SDK with attitude. Could be the public Python SDK that wraps the four session endpoints. Unverified.
- `centaur-iron-control` vs `centaur-iron-proxy` — implies a control / data plane split for the credential layer. Worth a second pass once their READMEs are written.
- Warm pool depth / replenishment policy still not in the public RFCs. The `warm_pool.py` and `harness_session.py` paths the launch summary mentions don't seem to exist at those literal paths in the current main branch — likely renamed or moved into the Rust layer (`centaur-sandbox-manager` is the natural home).
- RFC 0003 numbering collides — there's both `0003-python-workflow-host.md` and `0003-telemetry.md`. Either a numbering accident or a sign that workflow-host and telemetry shipped in parallel without coordinating RFC numbers. Either way, worth reading.
