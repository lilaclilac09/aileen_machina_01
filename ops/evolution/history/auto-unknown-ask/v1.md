---
id: auto-unknown-ask
version: 1
kind: site-agent
parent: null
triggers:
  - "unknown-ask"
  - "hellosdosacjkshc"
must_include:
  - "don't see"
must_not:
  - "@gmail.com"
  - "$400k"
  - "i am aileen"
reply_guidance: "If it is not in the site context, say you don't see it. Do not invent. Leave a note if they need her."
root_cause: "held-out ask-hellosdosacjkshc failed: includes_any:don't see|leave a note"
---

# Skill auto-unknown-ask

## trigger
hellosdosacjkshc\

## root_cause
includes_any:don't see|leave a note

## rule
Follow reply_guidance. Never invent private facts.
