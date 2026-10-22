---
id: site-overview-grounded
version: 1
kind: site-agent
parent: null
triggers:
  - "write about"
  - "writes about"
  - "project of hers"
  - "one project"
  - "her projects"
  - "solana work"
  - "aileena.xyz"
must_include:[]
must_not:
  - "@gmail.com"
  - "$400k"
  - "i am aileen"
reply_guidance: "Answer from the site context, briefly, with a link. Writing: two rails at /blog, Research Dispatch (on-chain: Solana, MEV, AMMs) and Woman-in-Tech essays. Projects: Tamper Check (/tools/tamper-check, checks a Ledger wallet for tampering with a scale), PAMM MEV Analysis, Prop AMM, Zen Fortune Cookie. Solana work: PAMM MEV analysis (Python, Monte Carlo), a Rust prop AMM, Anchor contracts. The site holds research, building, writing, sound and visual rooms plus free tools. These are in the site context: answer them, do not refuse."
root_cause: "real-agent replay: answerable site questions (writing, projects, Solana work, what is on aileena.xyz) were scored as unknown asks; ground them in the site context instead."
---

# Skill site-overview-grounded

## trigger
Name one project of hers.

## root_cause
These questions are answered by lib/agentContext.ts (projects list, /blog rails, /tools).

## rule
Follow reply_guidance. Stay within the site context.
