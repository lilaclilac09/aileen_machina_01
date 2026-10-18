---
id: auto-unknown-ask
version: 3
kind: site-agent
parent: 2
triggers:
  - "unknown-ask"
  - "sentence"
  - "aileen"
  - "write"
  - "about"
  - "name"
  - "project"
  - "hers"
  - "line"
  - "solana"
  - "work"
must_include:
  - "don't see"
must_not:
  - "@gmail.com"
  - "$400k"
  - "i am aileen"
reply_guidance: "If it is not in the site context, say you don't see it. Do not invent. Leave a note if they need her."
root_cause: "held-out ask-one-line-on-her-solana-work failed: includes_any:don't see|leave a note (upgrade v3)"
---

# Skill auto-unknown-ask

## trigger
In one sentence, what does Aileen write about?

## root_cause
includes_any:don't see|leave a note

## rule
Follow reply_guidance. Never invent private facts.
