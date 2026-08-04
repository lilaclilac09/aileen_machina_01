# Aileen

DeFi propagation research & hardware supply chain analysis. Writing about why things break and DJing while they keep running.

### ✦ Featured Dispatch
* **[Building KeyShield, Spec-First](./keyshield.md)** — Engineering a zero-knowledge "iCloud Keychain" for agent credentials. Enforcing client-side encryption invariants (WebAuthn PRF → HKDF → AES-256-GCM), instant revocation, and proxy-level spending caps via high-performance Rust proxying (50–80ms hot path).

---

### Recently Updated
* **[aileena.xyz](https://aileena.xyz) Console**: Voice orb and soft Shanghai auntie TTS, Aileena summon, Prophecy Hall, Safari/iOS STT·TTS hardening, and durable agent chat forwards (list, resend, 6h cron).
* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: Self-correcting agent loop (plan → act → critic → adjust), Console voice integration path, and Machina orb presence.
* **Cafe Cursor**: Credits distribution and user support tooling at [cursor-cafe.aileena.xyz](https://cursor-cafe.aileena.xyz).

### Recently Added
* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: Owned-weight post-training playground — SFT (LoRA) → DPO → RL scaffold → holdout eval → chat on `Qwen2.5-0.5B-Instruct`.
* **Console voice-code**: Orb voice to DeepSeek propose-only patches without Cursor API tokens, with visitor quota and live eval gates.
* **[InferenceX](https://github.com/lilaclilac09/InferenceX)**: Continuous inference benchmark research fork covering GB200/GB300 and open model stacks.

---

### Research & Builds
* **KeyShield (Solana Mini Hack SG #5)**: Zero-knowledge credential isolation proxy for autonomous agents. Built with a Rust reverse proxy, AES-256-GCM, and a 50–80ms hot path to secure session-scoped credentials.
* **Solana MEV Contagion**: Multi-pool shock propagation modeling and prop AMM risk mechanics.
* **Semiconductor Supply Chain**: Mapping the physical and economic dependencies of AI silicon — focusing on Co-Packaged Optics (CPO) and NVIDIA GB200/GB300 packaging bottlenecks.

### Process & Precision
* **Spec-Driven AI Co-authoring**: Treating human-written specs as the source of truth; leveraging AI to generate structural scaffolding, while leaving zero room for LLM drift or hallucination.
* **Compiler-Guarded Safety**: Using Rust's strict type-system (Type-State pattern, lifetime constraints) as a compile-time firewall. AI writes the code, the borrow checker verifies the logic.
* **Deterministic Hot Paths**: Strict latency budgeting (50-80ms target in KeyShield), zero-allocation design, and aggressive profiling to keep runtime overhead at absolute zero.

### Stack
* Rust, TypeScript, Python
* Solana VM, ZK, MEV Simulation

---

[aileena.xyz](https://aileena.xyz) • [@lilaclilac09](https://github.com/lilaclilac09)
