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
