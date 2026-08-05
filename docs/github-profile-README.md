# Aileen

DeFi propagation research & hardware supply chain analysis. Writing about why things break and DJing while they keep running.

### ✦ Featured Dispatch
* **[Building KeyShield, Spec-First](./keyshield.md)** — Engineering a zero-knowledge "iCloud Keychain" for agent credentials. Enforcing client-side encryption invariants (WebAuthn PRF → HKDF → AES-256-GCM), instant revocation, and proxy-level spending caps via high-performance Rust proxying (50–80ms hot path).

---

### Research & Builds
* **KeyShield (Solana Mini Hack SG #5)**: Zero-knowledge credential isolation proxy for autonomous agents. Built with a Rust reverse proxy, AES-256-GCM, and a 50–80ms hot path to secure session-scoped credentials.
* **Solana MEV Contagion**: Multi-pool shock propagation modeling and prop AMM risk mechanics.
* **Semiconductor Supply Chain**: Mapping the physical and economic dependencies of AI silicon — focusing on Co-Packaged Optics (CPO) and NVIDIA GB200/GB300 packaging bottlenecks.
* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: Owned-weight post-training playground — holdout-gated LoRA/SFT on open 0.5B weights, with DPO/RL scaffold and a self-correcting agent loop.

### Process & Precision
* **Spec-Driven AI Co-authoring**: Treating human-written specs as the source of truth; leveraging AI to generate structural scaffolding, while leaving zero room for LLM drift or hallucination.
* **Compiler-Guarded Safety**: Using Rust's strict type-system (Type-State pattern, lifetime constraints) as a compile-time firewall. AI writes the code, the borrow checker verifies the logic.
* **Deterministic Hot Paths**: Strict latency budgeting (50-80ms target in KeyShield), zero-allocation design, and aggressive profiling to keep runtime overhead at absolute zero.

### Stack
* Rust, TypeScript, Python
* Solana VM, ZK, MEV Simulation, LoRA post-training

---

### Recently Updated
<!-- profile:synced-at 2026-08-05T11:59:09.181Z -->
<!-- profile:recently-updated:start -->
* **[aileena.xyz](https://aileena.xyz) Console**: Durable agent chat forwards, and Console voice orb + soft Shanghai auntie TTS.
* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: Self-correcting agent loop (act → critic → adjust), Polar Lab recent work (three packs at 1.000), Polar-native harness for 0.5B + LoRA, and Cafe/SEMIS miss polish + full-attn LoRA: holdout 1.000.
* **Cafe Cursor**: Credits distribution and user support tooling at [cursor-cafe.aileena.xyz](https://cursor-cafe.aileena.xyz).
* **Machina memory**: How the Site Remembers — Machina memory essay, and watchlist-only RSS ingest + Dreaming.
<!-- profile:recently-updated:end -->

### Recently Added
<!-- profile:recently-added:start -->
* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: Owned-weight post-training playground — SFT (LoRA) → DPO → RL scaffold → holdout eval → chat on `Qwen2.5-0.5B-Instruct`.
* **Machina memory**: Site memory loop and *[How the Site Remembers](https://aileena.xyz/blog/machina-memory)* dispatch — Dreaming reports plus watchlist-only RSS ingest.
* **Console voice-code**: Orb voice to DeepSeek propose-only patches without Cursor API tokens, with visitor quota and live eval gates.
<!-- profile:recently-added:end -->

---

[aileena.xyz](https://aileena.xyz) • [@lilaclilac09](https://github.com/lilaclilac09)
